import { describe, it, expect } from 'vitest';

// Test the CORS origin validation logic directly
describe('API Guard - CORS Validation', () => {
  const ALLOWED_ORIGINS = [
    /^https:\/\/banana-fantasy-.*\.vercel\.app$/,
    'https://banana-fantasy-sbs.vercel.app',
    'http://localhost:3000',
    'http://localhost:3001',
  ];

  function isAllowedOrigin(origin: string | null): boolean {
    if (!origin) return false;
    return ALLOWED_ORIGINS.some((allowed) =>
      typeof allowed === 'string' ? allowed === origin : allowed.test(origin),
    );
  }

  it('allows banana-fantasy-sbs.vercel.app', () => {
    expect(isAllowedOrigin('https://banana-fantasy-sbs.vercel.app')).toBe(true);
  });

  it('allows banana-fantasy preview deploys', () => {
    expect(isAllowedOrigin('https://banana-fantasy-abc123.vercel.app')).toBe(true);
  });

  it('rejects other vercel.app domains', () => {
    expect(isAllowedOrigin('https://evil-site.vercel.app')).toBe(false);
  });

  it('allows localhost:3000', () => {
    expect(isAllowedOrigin('http://localhost:3000')).toBe(true);
  });

  it('rejects null origin', () => {
    expect(isAllowedOrigin(null)).toBe(false);
  });

  it('rejects empty string', () => {
    expect(isAllowedOrigin('')).toBe(false);
  });

  it('rejects random domains', () => {
    expect(isAllowedOrigin('https://google.com')).toBe(false);
    expect(isAllowedOrigin('https://phishing-banana-fantasy.com')).toBe(false);
  });
});
