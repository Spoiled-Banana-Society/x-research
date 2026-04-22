import { rateLimit, RATE_LIMITS } from '@/lib/rateLimit';
export const dynamic = 'force-dynamic';

import { ApiError } from '@/lib/api/errors';
import { json, jsonError } from '@/lib/api/routeUtils';
import { requireAdmin } from '@/lib/adminAuth';
import { getAdminFirestore, isFirestoreConfigured } from '@/lib/firebaseAdmin';
import { logger } from '@/lib/logger';
import { getRequestId } from '@/lib/requestId';
import { logAdminAction } from '@/lib/adminAudit';

const USERS_COLLECTION = 'v2_users';
const BATCH_SIZE = 400; // Firestore batch cap is 500 — leave headroom.

export async function POST(req: Request) {
  const requestId = getRequestId(req);
  const start = Date.now();
  const rateLimited = rateLimit(req, RATE_LIMITS.admin);
  if (rateLimited) return rateLimited;

  let actorWallet = '';
  try {
    const admin = await requireAdmin(req);
    actorWallet = admin.walletAddress ?? admin.userId;

    if (!isFirestoreConfigured()) throw new ApiError(503, 'Firestore not configured');

    const db = getAdminFirestore();
    const snap = await db
      .collection(USERS_COLLECTION)
      .where('freeDrafts', '>', 0)
      .get();

    const totalBefore = snap.docs.reduce(
      (sum, d) => sum + ((d.data().freeDrafts as number | undefined) ?? 0),
      0,
    );

    // Zero out in batches
    let zeroed = 0;
    for (let i = 0; i < snap.docs.length; i += BATCH_SIZE) {
      const chunk = snap.docs.slice(i, i + BATCH_SIZE);
      const batch = db.batch();
      for (const doc of chunk) {
        batch.update(doc.ref, { freeDrafts: 0 });
      }
      await batch.commit();
      zeroed += chunk.length;
    }

    await logAdminAction({
      actor: actorWallet,
      action: 'zero-free-drafts',
      target: 'v2_users/*',
      before: { totalFreeDrafts: totalBefore, usersWithFreeDrafts: snap.docs.length },
      after: { zeroedUsers: zeroed, totalFreeDrafts: 0 },
      requestId,
    });

    logger.info('admin.zero_free_drafts.ok', {
      requestId,
      actor: actorWallet,
      zeroedUsers: zeroed,
      totalBefore,
      durationMs: Date.now() - start,
    });

    return json({
      success: true,
      zeroedUsers: zeroed,
      totalFreeDraftsCleared: totalBefore,
      requestId,
    });
  } catch (err) {
    logger.error('admin.zero_free_drafts.failed', {
      requestId,
      actor: actorWallet,
      err,
      durationMs: Date.now() - start,
    });
    if (err instanceof ApiError) return jsonError(err.message, err.status, { requestId });
    return jsonError('Internal Server Error', 500, { requestId });
  }
}
