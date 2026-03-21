import { test, expect } from '@playwright/test';

const BASE = 'https://banana-fantasy-sbs.vercel.app';
const TEST_USER = `test-promo-${Date.now()}`;

async function callApi(endpoint: string, body: Record<string, unknown>) {
  const res = await fetch(`${BASE}${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return res.json();
}

async function getPromos(userId: string) {
  const res = await fetch(`${BASE}/api/promos?userId=${encodeURIComponent(userId)}`);
  return res.json();
}

function getDailyDrafts(promos: any[]) {
  return promos.find((p: any) => p.type === 'daily-drafts');
}

test.describe('Daily Drafts Promo (4/4 → Free Spin)', () => {
  test('full lifecycle: 0→1→2→3→4 → claim → reset to 0', async () => {
    // Start fresh — get initial state
    const initial = getDailyDrafts(await getPromos(TEST_USER));
    console.log('Initial:', initial?.progressCurrent, '/', initial?.progressMax, 'timer:', initial?.timerEndTime);
    expect(initial.progressCurrent).toBe(0);
    expect(initial.timerEndTime).toBeFalsy(); // No timer at 0/4

    // Draft 1: should go to 1/4 and start timer
    const r1 = await callApi('/api/promos/draft-complete', { userId: TEST_USER, draftId: 'draft-1' });
    console.log('After draft 1:', r1.promo?.progressCurrent, 'timer:', r1.promo?.timerEndTime);
    expect(r1.promo.progressCurrent).toBe(1);
    expect(r1.promo.timerEndTime).toBeTruthy(); // Timer started
    expect(r1.promo.claimable).toBe(false);

    // Draft 2
    const r2 = await callApi('/api/promos/draft-complete', { userId: TEST_USER, draftId: 'draft-2' });
    console.log('After draft 2:', r2.promo?.progressCurrent);
    expect(r2.promo.progressCurrent).toBe(2);
    expect(r2.promo.claimable).toBe(false);

    // Draft 3
    const r3 = await callApi('/api/promos/draft-complete', { userId: TEST_USER, draftId: 'draft-3' });
    console.log('After draft 3:', r3.promo?.progressCurrent);
    expect(r3.promo.progressCurrent).toBe(3);
    expect(r3.promo.claimable).toBe(false);

    // Draft 4: should hit 4/4, claimable, timer CLEARED
    const r4 = await callApi('/api/promos/draft-complete', { userId: TEST_USER, draftId: 'draft-4' });
    console.log('After draft 4:', r4.promo?.progressCurrent, 'claimable:', r4.promo?.claimable, 'timer:', r4.promo?.timerEndTime);
    expect(r4.promo.progressCurrent).toBe(4);
    expect(r4.promo.claimable).toBe(true);
    expect(r4.promo.claimCount).toBeGreaterThanOrEqual(1);
    expect(r4.promo.timerEndTime).toBeFalsy(); // Timer cleared at 4/4

    // Draft 5: should NOT increment past 4 (claimable guard)
    const r5 = await callApi('/api/promos/draft-complete', { userId: TEST_USER, draftId: 'draft-5' });
    console.log('After draft 5 (should stay 4):', r5.promo?.progressCurrent);
    expect(r5.promo.progressCurrent).toBe(4);

    // Verify via GET promos — should show 4/4, no timer
    const promosAt4 = getDailyDrafts(await getPromos(TEST_USER));
    console.log('GET promos at 4/4:', promosAt4?.progressCurrent, 'timer:', promosAt4?.timerEndTime);
    expect(promosAt4.progressCurrent).toBe(4);
    expect(promosAt4.timerEndTime).toBeFalsy();
    expect(promosAt4.claimable).toBe(true);

    // CLAIM
    const claimResult = await callApi('/api/promos/claim', { userId: TEST_USER, promoId: '1' });
    console.log('After claim:', claimResult.promo?.progressCurrent, 'timer:', claimResult.promo?.timerEndTime, 'spins:', claimResult.spinsAdded);
    expect(claimResult.promo.progressCurrent).toBe(0);
    expect(claimResult.promo.timerEndTime).toBeFalsy(); // Timer cleared
    expect(claimResult.promo.claimable).toBe(false);
    expect(claimResult.spinsAdded).toBeGreaterThanOrEqual(1);

    // Verify via GET promos — should show 0/4, no timer
    const promosAfterClaim = getDailyDrafts(await getPromos(TEST_USER));
    console.log('GET promos after claim:', promosAfterClaim?.progressCurrent, 'timer:', promosAfterClaim?.timerEndTime);
    expect(promosAfterClaim.progressCurrent).toBe(0);
    expect(promosAfterClaim.timerEndTime).toBeFalsy();
    expect(promosAfterClaim.claimable).toBe(false);

    // Start new cycle — draft 6 should go to 1/4 with new timer
    const r6 = await callApi('/api/promos/draft-complete', { userId: TEST_USER, draftId: 'draft-6' });
    console.log('New cycle draft 1:', r6.promo?.progressCurrent, 'timer:', r6.promo?.timerEndTime);
    expect(r6.promo.progressCurrent).toBe(1);
    expect(r6.promo.timerEndTime).toBeTruthy(); // Fresh timer
    expect(r6.promo.claimable).toBe(false);
  });

  test('idempotency: same draftId does not double-count', async () => {
    const userId = `${TEST_USER}-idem`;

    const r1 = await callApi('/api/promos/draft-complete', { userId, draftId: 'same-draft' });
    expect(r1.promo.progressCurrent).toBe(1);

    const r2 = await callApi('/api/promos/draft-complete', { userId, draftId: 'same-draft' });
    expect(r2.promo.progressCurrent).toBe(1); // Should NOT increment
  });

  test('multiple cycles without claiming accumulates claimCount', async () => {
    const userId = `${TEST_USER}-multi`;

    // First cycle to 4/4
    for (let i = 1; i <= 4; i++) {
      await callApi('/api/promos/draft-complete', { userId, draftId: `cycle1-${i}` });
    }
    const at4 = getDailyDrafts(await getPromos(userId));
    expect(at4.progressCurrent).toBe(4);
    expect(at4.claimable).toBe(true);
    expect(at4.claimCount).toBe(1);

    // Claim
    await callApi('/api/promos/claim', { userId, promoId: '1' });
    const afterClaim = getDailyDrafts(await getPromos(userId));
    expect(afterClaim.progressCurrent).toBe(0);
    expect(afterClaim.claimable).toBe(false);

    // Second cycle to 4/4
    for (let i = 1; i <= 4; i++) {
      await callApi('/api/promos/draft-complete', { userId, draftId: `cycle2-${i}` });
    }
    const at4again = getDailyDrafts(await getPromos(userId));
    expect(at4again.progressCurrent).toBe(4);
    expect(at4again.claimable).toBe(true);
    expect(at4again.claimCount).toBe(1);
  });
});
