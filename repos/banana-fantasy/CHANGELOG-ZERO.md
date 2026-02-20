# Zero's Changes — sbs-frontend-v2

All changes made by Zero (sbs0banana) to the frontend repo. For your dev to know what was touched and why.

## 2026-02-17

| Commit | Files | What |
|--------|-------|------|
| (this commit) | 2 | Draft room UI visibility fix: make enabled inline Draft buttons high-contrast on dark theme in `DraftItemComponent` and `QueueItemComponent`; keep disabled buttons gray. No pick logic changes. |

**Total: 42 commits across Feb 10-11, 2026**

---

## 🔌 Backend Wiring (mock → real APIs)

These replaced Boris's mock/placeholder data with real API calls to the SBS Go backend.

| Commit | Files | What |
|--------|-------|------|
| `a747c6d` | 7 | Coinbase onramp/offramp branding, payment UX labels |
| `19e501e` | 111 | ETH → USDC on Base, remove web2/web3 UI split |
| `73c9506` | 23 | Backend API routes: promos, wheel, purchases, contests, exposure, history |
| `2176dd8` | 23 | Wire all pages to API hooks, add data fetching layer |
| `8360824` | 2 | Production API env vars in next.config |
| `436a8a4` | 1 | Wire useHistory hook to real Cloud Run API |
| `1ee87ca` | 2 | Wire standings to real API via useLeagues hook |
| `3615a60` | 3 | Wire history page to real API, remove hardcoded leagues |
| `d93b771` | 3 | Firebase admin SDK + client singleton |
| `5c5c8db` | 5 | Firestore backend for wheel/promos/purchases |
| `1055807` | 12 | Wire pages to hooks, remove direct mock imports |
| `585ad73` | 11 | Remove direct mock imports from remaining pages |
| `941b7a5` | 26 | Split mockData.ts into domain-specific mock files |
| `68a1e14` | 4 | Wire remaining mock API routes to real Go backend |

## 🔐 Auth (Privy Integration)

| Commit | Files | What |
|--------|-------|------|
| `dd083c2` | 7 | Integrate Privy auth — replace mock auth with real wallet/social login |
| `efe9d5c` | 1 | Wire Privy auth → real SBS backend owner profile |

## 🏈 Draft Room

| Commit | Files | What |
|--------|-------|------|
| `2874123` | 2 | Add useDraftRoom hook — real WebSocket + REST integration |
| `c1eda84` | 1 | Rewrite draft room page — wire to real WebSocket server |
| `a9267d1` | 5 | Match draft room styling to original SBS design |
| `5a17feb` | 3 | Port original SBS draft room UI — pixel-perfect |
| `50bbca7` | 80 | Port complete original draft room with Redux — identical UI to production |
| `ddb5001` | 1 | Wire buy-drafts page to real purchase API |
| `49f0099` | 1 | Wire join-draft flow to real backend API |
| `cf239a3` | 1 | Remove demo drafts from drafting page |

## 🛡️ Code Review & Hardening (Task #138)

| Commit | Files | What |
|--------|-------|------|
| `e0ba2d9` | 8 | **Big one.** Fix race conditions in useDraftRoom (isActive guard, WS cleanup, pick dedup), add loading/error states, harden all 4 API routes (remove silent mock fallbacks, add error propagation + validation), fix stale closure in drafting page, add input validation to buy-drafts |

**Key files your dev should review:**
- `hooks/useDraftRoom.ts` — race condition fixes, WebSocket cleanup
- `app/draft-room/page.tsx` — loading/error states, memoization
- `app/api/*/route.ts` — all 4 API routes got error handling overhaul

## 🔒 Security Cleanup (Task #124)

| Commit | Files | What |
|--------|-------|------|
| `2295e12` | 12 | Remove mock private key, fix auth defaults, fix type mismatches |
| `d885618` | 9 | Remove MOCK_PRIVATE_KEY + export UI from EditProfileModal, mark demo data with comments, add userId/amount validation to withdraw route, verification system |

## 📚 In-Draft Tutorial (Task #120)

| Commit | Files | What |
|--------|-------|------|
| `f59e62f` | 3 | Initial tutorial: DraftTutorial component, useTutorial hook, OnboardingTutorial |
| `29a69f6` | 10 | Improve tutorial copy, fix slot overlay blocking, clean up mock imports |
| `37b4246` | 1 | Test page at /test-tutorial |
| `e6444ef` | 1 | Test page uses original components with mock Redux store |
| `c3e0a77` | 1 | Align mock Redux state with actual slice fields |
| `84a2585` | 5 | Add tutorialMode to skip API calls + ignore TS errors in build |
| `388bd94` | 9 | **Fix click bug** (4-panel overlay cutout), decouple from ViewTab type, wire into actual draft-room page with Redux adapter, add data-tutorial attributes to 6 components |

## 💰 Withdrawal Bug Fixes (Task #127)

| Commit | Files | What |
|--------|-------|------|
| `d885618` | 3 | Added userId/amount validation to withdraw route, rewrote error handling in usePrizes with specific messages per HTTP status, added isSubmitting loading state to WithdrawModal to prevent double-submit |

## 🔍 Owner/Owners Typo Audit (Task #126)

| Commit | Files | What |
|--------|-------|------|
| `d885618` | 0 (audit only) | Verified all API routes use `/owner/` consistently — no typo found. Withdrawal and prize endpoints are correct. |

## ✅ Verification System (Task #121)

