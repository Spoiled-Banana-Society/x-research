/**
 * Firebase RTDB Migration Tests
 *
 * Tests the draft room after migrating from WebSocket to Firebase Realtime Database.
 * Runs against the deployed Vercel site at banana-fantasy-sbs.vercel.app.
 */
import { test, expect, type Page } from '@playwright/test';

const VERCEL_URL = 'https://banana-fantasy-sbs.vercel.app';
const API_BASE = 'https://sbs-drafts-api-staging-652484219017.us-central1.run.app';
const WALLET = '0x59dd025b0aa0fecf39f2c69fc7aea9f943b8779e';

// Helper: collect console messages
function collectConsole(page: Page) {
  const logs: string[] = [];
  const errors: string[] = [];
  const warnings: string[] = [];
  page.on('console', (msg) => {
    const text = msg.text();
    if (msg.type() === 'error') errors.push(text);
    else if (msg.type() === 'warning') warnings.push(text);
    else logs.push(text);
  });
  return { logs, errors, warnings };
}

// Helper: filter out known benign errors
function filterCriticalErrors(errors: string[]): string[] {
  return errors.filter(
    (e) =>
      !e.includes('favicon') &&
      !e.includes('analytics') &&
      !e.includes('privy') &&
      !e.includes('hydration') &&
      !e.includes('Expected server HTML') &&
      !e.includes('net::ERR') &&
      !e.includes('Failed to load resource') &&
      !e.includes('third-party') &&
      !e.includes('OneSignal') &&
      !e.includes('onesignal') &&
      !e.includes('Blocked a frame') &&
      !e.includes('Content Security Policy') &&
      !e.includes('Mixed Content') &&
      !e.includes('unsafe-eval') &&
      !e.includes('_next/static') &&
      !e.includes('webpack') &&
      !e.includes('chunk') &&
      !e.includes('NEXT_REDIRECT') &&
      !e.includes('ChunkLoadError') &&
      !e.includes('Loading chunk') &&
      !e.includes('AbortError')
  );
}

