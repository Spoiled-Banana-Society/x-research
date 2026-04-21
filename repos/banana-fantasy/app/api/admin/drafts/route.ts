import { rateLimit, RATE_LIMITS } from "@/lib/rateLimit";
export const dynamic = 'force-dynamic';

import { type Timestamp } from 'firebase-admin/firestore';
import { json, jsonError } from '@/lib/api/routeUtils';
import { ApiError } from '@/lib/api/errors';
import { requireAdmin } from '@/lib/adminAuth';
import { getAdminFirestore } from '@/lib/firebaseAdmin';
import { logger } from '@/lib/logger';
import { getRequestId } from '@/lib/requestId';

type FirestoreTimestamp = Timestamp | { toDate: () => Date };

function toIsoDate(value: unknown): string | null {
  if (typeof value === 'string' && value.trim()) return value;
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value.toISOString();
  if (value && typeof value === 'object' && 'toDate' in value && typeof (value as FirestoreTimestamp).toDate === 'function') {
    const date = (value as FirestoreTimestamp).toDate();
    return Number.isNaN(date.getTime()) ? null : date.toISOString();
  }
  return null;
}

export async function GET(req: Request) {
  const requestId = getRequestId(req);
  const start = Date.now();
  const rateLimited = rateLimit(req, RATE_LIMITS.admin);
  if (rateLimited) return rateLimited;

  try {
    await requireAdmin(req);
    const db = getAdminFirestore();

    // Parallelize probes across all candidate collections (was sequential)
    const collections = ['drafts', 'v2_drafts', 'draftRooms'];
    const snaps = await Promise.all(
      collections.map((col) =>
        db.collection(col).orderBy('createdAt', 'desc').limit(100).get().catch(() => null),
      ),
    );
    const firstNonEmpty = snaps.findIndex((s) => s && !s.empty);

    let drafts: Array<Record<string, unknown>> = [];
    if (firstNonEmpty >= 0 && snaps[firstNonEmpty]) {
      const col = collections[firstNonEmpty];
      drafts = snaps[firstNonEmpty]!.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.name || data.draftName || doc.id,
          status: data.status || 'unknown',
          playerCount: data.playerCount || data.participants?.length || 0,
          maxPlayers: data.maxPlayers || data.seats || 10,
          createdAt: toIsoDate(data.createdAt),
          startedAt: toIsoDate(data.startedAt),
          completedAt: toIsoDate(data.completedAt),
          entryFee: data.entryFee || 0,
          collection: col,
        };
      });
    }

    const active = drafts.filter((d) => d.status === 'active' || d.status === 'in_progress' || d.status === 'drafting');
    const completed = drafts.filter((d) => d.status === 'completed' || d.status === 'finished');
    const pending = drafts.filter((d) => d.status === 'pending' || d.status === 'waiting' || d.status === 'lobby');

    logger.info('admin.drafts.ok', {
      requestId,
      total: drafts.length,
      active: active.length,
      durationMs: Date.now() - start,
    });

    return json({
      drafts,
      summary: { active: active.length, completed: completed.length, pending: pending.length, total: drafts.length },
      requestId,
    });
  } catch (err) {
    logger.error('admin.drafts.failed', { requestId, err, durationMs: Date.now() - start });
    if (err instanceof ApiError) return jsonError(err.message, err.status, { requestId });
    return jsonError('Internal Server Error', 500, { requestId });
  }
}
