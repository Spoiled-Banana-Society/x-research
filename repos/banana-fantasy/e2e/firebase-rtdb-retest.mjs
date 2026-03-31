#!/usr/bin/env node
/**
 * Firebase RTDB Migration Retest
 *
 * Tests against draft 2024-fast-draft-22 which now has Firestore state documents.
 * Focus: does the draft room load properly and show real-time picks?
 */

import { chromium } from 'playwright';

const VERCEL_URL = 'https://banana-fantasy-sbs.vercel.app';
const WALLET = '0x59dd025b0aa0fecf39f2c69fc7aea9f943b8779e';
const DRAFT_ID = '2024-fast-draft-22';

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  const consoleLogs = [];
  const consoleErrors = [];

  page.on('console', (msg) => {
    const text = msg.text();
    if (msg.type() === 'error') {
      consoleErrors.push(text);
    } else {
      consoleLogs.push(text);
    }
    // Log Firebase/Draft/WS related messages
    if (text.includes('Firebase') || text.includes('RTDB') || text.includes('[Draft') ||
        text.includes('Watchdog') || text.includes('WebSocket') || text.includes('WS') ||
        text.includes('engine') || text.includes('initializeFromServer') ||
        text.includes('loadLiveData') || text.includes('poll') || text.includes('Poll')) {
      console.log(`  [browser] ${text.substring(0, 200)}`);
    }
  });

  page.on('response', (res) => {
    const url = res.url();
    if (url.includes('sbs-drafts-api') || url.includes('sbs-drafts-server')) {
      console.log(`  [http:${res.status()}] ${url.substring(0, 120)}`);
    }
  });

  console.log('=== Test: Draft Room with real Firestore state ===');
  console.log(`Draft: ${DRAFT_ID}`);
  console.log(`Wallet: ${WALLET}`);
  console.log('');

  const url = `${VERCEL_URL}/draft-room?draftId=${DRAFT_ID}&id=${DRAFT_ID}&speed=fast&mode=live&wallet=${WALLET}&staging=true`;
  console.log(`URL: ${url}`);
  console.log('');

  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });

  console.log('--- Waiting 20 seconds for draft room to load ---');
  await page.waitForTimeout(20000);
  await page.screenshot({ path: '/tmp/e2e-final-retest-20s.png', fullPage: true });

  // Check connection indicator
  const indicatorText = await page.evaluate(() => {
    const spans = document.querySelectorAll('span.text-xs');
    for (const s of spans) {
      const text = s.textContent || '';
      if (text === 'Live' || text === 'WS' || text === 'Connecting...') return text;
    }
    return null;
  });
  console.log(`\nConnection indicator: "${indicatorText}"`);

  // Check what phase the draft room is in
  const bodyText = await page.locator('body').textContent() || '';
  console.log(`\nUI analysis:`);
  console.log(`  Has "Round" text: ${/Round/i.test(bodyText)}`);
  console.log(`  Has "Pick" text: ${/Pick/i.test(bodyText)}`);
  console.log(`  Has timer (XX:XX): ${/\d+:\d{2}/.test(bodyText)}`);
  console.log(`  Has "On the Clock": ${/On the Clock/i.test(bodyText)}`);
  console.log(`  Has "Waiting": ${/Waiting/i.test(bodyText)}`);
  console.log(`  Has "Connecting": ${/Connecting/i.test(bodyText)}`);
  console.log(`  Has error message: ${/error|Error|failed/i.test(bodyText)}`);

  // Check for Firebase logs
  const firebaseLogs = consoleLogs.filter(l => l.includes('Firebase') || l.includes('RTDB'));
  const wsLogs = consoleLogs.filter(l => l.includes('WebSocket') || l.includes('useDraftWebSocket'));
  const pollLogs = consoleLogs.filter(l => l.includes('getDraftInfo') || l.includes('poll'));
  const draftRoomLogs = consoleLogs.filter(l => l.includes('[Draft Room]'));
  const engineLogs = consoleLogs.filter(l => l.includes('engine') || l.includes('initializeFromServer'));

  console.log(`\nLog counts:`);
  console.log(`  Firebase/RTDB: ${firebaseLogs.length}`);
  console.log(`  WebSocket: ${wsLogs.length}`);
  console.log(`  Polling: ${pollLogs.length}`);
  console.log(`  Draft Room: ${draftRoomLogs.length}`);
  console.log(`  Engine: ${engineLogs.length}`);

  // Show last 10 Draft Room logs
  console.log(`\nLast 15 Draft Room logs:`);
  draftRoomLogs.slice(-15).forEach(l => console.log(`  ${l.substring(0, 200)}`));

  // Show Firebase logs
  if (firebaseLogs.length > 0) {
    console.log(`\nFirebase logs:`);
    firebaseLogs.forEach(l => console.log(`  ${l.substring(0, 200)}`));
  }

  // Show WS logs
  if (wsLogs.length > 0) {
    console.log(`\nWebSocket logs:`);
    wsLogs.slice(-10).forEach(l => console.log(`  ${l.substring(0, 200)}`));
  }

  // Wait another 20 seconds and check
  console.log('\n--- Waiting another 20 seconds ---');
  await page.waitForTimeout(20000);
  await page.screenshot({ path: '/tmp/e2e-final-retest-40s.png', fullPage: true });

  const bodyText2 = await page.locator('body').textContent() || '';
  const indicatorText2 = await page.evaluate(() => {
    const spans = document.querySelectorAll('span.text-xs');
    for (const s of spans) {
      const text = s.textContent || '';
      if (text === 'Live' || text === 'WS' || text === 'Connecting...') return text;
    }
    return null;
  });
  console.log(`\nAfter 40s total:`);
  console.log(`  Connection indicator: "${indicatorText2}"`);
  console.log(`  Has "Round" text: ${/Round/i.test(bodyText2)}`);
  console.log(`  Has timer: ${/\d+:\d{2}/.test(bodyText2)}`);

  // Count critical errors
  const critErrors = consoleErrors.filter(e =>
    !e.includes('favicon') && !e.includes('analytics') && !e.includes('privy') &&
    !e.includes('hydration') && !e.includes('net::ERR') && !e.includes('Failed to load') &&
    !e.includes('third-party') && !e.includes('OneSignal') && !e.includes('Blocked a frame') &&
    !e.includes('Content Security Policy') && !e.includes('Mixed Content') &&
    !e.includes('unsafe-eval') && !e.includes('_next/static') && !e.includes('webpack') &&
    !e.includes('chunk') && !e.includes('NEXT_REDIRECT') && !e.includes('ChunkLoadError') &&
    !e.includes('AbortError') && !e.includes('message port') && !e.includes('postMessage')
  );
  console.log(`\nCritical console errors: ${critErrors.length}`);
  critErrors.slice(0, 10).forEach(e => console.log(`  ERROR: ${e.substring(0, 200)}`));

  await browser.close();
  console.log('\nDone. Screenshots at /tmp/e2e-final-retest-*.png');
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
