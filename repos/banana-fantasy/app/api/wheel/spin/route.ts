import { rateLimit, RATE_LIMITS } from "@/lib/rateLimit";
export const dynamic = "force-dynamic";
import crypto from 'node:crypto';

import { ApiError } from '@/lib/api/errors';
import { json, jsonError } from '@/lib/api/routeUtils';
import { getAdminFirestore } from '@/lib/firebaseAdmin';
import { generateNonce, generateSeed, pickWeighted } from '@/lib/rng';
import { getWheelConfig } from '@/lib/wheelConfigFirestore';

import { FieldValue } from 'firebase-admin/firestore';
import { logger } from '@/lib/logger';

const WHEEL_SPINS_COLLECTION = 'wheelSpins';
const USERS_COLLECTION = 'v2_users';
const JWKS_CACHE_TTL_MS = 60 * 60 * 1000;

const jwksCache: {
  keys: Map<string, crypto.KeyObject>;
  cachedAt: number;
} = {
  keys: new Map(),
  cachedAt: 0,
};

function nowIso() {
  return new Date().toISOString();
}

function getPrivyAppId(): string {
  const appId = (process.env.PRIVY_APP_ID || process.env.NEXT_PUBLIC_PRIVY_APP_ID || '').trim();
  if (!appId) throw new ApiError(500, 'Privy app ID not configured');
  return appId;
}

async function getPrivyVerificationKey(kid: string): Promise<crypto.KeyObject> {
  const cacheExpired = jwksCache.cachedAt === 0 || (Date.now() - jwksCache.cachedAt) > JWKS_CACHE_TTL_MS;
  const cached = !cacheExpired ? jwksCache.keys.get(kid) : undefined;
  if (cached) return cached;
  await refreshPrivyVerificationKeys();
  const key = jwksCache.keys.get(kid);
  if (!key) throw new ApiError(401, 'Unknown signing key');
  return key;
}

async function refreshPrivyVerificationKeys(): Promise<void> {
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

function base64UrlDecode(input: string): Buffer {
  const normalized = input.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4);
  return Buffer.from(padded, 'base64');
}

function decodeJwt(token: string): {
  header: Record<string, unknown>;
  payload: Record<string, unknown>;
  signature: Buffer;
  signingInput: string;
} {
  const parts = token.split('.');
  if (parts.length !== 3) throw new ApiError(401, 'Invalid auth token');
  const [headerPart, payloadPart, signaturePart] = parts;
  const header = JSON.parse(base64UrlDecode(headerPart).toString('utf8')) as Record<string, unknown>;
  const payload = JSON.parse(base64UrlDecode(payloadPart).toString('utf8')) as Record<string, unknown>;
  const signature = base64UrlDecode(signaturePart);
  return { header, payload, signature, signingInput: `${headerPart}.${payloadPart}` };
}

async function verifyPrivyJwt(token: string): Promise<string> {
  const appId = getPrivyAppId();

  const { header, payload, signature, signingInput } = decodeJwt(token);
  const alg = typeof header.alg === 'string' ? header.alg : '';
  if (!alg || !['ES256', 'RS256'].includes(alg)) throw new ApiError(401, 'Unsupported token algorithm: ' + alg);

  const kid = typeof header.kid === 'string' ? header.kid : '';
  if (!kid) throw new ApiError(401, 'Missing key ID in token header');

  const verifySignature = async (forceRefresh: boolean): Promise<boolean> => {
    const key = forceRefresh
      ? (await refreshPrivyVerificationKeys(), jwksCache.keys.get(kid))
      : await getPrivyVerificationKey(kid);

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
    if (!(error instanceof ApiError) || error.status !== 401) {
      throw error;
    }
  }

  if (!isValid) {
    isValid = await verifySignature(true);
  }

  if (!isValid) throw new ApiError(401, 'Token signature verification failed');

  if (typeof payload.exp === 'number' && Date.now() / 1000 >= payload.exp) {
    throw new ApiError(401, 'Auth token expired');
  }

  const aud = payload.aud;
  if (aud == null) throw new ApiError(401, 'Invalid auth token');
  const audienceMatches = Array.isArray(aud) ? aud.includes(appId) : aud === appId;
  if (!audienceMatches) throw new ApiError(401, 'Invalid auth token');

  const expectedIssuer = process.env.PRIVY_JWT_ISSUER?.trim();
  if (expectedIssuer && payload.iss !== expectedIssuer) {
    throw new ApiError(401, 'Invalid auth token');
  }

  const userId =
    (typeof payload.sub === 'string' && payload.sub) ||
    (typeof (payload as Record<string, unknown>).user_id === 'string' && (payload as Record<string, string>).user_id) ||
    (typeof (payload as Record<string, unknown>).userId === 'string' && (payload as Record<string, string>).userId);

  if (!userId) throw new ApiError(401, 'Invalid auth token');
  return userId;
}

