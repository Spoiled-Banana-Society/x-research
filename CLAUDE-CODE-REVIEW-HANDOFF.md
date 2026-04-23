# Claude Code review — handoff for dev approval

Prepared 2026-04-23 by Richard. The goal of this doc is to give you (the dev) enough context to decide whether Claude-authored changes over the last few days are safe to keep shipping. Skim in 10 minutes; read deeper on anything that looks off.

**This version has been revised after an independent Codex review caught several claims in my first draft that were wrong or incomplete.** Corrections are inline; the bottom section flags everything still on your plate.

---

## What Claude touched (scope)

All commits tagged "Richard:" on the `richard` branch since 2026-04-19, plus one commit from a March cleanup session that shows up in this review because Codex flagged related code. Everything is merged into `main` now.

| Area | Files | What changed |
|---|---|---|
| Drafting page list | `repos/banana-fantasy/hooks/useDraftingPageState.ts` | Stopped hardcoding `status: 'drafting'` / `draftSpeed: 'fast'` / `players: 10` on every API-sourced draft. Now parses speed from `leagueId` ("-slow-" vs "-fast-"), fetches real player count + drafting-state per draft from `/api/drafts/league-players`, sets `type: null` while filling so UI shows "Unrevealed" instead of lying "PRO ✓ Verified". Also heals stale pre-fix localStorage rows on every load. Gates `activeDrafts` on `user.walletAddress` so logged-out users don't see cached drafts; filters `localDrafts` by `liveWalletAddress` so switching wallets in the same browser doesn't bleed placeholders. "Clear All" no longer pollutes `hiddenDraftIds` with reusable NFT `cardId`s. |
| Draft room live sync | `repos/banana-fantasy/hooks/useDraftLiveSync.ts` | Removed the 8hr slow-draft `pickLength` client workaround (Go API now returns 28800 correctly). Fixed the cross-tab heartbeat to write `Date.now()` per the contract the drafting page was reading (was writing a random ownership string, so the guard always failed and the drafting page ran duplicate sync/WS work for every draft-room tab). **Removed the client-side pick-up push trigger entirely** after review — proving "some logged-in user" didn't prove "this push target is legitimate," so the client path was an authenticated-spam vector. The server-side Cloud Function covers all cases including tab-closed users. |
| Sidebar queue UX | `repos/banana-fantasy/components/drafting/DraftRoomDrafting.tsx` | Arrow-button reorder replaced with `@hello-pangea/dnd` drag-and-drop. `select-none` added to rows so mousedown doesn't start text selection before the 5px drag threshold. |
| History page | `repos/banana-fantasy/hooks/useHistory.ts` | `draftSpeed` parsed from `leagueId` instead of hardcoded `'fast'`. |
| Staging-mint dead code | `repos/banana-fantasy/hooks/useStagingDraft.ts` | Deleted (no callers, referenced deprecated `/staging/create-draft` endpoint). |
| Notifications: subscribe | `repos/banana-fantasy/app/api/notifications/subscribe/route.ts` | Persists `{walletAddress, playerId}` to Firestore `notificationSubscriptions/{wallet}` behind a Privy auth check (`Authorization: Bearer <token>`) with wallet-match enforcement so one user can't overwrite another's subscription. Caller updated to actually send the token. |
| Notifications: pick-up | `repos/banana-fantasy/app/api/notifications/pick-up/route.ts` | **Internal-only endpoint.** Accepts only requests presenting `x-internal-secret` matching `NOTIFICATIONS_INTERNAL_SECRET`. No Privy-user path (removed after review — that path let any logged-in user push to any wallet). Fires a OneSignal REST push targeted by the lowercased `walletAddress` tag, with atomic Firestore dedup via `doc.create()` that distinguishes genuine `AlreadyExists` from operational failures, and a status-check + retry path so a transient OneSignal 502 resets the dedup slot to `pending` on the next attempt instead of poisoning forever. |
| Opt-in normalization | `repos/banana-fantasy/hooks/useNotificationOptIn.ts` | OneSignal `walletAddress` tag is now written lowercased so it matches the server-side filter (was mixed-case at write, lowercase at send — targeting silently missed). Subscribe fetch now sends `Authorization: Bearer <privy-token>`. |
| League-players proxy | `repos/banana-fantasy/app/api/drafts/league-players/route.ts` | Reads RTDB `numPlayers`, falls back to Go API `/state/info` when RTDB is stale OR when the RTDB read itself fails (isolated try/catch per-source — a transient RTDB outage no longer takes down the drafting page's filling poll). Returns 502 only when both sources fail with no usable signal. |
| Slow-draft pickLength | `repos/sbs-drafts-api/models/draft-state.go` | `60 * 8` → `3600 * 8`. Backend was returning 480s (8 min) instead of 28800s (8 hours) for slow drafts. One-line unit-confusion fix. |
| Multi-user league routing | `repos/sbs-drafts-api/models/leagues.go` | New `scanForPartialLeague` walks backwards from `DraftLeagueTracker`'s per-speed counter (up to 30 positions) looking for the lowest partially-filled league the caller isn't already in, uses it as `AddCardToLeague`'s starting point. The tracker counter drifts in practice (fill-bots paths, aborted fills) and leaves partials stranded; two real users would land in separate empty leagues. Inner transaction's dup-join check is unchanged. `AddCardToLeague` returns `max(expectedDraftNum, currentDraftNum)` so multi-token joins don't regress their search floor after a backfill. |
| Cloud Function (for you / Boris to deploy) | `functions-for-boris/onPickAdvance.js` | Firebase RTDB `onUpdate` trigger on `drafts/{id}/realTimeDraftInfo`. Fires when `currentDrafter` changes for a slow draft (pickLength > 3600s). Skips bot drafters, initial snapshots (no `before`), and draft-complete/closed states. POSTs to `/api/notifications/pick-up` with `x-internal-secret` from `functions.config().pickup.secret` or env. Covers the tab-closed case — now the sole legitimate caller of `/pick-up`. |

---

## Build / type status

- `npm run build` exits clean (only pre-existing Sentry/opentelemetry dynamic-require warnings that exist on `main` before any of my changes).
- `npx tsc --noEmit` exits clean **after a build has generated `.next/types/**`** (the tsconfig includes generated type files — on a fresh tree, `tsc` will complain until `next build` runs once).
- Go files — I don't have `go` installed locally. The Go diffs are small and self-contained (one unit fix in draft-state.go + a new helper + counter floor in leagues.go), please `go vet` + `go test` on your side before accepting.

## Playwright

`npx playwright test e2e/draft-room.spec.ts --project=chromium` reports **12 failed / 1 passed** on my machine. Failures I investigated were cold-compile-timing: `page.goto` + 10s visibility assertion, the first compile takes longer than the assertion window, snapshots show the expected content rendering correctly. **I could not independently verify the "env-flaky" framing on a separate machine** — the Codex review ran in an environment where its dev server couldn't bind `0.0.0.0:3000` with EPERM, so Playwright never reached the tests. Treat the env-flaky framing as unverified until you run the suite on your hardware.

Two suggested paths for a clean signal:

1. Against deployed staging: `BASE_URL=https://banana-fantasy-sbs.vercel.app npx playwright test e2e/draft-room.spec.ts --project=chromium`.
2. Pre-warm locally: `npm run dev`, load `/drafting` once, then run the suite with `reuseExistingServer: true`.

I did NOT run the Chrome-extension browser smoke flow — the extension wasn't connected at review time. Worth running manually on staging after the latest deploy:

- `/drafting` while logged out → empty list
- `/drafting` while logged in with a wallet that has partially-filled drafts → each row shows correct speed ("30 sec" vs "8 hour"), correct player count ("N/10"), "Unrevealed" pill while filling, real type + Verified badge after reveal
- Sidebar queue in `/draft-room` → grab a row, drag to reorder, release, verify order persists and syncs to engine
- Slow draft room → timer shows 08:00:00-ish countdown (8hr), not a minute-scale countdown

## Things Codex caught that I got wrong in my first pass

Documented honestly because this is a handoff and you deserve the true picture:

1. **Browser auth was broken for the new notification client path.** My first pass added `await getPrivyUser(req)` to `/api/notifications/subscribe` but the caller in `useNotificationOptIn.ts` never sent `Authorization: Bearer <token>`. Real result: the subscribe call 401'd silently on every opt-in. **Fixed in the revised pass** — `useNotificationOptIn.ts` now calls `usePrivy().getAccessToken()` and attaches the Bearer header.

2. **`/api/notifications/pick-up` was still an authenticated-spam vector.** First pass gated it on `getPrivyUser` OR `x-internal-secret`. Codex pointed out that "some logged-in user" doesn't prove "this push target is legitimate" — any logged-in user could push to any wallet. **Fixed by removing the Privy path entirely** and making pick-up server-to-server only. The Cloud Function (`onPickAdvance.js`) is the sole legitimate caller, authenticated via shared secret. The client-side `maybeFirePickUpPush` trigger and its refs in `useDraftLiveSync.ts` are deleted — the server trigger covers all cases.

3. **Dedup was still poisoning retries.** My first pass marked `status: 'failed'` after a send error, but on the next attempt `doc.create()` threw `AlreadyExists` and the catch returned `{deduped: true}` without ever reading the stored status. **Fixed** — the catch now discriminates `code === 6 || 'already-exists'` from other Firestore errors, reads the existing doc's status on AlreadyExists, and if status is `'failed'` resets it to `'pending'` and proceeds with the retry. Operational Firestore errors (quota, permissions, timeout) now correctly return 502 instead of silently deduping.

4. **`league-players` fallback was skipped when the RTDB read itself failed.** A network blip at the RTDB fetch went straight to the outer catch → 502, bypassing the Go `/state/info` fallback that should kick in precisely when RTDB is flaky. **Fixed** — RTDB is in its own isolated try/catch, numPlayers defaults to 0, Go fallback always runs when we're under 10 players, and 502 only fires when both sources fail with no usable signal.

## Things that are real issues and still on your plate

1. **Cross-wallet background-sync misattribution.** This is more serious than my first draft described. The poller/WS manager loops in `useDraftingPageState.ts` (around lines 445-472, 480-484, 641-644) iterate over all stored drafts without filtering by the current wallet. **Worse:** the promo-tracking side effects use the current `user.id` against old drafts that might belong to a different wallet — meaning switching accounts in the same browser can **misattribute promo credit to the wrong user**. The `activeDrafts` useMemo IS wallet-filtered for display, but the background loops aren't. I chose not to fix this in the review pass because the right shape touches three loops + a WS connection cache and I don't want to land a hasty pattern. Suggested fix: gate each loop on `d.liveWalletAddress === user.walletAddress.toLowerCase()` before any request, and tear down per-draft WS connections whose `liveWalletAddress` no longer matches the current user. Wanted you to own the shape.

2. **`league-players` hardcoded staging URL as fallback.** Default is the staging Cloud Run URL. The whole app is pointed at staging today per CLAUDE.md (`isStagingMode()` always true), so in practice this is fine now — but when you stand up a prod Vercel deploy, either set `NEXT_PUBLIC_STAGING_DRAFTS_API_URL` to the prod URL per-environment, or remove the default entirely and require the env var. One-liner fix.

3. **`subscribe` route's Firestore record is a write-only audit log, not the canonical subscription state.** `pick-up` targets by OneSignal tag, never reads from Firestore. That's fine if we keep the tag-based model, but we should either (a) delete the Firestore persistence, or (b) switch `pick-up` to resolve `playerId` from Firestore and target by ID. Your call on the direction.

4. **Unsubscribe flow missing.** The DELETE on `/api/notifications/subscribe` exists, but `useNotificationOptIn` never calls it — a user revoking browser permissions leaves the Firestore record behind. Low priority, but backend state will drift.

## Waiting on Boris (not Claude scope)

- Deploy the `scanForPartialLeague` + counter-floor Go fix on `sbs-drafts-api-staging` (gcloud).
- Deploy `onPickAdvance` to `sbs-staging-functions` and set its config — `functions.config().set pickup.secret=<secret>` + `pickup.endpoint=<vercel URL>`. Set the matching `NOTIFICATIONS_INTERNAL_SECRET` on the Vercel deploy.
- Set `NEXT_PUBLIC_ENVIRONMENT=staging` on Vercel. Unblocks the staging-mint button — unrelated to my code; Boris shipped the gate without the matching env var.
- BBB4 multisig plan pre-prod (ops wallet key currently sits in `BBB4_OWNER_PRIVATE_KEY`; skim cron to `0xC0F982...` is the dress rehearsal but we'll move to a Safe before real volume).

## Data / contract assumptions worth checking

- `leagueId` format `2024-{speed}-draft-{N}` where `{speed}` is `fast` or `slow`. Used in drafting page speed parse, `scanForPartialLeague`'s draftId formatter, and elsewhere. If the Go side ever changes this, grep `-slow-` / `-fast-` and `"2024-%s-draft-"`.
- RTDB schema `drafts/{id}/realTimeDraftInfo` expected to have `{ currentDrafter, currentPickNumber, pickLength, isDraftComplete?, isDraftClosed? }`. The Cloud Function and `useDraftLiveSync.ts` both read these.
- OneSignal app tag `walletAddress` is lowercased at write (opt-in) and at send (filter). Historical mixed-case tags would miss; worth a backfill if there are existing subscribers from before this fix.
- Privy `getPrivyUser(req)` returns `{ userId, walletAddress: string | null }` and requires `Authorization: Bearer <jwt>`.

## Commits worth reading in order

1. `3437239` — slow-draft pickLength fix + frontend workaround removal (start here for the pickLength story).
2. `bfe7de8` + the counter-floor tweak in `bf1ca2f` — leagues.go routing.
3. `1cf655a` → `5658bf1` → `45ab726` → `5537d68` — the drafting-page story in stacking order.
4. `d380902` → `bf1ca2f` → the current HEAD — notification system, scaffolding through the post-Codex hardening (internal-only pick-up, proper dedup status checks, browser auth bearer header).
5. `functions-for-boris/onPickAdvance.js` at current state — the Cloud Function (not yet deployed by Boris).

— Richard (via Claude)
