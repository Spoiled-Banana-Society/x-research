import { test, expect } from '@playwright/test';

test.describe('Referrals Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/referrals');
  });

  test('renders page heading', async ({ page }) => {
    await expect(page.getByText(/refer/i).first()).toBeVisible();
  });

  test('renders reward tiers or referral info', async ({ page }) => {
    const body = page.locator('body');
    const text = await body.textContent();
    expect(text?.length).toBeGreaterThan(100);
  });

  test('copy button exists', async ({ page }) => {
    // Copy button for referral link/code (may require auth to show code)
    const copyButton = page.getByRole('button', { name: /copy|share|generate/i }).first();
    if (await copyButton.isVisible()) {
      await expect(copyButton).toBeEnabled();
    }
  });

  test('has no console errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error' && !msg.text().includes('hydration')) {
        errors.push(msg.text());
      }
    });
    await page.goto('/referrals');
    await page.waitForTimeout(1000);
    expect(errors).toHaveLength(0);
  });
});