| Commit | Files | What |
|--------|-------|------|
| `d885618` | 9 | KYC verification page (name, email, DOB, country/state), eligibility API route |
| `b46d4cc` | 1 | Fix: reset region when country changes on verify page |

## 🔧 Smart Contract & Prize Flow

| Commit | Files | What |
|--------|-------|------|
| `d81e0ca` | 49 | BBB4 smart contract scaffolding, RNG system, onboarding cleanup, prize flow wiring |

## 🐛 Build & Deploy Fixes

| Commit | Files | What |
|--------|-------|------|
| `8e583b1` | 1 | Use /tmp for DB storage on Vercel (read-only filesystem) |
| `b004dfa` | 122 | Exclude hardhat files from tsconfig to fix Vercel build |
| `344addd` | 117 | Gitignore hardhat artifacts, remove from repo |
| `3ab9c1e` | 2 | Remove hardhat deps from frontend (move to contract repo later) |
| `4b9fccf` | 3 | styled-components SSR registry + compiler config for Next.js App Router |
| `6e935f8` | 2 | Add styled-components as direct dependency |
| `ecc05a0` | 29 | Add force-dynamic to all API routes/pages to prevent static prerender failures |
| `6dfc41d` | 1 | Add pfpInfo to mock summary data to prevent runtime crash |
| `ee382cc` | 1 | Cache bust |

---

## ✅ BlueCheck Age/Identity Verification (`d19373e`)

Replaced the placeholder `/verify` form with real BlueCheck widget integration.

| File | What Changed |
|------|-------------|
| `app/verify/page.tsx` | Full rewrite — loads BlueCheck JS widget, collects first/last name + email + country/region, launches age_photoID verification, handles all callbacks (onReady, scrapeUserData, onSuccess, onClose) |
| `app/prizes/page.tsx` | Gates withdrawals on `isBlueCheckVerified`, shows BlueCheck badge in eligibility grid, "Verify to Withdraw" button |
| `types/index.ts` | Added `blueCheckEmail` + `isBlueCheckVerified` to User and EligibilityStatus |
| `lib/api/owner.ts` | Maps BlueCheck fields from backend owner API (handles both casing variants) |
| `app/api/eligibility/route.ts` | Accepts firstName/lastName separately, DOB optional, `source: 'bluecheck_widget'` |

**How it works:** Widget loads via `next/script`, user fills form → clicks Verify → BlueCheck SDK opens photo ID flow → on success, backup record saved to Firestore via `/api/eligibility`. Backend webhook (`POST /owner/:ownerId/withdrawal/isBlueCheck`) handles the real verification flag.

---

## Files Most Heavily Modified

Your dev should focus testing on these:

1. **`hooks/useDraftRoom.ts`** — WebSocket hook, race condition fixes
2. **`app/draft-room/page.tsx`** — Draft room integration, tutorial, Redux
3. **`app/api/*/route.ts`** — All API routes (error handling overhaul)
4. **`components/tutorial/DraftTutorial.tsx`** — Tutorial overlay system
5. **`components/modals/EditProfileModal.tsx`** — Security cleanup (removed export key)
6. **`app/verify/page.tsx`** — Verification system
7. **`hooks/useAuth.ts` / Privy integration** — Auth flow

## How to See Full Diffs

```bash
# See all Zero's commits
git log --author="sbs0banana" --oneline

# See specific commit diff
git show <commit-hash>

# See all changes in one diff
git diff <first-commit>^..<last-commit>
```
| `ba59f08` |  1 file changed, 6 insertions(+) | docs: add task #126 to changelog |
| `b78746b` |  1 file changed, 7 insertions(+) | docs: add task #127 to changelog |
| `92b9649` |  7 files changed, 176 insertions(+), 33 deletions(-) | fix: 5 legacy draft room bugs + dev fixes documentation |
| `d19373e` |  6 files changed, 420 insertions(+), 146 deletions(-) | feat: wire BlueCheck verification widget into /verify page + gate withdrawals |
| `96da134` |  1 file changed, 17 insertions(+) | docs: add BlueCheck integration details to changelog |
| `8ddeff8` |  1 file changed, 1 insertion(+), 1 deletion(-) | fix: remove Discord from Privy login methods per Boris |
| `0257e3f` |  15 files changed, 196 insertions(+), 279 deletions(-) | fix: call privy login() directly from Header, skip intermediate state |
| `11b4890` |  3 files changed, 17 insertions(+), 4 deletions(-) | fix: show promos to logged-out users (view only, claims require login) |
| `a373cd7` |  3 files changed, 103 insertions(+), 3 deletions(-) | feat: dynamic wheel config from Firestore with 5-min cache + seed script |

## Task #144 — Move Wheel Config to Firestore (2026-02-11)
**Commit:** `a373cd7`
**Files:** 3 changed (+103/-3)

### What Changed
- **`lib/wheelConfigFirestore.ts`** (NEW) — Reads `config/wheel` Firestore doc, validates segment shape, 5-min in-memory cache, falls back to hardcoded `wheelConfig.ts` if doc missing/invalid
- **`scripts/seed-wheel-config.ts`** (NEW) — Seeds Firestore with current hardcoded 12 segments. Run with `npx tsx scripts/seed-wheel-config.ts`
- **`app/api/wheel/spin/route.ts`** — Replaced hardcoded `wheelSegments`/`WHEEL_SEGMENT_ANGLE` imports with dynamic `getWheelConfig()`

