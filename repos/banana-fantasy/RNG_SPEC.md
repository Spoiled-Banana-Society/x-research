# RNG System Spec — Wheel Spins & Prize Distribution

## Overview
Implement a provably fair RNG system for the spin wheel and any random prize distributions. Must work with the existing frontend wheel component.

## Requirements

### Spin Wheel RNG
- Server-side RNG only (never client-side for real prizes)
- Create `lib/rng.ts` — utility for generating cryptographically secure random outcomes
- Use Node.js `crypto.randomBytes` for server-side randomness
- Each spin result must be logged with a unique spin ID for auditability

### API Route
- Create `app/api/wheel/spin/route.ts`
  - POST — authenticated users only (check Privy JWT)
  - Rate limit: 1 spin per user per day (check Firestore `wheelSpins` collection)
  - Returns: `{ spinId, result, prize, angle }` where angle maps to wheel segment
  - Logs spin to Firestore: `{ userId, spinId, result, prize, timestamp, seed }`

### Wheel Segments (configurable)
The wheel segments should be loaded from a config, not hardcoded. Create `lib/wheelConfig.ts`:
```ts
interface WheelSegment {
  id: string;
  label: string;
  probability: number; // 0-1, all must sum to 1
  prizeType: 'draft_pass' | 'discount' | 'merch' | 'nothing' | 'custom';
  prizeValue?: number | string;
  color: string;
}
```

### Prize Distribution RNG  
- For draft order randomization (already handled by draft server, skip)
- For promotional giveaways: `lib/giveaway.ts` — weighted random selection from eligible participants

### Fairness
- Store seed/nonce for each spin so results can be verified
- Use HMAC-based commit-reveal if needed later (document the pattern but simple RNG is fine for now)

## Files to Create
1. `lib/rng.ts` — core RNG utilities
2. `lib/wheelConfig.ts` — wheel segment configuration  
3. `lib/giveaway.ts` — giveaway random selection
4. `app/api/wheel/spin/route.ts` — spin API endpoint
5. Update existing wheel component to call real API instead of local simulation
