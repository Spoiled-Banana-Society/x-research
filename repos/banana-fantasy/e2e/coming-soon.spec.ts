import { test, expect } from '@playwright/test';

test.describe('Coming Soon Page', () => {
  test('loads and shows BBB4 title', async ({ page }) => {
    await page.goto('/coming-soon');
    await expect(page.getByText('BBB4')).toBeVisible();
    await expect(page.getByText('IS COMING')).toBeVisible();
  });

  test('displays countdown timer', async ({ page }) => {
    await page.goto('/coming-soon');
    await expect(page.getByText('Days')).toBeVisible();
    await expect(page.getByText('Hours')).toBeVisible();
    await expect(page.getByText('Minutes')).toBeVisible();
    await expect(page.getByText('Seconds')).toBeVisible();
  });

  test('shows feature cards', async ({ page }) => {
    await page.goto('/coming-soon');
    await expect(page.getByText('Draft & Compete')).toBeVisible();
    await expect(page.getByText('Win Prizes')).toBeVisible();
    await expect(page.getByText('Own Your Picks')).toBeVisible();
  });

  test('email capture works', async ({ page }) => {
    await page.goto('/coming-soon');
    const emailInput = page.getByPlaceholder('you@example.com');
    await expect(emailInput).toBeVisible();

    // Submit a valid email
    await emailInput.fill('test@example.com');
    await page.getByRole('button', { name: /notify/i }).click();

    // Should show success state
    await expect(page.getByText(/on the list/i)).toBeVisible();
  });

  test('email validation rejects invalid input', async ({ page }) => {
    await page.goto('/coming-soon');
    const emailInput = page.getByPlaceholder('you@example.com');

    await emailInput.fill('notanemail');
    await page.getByRole('button', { name: /notify/i }).click();

    // Should show error
    await expect(page.getByText(/valid email/i)).toBeVisible();
  });
});