### Why
Richard wanted prizes configurable without code deploys. Now just update the `config/wheel` Firestore doc.
| `b776bcb` |  1 file changed, 15 insertions(+) | docs: changelog for task #144 |
| `2f30ecf` |  9 files changed, 869 insertions(+), 1 deletion(-) | feat: admin dashboard with withdrawal management, user data, stats |

## 2026-02-11 — Admin Dashboard (Task #145)
- **Added:** `/admin` route with 3 tabs: Overview, Withdrawals, Users
- **Added:** 4 API routes under `/api/admin/` (stats, withdrawals, withdrawals/[id], users)
- **Added:** Admin auth via Privy token + wallet allowlist (`lib/adminAuth.ts`, `lib/adminAllowlist.ts`)
- **Added:** `lib/auth.ts` for Privy user resolution
- **Details:** Stats show total users, pending withdrawals, amounts, verified users. Withdrawal table has approve/deny buttons. Users table is paginated. BlueCheck verification status visible.
- **Commit:** 2f30ecf
| `202ceac` |  1 file changed, 10 insertions(+) | docs: changelog for admin dashboard |
| `169ce11` |  14 files changed, 312 insertions(+), 2 deletions(-) | feat: SEO improvements — meta tags, OG, sitemap, robots.txt, structured data |

## 2026-02-11 — SEO Improvements (Task #115)
- **Enhanced:** Global metadata in layout.tsx — OG tags, Twitter cards, canonical URLs, metadataBase
- **Added:** Per-page metadata layouts for 11 routes (buy-drafts, drafting, standings, rankings, prizes, faq, banana-wheel, exposure, marketplace, history, verify)
- **Added:** public/robots.txt (blocks /admin and /api/)
- **Added:** app/sitemap.ts (dynamic sitemap with all public routes)
- **Added:** Organization JSON-LD structured data
- **Commit:** 169ce11
| `5402d91` |  1 file changed, 10 insertions(+) | docs: changelog for SEO improvements |
| `c11ff2f` |  3 files changed, 33 insertions(+) | feat: add Google Analytics gtag.js integration (env var driven) |

