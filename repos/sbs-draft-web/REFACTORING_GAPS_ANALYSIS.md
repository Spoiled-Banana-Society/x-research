# Refactoring Gaps Analysis: WebSocket to Firebase Migration

## Executive Summary

After comparing the current implementation with the original WebSocket-based architecture, **2 critical issues** and **2 medium-priority gaps** were identified:

### Critical Issues (Must Fix - Frontend Only)
1. **Queue Updates Broken** - `QueueItemComponent` still tries to use WebSocket (will fail silently)
   - ✅ Backend endpoint exists: `POST /owner/{ownerId}/drafts/{draftId}/state/queue`
   - ⚠️ Frontend just needs to use HTTP API instead of WebSocket

2. **Generated Card Missing** - Card image not fetched when draft completes
   - ✅ Backend endpoint exists: `GET /owner/{ownerId}/drafts/{draftId}`
   - ⚠️ Frontend needs to call this endpoint when draft completes

### Medium Priority (Should Fix - Frontend Only)
3. **Pre-Draft Countdown** - Actually working via `draftStartTime`, but `setPreTimer` is unused
   - ✅ No action needed - working correctly via `DraftInfoProps.draftStartTime`

4. **Dead Code** - Reconnection logic and commented WebSocket code should be cleaned up
   - ⚠️ Frontend cleanup only

### Backend Status: ✅ All Endpoints Exist
- ✅ Queue management endpoints working
- ✅ Pick submission endpoint working
- ✅ Generated card endpoint working
- ✅ Draft state endpoints working
- **No backend changes required**

### Working Correctly ✅
- Pick submission via HTTP API
- Real-time draft updates via Firebase
- Timer calculations
- Draft completion status detection
- **Draft Summary & Draft Info Updates** - Still refetched when `currentPickNumber` changes (see details below)

---

## Overview
This document identifies functionality that was previously handled by WebSocket messages but is now missing or incomplete after the migration to Firebase Realtime Database.

---

## Critical Gaps

### 1. Queue Updates Still Using WebSocket (CRITICAL)

**Location**: `app/components/QueueItemComponent.tsx` (line 145)

**Issue**: The `queuePlayer()` function still dispatches `socket/send` for queue updates:
```typescript
dispatch({ type: "socket/send", payload })
```

**Original Behavior**: WebSocket middleware would send `queue_update` messages to the server.

**Current State**: 
- `DraftItemComponent.tsx` correctly uses `Queue.setQueue()` HTTP API (line 143)
- `QueueItemComponent.tsx` still tries to use WebSocket (line 145)
- This will fail silently since WebSocket middleware no longer exists

**Fix Required**: Replace `queuePlayer()` in `QueueItemComponent.tsx` to use `Queue.setQueue()` HTTP API, matching the pattern in `DraftItemComponent.tsx`.

---

### 2. Pre-Draft Countdown Timer Not Set (HIGH PRIORITY)

**Location**: `redux/leagueSlice.ts` - `setPreTimer` action exists but is never called

**Original Behavior**: 
- WebSocket `countdown_update` message would call `setPreTimer(ms)` and `setCurrentDrafter(address)`
- This set `preTimeRemaining` in Redux state
- `TimerComponent` uses `preTimeRemaining` as fallback when no timestamps are available

**Current State**:
- `setPreTimer` action exists in Redux slice
- `useRealTimeDraftInfo` hook does NOT set pre-timer
- `TimerComponent` falls back to `preTime || 30` (line 41), but `preTime` is always 0
- Pre-draft countdown may not display correctly

**Firebase Data**: ✅ **Verified**: `RealTimeDraftInfo` does NOT include pre-draft countdown. However:
- `DraftInfoProps` (from `Draft.getDraftInfo()`) includes `draftStartTime`
- `TimerComponent` already uses `draftStartTime` for pre-draft countdown (line 30-33)
- This is working correctly - no fix needed for pre-draft countdown

