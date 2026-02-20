# SBS Frontend API Service Layer

This folder contains a thin, typed service layer for the SBS Drafts backend(s).

It is **not wired into the UI yet** (the UI still uses `lib/mockData.ts`). The purpose of these modules is to provide a consistent place to call real APIs when we start replacing mock data.

## How to switch from mock data → real APIs

1. Ensure `.env.local` is set (copy from `.env.example`).
2. In components/pages that currently import mock data (ex: `mockContests`, `mockDraftRooms`, `mockUser`), replace those usages with calls to these services.
3. Prefer adding *hooks* (e.g. `useOwner`, `useDraftRoom`, `useLeaderboard`) that wrap these services and expose `{ data, isLoading, error }` for React UI state.

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

## Modules

### `client.ts`
Fetch-based HTTP client:
- JSON serialization
- consistent `ApiError`
- optional `Authorization: Bearer <token>` support (future Web3Auth integration)

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

All URLs/keys are sourced from **public** Next.js env vars (must be prefixed with `NEXT_PUBLIC_`).

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

## Backend gaps / not yet implemented

The current public drafts APIs cover drafting + leaderboards. These frontend features still rely on mock data because there are **no documented endpoints yet** for:

- Promos / referrals / Pick-10 tracking
- Banana wheel spins / prize claiming
- Marketplace / trading
- Contest listing metadata (the home contest cards)
- Eligibility / W9 workflows
- Exposure dashboards

When those endpoints become available, add new modules under `lib/api/` (e.g. `promos.ts`, `wheel.ts`, `marketplace.ts`).
