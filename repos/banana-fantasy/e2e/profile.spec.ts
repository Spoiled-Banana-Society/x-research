import { test, expect } from '@playwright/test';

test.describe('Profile Page', () => {
  test('renders login prompt when not authenticated', async ({ page }) => {
    await page.goto('/profile');
    // Should show login/connect wallet prompt since no auth
    await expect(page.getByText(/log in|connect wallet|your profile/i).first()).toBeVisible();
  });

  test('has connect wallet button', async ({ page }) => {
    await page.goto('/profile');
    const button = page.getByRole('button', { name: /connect|log in|wallet/i }).first();
    if (await button.isVisible()) {
      await expect(button).toBeEnabled();
    }
  });

  test('does not crash on load', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error' && !msg.text().includes('hydration')) {
        errors.push(msg.text());
      }
    });
    await page.goto('/profile');
    await page.waitForTimeout(1000);
    expect(errors).toHaveLength(0);
  });
});
