import crypto from 'node:crypto';

import { ApiError } from '@/lib/api/errors';

type JwtPayload = Record<string, unknown>;

const JWKS_CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

const jwksCache: {
  keys: Map<string, crypto.KeyObject>;
  cachedAt: number;
} = {
  keys: new Map(),
  cachedAt: 0,
};

function getPrivyAppId(): string {
  const appId = (process.env.PRIVY_APP_ID || process.env.NEXT_PUBLIC_PRIVY_APP_ID || '').trim();
  if (!appId) throw new ApiError(500, 'Privy app ID not configured');
  return appId;
}

async function refreshJwksKeys(): Promise<void> {
  const appId = getPrivyAppId();
  const res = await fetch(`https://auth.privy.io/api/v1/apps/${appId}/jwks.json`);
  if (!res.ok) throw new ApiError(500, 'Failed to fetch Privy JWKS');
  const jwks = await res.json() as { keys: Array<{ kid: string; kty: string; crv: string; x: string; y: string }> };

  jwksCache.keys = new Map();
  for (const jwk of jwks.keys) {
    const key = crypto.createPublicKey({ key: jwk, format: 'jwk' });
    jwksCache.keys.set(jwk.kid, key);
  }
  jwksCache.cachedAt = Date.now();
}

async function getVerificationKey(kid: string): Promise<crypto.KeyObject> {
  const cacheExpired = jwksCache.cachedAt === 0 || (Date.now() - jwksCache.cachedAt) > JWKS_CACHE_TTL_MS;
  const cached = !cacheExpired ? jwksCache.keys.get(kid) : undefined;
  if (cached) return cached;
  await refreshJwksKeys();
  const key = jwksCache.keys.get(kid);
  if (!key) throw new ApiError(401, 'Unknown signing key');
  return key;
}

function base64UrlDecode(input: string): Buffer {
  const normalized = input.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4);
  return Buffer.from(padded, 'base64');
}

function decodeJwt(token: string): {
  header: Record<string, unknown>;
  payload: JwtPayload;
  signature: Buffer;
  signingInput: string;
} {
  const parts = token.split('.');
  if (parts.length !== 3) throw new ApiError(401, 'Invalid auth token');
  const [headerPart, payloadPart, signaturePart] = parts;
  const header = JSON.parse(base64UrlDecode(headerPart).toString('utf8')) as Record<string, unknown>;
  const payload = JSON.parse(base64UrlDecode(payloadPart).toString('utf8')) as JwtPayload;
  const signature = base64UrlDecode(signaturePart);
  return { header, payload, signature, signingInput: `${headerPart}.${payloadPart}` };
}

function getWalletFromPayload(payload: JwtPayload): string | null {
  const directFields = [
    payload.walletAddress,
    payload.wallet_address,
    payload.address,
    payload.user_wallet_address,
  ];

  for (const entry of directFields) {
    if (typeof entry === 'string' && entry.trim()) {
      return entry.trim().toLowerCase();
    }
  }

  const linkedAccounts = payload.linked_accounts;
  if (!Array.isArray(linkedAccounts)) return null;

  for (const account of linkedAccounts) {
    if (!account || typeof account !== 'object') continue;
    const record = account as Record<string, unknown>;
    const type = typeof record.type === 'string' ? record.type : '';
    const address = typeof record.address === 'string' ? record.address : '';
    if (type === 'wallet' && address.trim()) return address.trim().toLowerCase();
  }

  return null;
}

async function verifyPrivyJwt(token: string): Promise<{ userId: string; walletAddress: string | null }> {
  const appId = getPrivyAppId();
  const { header, payload, signature, signingInput } = decodeJwt(token);

  const alg = typeof header.alg === 'string' ? header.alg : '';
  if (!alg || !['ES256', 'RS256'].includes(alg)) throw new ApiError(401, 'Invalid auth token');

  const kid = typeof header.kid === 'string' ? header.kid : '';
  if (!kid) throw new ApiError(401, 'Missing key ID in token header');

  // Verify signature with JWKS key (try cache first, then refresh)
  const verifySignature = async (forceRefresh: boolean): Promise<boolean> => {
    const key = forceRefresh
      ? (await refreshJwksKeys(), jwksCache.keys.get(kid))
      : await getVerificationKey(kid);

    if (!key) throw new ApiError(401, 'Unknown signing key');

    const verifier = crypto.createVerify('SHA256');
    verifier.update(signingInput);
    verifier.end();

    return verifier.verify(
      alg.startsWith('ES') ? { key, dsaEncoding: 'ieee-p1363' } : key,
      signature,
    );
  };

  let isValid = false;
  try {
    isValid = await verifySignature(false);
  } catch (error) {
    if (!(error instanceof ApiError) || error.status !== 401) throw error;
  }
  if (!isValid) {
    isValid = await verifySignature(true);
  }
  if (!isValid) throw new ApiError(401, 'Token signature verification failed');

  // Check expiration
  if (typeof payload.exp === 'number' && Date.now() / 1000 >= payload.exp) {
    throw new ApiError(401, 'Auth token expired');
  }

  // Check audience
  const aud = payload.aud;
  if (aud != null) {
    const audienceMatches = Array.isArray(aud) ? aud.includes(appId) : aud === appId;
    if (!audienceMatches) throw new ApiError(401, 'Invalid auth token');
  }

  // Check issuer
  const expectedIssuer = process.env.PRIVY_JWT_ISSUER?.trim();
  if (expectedIssuer && payload.iss && payload.iss !== expectedIssuer) {
    throw new ApiError(401, 'Invalid auth token');
  }

  const userId =
    (typeof payload.sub === 'string' && payload.sub.trim()) ||
    (typeof payload.user_id === 'string' && (payload as Record<string, string>).user_id.trim()) ||
    (typeof payload.userId === 'string' && (payload as Record<string, string>).userId.trim());

  if (!userId) throw new ApiError(401, 'Invalid auth token');

  return {
    userId,
    walletAddress: getWalletFromPayload(payload),
  };
}

export async function getPrivyUser(req: Request): Promise<{ userId: string; walletAddress: string | null }> {
  const authHeader = req.headers.get('authorization') || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  if (!token) throw new ApiError(401, 'Missing authorization token');

  return verifyPrivyJwt(token);
}
