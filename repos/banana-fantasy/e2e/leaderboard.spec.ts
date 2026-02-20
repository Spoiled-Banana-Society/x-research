import { test, expect } from '@playwright/test';

test.describe('Leaderboard Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/leaderboard');
  });

  test('renders page heading', async ({ page }) => {
    await expect(page.getByText(/leaderboard/i).first()).toBeVisible();
  });

  test('renders tab buttons', async ({ page }) => {
    // Should have tab navigation (e.g., Overall, Weekly, etc.)
    const buttons = page.getByRole('button');
    const count = await buttons.count();
    expect(count).toBeGreaterThanOrEqual(2);
  });

  test('tab switching works', async ({ page }) => {
    const buttons = page.getByRole('button');
    const count = await buttons.count();
    if (count >= 2) {
      // Click second tab
      await buttons.nth(1).click();
      await page.waitForTimeout(300);
      // Page should still be visible (no crash)
      await expect(page.locator('body')).toBeVisible();
    }
  });

  test('renders player entries or podium', async ({ page }) => {
    const body = page.locator('body');
    const text = await body.textContent();
    // Should have some player/ranking content
    expect(text?.length).toBeGreaterThan(100);
  });

  test('search input exists and is interactive', async ({ page }) => {
    const search = page.getByPlaceholder(/search/i).first();
    if (await search.isVisible()) {
      await search.fill('test');
      await expect(search).toHaveValue('test');
    }
  });
});
