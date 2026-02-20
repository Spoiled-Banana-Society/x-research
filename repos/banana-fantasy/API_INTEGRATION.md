# API Integration Documentation

## Repository Overview

You have 4 main repositories for the SBS Fantasy platform:

1. **banana-fantasy** - New Next.js 14 frontend (current project, uses mock data)
2. **sbs-draft-web-main** - Old Next.js frontend (shows how to connect to APIs)
3. **sbs-drafts-api-main** - Go API for draft management
4. **SBS-Football-Drafts-main** - Go WebSocket server for real-time drafting
5. **SBS-Backend-main** - Firebase functions & admin scripts

---

## API Endpoints

### Base URLs

| Environment | Drafts API | WebSocket Server |
|-------------|-----------|------------------|
| **Production** | `https://sbs-drafts-api-w5wydprnbq-uc.a.run.app` | `wss://sbs-drafts-server-w5wydprnbq-uc.a.run.app` |
| **Test** | `https://sbs-drafts-api-ajuy5qy3wa-uc.a.run.app` | `wss://sbs-drafts-server-1026708014901.us-central1.run.app` |

### Environment Variables Needed

```env
# API Configuration
NEXT_PUBLIC_ENVIRONMENT=prod
NEXT_PUBLIC_DRAFTS_API_URL=https://sbs-drafts-api-w5wydprnbq-uc.a.run.app
NEXT_PUBLIC_DRAFT_SERVER_URL=wss://sbs-drafts-server-w5wydprnbq-uc.a.run.app

# Web3Auth (for wallet login)
NEXT_PUBLIC_WEB3AUTH_CLIENT_ID=your_web3auth_client_id
NEXT_PUBLIC_INFURA_KEY=your_infura_key

# OpenSea API (for NFT profile pictures)
NEXT_PUBLIC_OPENSEA_API_KEY=your_opensea_api_key

# ThirdWeb (for minting)
NEXT_PUBLIC_THIRDWEB_CLIENT_ID=your_thirdweb_client_id

# Firebase (for real-time player counts)
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_AUTH_DOMAIN=your_firebase_auth_domain
NEXT_PUBLIC_DATABASE_URL=https://sbs-prod-env-default-rtdb.firebaseio.com
NEXT_PUBLIC_PROJECT_ID=sbs-prod-env
NEXT_PUBLIC_STORAGE_BUCKET=your_storage_bucket
NEXT_PUBLIC_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_APP_ID=your_app_id
NEXT_PUBLIC_MEASUREMENT_ID=your_measurement_id
```

---

## Key API Endpoints Reference

### Owner Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/owner/{walletAddress}` | Get owner profile |
| GET | `/owner/{walletAddress}/draftToken/all` | Get all draft passes (available & active) |
| POST | `/owner/{walletAddress}/draftToken/mint` | Mint new draft passes |
| POST | `/owner/{walletAddress}/update/displayName` | Update display name |
| POST | `/owner/{walletAddress}/update/pfpImage` | Update profile picture |
| GET | `/owner/{walletAddress}/rankings/get` | Get player rankings |
| POST | `/owner/{walletAddress}/drafts/state/rankings` | Update player rankings |
| GET | `/owner/{walletAddress}/drafts/{draftId}/state/queue` | Get draft queue |
| POST | `/owner/{walletAddress}/drafts/{draftId}/state/queue` | Update draft queue |

### League Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/league/{draftType}/owner/{walletAddress}` | Join draft (fast or slow) |
| POST | `/league/{draftId}/actions/leave` | Leave draft |
| GET | `/league/all/{walletAddress}/draftTokenLeaderboard/gameweek/{gameweek}/orderBy/{orderBy}/level/{level}` | Get all leaderboards |
| GET | `/league/{walletAddress}/drafts/{draftId}/leaderboard/{orderBy}/gameweek/{gameweek}` | Get league leaderboard |
| GET | `/league/getGameweek` | Get current gameweek |

### Draft Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/draft/{draftId}/state/info` | Get draft info (current pick, drafter, etc.) |
| GET | `/draft/{draftId}/state/summary` | Get draft summary (all picks) |
| GET | `/draft/{draftId}/state/rosters` | Get all rosters |
| GET | `/draft/{draftId}/playerState/{walletAddress}` | Get player rankings for owner |

### WebSocket Connection

Connect to WebSocket for real-time draft updates:

```
wss://sbs-drafts-server-w5wydprnbq-uc.a.run.app/ws?address={walletAddress}&draftName={draftId}
```

**Events received:**
- `countdown_update` - Pre-draft timer
- `timer_update` - Turn timer
- `new_pick` - Player selected
- `draft_info_update` - Draft state changed
- `final_card` - Draft complete with generated card
- `draft_complete` - Draft finished

---

## Authentication

