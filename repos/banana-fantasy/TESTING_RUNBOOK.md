# Staging Test Runbook — "As If We Were Live"

Walk through every user flow on staging as if it were production. Check boxes as you go; note any errors with their request IDs (pasted from the toast or the Errors tab).

**Target URL:** https://banana-fantasy-sbs.vercel.app/
**Admin URL:** https://banana-fantasy-sbs.vercel.app/admin
**Chrome profile:** Profile 2 only.

Order matters — later flows depend on state from earlier ones. Use a fresh incognito session.

---

## Prereqs (one-time, before starting)

- [ ] Privy dashboard → app `cmlg4vpxo01txl70dm0hr9t86` → Fiat Onramps → MoonPay shows **Configured / Live** (not Sandbox).
- [ ] `npx vercel env ls production | grep PRIVY_APP_SECRET` returns a value (needed for admin auth).
- [ ] BaseScan: `0x14065412b3A431a660e6E576A14b104F1b3E463b` → Read Contract → `mintIsActive()` returns `true`.
- [ ] A second Chrome window open to `/admin` → **Errors** tab (watch for new errors as you test).
- [ ] Your wallet has ≥ $125 USDC on Base mainnet (for Flow C).
- [ ] A real card ready for Flow B.

---

## A — Signup & onboarding

- [ ] Open staging URL in incognito.
- [ ] Click **Get Started** → email `test+<timestamp>@spoiledbanana.io`.
- [ ] Enter Privy email OTP.
- [ ] Land on `/onboarding` with an embedded wallet created.
- [ ] Pick a username, agree to terms.

**Expected state:** Firestore `v2_users/<wallet>` exists with `draftPasses: 0`, `freeDrafts: 0`, `username`.

---

## B — Buy 1 draft pass with CARD (MoonPay)

- [ ] Home → **Buy Draft Passes**.
- [ ] Quantity **1**, Payment **Card**, click Buy.
- [ ] MoonPay modal opens inside Privy.
- [ ] Enter real card (Apple Pay OK). Complete payment.
- [ ] Watch step indicator: Purchasing USDC → Waiting for USDC → Minting.
- [ ] Lands on **Pick Speed** screen within ~2 minutes.

**Expected state:**
- BaseScan: your wallet has +1 BBB4 NFT.
- Firestore: `draftPasses === 1`, `cardPurchaseCount === 1`.
- Admin → Errors tab: no new errors.

---

## C — Buy 5 draft passes with USDC

- [ ] Buy modal → Quantity **5** → **USDC** → Confirm.
- [ ] Two wallet prompts (USDC approve + BBB4 mint). Both gas-sponsored by Privy.
- [ ] Modal transitions to Pick Speed.

**Expected state:**
- Firestore: `draftPasses === 6`.
- Admin → Activity: two `purchases.completed` events.

---

## D — Wheel spin + JP/HOF queue

- [ ] Buy more passes so you've bought ≥ 10 total (unlocks wheel spin via Mint Promo).
- [ ] Home → **Spin the Wheel**.
- [ ] Normal spin first. Then force a JP result: reload with `?forceResult=jackpot`. Spin again.
- [ ] After JP lands, expect auto-enter to the jackpot queue.

**Expected state:**
- Firestore: new `wheelSpins/<id>` + new `v2_queues/<id>` entry.

---

## E — Join + complete a Pro draft

- [ ] Buy modal → **Fast Draft**.
- [ ] Lands in draft room lobby. Staging fill-bots kicks in at 10 seats → progress bar → randomize → draft starts.
- [ ] Make all 15 picks manually (bots on seats 1–9).
- [ ] Results page + final team card + share buttons.

---

## F — Marketplace + share

- [ ] Open `/marketplace`. Find your drafted team.
- [ ] Open detail page. View page source, confirm OG tags include team image + title.
- [ ] Click **Share on X** → X intent opens with prefilled text + URL.
- [ ] **Copy Link** → paste in a new tab → same page loads.

---

## G — Promos

- [ ] **Link X**: profile → Link X → complete via X OAuth → Firestore `v2_twitter_links` updated.
- [ ] **Tweet-verify promo**: post tweet matching required phrase → click **Verify Tweet** → real X API confirms → promo marked claimable.
- [ ] **Referral**: generate referral code. In a *second* incognito session, sign up through the referral link, buy 1 pass. Original user sees referral credit.

---

## H — Withdrawal (admin-KYC path)

- [ ] Have some prize balance (from JP queue payout, or admin-grant for testing — grant yourself a balance).
- [ ] Click **Withdraw** → expect "Verify identity" gate.
- [ ] In admin panel: find your user → **Verify** button (Tier 1 KYC admin override).
- [ ] Return to withdraw flow. Submit withdrawal request.

**Expected state:** Firestore `withdrawalRequests/<id>` status `pending`.

- [ ] Admin → **Withdrawals** tab → Approve → state moves to `approved`.

*Real USDC payout rail is a separate task — for staging, `approved` is end-state.*

---

## I — Observability spot-checks (continuous)

- [ ] Errors tab open in a second window throughout.
- [ ] Any non-user error surfaces with a requestId.
- [ ] Activity tab shows admin actions (grants, KYC verifications, resets, bans, approvals) with actor/target/before/after.

---

## Admin helpers (for re-running flows fast)

- **Reset user**: admin → Users → your row → **Reset**. Clears `draftPasses`, `freeDrafts`, `wheelSpins`, `cardPurchaseCount`, `jackpotEntries`, `hofEntries`. Keeps wallet link, username, referral code, purchase history.
- **Mark KYC verified**: admin → Users → your row → **Verify**. Sets Tier 1 KYC with `method: 'admin-override'`.
- **Grant drafts**: admin → Users → your row → grant N free drafts.
- **Staging mint**: `🧪 Free Entry (Staging)` button in the Buy modal mints Go tokens + credits Firestore without going on-chain. Useful for testing draft flow without spending USDC.

## Known stubs (intentionally out of scope for this testing pass)

- **Real Didit/Persona KYC** — admin override substitutes for now.
- **Real USDC withdrawal payout rail** — admin approve = end-state for staging.
- **Sentry DSN** — Firestore error sink drives the Errors tab; Sentry optional.
