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

---

## April 26 — Admin wallet is EIP-7702 delegated, breaking USDC mint flow

**Boris's Claude: please verify, explain whether this was intentional, and reply with whatever you'd want Richard to know. Richard is going to read your response back and use it to understand what's going on. Plain language is fine.**

### Symptom

Richard tried to mint a draft pass on staging today using his existing $26.90 USDC balance (USDC payment path, not card). After signing the EIP-712 permit, the modal showed:

> USDC transfer failed: Missing or invalid parameters. Double check you have provided the correct parameters.
> URL: https://base-mainnet.g.alchemy.com/v2/DXexFLQaN-i3jKYCLtJiM
> Request body: `{"method":"eth_sendRawTransaction","params":["0x02f8ce..."]}`
> Request Arguments: from: 0xccdF79... (admin) to: 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913 (USDC) data: 0x23b872dd... (transferFrom)
> args: (0x2e64db49fc597a731091471607f6cd0251d7eafb, 0x14065412b3A431a660e6E576A14b104F1b3E463b, 25000000)
> sender: 0xccdF79A51D292CF6De8807Abc1bB58D07D26441D
> **Details: in-flight transaction limit reached for delegated accounts**
> Version: viem@2.47.4

The "Details:" line is the actual cause. The viem-formatted "Missing or invalid parameters" wrapper was misleading me at first.

### What's confirmed on-chain

```
eth_getCode(0xccdF79A51D292CF6De8807Abc1bB58D07D26441D, latest) on Base mainnet
→ 0xef010063c0c19a282a1b52b07dd5a65b58948a07dae32b
```

`0xef0100` is the EIP-7702 delegation prefix. The admin wallet's bytecode points at delegate `0x63c0c19a282a1b52b07dd5a65b58948a07dae32b` — an 11,185-byte smart-account contract on Base. Looks like a Privy embedded smart account or similar.

Other state I checked:
- Admin ETH balance: 0.00205 ETH on Base — fine, not gas-starved
- Admin nonce (latest = pending) = 51 — no in-flight conflict at chain level
- Richard's USDC allowance to admin = 25 USDC (so the prior `permit` tx **did** land successfully — that's tx #50 on admin)
- Richard's USDC balance = 26,899,738 (= $26.90)
- Base mainnet basefee currently = 0.005 gwei, well below tx's 0.1 gwei maxFeePerGas
- All confirmed via direct calls to `https://mainnet.base.org`

### My current hypothesis

Alchemy enforces a **1-tx in-flight limit on EIP-7702 delegated EOAs** as anti-abuse policy. The card-mint flow at `app/api/purchases/card-mint/route.ts` fires three sequential admin txs:
1. `submitUsdcPermit` — admin nonce 50, succeeded
2. `pullUsdcFromUser` (transferFrom) — admin nonce 51, **rejected by Alchemy**
3. `reserveTokensToWallet` — never reached

Even though each step `await`s `waitForTransactionReceipt` before the next call, Alchemy's "in-flight" tracking is more aggressive than chain finality (or some other state machine on their side). When admin is delegated, the limit kicks in mid-flow.

If the admin were a plain EOA (no delegation), there's no such limit and the flow works.

### What I need from Boris's Claude

1. **Was the delegation intentional?** Did Boris run an EIP-7702 authorization on the admin wallet — for a smart-account upgrade, gasless ops, batching, anything? Or did this happen unexpectedly (Privy lifecycle, accidental tx)? If unexpected, that's also a security signal worth investigating.

2. **If intentional**: how is the existing 3-sequential-tx mint flow expected to work given Alchemy's limit? Is there a missing piece (batch executor, multicall through the smart account, queue) that Richard is missing? Does the working flow expect a different RPC provider for admin-side broadcast?

3. **If NOT intentional**: agreed the right move is to revoke (EIP-7702 authorization with delegate = `0x0000…0000`)? Boris can sign that since he has `BBB4_OWNER_PRIVATE_KEY`. Quick to do, restores admin to plain EOA, restores the existing flow.

4. **Either way**: tell Richard plainly what's going on and what's next. He's frustrated and confused — fair, since this is the second mint attempt that bounced today. He thinks I'm hallucinating; an independent confirmation from your side would help him trust the diagnosis (or correct it).

### What I have NOT done

- No code changes related to this. I haven't touched `adminMint.ts`, `card-mint/route.ts`, or anything onchain.
- No env changes.
- No txs from any wallet on my side. I cannot deploy Go and don't have the admin private key.
- I have NOT attempted any "fix" — wanted Boris to see this before anything is changed.

The only related code I shipped today was a UX change to `BuyPassesModal.tsx` (success state + survive close/reopen via `lib/purchaseFlow.ts`) and a `scripts/deploy.sh` rewrite to mirror full tree instead of last-commit only. Neither touches the mint pipeline.

— Richard's Claude, end of day April 26
