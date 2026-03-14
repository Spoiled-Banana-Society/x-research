import { test, expect } from '@playwright/test';

test.describe('Drafting Page — Live Timer & Picks Away', () => {
  test('timer counts down live from pickEndTimestamp', async ({ page }) => {
    const petOffset = 20;
    await page.addInitScript((offset) => {
      sessionStorage.setItem('sbs-staging-mode', 'true');
      localStorage.setItem('banana-auth', JSON.stringify({
        isLoggedIn: true,
        user: { id: 'test', username: 'TestUser', walletAddress: '0xtest', draftPasses: 5, freeDrafts: 3 },
      }));
      const pet = Date.now() / 1000 + offset;
      localStorage.setItem('banana-active-drafts', JSON.stringify([{
        id: 'timer-test-1', contestName: 'BBB #999', status: 'drafting', type: 'pro',
        draftSpeed: 'fast', players: 10, maxPlayers: 10, lastUpdated: Date.now(),
        phase: 'drafting', isYourTurn: true, pickEndTimestamp: pet, enginePickNumber: 5,
        currentPick: 0, liveWalletAddress: '0xtest', timeRemaining: offset,
      }]));
    }, petOffset);

    await page.goto('/drafting');
    await page.waitForSelector('text=BBB #999');

    // Timer should be around 18-20, not stuck at 30
    const timerSpan = page.locator('span.text-banana.font-bold').first();
    await expect(timerSpan).toBeVisible();
    const initialVal = parseInt((await timerSpan.textContent()) || '0');
    expect(initialVal).toBeLessThanOrEqual(petOffset);
    expect(initialVal).toBeGreaterThan(0);

    // Wait 3 seconds — should decrease
    await page.waitForTimeout(3000);
    const laterVal = parseInt((await timerSpan.textContent()) || '0');
    expect(laterVal).toBeLessThan(initialVal);
  });

  test('picks away updates from localStorage changes', async ({ page }) => {
    await page.addInitScript(() => {
      sessionStorage.setItem('sbs-staging-mode', 'true');
      localStorage.setItem('banana-auth', JSON.stringify({
        isLoggedIn: true,
        user: { id: 'test', username: 'TestUser', walletAddress: '0xtest', draftPasses: 5, freeDrafts: 3 },
      }));
      localStorage.setItem('banana-active-drafts', JSON.stringify([{
        id: 'picks-test-1', contestName: 'BBB #888', status: 'drafting', type: 'hof',
        draftSpeed: 'fast', players: 10, maxPlayers: 10, lastUpdated: Date.now(),
        phase: 'drafting', isYourTurn: false, currentPick: 3, liveWalletAddress: '0xtest',
      }]));
    });

    await page.goto('/drafting');
    await page.waitForSelector('text=BBB #888');
    await expect(page.locator('text=3 picks away')).toBeVisible();

    // Simulate poll updating picks away to 1
    await page.evaluate(() => {
      const drafts = JSON.parse(localStorage.getItem('banana-active-drafts') || '[]');
      drafts[0].currentPick = 1;
      drafts[0].lastUpdated = Date.now();
      localStorage.setItem('banana-active-drafts', JSON.stringify(drafts));
      // Trigger storage listener (same-tab writes need explicit StorageEvent)
      window.dispatchEvent(new StorageEvent('storage', { key: 'banana-active-drafts' }));
    });

    await expect(page.locator('text=1 pick away')).toBeVisible({ timeout: 3000 });
  });
});
