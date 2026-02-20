import crypto from 'node:crypto';

import { ApiError } from '@/lib/api/errors';

type JwtPayload = Record<string, unknown>;

let cachedKey: crypto.KeyObject | null = null;

function getPrivyVerificationKey(): crypto.KeyObject {
  if (cachedKey) return cachedKey;
  const rawKey = process.env.PRIVY_JWT_PUBLIC_KEY;
  if (!rawKey) throw new ApiError(500, 'Privy JWT public key not configured');
  cachedKey = crypto.createPublicKey(rawKey);
  return cachedKey;
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

function verifyPrivyJwt(token: string): { userId: string; walletAddress: string | null } {
  const appId = process.env.PRIVY_APP_ID;
  if (!appId) throw new ApiError(500, 'Privy app ID not configured');

  const { header, payload, signature, signingInput } = decodeJwt(token);
  const alg = typeof header.alg === 'string' ? header.alg : '';
  if (!alg || !['ES256', 'RS256'].includes(alg)) throw new ApiError(401, 'Invalid auth token');

  const key = getPrivyVerificationKey();
  const verifier = crypto.createVerify('SHA256');
  verifier.update(signingInput);
  verifier.end();

  const isValid = verifier.verify(
    alg.startsWith('ES') ? { key, dsaEncoding: 'ieee-p1363' } : key,
    signature,
  );
  if (!isValid) throw new ApiError(401, 'Invalid auth token');

  if (typeof payload.exp === 'number' && Date.now() / 1000 >= payload.exp) {
    throw new ApiError(401, 'Auth token expired');
  }

  if (payload.aud) {
    const aud = payload.aud;
    const audienceMatches = Array.isArray(aud) ? aud.includes(appId) : aud === appId;
    if (!audienceMatches) throw new ApiError(401, 'Invalid auth token');
  }

  const expectedIssuer = process.env.PRIVY_JWT_ISSUER;
  if (expectedIssuer && payload.iss && payload.iss !== expectedIssuer) {
    throw new ApiError(401, 'Invalid auth token');
  }

  const userId =
    (typeof payload.sub === 'string' && payload.sub.trim()) ||
    (typeof payload.user_id === 'string' && payload.user_id.trim()) ||
    (typeof payload.userId === 'string' && payload.userId.trim());

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