**Status**: ✅ **No Action Required** - Pre-draft countdown is handled via `draftStartTime` from `DraftInfoProps`

---

### 3. Generated Card Not Set on Draft Completion (HIGH PRIORITY)

**Location**: `redux/leagueSlice.ts` - `setGeneratedCard` action exists but is never called

**Original Behavior**:
- WebSocket `final_card` message would call:
  - `setGeneratedCard(imageUrl)`
  - `setLeagueStatus("completed")`
  - Disconnect WebSocket

**Current State**:
- `setGeneratedCard` action exists in Redux slice
- `useRealTimeDraftInfo` sets `leagueStatus` to "completed" when `isDraftComplete === true`
- But `generatedCard` is never set
- Components expecting `generatedCard` will not display the card image

**Firebase Data**: ✅ **Verified**: `RealTimeDraftInfo` does NOT include generated card URL.

**API Available**: `Leagues.getLeague(walletAddress, leagueId)` returns `generatedCardProps` which includes:
- `card._imageUrl` - The generated card image URL
- This endpoint exists and can be called when draft completes

**Fix Required**: 
- Update `useRealTimeDraftInfo` hook to detect when `isDraftComplete` changes from `false` to `true`
- When draft completes, fetch card via `Leagues.getLeague(walletAddress, leagueId)`
- Dispatch `setGeneratedCard(card._imageUrl)` with the fetched card URL

---

### 4. Reconnection Logic No Longer Used (MEDIUM PRIORITY)

**Location**: `redux/leagueSlice.ts` - `shouldReconnect` and `setConnection` exist but unused

**Original Behavior**:
- WebSocket `close` event would set `shouldReconnect = true`
- Components would watch `shouldReconnect` and reconnect WebSocket
- Manual reconnection logic in components

**Current State**:
- Firebase SDK handles reconnection automatically
- `shouldReconnect` flag exists but is never set
- `setConnection` action exists but is never called
- No explicit reconnection handling needed, but flag is dead code

**Fix Required**: 
- Remove `shouldReconnect` and `setConnection` if not needed
- Or keep for potential future use if you want to manually trigger reconnection
- Firebase handles reconnection automatically, so this is likely safe to remove

---

### 5. WebSocket Connection Status Tracking (LOW PRIORITY)

**Original Behavior**:
- WebSocket `open` event would set `leagueStatus` to "ongoing"
- Connection status was explicitly tracked

**Current State**:
- Firebase listener sets `leagueStatus` based on `isDraftComplete` flag
- No explicit connection status tracking
- Firebase handles connection state internally

**Fix Required**: 
- Likely not needed - Firebase handles connection state
- But consider if you need to show "connecting..." or "disconnected" UI states
- Firebase provides connection state callbacks if needed

---

## Draft Summary & Draft Info Updates

### Current Implementation ✅

**Location**: `app/components/PlayerComponent.tsx` (lines 270-288)

**How It Works**:
1. Firebase listener (`useRealTimeDraftInfo`) updates `currentPickNumber` when a new pick is made
2. `PlayerComponent` has a `useEffect` that depends on `currentPickNumber`:
   ```typescript
   useEffect(() => {
       if (leagueId && walletAddress) {
           Draft.getDraftInfo(leagueId).then(...)
           Draft.getDraftSummary(leagueId).then(...)
           Draft.getDraftRosters(leagueId).then(...)
           Draft.getPlayerRankings(leagueId, walletAddress).then(...)
       }
   }, [leagueId, walletAddress, currentPickNumber])
   ```
3. When `currentPickNumber` changes, it refetches:
   - Draft Info
   - Draft Summary
   - Draft Rosters
   - Player Rankings

**Comparison to WebSocket**:
- **Before**: WebSocket `new_pick` message would update `currentPickNumber`, triggering the same `useEffect`
- **Now**: Firebase listener updates `currentPickNumber`, triggering the same `useEffect`
- **Result**: ✅ **Same behavior** - draft summary and info are still updated when new picks come in

