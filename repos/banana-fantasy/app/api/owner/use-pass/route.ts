export const dynamic = 'force-dynamic';

import { ApiError } from '@/lib/api/errors';
import { json, jsonError, parseBody, requireString } from '@/lib/api/routeUtils';
import { getAdminFirestore, isFirestoreConfigured } from '@/lib/firebaseAdmin';
import { FieldValue } from 'firebase-admin/firestore';

const USERS_COLLECTION = 'v2_users';

/**
 * POST /api/owner/use-pass
 * Decrements draftPasses or freeDrafts in Firestore when entering a draft.
 * The Go API handles token consumption, but doesn't update our Firestore counter.
 */
export async function POST(req: Request) {
  try {
    const body = await parseBody(req);
    const userId = requireString(body.userId, 'userId');
    const passType = body.passType === 'free' ? 'free' : 'paid';

    if (!isFirestoreConfigured()) {
      return json({ success: true, note: 'Firestore not configured' });
    }

    const db = getAdminFirestore();
    const userRef = db.collection(USERS_COLLECTION).doc(userId);

    const field = passType === 'paid' ? 'draftPasses' : 'freeDrafts';
    await userRef.set(
      { [field]: FieldValue.increment(-1) },
      { merge: true }
    );

    return json({ success: true, decremented: field });
  } catch (err) {
    if (err instanceof ApiError) return jsonError(err.message, err.status);
    console.error('[use-pass] POST failed:', err);
    return jsonError('Internal Server Error', 500);
  }
}
