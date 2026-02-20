import { rateLimit, RATE_LIMITS } from "@/lib/rateLimit";
export const dynamic = 'force-dynamic';

import { type Timestamp } from 'firebase-admin/firestore';
import { json, jsonError } from '@/lib/api/routeUtils';
import { ApiError } from '@/lib/api/errors';
import { requireAdmin } from '@/lib/adminAuth';
import { getAdminFirestore } from '@/lib/firebaseAdmin';

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
  const rateLimited = rateLimit(req, RATE_LIMITS.admin);
  if (rateLimited) return rateLimited;
  try {
    await requireAdmin(req);
    const db = getAdminFirestore();

    // Try multiple collection names
    const collections = ['drafts', 'v2_drafts', 'draftRooms'];
    let drafts: Array<Record<string, unknown>> = [];

    for (const col of collections) {
      const snap = await db.collection(col).orderBy('createdAt', 'desc').limit(100).get();
      if (!snap.empty) {
        drafts = snap.docs.map((doc) => {
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
        break;
      }
    }

    const active = drafts.filter((d) => d.status === 'active' || d.status === 'in_progress' || d.status === 'drafting');
    const completed = drafts.filter((d) => d.status === 'completed' || d.status === 'finished');
    const pending = drafts.filter((d) => d.status === 'pending' || d.status === 'waiting' || d.status === 'lobby');

    return json({ drafts, summary: { active: active.length, completed: completed.length, pending: pending.length, total: drafts.length } }, 200);
  } catch (err) {
    if (err instanceof ApiError) return jsonError(err.message, err.status);
    console.error('[admin/drafts] GET failed:', err);
    return jsonError('Internal Server Error', 500);
  }
}
