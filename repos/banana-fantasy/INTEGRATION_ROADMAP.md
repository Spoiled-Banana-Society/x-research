# Integration Roadmap - Banana Fantasy

This document outlines the step-by-step plan to integrate the banana-fantasy frontend with the real SBS backend APIs.

---

## Phase 1: Environment & API Setup

### 1.1 Get Credentials from Dev
Contact Dev to get:
- [ ] Web3Auth Client ID
- [ ] Infura API Key
- [ ] OpenSea API Key
- [ ] ThirdWeb Client ID
- [ ] Firebase configuration (API key, auth domain, etc.)

### 1.2 Create Environment File
- [ ] Copy `.env.example` to `.env.local`
- [ ] Fill in all API keys and credentials
- [ ] Test that environment variables load correctly

### 1.3 Install Additional Dependencies
```bash
npm install axios
npm install @web3auth/modal @web3auth/ethereum-provider
npm install firebase
npm install socket.io-client  # or native WebSocket
```

---

## Phase 2: Authentication Integration

### 2.1 Implement Web3Auth
Reference: `/Users/borisvagner/sbs-draft-web-main/utils/auth/web3Auth.ts`

- [ ] Create `/lib/auth/web3Auth.ts`
- [ ] Set up MetaMask adapter (primary method)
- [ ] Configure Web3Auth modal
- [ ] Implement wallet connection flow
- [ ] Store wallet address in state/context

### 2.2 Update Auth Hook
File: `/hooks/useAuth.tsx`

- [ ] Replace mock authentication with real Web3Auth
- [ ] Add wallet connection methods
- [ ] Add wallet disconnection
- [ ] Persist session to localStorage
- [ ] Handle wallet address (lowercase it)

### 2.3 Add Auth Context/Provider
- [ ] Create AuthContext for app-wide auth state
- [ ] Wrap app with AuthProvider in layout
- [ ] Provide wallet address to all components

---

## Phase 3: API Service Layer

### 3.1 Create API Client
File: `/lib/api.ts`

```typescript
import axios from 'axios'

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_DRAFTS_API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
})

export default api
```

### 3.2 Create Service Files
Create these service files in `/lib/services/`:

**ownerService.ts**
- [ ] `getOwner(walletAddress)` - Get owner profile
- [ ] `getDraftTokens(walletAddress)` - Get all draft passes
- [ ] `setDisplayName(walletAddress, displayName)`
- [ ] `setPFPImage(walletAddress, imageUrl, nftContract)`
- [ ] `getRankings(walletAddress)`
- [ ] `updateRankings(walletAddress, rankings)`

**leagueService.ts**
- [ ] `joinLeague(walletAddress, numLeagues)` - Join drafts
- [ ] `leaveDraft(walletAddress, tokenId, draftId)`
- [ ] `getLeagues(walletAddress)` - Get all leagues
- [ ] `getLeague(walletAddress, leagueId)` - Get specific league
- [ ] `getLeaderboard(walletAddress, draftId, orderBy, gameweek)`
- [ ] `getCurrentGameweek()`

**draftService.ts**
- [ ] `getDraftInfo(draftId)` - Get draft state
- [ ] `getDraftSummary(draftId)` - Get all picks
- [ ] `getDraftRosters(draftId)` - Get rosters
- [ ] `getPlayerRankings(draftId, walletAddress)`

**queueService.ts**
- [ ] `getQueue(walletAddress, draftId)`
- [ ] `setQueue(walletAddress, draftId, queue)`

**mintService.ts**
- [ ] `mintTokens(walletAddress, minId, maxId, promoCode)`

### 3.3 Replace Mock Data
- [ ] Update `/app/page.tsx` to use `leagueService.getLeagues()`
- [ ] Update `/app/drafting/page.tsx` to use real draft data
- [ ] Update `/app/buy-drafts/page.tsx` to use real minting
- [ ] Replace all `mockData` imports with service calls

---

## Phase 4: WebSocket Integration

### 4.1 Create WebSocket Service
File: `/lib/services/websocketService.ts`

Reference: `/Users/borisvagner/sbs-draft-web-main/redux/middleware/wsMiddleware.ts`

- [ ] Create WebSocket class/hook
- [ ] Handle connection: `wss://{DRAFT_SERVER_URL}/ws?address={address}&draftName={draftId}`
- [ ] Handle events: `new_pick`, `timer_update`, `draft_info_update`, etc.
- [ ] Implement reconnection logic
- [ ] Add event listeners for UI updates

### 4.2 Update Draft Room
File: `/app/draft-room/page.tsx`

- [ ] Connect to WebSocket when draft fills
- [ ] Listen for `countdown_update` for pre-draft timer
- [ ] Listen for `timer_update` for turn timer
- [ ] Listen for `new_pick` to update draft board
- [ ] Send picks via WebSocket
- [ ] Handle `draft_complete` event

### 4.3 Real-time Updates
- [ ] Update draft info when `draft_info_update` received
- [ ] Update timer display with `timer_update`
- [ ] Add new picks to summary when `new_pick` received
- [ ] Show final card when `final_card` received

---

## Phase 5: Firebase Realtime Database

### 5.1 Set Up Firebase
File: `/lib/firebase.ts`

Reference: `/Users/borisvagner/sbs-draft-web-main/utils/db.ts`

- [ ] Initialize Firebase with config from env vars
- [ ] Create Realtime Database reference

### 5.2 Live Player Counts
- [ ] Subscribe to `/drafts/{draftId}/numPlayers` for each contest
- [ ] Update UI when player count changes
- [ ] Show "X/10 joined" dynamically

