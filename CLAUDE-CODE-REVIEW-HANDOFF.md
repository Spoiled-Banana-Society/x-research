# Claude Code review — handoff for dev approval

Prepared 2026-04-23 by Richard. The goal of this doc is to give you (the dev) enough context to decide whether Claude-authored changes over the last few days are safe to keep shipping. It's organized so you can skim in 10 minutes and read deeper on anything that looks off.

---

## What Claude touched (scope)

All commits tagged "Richard:" on the `richard` branch since 2026-04-19, plus one commit from a March cleanup session that shows up in this review because Codex flagged related code. Everything is merged into `main` now.

| Area | Files | What changed |
|---|---|---|
| Drafting page list | `repos/banana-fantasy/hooks/useDraftingPageState.ts` | Stopped hardcoding `status: 'drafting'` / `draftSpeed: 'fast'` / `players: 10` on every API-sourced draft. Now parses speed from `leagueId` ("-slow-" vs "-fast-"), fetches real player count + drafting-state per draft from `/api/drafts/league-players`, sets `type: null` while filling so UI shows "Unrevealed" instead of lying "PRO ✓ Verified". Also heals stale pre-fix localStorage rows on every load. Gates `activeDrafts` on `user.walletAddress` so logged-out users don't see cached drafts; filters `localDrafts` by `liveWalletAddress` so switching wallets in the same browser doesn't bleed placeholders. "Clear All" no longer pollutes `hiddenDraftIds` with reusable NFT `cardId`s. |
| Draft room live sync | `repos/banana-fantasy/hooks/useDraftLiveSync.ts` | Removed the 8hr slow-draft `pickLength` client workaround (Go API now returns 28800 correctly). Added `maybeFirePickUpPush` that fires a "your pick is up" push from WS `draft_info_update` and Firebase RTDB transitions, with a prev-drafter guard so initial snapshots / tab refreshes don't re-fire. Fixed the cross-tab heartbeat to write `Date.now()` per the contract the drafting page was reading (was writing a random ownership string). |
| Sidebar queue UX | `repos/banana-fantasy/components/drafting/DraftRoomDrafting.tsx` | Arrow-button reorder replaced with `@hello-pangea/dnd` drag-and-drop. `select-none` added to rows so mousedown doesn't start text selection before the 5px drag threshold. |
| History page | `repos/banana-fantasy/hooks/useHistory.ts` | `draftSpeed` parsed from `leagueId` instead of hardcoded `'fast'`. |
| Staging-mint dead code | `repos/banana-fantasy/hooks/useStagingDraft.ts` | Deleted (no callers, referenced deprecated `/staging/create-draft` endpoint). |
| Notifications | `repos/banana-fantasy/app/api/notifications/subscribe/route.ts`, `app/api/notifications/pick-up/route.ts` | `subscribe` now persists `{walletAddress, playerId}` to Firestore `notificationSubscriptions/{wallet}` behind a Privy auth + wallet-match check (was log-only and fully open). `pick-up` is a new endpoint that fires a OneSignal REST push targeted by the lowercased `walletAddress` tag, with atomic Firestore dedup via `doc.create()` and mark-then-send status so a transient OneSignal failure doesn't permanently poison retries. Both routes accept either an authed Privy user OR an `x-internal-secret` header for server-to-server callers. |
| Opt-in normalization | `repos/banana-fantasy/hooks/useNotificationOptIn.ts` | OneSignal `walletAddress` tag is now written lowercased so it matches the server-side filter. Was mixed-case at write, lowercase at send — targeting silently missed. |
| League-players proxy | `repos/banana-fantasy/app/api/drafts/league-players/route.ts` | Reads RTDB `numPlayers`, falls back to Go API `/state/info` when RTDB is stale (< 10 but Go shows draft started — covers the fill-bots path that doesn't update RTDB). Returns a proper 502 on failure instead of the previous 200-with-debug-string contract. |
| Slow-draft pickLength | `repos/sbs-drafts-api/models/draft-state.go` | `60 * 8` → `3600 * 8`. Backend was returning 480s (8 min) instead of 28800s (8 hours) for slow drafts. One-line unit-confusion fix. |
| Multi-user league routing | `repos/sbs-drafts-api/models/leagues.go` | New `scanForPartialLeague` walks backwards from `DraftLeagueTracker`'s per-speed counter (up to 30 positions) looking for the lowest partially-filled league the caller isn't already in, uses it as `AddCardToLeague`'s starting point. The tracker counter drifts in practice (fill-bots paths, aborted fills) and leaves partials stranded; two real users would land in separate empty leagues. Inner transaction's dup-join check is unchanged. `AddCardToLeague` returns `max(expectedDraftNum, currentDraftNum)` so multi-token joins don't regress their search floor after a backfill. |
| Cloud Function (for you / Boris to deploy) | `functions-for-boris/onPickAdvance.js` | Firebase RTDB `onUpdate` trigger on `drafts/{id}/realTimeDraftInfo`. Fires when `currentDrafter` changes for a slow draft (pickLength > 3600s). Skips bot drafters, initial snapshots, and draft-complete/closed states. POSTs to `/api/notifications/pick-up` with `x-internal-secret`. Covers the tab-closed case that the client-side trigger can't. |

---

## Build / type / lint status

- `tsc --noEmit` exits clean (0 errors).
- `next build` completes with the same Sentry-opentelemetry dynamic-require warnings that exist on `main` before any of my changes (tracked in the repo, not mine). All routes compile; dynamic route table includes `/api/notifications/pick-up` and `/api/notifications/subscribe`.
- Go files — I don't have `go` installed locally. The Go diffs are small and self-contained (one unit fix in draft-state.go + a new helper + counter floor in leagues.go), please `go vet` + `go test` on your side before accepting.

## Playwright

`npx playwright test e2e/draft-room.spec.ts --project=chromium` currently reports **12 failed / 1 passed** on my machine. Every failure I investigated was a cold-compile-timing failure — the test does `page.goto` + asserts visibility within 10s, and on a cold `npm run dev` the first compile takes longer than that. The page snapshots attached to the failures show the expected content rendering correctly; only the assertion timeouts fire. None of the failures touch the functions I changed.

**I don't want to hand-wave this.** If you want a clean signal, either:

1. Run the suite against the deployed staging URL instead of a fresh local dev: `BASE_URL=https://banana-fantasy-sbs.vercel.app npx playwright test e2e/draft-room.spec.ts --project=chromium`. That skips the cold-compile-first-request window.
2. Pre-warm locally: start `npm run dev`, load `/drafting` once in a browser to trigger initial compile, then run the suite with `reuseExistingServer: true` in the config.

I did NOT run the Chrome-extension-based browser smoke flow — the extension wasn't connected at review time. Worth running these manually on staging after the latest deploy lands:

- `/drafting` while logged out → empty list
- `/drafting` while logged in with a wallet that has partially-filled drafts → each row shows correct speed ("30 sec" vs "8 hour"), correct player count ("N/10"), "Unrevealed" pill while filling, real type + Verified badge after reveal
- Sidebar queue in `/draft-room` → grab a row, drag to reorder, release, verify order persists and syncs to engine
- Slow draft room → timer shows 08:00:00-ish countdown (8hr), not a minute-scale countdown

## Codex review

I ran Codex on the full scope before merging. Its findings drove most of the cleanup in the most recent commit. Findings that are closed:

- Heartbeat contract mismatch (drafting page parsed as timestamp, draft room wrote random string) — fixed.
- `maybeFirePickUpPush` firing on initial snapshots — fixed with prev-drafter guard.
- `pick-up` and `subscribe` routes fully open to unauthenticated callers — fixed via Privy auth + optional internal-secret.
- `pick-up` dedup was read-then-write race with write-before-send poisoning — fixed with atomic `doc.create()` + mark-then-send.
- OneSignal wallet tag case-mismatch — fixed via lowercase at opt-in.
- `league-players` 200-with-debug-string failure contract — fixed.
- `leagues.go` counter regression on multi-token joins after backfill — fixed with `max(expectedDraftNum, currentDraftNum)`.
- Cloud Function spoofable call pattern — fixed by requiring `x-internal-secret`.
- Cloud Function `draftName` never present in RTDB — removed.
- Dead locals in `useDraftLiveSync.ts` — removed.

Findings I chose NOT to fix in this pass (noted here rather than silently):

- **Cross-wallet background sync in `useDraftingPageState.ts`**. The file has multiple background loops (fill poller line 445-472, REST sync line 480-484, per-draft WS at line 642-644) that iterate over `localDrafts` without filtering by the currently-authenticated wallet. If a user switches accounts in the same tab, those loops continue operating on the previous wallet's drafts until a full remount. `activeDrafts` itself IS wallet-filtered post-fix, so the USER SEES the right list — but the background loops still make requests keyed to the wrong wallet for a tick. The right fix is to gate each loop on `user?.walletAddress === d.liveWalletAddress`. **I want you to decide the shape of that fix** because it touches three loops + a WS connection cache and I'd rather not land a hasty pattern. **Visible surface:** small — on wallet switch you'd see one cycle of stale promo-tracking requests fire for the old wallet's drafts before the new mount takes over. Not data corruption.
- **`league-players` route's hardcoded staging Go API URL as fallback**. Codex flagged this as "a production deploy will read staging draft state." True in principle. Practically, per CLAUDE.md the entire app is pointed at staging Cloud Run today (`isStagingMode()` always true, single Vercel deployment). When you actually stand up a prod Vercel deploy, set `NEXT_PUBLIC_STAGING_DRAFTS_API_URL` explicitly to the prod URL OR gate the fallback behind an env flag. I didn't want to invent an env-handling pattern that doesn't match how you organize prod config. **Suggested shape:** remove the default entirely, require the env var at build time, let Vercel's env-var system per-environment handle it. One-liner in `app/api/drafts/league-players/route.ts:4-5`.
- **`subscribe` route + `pick-up` route use different sources of truth**. `subscribe` persists `playerId` to Firestore. `pick-up` targets by OneSignal tag, doesn't read from Firestore. So the Firestore record is a write-only audit log today, not the canonical subscription state. That's OK for now (tags are simpler and OneSignal is the truth), but if you want the Firestore record to matter, either (a) switch `pick-up` to resolve `playerId` from Firestore and target by ID instead of tag, or (b) delete the Firestore persistence. Your call.

## Waiting on Boris (not Claude scope)

Listed so you know what's in flight:

- Deploy the `scanForPartialLeague` + counter-floor fix on `sbs-drafts-api-staging` (gcloud).
- Deploy the `onPickAdvance` Cloud Function to `sbs-staging-functions` and set its config for `endpoint` + `secret`. Set the matching `NOTIFICATIONS_INTERNAL_SECRET` on the Vercel deploy.
- Set `NEXT_PUBLIC_ENVIRONMENT=staging` on Vercel. Unblocks the staging-mint button — unrelated to my code; Boris shipped the gate without the matching env var.
- BBB4 multisig plan pre-prod (ops wallet key currently sits in `BBB4_OWNER_PRIVATE_KEY`; skim cron is wired to `0xC0F982...` as the dress rehearsal but we'll move to a Safe before real volume).

## Data / contract assumptions worth checking

- `leagueId` format `2024-{speed}-draft-{N}` where `{speed}` is `fast` or `slow`. Used as a signal in multiple places (drafting page speed parse, `scanForPartialLeague`'s draftId formatter). If this format ever changes on the Go side, grep for `'-slow-'` / `'-fast-'` and `"2024-%s-draft-"` to audit.
- RTDB schema `drafts/{id}/realTimeDraftInfo` expected to have `{ currentDrafter, currentPickNumber, pickLength, isDraftComplete?, isDraftClosed? }`. The Cloud Function and `useDraftLiveSync.ts` both read these. `displayName` is no longer assumed.
- OneSignal app tag `walletAddress` is lowercased at write (opt-in) and at send (filter). If you want to support historical mixed-case tags, add an OR filter in `pick-up`.
- Privy `getPrivyUser(req)` returns `{ userId, walletAddress: string | null }`. Both notification routes treat a null walletAddress as 401.

## Commits worth reading in order

1. `3437239` — slow-draft pickLength fix + frontend workaround removal (start here for the whole pickLength story).
2. `bfe7de8` + the final counter-floor tweak in `bf1ca2f` — leagues.go routing.
3. `1cf655a` → `5658bf1` → `45ab726` → `5537d68` → `bf1ca2f` — the drafting-page story, in order of stacking. The last one (bf1ca2f) has the Codex-response cleanup.
4. `d380902` + `bf1ca2f` — notification system, scaffolding to hardened.
5. `functions-for-boris/onPickAdvance.js` at current state — the Cloud Function (not yet deployed by Boris).

Any of these I'm happy to walk through live.

— Richard (via Claude)
