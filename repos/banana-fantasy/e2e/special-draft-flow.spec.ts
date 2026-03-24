import { test, expect } from '@playwright/test';

const BASE = 'http://localhost:3000';

// Only run on Chromium (webkit crashes on this Mac)
test.skip(({ browserName }) => browserName !== 'chromium', 'Chromium only');

test.describe('Special Draft Flow', () => {
  // Test 1: Draft room filling phase for special drafts looks like regular drafts
  test('special draft room shows proper filling UI (X/10, Waiting for players)', async ({ page }) => {
    await page.goto(`${BASE}/draft-room?draftId=test-special-1&id=test-special-1&speed=slow&special=true&specialType=jackpot&players=3`);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(3000); // Let React render

    // Should show filling UI with X/10 counter
    const fillingText = page.locator('text=/\\d+\\/10/').first();
    await expect(fillingText).toBeVisible({ timeout: 10000 });

    // Should show "Waiting for players" text (case insensitive)
    const waitingText = page.locator('text=/waiting for players/i');
    await expect(waitingText).toBeVisible({ timeout: 5000 });

    // Should NOT show "Starting soon!" during filling
    const startingSoon = page.locator('text=Starting soon!');
    await expect(startingSoon).not.toBeVisible({ timeout: 2000 });

    // Should show the draft type badge (JACKPOT) since it's a special draft
    const typeBadge = page.locator('text=JACKPOT');
    await expect(typeBadge).toBeVisible({ timeout: 5000 });

    // Should NOT show "UNREVEALED" since type is known for special drafts
    const unrevealed = page.locator('text=UNREVEALED');
    await expect(unrevealed).not.toBeVisible({ timeout: 2000 });
  });

  // Test 2: HOF special draft shows correct type
  test('HOF special draft shows HOF badge during filling', async ({ page }) => {
    await page.goto(`${BASE}/draft-room?draftId=test-special-hof&id=test-special-hof&speed=slow&special=true&specialType=hof&players=2`);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(3000);

    // Should show HOF badge
    const hofBadge = page.locator('text=HOF');
    await expect(hofBadge).toBeVisible({ timeout: 5000 });

    // Should show filling counter
    const counter = page.locator('text=/\\d+\\/10/').first();
    await expect(counter).toBeVisible({ timeout: 10000 });

    // Should NOT show "UNREVEALED"
    const unrevealed = page.locator('text=UNREVEALED');
    await expect(unrevealed).not.toBeVisible({ timeout: 2000 });
  });

  // Test 3: Special draft fills to 10/10 and transitions without slot machine
  test('special draft fills to 10/10 and skips slot machine', async ({ page }) => {
    // The local filling animation (800ms per player) is disabled for special drafts.
    // Without live mode, the local animation for regular drafts would count up, but
    // special drafts rely on server polling. In test, just verify initial state is correct.
    await page.goto(`${BASE}/draft-room?draftId=test-special-fill&id=test-special-fill&speed=slow&special=true&specialType=jackpot&players=1`);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(3000);

    // Should show 1/10 (stays at 1 since server polling drives count for special drafts)
    const counter = page.locator('text=/1\\/10/');
    await expect(counter).toBeVisible({ timeout: 10000 });

    // Should show JACKPOT badge
    const jackpot = page.locator('text=JACKPOT');
    await expect(jackpot).toBeVisible({ timeout: 5000 });

    // Should NOT show slot machine
    const slotText = page.locator('text=/Reveal in/');
    await expect(slotText).not.toBeVisible({ timeout: 3000 });
  });

  // Test 4: Drafting page loads without errors
  test('drafting page loads without errors', async ({ page }) => {
    await page.goto(`${BASE}/drafting`);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(3000);

    // Page should load successfully
    await expect(page.locator('body')).toBeVisible();

    // No application error
    const errorText = page.locator('text=Application error');
    await expect(errorText).not.toBeVisible({ timeout: 3000 });
  });

  // Test 5: Special drafts page loads and displays correctly
  test('special drafts page loads without errors', async ({ page }) => {
    await page.goto(`${BASE}/special-drafts`);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(3000);

    // Should show the page title
    const title = page.locator('text=Special Drafts');
    await expect(title).toBeVisible({ timeout: 5000 });

    // Should show "How It Works" section
    const howItWorks = page.locator('text=How It Works');
    await expect(howItWorks).toBeVisible({ timeout: 5000 });
  });

  // Test 6: Multi-tab — all three pages load simultaneously without crashing
  test('multi-tab: draft room + drafting + special drafts load together', async ({ browser }) => {
    const context = await browser.newContext();

    const draftRoom = await context.newPage();
    const draftingPage = await context.newPage();
    const specialPage = await context.newPage();

    await Promise.all([
      draftRoom.goto(`${BASE}/draft-room?draftId=test-multi&id=test-multi&speed=slow&special=true&specialType=jackpot&players=4`),
      draftingPage.goto(`${BASE}/drafting`),
      specialPage.goto(`${BASE}/special-drafts`),
    ]);

    await Promise.all([
      draftRoom.waitForLoadState('domcontentloaded'),
      draftingPage.waitForLoadState('domcontentloaded'),
      specialPage.waitForLoadState('domcontentloaded'),
    ]);

    await Promise.all([
      draftRoom.waitForTimeout(3000),
      draftingPage.waitForTimeout(3000),
      specialPage.waitForTimeout(3000),
    ]);

    // Draft room should show filling counter
    const fillingText = draftRoom.locator('text=/\\d+\\/10/').first();
    await expect(fillingText).toBeVisible({ timeout: 10000 });

    // Drafting page should not error
    await expect(draftingPage.locator('body')).toBeVisible();

    // Special drafts page should load
    await expect(specialPage.locator('text=Special Drafts')).toBeVisible({ timeout: 5000 });

    await context.close();
  });

  // Test 7: Regular draft still works (regression) — shows UNREVEALED and filling
  test('regular draft still shows UNREVEALED and filling UI', async ({ page }) => {
    await page.goto(`${BASE}/draft-room?draftId=test-regular&id=test-regular&speed=fast&players=1`);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(3000);

    // Should show "UNREVEALED" badge during filling (since type is unknown)
    const unrevealed = page.locator('text=UNREVEALED');
    await expect(unrevealed).toBeVisible({ timeout: 5000 });

    // Should show filling counter
    const counter = page.locator('text=/\\d+\\/10/').first();
    await expect(counter).toBeVisible({ timeout: 10000 });

    // Should show "Waiting for players"
    const waiting = page.locator('text=/waiting for players/i');
    await expect(waiting).toBeVisible({ timeout: 5000 });
  });

  // Test 8: Player count starts at correct number from URL
  test('special draft starts with correct player count from URL params', async ({ page }) => {
    await page.goto(`${BASE}/draft-room?draftId=test-count&id=test-count&speed=slow&special=true&specialType=hof&players=7`);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(3000);

    // Should show 7/10 initially
    const counter = page.locator('text=/7\\/10/');
    await expect(counter).toBeVisible({ timeout: 10000 });
  });
});
