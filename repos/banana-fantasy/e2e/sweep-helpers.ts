import { Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

// ── Console Error Collector ─────────────────────────────────────────

const BENIGN_PATTERNS = [
  'favicon', 'analytics', 'privy', 'hydration', 'Expected server HTML',
  'ResizeObserver', 'AudioContext', 'API error', 'firebase', 'google',
  'fetch', 'ERR_', 'Firestore', 'permission_denied', 'ChunkLoadError',
  'Loading chunk', 'downloadable font', 'net::', 'Failed to load resource',
  'third-party', '404 (Not Found)', 'the server responded with a status of',
  'Autofocus', 'webkit', 'mozInnerScreen', 'Non-Error promise rejection',
  'AbortError', 'cancel', 'NotAllowedError', 'play()',
  'SecurityError', 'localStorage', 'sessionStorage', 'OneSignal',
  'postMessage', 'crisp', 'intercom', 'hotjar', 'gtag', 'gtm',
  'sentry', 'segment', 'mixpanel', 'amplitude',
];

export function isBenignError(msg: string): boolean {
  const lower = msg.toLowerCase();
  return BENIGN_PATTERNS.some((p) => lower.includes(p.toLowerCase()));
}

export function attachErrorCollector(page: Page): string[] {
  const errors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      const text = msg.text();
      if (!isBenignError(text)) {
        errors.push(text);
      }
    }
  });
  page.on('pageerror', (err) => {
    const text = err.message || String(err);
    if (!isBenignError(text)) {
      errors.push(`[PAGE ERROR] ${text}`);
    }
  });
  return errors;
}

// ── Broken Image Checker ────────────────────────────────────────────

export async function checkBrokenImages(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const broken: string[] = [];
    document.querySelectorAll('img').forEach((img) => {
      if (img.src && !img.src.startsWith('data:') && img.complete && img.naturalWidth === 0) {
        broken.push(img.src);
      }
    });
    return broken;
  });
}

// ── Text Artifact Scanner ───────────────────────────────────────────

export async function checkTextArtifacts(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const artifacts: string[] = [];
    const BAD = ['undefined', 'NaN', '[object Object]', '[object '];
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    let node: Node | null;
    while ((node = walker.nextNode())) {
      const el = node.parentElement;
      if (!el) continue;
      const tag = el.tagName.toLowerCase();
      if (['script', 'style', 'code', 'pre', 'noscript'].includes(tag)) continue;
      const text = (node.textContent || '').trim();
      if (!text) continue;
      for (const bad of BAD) {
        if (text === bad || text.startsWith(bad + ' ') || text.endsWith(' ' + bad)) {
          artifacts.push(`"${text.slice(0, 80)}" in <${tag}>`);
        }
      }
    }
    return artifacts;
  });
}

// ── Horizontal Overflow Checker ─────────────────────────────────────

export async function checkHorizontalOverflow(page: Page): Promise<boolean> {
  return page.evaluate(() => {
    return document.documentElement.scrollWidth <= document.documentElement.clientWidth + 5;
  });
}

// ── Blank Page Checker ──────────────────────────────────────────────

export async function isPageBlank(page: Page): Promise<boolean> {
  return page.evaluate(() => {
    const body = document.body;
    if (!body) return true;
    const text = body.innerText.trim();
    return text.length < 5;
  });
}

// ── localStorage Seeder ─────────────────────────────────────────────

export async function seedOnboardingComplete(page: Page) {
  await page.evaluate(() => {
    localStorage.setItem('hasSeenOnboarding', 'true');
  });
}

export async function seedActiveDrafts(page: Page) {
  const now = Date.now();
  await page.evaluate((timestamp) => {
    const drafts = [
      {
        id: 'sweep-filling-001',
        contestName: 'BBB #500',
        status: 'filling',
        type: null,
        draftSpeed: 'fast',
        players: 7,
        maxPlayers: 10,
        joinedAt: timestamp - 30000,
        phase: 'filling',
        fillingStartedAt: timestamp - 2000,
        fillingInitialPlayers: 7,
        lastUpdated: timestamp,
        liveWalletAddress: '0xd3301bC039faF4223dA98bcEB5Fb818C9993620',
      },
      {
        id: 'sweep-yourturn-002',
        contestName: 'BBB #501',
        status: 'drafting',
        type: 'pro',
        draftSpeed: 'fast',
        players: 10,
        maxPlayers: 10,
        phase: 'drafting',
        draftType: 'pro',
        isYourTurn: true,
        currentPick: 3,
        pickEndTime: timestamp + 25000,
        lastUpdated: timestamp,
        liveWalletAddress: '0xd3301bC039faF4223dA98bcEB5Fb818C9993620',
        draftOrder: [
          { id: '1', name: '0xd3301bC039faF4223dA98bcEB5Fb818C9993620', displayName: 'You', isYou: true, avatar: '🍌' },
          { id: '2', name: '0xBot1', displayName: '0xBot1...', isYou: false, avatar: '🍌' },
          { id: '3', name: '0xBot2', displayName: '0xBot2...', isYou: false, avatar: '🍌' },
          { id: '4', name: '0xBot3', displayName: '0xBot3...', isYou: false, avatar: '🍌' },
          { id: '5', name: '0xBot4', displayName: '0xBot4...', isYou: false, avatar: '🍌' },
          { id: '6', name: '0xBot5', displayName: '0xBot5...', isYou: false, avatar: '🍌' },
          { id: '7', name: '0xBot6', displayName: '0xBot6...', isYou: false, avatar: '🍌' },
          { id: '8', name: '0xBot7', displayName: '0xBot7...', isYou: false, avatar: '🍌' },
          { id: '9', name: '0xBot8', displayName: '0xBot8...', isYou: false, avatar: '🍌' },
          { id: '10', name: '0xBot9', displayName: '0xBot9...', isYou: false, avatar: '🍌' },
        ],
      },
      {
        id: 'sweep-waiting-003',
        contestName: 'BBB #502',
        status: 'drafting',
        type: 'hof',
        draftSpeed: 'fast',
        players: 10,
        maxPlayers: 10,
        phase: 'drafting',
        draftType: 'hof',
        isYourTurn: false,
        currentPick: 5,
        lastUpdated: timestamp,
        liveWalletAddress: '0xd3301bC039faF4223dA98bcEB5Fb818C9993620',
      },
      {
        id: 'sweep-jackpot-004',
        contestName: 'BBB #503',
        status: 'drafting',
        type: 'jackpot',
        draftSpeed: 'fast',
        players: 10,
        maxPlayers: 10,
        phase: 'drafting',
        draftType: 'jackpot',
        isYourTurn: false,
        currentPick: 2,
        lastUpdated: timestamp,
        liveWalletAddress: '0xd3301bC039faF4223dA98bcEB5Fb818C9993620',
      },
    ];
    localStorage.setItem('banana-active-drafts', JSON.stringify(drafts));
    localStorage.setItem('hasSeenOnboarding', 'true');
  }, now);
}

