import { test, expect } from '@playwright/test';

test.describe('Drafting Page - Draft Visibility', () => {
  test('shows a seeded filling draft immediately with correct phase', async ({ page }) => {
    // Navigate to set up localStorage
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    const now = Date.now();
    // Seed a filling draft that started 5 seconds ago with 1 initial player
    // After 5s: simulated count = 1 + floor(5000/800) = 7
    // Tick effect will advance to 10 quickly, then set randomizingStartedAt
    await page.evaluate((timestamp) => {
      const draft = {
        id: 'test-filling-123',
        contestName: 'BBB #9999',
        status: 'filling',
        type: null,
        draftSpeed: 'fast',
        players: 1,
        maxPlayers: 10,
        joinedAt: timestamp - 5000,
        phase: 'filling',
        fillingStartedAt: timestamp - 5000,
        fillingInitialPlayers: 1,
        lastUpdated: timestamp,
        liveWalletAddress: '0xTestWallet999',
      };
      localStorage.setItem('banana-active-drafts', JSON.stringify([draft]));
    }, now);

    // Navigate to drafting page
    await page.goto('/drafting');
    await page.waitForLoadState('domcontentloaded');

    // The draft should appear immediately (not after 10 seconds)
    const draftRow = page.locator('text=BBB #9999');
    await expect(draftRow).toBeVisible({ timeout: 5000 });

    // After 5+ seconds elapsed, the simulation would have reached 10/10
    // The tick effect should set randomizingStartedAt, so we'd see "Randomizing..."
    // OR at minimum, a count well above 1
    await page.waitForTimeout(1500); // Let tick effect run

    // Should NOT show "1/10" — either shows higher count or "Randomizing..."
    const oneOfTen = page.locator('text=/^1\\/10$/');
    const isOneOfTen = await oneOfTen.isVisible().catch(() => false);
    expect(isOneOfTen).toBe(false);
  });

  test('shows 10/10 or Randomizing for old filling draft', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    const now = Date.now();
    // Seed a draft that started 15 seconds ago — should be well past 10/10
    await page.evaluate((timestamp) => {
      const draft = {
        id: 'test-filling-456',
        contestName: 'BBB #8888',
        status: 'filling',
        type: null,
        draftSpeed: 'fast',
        players: 1,
        maxPlayers: 10,
        joinedAt: timestamp - 15000,
        phase: 'filling',
        fillingStartedAt: timestamp - 15000,
        fillingInitialPlayers: 1,
        lastUpdated: timestamp,
      };
      localStorage.setItem('banana-active-drafts', JSON.stringify([draft]));
    }, now);

    await page.goto('/drafting');
    await page.waitForLoadState('domcontentloaded');

    const draftRow = page.locator('text=BBB #8888');
    await expect(draftRow).toBeVisible({ timeout: 5000 });

    // Wait for tick effect to process
    await page.waitForTimeout(2000);

    // Should show "Randomizing..." (count reached 10 long ago)
    const randomizing = page.locator('text=Randomizing...');
    await expect(randomizing).toBeVisible({ timeout: 3000 });
  });

  test('shows correct count when players field is higher than simulation', async ({ page }) => {
    // This tests the Math.max fix: server updated players to 5 but simulation starts at 1
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    const now = Date.now();
    await page.evaluate((timestamp) => {
      const draft = {
        id: 'test-server-count',
        contestName: 'BBB #7777',
        status: 'filling',
        type: null,
        draftSpeed: 'fast',
        players: 5, // Server says 5 players
        maxPlayers: 10,
        joinedAt: timestamp,
        phase: 'filling',
        fillingStartedAt: timestamp, // Just started — simulation would say 1
        fillingInitialPlayers: 1,
        lastUpdated: timestamp,
        liveWalletAddress: '0xTestWallet777',
      };
      localStorage.setItem('banana-active-drafts', JSON.stringify([draft]));
    }, now);

    await page.goto('/drafting');
    await page.waitForLoadState('domcontentloaded');

    const draftRow = page.locator('text=BBB #7777');
    await expect(draftRow).toBeVisible({ timeout: 5000 });

    // The count should be at least 5 (from draft.players), not 1 (from simulation)
    // Check that "1/10" is NOT shown
    const oneOfTen = page.locator('text=/^1\\/10$/');
    const isOneOfTen = await oneOfTen.isVisible().catch(() => false);
    expect(isOneOfTen).toBe(false);
  });

  test('draft with no timestamps still shows using players field', async ({ page }) => {
    // Tests fallback when fillingStartedAt/fillingInitialPlayers are missing
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    await page.evaluate(() => {
      const draft = {
        id: 'test-no-timestamps',
        contestName: 'BBB #6666',
        status: 'filling',
        type: null,
        draftSpeed: 'fast',
        players: 3,
        maxPlayers: 10,
        joinedAt: Date.now(),
        phase: 'filling',
        // No fillingStartedAt or fillingInitialPlayers
        lastUpdated: Date.now(),
      };
      localStorage.setItem('banana-active-drafts', JSON.stringify([draft]));
    });

    await page.goto('/drafting');
    await page.waitForLoadState('domcontentloaded');

    const draftRow = page.locator('text=BBB #6666');
    await expect(draftRow).toBeVisible({ timeout: 5000 });

    // Should show 3/10 from players field
    const threeOfTen = page.locator('text=/3.*\\/.*10/');
    await expect(threeOfTen).toBeVisible({ timeout: 3000 });
  });
});
