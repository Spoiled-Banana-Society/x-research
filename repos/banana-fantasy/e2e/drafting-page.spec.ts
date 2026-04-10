import { test, expect } from '@playwright/test';

test.describe('Drafting Page - Draft Visibility', () => {
  test('shows a seeded filling draft on the drafting page', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    await page.evaluate(() => {
      const draft = {
        id: 'test-filling-123',
        contestName: 'BBB #9999',
        status: 'filling',
        type: null,
        draftSpeed: 'fast',
        players: 4,
        maxPlayers: 10,
        joinedAt: Date.now(),
        phase: 'filling',
        lastUpdated: Date.now(),
        liveWalletAddress: '0xTestWallet999',
      };
      localStorage.setItem('banana-active-drafts', JSON.stringify([draft]));
    });

    await page.goto('/drafting');
    await page.waitForLoadState('domcontentloaded');

    // Should show the draft card with filling count
    const draftCard = page.locator('text=/4.*\\/.*10/');
    await expect(draftCard).toBeVisible({ timeout: 5000 });
  });

  test('shows Randomizing for draft at 10 players', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    await page.evaluate(() => {
      const draft = {
        id: 'test-filling-456',
        contestName: 'BBB #8888',
        status: 'filling',
        type: null,
        draftSpeed: 'fast',
        players: 10,
        maxPlayers: 10,
        joinedAt: Date.now() - 15000,
        phase: 'filling',
        lastUpdated: Date.now(),
      };
      localStorage.setItem('banana-active-drafts', JSON.stringify([draft]));
    });

    await page.goto('/drafting');
    await page.waitForLoadState('domcontentloaded');

    // Wait for tick effect to process — at 10 players it transitions to randomizing
    await page.waitForTimeout(2000);

    const randomizing = page.locator('text=Randomizing...');
    await expect(randomizing).toBeVisible({ timeout: 3000 });
  });

  test('shows correct player count from players field', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    await page.evaluate(() => {
      const draft = {
        id: 'test-server-count',
        contestName: 'BBB #7777',
        status: 'filling',
        type: null,
        draftSpeed: 'fast',
        players: 5,
        maxPlayers: 10,
        joinedAt: Date.now(),
        phase: 'filling',
        lastUpdated: Date.now(),
        liveWalletAddress: '0xTestWallet777',
      };
      localStorage.setItem('banana-active-drafts', JSON.stringify([draft]));
    });

    await page.goto('/drafting');
    await page.waitForLoadState('domcontentloaded');

    // Should show 5/10 from players field
    const fiveOfTen = page.locator('text=/5.*\\/.*10/');
    await expect(fiveOfTen).toBeVisible({ timeout: 5000 });
  });

  test('shows 3/10 count from players field', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    await page.evaluate(() => {
      const draft = {
        id: 'test-count-display',
        contestName: 'BBB #6666',
        status: 'filling',
        type: null,
        draftSpeed: 'fast',
        players: 3,
        maxPlayers: 10,
        joinedAt: Date.now(),
        phase: 'filling',
        lastUpdated: Date.now(),
      };
      localStorage.setItem('banana-active-drafts', JSON.stringify([draft]));
    });

    await page.goto('/drafting');
    await page.waitForLoadState('domcontentloaded');

    // Should show 3/10 from players field
    const threeOfTen = page.locator('text=/3.*\\/.*10/');
    await expect(threeOfTen).toBeVisible({ timeout: 5000 });
  });
});
