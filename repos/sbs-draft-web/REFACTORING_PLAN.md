# Draft Frontend Refactoring Plan: WebSocket to Firebase Realtime Database

## Table of Contents
1. [Overview](#overview)
2. [Current Architecture](#current-architecture)
3. [Target Architecture](#target-architecture)
4. [Implementation Plan](#implementation-plan)
5. [Code Changes](#code-changes)
6. [Migration Checklist](#migration-checklist)
7. [Testing Guidelines](#testing-guidelines)
8. [Rollback Plan](#rollback-plan)

---

## Overview

### Purpose
Refactor the draft frontend from WebSocket-based real-time updates to Firebase Realtime Database listeners. This eliminates the need for a separate WebSocket server and leverages Firebase's built-in real-time capabilities.

### Benefits
- **Real-time Updates**: Firebase listeners provide instant updates when data changes
- **No Polling Overhead**: Only receives updates when data actually changes
- **Automatic Reconnection**: Firebase SDK handles connection management
- **Lower Latency**: Direct connection to Firebase, no HTTP round-trips
- **Cost Efficient**: Firebase Realtime Database charges per read, listeners are efficient
- **Simpler Architecture**: One less service to maintain (WebSocket server)

### Key Changes
1. Replace WebSocket connection with Firebase Realtime Database listener
2. Replace WebSocket message sending with HTTP POST requests
3. Use `RealTimeDraftInfo` from Firebase for all real-time state
4. Update timer to use `PickEndTime` and `PickLength` from Firebase

---

## Current Architecture

### WebSocket Flow
```
Frontend → WebSocket Connection → Backend WebSocket Server
    ↓                                    ↓
Redux Actions                    Real-time Updates
    ↓                                    ↓
UI Updates ← WebSocket Messages ← Backend Events
```

### Current Components Using WebSocket
- **PlayerComponent**: Connects to WebSocket on mount, handles reconnection
- **DraftItemComponent**: Sends picks via `socket/send`
- **QueueItemComponent**: Sends queue updates via `socket/send`
- **wsMiddleware**: Redux middleware handling all WebSocket logic

### WebSocket Message Types
**Received:**
- `countdown_update`: Pre-draft countdown timer
- `timer_update`: Turn timer updates
- `new_pick`: New player drafted
- `draft_info_update`: Draft state changes
- `final_card`: Draft completion with card
- `draft_complete`: Draft finished

**Sent:**
- `pick_received`: When drafting a player
- `queue_update`: When updating queue (legacy, now uses HTTP)

---

## Target Architecture

### Firebase Realtime Database Flow
```
Frontend → Firebase Realtime Database Listener
    ↓                    ↓
Redux Actions    Real-time Updates (onValue)
    ↓                    ↓
UI Updates ← Firebase Data Changes
```

### HTTP API Flow
```
Frontend → HTTP POST → Backend API
    ↓                      ↓
Pick Submission    Process Pick
    ↓                      ↓
Success Response ← Update Firebase RTDB
```

### Data Structure
Firebase path: `drafts/{draftId}/realTimeDraftInfo`

```typescript
{
  currentDrafter: string
  pickNumber: number
  roundNum: number
  pickInRound: number
  pickEndTime: number        // Unix timestamp in seconds
  pickLength: number         // Duration in seconds
  lastPick: PlayerStateInfo | null
  isDraftComplete: boolean
  isDraftClosed: boolean
}
```

---

## Implementation Plan

### Phase 1: Create Firebase Realtime Database Hook

**File**: `hooks/useRealTimeDraftInfo.ts` (NEW)

**Purpose**: Listen to Firebase Realtime Database changes for `RealTimeDraftInfo`

**Key Features**:
- Uses Firebase `onValue` listener
- Automatically updates Redux state on changes
- Handles cleanup on unmount
- Detects new picks by comparing `pickNumber`
- Updates timer timestamps from `pickEndTime` and `pickLength`

**Dependencies**:
- `firebase/database`: `ref`, `onValue`, `off`
- `utils/db`: Firebase database instance
- Redux hooks and actions

---

### Phase 2: Update API Utilities

**File**: `utils/api.ts`

**Changes**:
- Add `Draft.submitPick()` method
- Uses existing HTTP endpoint: `POST /draft-actions/{draftId}/owner/{walletAddress}/actions/pick`
- Returns promise with response or error

**Request Payload**:
```typescript
{
  playerId: string
  displayName: string
  team: string
  position: string
}
```

---

### Phase 3: Update Components

#### 3.1 PlayerComponent
**File**: `app/components/PlayerComponent.tsx`

**Remove**:
- WebSocket connection logic (lines 79-98)
- WebSocket reconnection logic (lines 92-98)
- WebSocket disconnect cleanup
- All `socket/connect`, `socket/disconnect` dispatches

**Add**:
- Import `useRealTimeDraftInfo` hook
- Call hook with `leagueId` and `isDraftActive`
- Replace all `socket/send` with `Draft.submitPick()` in auto-pick logic

#### 3.2 DraftItemComponent
**File**: `app/components/DraftItemComponent.tsx`

**Changes**:
- Replace `draftPlayer()` function to use `Draft.submitPick()`
- **Keep** `endOfTurnTimestamp` validation (prevents unnecessary API calls and provides immediate feedback)
- Remove `socket/send` dispatch

**Note**: Keep the client-side validation that checks if there's more than 500ms remaining before the turn ends. This provides better UX by preventing API calls that would be rejected, and gives immediate feedback to users. The backend validation is the source of truth, but client-side validation improves the user experience.

#### 3.3 QueueItemComponent
**File**: `app/components/QueueItemComponent.tsx`

**Changes**:
- Same as DraftItemComponent
- **Keep** `endOfTurnTimestamp` validation (same reason as above)
- Replace `socket/send` with `Draft.submitPick()`

#### 3.4 TimerComponent
**File**: `app/components/TimerComponent.tsx`

**Changes**:
- Use `endOfTurnTimestamp` from Redux (set by Firebase listener)
- Calculate `timeRemaining` from `pickEndTime` - current time
- Update every 100ms for smooth display

---

### Phase 4: Remove WebSocket Infrastructure

#### 4.1 Redux Store
**File**: `redux/store.ts`

**Remove**:
- `Socket` import
- `socketMiddleware` import
- `socket` instance creation
- `middleware: [socketMiddleware(socket)]`

#### 4.2 WebSocket Files
**Delete/Archive**:
- `redux/middleware/wsMiddleware.ts`
- `utils/webSocket.ts`

---

### Phase 5: Add Type Definitions

**File**: `utils/types/types.ts`

**Add**:
```typescript
export type RealTimeDraftInfo = {
    currentDrafter: string
    pickNumber: number
    roundNum: number
    pickInRound: number
    pickEndTime: number        // Unix timestamp in seconds
    pickLength: number         // Duration in seconds
    lastPick: PlayerStateInfo | null
    isDraftComplete: boolean
    isDraftClosed: boolean
}
```

---

### Phase 6: Optional - Server Time Sync

**Purpose**: Sync client time with server for accurate timer calculations

**Backend Endpoint** (Future):
```
GET /time
Response: { serverTime: number } // Unix timestamp in seconds
```

**Frontend Hook** (Optional):
- `hooks/useServerTimeSync.ts`
- Syncs server time periodically (every 5 minutes)
- Calculates offset: `clientTime - serverTime`
- Store offset in Redux for timer calculations

**Note**: This is optional since Firebase timestamps are server-side. Only needed if you want client-side timer calculations to match server time exactly.

---

## Code Changes

### 1. New Hook: useRealTimeDraftInfo

```typescript
import { useEffect, useRef } from 'react'
import { ref, onValue, off, DataSnapshot } from 'firebase/database'
import { db } from '@/utils/db'
import { useAppDispatch } from '@/redux/hooks/reduxHooks'
import {
    setCurrentDrafter,
    setCurrentRound,
    setPickNumber,
    setMostRecentPlayerDrafted,
    setLeagueStatus,
    setEndOfTurnTimestamp,
    setStartOfTurnTimestamp,
} from '@/redux/leagueSlice'
import { RealTimeDraftInfo, PlayerStateInfo } from '@/utils/types/types'

export const useRealTimeDraftInfo = (leagueId: string | null, isActive: boolean) => {
    const dispatch = useAppDispatch()
    const lastPickNumberRef = useRef<number | null>(null)
    const listenerRef = useRef<(() => void) | null>(null)

    useEffect(() => {
        if (!leagueId || !isActive) {
            if (listenerRef.current) {
                listenerRef.current()
                listenerRef.current = null
            }
            return
        }

        const realTimeInfoRef = ref(db, `drafts/${leagueId}/realTimeDraftInfo`)

        const unsubscribe = onValue(realTimeInfoRef, (snapshot: DataSnapshot) => {
            const realTimeInfo: RealTimeDraftInfo | null = snapshot.val()

            if (!realTimeInfo) {
                console.warn('RealTimeDraftInfo is null')
                return
            }

            // Update draft state
            dispatch(setCurrentDrafter(realTimeInfo.currentDrafter))
            dispatch(setPickNumber(realTimeInfo.pickNumber))
            dispatch(setCurrentRound(realTimeInfo.roundNum))

            // Set timer timestamps
            dispatch(setEndOfTurnTimestamp(realTimeInfo.pickEndTime))
            dispatch(setStartOfTurnTimestamp(realTimeInfo.pickEndTime - realTimeInfo.pickLength))

            // Check for new pick
            if (realTimeInfo.pickNumber > 1 && realTimeInfo.lastPick) {
                const currentPickNum = realTimeInfo.pickNumber
                
                if (lastPickNumberRef.current === null || currentPickNum > lastPickNumberRef.current) {
                    const lastPick: PlayerStateInfo = realTimeInfo.lastPick
                    dispatch(setMostRecentPlayerDrafted({
                        playerId: lastPick.playerId,
                        displayName: lastPick.displayName,
                        team: lastPick.team,
                        position: lastPick.position,
                        ownerAddress: lastPick.ownerAddress,
                        pickNum: lastPick.pickNum,
                        round: lastPick.round,
                    }))
                    lastPickNumberRef.current = currentPickNum
                }
            } else {
                lastPickNumberRef.current = realTimeInfo.pickNumber
            }

            // Check draft completion
            if (realTimeInfo.isDraftComplete) {
                dispatch(setLeagueStatus("completed"))
            } else {
                dispatch(setLeagueStatus("ongoing"))
            }
        }, (error) => {
            console.error('Error listening to real-time draft info:', error)
        })

        listenerRef.current = () => {
            off(realTimeInfoRef, 'value', unsubscribe)
        }

        return () => {
            if (listenerRef.current) {
                listenerRef.current()
                listenerRef.current = null
            }
        }
    }, [leagueId, isActive, dispatch])
}
```

### 2. API Method: submitPick

```typescript
// In utils/api.ts, add to Draft object:

submitPick: async (draftId: string, walletAddress: string, payload: {
    playerId: string
    displayName: string
    team: string
    position: string
}) => {
    try {
        const response: AxiosResponse = await api.post(
            `/draft-actions/${draftId}/owner/${walletAddress}/actions/pick`,
            payload
        )
        return response.data
    } catch (error) {
        console.error(error)
        throw error
    }
}
```

### 3. Component Update: PlayerComponent

```typescript
// Remove WebSocket connection:
// DELETE: dispatch({ type: "socket/connect", payload: { walletAddress, leagueName } })
// DELETE: dispatch({ type: "socket/disconnect" })

// Add Firebase listener:
import { useRealTimeDraftInfo } from '@/hooks/useRealTimeDraftInfo'

const leagueStatus = useAppSelector((state) => state.league.leagueStatus)
const isDraftActive = leagueStatus === "ongoing" || leagueStatus === null

useRealTimeDraftInfo(leagueId, isDraftActive)

// Replace socket/send in auto-pick:
// OLD: dispatch({ type: "socket/send", payload })
// NEW: await Draft.submitPick(leagueId!, walletAddress!, { playerId, displayName, team, position })
```

### 4. Component Update: DraftItemComponent

```typescript
// Replace draftPlayer function (KEEP client-side validation):
const draftPlayer = async () => {
    if (!canDraft) return
    setIsDrafting(true)
    
    // Client-side validation: prevent API call if time has expired
    // This provides immediate feedback and prevents unnecessary requests
    if (endOfTurnTimestamp && ((endOfTurnTimestamp * 1000) - Date.now() > 500)) {
        try {
            await Draft.submitPick(
                leagueId!,
                walletAddress!,
                {
                    playerId: item.playerStateInfo.playerId,
                    displayName: item.playerStateInfo.displayName,
                    team: item.playerStateInfo.team,
                    position: item.playerStateInfo.position,
                }
            )
            setIsDrafting(false)
        } catch (error) {
            console.error("Error submitting pick:", error)
            setIsDrafting(false)
        }
    } else {
        console.log("missed pick - time expired")
        setIsDrafting(false)
    }
}
```

### 5. Redux Store Update

```typescript
// Remove WebSocket middleware:
import { configureStore } from "@reduxjs/toolkit"
import { authSlice } from "./authSlice"
// DELETE: import { Socket } from "../utils/webSocket"
import { leagueSlice } from "./leagueSlice"
import { draftSlice } from "./draftSlice"
import { manageSlice } from "./manageSlice"
// DELETE: import { socketMiddleware } from "./middleware/wsMiddleware"
import { mintSlice } from "./mintSlice"

// DELETE: const socket = new Socket()

export const store = configureStore({
    reducer: {
        auth: authSlice.reducer,
        league: leagueSlice.reducer,
        draft: draftSlice.reducer,
        manage: manageSlice.reducer,
        mint: mintSlice.reducer,
    },
    // DELETE: middleware: [socketMiddleware(socket)]
})
```

---

## Migration Checklist

### Phase 1: Setup
- [ ] Create `hooks/useRealTimeDraftInfo.ts`
- [ ] Add `RealTimeDraftInfo` type to `utils/types/types.ts`
- [ ] Test Firebase connection and listener setup

### Phase 2: API Updates
- [ ] Add `Draft.submitPick()` to `utils/api.ts`
- [ ] Test HTTP pick submission endpoint
- [ ] Verify error handling

### Phase 3: Component Updates
- [ ] Update `PlayerComponent`:
  - [ ] Remove WebSocket connection logic
  - [ ] Add `useRealTimeDraftInfo` hook
  - [ ] Replace auto-pick `socket/send` with `Draft.submitPick()`
- [ ] Update `DraftItemComponent`:
  - [ ] Replace `draftPlayer()` function
  - [ ] Remove `socket/send` dispatch
- [ ] Update `QueueItemComponent`:
  - [ ] Replace `draftPlayer()` function
  - [ ] Remove `socket/send` dispatch
- [ ] Update `TimerComponent`:
  - [ ] Use `endOfTurnTimestamp` from Redux
  - [ ] Calculate from `pickEndTime`

### Phase 4: Cleanup
- [ ] Remove WebSocket middleware from Redux store
- [ ] Delete/archive `redux/middleware/wsMiddleware.ts`
- [ ] Delete/archive `utils/webSocket.ts`
- [ ] Remove unused imports

### Phase 5: Testing
- [ ] Test Firebase listener connection
- [ ] Test real-time updates when picks are made
- [ ] Test timer accuracy
- [ ] Test player drafting via HTTP API
- [ ] Test auto-pick functionality
- [ ] Test queue management
- [ ] Test draft completion flow
- [ ] Test error handling and reconnection
- [ ] Test with multiple users simultaneously
- [ ] Test page visibility changes (tab switching)

### Phase 6: Documentation
- [ ] Update README if needed
- [ ] Document new Firebase listener pattern
- [ ] Update any API documentation

---

## Testing Guidelines

### Unit Tests
1. **useRealTimeDraftInfo Hook**
   - Test listener setup and cleanup
   - Test Redux state updates
   - Test new pick detection
   - Test draft completion detection

2. **API Methods**
   - Test `submitPick` success case
   - Test `submitPick` error handling
   - Test request payload formatting

### Integration Tests
1. **Full Draft Flow**
   - Connect to draft
   - Make a pick
   - Verify Firebase listener receives update
   - Verify UI updates correctly
   - Verify timer updates

2. **Multi-User Scenario**
   - Multiple users in same draft
   - Verify all users receive updates
   - Verify no race conditions

3. **Error Scenarios**
   - Network disconnection
   - Firebase connection loss
   - Invalid pick submission
   - Draft completion edge cases

### Manual Testing Checklist
- [ ] Draft connection works on page load
- [ ] Timer displays correctly and counts down
- [ ] Picking a player updates UI immediately
- [ ] Other users' picks appear in real-time
- [ ] Auto-pick works when timer expires
- [ ] Queue management works correctly
- [ ] Draft completion shows correct state
- [ ] Page refresh maintains draft state
- [ ] Tab switching doesn't break connection
- [ ] Network reconnection works automatically

---

## Rollback Plan

If issues arise during migration:

### Quick Rollback Steps
1. **Revert Redux Store**
   - Restore `socketMiddleware` import
   - Restore `Socket` instance
   - Restore middleware array

2. **Revert Components**
   - Restore WebSocket connection logic in `PlayerComponent`
   - Restore `socket/send` dispatches
   - Remove `useRealTimeDraftInfo` hook

3. **Restore WebSocket Files**
   - Unarchive `redux/middleware/wsMiddleware.ts`
   - Unarchive `utils/webSocket.ts`

### Partial Rollback
If Firebase listener works but HTTP pick submission has issues:
- Keep Firebase listener for real-time updates
- Temporarily restore WebSocket for pick submission
- Fix HTTP endpoint issues
- Complete migration once fixed

---

## Future Enhancements

### Server Time Sync (Optional)
- Add `GET /time` endpoint to backend
- Create `useServerTimeSync` hook
- Sync client time periodically
- Use offset for more accurate timer calculations

### Performance Optimizations
- Implement connection pooling if needed
- Add request debouncing for rapid picks
- Optimize Redux selectors
- Consider React.memo for expensive components

### Error Handling Improvements
- Add retry logic for failed pick submissions
- Implement exponential backoff
- Show user-friendly error messages
- Add error logging/monitoring

---

## Notes

### Firebase Realtime Database Path
The listener watches: `drafts/{draftId}/realTimeDraftInfo`

This path is updated by the backend whenever:
- A pick is made
- Draft state changes
- Draft completes

### Timer Calculation
Timer uses `pickEndTime` (Unix timestamp in seconds) from Firebase:
```typescript
const timeRemaining = pickEndTime - (Date.now() / 1000)
```

### New Pick Detection
When `pickNumber > 1`, the `lastPick` field contains the most recent pick. Compare `pickNumber` to detect new picks.

### Draft Completion
When `isDraftComplete === true`, the draft is finished. The listener should stop or handle completion state.

---

## Questions or Issues?

If you encounter issues during implementation:

1. **Firebase Connection Issues**
   - Check Firebase config in `utils/db.ts`
   - Verify database URL is correct
   - Check Firebase rules allow read access

2. **Listener Not Updating**
   - Verify Firebase path is correct
   - Check browser console for errors
   - Verify backend is updating the path

3. **Pick Submission Failing**
   - Check HTTP endpoint URL
   - Verify request payload format
   - Check backend logs for errors

4. **Timer Not Accurate**
   - Verify `pickEndTime` is in seconds (not milliseconds)
   - Check for timezone issues
   - Consider implementing server time sync

---

## Version History

- **v1.0** (Initial): WebSocket to Firebase Realtime Database migration plan
- Update this section as you make changes to the plan

