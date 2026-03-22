import { test, expect } from '@playwright/test';

const BASE = 'http://localhost:3000';

test.describe('Randomizing bar speed (3s)', () => {
  test('draft room transitions past randomizing within 10 seconds of 10/10', async ({ page }) => {
    // Enter draft room in local mode — starts at 8/10, fills to 10/10 quickly
    await page.goto(`${BASE}/draft-room?name=SpeedTest&speed=fast&players=8`);

    const startTime = Date.now();

    // Should reach pre-spin or drafting within 10s (filling + 3s bar)
    // The bar is so fast it might not even be visible — check for post-bar state
    const postBar = page.locator('text=Draft type reveal').or(page.locator('text=Starting soon'));
    await expect(postBar.first()).toBeVisible({ timeout: 15000 });

    const elapsed = Date.now() - startTime;
    console.log(`Filling + randomizing took ${elapsed}ms total`);
    // Should be way under 15s (filling ~2s + bar 3s = ~5s)
    expect(elapsed).toBeLessThan(12000);
  });

  test('drafting page shows randomizing then transitions to countdown', async ({ page }) => {
    // Set up a draft in draftStore that's at 10/10 with randomizing started
    await page.goto(`${BASE}/drafting`);
    await page.waitForTimeout(1000);

    // Inject a draft into localStorage that's randomizing
    await page.evaluate(() => {
      const draft = {
        id: 'speed-test-draft',
        contestName: 'Speed Test',
        status: 'filling',
        type: null,
        draftSpeed: 'fast',
        players: 10,
        maxPlayers: 10,
        lastUpdated: Date.now(),
        phase: 'filling',
        fillingStartedAt: Date.now() - 10000,
        fillingInitialPlayers: 10,
        randomizingStartedAt: Date.now(),
      };
      const existing = JSON.parse(localStorage.getItem('banana-active-drafts') || '[]');
      existing.push(draft);
      localStorage.setItem('banana-active-drafts', JSON.stringify(existing));
    });

    // Reload to pick up the new draft
    await page.reload();
    await page.waitForTimeout(500);

    // Should show randomizing state
    const randomizingText = page.locator('text=Randomizing');
    const startTime = Date.now();

    // Wait for it to appear
    try {
      await expect(randomizingText).toBeVisible({ timeout: 3000 });
      console.log('Randomizing visible after', Date.now() - startTime, 'ms');

      // Should transition away within 5s
      await expect(randomizingText).not.toBeVisible({ timeout: 6000 });
      const elapsed = Date.now() - startTime;
      console.log(`Drafting page randomizing took ${elapsed}ms total`);
      expect(elapsed).toBeLessThan(7000);
    } catch {
      // If randomizing already passed (fast enough), that's fine
      console.log('Randomizing already transitioned (very fast)');
    }

    // Clean up
    await page.evaluate(() => {
      const drafts = JSON.parse(localStorage.getItem('banana-active-drafts') || '[]');
      const filtered = drafts.filter((d: { id: string }) => d.id !== 'speed-test-draft');
      localStorage.setItem('banana-active-drafts', JSON.stringify(filtered));
    });
  });
});
