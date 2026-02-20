import { rateLimit, RATE_LIMITS } from "@/lib/rateLimit";
export const dynamic = 'force-dynamic';

import { json, jsonError, parseBody } from '@/lib/api/routeUtils';
import { ApiError } from '@/lib/api/errors';
import { requireAdmin } from '@/lib/adminAuth';
import { getAdminFirestore } from '@/lib/firebaseAdmin';

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const rateLimited = rateLimit(req, RATE_LIMITS.admin);
  if (rateLimited) return rateLimited;
  try {
    await requireAdmin(req);
    const { id } = params;
    if (!id) return jsonError('Missing user id', 400);

    const body = await parseBody<{ banned?: boolean }>(req);
    if (typeof body.banned !== 'boolean') {
      return jsonError('Expected { banned: boolean }', 400);
    }

    const db = getAdminFirestore();

    // Try both collections
    const collections = ['users', 'v2_users'];
    for (const col of collections) {
      const ref = db.collection(col).doc(id);
      const doc = await ref.get();
      if (doc.exists) {
        await ref.set({ banned: body.banned, updatedAt: new Date().toISOString() }, { merge: true });
        const updated = await ref.get();
        const data = updated.data() || {};
        return json({
          id: updated.id,
          walletAddress: data.walletAddress || '',
          banned: data.banned === true,
          email: data.blueCheckEmail || data.email || null,
        }, 200);
      }
    }

    return jsonError('User not found', 404);
  } catch (err) {
    if (err instanceof ApiError) return jsonError(err.message, err.status);
    console.error('[admin/users/:id] PUT failed:', err);
    return jsonError('Internal Server Error', 500);
  }
}