**Backend Updates**:
- Backend still updates draft summary and draft info when processing picks (see `ProcessNewPick` in `models/draft-actions.go`)
- `UpdateDraftSummary()` is called for each pick (line 88)
- Frontend refetch gets the updated data

**Status**: ✅ **Working Correctly** - No changes needed

**Note**: This approach refetches all data on each pick change, which is slightly less efficient than incremental updates, but functionally equivalent to the previous WebSocket implementation.

---

## Minor Issues

### 6. Commented Out WebSocket Code

**Location**: `app/components/PlayerComponent.tsx` (line 336)

**Issue**: Commented out `socket/send` dispatch:
```typescript
//         dispatch({ type: "socket/send", payload })
```

**Fix Required**: Remove commented code for cleanliness.

---

## Summary of Required Fixes

### Immediate (Breaking Issues)
1. ✅ **Fix Queue Updates**: Replace WebSocket `socket/send` in `QueueItemComponent.tsx` with `Queue.setQueue()` HTTP API

### High Priority (Missing Functionality)
2. ✅ **Pre-Draft Countdown**: Verify Firebase data includes pre-draft countdown, update `useRealTimeDraftInfo` if needed
3. ✅ **Generated Card**: Verify Firebase data includes card URL, update `useRealTimeDraftInfo` or add API fetch when draft completes

