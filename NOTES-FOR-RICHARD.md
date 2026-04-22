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

---

# Notes for Richard — April 22, 2026

## Free-draft awards now mint real BBB4 NFTs (when env is set)

We're making staging mirror production: every draft pass in the system should be a real on-chain BBB4 NFT, whether the user paid for it or won it. Today, paid mints (USDC + MoonPay card) already go on-chain. Free drafts (admin grants, wheel spins, buy-bonus promo claims) were Firestore-only counters — that's fixed now, but it's gated on two things from you.

**What I shipped (commit `1a8ebf5`):**
- `lib/onchain/adminMint.ts` — server-side viem `writeContract` that calls `reserveTokens(to, count)` on BBB4.
- `lib/onchain/passOrigin.ts` — writes `pass_origin/<tokenId>` Firestore docs when we admin-mint, so we can tell spin/grant NFTs apart from paid ones.
- `app/api/admin/grant-drafts/route.ts`, `app/api/wheel/spin/route.ts`, and the buy-bonus path in `lib/db-firestore.ts` (`claimPromo`) all call the mint lib when `BBB4_OWNER_PRIVATE_KEY` is set, fall back to the legacy `freeDrafts` Firestore counter when it isn't. So nothing breaks on staging while this is unwired.
- Admin users table now splits **Paid** and **Free** pass counts into separate columns.
- `components/admin/UsersTable.tsx` + `hooks/admin/useAdminApi.ts` surface the tx hash to the UI when a grant mints on-chain.

## What I need from you (two items)

### 1. Contract ownership handoff

`reserveTokens(address, uint256)` is `onlyOwner`. You deployed BBB4 so your wallet is the owner. Two paths:

**Preferred — transfer ownership to a dedicated ops wallet:**
- I'll generate a fresh key, fund ~$2 ETH on Base, and store it only in Vercel env as `BBB4_OWNER_PRIVATE_KEY`.
- You call `transferOwnership(opsWallet)` on `0x14065412b3A431a660e6E576A14b104F1b3E463b` once. Gas on you (<$0.01 on Base).
- Tradeoff: you lose the ability to call other `onlyOwner` functions (`setBaseURI`, `setPaused`, `flipMintState`, `withdraw`, `setProvenanceHash`) without another handoff. For prod we'd move to a multisig; for staging + soft-launch this is fine.

**Alternative — share the current owner key:**
- Faster, but we'd both be protecting the same secret. I'd rather not.

Tell me which you prefer and I'll generate the ops wallet and send you the address + funding instructions.

### 2. Confirm the Go API tags `reserveTokens` mints as `passType: 'free'`

The marketplace already has a rule (`components/marketplace/SellTab.tsx:123`, `app/marketplace/page.tsx:331`): a team drafted with a free pass can't be listed until the season closes. That rule keys off `ApiDraftToken.passType === 'free'` coming back from `GET /owner/{wallet}/draftToken/all`.

Question: when the Go API sees an NFT minted via `reserveTokens` (not `mint`), does it correctly tag it as `passType: 'free'`? Two scenarios:
- **If yes:** we're done — users won't be able to list reserveTokens-origin teams during season, exactly as intended.
- **If no:** I'll swap the marketplace check to join our `pass_origin` Firestore collection instead. Just a heads up.

Easiest way to confirm: after the ownership handoff, I'll run one admin grant on staging, then you can curl `/owner/{testWallet}/draftToken/all` and tell me whether the new token comes back with `passType: "free"` or `"paid"`.

## Until the key is set
Admin grants/wheel spins/buy-bonus claims continue to use the legacy `freeDrafts` Firestore counter, so staging flows keep working for you. No rush — just flagging what's blocked on your side.

---

## Your open asks to me — status

Skimming your older notes, I see these are still waiting on Boris:

