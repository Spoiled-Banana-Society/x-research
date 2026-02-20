import { test, expect } from '@playwright/test';

test.describe('How It Works Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/how-it-works');
  });

  test('renders hero section', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Fantasy Football');
    await expect(page.getByRole('link', { name: /buy your first pass/i })).toBeVisible();
  });

  test('renders all four steps', async ({ page }) => {
    await expect(page.getByText('Buy Draft Passes')).toBeVisible();
    await expect(page.getByText('Draft Your Team')).toBeVisible();
    await expect(page.getByText('Score Every Week')).toBeVisible();
    await expect(page.getByText('Win Prizes')).toBeVisible();
  });

  test('renders What is Best Ball section', async ({ page }) => {
    await expect(page.getByText('What is Best Ball?')).toBeVisible();
    await expect(page.getByText('Draft & Done')).toBeVisible();
    await expect(page.getByText('Auto-Optimized')).toBeVisible();
    await expect(page.getByText('Zero Stress')).toBeVisible();
  });

  test('renders prize structure', async ({ page }) => {
    await expect(page.getByText('How You Win')).toBeVisible();
    await expect(page.getByText('League Winner')).toBeVisible();
    await expect(page.getByText('Jackpot')).toBeVisible();
    await expect(page.getByText('Hall of Fame')).toBeVisible();
  });

  test('renders comparison table', async ({ page }) => {
    await expect(page.getByText('Traditional Fantasy vs Best Ball')).toBeVisible();
    await expect(page.getByText('Lineup management')).toBeVisible();
    await expect(page.getByText('None — auto-optimized')).toBeVisible();
  });

  test('FAQ accordion opens and closes', async ({ page }) => {
    const faqButton = page.getByRole('button', { name: /what is best ball/i });
    await expect(faqButton).toBeVisible();

    // Click to open
    await faqButton.click();
    await expect(page.getByText(/highest-scoring players are automatically selected/i)).toBeVisible();

    // Click to close
    await faqButton.click();
    await expect(page.getByText(/highest-scoring players are automatically selected/i)).not.toBeVisible();
  });

  test('renders testimonials section', async ({ page }) => {
    await expect(page.getByText('What Players Say')).toBeVisible();
  });

  test('renders final CTA', async ({ page }) => {
    await expect(page.getByText('Ready to Draft?')).toBeVisible();
    await expect(page.getByRole('link', { name: /get started/i })).toBeVisible();
  });
});
