import { rateLimit, RATE_LIMITS } from "@/lib/rateLimit";
export const dynamic = 'force-dynamic';

import { type CollectionReference, type DocumentData, type Timestamp } from 'firebase-admin/firestore';

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

function toNonNegativeInt(value: string | null, fallback: number): number {
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed < 0) return fallback;
  return parsed;
}

async function resolveUsersCollection(): Promise<CollectionReference<DocumentData>> {
  const db = getAdminFirestore();
  const usersRef = db.collection('users');
  const v2UsersRef = db.collection('v2_users');

  const [usersProbe, v2Probe] = await Promise.all([usersRef.limit(1).get(), v2UsersRef.limit(1).get()]);

  if (!usersProbe.empty) return usersRef;
  if (!v2Probe.empty) return v2UsersRef;

  // Prefer users when both are empty/non-existent.
  return usersRef;
}

export async function GET(req: Request) {
  const rateLimited = rateLimit(req, RATE_LIMITS.admin);
  if (rateLimited) return rateLimited;
  try {
    await requireAdmin(req);

    const url = new URL(req.url);
    const limit = Math.min(toNonNegativeInt(url.searchParams.get('limit'), 50), 200);
    const offset = toNonNegativeInt(url.searchParams.get('offset'), 0);

    const usersCollection = await resolveUsersCollection();
    const totalSnap = await usersCollection.count().get();
    const total = totalSnap.data().count;

    let query = usersCollection.orderBy('createdAt', 'desc').limit(limit);
    if (offset > 0) query = query.offset(offset);

    const snap = await query.get();

    const users = snap.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        walletAddress: typeof data.walletAddress === 'string' ? data.walletAddress : '',
        email:
          (typeof data.blueCheckEmail === 'string' && data.blueCheckEmail) ||
          (typeof data.email === 'string' && data.email) ||
          null,
        createdAt: toIsoDate(data.createdAt),
        blueCheckVerified: data.blueCheckVerified === true || data.isBlueCheckVerified === true,
      };
    });

    return json(
      {
        users,
        pagination: {
          limit,
          offset,
          total,
          hasMore: offset + users.length < total,
        },
      },
      200,
    );
  } catch (err) {
    if (err instanceof ApiError) return jsonError(err.message, err.status);
    console.error('[admin/users] GET failed:', err);
    return jsonError('Internal Server Error', 500);
  }
}
