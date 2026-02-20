import { test, expect } from '@playwright/test';

test.describe('Genesis Legacy Page', () => {
  test('loads at /about/genesis', async ({ page }) => {
    await page.goto('/about/genesis');
    await expect(page.getByText('Genesis')).toBeVisible();
  });

  test('shows legacy program badge', async ({ page }) => {
    await page.goto('/about/genesis');
    await expect(page.getByText('Legacy Program')).toBeVisible();
  });

  test('explains Genesis moved to Discord', async ({ page }) => {
    await page.goto('/about/genesis');
    await expect(page.getByText(/no longer active/i)).toBeVisible();
    await expect(page.getByText('Discord')).toBeVisible();
  });

  test('has prize claims info', async ({ page }) => {
    await page.goto('/about/genesis');
    await expect(page.getByText(/Prize Claims/i)).toBeVisible();
  });

  test('has Discord CTA link', async ({ page }) => {
    await page.goto('/about/genesis');
    const discordLink = page.getByRole('link', { name: /Join Discord/i });
    await expect(discordLink).toBeVisible();
    await expect(discordLink).toHaveAttribute('href', /discord/i);
  });

  test('has back to home link', async ({ page }) => {
    await page.goto('/about/genesis');
    const homeLink = page.getByRole('link', { name: /Back to Home/i });
    await expect(homeLink).toBeVisible();
    await expect(homeLink).toHaveAttribute('href', '/');
  });
});
