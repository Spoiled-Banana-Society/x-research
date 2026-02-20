/**
 * Staging environment detection and URL switching.
 * Activate staging mode by adding ?staging=true to any page URL.
 * Once activated, it persists in sessionStorage until the tab closes.
 *
 * Runtime URL overrides (critical for ephemeral Cloudflare tunnels):
 *   ?apiUrl=https://...   → overrides staging API URL
 *   ?wsUrl=wss://...      → overrides staging WS URL
 * These persist in sessionStorage so they survive page navigations.
 */

const STAGING_KEY = 'sbs-staging-mode';
const STAGING_API_OVERRIDE_KEY = 'sbs-staging-api-url';
const STAGING_WS_OVERRIDE_KEY = 'sbs-staging-ws-url';

// Build-time defaults (Cloudflare Tunnel)
// These fallback hosts keep short-link staging usable even when apiUrl/wsUrl query params are omitted.
//
// HOW TO REFRESH:
//   1. Start a new Cloudflare Quick Tunnel on the staging machine:
//        cloudflared tunnel --url http://localhost:8080   (API)
//        cloudflared tunnel --url http://localhost:8081   (WS — use wss:// below)
//   2. Copy the generated *.trycloudflare.com URLs here.
//   3. Alternatively, pass runtime overrides via URL params so no code change is needed:
//        ?staging=true&apiUrl=https://NEW_TUNNEL.trycloudflare.com&wsUrl=wss://NEW_WS_TUNNEL.trycloudflare.com
const DEFAULT_STAGING_DRAFTS_API_URL = 'https://sbs-drafts-api-staging-652484219017.us-central1.run.app';
const DEFAULT_STAGING_DRAFT_SERVER_URL = 'wss://diesel-metallic-cookie-counseling.trycloudflare.com';
const STAGING_DRAFTS_API_URL = process.env.NEXT_PUBLIC_STAGING_DRAFTS_API_URL || DEFAULT_STAGING_DRAFTS_API_URL;
const STAGING_DRAFT_SERVER_URL = process.env.NEXT_PUBLIC_STAGING_DRAFT_SERVER_URL || DEFAULT_STAGING_DRAFT_SERVER_URL;

function getUrlParams(): URLSearchParams | null {
  if (typeof window === 'undefined') return null;
  try { return new URLSearchParams(window.location.search); } catch { return null; }
}

export function isStagingMode(): boolean {
  if (typeof window === 'undefined') return false;

  // Always use real server — entire site points at staging backend
  // Runtime URL overrides still work via ?apiUrl= and ?wsUrl= params
  try {
    const params = getUrlParams();
    if (params) {
      const apiUrl = params.get('apiUrl');
      const wsUrl = params.get('wsUrl');
      if (apiUrl) sessionStorage.setItem(STAGING_API_OVERRIDE_KEY, apiUrl);
      if (wsUrl) sessionStorage.setItem(STAGING_WS_OVERRIDE_KEY, wsUrl);
    }
  } catch {
    // SSR/prerender — sessionStorage not available
  }
  return true;
}

export function getStagingApiUrl(): string {
  if (typeof window !== 'undefined') {
    const override = sessionStorage.getItem(STAGING_API_OVERRIDE_KEY);
    if (override) return override;
  }
  return STAGING_DRAFTS_API_URL;
}

export function getStagingWsUrl(): string {
  if (typeof window !== 'undefined') {
    const override = sessionStorage.getItem(STAGING_WS_OVERRIDE_KEY);
    if (override) return override;
  }
  return STAGING_DRAFT_SERVER_URL;
}

/**
 * Returns the appropriate API base URL based on staging mode.
 */
export function getDraftsApiUrl(): string {
  if (isStagingMode()) {
    const url = getStagingApiUrl();
    if (url) return url;
  }
  return process.env.NEXT_PUBLIC_DRAFTS_API_URL || '';
}

/**
 * Returns the appropriate WebSocket URL based on staging mode.
 */
export function getDraftServerUrl(): string {
  if (isStagingMode()) {
    const url = getStagingWsUrl();
    if (url) return url;
  }
  return process.env.NEXT_PUBLIC_DRAFT_SERVER_URL || '';
}