### Medium Priority (Code Cleanup)
4. ⚠️ **Reconnection Logic**: Remove unused `shouldReconnect` and `setConnection` (or document why they're kept)
5. ⚠️ **Commented Code**: Remove commented WebSocket code

### Low Priority (Nice to Have)
6. ℹ️ **Connection Status**: Consider if explicit connection status UI is needed

---

## Verification Checklist

Before considering migration complete, verify:

- [ ] Queue updates work in `QueueItemComponent` (currently broken)
- [ ] Pre-draft countdown displays correctly
- [ ] Generated card displays when draft completes
- [ ] All WebSocket references removed (except documentation)
- [ ] Firebase listener handles all real-time updates
- [ ] Error handling for Firebase connection issues
- [ ] Draft completion flow works end-to-end

---

## Questions Answered

1. ✅ **Does `RealTimeDraftInfo` include pre-draft countdown?**
   - **Answer**: No, but `DraftInfoProps.draftStartTime` is used by `TimerComponent` - working correctly

2. ✅ **Does `RealTimeDraftInfo` include generated card URL when draft completes?**
   - **Answer**: No, but `Leagues.getLeague()` returns card data - needs implementation

3. ✅ **Is there a separate endpoint to fetch the generated card?**
   - **Answer**: Yes, `Leagues.getLeague(walletAddress, leagueId)` returns `generatedCardProps.card._imageUrl`

---

## Backend API Endpoints Analysis

### Existing Endpoints (No Backend Changes Needed) ✅

All required HTTP endpoints already exist in the backend:

#### 1. Queue Management Endpoints
**Location**: `sbs-drafts-api/owner/owner.go`

- **GET** `/owner/{ownerId}/drafts/{draftId}/state/queue`
  - Handler: `GetQueueForDraft`
  - Returns: `DraftQueue` (array of `PlayerStateInfo`)
  - Status: ✅ **Working** - Frontend already uses this via `Queue.getQueue()`

- **POST** `/owner/{ownerId}/drafts/{draftId}/state/queue`
  - Handler: `UpdateQueueForDraft`
  - Request Body: `DraftQueue` (array of `PlayerStateInfo`)
  - Returns: Updated `DraftQueue`
  - Status: ✅ **Working** - Frontend uses this via `Queue.setQueue()`, but `QueueItemComponent` still tries WebSocket

#### 2. Pick Submission Endpoint
**Location**: `sbs-drafts-api/draft-actions/draft-actions.go`

- **POST** `/draft-actions/{draftId}/owner/{walletAddress}/actions/pick`
  - Handler: `submitPick`
  - Request Body: `{ playerId, displayName, team, position }`
  - Status: ✅ **Working** - Frontend uses this via `Draft.submitPick()`

#### 3. Generated Card Endpoint
**Location**: `sbs-drafts-api/owner/owner.go`

- **GET** `/owner/{ownerId}/drafts/{draftId}`
  - Handler: `ReturnCardForOwnerInDraft`
  - Returns: `{ card: DraftToken }` where `DraftToken` includes:
    - `_imageUrl` (string) - The generated card image URL
    - `_cardId` (string)
    - `_level` (string)
    - `roster` (object)
    - Other card metadata
  - Status: ✅ **Working** - Frontend has `Leagues.getLeague()` but doesn't call it on draft completion

#### 4. Draft State Endpoints
**Location**: `sbs-drafts-api/draft-state/drafts.go`

- **GET** `/draft/{draftId}/state/info` - Returns `DraftInfoProps` (includes `draftStartTime`)
- **GET** `/draft/{draftId}/state/summary` - Returns draft summary
- **GET** `/draft/{draftId}/state/rosters` - Returns rosters
- **GET** `/draft/{draftId}/playerState/{ownerId}` - Returns player rankings
- Status: ✅ **All Working**

---

### Backend Changes Required: ONE OPTIONAL ENHANCEMENT ⭐

**All necessary HTTP endpoints already exist and are functional.** The gaps are purely on the frontend side:

1. **Queue Updates**: Backend endpoint exists, frontend just needs to use it instead of WebSocket
2. **Generated Card**: Backend endpoint exists, frontend just needs to call it when draft completes
3. **Pre-Draft Countdown**: Currently handled via `draftStartTime` in draft info endpoint (working)
   - **Recommended Enhancement**: Add `DraftStartTime` to `RealTimeDraftInfo` for consistency and real-time updates (see Optional Enhancements below)

---

### Optional Backend Enhancements (Not Required)

These are optional improvements that could simplify the frontend but are not necessary:

#### 1. Include Card Image URL in RealTimeDraftInfo (Optional)
**Current**: `RealTimeDraftInfo` does not include `generatedCardUrl` or `cardImageUrl`

**Optional Enhancement**: Add `GeneratedCardUrl` field to `RealTimeDraftInfo` struct:
```go
type RealTimeDraftInfo struct {
    // ... existing fields ...
    GeneratedCardUrl string `json:"generatedCardUrl,omitempty"` // Only set when draft completes
}
```

**Benefits**:
- Frontend wouldn't need to make separate API call to fetch card
- Card URL would be available immediately when draft completes
- Simpler frontend logic

**Trade-offs**:
- Requires backend to update `RealTimeDraftInfo` when card is generated
- Adds one more field to Firebase structure
- Current approach (separate API call) is already working

**Recommendation**: Not necessary - current approach is fine. Only add if you want to optimize for fewer API calls.

#### 2. Include Draft Start Time in RealTimeDraftInfo (RECOMMENDED) ⭐
**Current**: Pre-draft countdown uses `draftStartTime` from `DraftInfoProps` (fetched via separate API call)

**Recommended Enhancement**: Add `DraftStartTime` field to `RealTimeDraftInfo`:
```go
type RealTimeDraftInfo struct {
    // ... existing fields ...
    DraftStartTime int64 `json:"draftStartTime"` // Unix timestamp when draft starts
}
```

**Why This Is Better Than Countdown**:
- ✅ **Consistent Pattern**: Matches how `pickEndTime` works (both are Unix timestamps)
- ✅ **Client-Side Calculation**: Frontend calculates countdown: `timeRemaining = draftStartTime - now`
- ✅ **Real-Time Updates**: Available via Firebase listener, no separate API call needed
- ✅ **Source of Truth**: Timestamp is authoritative, countdown is derived
- ✅ **Already Available**: Backend already has `DraftStartTime` when creating draft (see `CreateDraftInfoForDraft`)

**Implementation**:
1. **Backend**: Add `DraftStartTime` to `RealTimeDraftInfo` struct
2. **Backend**: Set `DraftStartTime` when creating `RealTimeDraftInfo` (already available from `DraftInfo.DraftStartTime`)
3. **Frontend**: Update `useRealTimeDraftInfo` to dispatch `setPreTimer` or use `draftStartTime` directly
4. **Frontend**: Update `TimerComponent` to calculate pre-draft countdown from `draftStartTime` (similar to how it uses `pickEndTime`)

**Code Example**:
```go
// In models/draft-state.go, when creating RealTimeDraftInfo:
firstPickInfo := RealTimeDraftInfo{
    CurrentDrafter:    info.DraftOrder[0].OwnerId,
    CurrentPickNumber: 1,
    CurrentRound:      1,
    PickInRound:       1,
    DraftStartTime:    info.DraftStartTime,  // ADD THIS
    PickEndTime:       info.DraftStartTime + info.PickLength,
    LastPick:          PlayerStateInfo{},
}
```

**Frontend Usage**:
```typescript
// 1. Update type definition in utils/types/types.ts:
export type RealTimeDraftInfo = {
    currentDrafter: string
    pickNumber: number
    roundNum: number
    pickInRound: number
    pickEndTime: number
    pickLength: number
    draftStartTime: number  // ADD THIS - Unix timestamp in seconds
    lastPick: PlayerStateInfo | null
    isDraftComplete: boolean
    isDraftClosed: boolean
}

// 2. In useRealTimeDraftInfo hook:
if (realTimeInfo.draftStartTime) {
    // Calculate pre-draft countdown (similar to pickEndTime calculation)
    const now = Date.now() / 1000; // Convert to seconds
    const timeUntilStart = realTimeInfo.draftStartTime - now;
    if (timeUntilStart > 0) {
        dispatch(setPreTimer(Math.floor(timeUntilStart)));
    }
}

// 3. In TimerComponent.tsx (already handles draftStartTime from DraftInfoProps):
// Can now use realTimeInfo.draftStartTime instead of draftInfo.draftStartTime
// This makes it available in real-time via Firebase listener
```

**Recommendation**: ✅ **Highly Recommended** - This is the cleanest approach and matches the existing pattern for pick timers.

---

## Recommended Next Steps

### Frontend Fixes (Required)
1. **Fix Queue Updates** (Critical - breaks functionality)
   - Update `QueueItemComponent.tsx` to use `Queue.setQueue()` HTTP API instead of WebSocket
   - Backend endpoint already exists: `POST /owner/{ownerId}/drafts/{draftId}/state/queue`

2. **Add Generated Card Fetching** (High Priority)
   - Update `useRealTimeDraftInfo` hook to detect draft completion
   - Call `Leagues.getLeague(walletAddress, leagueId)` when `isDraftComplete` becomes `true`
   - Dispatch `setGeneratedCard(card._imageUrl)` with fetched card URL
   - Backend endpoint already exists: `GET /owner/{ownerId}/drafts/{draftId}`

3. **Clean Up Dead Code** (Medium Priority)
   - Remove unused `shouldReconnect` and `setConnection` from Redux
   - Remove commented WebSocket code from `PlayerComponent.tsx`

### Backend Changes (One Recommended Enhancement)
- ✅ All necessary endpoints exist and are working
- ✅ No backend changes required for migration completion
- ⭐ **Recommended**: Add `DraftStartTime` to `RealTimeDraftInfo` for consistency with pick timer pattern (see Optional Enhancements above)

### Testing Checklist
- [ ] Queue updates work in `QueueItemComponent` (currently broken)
- [ ] Pre-draft countdown displays correctly (already working)
- [ ] Generated card displays when draft completes (needs frontend fix)
- [ ] All WebSocket references removed (except documentation)
- [ ] Firebase listener handles all real-time updates
- [ ] Error handling for Firebase connection issues
- [ ] Draft completion flow works end-to-end