**No traditional API keys** - uses wallet addresses as authentication:
- All endpoints use `{walletAddress}` in the URL path
- Addresses are lowercased automatically
- Example: `/owner/0x27fe00a5a1212e9294b641ba860a383783016c67/draftToken/all`

In production, smart contract verification is used to confirm token ownership.

---

## Data Structures

### Owner Object
```typescript
{
  availableCredit: number
  availableEthCredit: number
  leagues: [{leagueId: string, cardId: string}]
  pfp: {
    imageUrl: string
    nftContract: string
    displayName: string
  }
}
```

### Draft Token (Draft Pass)
```typescript
{
  cardId: string
  leagueId: string  // Empty if available, filled if in a draft
  leagueDisplayName: string
  roster: {
    QB: RosterPlayer[]
    RB: RosterPlayer[]
    WR: RosterPlayer[]
    TE: RosterPlayer[]
    DST: RosterPlayer[]
  }
  level: "Pro" | "Hall of Fame" | "Jackpot"
  rank: string
  seasonScore: string
  weekScore: string
  prizes: {ETH: number}
}
```

### Draft Info
```typescript
{
  draftId: string
  displayName: string
  draftStartTime: number
  currentPickEndTime: number
  currentDrafter: string
  pickNumber: number
  roundNum: number
  pickInRound: number
  pickLength: number  // 30 for fast, 28800 for slow
  draftOrder: [{ownerId: string, tokenId: string}]
}
```

### Player Info
```typescript
{
  playerId: string  // e.g., "BUF-QB"
  displayName: string
  team: string
  position: "QB" | "RB" | "WR" | "TE" | "DST"
  ownerAddress: string
  pickNum: number
  round: number
}
```

---

## How to Replace Mock Data

### Current Mock Data Files
- `/lib/mockData.ts` - Contains all mock data (contests, user data, FAQs, etc.)
- `/hooks/useAuth.tsx` - Mock authentication

### Steps to Integrate Real APIs

1. **Create API Client** (`/lib/api.ts`):
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

2. **Create API Service** (`/lib/services/ownerService.ts`):
```typescript
import api from '../api'

export const OwnerService = {
  getOwner: (walletAddress: string) =>
    api.get(`/owner/${walletAddress}`),

  getDraftTokens: (walletAddress: string) =>
    api.get(`/owner/${walletAddress}/draftToken/all`),

  joinLeague: (walletAddress: string, numLeagues: number) =>
    api.post(`/league/fast/owner/${walletAddress}`, {numLeaguesToJoin: numLeagues}),
}
```

3. **Update Components** to use real data instead of mock data

4. **Add WebSocket** for real-time draft updates

5. **Implement Web3Auth** for wallet login (see old frontend for example)

---

## Smart Contract Details

**Mainnet Contract:** `0x2BfF6f4284774836d867CEd2e9B96c27aAee55B7`
**Testnet Contract (Sepolia):** `0xbf732e170b17107417568891f31c52e51998669e`

**Mint Function:**
```solidity
mint(uint256 numberOfTokens) payable
```

**Price:** 0.02 ETH per token (prod)

---

## Firebase Realtime Database

Used for live draft participant counts:

**URL:** `https://sbs-prod-env-default-rtdb.firebaseio.com`

**Path:** `/drafts/{draftId}/numPlayers`

Subscribe to this path to get real-time updates of how many players have joined a draft.

---

## Example Integration Flow

### 1. User Connects Wallet
```typescript
// Use MetaMask or Web3Auth
const walletAddress = await connectWallet()
```

### 2. Fetch User Data
```typescript
const owner = await OwnerService.getOwner(walletAddress)
const draftTokens = await OwnerService.getDraftTokens(walletAddress)
```

### 3. Join a Draft
```typescript
await OwnerService.joinLeague(walletAddress, 1)
```

### 4. Connect to WebSocket
```typescript
const ws = new WebSocket(
  `${DRAFT_SERVER_URL}/ws?address=${walletAddress}&draftName=${draftId}`
)

ws.onmessage = (event) => {
  const data = JSON.parse(event.data)
  if (data.eventType === 'new_pick') {
    // Update UI with new pick
  }
}
```

### 5. Make a Pick
```typescript
ws.send(JSON.stringify({
  eventType: 'pick_received',
  payload: {
    playerId: 'BUF-QB',
    displayName: 'Josh Allen',
    team: 'BUF',
    position: 'QB'
  }
}))
```

---

## Next Steps

1. Get API keys/credentials from Dev
2. Create `.env.local` file with all environment variables
3. Build API service layer in `/lib/services/`
4. Replace mock data calls with real API calls
5. Implement Web3Auth for wallet login
6. Add WebSocket connection for real-time drafts
7. Test with test environment first before switching to prod
