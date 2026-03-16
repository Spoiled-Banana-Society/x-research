# Notes for Richard — March 2, 2026

## Important: Staging URL
Always use **`https://banana-fantasy-sbs.vercel.app/`** for browser testing. This is the Privy-whitelisted domain. `banana-fantasy.vercel.app` is the same deploy but Privy auth won't work there.

## What Changed

### 1. Twitter/X Verification (Phase 1) — NEW
Full anti-sybil Twitter verification system using Firestore.

**API: `/api/auth/verify-twitter`**
- `POST` — Links a Twitter account to a wallet (anti-sybil: one Twitter per wallet)
- `GET?walletAddress=0x...` — Checks if wallet has a verified Twitter link
- `PATCH` — Marks the new-user promo as claimed for a wallet

**Flow:**
1. User logs in → `useAuth` checks Privy linkedAccounts for Twitter
2. If Twitter already linked via Privy → auto-verifies with backend (POST)
3. If not linked → user clicks "Connect" in New User promo → Privy OAuth → redirect back → auto-verify
4. Once verified → CLAIM button enables → claim persisted to Firestore

**Files changed:**
- `app/api/auth/verify-twitter/route.ts` — NEW: Firestore-backed API
- `hooks/useAuth.tsx` — Added `isTwitterVerified`, `newUserPromoClaimed`, `claimNewUserPromo`
- `components/modals/PromoModal.tsx` — Login gate for new-user/tweet-engagement promos, persisted claim
- `components/home/PromoCarousel.tsx` — Respects `newUserPromoClaimed` from Firestore
- `lib/db.ts` — Always uses jsonDb (Firestore only for verify-twitter)
- `lib/firebaseAdmin.ts` — Firebase Admin SDK init (uses `FIREBASE_SERVICE_ACCOUNT_JSON` env var)

### 2. Vercel Env Var Fix
`FIREBASE_SERVICE_ACCOUNT_JSON` was re-added as compact single-line JSON (was causing build errors when multi-line).

### 3. db.ts Always Uses JSON DB
Adding the Firebase env var accidentally switched ALL data queries to Firestore (empty collections). Fixed: `db.ts` always uses `jsonDb`. Firestore is only used directly by `verify-twitter` route.

## What Needs Testing

**End-to-end Twitter verification with a fresh account:**
1. Log in with a wallet that has NO Twitter linked in Privy
2. Open the "New Users" promo card → should see "Connect" button
3. Click Connect → Privy Twitter OAuth popup → authorize
4. Return to site → should auto-verify with backend
5. CLAIM button should enable → click it
6. Refresh page → CLAIM button should stay disabled (persisted in Firestore)

Boris's account (@BorisVagner) already had Twitter linked via Privy, so the verification happened automatically on login. Needs testing with a fresh account to confirm the full manual Connect flow.

**Also note:** The wheel spin wasn't working when Boris tested — separate issue, not related to these changes.

## Firestore Collections
- `v2_twitter_links` — documents keyed by Twitter ID, contains `{ twitterId, twitterHandle, walletAddress, linkedAt, newUserPromoClaimed }`

---

# Notes for Richard — March 16, 2026

## Guaranteed Draft Type Distribution — Backend Already Built

Richard, your CLAUDE.md note says the backend needs to be built for guaranteed distribution — **it's already done.** Boris's side already built this in `sbs-drafts-api-main`. Here's what exists:

### What's already working on the backend:

**1. Batch tracker** (`models/leagues.go`):
- `DraftLeagueTracker` in Firestore doc `drafts/draftTracker` tracks everything
- `GenerateNewBatch()` shuffles 1 Jackpot + 5 HOF positions within each 100-draft batch
- Auto-resets when `FilledLeaguesCount > BatchStart + 99`

**2. Draft type assignment is automatic** (`models/draft-state.go`, `CreateLeagueDraftStateUponFilling()`):
- When a draft fills (10/10), it checks `FilledLeaguesCount` against `HofLeagueIds` and `JackpotLeagueIds`
- If it matches a HOF position → sets `league.Level = "Hall of Fame"` and upgrades all cards
- If it matches a Jackpot position → sets `league.Level = "Jackpot"` and upgrades all cards
- Otherwise it's Pro (default)
- No new `draftType` field needed — it's `league.Level` on the league document in Firestore

**3. Batch progress endpoint already exists**:
- `GET /league/batchProgress` → returns:
```json
{
  "current": 80,
  "total": 100,
  "jackpotRemaining": 1,
  "hofRemaining": 2,
  "batchStart": 1,
  "filledLeaguesCount": 80
}
```

### What you need to do on the frontend:
- **Replace `batchManager.claimNextType()` (localStorage)** → it's not needed. The backend assigns the type automatically when the draft fills. The type comes back on the league document's `Level` field.
- **Replace `batchManager.getBatchProgress()` (localStorage)** → call `GET /league/batchProgress` from the staging API (`sbs-drafts-api-staging-652484219017.us-central1.run.app`).
- **You can remove `lib/batchManager.ts` entirely** — all that logic lives on the backend already.

### Staging API base URL:
```
https://sbs-drafts-api-staging-652484219017.us-central1.run.app
```
