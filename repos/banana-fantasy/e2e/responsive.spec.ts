import { test, expect } from '@playwright/test';

const BASE = 'http://localhost:3000';

const VIEWPORTS = [
  { name: 'iPhone SE', width: 375, height: 667 },
  { name: 'iPad', width: 768, height: 1024 },
  { name: 'Laptop', width: 1024, height: 768 },
  { name: 'Desktop', width: 1440, height: 900 },
];

for (const vp of VIEWPORTS) {
  test.describe(`${vp.name} (${vp.width}x${vp.height})`, () => {
    test('home page — no horizontal overflow', async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto(BASE);
      await page.waitForTimeout(2000);
      const hasOverflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
      console.log(`${vp.name} home: overflow=${hasOverflow}`);
      expect(hasOverflow).toBe(false);
    });

    test('drafting page — no horizontal overflow', async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto(`${BASE}/drafting`);
      await page.waitForTimeout(2000);
      const hasOverflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
      console.log(`${vp.name} drafting: overflow=${hasOverflow}`);
      expect(hasOverflow).toBe(false);
    });

    test('draft room — no page-level horizontal overflow', async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto(`${BASE}/draft-room?name=Test&speed=fast&players=5`);
      await page.waitForTimeout(2000);
      const hasOverflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
      console.log(`${vp.name} draft-room: overflow=${hasOverflow}`);
      expect(hasOverflow).toBe(false);
    });
  });
}

test('phone: drafting page hides Speed/Type columns', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto(`${BASE}/drafting`);
  await page.evaluate(() => {
    localStorage.setItem('banana-active-drafts', JSON.stringify([{
      id: 'resp-test', contestName: 'BBB #1', status: 'drafting', type: 'pro',
      draftSpeed: 'fast', players: 10, maxPlayers: 10, lastUpdated: Date.now(),
      phase: 'drafting', currentPick: 3, isYourTurn: false,
    }]));
  });
  await page.reload();
  await page.waitForTimeout(2000);
  const speedVisible = await page.locator('text=30 sec').isVisible().catch(() => false);
  console.log('Phone: Speed visible =', speedVisible);
  expect(speedVisible).toBe(false);
  await page.evaluate(() => localStorage.removeItem('banana-active-drafts'));
});

test('desktop: drafting page shows Speed/Type columns', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(`${BASE}/drafting`);
  await page.evaluate(() => {
    localStorage.setItem('banana-active-drafts', JSON.stringify([{
      id: 'resp-test-2', contestName: 'BBB #2', status: 'drafting', type: 'pro',
      draftSpeed: 'fast', players: 10, maxPlayers: 10, lastUpdated: Date.now(),
      phase: 'drafting', currentPick: 3, isYourTurn: false,
    }]));
  });
  await page.reload();
  await page.waitForTimeout(2000);
  const speedVisible = await page.locator('text=30 sec').isVisible().catch(() => false);
  console.log('Desktop: Speed visible =', speedVisible);
  expect(speedVisible).toBe(true);
  await page.evaluate(() => localStorage.removeItem('banana-active-drafts'));
});
