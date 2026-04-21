import { rateLimit, RATE_LIMITS } from '@/lib/rateLimit';
export const dynamic = 'force-dynamic';

import { json, jsonError, parseBody } from '@/lib/api/routeUtils';
import { ApiError } from '@/lib/api/errors';
import { requireAdmin } from '@/lib/adminAuth';
import { getAdminFirestore } from '@/lib/firebaseAdmin';
import { logger } from '@/lib/logger';
import { getRequestId } from '@/lib/requestId';
import { logAdminAction } from '@/lib/adminAudit';

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const requestId = getRequestId(req);
  const start = Date.now();
  const rateLimited = rateLimit(req, RATE_LIMITS.admin);
  if (rateLimited) return rateLimited;

  let actor = '';
  try {
    const admin = await requireAdmin(req);
    actor = admin.walletAddress ?? admin.userId;
    const { id } = params;
    if (!id) throw new ApiError(400, 'Missing user id');

    const body = await parseBody<{ banned?: boolean }>(req);
    if (typeof body.banned !== 'boolean') throw new ApiError(400, 'Expected { banned: boolean }');

    const db = getAdminFirestore();
    for (const col of ['users', 'v2_users']) {
      const ref = db.collection(col).doc(id);
      const doc = await ref.get();
      if (doc.exists) {
        const before = doc.data() ?? {};
        await ref.set({ banned: body.banned, updatedAt: new Date().toISOString() }, { merge: true });
        const updated = await ref.get();
        const data = updated.data() ?? {};

        await logAdminAction({
          actor,
          action: body.banned ? 'ban-user' : 'unban-user',
          target: id,
          before: { banned: before.banned === true },
          after: { banned: data.banned === true },
          requestId,
        });

        logger.info('admin.user_ban.ok', {
          requestId,
          actor,
          target: id,
          banned: body.banned,
          durationMs: Date.now() - start,
        });

        return json({
          id: updated.id,
          walletAddress: data.walletAddress || '',
          banned: data.banned === true,
          email: data.blueCheckEmail || data.email || null,
          requestId,
        });
      }
    }

    throw new ApiError(404, 'User not found');
  } catch (err) {
    logger.error('admin.user_ban.failed', { requestId, actor, err, durationMs: Date.now() - start });
    if (err instanceof ApiError) return jsonError(err.message, err.status, { requestId });
    return jsonError('Internal Server Error', 500, { requestId });
  }
}
