# Notes for Boris

Richard's open asks to Boris live here. See `NOTES-FOR-RICHARD.md` for Boris's replies and open asks to Richard.

---

## Open asks

### Set `NEXT_PUBLIC_ENVIRONMENT=staging` on Vercel (April 23)

Commit `58b5bcd` added a prod-safety gate to `app/api/purchases/staging-mint/route.ts`:

```ts
if (process.env.NEXT_PUBLIC_ENVIRONMENT !== 'staging') {
  return jsonError('Not available in this environment', 403);
}
```

The gate is good, but the matching env var was never set on the `banana-fantasy-sbs` Vercel deploy — so the STAGING MINT button on the homepage now returns `Error: Not available in this environment`. Shipped the lock without shipping the key.

**Fix:** Vercel dashboard → banana-fantasy project → Settings → Environment Variables → add `NEXT_PUBLIC_ENVIRONMENT=staging` for Production (and Preview if you want staging mints to work on PR previews too) → trigger a redeploy (or let the next deploy pick it up).

Only unblocks the staging-mint button. Nothing else depends on this var today.

### Slow-draft "your pick is up" push — Firebase Cloud Function (April 22)

Richard shipped the client-side scaffolding + `/api/notifications/pick-up` endpoint. Covers the "another player has the page open" case but not the common "user closed the tab hours ago" case.

Needs a Firebase Cloud Function on `sbs-staging-env` that watches `drafts/{draftId}/realTimeDraftInfo` (RTDB) and POSTs to `/api/notifications/pick-up` when `currentDrafter` changes. Pseudo-code in the Firebase v1 API:

```js
exports.onPickAdvance = functions.database
  .ref('drafts/{draftId}/realTimeDraftInfo')
  .onUpdate(async (change, ctx) => {
    const before = change.before.val();
    const after = change.after.val();
    if (!after || before?.currentDrafter === after.currentDrafter) return;
    if (after.isDraftComplete || after.isDraftClosed) return;
    if ((after.pickLength ?? 30) <= 60) return; // slow drafts only
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

Repo: `~/sbs-staging-functions/functions/index.js` — drop next to existing `onQueueUpdate`. Deploy: `firebase deploy --only functions:onPickAdvance`.

Deduping on the server side is already handled via `notificationsSent/{wallet}__{draftId}__{pickNumber}` so it's safe to call from both client and Cloud Function.

**Written for you.** Full source at `functions-for-boris/onPickAdvance.js` in this workspace — copy into `~/sbs-staging-functions/functions/` and deploy. Adds a `bot-` owner guard (don't push to bot wallets) and a configurable `PICK_UP_ENDPOINT` env var for staging-vs-prod swapping. Uses `node-fetch@2` and `firebase-functions` v1 style — matches what you said is already in `sbs-staging-functions` deps.

---

## `passType` verification result (April 22)

Curled `0xE7259AddF13489B4fC37EbDE0D8FE523cD38bEd1` per your request. Neither tokenId 3 nor tokenId 4 from your admin grants appears in the Go API's `/owner/.../draftToken/all` response, and **no `passType` field is returned at all** — not "free", not "paid", just absent. Example response entry:

```json
{ "_draftType": "", "_cardId": "1776199785532", "_level": "Pro" }
```

Two findings:
1. The Go API's `cardId` values are Firestore-generated timestamps (`1776199785532`...), not the on-chain NFT `tokenId` (3, 4, ...). So admin-minted on-chain tokens don't appear to be registered in the Go token ledger for this wallet.
2. `passType` isn't in the response schema at all.

**Action for you:** wire `pass_origin/{tokenId}` Firestore collection into the marketplace listing check (`components/marketplace/SellTab.tsx:123` and `app/marketplace/page.tsx:331`) — the API-based check can't work as-is.

Separate (and probably dev-territory) question: should admin-minted on-chain tokens also land in the Go API's per-wallet token list? Today they don't. If they should, it's a Go API write path that needs adding. If they shouldn't (by design), the marketplace just leans on `pass_origin` and we're done.

---

## `withdraw()` skim — green-lit, here's the address

Go ahead and wire the Vercel cron / Cloud Scheduler skim on staging as the dress rehearsal. Cold treasury address to receive the sweeps:

```
0xC0F982492c323Fcd314af56d6c1A35Cc9b0fC31E
```

(Base mainnet EOA, Richard-controlled, not on any server.)

This is changeable later — just a config/env var swap + cron redeploy, no on-chain move needed. Pick whatever cadence makes sense (hourly is a reasonable starting point for staging dress rehearsal; we'll tune before prod).

Still planning Safe multisig for pre-prod — the skim cron is the staging test run, not the final answer for prod volume.

---

## April 22 evening — ack on your 4-item shipment

Saw all four land. Thanks — huge night.

- **JoinLeagues revision 00054-6x7**: noted, multi-user fast drafts should land together now.
- **onPickAdvance Cloud Function live**: slow-draft push path is fully end-to-end — client trigger on drafts with tabs open, server trigger on closed-tab users. Will verify next session with a real slow-draft pick transition.
- **Marketplace `pass_origin` overlay via `/api/pass-origin/free-tokens`**: clean solve, skips the Go `passType` field entirely. Didn't touch `SellTab.tsx:123` — good, since the overlay keeps the existing check site working.
- **USDC skim cron**: hourly at `/api/crons/skim-bbb4-usdc` → BBB4.withdraw() → transfer to `0xC0F982492c323Fcd314af56d6c1A35Cc9b0fC31E`. Audit in Firestore `bbb4_usdc_sweeps`. Noted the CRON_SECRET auth.
- **Bonus reconciler (`d29afd1`)**: `reserveTokens` mints auto-register into `owners/{wallet}/validDraftTokens` via `/draftToken/mint`. Appreciated.

### `passType` re-curl result

Did the sanity re-curl on `0xE7259AddF13489B4fC37EbDE0D8FE523cD38bEd1`. Still no `passType` field returned, and on-chain tokenIds 3/4 still don't appear in the Go ledger for this wallet — only the pre-existing timestamp `cardId`s. That's consistent with your note that the reconciler catches future mints and historical ones need the admin **Sync** button clicked or a fresh grant. Not a problem — marketplace no longer depends on it. Noting for your awareness; we can clean up the test wallet's history on your next admin pass if you want completeness.

### BBB4 Safe multisig — pre-prod plan

Ack, non-urgent. Ping when you want to start the setup — I'll create the Safe (likely 2/3 with you + me + a recovery signer), transfer BBB4 ownership to it, and we migrate the admin-mint flow to route through the Safe's module/delegate path at that point. Staging skim cron is good enough until then.

Nothing blocking on my side. Richard out for the day.
