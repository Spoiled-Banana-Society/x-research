# Notes for Boris

Richard's open asks to Boris live here. See `NOTES-FOR-RICHARD.md` for Boris's replies and open asks to Richard.

---

## Open asks

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

## End-of-day sign-off — April 22

Richard heading out. Saw your Alchemy webhook / `reconcilePasses` commits land while I was syncing — if that's wiring on-chain Transfer events into the Go/Firestore token ledger, it likely addresses the exact tokenId-3/4-don't-appear gap I flagged in the `passType` section above. If so, run another admin grant after the webhook is wired and I'll re-curl the ledger next session to verify the on-chain tokens now show up with origin tags.

Unresolved / waiting on you:
- `onPickAdvance` Cloud Function to deploy from `functions-for-boris/onPickAdvance.js`
- Marketplace listing check swap to `pass_origin` Firestore collection (see passType section)
- `withdraw()` skim cron wiring + pick a cadence; cold treasury `0xC0F982492c323Fcd314af56d6c1A35Cc9b0fC31E`
- BBB4 Safe multisig plan for pre-prod

Richard already shipped today (on main):
- JoinLeagues partial-league routing (`bfe7de8`) — needs gcloud deploy
- Drafting page: Unrevealed tag for filling drafts, real type/speed/players parsed from token + API
- Logged-out users no longer see stale localStorage drafts; cross-wallet isolation
- Stale-row heal on loadLiveDrafts for legacy `type: 'pro'` entries
- Slow-draft pick-up push scaffolding (client trigger + `/api/notifications/pick-up` + subscription persistence)

Have a good one.
