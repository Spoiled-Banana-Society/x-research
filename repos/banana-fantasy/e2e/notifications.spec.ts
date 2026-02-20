import { test, expect } from '@playwright/test';

test.describe('Notifications Page', () => {
  test('renders page', async ({ page }) => {
    await page.goto('/notifications');
    await expect(page.locator('body')).toBeVisible();
  });

  test('renders notification content or empty state', async ({ page }) => {
    await page.goto('/notifications');
    const body = page.locator('body');
    const text = await body.textContent();
    expect(text?.length).toBeGreaterThan(20);
  });

  test('has no console errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error' && !msg.text().includes('hydration')) {
        errors.push(msg.text());
      }
    });
    await page.goto('/notifications');
    await page.waitForTimeout(1000);
    expect(errors).toHaveLength(0);
  });
});
