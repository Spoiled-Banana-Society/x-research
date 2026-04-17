import { rateLimit, RATE_LIMITS } from '@/lib/rateLimit';
export const dynamic = 'force-dynamic';

import { FieldValue } from 'firebase-admin/firestore';
import { ApiError } from '@/lib/api/errors';
import { json, jsonError, parseBody } from '@/lib/api/routeUtils';
import { requireAdmin } from '@/lib/adminAuth';
import { getAdminFirestore, isFirestoreConfigured } from '@/lib/firebaseAdmin';

const USERS_COLLECTION = 'v2_users';

function normalizeWallet(raw: string): string {
  return raw.trim().toLowerCase();
}

export async function POST(req: Request) {
  const rateLimited = rateLimit(req, RATE_LIMITS.admin);
  if (rateLimited) return rateLimited;

  try {
    await requireAdmin(req);

    if (!isFirestoreConfigured()) {
      throw new ApiError(503, 'Firestore not configured');
    }

    const body = await parseBody(req);
    const rawIdentifier = typeof body.identifier === 'string' ? body.identifier.trim() : '';
    const count = Number(body.count);

    if (!rawIdentifier) throw new ApiError(400, 'Missing identifier (wallet or username)');
    if (!Number.isFinite(count) || !Number.isInteger(count) || count === 0) {
      throw new ApiError(400, 'count must be a non-zero integer');
    }
    if (Math.abs(count) > 1000) {
      throw new ApiError(400, 'count out of range (max 1000)');
    }

    const db = getAdminFirestore();
    let userDocId: string | null = null;
    let resolvedWallet: string | null = null;
    let resolvedUsername: string | null = null;

    // Try wallet first (if it looks like 0x...)
    if (/^0x[0-9a-fA-F]{40}$/.test(rawIdentifier)) {
      const wallet = normalizeWallet(rawIdentifier);
      const direct = await db.collection(USERS_COLLECTION).doc(wallet).get();
      if (direct.exists) {
        userDocId = wallet;
        const data = direct.data();
        resolvedWallet = (data?.walletAddress as string) ?? wallet;
        resolvedUsername = (data?.username as string) ?? null;
      } else {
        // Fall back: look up by walletAddress field (user id might differ from wallet)
        const snap = await db
          .collection(USERS_COLLECTION)
          .where('walletAddress', '==', wallet)
          .limit(1)
          .get();
        if (!snap.empty) {
          userDocId = snap.docs[0].id;
          const data = snap.docs[0].data();
          resolvedWallet = (data.walletAddress as string) ?? wallet;
          resolvedUsername = (data.username as string) ?? null;
        }
      }
    }

    // Try username if wallet didn't resolve
    if (!userDocId) {
      const snap = await db
        .collection(USERS_COLLECTION)
        .where('username', '==', rawIdentifier)
        .limit(1)
        .get();
      if (!snap.empty) {
        userDocId = snap.docs[0].id;
        const data = snap.docs[0].data();
        resolvedWallet = (data.walletAddress as string) ?? null;
        resolvedUsername = (data.username as string) ?? null;
      }
    }

    if (!userDocId) {
      throw new ApiError(404, `User not found for "${rawIdentifier}"`);
    }

    const userRef = db.collection(USERS_COLLECTION).doc(userDocId);
    await userRef.set(
      { freeDrafts: FieldValue.increment(count) },
      { merge: true },
    );

    const fresh = await userRef.get();
    const newFreeDrafts = (fresh.data()?.freeDrafts as number | undefined) ?? 0;

    return json({
      success: true,
      userId: userDocId,
      walletAddress: resolvedWallet,
      username: resolvedUsername,
      granted: count,
      freeDrafts: newFreeDrafts,
    });
  } catch (err) {
    if (err instanceof ApiError) return jsonError(err.message, err.status);
    console.error('[admin/grant-drafts]', err);
    return jsonError('Internal Server Error', 500);
  }
}
