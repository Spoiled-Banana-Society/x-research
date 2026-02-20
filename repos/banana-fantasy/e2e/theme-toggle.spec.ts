import { test, expect } from '@playwright/test';

test.describe('Dark Mode Toggle', () => {
  test('page defaults to dark theme', async ({ page }) => {
    await page.goto('/');
    const theme = await page.locator('html').getAttribute('data-theme');
    expect(theme).toBe('dark');
  });

  test('toggle button exists in header', async ({ page }) => {
    await page.goto('/');
    // ThemeToggle renders a button with an aria-label about mode
    const toggle = page.getByRole('button', { name: /dark mode|light mode|system theme/i });
    await expect(toggle).toBeVisible();
  });

  test('clicking toggle switches to light mode', async ({ page }) => {
    await page.goto('/');
    const toggle = page.getByRole('button', { name: /dark mode/i });
    await toggle.click();

    const theme = await page.locator('html').getAttribute('data-theme');
    expect(theme).toBe('light');
  });

  test('theme persists in localStorage', async ({ page }) => {
    await page.goto('/');
    const toggle = page.getByRole('button', { name: /dark mode/i });
    await toggle.click();

    const stored = await page.evaluate(() => localStorage.getItem('sbs-theme'));
    expect(stored).toBe('light');
  });

  test('light mode changes background color', async ({ page }) => {
    await page.goto('/');
    // Switch to light
    const toggle = page.getByRole('button', { name: /dark mode/i });
    await toggle.click();

    // Body background should be lighter
    const bg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    // Light mode bg-primary is rgb(248, 249, 250)
    expect(bg).not.toBe('rgb(10, 10, 15)'); // Not dark
  });

  test('cycling through all three modes', async ({ page }) => {
    await page.goto('/');

    // Start: dark
    let theme = await page.locator('html').getAttribute('data-theme');
    expect(theme).toBe('dark');

    // Click 1: dark → light
    await page.getByRole('button', { name: /dark mode/i }).click();
    theme = await page.locator('html').getAttribute('data-theme');
    expect(theme).toBe('light');

    // Click 2: light → system
    await page.getByRole('button', { name: /light mode/i }).click();
    theme = await page.locator('html').getAttribute('data-theme');
    // System resolves to either light or dark
    expect(['light', 'dark']).toContain(theme);

    // Click 3: system → dark
    await page.getByRole('button', { name: /system theme/i }).click();
    theme = await page.locator('html').getAttribute('data-theme');
    expect(theme).toBe('dark');
  });

  test('theme works on /how-it-works page', async ({ page }) => {
    await page.goto('/how-it-works');
    const toggle = page.getByRole('button', { name: /dark mode/i });
    await toggle.click();

    const theme = await page.locator('html').getAttribute('data-theme');
    expect(theme).toBe('light');
  });
});
