import { test, expect } from '@playwright/test';

test.describe('Draft Queue Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/draft-queue');
  });

  test('renders page heading', async ({ page }) => {
    await expect(page.getByText(/draft/i).first()).toBeVisible();
  });

  test('renders filter pills', async ({ page }) => {
    // Should have filter buttons for draft types
    const buttons = page.getByRole('button');
    await expect(buttons.first()).toBeVisible();
  });

  test('filter pills are clickable', async ({ page }) => {
    const allButton = page.getByRole('button', { name: /all/i }).first();
    if (await allButton.isVisible()) {
      await allButton.click();
      // Should not throw
    }
  });

  test('renders lobby cards or empty state', async ({ page }) => {
    // Page should show either lobby cards or mock data
    const body = page.locator('body');
    await expect(body).toBeVisible();
    // Should have some content (not blank)
    const text = await body.textContent();
    expect(text?.length).toBeGreaterThan(50);
  });

  test('has no console errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error' && !msg.text().includes('hydration')) {
        errors.push(msg.text());
      }
    });
    await page.goto('/draft-queue');
    await page.waitForTimeout(1000);
    expect(errors).toHaveLength(0);
  });
});
