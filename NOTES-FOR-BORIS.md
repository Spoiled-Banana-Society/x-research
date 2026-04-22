# New Git Workflow — Personal Branches

We switched to personal branches so we can both work at the same time without overwriting each other.

## What Changed
- You now have your own branch: `boris`
- Richard has his own branch: `richard`
- **Never commit directly to `main`** — main only gets merges when deploying

## Your New Workflow

### Start of session:
```bash
cd ~/sbs-claude-shared-workspace
git fetch origin
git checkout boris
git pull origin boris
git merge origin/main --no-edit
```

### End of session:
```bash
cd ~/sbs-claude-shared-workspace
git add -A
git commit -m "Boris: <what you did>"
git push origin boris
```

### To deploy:
```bash
git fetch origin && git merge origin/main --no-edit
git checkout main && git pull origin main
git merge boris --no-edit && git push origin main
git checkout boris
```
Then sync to sbs-frontend-v2 and trigger deploy hook (see CLAUDE.md for full steps).

## Why
We were both pushing to main and overwriting each other. Personal branches mean your pushes never conflict with mine. We only merge when deploying.

---

# Notes for Boris — April 22, 2026

## Slow-draft "your pick is up" push — need a Firestore trigger for tab-closed users

I shipped client-side scaffolding + a server endpoint so that whenever a slow-draft pick advances, any tab connected to that draft fires a OneSignal push targeted at the next drafter's wallet tag. Works when someone's watching. Doesn't work for the common slow-draft case — user closed the tab hours ago, no client sees the transition.

The missing piece is a **Firebase Cloud Function** on `sbs-staging-env` that listens to `drafts/{draftId}/realTimeDraftInfo` (RTDB) and POSTs to `/api/notifications/pick-up` when `currentDrafter` changes.

Pseudo-code:

```ts
import * as functions from 'firebase-functions';
import fetch from 'node-fetch';

export const onPickAdvance = functions.database
  .ref('drafts/{draftId}/realTimeDraftInfo')
  .onUpdate(async (change, ctx) => {
    const before = change.before.val();
    const after = change.after.val();
    if (!after || before?.currentDrafter === after.currentDrafter) return;
    if (after.isDraftComplete || after.isDraftClosed) return;

    // Only fire for slow drafts (pickLength > 60).
    if ((after.pickLength ?? 30) <= 60) return;

    await fetch('https://banana-fantasy-sbs.vercel.app/api/notifications/pick-up', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        walletAddress: after.currentDrafter,
        draftId: ctx.params.draftId,
        pickNumber: after.currentPickNumber,
        pickLengthSeconds: after.pickLength,
      }),
    });
  });
```

The `/api/notifications/pick-up` endpoint I added dedups via Firestore (`notificationsSent/{wallet}__{draftId}__{pickNumber}`) — safe to call from both client and a Cloud Function without double-firing.

### What's already done on the frontend

- `/api/notifications/subscribe` now persists `{ walletAddress, playerId, updatedAt }` to Firestore `notificationSubscriptions/{walletAddress}`.
- `/api/notifications/pick-up` endpoint: POST `{ walletAddress, draftId, draftName?, pickNumber, pickLengthSeconds }` → fires OneSignal push with TTL = pickLength.
- Client trigger in `useDraftLiveSync.ts` — on every WS `draft_info_update` and RTDB state change, if speed=slow and next drafter isn't us, calls the endpoint. Covers the "another player had the page open" case.

### Env vars already needed on Vercel

```
NEXT_PUBLIC_ONESIGNAL_APP_ID
ONESIGNAL_REST_API_KEY
```

(Same vars used by existing `/api/notifications/draft-reminder`.)

### Want me to write the Cloud Function?

Point me at the functions repo and I'll drop the full file. Didn't want to guess where it lives on your machine — memory says `~/Downloads/SBS-Backend-main` is old dev drop (read-only), and `~/sbs-staging-functions/` was mentioned for queue handlers.

---

## BBB4 ownership — handled, key sent separately

Richard decided against a fresh ops-wallet handoff. The wallet that currently owns BBB4 is a clean account (no other ERC-20s, NFTs, or ETH beyond gas), so we're using it directly as the ops wallet. **No `transferOwnership` call needed.**

**Richard sent you the owner wallet's private key via secure channel** (not in this file — do not paste it here or anywhere in git). Verify the key matches the `owner()` return from BaseScan on `0x14065412b3A431a660e6E576A14b104F1b3E463b` before doing anything with it.

### Next steps on your side

1. Paste the key into Vercel env as `BBB4_OWNER_PRIVATE_KEY` (Production at minimum; Preview too if you want free-mint flows to work on PR previews).
2. Redeploy Vercel or wait for the next natural deploy.
3. Run one admin grant on staging to verify end-to-end minting.
4. Ping Richard with the resulting tokenId from BaseScan so he can curl `/owner/{wallet}/draftToken/all` and confirm `passType: "free"` on the returned token (your April 22 ask #2).

### `withdraw` exposure — still need a plan

Once the key is live in Vercel, anything with env-var access (you + Vercel infra) can call `withdraw()` on BBB4 and drain the contract's accumulated USDC balance to the owner wallet. That's user money ($25 per pass), not Richard's.

Mitigation options we haven't picked yet:

- **Skim cron**: a Vercel cron or Cloud Scheduler that calls `withdraw()` on a schedule and forwards the USDC to a cold treasury address. Blast radius = whatever accumulated between skims.
- **Accept the risk** for staging/soft-launch, commit to a multisig handoff before real volume.
- **Skim manually** — Richard calls withdraw from MetaMask periodically and moves USDC to a cold wallet.

Tell Richard which you prefer and he'll set up the cold address / cron / whatever is needed.

## `passType: 'free'` verification

Still blocked until you deploy the key + run one admin grant. Covered in the next steps above.