export async function seedCompletedDrafts(page: Page) {
  await page.evaluate(() => {
    const completed = [
      {
        id: 'sweep-done-010',
        contestName: 'BBB #490',
        status: 'completed',
        type: 'pro',
        draftSpeed: 'fast',
        players: 10,
        maxPlayers: 10,
        phase: 'completed',
        draftType: 'pro',
        lastUpdated: Date.now() - 3600000,
      },
    ];
    localStorage.setItem('banana-completed-drafts', JSON.stringify(completed));
  });
}

export async function clearDrafts(page: Page) {
  await page.evaluate(() => {
    localStorage.removeItem('banana-active-drafts');
    localStorage.removeItem('banana-completed-drafts');
  });
}

export async function seedZeroPasses(page: Page) {
  await page.evaluate(() => {
    const profile = JSON.parse(localStorage.getItem('banana-fantasy-user-profile') || '{}');
    profile.draftPasses = 0;
    profile.freeDrafts = 0;
    localStorage.setItem('banana-fantasy-user-profile', JSON.stringify(profile));
    const balance = JSON.parse(localStorage.getItem('banana-fantasy-user-balance') || '{}');
    balance.draftPasses = 0;
    balance.freeDrafts = 0;
    localStorage.setItem('banana-fantasy-user-balance', JSON.stringify(balance));
  });
}

// ── Report Collector ────────────────────────────────────────────────

interface PageFinding {
  route: string;
  consoleErrors: string[];
  brokenImages: string[];
  textArtifacts: string[];
  hasOverflow: boolean;
  isBlank: boolean;
}

interface InteractionFinding {
  flow: string;
  status: 'pass' | 'fail';
  error?: string;
}

export interface SweepReport {
  timestamp: string;
  summary: {
    totalPages: number;
    pagesWithErrors: number;
    totalConsoleErrors: number;
    totalBrokenImages: number;
    totalTextArtifacts: number;
    pagesWithOverflow: number;
    blankPages: number;
  };
  pages: PageFinding[];
  interactions: InteractionFinding[];
}

export class ReportCollector {
  pages: PageFinding[] = [];
  interactions: InteractionFinding[] = [];

  addPage(finding: PageFinding) {
    this.pages.push(finding);
  }

  addInteraction(finding: InteractionFinding) {
    this.interactions.push(finding);
  }

  toReport(): SweepReport {
    return {
      timestamp: new Date().toISOString(),
      summary: {
        totalPages: this.pages.length,
        pagesWithErrors: this.pages.filter((p) => p.consoleErrors.length > 0).length,
        totalConsoleErrors: this.pages.reduce((sum, p) => sum + p.consoleErrors.length, 0),
        totalBrokenImages: this.pages.reduce((sum, p) => sum + p.brokenImages.length, 0),
        totalTextArtifacts: this.pages.reduce((sum, p) => sum + p.textArtifacts.length, 0),
        pagesWithOverflow: this.pages.filter((p) => p.hasOverflow).length,
        blankPages: this.pages.filter((p) => p.isBlank).length,
      },
      pages: this.pages,
      interactions: this.interactions,
    };
  }

  async save(filePath: string) {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(filePath, JSON.stringify(this.toReport(), null, 2));
  }
}

// ── Full Page Audit ─────────────────────────────────────────────────

export async function auditPage(
  page: Page,
  route: string,
  errors: string[],
): Promise<PageFinding> {
  await page.waitForTimeout(2000); // Let async content render
  const brokenImages = await checkBrokenImages(page);
  const textArtifacts = await checkTextArtifacts(page);
  const noOverflow = await checkHorizontalOverflow(page);
  const blank = await isPageBlank(page);

  return {
    route,
    consoleErrors: [...errors],
    brokenImages,
    textArtifacts,
    hasOverflow: !noOverflow,
    isBlank: blank,
  };
}
