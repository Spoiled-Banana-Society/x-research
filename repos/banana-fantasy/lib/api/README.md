# SBS Frontend API Service Layer

This folder contains the typed frontend service layer used to call the SBS drafting backend and related realtime services.

It is in active use. The app talks to real APIs from the UI, with staging traffic pointed at the staging backend and draft server helpers in `lib/staging.ts`.

Example (owner profile):

```ts
import { getOwnerUser } from '@/lib/api';

const user = await getOwnerUser(walletAddress);
```

Example (join a draft):

```ts
import { joinDraft } from '@/lib/api';

const room = await joinDraft(walletAddress, 'fast', 1);
// room is mapped to the UI DraftRoom type (best-effort)
```

## Runtime behavior

- `client.ts` attaches JSON headers and can attach `Authorization: Bearer <token>` for authenticated requests.
- Base URLs come from environment variables and staging helpers rather than local mock files.
- The app can override staging API and WebSocket URLs at runtime for tunnel-based testing.

## Modules

### `client.ts`
Fetch-based HTTP client:
- JSON serialization
- consistent `ApiError`
- optional `Authorization: Bearer <token>` support for Privy-authenticated routes

### `owner.ts`
Owner endpoints:
- `getOwnerProfile()` (raw backend shape)
- `getOwnerUser()` (maps → UI `User`)
- `getOwnerDraftTokens()` (raw tokens)
- `getOwnerLeaguesFromDraftTokens()` (maps → UI `League[]`)
- `updateOwnerDisplayName()`
- `updateOwnerPfpImage()`
- `mintOwnerDraftTokens()` (best-effort; request body may change)

### `leagues.ts`
League endpoints:
- `joinDraft()`
- `leaveDraft()`
- `getCurrentGameweek()`
- `getAllLeaderboards()` (maps → UI `LeaderboardEntry[]`)
- `getLeagueLeaderboard()` (maps → UI `LeaderboardEntry[]`)

### `drafts.ts`
Draft endpoints:
- `getDraftInfo()` (raw backend shape)
- `getDraftRoom()` (maps → UI `DraftRoom`)
- `getDraftSummary()` / `getDraftPickedPlayers()`
- `getDraftRosters()` / `getDraftLeagues()`
- `getDraftPlayerStateRaw()` / `getDraftPlayerRankings()` (best-effort mapping)

### `websocket.ts`
Reconnectable WebSocket client (exponential backoff) for real-time drafting events:
- connect/disconnect
- `.on(eventType, handler)` and `.onAny(handler)`
- supports server event types like `new_pick`, `timer_update`, `countdown_update`, `draft_complete`

### `firebase.ts`
Firebase Realtime Database helpers:
- singleton Firebase initialization
- `subscribeDraftNumPlayers(draftId, cb)` to get `/drafts/{draftId}/numPlayers`

## Environment variables

All URLs/keys are sourced from public Next.js env vars or the staging helpers in `lib/staging.ts`.

Required:
- `NEXT_PUBLIC_DRAFTS_API_URL`
- `NEXT_PUBLIC_DRAFT_SERVER_URL`

Firebase (for realtime player counts):
- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_AUTH_DOMAIN`
- `NEXT_PUBLIC_DATABASE_URL`
- `NEXT_PUBLIC_PROJECT_ID`
- `NEXT_PUBLIC_STORAGE_BUCKET`
- `NEXT_PUBLIC_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_APP_ID`
- `NEXT_PUBLIC_MEASUREMENT_ID` (optional)

See root `.env.example` for the full list.

## Backend integration status

- The UI is already integrated with live API flows for drafting, owner/profile data, standings, and websocket-driven draft state.
- Staging runs against the real staging backend by default, including runtime overrides for temporary API and WebSocket endpoints.
- Some product areas still call app-local API routes or other modules directly, so `lib/api/` is one integration layer, not the entire data-access surface.
