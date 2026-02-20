import { test, expect } from '@playwright/test';

test.describe('Jackpot & HOF Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/jackpot-hof');
  });

  test('renders page title', async ({ page }) => {
    await expect(page.getByText(/jackpot/i).first()).toBeVisible();
  });

  test('renders prize sections', async ({ page }) => {
    // Should have content about jackpot and HOF
    const body = page.locator('body');
    await expect(body).toContainText(/prize/i);
  });

  test('has CTA links', async ({ page }) => {
    const links = page.getByRole('link');
    await expect(links.first()).toBeVisible();
  });
});