---

## Phase 6: Smart Contract Integration

### 6.1 Set Up ThirdWeb
Reference: `/Users/borisvagner/sbs-draft-web-main/utils/client.js`

- [ ] Create ThirdWeb client with client ID
- [ ] Configure contract address (mainnet or testnet)
- [ ] Set up contract interaction hooks

### 6.2 Implement Minting
File: `/app/buy-drafts/page.tsx`

- [ ] Connect wallet via ThirdWeb
- [ ] Call `mint(numberOfTokens)` function
- [ ] Handle transaction confirmation
- [ ] Show success/error states
- [ ] Refresh user's draft passes after mint

---

## Phase 7: OpenSea Integration (Optional)

### 7.1 NFT Profile Pictures
File: `/app/settings/page.tsx` (if you create it)

- [ ] Fetch user's NFTs from OpenSea API
- [ ] Display NFT grid for selection
- [ ] Update PFP via `ownerService.setPFPImage()`

---

## Phase 8: Testing & Validation

### 8.1 Test Environment First
- [ ] Switch `.env.local` to use TEST API URLs
- [ ] Test wallet connection
- [ ] Test joining drafts
- [ ] Test draft flow end-to-end
- [ ] Test minting with testnet (Sepolia)

### 8.2 Production Testing
- [ ] Switch to PROD API URLs
- [ ] Test with small amount of real ETH
- [ ] Verify all features work
- [ ] Test error handling

---

## Phase 9: Clean Up

### 9.1 Remove Mock Data
- [ ] Delete or archive `/lib/mockData.ts`
- [ ] Remove mock auth from `/hooks/useAuth.tsx`
- [ ] Clean up any remaining hardcoded data

### 9.2 Error Handling
- [ ] Add proper error boundaries
- [ ] Add loading states for all API calls
- [ ] Add user-friendly error messages
- [ ] Handle network failures gracefully

### 9.3 Optimization
- [ ] Add request caching where appropriate
- [ ] Implement data polling for non-WebSocket pages
- [ ] Optimize re-renders
- [ ] Add request debouncing/throttling

---

## Critical Integration Points

### Current Mock → Real API Mapping

| Feature | Mock Data | Real API |
|---------|-----------|----------|
| User Profile | `mockData.user` | `GET /owner/{walletAddress}` |
| Draft Passes | `useAuth` state | `GET /owner/{walletAddress}/draftToken/all` |
| Active Drafts | `mockData.activeDrafts` | Returned in draft tokens API |
| Join Draft | localStorage | `POST /league/fast/owner/{walletAddress}` |
| Draft Info | Static data | `GET /draft/{draftId}/state/info` |
| Player Picks | Static array | WebSocket `new_pick` events |
| Timer | `setTimeout` | WebSocket `timer_update` events |
| Leaderboard | `mockData.leaderboard` | `GET /league/{draftId}/leaderboard/{orderBy}/gameweek/{gameweek}` |

---

## Questions for Dev

Before starting integration, ask Dev:

1. **API Keys**: Can you provide all the API keys listed in `.env.example`?
2. **Test Environment**: Should we use test or prod environment first?
3. **Wallet Testing**: Do we have test wallets with draft passes for testing?
4. **Rate Limits**: Are there any API rate limits we should be aware of?
5. **WebSocket**: Any special connection requirements or auth for WebSocket?
6. **Smart Contract**: Which network should we target for testing (Sepolia or mainnet)?
7. **Promo Codes**: How do promo codes work? Where do users get them?
8. **Draft Types**: How is draft type (Jackpot/HOF/Pro) actually determined? Is the guaranteed distribution system live?

---

## Files to Create

New files needed for integration:

```
/lib/
  ├── api.ts                          # Axios API client
  ├── firebase.ts                     # Firebase config
  ├── auth/
  │   └── web3Auth.ts                # Web3Auth setup
  └── services/
      ├── ownerService.ts            # Owner API calls
      ├── leagueService.ts           # League API calls
      ├── draftService.ts            # Draft API calls
      ├── queueService.ts            # Queue API calls
      ├── mintService.ts             # Minting API calls
      └── websocketService.ts        # WebSocket connection

/contexts/
  └── AuthContext.tsx                # Auth state provider

/hooks/
  ├── useWebSocket.ts                # WebSocket hook
  └── useFirebaseRealtime.ts         # Firebase realtime hook
```

---

## Estimated Timeline

- **Phase 1**: 1 day (waiting on credentials)
- **Phase 2**: 2-3 days (wallet auth)
- **Phase 3**: 3-4 days (API services)
- **Phase 4**: 2-3 days (WebSocket)
- **Phase 5**: 1 day (Firebase)
- **Phase 6**: 2 days (smart contract)
- **Phase 7**: 1 day (OpenSea, optional)
- **Phase 8**: 3-4 days (testing)
- **Phase 9**: 1-2 days (cleanup)

**Total**: ~15-20 days of development

---

## Priority Order

If you want to integrate incrementally:

1. **Authentication** (Phase 2) - Must have wallet connection first
2. **API Services** (Phase 3) - Get real data flowing
3. **WebSocket** (Phase 4) - Enable real-time drafts
4. **Firebase** (Phase 5) - Live player counts
5. **Smart Contract** (Phase 6) - Enable minting
6. **OpenSea** (Phase 7) - Nice to have

Start with authentication and API services to get the basic flow working, then add real-time features.