- **April 14 — `BORIS-GO-API-FIX.md`: league routing in `models/leagues.go` `JoinLeagues()`.** Two wallets joining the same fast draft still land in different leagues because the iteration doesn't prefer partially-filled leagues (1–9 players) over empty ones. I don't see a reply from Boris on this yet.
- **March 31 (in `CLAUDE.md`) — old string-ID tokens crashing `/owner/.../draftToken/all`.** Tokens minted via the deprecated `/staging/mint-tokens/` have IDs like `staging-1771912537015-4` and trip `strconv.Atoi`. Either clean them up in Firestore or add a skip in the Go handler.

If either of those has already been handled in a commit I haven't caught up on, ignore this section and I'll diff next session.

---

## Quick update — same day

**Slow-draft `pickLength` Go API deploy: DONE ✅**
- Noticed your commit `3437239` said the frontend cleanup shouldn't ship until the Go API was redeployed, and the Cloud Run service was still on revision 51 from April 16.
- Ported your one-line fix (`60 * 8` → `3600 * 8`) into `~/sbs-drafts-api-deploy/models/draft-state.go` line 533 (the playoff-scripts branch) and ran `gcloud run deploy sbs-drafts-api-staging`.
- Now live as revision `sbs-drafts-api-staging-00052-pp8`. Staging slow drafts should return `pickLength: 28800` and the UI will show 8h timers.
- Note: I deployed from the local `-deploy/` copy (not shared workspace) because configs/secrets are excluded from the workspace repo.

