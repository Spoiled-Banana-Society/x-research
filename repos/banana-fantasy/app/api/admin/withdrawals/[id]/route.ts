import { rateLimit, RATE_LIMITS } from "@/lib/rateLimit";
export const dynamic = 'force-dynamic';

import { type Timestamp } from 'firebase-admin/firestore';

import { json, jsonError, parseBody } from '@/lib/api/routeUtils';
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

function toNumber(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return 0;
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const rateLimited = rateLimit(req, RATE_LIMITS.admin);
  if (rateLimited) return rateLimited;
  try {
    await requireAdmin(req);

    const { id } = params;
    if (!id) return jsonError('Missing withdrawal id', 400);

    const body = await parseBody<{ status?: unknown }>(req);
    if (body.status !== 'approved' && body.status !== 'denied') {
      return jsonError('Invalid status. Expected approved or denied', 400);
    }

    const db = getAdminFirestore();
    const ref = db.collection('withdrawalRequests').doc(id);
    const existing = await ref.get();

    if (!existing.exists) return jsonError('Withdrawal request not found', 404);

    await ref.set(
      {
        status: body.status,
        updatedAt: new Date().toISOString(),
      },
      { merge: true },
    );

    const updated = await ref.get();
    const data = updated.data() || {};

    return json(
      {
        id: updated.id,
        userId: typeof data.userId === 'string' ? data.userId : '',
        walletAddress: typeof data.walletAddress === 'string' ? data.walletAddress : '',
        amount: toNumber(data.amount),
        status: typeof data.status === 'string' ? data.status : body.status,
        createdAt: toIsoDate(data.createdAt),
        blueCheckVerified: data.blueCheckVerified === true || data.isBlueCheckVerified === true,
      },
      200,
    );
  } catch (err) {
    if (err instanceof ApiError) return jsonError(err.message, err.status);
    console.error('[admin/withdrawals/:id] PUT failed:', err);
    return jsonError('Internal Server Error', 500);
  }
}