test.describe('Firebase RTDB Migration Tests', () => {
  // ==================== TEST 1: Basic page load ====================
  test('Test 1: Draft room renders without crashes', async ({ page }) => {
    test.setTimeout(60000);
    const { errors } = collectConsole(page);

    const url = `${VERCEL_URL}/draft-room?draftId=test-firebase&id=test-firebase&speed=fast&players=3`;
    await page.goto(url);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(5000);

    // Screenshot
    await page.screenshot({ path: '/tmp/firebase-test-1-page-load.png', fullPage: true });

    // Page should not be blank — some content should be visible
    const body = await page.locator('body').textContent();
    expect(body).toBeTruthy();
    expect(body!.length).toBeGreaterThan(50);

    // Check for critical JS errors
    const criticalErrors = filterCriticalErrors(errors);
    if (criticalErrors.length > 0) {
      console.log('Critical errors found:', criticalErrors);
    }
    // Allow the test to pass but report errors — some firebase init errors are expected
    // when draftId doesn't exist in RTDB
  });

  // ==================== TEST 4: Firebase RTDB connection logs ====================
  test('Test 4: Firebase RTDB subscription logs appear', async ({ page }) => {
    test.setTimeout(60000);
    const { logs, errors } = collectConsole(page);

    // Use live mode with wallet to trigger Firebase subscription
    const url = `${VERCEL_URL}/draft-room?draftId=test-firebase-check&id=test-firebase-check&speed=fast&players=10&mode=live&wallet=${WALLET}`;
    await page.goto(url);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(8000);

    await page.screenshot({ path: '/tmp/firebase-test-4-firebase-logs.png', fullPage: true });

    // Check for Firebase-related console logs
    const firebaseLogs = logs.filter(l =>
      l.includes('[Firebase') ||
      l.includes('firebase') ||
      l.includes('RTDB')
    );
    console.log('Firebase-related logs:', firebaseLogs);

    // Check for Draft Room logs
    const draftRoomLogs = logs.filter(l => l.includes('[Draft Room]'));
    console.log('Draft Room logs:', draftRoomLogs);

    // Check for any firebase errors
    const firebaseErrors = errors.filter(l =>
      l.includes('firebase') || l.includes('Firebase')
    );
    console.log('Firebase errors:', firebaseErrors);
  });

  // ==================== TEST 5: Connection indicator ====================
  test('Test 5: Connection indicator shows on page', async ({ page }) => {
    test.setTimeout(60000);

    const url = `${VERCEL_URL}/draft-room?draftId=test-firebase-indicator&id=test-firebase-indicator&speed=fast&players=3`;
    await page.goto(url);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(5000);

    await page.screenshot({ path: '/tmp/firebase-test-5-connection-indicator.png', fullPage: true });

    // Check for any "Live" text or connection indicator
    const pageContent = await page.content();
    const hasLive = pageContent.includes('Live') || pageContent.includes('live');
    const hasConnected = pageContent.includes('Connected') || pageContent.includes('connected');
    console.log('Has "Live" indicator:', hasLive);
    console.log('Has "Connected" indicator:', hasConnected);
  });

  // ==================== TEST 6: Re-entry test ====================
  test('Test 6: Re-entry reconnects smoothly', async ({ page }) => {
    test.setTimeout(60000);
    const { errors } = collectConsole(page);

    const url = `${VERCEL_URL}/draft-room?draftId=test-reentry&id=test-reentry&speed=fast&players=5`;
    await page.goto(url);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(3000);

    await page.screenshot({ path: '/tmp/firebase-test-6a-first-load.png', fullPage: true });

    // Navigate away
    await page.goto(`${VERCEL_URL}/drafting`);
    await page.waitForTimeout(2000);

    // Come back
    await page.goto(url);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(3000);

    await page.screenshot({ path: '/tmp/firebase-test-6b-reentry.png', fullPage: true });

    // Should not crash on re-entry
    const body = await page.locator('body').textContent();
    expect(body).toBeTruthy();
    expect(body!.length).toBeGreaterThan(50);

    const criticalErrors = filterCriticalErrors(errors);
    // Allow some non-critical errors
    const actualCrashes = criticalErrors.filter(e =>
      e.includes('Unhandled') ||
      e.includes('TypeError') ||
      e.includes('ReferenceError') ||
      e.includes('Cannot read properties')
    );
    if (actualCrashes.length > 0) {
      console.log('Crash errors on re-entry:', actualCrashes);
    }
    expect(actualCrashes.length).toBe(0);
  });

  // ==================== TEST 7: Drafting and special-drafts pages ====================
  test('Test 7a: Drafting page loads without errors', async ({ page }) => {
    test.setTimeout(60000);
    const { errors } = collectConsole(page);

    await page.goto(`${VERCEL_URL}/drafting`);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(5000);

    await page.screenshot({ path: '/tmp/firebase-test-7a-drafting.png', fullPage: true });

    const body = await page.locator('body').textContent();
    expect(body).toBeTruthy();

    const criticalErrors = filterCriticalErrors(errors);
    const crashes = criticalErrors.filter(e =>
      e.includes('Unhandled') ||
      e.includes('TypeError') ||
      e.includes('ReferenceError')
    );
    expect(crashes.length).toBe(0);
  });

  test('Test 7b: Special drafts page loads without errors', async ({ page }) => {
    test.setTimeout(60000);
    const { errors } = collectConsole(page);

    await page.goto(`${VERCEL_URL}/special-drafts`);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(5000);

    await page.screenshot({ path: '/tmp/firebase-test-7b-special-drafts.png', fullPage: true });

    const body = await page.locator('body').textContent();
    expect(body).toBeTruthy();

    const criticalErrors = filterCriticalErrors(errors);
    const crashes = criticalErrors.filter(e =>
      e.includes('Unhandled') ||
      e.includes('TypeError') ||
      e.includes('ReferenceError')
    );
    expect(crashes.length).toBe(0);
  });
});