## 2026-02-11 — Google Analytics Integration (Task #114)
- **Added:** `app/components/GoogleAnalytics.tsx` — env-driven gtag.js client component
- **Updated:** `app/layout.tsx` — renders GA before StyledComponentsRegistry
- **Updated:** `.env.example` — added `NEXT_PUBLIC_GA_MEASUREMENT_ID`
- **Note:** GA is inactive until measurement ID is added to Vercel env vars
- **Commit:** c11ff2f
| `2c75d1b` |  1 file changed, 9 insertions(+) | docs: changelog for GA integration |
| `fd480b8` |  1 file changed, 214 insertions(+) | feat: BBB4 Coming Soon landing page (#161) |
| `1143b33` |  1 file changed, 304 insertions(+), 124 deletions(-) | feat: BBB4 Coming Soon page v2 — animated hype landing (#161) |
| `f731a55` |  1 file changed, 112 insertions(+) | feat: Genesis legacy page at /about/genesis (#159) |
| `09aa7f9` |  9 files changed, 302 insertions(+), 3 deletions(-) | feat: set up Playwright e2e test framework (#52) |
| `5250fda` |  5 files changed, 41 insertions(+), 1 deletion(-) | feat: integrate OneSignal Web Push SDK |
| `fea18a7` |  3 files changed, 459 insertions(+), 5 deletions(-) | feat: wire BBB4 smart contract mint into buy-drafts page |
| `bdadda9` |  3 files changed, 176 insertions(+), 5 deletions(-) | feat: polish card payment form and secure purchase API |
| `0d5af3d` |  2 files changed, 112 insertions(+), 183 deletions(-) | feat: replace fake card form with Privy useFundWallet onramp + auto-mint |
| `9894937` |  2 files changed, 4 insertions(+) | fix: set defaultChain and supportedChains to baseSepolia in Privy config |
| `b32ac2d` |  2 files changed, 41 insertions(+), 25 deletions(-) | feat: show USDC option only for external wallet users |
| `9a884f8` |  2 files changed, 11 insertions(+), 11 deletions(-) | fix: use loginMethod instead of useWallets for payment method detection |
| `2467074` |  1 file changed, 8 insertions(+), 1 deletion(-) | fix: detect external wallets via linkedAccounts instead of privy.user.wallet |
| `a2a0a38` |  1 file changed, 2 insertions(+) | fix: loginMethod detection — check walletClientType not wallet existence |
| `6fa4bce` |  1 file changed, 1 insertion(+) | chore: trigger vercel deploy |
| `b49575a` |  1 file changed, 1 insertion(+) | chore: test vercel git integration |
| `514314b` |  1 file changed, 9 insertions(+), 2 deletions(-) | debug: log linkedAccounts to diagnose loginMethod detection |
| `bc549ff` |  1 file changed, 6 insertions(+), 3 deletions(-) | fix: hide USDC option in BuyPassesModal for social/email logins, remove Coinbase branding |
| `2b07480` |  3 files changed, 9 insertions(+), 8 deletions(-) | fix: rename to Card/Apple Pay, remove extra text, clean up branding |
| `45173ba` |  2 files changed, 198 insertions(+), 37 deletions(-) | feat: wire real Privy useFundWallet + mint into BuyPassesModal |
| `b52876b` |  2 files changed, 2 insertions(+), 1 deletion(-) | Switch to MockUSDC for testnet testing |
| `5fd218e` |  3 files changed, 21 insertions(+), 15 deletions(-) | Switch to Base mainnet for production testing |
| `8909153` |  1 file changed, 40 insertions(+), 19 deletions(-) | refactor: use Privy gas sponsorship for USDC approve + BBB4 mint |
| `3d84247` |  2 files changed, 15 insertions(+) | Add mint success message with BaseScan link on buy-drafts page |
| `e43a12d` |  3 files changed, 31 insertions(+), 14 deletions(-) | Show user's on-chain NFT balance on buy-drafts page |
| `5876f0f` |  2 files changed, 27 insertions(+) | Sync draft pass count from on-chain NFT balance globally |
| `e91ab76` |  2 files changed, 12 insertions(+), 1 deletion(-) | fix: sync NFT balance to auth context after mint - no re-login needed |
| `b824739` |  2 files changed, 16 insertions(+) | feat: add JP/HOF stats to header (matches original site) |
| `bbb82fd` |  2 files changed, 27 insertions(+), 11 deletions(-) | feat: JP red + HOF gold colors, hover tooltip with explanation |
| `8a74ba2` |  2 files changed, 12 insertions(+), 5 deletions(-) | fix: prioritize external wallet over embedded for NFT balance read |
| `dd2a92e` |  6 files changed, 339 insertions(+), 322 deletions(-) | feat: wire useDraftRoom WebSocket hook into draft room page |
| `be4a351` |  2 files changed, 293 insertions(+), 359 deletions(-) | redesign: purchase-first layout for buy passes page and modal |
| `23b4e5b` |  2 files changed, 3 insertions(+), 16 deletions(-) | fix: replace inline wheel SVG with banana-wheel.png icon |
| `b501e4d` |  2 files changed, 2 insertions(+), 1 deletion(-) | fix: add PROMO label to wheel spin section |
| `6521421` |  10 files changed, 257 insertions(+), 4 deletions(-) | fix: update modal promo with banana-wheel icon and PROMO label |
| `d9f50c8` |  1 file changed, 1 insertion(+) | feat: PWA implementation — manifest, service worker, install prompt (#167) |
| `3c32e32` |  2 files changed, 3 insertions(+), 3 deletions(-) | fix: simplify modal promo to plain text, remove icon and emoji |
| `ec8a72c` |  11 files changed, 57 insertions(+), 37 deletions(-) | fix: remove Progress label from promo, disable PWA install banner |
| `3314984` |  12 files changed, 26 insertions(+), 25 deletions(-) | fix: mobile responsiveness — reduce padding, add horizontal scroll to data tables |
| `dc35714` |  2 files changed, 5 insertions(+), 6 deletions(-) | fix: center promo text in modal |
| `5397faf` |  6 files changed, 50 insertions(+), 47 deletions(-) | fix: poll NFT balance every 30s + re-read on network reconnect |
| `bef5cdd` |  3 files changed, 8 insertions(+), 7 deletions(-) | fix: rename to Draft Passes, improve label visibility in modal |
| `169a20f` |  10 files changed, 26 insertions(+), 13 deletions(-) | fix: cache draftPasses in localStorage - never flash 0 on reconnect |
| `1420c68` |  29 files changed, 94 insertions(+), 146 deletions(-) | redesign: Apple-style modal — strip order summary, show price + big total |
| `3ca3684` |  3 files changed, 7 insertions(+), 12 deletions(-) | fix: center JP/HOF stats below count in header, match reference design |
| `6da0b9d` |  2 files changed, 3 insertions(+) | fix: use cached draftPasses on backend success path too - prevents 0 flash in new tabs |
| `379c51f` |  2 files changed, 8 insertions(+), 6 deletions(-) | fix: improve header stats sizing and spacing to match reference |
| `462f88f` |  2 files changed, 11 insertions(+), 7 deletions(-) | fix: properly center JP/HOF with flex gap layout |
| `f2d2c2b` |  11 files changed, 4195 insertions(+), 1294 deletions(-) | fix: match BatchProgressIndicator layout from Boris's local build |
| `7d7c795` |  2 files changed, 5 insertions(+), 4 deletions(-) | fix: add green checkmark when JP/HOF milestones hit |
| `4e5e1f9` |  2 files changed, 30 insertions(+), 18 deletions(-) | fix: exact match of Boris's BatchProgressIndicator — remaining counts, dynamic batchEnd, hit checkmarks |
| `7b79972` |  5 files changed, 1 insertion(+), 32 deletions(-) | fix: remove Sentry instrumentation files causing build failure |
| `bcbc38c` |  3 files changed, 128 insertions(+), 46 deletions(-) | feat: enable Privy Smart Wallets for gas-sponsored transactions |
| `b0cc83e` |  20 files changed, 531 insertions(+), 6 deletions(-) | fix: 0/100 batch start, aligned JP/HOF with min-width and gap-3 |
| `3b14b12` |  3 files changed, 46 insertions(+), 128 deletions(-) | Revert "feat: enable Privy Smart Wallets for gas-sponsored transactions" |
| `ff2ca66` |  2 files changed, 5 insertions(+), 3 deletions(-) | fix: tighten JP/HOF gap to 1.5 |
| `c7be77c` |  3 files changed, 13 insertions(+), 27 deletions(-) | fix: single-line JP/HOF at 10px to match width of count line |
| `4b60bcc` |  5 files changed, 332 insertions(+), 15 deletions(-) | fix: mint hook uses walletAddress + sendTransaction only - no MetaMask provider needed per tab |
| `941fd6c` |  33 files changed, 89 insertions(+), 1 deletion(-) | fix: bump JP/HOF text to 12px semibold for readability |
| `cd4a8d3` |  4 files changed, 39 insertions(+), 27 deletions(-) | fix: use useSmartWallets client for minting - no MetaMask provider needed |
| `d3447a6` |  7 files changed, 21 insertions(+), 7 deletions(-) | fix: wire rate limiting into GET routes that had unused imports |
| `0cebef9` |  5 files changed, 221 insertions(+), 1 deletion(-) | feat: draft lobby real-time polling + empty state + auto-redirect |
| `2ee04c2` |  2 files changed, 92 insertions(+), 19 deletions(-) | feat: post-draft team reveal page with animated card flips |
| `66d5946` |  3 files changed, 4 insertions(+), 3 deletions(-) | fix: thread makePick to DraftComponent, fix test-tutorial, fix useMintDraftPass types |
| `002fd04` |  7 files changed, 339 insertions(+), 7 deletions(-) | feat: notification opt-in UX + draft reminder API |
| `b60b632` |  7 files changed, 45 insertions(+), 12 deletions(-) | feat: accessibility audit — WCAG 2.1 AA improvements |
| `a1d692b` |  4 files changed, 24 insertions(+), 3 deletions(-) | perf: lazy load heavy components + font preload |
| `22d54db` |  1 file changed, 335 insertions(+) | feat: Jackpot & HOF promotional page (#166) |
| `929b664` |  1 file changed, 1 insertion(+), 1 deletion(-) | fix: framer-motion easing type in OnboardingFlow |
| `63bb35f` |  4 files changed, 668 insertions(+), 121 deletions(-) | feat: reusable SpinWheel component + draft-reveal integration |
| `9b458bd` |  1 file changed, 605 insertions(+) | feat: draft results page with animated team reveal at /draft-results/[draftId] |
| `9234e49` |  1 file changed, 554 insertions(+) | feat: draft lobby queue page at /draft-queue |
| `e60a7f6` |  1 file changed, 1 insertion(+) | fix: add legacy-peer-deps to resolve npm install conflicts on Vercel |
| `292cabc` |  2 files changed, 498 insertions(+) | fix: force legacy-peer-deps via vercel.json installCommand |
| `ca845bd` |  1 file changed, 21987 deletions(-) | fix: remove stale package-lock to let Vercel regenerate with legacy-peer-deps |
| `0d126c8` |  12 files changed, 11399 insertions(+), 20 deletions(-) | fix: remove all @sentry/nextjs imports from error boundaries — Sentry not installed |
| `0d39be6` |  2 files changed, 1 insertion(+), 11373 deletions(-) | fix: remove package-lock again — local lockfile has peer dep conflicts |
| `d2273b0` |  1 file changed, 1 insertion(+) | chore: gitignore package-lock until peer deps stabilized |
| `a9ad64e` |  4 files changed, 654 insertions(+) | feat: referral system — /referrals page + API routes |
| `e4085ea` |  3 files changed, 581 insertions(+) | feat: notification center — bell icon, dropdown panel, /notifications page |
| `50b8356` |  1 file changed, 429 insertions(+) | feat: season leaderboard page at /leaderboard |
| `c144107` |  3 files changed, 8497 insertions(+), 2 deletions(-) | fix: update staging tunnel URLs |
| `7163be7` |  5 files changed, 804 insertions(+), 263 deletions(-) | feat: expanded Admin Control Panel — 8 tabs, draft/promo/user mgmt, season controls, system health, revenue |
| `53cb306` |  4 files changed, 148 insertions(+), 54 deletions(-) | feat: unified navigation update — header nav links, mobile menu, Footer component |
| `c8d2502` |  2 files changed, 176 insertions(+), 9 deletions(-) | feat: seamless purchase → draft type selection → auto-join → draft lobby flow |
| `c2f5ace` |  4 files changed, 501 insertions(+), 8 deletions(-) | fix: exact replica of Boris's BatchProgressIndicator badge layout — 16px count, 14px bold numbers, 10px labels, gap-2 |
| `04562bf` |  4 files changed, 412 insertions(+), 833 deletions(-) | redesign: horizontal single-line layout for count + JP/HOF with divider |
| `75c123a` |  1 file changed, 271 insertions(+), 28 deletions(-) | feat: move purchase→draft flow entirely into BuyPassesModal |
| `6499cef` |  3 files changed, 126 insertions(+), 16 deletions(-) | redesign: contained batch progress card with label, count, and badge pills |
| `0b383e1` |  3 files changed, 2 insertions(+), 8490 deletions(-) | fix: remove yarn.lock — keep builds on npm |
| `f236fba` |  4 files changed, 442 insertions(+), 21 deletions(-) | redesign: clean single-line header stats — no container, no label, just text |
| `6cfbaad` |  9 files changed, 316 insertions(+), 299 deletions(-) | fix: buy-drafts page simplified — modal handles entire purchase→speed→join flow |
| `53ab23b` |  7 files changed, 196 insertions(+), 25 deletions(-) | fix: fixed-width 72px container for batch stats, both lines centered within it |
| `8167ec0` |  4 files changed, 55 insertions(+), 51 deletions(-) | Revert "feat: theme toggle — dark/light/system mode with CSS variable theming" |
| `d6d0c37` |  11 files changed, 431 insertions(+) | test: E2E tests for all new pages — 10 spec files, 45+ test cases |
| `5208bc7` |  2 files changed, 14 insertions(+), 45 deletions(-) | fix: restore globals.css and tailwind.config from last working deploy (6cfbaad) |
| `7cf0a92` |  5 files changed, 16 insertions(+), 151 deletions(-) | fix: fully restore Header, layout, ThemeToggle removal to match last working deploy |
| `f07fca3` |  2 files changed, 2 insertions(+), 3 deletions(-) | fix: remove Buy Drafts and Draft Queue from nav |
| `7b2c975` |  2 files changed, 3 insertions(+), 6 deletions(-) | fix: fire-and-forget bot fill so modal redirects immediately after join |
| `80da359` |  2 files changed, 3 insertions(+), 2 deletions(-) | fix: redirect before closing modal — onClose was unmounting before router.push fired |
| `2bdaa25` |  3 files changed, 54 insertions(+), 10 deletions(-) | fix: WebSocket + lobby status now staging-aware |
| `073456b` |  2 files changed, 6 insertions(+), 3 deletions(-) | fix: joinDraft now handles array API response + correct field names |
| `87e807e` |  4 files changed, 18 insertions(+), 3 deletions(-) | fix: complete draft flow — 3 bugs blocking lobby connection |
| `91f5ed0` |  2 files changed, 9 insertions(+), 3 deletions(-) | fix: use window.location.href for draft lobby redirect + debug logs |
| `365b399` |  10 files changed, 775 insertions(+), 231 deletions(-) | feat: unified draft room with Boris's phase system + real WebSocket |
| `94b1d56` |  2 files changed, 17 insertions(+), 49 deletions(-) | fix: use original PlayerComponent + MainComponent in draft room |
| `b1643d1` |  2 files changed, 73 insertions(+), 9 deletions(-) | fix: wire real WebSocket player data to draft room filling counter |
| `76d9a54` |  3 files changed, 19 insertions(+), 14 deletions(-) | fix: reapply fixed-width batch stats layout (was overwritten by One) |
| `bbce256` |  3 files changed, 87 insertions(+), 45 deletions(-) | fix: draft room - real WS filling, player list, on-the-clock, timer for all, min display time |
| `ec92b20` |  2 files changed, 28 insertions(+), 42 deletions(-) | Fix draft room WebSocket data flow: Real player count + drafter display |
| `9dcb273` |  3 files changed, 49 insertions(+), 22 deletions(-) | fix: staging-aware API for original draft components + timer visible to all + filling animation minimum time |
| `f584c6b` |  3 files changed, 6 insertions(+), 4 deletions(-) | fix: CORS via nginx tunnel + null safety in PlayerComponent + refresh tunnel URLs |
| `9d04064` |  2 files changed, 6 insertions(+), 5 deletions(-) | fix: null safety in PlayerCardComponent roster length checks (== instead of ===) |
| `cdd05bf` |  2 files changed, 7 insertions(+), 6 deletions(-) | fix: initialize Redux draft state with empty arrays/objects instead of null — prevents .length crashes |
| `1777766` |  4 files changed, 4 insertions(+), 3 deletions(-) | fix: guard all Redux dispatch calls against null API responses |
| `259d34b` |  4 files changed, 8 insertions(+), 6 deletions(-) | fix: guard all API→Redux dispatch paths against null responses + setQueue fallback |
| `04f286e` |  2 files changed, 3 insertions(+), 2 deletions(-) | fix: update Cloudflare tunnel URLs for staging |
| `aa778ab` |  3 files changed, 27 insertions(+), 15 deletions(-) | fix: P0 draft room fixes — slotDone bug, server draft order, dual data source, re-enter button |
| `4977a19` |  4 files changed, 78 insertions(+), 20 deletions(-) | P1 draft room fixes: search/position filters, case-insensitive addresses, Redux-only board, pre-draft tabs |
| `0333bbd` |  3 files changed, 37 insertions(+), 9 deletions(-) | feat: staging bots fill AFTER user enters lobby — visual filling flow |
| `49084af` |  2 files changed, 9 insertions(+), 5 deletions(-) | fix: phase state machine — slot animation proceeds independent of WS state |
| `790ec2d` |  2 files changed, 3 insertions(+), 11 deletions(-) | fix: remove fill-bots from drafting page too — all bot fills now in draft-room |
| `56d1846` |  3 files changed, 48 insertions(+), 1 deletion(-) | feat: wire up frontend autopick UI — handle autopick_status events + toggle_autopick |
| `c916dfc` |  2 files changed, 20 insertions(+), 20 deletions(-) | fix: full-screen overlays + reliable filling counter |
| `5766207` |  2 files changed, 20 insertions(+), 15 deletions(-) | fix: hide ALL draft components during pre-draft phases |
| `0239415` |  2 files changed, 2 insertions(+), 1 deletion(-) | fix: syntax error — missing closing > on div tag |
| `ffd336f` |  2 files changed, 21 insertions(+), 11 deletions(-) | fix: staging fill effect — remove phase dependency, use ref, add logging |
| `6e4ba1a` |  2 files changed, 2 insertions(+), 1 deletion(-) | fix: remove stale stagingFillTriggered reference causing runtime crash |
| `a321b7a` |  2 files changed, 25 insertions(+), 13 deletions(-) | fix: don't skip slot machine when staging fill triggered + loading state |
| `32bf3ad` |  2 files changed, 13 insertions(+), 21 deletions(-) | fix: render draft components when phase=drafting regardless of WS state |
| `0dc0912` |  2 files changed, 15 insertions(+), 5 deletions(-) | fix: NEVER skip filling/slot animations in staging mode |
| `09a246f` |  2 files changed, 4 insertions(+) | debug: add transition logging to trace filling→pre-spin→slot flow |
| `ecdeaf5` |  2 files changed, 9 insertions(+), 2 deletions(-) | fix: transition timeout cancelled by realPlayers dep churn — use ref instead |
| `14fc1ce` |  3 files changed, 97 insertions(+), 100 deletions(-) | fix: draft room - post-slot countdown, createDraft trigger, original API data format |
| `c40960c` |  2 files changed, 4 insertions(+), 18 deletions(-) | fix: remove broken browser-side createDraft call |
| `28a8cd2` |  2 files changed, 18 insertions(+), 3 deletions(-) | fix: restore createDraft trigger via staging proxy endpoint |
| `338703c` |  4 files changed, 11 insertions(+), 6 deletions(-) | fix: PlayerComponent z-index above site header + hide duplicate top bar + debug logging |
| `da01503` |  2 files changed, 20 insertions(+), 3 deletions(-) | fix: add debug panel + faster staging countdown + margin-top for draft components |
| `0aa02ff` |  5 files changed, 20 insertions(+), 68 deletions(-) | fix: draft room 1:1 with original - hide footer, black bg, remove search/filters, fix layout |
| `e1158b5` |  3 files changed, 31 insertions(+), 21 deletions(-) | Draft room: hide header, show room during filling, add login gate |
| `55e556f` |  2 files changed, 6 insertions(+), 22 deletions(-) | fix: don't force filling phase when WS says drafting + remove login gate |
| `3499f2f` |  2 files changed, 2 insertions(+) | chore: force rebuild |
| `00b75f7` |  | trigger: force Vercel rebuild |
| `87e5e62` |  2 files changed, 3 insertions(+), 1 deletion(-) | fix: remove unused login import causing build failure |
| `ed41dd4` |  2 files changed, 1 insertion(+), 1 deletion(-) | fix: remove stray closing brace from login gate removal |
| `841ff2a` |  2 files changed, 2 insertions(+), 1 deletion(-) | fix: update WS tunnel URL (old one stopped proxying WS) |
| `748d511` |  7 files changed, 97 insertions(+), 26 deletions(-) | fix: draft room — runtime staging URL overrides, WS debug breadcrumbs, REST fallback, fill timeout |
| `bea7074` |  2 files changed, 2 insertions(+), 1 deletion(-) | fix: update WS tunnel URL in .env.production to live tunnel |
| `34a2ab5` |  3 files changed, 289 insertions(+), 822 deletions(-) | feat: clean draft room UX — simplified flow, Underdog-style |
| `fce870d` |  1 file changed, 268 insertions(+), 96 deletions(-) | feat: draft room UX overhaul — Underdog-style lobby, smooth transitions, slim draft bar |
| `2cfba37` |  2 files changed, 12 insertions(+), 2 deletions(-) | fix: retry REST fetches when draft not ready yet (500s after createDraft) |
| `cf45460` |  2 files changed, 2 insertions(+), 1 deletion(-) | fix: use fill-league endpoint for instant staging fills + state creation |
| `a6a67ef` |  2 files changed, 12 insertions(+) | fix: re-fetch data when WS phase transitions to drafting + JSON error responses from fill-league |
| `d2fd46e` |  3 files changed, 11 insertions(+), 3 deletions(-) | fix: re-fetch data 3s after createDraft succeeds in staging (state docs exist after fill) |
| `5829502` |  2 files changed, 5 insertions(+), 1 deletion(-) | fix: graceful JSON parse for fill-league response (handles non-JSON 500s) |
| `3fa33ba` |  2 files changed, 39 insertions(+) | feat: staging auth bypass — hardcoded test wallet when ?staging=true |
| `19c6a26` |  2 files changed, 2 insertions(+), 1 deletion(-) | fix: prevent Privy from wiping staging user on auth init |
| `e90e03f` |  2 files changed, 23 insertions(+) | fix: fallback to ADP player list when playerState is empty/skeleton |
| `aeb751b` |  2 files changed, 2 insertions(+), 1 deletion(-) | fix: hide R0 P0 on empty drafter card slots |
| `a5c7ae3` |  2 files changed, 10 insertions(+), 2 deletions(-) | feat: staging auth supports ?wallet= param to test as any drafter |
| `e52f220` |  2 files changed, 3 insertions(+), 2 deletions(-) | fix: rename STAGING_TEST_WALLET refs to getStagingWallet() |
| `5722b1a` |  | chore: trigger deploy |
| `81cbdd7` |  1 file changed, 2 insertions(+), 2 deletions(-) | update staging tunnel URLs |
| `0d00da2` |  2 files changed, 40 insertions(+), 27 deletions(-) | fix: home page ENTER button now calls joinDraft API directly |
| `7b3ba9e` |  2 files changed, 16 insertions(+), 11 deletions(-) | fix: delay WS/REST fetch in staging until bots filled and createDraft done |
| `b316fed` |  1 file changed, 62 insertions(+), 32 deletions(-) | fix: add fix-adp step to staging draft flow sequence |
| `6070c49` |  2 files changed, 5 insertions(+), 2 deletions(-) | fix: harden draft-room staging error handling typing |
| `c6a92c2` |  2 files changed, 120 insertions(+), 96 deletions(-) | fix(draft-room): guard WS payload parsing to prevent mid-draft crashes |
| `0429a65` |  4 files changed, 122 insertions(+), 20 deletions(-) | fix(draft-pass): prevent duplicate draft joins from single pass |
| `cf7fbf6` |  1 file changed, 83 insertions(+), 95 deletions(-) | fix(autopick): enforce 2-strike airplane mode with safe turn guards |
| `93bd48a` |  6 files changed, 78 insertions(+), 5 deletions(-) | feat(promos): route jackpot/hof promo claims into next draft join |
| `3e9ff6f` |  1 file changed, 20 insertions(+), 1 deletion(-) | feat(pick10): award wheel spin immediately on 10th pick |
| `403a950` |  4 files changed, 51 insertions(+), 1 deletion(-) | feat(promos): add tweet engagement spin reward promo flow |
| `7c3e6e7` |  2 files changed, 84 insertions(+) | feat(lobby): add pre-draft lobby world entry and page |
| `5c139a3` |  2 files changed, 109 insertions(+) | feat(voice): add draft-room voice chat beta controls |
| `5c0c87a` |  1 file changed, 71 insertions(+) | feat(ops): add blockaid allowlist submission prep page for BBB4 |
| `487a798` |  1 file changed, 119 insertions(+) | feat(admin): add marketing contacts Google Sheets CSV template |
| `be65874` |  2 files changed, 138 insertions(+), 50 deletions(-) | fix(draft-room): harden staging sequencing + remove drafting fallback links |

| `be65874` |  2 files changed, 138 insertions(+), 50 deletions(-) | fix(draft-room): harden staging sequencing retries, remove /drafting fallback links, fix lobby-world params |
| `9877c51` |  1 file changed, 14 insertions(+) | chore: update CHANGELOG-ZERO for draft-room hardening |
| `18b1477` |  2 files changed, 5 insertions(+), 1 deletion(-) | test(e2e): add staged draft flow proof runner and logs |
| `7ca17b4` |  3 files changed, 86 insertions(+) | feat(mobile): add PWA home-screen install helper |
| `dfd3531` |  2 files changed, 268 insertions(+) | feat(teaser): add pre-launch teaser landing page with animated loader and prize pool |
| `6b25ee8` |  2 files changed, 30 insertions(+), 4 deletions(-) | fix(draft-room): prevent premature live draft transition |
| `65aa7d9` |  4 files changed, 198 insertions(+), 4 deletions(-) | chore(staging): refresh tunnels and add remote draft-room proof scripts |
| `ed751fe` |  2 files changed, 64 insertions(+), 8 deletions(-) | fix(home): timeout join + preserve staging overrides on redirect |
| `2209200` |  10 files changed, 570 insertions(+), 104 deletions(-) | feat(draft-room): finalize staged UX flow proof + deploy guardrails |
| `132ed5e` |  3 files changed, 149 insertions(+), 27 deletions(-) | fix(staging-proof): add stage markers and robust proof gating |
| `f9fdf97` |  2 files changed, 26 insertions(+), 46 deletions(-) | fix(draft): parity-lock your-turn banner to inline card Draft CTA |
| `785b068` |  3 files changed, 23 insertions(+), 8 deletions(-) | fix(draft): enforce inline `Draft` CTA visibility/enabled state in expanded Draft + Queue rows when actionable turn |
| `785b068` |  3 files changed, 22 insertions(+), 8 deletions(-) | fix(draft): restore inline Draft CTA in expanded actionable rows |
| `0b920d3` |  3 files changed, 23 insertions(+), 8 deletions(-) | fix(draft): restore inline Draft CTA in expanded actionable rows |
| `891d25c` |  3 files changed, 9 insertions(+), 2 deletions(-) | Fix inline Draft button visibility on dark theme |
| `5ba8799` |  3 files changed, 10 insertions(+), 2 deletions(-) | Fix inline Draft button visibility on dark theme |
| `c4d2e9e` |  3 files changed, 11 insertions(+), 2 deletions(-) | Fix inline Draft button visibility on dark theme |
| `4d33830` |  3 files changed, 12 insertions(+), 2 deletions(-) | Fix inline Draft button visibility on dark theme |
| `cc4e819` |  1 file changed, 12 insertions(+) | fix(draft): sync board live on pick events |
| `9a21dc1` |  1 file changed, 51 insertions(+), 1 deletion(-) | fix(home): recover staging enter from join 500 state mismatch |
| `85e4354` |  1 file changed, 27 insertions(+), 2 deletions(-) | fix(draft): sync board immediately on live pick |
| `da05530` |  6 files changed, 241 insertions(+), 28 deletions(-) | fix(board): render live picked positions in Board tab from draftRoom.picks fallback when summary is stale |
| `da05530` |  6 files changed, 240 insertions(+), 28 deletions(-) | fix(board): hydrate board slots from live picks when summary lags |
| `5737762` |  1 file changed, 2 insertions(+), 1 deletion(-) | chore: update changelog for board live picks fallback |
| `98d85be` |  1 file changed, 39 insertions(+), 9 deletions(-) | fix(board): render drafted player+position in board cells |
