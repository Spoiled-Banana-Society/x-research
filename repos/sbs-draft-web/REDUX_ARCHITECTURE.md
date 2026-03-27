# Redux Architecture Breakdown - sbs-draft-web

This document provides a comprehensive breakdown of the Redux state management architecture, action patterns, and data flow in the sbs-draft-web frontend. This serves as a reference for refactoring to adjust to new backend formats while maintaining existing logic and connections.

## Table of Contents
1. [Store Structure](#store-structure)
2. [Redux Slices](#redux-slices)
3. [Action Patterns](#action-patterns)
4. [WebSocket Middleware](#websocket-middleware)
5. [API Integration](#api-integration)
6. [State Flow & Data Dependencies](#state-flow--data-dependencies)
7. [Component Interaction Patterns](#component-interaction-patterns)
8. [Key State Relationships](#key-state-relationships)

---

## Store Structure

The Redux store is configured in `redux/store.ts` with the following structure:

```typescript
{
  auth: authSlice.reducer,
  league: leagueSlice.reducer,
  draft: draftSlice.reducer,
  manage: manageSlice.reducer,
  mint: mintSlice.reducer,
}
```

**Middleware:**
- `socketMiddleware` - Handles WebSocket connections and real-time message routing

**Store Configuration:**
- Uses Redux Toolkit's `configureStore`
- Single WebSocket instance (`Socket`) shared across middleware
- Typed hooks available via `useAppDispatch` and `useAppSelector`

---

## Redux Slices

### 1. Auth Slice (`redux/authSlice.ts`)

**Purpose:** Manages user authentication state and wallet information.

**State Shape:**
```typescript
{
  isUserSignedIn: boolean
  walletAddress: string | null
  email: string | null
  name: string | null
  typeOfLogin: string | null  // "thirdweb" | "web3auth" | null
  profileImage: string | undefined
  tokensAvailable: number
  ethBalance: number | null
  lastGameWeek: string  // Format: "2024REG-01"
  gameWeek: WeekProps[]  // Array of all game weeks
}
```

**Actions:**
- `signInWeb3Auth(payload)` - Sets auth state for Web3Auth login
- `signIn(walletAddress)` - Sets auth state for thirdweb login
- `signOut()` - Clears all auth state
- `setEthBalance(amount)` - Updates ETH balance
- `setTokensAvailable(count)` - Updates available token count

**Key Dependencies:**
- Used by: All components that need wallet address or auth status
- Depends on: None (root-level slice)

**Initialization:**
- `gameWeek` array is generated from `weekOptions` on slice creation
- `lastGameWeek` uses current NFL week from `getNFLWeek`

---

### 2. League Slice (`redux/leagueSlice.ts`)

**Purpose:** Manages active draft/league state, turn management, queue, and real-time draft status.

**State Shape:**
```typescript
{
  leagueId: string | null
  leagueName: string | null
  leagueLevel: string  // "Pro" | "Hall of Fame" | "Jackpot"
  currentRound: number | null
  currentPickNumber: number | null
  currentDrafter: string | null  // walletAddress of current drafter
  queuedPlayers: PlayerStateInfo[]
  timeRemaining: number | null  // milliseconds
  endOfTurnTimestamp: number | null  // Unix timestamp (seconds)
  startOfTurnTimestamp: number | null  // Unix timestamp (seconds)
  mostRecentPlayerDrafted: mostRecentPlayerProps | null
  leagueStatus: string | null  // "ongoing" | "completed" | null
  autopick: boolean
  idleCount: number
  canDraft: boolean
  tokenId: string | null
  lobbyRefresh: boolean
  shouldReconnect: boolean
  selectedCard: string | null
  viewState: ViewState  // DRAFT | QUEUE | BOARD | ROSTER | CHAT | LEADERBOARD
  audioOn: boolean
  preTimeRemaining: number  // Pre-draft countdown
  generatedCard: string | null  // Image URL of generated card
}
```

**Actions:**
- **League Setup:**
  - `setLeagueId(id)` - Sets the active league ID
  - `setLeagueName(name)` - Sets league display name
  - `setLeagueLevel(level)` - Sets league tier/level
  - `setTokenId(id)` - Sets associated token ID

- **Draft State:**
  - `setPickNumber(num)` - Current pick number in draft
  - `setCurrentRound(round)` - Current round number
  - `setCurrentDrafter(address)` - Wallet address of current drafter
  - `setLeagueStatus(status)` - "ongoing" | "completed"

- **Timer Management:**
  - `setEndOfTurnTimestamp(timestamp)` - Unix timestamp when turn ends
  - `setStartOfTurnTimestamp(timestamp)` - Unix timestamp when turn starts
  - `tickTime(ms)` - Decrements time remaining
  - `setPreTimer(ms)` - Sets pre-draft countdown

- **Queue Management:**
  - `setQueue(players[])` - Replaces entire queue
  - `removeQueue(playerId)` - Removes specific player from queue

- **Draft Actions:**
  - `setMostRecentPlayerDrafted(player)` - Updates last drafted player
  - `setCanDraft(boolean)` - Enables/disables drafting
  - `setAutopick(boolean)` - Toggles autopick mode
  - `setIdleCount(count)` - Tracks idle pick attempts

- **UI State:**
  - `setViewState(state)` - Changes active view (DRAFT/QUEUE/BOARD/ROSTER)
  - `setSelectedCard(cardId)` - Selects card for viewing
  - `setAudio(on)` - Toggles audio notifications
  - `setGeneratedCard(imageUrl)` - Sets generated card image

- **Connection:**
  - `setLobbyRefresh(boolean)` - Triggers lobby refresh
  - `setConnection(boolean)` - Sets reconnection flag

- **Cleanup:**
  - `clearLeague()` - Resets all league state to initial values

**Key Dependencies:**
- **Reads from:** `auth.walletAddress` (for user identification)
- **Updates via:** WebSocket messages, API calls, user interactions
- **Used by:** All draft-related components

**Timer Logic:**
- `timeRemaining` is calculated when either `endOfTurnTimestamp` or `startOfTurnTimestamp` is set
- Formula: `timeRemaining = endOfTurnTimestamp - startOfTurnTimestamp`
- Both setters check if the other is set before calculating

---

### 3. Draft Slice (`redux/draftSlice.ts`)

**Purpose:** Manages draft data fetched from API (info, summary, rosters, rankings).

**State Shape:**
```typescript
{
  draftInfo: DraftInfoProps | null
  draftSummary: SummaryProps[] | null
  draftRosters: DraftRosterProps[] | null
  draftPlayerRankings: PlayerDataProps[] | null
  sortBy: SortState  // ADP | RANK
}
```

**Actions:**
- `setDraftInfo(info)` - Sets draft information (picks, order, timing)
- `setDraftSummary(summary[])` - Sets summary of all picks
- `setDraftRosters(rosters)` - Sets roster data by owner
- `setDraftRankings(rankings[])` - Sets player rankings for current user
- `setDraftSort(sortBy)` - Sets sort preference (ADP or RANK)
- `clearDraft()` - Clears all draft data

**Key Dependencies:**
- **Reads from:** `league.leagueId` (to fetch draft data)
- **Reads from:** `auth.walletAddress` (for user-specific rankings)
- **Updates via:** API calls to `/draft/{leagueId}/state/*` endpoints
- **Used by:** Draft board, roster views, summary displays

**Data Flow:**
1. Component dispatches API call with `leagueId`
2. API response is dispatched to slice action
3. State updated, components re-render with new data

---

### 4. Manage Slice (`redux/manageSlice.ts`)

**Purpose:** Manages state for the "manage" view (post-draft management interface).

**State Shape:**
```typescript
{
  manageState: ViewState  // LEADERBOARD (default)
  draftPlayerRankings: PlayerDataProps[] | null
  draftSummary: SummaryProps[] | null
  draftRosters: DraftRosterProps[] | null
  leagueId: string | null
  selectedCard: string | null
}
```

**Actions:**
- `setManageView(state)` - Changes manage view state
- `setManageDraftSummary(summary[])` - Sets summary for manage view
- `setManageDraftRosters(rosters)` - Sets rosters for manage view
- `setManageDraftRankings(rankings[])` - Sets rankings for manage view
- `setManageLeagueId(id)` - Sets league ID for manage view
- `setManageSelectedCard(cardId)` - Selects card in manage view
- `clearManage()` - Resets manage state (sets to DRAFT view)

**Key Dependencies:**
- **Separate from:** `draftSlice` (parallel state for manage view)
- **Used by:** Manage/leaderboard pages
- **Purpose:** Allows viewing multiple leagues without affecting active draft state

---

### 5. Mint Slice (`redux/mintSlice.ts`)

**Purpose:** Manages minting UI state (count, price).

**State Shape:**
```typescript
{
  count: number  // Default: 1
  price: number  // 0.0001 (dev) | 0.01 (prod)
}
```

**Actions:**
- `incrementCount()` - Increases mint count
- `decrementCount()` - Decreases mint count

**Key Dependencies:**
- **Used by:** Mint page only
- **Isolated:** No dependencies on other slices

---

## Action Patterns

### Standard Redux Actions

All slices use Redux Toolkit's `createSlice`, which generates action creators automatically:

```typescript
// Action creator usage
dispatch(setLeagueId("league-123"))
dispatch(setPickNumber(42))
dispatch(setQueue([player1, player2]))
```

### WebSocket Actions

WebSocket communication uses special action types handled by middleware:

```typescript
// Connect to WebSocket
dispatch({ 
  type: "socket/connect", 
  payload: { 
    walletAddress: "0x...", 
    leagueName: "League Name" 
  } 
})

// Send message via WebSocket
dispatch({ 
  type: "socket/send", 
  payload: {
    type: "pick_received",
    payload: { playerId, displayName, team, position, ... }
  }
})

// Disconnect WebSocket
dispatch({ type: "socket/disconnect" })
```

**WebSocket Message Types (Outgoing):**
- `pick_received` - User selects a player to draft
- `queue_update` - User updates their queue

**WebSocket Message Types (Incoming):**
- `countdown_update` - Pre-draft countdown update
- `timer_update` - Turn timer update
- `new_pick` - New player was drafted
- `draft_info_update` - Draft state changed
- `final_card` - Draft completed, card generated
- `draft_complete` - Draft finished

---

## WebSocket Middleware

**Location:** `redux/middleware/wsMiddleware.ts`

**Purpose:** Intercepts WebSocket actions and manages real-time connection.

### Connection Flow

1. **Connect Action:**
   ```typescript
   dispatch({ type: "socket/connect", payload: { walletAddress, leagueName } })
   ```
   - Creates WebSocket connection to: `${DRAFT_SERVER_API_URL}/ws?address=${walletAddress}&draftName=${leagueName}`
   - Sets up event listeners

2. **Event Handlers:**
   - **`open`**: Sets `leagueStatus` to "ongoing"
   - **`message`**: Parses JSON and dispatches appropriate Redux actions based on `data.type`
   - **`close`**: Sets `shouldReconnect` flag
   - **`error`**: Logs error

3. **Message Routing:**
   - `countdown_update` → `setPreTimer`, `setCurrentDrafter`
   - `timer_update` → `setEndOfTurnTimestamp`, `setStartOfTurnTimestamp`, `setCurrentDrafter`
   - `new_pick` → `setMostRecentPlayerDrafted`, `setPickNumber`, `setCurrentRound` (if pick 150)
   - `draft_info_update` → `setPickNumber`, `setCurrentRound`
   - `final_card` → `setGeneratedCard`, `setLeagueStatus("completed")`, disconnect
   - `draft_complete` → `setLeagueStatus("completed")`, disconnect

4. **Send Action:**
   ```typescript
   dispatch({ type: "socket/send", payload: messageObject })
   ```
   - Stringifies and sends message via WebSocket

5. **Disconnect Action:**
   ```typescript
   dispatch({ type: "socket/disconnect" })
   ```
   - Closes WebSocket connection

**Key Points:**
- Single WebSocket instance per store
- Middleware handles all WebSocket state synchronization
- Automatic Redux action dispatching on incoming messages
- Reconnection logic handled via `shouldReconnect` flag

---

## API Integration

**Location:** `utils/api.ts`

### API Structure

The API is organized into namespaced objects:

- **`Owner`** - User/owner operations
- **`Leagues`** - League management
- **`Rankings`** - Player rankings
- **`Draft`** - Draft state operations
- **`Queue`** - Queue management
- **`MintBBB`** - Token minting
- **`Referral`** - Referral codes
- **`Settings`** - User settings

### API → Redux Flow

**Pattern 1: Direct Dispatch**
```typescript
// Component makes API call, then dispatches result
Draft.getDraftInfo(leagueId).then((response) => {
  dispatch(setDraftInfo(response))
  dispatch(setPickNumber(response.pickNumber))
})
```

**Pattern 2: Queue Update**
```typescript
// API call updates backend, then updates Redux
Queue.setQueue(walletAddress, leagueId, newQueue).then((res) => {
  dispatch(setQueue(res))
})
```

### Key API Endpoints

**Draft State:**
- `GET /draft/{leagueId}/state/info` → `setDraftInfo`
- `GET /draft/{leagueId}/state/summary` → `setDraftSummary`
- `GET /draft/{leagueId}/state/rosters` → `setDraftRosters`
- `GET /draft/{leagueId}/playerState/{walletAddress}` → `setDraftRankings`

**League Operations:**
- `GET /owner/{walletAddress}/draftToken/all` → League list
- `GET /owner/{walletAddress}/drafts/{leagueId}` → League details
- `POST /league/fast/owner/{walletAddress}` → Join draft

**Queue:**
- `GET /owner/{walletAddress}/drafts/{draftId}/state/queue` → `setQueue`
- `POST /owner/{walletAddress}/drafts/{draftId}/state/queue` → Update queue

**Owner:**
- `GET /owner/{walletAddress}` → Owner data
- `POST /owner/{walletAddress}/update/displayName` → Update display name
- `POST /owner/{walletAddress}/update/pfpImage` → Update profile image

---

## State Flow & Data Dependencies

### Initialization Flow

1. **App Loads:**
   - `authSlice` initialized with default values
   - User authenticates → `signIn` or `signInWeb3Auth` dispatched
   - `walletAddress` set in auth state

2. **League Selection:**
   - User selects league → `setLeagueId`, `setLeagueName`, `setTokenId` dispatched
   - Component fetches draft data → API calls → `draftSlice` updated
   - WebSocket connection initiated → `socket/connect` dispatched

3. **Draft Active:**
   - WebSocket messages update `leagueSlice` in real-time
   - Timer updates via `tickTime` or timestamp updates
   - User actions (draft, queue) sent via WebSocket

### Data Dependency Graph

```
auth.walletAddress
  ├─→ Used by: All API calls, WebSocket connection
  └─→ Required for: League operations, draft actions

league.leagueId
  ├─→ Used by: Draft API calls, Queue operations
  └─→ Required for: Fetching draft state

league.currentDrafter
  ├─→ Used by: Draft UI, autopick logic
  └─→ Updated by: WebSocket timer_update, countdown_update

league.queuedPlayers
  ├─→ Used by: QueueComponent, DraftComponent
  └─→ Updated by: Queue API, WebSocket queue_update

draft.draftInfo
  ├─→ Used by: Draft board, pick display
  └─→ Fetched via: Draft.getDraftInfo(leagueId)

draft.draftPlayerRankings
  ├─→ Used by: Player selection, rankings display
  └─→ Fetched via: Draft.getPlayerRankings(leagueId, walletAddress)
```

### State Synchronization Points

1. **WebSocket → Redux:**
   - Real-time updates from server
   - Automatic state synchronization
   - No manual polling needed

2. **API → Redux:**
   - On component mount/update
   - After user actions (queue updates)
   - Manual refresh triggers

3. **User Action → WebSocket → Redux:**
   - User drafts player → WebSocket message → Server processes → WebSocket broadcast → Redux updated

---

## Component Interaction Patterns

### Reading State

**Pattern: `useAppSelector`**
```typescript
const leagueId = useAppSelector((state) => state.league.leagueId)
const walletAddress = useAppSelector((state) => state.auth.walletAddress)
const queuedPlayers = useAppSelector((state) => state.league.queuedPlayers)
```

### Dispatching Actions

**Pattern: `useAppDispatch`**
```typescript
const dispatch = useAppDispatch()

// Standard action
dispatch(setLeagueId("league-123"))

// WebSocket action
dispatch({ type: "socket/connect", payload: { walletAddress, leagueName } })
```

### Common Component Patterns

**1. Draft Action Component:**
```typescript
// Reads: league state, auth state
// Dispatches: socket/send (pick_received)
// Updates: Local UI state (isDrafting)
```

**2. Queue Management Component:**
```typescript
// Reads: league.queuedPlayers, league.leagueId, auth.walletAddress
// Dispatches: setQueue (after API call)
// API: Queue.setQueue() → then dispatch result
```

**3. Draft Info Component:**
```typescript
// Reads: league.leagueId, auth.walletAddress
// Dispatches: setDraftInfo, setDraftSummary, setDraftRosters, setDraftRankings
// API: Multiple Draft.* calls in useEffect
```

**4. WebSocket Connection Component:**
```typescript
// Reads: auth.walletAddress, league.leagueName, league.shouldReconnect
// Dispatches: socket/connect, socket/disconnect
// Effect: Connects on mount, reconnects on shouldReconnect change
```

### Effect Dependencies

**Common useEffect Patterns:**
```typescript
// Fetch draft data when league changes
useEffect(() => {
  if (leagueId && walletAddress) {
    Draft.getDraftInfo(leagueId).then(...)
  }
}, [leagueId, walletAddress, currentPickNumber])

// Connect WebSocket when league ready
useEffect(() => {
  if (walletAddress && leagueName) {
    dispatch({ type: "socket/connect", payload: { walletAddress, leagueName } })
  }
  return () => dispatch({ type: "socket/disconnect" })
}, [walletAddress, leagueName])

// Reconnect on flag change
useEffect(() => {
  if (shouldReconnect && walletAddress && leagueName) {
    dispatch({ type: "socket/connect", payload: { walletAddress, leagueName } })
  }
}, [shouldReconnect])
```

---

## Key State Relationships

### Critical State Combinations

**1. Draft Active State:**
```typescript
league.leagueStatus === "ongoing"
  && league.leagueId !== null
  && league.currentDrafter !== null
  && draft.draftInfo !== null
```

**2. User Can Draft:**
```typescript
league.canDraft === true
  && league.currentDrafter === auth.walletAddress
  && league.timeRemaining > 0
```

**3. Queue Operations:**
```typescript
league.leagueId !== null
  && auth.walletAddress !== null
  && league.queuedPlayers (array)
```

### State Cleanup Patterns

**League Cleanup:**
- `clearLeague()` - Resets all league state
- Called on: League exit, draft completion, navigation away

**Draft Cleanup:**
- `clearDraft()` - Clears draft data
- Called on: League change, component unmount

**WebSocket Cleanup:**
- `socket/disconnect` - Closes connection
- Called on: Component unmount, draft completion, navigation

---

## Refactoring Considerations

### Maintaining Existing Logic

When refactoring for new backend format:

1. **Preserve Action Names:**
   - Keep all action creator names the same
   - Only change payload shapes if backend requires it

2. **Maintain State Shape:**
   - Keep state structure identical
   - Map new backend data to existing state shape
   - Add transformation layer if needed

3. **WebSocket Protocol:**
   - Maintain same message types (`pick_received`, `queue_update`, etc.)
   - Keep middleware routing logic
   - Only change payload structures if backend requires

4. **API Integration:**
   - Update endpoint URLs if needed
   - Transform response data to match existing types
   - Keep API function names and signatures

5. **Component Dependencies:**
   - Components should not need changes if state shape preserved
   - Only update API call parameters if backend requires

### Migration Strategy

1. **Create Adapter Layer:**
   - Transform new backend responses to existing types
   - Keep existing Redux slices unchanged
   - Update API functions to use new endpoints

2. **Gradual Migration:**
   - Update one API endpoint at a time
   - Test each change independently
   - Maintain backward compatibility during transition

3. **Type Safety:**
   - Update TypeScript types to match new backend
   - Add transformation functions with type guards
   - Ensure all existing selectors still work

---

## Summary

The Redux architecture follows a clear separation of concerns:

- **Auth Slice:** User identity and wallet
- **League Slice:** Active draft state and real-time updates
- **Draft Slice:** Draft data fetched from API
- **Manage Slice:** Post-draft management state
- **Mint Slice:** Minting UI state

**Key Patterns:**
- WebSocket middleware handles real-time updates automatically
- API calls update Redux state via dispatched actions
- Components read state via selectors and dispatch actions
- State cleanup handled via clear actions

**For Refactoring:**
- Maintain action names and state shapes
- Update API endpoints and add transformation layer
- Keep WebSocket protocol and middleware logic
- Preserve component dependencies on state structure