export async function POST(req: Request) {
  const rateLimited = rateLimit(req, RATE_LIMITS.wheel);
  if (rateLimited) return rateLimited;
  try {
    const authHeader = req.headers.get('authorization') || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
    if (!token) throw new ApiError(401, 'Missing authorization token');

    // Verify JWT is valid (proves user is authenticated)
    // Note: Privy JWT sub is a DID (did:privy:xxx), not a wallet address.
    // The body userId is the wallet address used as our app's user ID.
    // We verify the JWT is valid but use the body userId for data lookups.
    await verifyPrivyJwt(token);
    const body = await req.json().catch(() => ({})) as Record<string, unknown>;
    const userId = typeof body.userId === 'string' ? body.userId.trim() : '';
    if (!userId) throw new ApiError(400, 'Missing userId');

    const db = getAdminFirestore();

    const { segments, segmentAngle } = await getWheelConfig();
    const seed = generateSeed();
    const nonce = generateNonce();

    const allowForcedResult = process.env.NEXT_PUBLIC_ENVIRONMENT === 'staging';
    const forceResult =
      allowForcedResult && typeof body.forceResult === 'string' ? body.forceResult : null;
    let segment: typeof segments[number];
    let index: number;

    if (forceResult) {
      const forcedIdx = segments.findIndex(s => s.id === forceResult);
      if (forcedIdx >= 0) {
        segment = segments[forcedIdx];
        index = forcedIdx;
      } else {
        ({ value: segment, index } = pickWeighted(
          segments.map((s) => ({ value: s, probability: s.probability })),
          seed,
        ));
      }
    } else {
      ({ value: segment, index } = pickWeighted(
        segments.map((s) => ({ value: s, probability: s.probability })),
        seed,
      ));
    }

    const segmentCenter = index * segmentAngle + segmentAngle / 2;
    const angle = (360 - segmentCenter + 360) % 360;
    const spinId = crypto.randomUUID();

    const prize = {
      type: segment.prizeType,
      value: segment.prizeValue,
    };
    const timestamp = nowIso();

    const userRef = db.collection(USERS_COLLECTION).doc(userId);
    const spinRef = db.collection(WHEEL_SPINS_COLLECTION).doc(spinId);

    await db.runTransaction(async (tx) => {
      const userDoc = await tx.get(userRef);
      const userData = userDoc.data();
      const spinsLeft = userData?.wheelSpins ?? 0;
      if (spinsLeft <= 0) {
        throw new ApiError(429, 'No spins remaining');
      }

      tx.set(spinRef, {
        userId,
        spinId,
        result: segment.id,
        prize,
        timestamp,
        seed,
        nonce,
      });

      const balanceUpdate: Record<string, FieldValue | number> = {
        wheelSpins: FieldValue.increment(-1),
      };
      if (segment.prizeType === 'draft_pass' && typeof segment.prizeValue === 'number') {
        balanceUpdate.freeDrafts = FieldValue.increment(segment.prizeValue);
      } else if (segment.prizeType === 'custom' && segment.prizeValue === 'jackpot') {
        balanceUpdate.jackpotEntries = FieldValue.increment(1);
      } else if (segment.prizeType === 'custom' && segment.prizeValue === 'hof') {
        balanceUpdate.hofEntries = FieldValue.increment(1);
      }
      tx.set(userRef, balanceUpdate, { merge: true });
    });

    // Auto-queue for Jackpot/HOF — happens server-side so it can't be interrupted
    if (segment.prizeType === 'custom' && (segment.prizeValue === 'jackpot' || segment.prizeValue === 'hof')) {
      try {
        const { joinQueue } = await import('@/lib/db');
        await joinQueue(userId, segment.prizeValue as 'jackpot' | 'hof');
        logger.debug(`[wheel/spin] Auto-queued ${userId} for ${segment.prizeValue}`);
      } catch (qErr) {
        // Don't fail the spin if queue join fails — entry is already awarded
        console.warn(`[wheel/spin] Auto-queue failed (entry still awarded):`, qErr);
      }
    }

    return json({ spinId, result: segment.id, prize, angle }, 200);
  } catch (err) {
    if (err instanceof ApiError) return jsonError(err.message, err.status);
    console.error('[wheel/spin] Unhandled error:', err);
    return jsonError('Internal Server Error', 500);
  }
}
