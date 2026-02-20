import { chromium } from 'playwright';
import fs from 'fs';

const outDir = 'artifacts/e2e-proof';
fs.mkdirSync(outDir, { recursive: true });

const logs = [];
const mark = (msg) => {
  const line = `[step] ${msg}`;
  logs.push(line);
  console.log(line);
};

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await context.newPage();
page.setDefaultTimeout(20000);

page.on('console', (msg) => logs.push(`[console:${msg.type()}] ${msg.text()}`));
page.on('response', (res) => {
  const status = res.status();
  if (status >= 500) logs.push(`[http:${status}] ${res.url()}`);
});

let proof = {};

try {
  mark('goto home');
  await page.goto('http://localhost:3005/?staging=true', { waitUntil: 'domcontentloaded', timeout: 120000 });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: `${outDir}/01-home.png`, fullPage: true });

  mark('click Enter');
  await page.getByRole('button', { name: /enter/i }).first().click();
  await page.waitForTimeout(800);
  await page.screenshot({ path: `${outDir}/02-entry-modal.png`, fullPage: true });

  mark('select pass type');
  await page.getByRole('button', { name: /Draft Pass/i }).first().click();

  mark('pick Fast Draft');
  await page.getByRole('button', { name: /Fast Draft/i }).first().click();

  mark('wait /draft-room');
  await page.waitForURL(/\/draft-room\?/, { timeout: 60000 });
  await page.waitForTimeout(1200);
  await page.screenshot({ path: `${outDir}/03-draft-room-filling.png`, fullPage: true });

  mark('wait lobby 10/10');
  await page.waitForFunction(() => document.body.innerText.includes('10/10 joined'), { timeout: 45000 });
  await page.screenshot({ path: `${outDir}/04-lobby-full.png`, fullPage: true });

  mark('wait countdown');
  await page.waitForFunction(() => /Draft is starting/i.test(document.body.innerText), { timeout: 30000 });
  await page.screenshot({ path: `${outDir}/05-countdown.png`, fullPage: true });

  mark('wait live draft');
  await page.waitForFunction(() => /Round\s+\d+,\s+Pick\s+\d+/i.test(document.body.innerText), { timeout: 60000 });
  await page.waitForTimeout(4000);
  await page.screenshot({ path: `${outDir}/06-live-draft.png`, fullPage: true });

  const bodyText = await page.locator('body').innerText();
  proof = {
    finalUrl: page.url(),
    noDraftingRoute: !page.url().includes('/drafting'),
    lobbyReached: /10\/10 joined/i.test(bodyText) || logs.some((l) => l.includes('wait countdown')),
    liveRoundPickVisible: /Round\s+\d+,\s+Pick\s+\d+/i.test(bodyText),
    timerVisible: /Timer\s+\d+:\d{2}/i.test(bodyText),
    onClockVisible: /On the Clock:/i.test(bodyText),
    http500Count: logs.filter((l) => l.includes('[http:500]')).length,
    sample500s: logs.filter((l) => l.includes('[http:500]')).slice(0, 10),
  };
  mark('success');
} catch (err) {
  const msg = err instanceof Error ? `${err.name}: ${err.message}` : String(err);
  logs.push(`[error] ${msg}`);
  try { await page.screenshot({ path: `${outDir}/99-failure.png`, fullPage: true }); } catch {}
  proof = { failed: true, error: msg, finalUrl: page.url() };
  console.error(msg);
} finally {
  fs.writeFileSync(`${outDir}/proof.json`, JSON.stringify(proof, null, 2));
  fs.writeFileSync(`${outDir}/console.log`, logs.join('\n'));
  await browser.close();
}

console.log(JSON.stringify(proof, null, 2));
