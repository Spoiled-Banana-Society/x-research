# Codebase Audit Report: sbs-draft-web
**Date:** 2024  
**Scope:** Post-WebSocket to Firebase Migration Audit  
**Purpose:** Identify issues, design gaps, and missed refactoring items

---

## Executive Summary

This audit identified **15 issues** across multiple categories:
- **3 Critical Issues** - Will cause broken functionality
- **5 High Priority Issues** - Missing features or potential bugs
- **4 Medium Priority Issues** - Code quality and maintainability
- **3 Low Priority Issues** - Nice-to-have improvements

---

## Critical Issues (Must Fix)

### 1. Queue Not Automatically Removed After Drafting
**Location:** `app/components/QueueItemComponent.tsx`, `app/components/DraftItemComponent.tsx`

**Issue:** When a player is drafted from the queue, the queue is not automatically updated to remove that player. The backend removes the player from the queue when auto-picking, but the frontend doesn't refetch or update the queue after a manual draft.

**Impact:** Users will see drafted players still in their queue until they manually refresh or interact with the queue.

**Current Behavior:**
- User drafts a player from queue → `Draft.submitPick()` is called
- Queue state in Redux is not updated
- Player remains visible in queue UI

**Expected Behavior:**
- After successful pick submission, queue should be refetched or the drafted player should be removed from local state

**Fix Required:**
```typescript
// In QueueItemComponent.tsx and DraftItemComponent.tsx, after successful draft:
await Draft.submitPick(...)
// Add:
Queue.getQueue(walletAddress!, leagueId!).then((res) => {
    dispatch(setQueue(res))
})
```

**Related Code:**
- `QueueItemComponent.tsx:100-128` - `draftPlayer()` function
- `DraftItemComponent.tsx:103-130` - `draftPlayer()` function

---

### 2. Missing Error Handling in Queue Operations
**Location:** `app/components/QueueItemComponent.tsx`, `app/components/DraftItemComponent.tsx`, `app/components/QueueComponent.tsx`

**Issue:** Queue operations (`queuePlayer()`, `deQueuePlayer()`) catch errors but only log them. No user feedback is provided when queue updates fail.

**Impact:** Users won't know if their queue update failed, leading to confusion when queue doesn't reflect their actions.

**Current Code:**
```typescript
try {
    Queue.setQueue(walletAddress!, leagueId!, newQueue).then((res) => {
        dispatch(setQueue(res))
    })
} catch (error) {
    console.error("Error sending payload")  // Only logs, no user feedback
}
```

**Issues:**
1. `catch` block won't catch promise rejections from `.then()` - errors need `.catch()` on the promise
2. No user-facing error message
3. No retry mechanism

**Fix Required:**
```typescript
Queue.setQueue(walletAddress!, leagueId!, newQueue)
    .then((res) => {
        dispatch(setQueue(res))
    })
    .catch((error) => {
        console.error("Error updating queue:", error)
        // Show user-friendly error message
        // Optionally: retry or revert local state
    })
```

**Related Code:**
- `QueueItemComponent.tsx:131-146`, `148-164`
- `DraftItemComponent.tsx:133-149`, `151-168`
- `QueueComponent.tsx:33` (needs verification)

---

### 3. DraftComponent Queue Fetch Missing Dependencies
**Location:** `app/components/DraftComponent.tsx:27-44`

**Issue:** `useEffect` that fetches queue, rankings, and sort order has an empty dependency array `[]`, meaning it only runs once on mount. If `leagueId` or `walletAddress` changes, the data won't be refetched.

**Impact:** If user navigates between drafts or wallet address changes, queue and rankings won't update.

**Current Code:**
```typescript
useEffect(() => {
    Draft.getPlayerRankings(leagueId!, walletAddress!).then(...)
    Queue.getQueue(walletAddress!, leagueId!).then(...)
    Draft.getDraftSortOrder(leagueId!, walletAddress!).then(...)
}, [])  // ❌ Empty dependency array
```

**Fix Required:**
```typescript
useEffect(() => {
    if (!leagueId || !walletAddress) return
    // ... fetch calls
}, [leagueId, walletAddress, dispatch])  // ✅ Include dependencies
```

**Related Code:**
- `DraftComponent.tsx:27-44`

---

## High Priority Issues

