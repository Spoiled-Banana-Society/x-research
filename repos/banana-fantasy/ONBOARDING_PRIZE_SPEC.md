# Onboarding & Prize Completion Spec

## Onboarding — Finish Wiring

The auth context now has `isNewUser`, `showOnboarding`, `setShowOnboarding`. Complete the flow:

### Tasks
1. **OnboardingFlow component** (`components/onboarding/OnboardingFlow.tsx`)
   - Should render when `showOnboarding === true`
   - Steps: Welcome → Display Name → Avatar (optional) → Wallet Connect → Done
   - Each step calls real API endpoints (profile update, etc.)
   - On complete: `setShowOnboarding(false)`, `setIsNewUser(false)`
   - Remove all unused handlers that got eslint-disabled (handleSkip, handleProfileSubmit, handleFileChange) — either wire them properly or remove dead code

2. **New user detection** — already in useAuth, verify it works:
   - First login (no existing owner record) → show onboarding
   - Returning user → skip straight to dashboard

3. **Profile API** — ensure `app/api/owners/route.ts` handles:
   - GET — fetch owner by wallet/userId  
   - PUT — update display name, avatar URL
   - POST — create new owner record

## Prize System — Complete the Flow

### Withdraw Modal
- `components/modals/WithdrawModal.tsx` should exist — verify it works
- Wire to real withdrawal API: POST `/api/prizes/withdraw`
- Withdrawal creates a `withdrawalRequests` record in Firestore
- Status flow: pending → processing → completed/failed

### Prize Hooks
- `hooks/usePrizes.ts` — verify `usePrizes()` and `useEligibility()` call real API routes
- The API routes (`app/api/prizes/route.ts`, `app/api/eligibility/route.ts`) were wired to Go backend — verify they work

### Eligibility Display
- Prizes page shows eligibility status (KYC, age, region)
- Badge colors: verified=green, pending=yellow, unverified=red
- Link to verification flow when not eligible

## Build
After all changes, run `npm run build` and fix any errors. Commit with descriptive message.