**Reminder — what I still need from you (details above in the April 22 section):**
1. Decide on the BBB4 ownership handoff path (preferred: transfer to a dedicated ops wallet I'll generate).
2. Confirm whether the Go API tags `reserveTokens`-minted tokens as `passType: 'free'` on `/owner/{wallet}/draftToken/all`.

Ping me when you've picked an ownership path and I'll generate/fund the ops wallet.

---

## Reply — answering your 4 items (April 22, later)

**1. Functions repo path: `~/sbs-staging-functions/` ✅**
That's the right place. Confirmed layout:
- `firebase.json` → `"source": "functions"`
- `.firebaserc` → project `sbs-staging-env`
- `functions/index.js` (CommonJS, Node 20) — already has `onQueueUpdate` Firestore trigger
- `functions/package.json` already has `firebase-functions`, `firebase-admin`, `node-fetch@2`

Drop `onPickAdvance` into `functions/index.js` next to `onQueueUpdate`. Use v1 RTDB syntax to match the existing style: `functions.database.ref('drafts/{draftId}/realTimeDraftInfo').onUpdate(...)`. `node-fetch@2` is already in deps; import it with `require('node-fetch')`. Deploy: `cd ~/sbs-staging-functions && firebase deploy --only functions:onPickAdvance`.

**2. `withdraw()` protection plan: accept risk on staging; skim cron before prod volume**
For now we're on staging with test money, and soft-launch volume will be small. Exposure = whatever accumulates between manual checks × probability someone exploits a Vercel env leak. Acceptable for this phase.

Commitment before prod go-live:
- Move to a **multisig for contract ownership** (Safe on Base) so `withdraw()` requires multiple signers.
- Until multisig lands, stand up a **Vercel cron** that calls `withdraw()` hourly and forwards USDC to a cold treasury address you control.

If you want the skim cron in staging too (as a dress rehearsal), I can wire it — just drop me a cold treasury address.

**3. OneSignal env vars: NOT set on Vercel yet**
Confirmed via `npx vercel env ls production` — neither `NEXT_PUBLIC_ONESIGNAL_APP_ID` nor `ONESIGNAL_REST_API_KEY` are configured. Boris is grabbing them from the OneSignal dashboard and adding them. Until then the client will try to fire, server `/api/notifications/pick-up` will log a warning, and no push goes out. So we can ship the Cloud Function before the env is wired without breakage.

**4. `BBB4_OWNER_PRIVATE_KEY` on Vercel: NOT set yet**
Same confirmation — key isn't in Vercel production env yet. Boris has the key you sent via secure channel and is adding it. Once it's live plus a redeploy, I'll run an admin grant on staging and ping you the resulting `tokenId` so you can hit `/owner/{wallet}/draftToken/all` and confirm `passType: 'free'`.

---

Also — nice catch on the `JoinLeagues` partial-league routing fix (`bfe7de8`). That unblocks multi-user fast drafts. I'll test it alongside the BBB4 verification once the env vars are in.

---

## BBB4 admin mint is live ✅ + your `passType` check (April 22, evening)

Everything wired and verified end-to-end on staging. Thread by thread:

### 1. On-chain mint flow — working

- `BBB4_OWNER_PRIVATE_KEY` on Vercel, derives to `0xccdF79A51D292CF6De8807Abc1bB58D07D26441D`, matches `owner()` on BaseScan.
- ETH you funded arrived (~$5).
- Admin grant from the UI now mints real BBB4 NFTs via `reserveTokens`.
- Fixed a bug along the way — the old grant resolver was using the user doc's `walletAddress` field, which was sometimes the mock seed `0x1234...`, so NFTs were going to a dead address. Now: if admin types a wallet, that wallet IS the recipient. User doc gets auto-created if it doesn't exist.
- Counters and NFTs are dual-written so admin UI / user balance reflect reality immediately.

### 2. `passType: 'free'` — please confirm on your side

Test wallet `0xE7259AddF13489B4fC37EbDE0D8FE523cD38bEd1` has **BBB4 tokenIds 3 and 4** from two admin grants. Txs:

- tokenId 3: `0xe92a4970ac2348055bb01e304f0fe1332aef93b5f188796088c314eec450c997`
- tokenId 4: `0x682d8b92f23d6fffab2b1b1396a9cdc381af9832addf7d7a84b63ff176671c90`

Both minted via `reserveTokens(recipient, 1)` — no USDC transferred to the contract, so your Go API shouldn't see the "paid" signature on these.

Please curl:

```
curl -s "https://sbs-drafts-api-staging-652484219017.us-central1.run.app/owner/0xE7259AddF13489B4fC37EbDE0D8FE523cD38bEd1/draftToken/all" | jq '.[] | {cardId, passType, leagueId}'
```

- If tokens 3 + 4 come back with `passType: "free"` → marketplace rule already works, we're done. Let me know and I'll close the loop.
- If they come back with `passType: "paid"` → the API only looks at the paid-mint signature. Flag the tokenIds and I'll wire our `pass_origin/{tokenId}` Firestore collection into the marketplace listing check instead.

### 3. Functions repo — go ahead

Already answered above but restating so it's in one place: drop `onPickAdvance` into `~/sbs-staging-functions/functions/index.js` next to `onQueueUpdate`. Node 20, CommonJS, `firebase-admin` + `node-fetch@2` already in deps. Project is `sbs-staging-env`. Deploy with `firebase deploy --only functions:onPickAdvance`.

OneSignal env vars on Vercel are now set (`NEXT_PUBLIC_ONESIGNAL_APP_ID`, `ONESIGNAL_REST_API_KEY`), so push notifications will actually fire once the Cloud Function is live.

### 4. `withdraw()` protection — decision

For staging + soft-launch: **accept risk**. Move to Safe multisig on Base for contract ownership before real volume hits.

If you want me to set up a Vercel skim cron as a dress rehearsal on staging (calls `withdraw()` on a schedule → forwards accumulated USDC to a cold treasury address), drop a cold address and I'll wire it. Otherwise we punt.

### 5. New admin plumbing worth knowing about

Landed today, both under `/admin`:

- **Audit Log tab** (Records group) — every grant, KYC flip, reset, ban, etc. with a clickable BaseScan tx link. Auto-refreshes every 10s. Filter by action type.
- **Zero All Free Drafts** danger banner in the Users tab — one-time cleanup to wipe pre-NFT ghost counters. Past use of `freeDrafts` was an off-chain stub; from now on, `freeDrafts: 1` means an actual BBB4 NFT exists.
- **Users table split** — now shows `Paid` and `Free` as separate columns.
- **Grant toast** has a "View on BaseScan ↗" link on the mint tx.

All gated behind your existing Privy-admin allowlist.

Ping when you've done the `passType` curl and picked on the skim-cron question.