### 4. Commented WebSocket Code Not Removed
**Location:** `app/components/PlayerComponent.tsx:321-341`

**Issue:** Large block of commented-out WebSocket code remains in the codebase. This is dead code that should be removed for cleanliness and to avoid confusion.

**Impact:** Code clutter, potential confusion for future developers, violates clean code principles.

**Fix Required:** Remove commented code block (lines 321-341).

---

### 5. Inconsistent Error Handling Patterns
**Location:** Multiple files in `app/components/` and `utils/api.ts`

**Issue:** Error handling is inconsistent across the codebase:
- Some API calls use `.then().catch()`
- Some use `try/catch` with promises (which doesn't work correctly)
- Some return errors, some throw, some just log
- No standardized error handling pattern

**Examples:**
- `utils/api.ts` - Most functions return `error` on catch, but some throw
- `QueueItemComponent.tsx` - Uses `try/catch` with `.then()` (won't catch promise rejections)
- `PlayerComponent.tsx` - Uses `.then()` without `.catch()` in some places

**Impact:** Unpredictable error handling, potential unhandled promise rejections, poor user experience.

**Fix Required:** Standardize error handling:
1. Use `.then().catch()` for promise chains
2. Use `try/await/catch` for async/await
3. Provide user-facing error messages
4. Consider a global error handler/toast system

---

### 6. Missing Queue Synchronization After Draft
**Location:** `app/components/PlayerComponent.tsx:136-134`

**Issue:** When a player is drafted (via auto-pick or manual), the queue should be refetched to remove the drafted player. Currently, `PlayerComponent` filters the queue based on available players, but doesn't refetch from the server.

**Current Behavior:**
```typescript
// Updates queue when availablePlayers changes, but doesn't refetch from server
useEffect(() => {
    if (availablePlayers) {
        const updatedPlayers = queuedPlayers.filter((player) =>
            availablePlayers.some((data) => data.playerStateInfo.playerId === player.playerId)
        )
        dispatch(setQueue(updatedPlayers))
    }
}, [availablePlayers])
```

**Issue:** This only filters locally. If the backend removes a player from the queue (e.g., after auto-pick), the frontend won't know until it refetches.

**Fix Required:** Refetch queue after a pick is made, or listen to queue changes via Firebase.

**Related Code:**
- `PlayerComponent.tsx:127-134`

---

### 7. Type Safety Issues with Non-Null Assertions
**Location:** Multiple components

**Issue:** Extensive use of non-null assertions (`!`) throughout the codebase, which bypasses TypeScript's null checking. This can lead to runtime errors if values are actually null.

**Examples:**
- `leagueId!`, `walletAddress!` used in many places
- No null checks before using these values

**Impact:** Potential runtime crashes if Redux state is not properly initialized.

**Fix Required:** Add proper null checks or use optional chaining:
```typescript
if (!leagueId || !walletAddress) return
// or
leagueId && walletAddress && Queue.setQueue(...)
```

**Related Code:**
- `QueueItemComponent.tsx` - Multiple `!` assertions
- `DraftItemComponent.tsx` - Multiple `!` assertions
- `PlayerComponent.tsx` - Multiple `!` assertions

---

### 8. Firebase Initialization Using Deprecated Compat Mode
**Location:** `utils/db.ts:2`

**Issue:** Firebase is initialized using `firebase/compat/app` which is the compatibility layer for older Firebase v8 syntax. The codebase should migrate to the modern Firebase v9+ modular SDK.

**Current Code:**
```typescript
import firebase from "firebase/compat/app"
import { getDatabase } from "firebase/database"
// ...
if (firebase.apps.length === 0) {
    firebase.initializeApp(firebaseConfig)
}
```

**Impact:** 
- Using deprecated API
- Larger bundle size (compat mode includes both v8 and v9 code)
- Future maintenance burden

**Fix Required:** Migrate to Firebase v9+ modular SDK:
```typescript
import { initializeApp } from 'firebase/app'
import { getDatabase } from 'firebase/database'

const app = initializeApp(firebaseConfig)
export const db = getDatabase(app)
```

---

## Medium Priority Issues

### 9. Missing Cleanup on Navigation
**Location:** `app/authenticated/draft/[id]/page.tsx`

**Issue:** No explicit cleanup of Redux state or Firebase listeners when navigating away from a draft page. While React's cleanup in `useEffect` should handle listeners, Redux state persists.

**Impact:** 
- Redux state from previous draft may persist when entering new draft
- Potential memory leaks if listeners aren't properly cleaned up
- Stale data shown in new draft

**Fix Required:** 
- Call `clearLeague()` and `clearDraft()` when component unmounts or when `leagueId` changes
- Verify Firebase listener cleanup in `useRealTimeDraftInfo`

**Related Code:**
- `app/authenticated/draft/[id]/page.tsx`
- `hooks/useRealTimeDraftInfo.ts:170-180` (cleanup exists, but verify it's called)

---

### 10. Timer Calculation Inconsistency
**Location:** `redux/leagueSlice.ts:65-87`, `app/components/TimerComponent.tsx:24-51`

**Issue:** Timer is calculated in two places:
1. Redux slice calculates `timeRemaining` when timestamps are set
2. `TimerComponent` recalculates from timestamps on every render

**Current Behavior:**
- Redux: `timeRemaining = endOfTurnTimestamp - startOfTurnTimestamp` (set once)
- TimerComponent: `timeRemaining = (endOfTurnTimestamp * 1000) - Date.now()` (recalculated)

**Impact:** 
- Redux `timeRemaining` becomes stale (not updated as time passes)
- `TimerComponent` uses its own calculation, making Redux value unused
- Potential confusion about which is the source of truth

**Fix Required:** 
- Either: Remove `timeRemaining` calculation from Redux (let TimerComponent handle it)
- Or: Use a timer in Redux to update `timeRemaining` periodically
- Document which is the source of truth

**Related Code:**
- `redux/leagueSlice.ts:65-87`
- `app/components/TimerComponent.tsx:24-51`

---

### 11. Missing Queue Fetch on Draft Start
**Location:** `app/components/DraftComponent.tsx`, `app/components/PlayerComponent.tsx`

**Issue:** Queue is only fetched once in `DraftComponent` on mount. If the draft hasn't started yet or if the user joins mid-draft, the queue might not be fetched at the right time.

**Impact:** Users might not see their queue when they first enter a draft.

**Fix Required:** 
- Fetch queue when `leagueId` is set
- Consider fetching queue when draft status changes to "ongoing"
- Add queue fetch to `PlayerComponent` as well if needed

**Related Code:**
- `DraftComponent.tsx:27-44`
- `PlayerComponent.tsx` (no queue fetch)

---

### 12. Incomplete Type Definitions
**Location:** `utils/types/types.ts`

**Issue:** Some types are incomplete or could be more specific:
- `leagueProps` type doesn't include all fields from `leagueSlice` (e.g., `shouldReconnect`, `preTimeRemaining` are mentioned in docs but not in type)
- `RealTimeDraftInfo` has `draftStartTime` but it's optional - should verify if it's always present
- Some API response types are `any` or too generic

**Impact:** Type safety is compromised, potential runtime errors.

**Fix Required:** 
- Audit all types against actual Redux state
- Make types more specific
- Remove any `any` types

**Related Code:**
- `utils/types/types.ts:279-302` - `leagueProps`
- `utils/types/types.ts:230-241` - `RealTimeDraftInfo`

---

## Low Priority Issues

### 13. Dead Code in Documentation
**Location:** `REDUX_ARCHITECTURE.md`

**Issue:** Documentation references `shouldReconnect` and `setConnection` which don't exist in the actual Redux slice. These were likely removed during refactoring but documentation wasn't updated.

**Impact:** Confusion for developers reading documentation.

**Fix Required:** Update `REDUX_ARCHITECTURE.md` to reflect actual Redux state structure.

**Related Code:**
- `REDUX_ARCHITECTURE.md:104, 150, 329, 356, 533, 559`

---

### 14. Console.log Statements in Production Code
**Location:** Multiple files

**Issue:** Many `console.log` statements throughout the codebase that should be removed or replaced with proper logging.

**Examples:**
- `redux/leagueSlice.ts:67, 70, 79, 82` - Debug logs
- `app/components/PlayerComponent.tsx:140, 164, 177, 192, 207, 222, 237, 253` - Debug logs
- `app/components/DraftComponent.tsx:132` - Debug log

**Impact:** 
- Console clutter
- Potential performance impact
- May expose internal logic

**Fix Required:** 
- Remove debug `console.log` statements
- Use a proper logging library for production
- Keep only error logging (`console.error`)

---

### 15. Missing Loading States
**Location:** Multiple components

**Issue:** Some API calls don't show loading states, leaving users unsure if an operation is in progress.

**Examples:**
- Queue operations (`queuePlayer`, `deQueuePlayer`) - no loading indicator
- Draft submission - has `isDrafting` state but might not be visible in all cases

**Impact:** Poor user experience, users might click multiple times thinking nothing is happening.

**Fix Required:** Add loading indicators for async operations.

**Related Code:**
- `QueueItemComponent.tsx` - Queue operations
- `DraftItemComponent.tsx` - Queue operations

---

## Design Gaps & Architecture Concerns

### A. No Centralized Error Handling
**Issue:** No global error handler or error boundary for API failures. Each component handles errors individually, leading to inconsistent UX.

**Recommendation:** Implement:
- Global error boundary for React errors
- Centralized API error handler
- Toast/notification system for user-facing errors

### B. No Retry Logic for Failed Requests
**Issue:** When API calls fail, there's no automatic retry mechanism. Users must manually retry.

**Recommendation:** Implement exponential backoff retry for:
- Queue operations
- Pick submissions
- Draft info fetches

### C. Firebase Listener Not Optimized
**Issue:** `useRealTimeDraftInfo` listener is set up for every draft, even if the draft is completed. The listener should be cleaned up when draft completes.

**Current Behavior:** Listener continues even after `isDraftComplete === true`

**Recommendation:** 
- Stop listener when draft completes
- Or make listener read-only for completed drafts

### D. No Offline Support
**Issue:** No handling for offline scenarios. If Firebase connection is lost, users won't know and the app might appear broken.

**Recommendation:** 
- Add Firebase connection state monitoring
- Show offline indicator
- Queue actions for when connection is restored

### E. Race Conditions in Queue Updates
**Issue:** Multiple components can update the queue simultaneously, leading to race conditions. For example:
- User adds player to queue
- Auto-pick drafts from queue
- Both operations happen simultaneously

**Recommendation:** 
- Implement optimistic updates with rollback
- Use queue versioning or timestamps
- Lock queue during draft operations

---

## Testing Gaps

### Missing Test Coverage
**Issue:** No evidence of unit tests or integration tests in the codebase.

**Recommendation:** Add tests for:
- `useRealTimeDraftInfo` hook
- Queue operations
- Draft submission
- Timer calculations
- Error handling

---

## Summary of Required Actions

### Immediate (Critical)
1. ✅ Fix queue not being removed after drafting
2. ✅ Fix error handling in queue operations (use `.catch()` not `try/catch` with promises)
3. ✅ Fix `DraftComponent` useEffect dependencies

### High Priority (This Sprint)
4. ✅ Remove commented WebSocket code
5. ✅ Standardize error handling patterns
6. ✅ Add queue synchronization after draft
7. ✅ Add null checks instead of non-null assertions
8. ✅ Migrate Firebase to v9+ modular SDK

### Medium Priority (Next Sprint)
9. ✅ Add cleanup on navigation
10. ✅ Fix timer calculation inconsistency
11. ✅ Add queue fetch on draft start
12. ✅ Complete type definitions

### Low Priority (Backlog)
13. ✅ Update documentation
14. ✅ Remove console.log statements
15. ✅ Add loading states

### Architecture Improvements (Future)
- Centralized error handling
- Retry logic
- Optimize Firebase listeners
- Offline support
- Race condition handling
- Test coverage

---

## Notes

- Most issues are frontend-only and don't require backend changes
- The refactoring from WebSocket to Firebase was largely successful
- Main gaps are in error handling, state synchronization, and code quality
- No breaking issues that would prevent the app from functioning, but several UX and reliability issues

---

## Verification Checklist

Before considering the refactor complete, verify:
- [ ] Queue updates work correctly after drafting
- [ ] Error messages are shown to users when operations fail
- [ ] Queue is fetched when entering a draft
- [ ] All commented code is removed
- [ ] Error handling is consistent across all components
- [ ] Type safety is improved (no unnecessary `!` assertions)
- [ ] Firebase listener is cleaned up properly
- [ ] Timer displays correctly in all scenarios
- [ ] Loading states are shown for async operations
- [ ] Documentation matches actual code
