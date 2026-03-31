# SBS Banana Fantasy API Routes

These routes live under `app/api/` in the Next.js App Router and back the live app experience.

## Current Architecture

- Persistent application data is stored in Firestore and accessed through `lib/db.ts`, `lib/db-firestore.ts`, and the Firebase admin helpers.
- The frontend is integrated with real API flows in staging and production instead of a JSON-file backend.
- Responses are JSON, with errors returned as `{ "error": "message" }` plus an appropriate HTTP status.

## Authentication

- Sensitive mutating endpoints use Privy JWT bearer tokens and reject requests when the authenticated user does not match the request payload.
- Examples include purchase creation, prize withdrawals, wheel spins, and Twitter verification state changes.
- Read-only endpoints may still accept explicit route params or query params when no user mutation occurs.

## Environment-Specific Routes

- Routes under `app/api/debug/` are staging-only and return `404` unless `NEXT_PUBLIC_ENVIRONMENT === 'staging'`.
- Do not expose destructive test helpers in production.

## Functional Areas

### Promos and referrals

- Promo, referral, and claim routes are wired to the live Firestore-backed user and promo records.
- Referral tracking and reward updates run against real user documents and promo subcollections.

### Wheel and purchases

- Wheel spins persist verifiable spin records and update user balances in Firestore.
- Purchase flows create and verify real purchase records used by the buy-drafts UI.

### Drafting and standings

- Draft, standings, history, contest, queue, and rankings endpoints are used by the live app and staging backend integrations.
- Real-time draft state also depends on the external draft server and Firebase realtime helpers where applicable.
