# SBS Banana Fantasy — New Next.js API Routes

These API routes are **temporary** backend endpoints implemented inside the Next.js 14 App Router under `app/api/`.

They use a simple JSON-file data layer (`data/db.json`) via `lib/db.ts` so we can ship UI flows now and swap to Firestore later.

## Common Notes

- All responses are JSON.
- Errors use `{ "error": "message" }` and an appropriate HTTP status.
- For now, authentication is not enforced. Most endpoints require `userId`.

---

## Promos

### `GET /api/promos?userId=...`
List active promos for a user.

**Response:** `Promo[]`

### `POST /api/promos/claim`
Claim promo rewards.

**Body**
```json
{ "userId": "1", "promoId": "6" }
```

**Response**
```json
{ "promo": { /* Promo */ }, "spinsAdded": 1, "user": { /* User */ } }
```

### `GET /api/promos/referral/[userId]`
Get referral stats.

**Response**
```json
{
  "userId": "1",
  "code": "BANANA-...",
  "link": "https://...",
  "totalReferrals": 2,
  "claimableRewards": 2,
  "referralRewards": [],
  "referralHistory": []
}
```

### `POST /api/promos/referral/generate`
Generate a new referral code.

**Body**
```json
{ "userId": "1", "username": "BananaKing99" }
```

**Response**
```json
{ "code": "BANANA-XXXXXX-YYYYYY", "link": "https://bananabestball.com/ref/BANANA-..." }
```

---

## Banana Wheel

### `POST /api/wheel/spin`
Executes a spin and applies the prize to the user immediately.

**Body**
```json
{ "userId": "1" }
```

**Response**
```json
{ "spin": { /* WheelSpin */ }, "user": { /* User */ } }
```

### `GET /api/wheel/history?userId=...`
Returns spin history.

**Response:** `WheelSpin[]`

---

## Purchases (Buy Drafts)

### `POST /api/purchases/create`
Initiate a purchase.

**Body**
```json
{ "userId": "1", "quantity": 10, "paymentMethod": "usdc" }
```

**Response**
```json
{
  "purchase": { /* Purchase */ },
  "payment": {
    "toAddress": "0x...",
    "chainId": 8453,
    "tokenAddress": "0x8335...",
    "amount": "250",
    "decimals": 6
  }
}
```

### `POST /api/purchases/verify`
Marks a purchase as completed (simulated onchain verification).

**Body**
```json
{ "purchaseId": "...", "txHash": "0x..." }
```

**Response**
```json
{
  "purchase": { /* Purchase */ },
  "user": { /* User */ },
  "spinsAdded": 1,
  "draftPassesAdded": 10,
  "freeDraftsAdded": 5
}
```

### `GET /api/purchases/history?userId=...`
Get purchase history.

**Response:** `Purchase[]`

---

## Contests

### `GET /api/contests`
List all contests.

**Response:** `Contest[]`

### `GET /api/contests/[id]`
Contest details.

**Response:** `Contest`

### `GET /api/contests/[id]/standings`
Contest standings.

**Response:** `LeaderboardEntry[]`

---

## Prizes

### `GET /api/prizes?userId=...`
List prize history for a user.

**Response:** `Prize[]`

### `GET /api/eligibility?userId=...`
Returns eligibility status for the user.

**Response:** `EligibilityStatus`

---

## Exposure

### `GET /api/exposure/[userId]`
Get exposure stats.

**Response:** `UserExposure`

---

## Draft History

### `GET /api/history/[userId]`
Completed drafts with results.

**Response:** `CompletedDraft[]`
