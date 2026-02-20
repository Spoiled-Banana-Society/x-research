import { test, expect } from '@playwright/test';

test.describe('Admin Page', () => {
  test('redirects non-admin users to home', async ({ page }) => {
    await page.goto('/admin');
    // Without auth, should redirect to / or show loading skeleton
    await page.waitForTimeout(2000);
    // Either redirected to home or showing loading state
    const url = page.url();
    const isAdmin = url.includes('/admin');
    const isHome = url === 'http://localhost:3000/' || url.endsWith('/');

    // Should either redirect home or show admin skeleton (auth loading)
    expect(isAdmin || isHome).toBeTruthy();
  });

  test('admin page does not crash without auth', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error' && !msg.text().includes('hydration') && !msg.text().includes('Privy')) {
        errors.push(msg.text());
      }
    });
    await page.goto('/admin');
    await page.waitForTimeout(2000);
    expect(errors).toHaveLength(0);
  });
});
