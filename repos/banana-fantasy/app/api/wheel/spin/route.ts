import { rateLimit, RATE_LIMITS } from "@/lib/rateLimit";
export const dynamic = "force-dynamic";
import crypto from 'node:crypto';

import { ApiError } from '@/lib/api/errors';
import { json, jsonError } from '@/lib/api/routeUtils';
import { getAdminFirestore } from '@/lib/firebaseAdmin';
import { generateNonce, generateSeed, pickWeighted } from '@/lib/rng';
import { getWheelConfig } from '@/lib/wheelConfigFirestore';

const WHEEL_SPINS_COLLECTION = 'wheelSpins';

let cachedKey: crypto.KeyObject | null = null;

function nowIso() {
  return new Date().toISOString();
}

function getUtcDayRange(date = new Date()) {
  const start = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const end = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() + 1));
  return { start: start.toISOString(), end: end.toISOString() };
}

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

function verifyPrivyJwt(token: string): string {
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
    const ok = Array.isArray(aud) ? aud.includes(appId) : aud === appId;
    if (!ok) throw new ApiError(401, 'Invalid auth token');
  }

  const expectedIssuer = process.env.PRIVY_JWT_ISSUER;
  if (expectedIssuer && payload.iss && payload.iss !== expectedIssuer) {
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

    const userId = verifyPrivyJwt(token);

    const db = getAdminFirestore();
    const { start, end } = getUtcDayRange();
    const existing = await db
      .collection(WHEEL_SPINS_COLLECTION)
      .where('userId', '==', userId)
      .where('timestamp', '>=', start)
      .where('timestamp', '<', end)
      .limit(1)
      .get();

    if (!existing.empty) {
      throw new ApiError(429, 'Spin already used today');
    }

    const { segments, segmentAngle } = await getWheelConfig();
    const seed = generateSeed();
    const nonce = generateNonce();
    const { value: segment, index } = pickWeighted(
      segments.map((s) => ({ value: s, probability: s.probability })),
      seed,
    );

    const segmentCenter = index * segmentAngle + segmentAngle / 2;
    const angle = (360 - segmentCenter + 360) % 360;
    const spinId = crypto.randomUUID();

    const prize = {
      type: segment.prizeType,
      value: segment.prizeValue,
    };
    const timestamp = nowIso();

    await db.collection(WHEEL_SPINS_COLLECTION).doc(spinId).set({
      userId,
      spinId,
      result: segment.id,
      prize,
      timestamp,
      seed,
      nonce,
    });

    return json({ spinId, result: segment.id, prize, angle }, 200);
  } catch (err) {
    if (err instanceof ApiError) return jsonError(err.message, err.status);
    console.error(err);
    return jsonError('Internal Server Error', 500);
  }
}
