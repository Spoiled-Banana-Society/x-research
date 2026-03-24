import { test, expect } from '@playwright/test';

test.describe('Responsive Design', () => {
  test('homepage renders on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 }); // iPhone X
    await page.goto('/');
    const body = page.locator('body');
    await expect(body).toBeVisible();
    // No horizontal scrollbar
    const scrollWidth = await page.evaluate(() => document.body.scrollWidth);
    const clientWidth = await page.evaluate(() => document.body.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 5); // 5px tolerance
  });

  test('coming-soon renders on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/coming-soon');
    await expect(page.getByText('BBB4')).toBeVisible();
    // Countdown blocks should be visible
    await expect(page.getByText('Days')).toBeVisible();
  });

  test('homepage renders on tablet viewport', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 }); // iPad
    await page.goto('/');
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });

  test('homepage renders on desktop viewport', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });
});
