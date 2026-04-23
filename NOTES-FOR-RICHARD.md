# Notes for Richard

Boris's current asks, replies, and shipped updates to Richard. See `NOTES-FOR-BORIS.md` for Richard's current asks back to Boris.

---

## Open asks

### Confirm Go API tags `reserveTokens` mints as `passType: 'free'`

Test wallet `0xE7259AddF13489B4fC37EbDE0D8FE523cD38bEd1` has **BBB4 tokenIds 3 and 4** from admin grants via `reserveTokens`. Txs:

- tokenId 3: `0xe92a4970ac2348055bb01e304f0fe1332aef93b5f188796088c314eec450c997`
- tokenId 4: `0x682d8b92f23d6fffab2b1b1396a9cdc381af9832addf7d7a84b63ff176671c90`

No USDC transferred to the contract on these — admin-only mint.

Please curl:
```
curl -s "https://sbs-drafts-api-staging-652484219017.us-central1.run.app/owner/0xE7259AddF13489B4fC37EbDE0D8FE523cD38bEd1/draftToken/all" | jq '.[] | {cardId, passType, leagueId}'
```

- If tokens 3 + 4 come back with `passType: "free"` → marketplace rule already works, we're done.
- If they come back with `passType: "paid"` → flag it and I'll wire our Firestore `pass_origin/{tokenId}` collection into the marketplace listing check instead.

### `withdraw()` protection — do you want a skim cron on staging?

Plan locked in: accept risk on staging, move to Safe multisig on Base before real prod volume.

Optional: I can wire a Vercel cron that calls `withdraw()` on a schedule and forwards accumulated USDC to a cold treasury on staging as a dress rehearsal. If you want that, drop a cold treasury address and I'll set it up. Otherwise we punt.

---

## Recent shipped (April 22)

### On-chain free-draft minting is live

Every free draft is now a real BBB4 NFT:
- Admin grant → `reserveTokens` → NFT lands in the wallet the admin typed.
- Wheel spin win (`prizeType: draft_pass`) → post-tx mint to the spinner's wallet.
- Buy-bonus promo claim → post-tx mint.

Fallback path (Firestore `freeDrafts` counter only) still exists for when `BBB4_OWNER_PRIVATE_KEY` isn't configured, but it's live now so the fallback shouldn't trigger.

Origin of each free-mint recorded in Firestore `pass_origin/{tokenId}` with `{ origin: 'spin_reward' | 'admin_grant', ownerAtMint, txHash, mintedAt, reason }`.

### Admin plumbing (under `/admin`)

- **Audit Log tab** (Records group) — every admin action with BaseScan tx link, filterable, auto-refreshes every 10s.
- **Users tab** split paid/free pass counts into two columns.
- **"Zero All Free Drafts" danger banner** in Users tab — one-time cleanup for pre-NFT ghost counters. From now on `freeDrafts: N` means N real BBB4 NFTs.
- **Grant toast** has a clickable "View on BaseScan ↗" link on successful on-chain mints.
- Routes: `/api/admin/grant-drafts`, `/api/admin/audit`, `/api/admin/zero-free-drafts`.

### Slow-draft `pickLength` — Go API redeployed

Your backend fix (`60 * 8` → `3600 * 8` in `models/draft-state.go`) ported into `~/sbs-drafts-api-deploy/` and deployed as `sbs-drafts-api-staging-00052-pp8`. Slow drafts return `pickLength: 28800` so your frontend cleanup (drop `correctSlowDraftTimestamp`) is now safe.

### Functions repo confirmed

`~/sbs-staging-functions/` is the right place for your `onPickAdvance` Cloud Function (see `NOTES-FOR-BORIS.md`). Node 20, CommonJS, `firebase-admin` + `node-fetch@2` already in deps. Project `sbs-staging-env`. Deploy with `firebase deploy --only functions:onPickAdvance`.

OneSignal env vars are set on Vercel (`NEXT_PUBLIC_ONESIGNAL_APP_ID` + `ONESIGNAL_REST_API_KEY`), so push fires once the Cloud Function is live.

---

## Contract + key state

- BBB4: `0x14065412b3A431a660e6E576A14b104F1b3E463b` on Base.
- Owner wallet (ops): `0xccdF79A51D292CF6De8807Abc1bB58D07D26441D`. Private key in Vercel env `BBB4_OWNER_PRIVATE_KEY`. Funded with ~$5 ETH on Base for gas. Enough for ~1000 `reserveTokens` calls at current gas.
- `reserveTokens(address to, uint256 numberOfTokens)` is the onlyOwner admin mint.

## Your recent fixes I appreciated

- `bfe7de8` — `JoinLeagues` prefers partial leagues over counter position. Unblocks multi-user fast drafts. 
- `5537d68` — relaxed heal guard so filling-row type/speed always refresh. Paired with the drafting page "Unrevealed" tag fix (a89bd1a) it fixes the PRO-label lie.

---

## Your four open items — all shipped (April 22 evening)

1. **JoinLeagues fix deployed**: `gcloud run deploy sbs-drafts-api-staging` against your `bfe7de8`. Live as revision `sbs-drafts-api-staging-00054-6x7`, serving 100%.

2. **onPickAdvance Cloud Function deployed**: `firebase deploy --only functions:onPickAdvance` against `~/sbs-staging-functions/` (your source from `functions-for-boris/onPickAdvance.js`). Function is live in `us-central1` on project `sbs-staging-env`. OneSignal env vars already on Vercel, so it'll fire as soon as a slow-draft `currentDrafter` changes.

3. **Marketplace free-origin check swapped**: new `GET /api/pass-origin/free-tokens?wallet=…` returns tokenIds minted via `reserveTokens`. `useMarketplace` overlays `passType: 'free'` on any owned team whose tokenId appears there, so the existing `SellTab.tsx:123` + `app/marketplace/page.tsx:331` gates fire correctly without touching the Go API `passType` path. Legacy timestamp `cardId`s without a `pass_origin` doc stay as-is.

4. **USDC skim cron live**: hourly Vercel cron at `/api/crons/skim-bbb4-usdc` → calls `BBB4.withdraw()` then transfers ops wallet's USDC to `0xC0F982492c323Fcd314af56d6c1A35Cc9b0fC31E`. Authed via `CRON_SECRET`. Audit trail in Firestore `bbb4_usdc_sweeps`. First run happens at the next top of the hour.

Bonus — my reconciler (commit `d29afd1`) now registers `reserveTokens`-minted tokens in Go API's `owners/{wallet}/validDraftTokens` via `/draftToken/mint`. So the gap you flagged in the `passType` curl — "on-chain tokenIds 3/4 don't appear in the Go API response at all" — should be closed for future grants. If you want to re-verify, do a fresh admin grant or click **Sync** on the user's row in admin (new button I added), then re-curl — token 3/4 should show up as real numeric `cardId`s in the response. Whether `passType: "free"` also lands depends on the Go side; if it still doesn't, the `pass_origin` overlay handles the marketplace rule without needing the Go field.

### Waiting on you
- `passType` re-curl sanity check (optional, since marketplace no longer depends on it).
- BBB4 Safe multisig plan for pre-prod launch.

Nothing urgent from my side.
