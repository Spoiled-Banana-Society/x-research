export const dynamic = 'force-dynamic';

import { ApiError } from '@/lib/api/errors';
import { json, jsonError, parseBody, requireString } from '@/lib/api/routeUtils';
import { getAdminFirestore, isFirestoreConfigured } from '@/lib/firebaseAdmin';

const USERS_COLLECTION = 'v2_users';

/**
 * POST /api/owner/use-pass
 *
 * Decrements `draftPasses` or `freeDrafts` in Firestore when a user enters
 * a draft. The Go API handles the actual token consumption (marking a
 * card active in a league); this endpoint keeps the Firestore counter —
 * which is the user-facing source of truth — in sync.
 *
 * Uses a transaction with a floor of 0 so a misfire on a wallet with no
 * passes can never push the counter negative. If the counter is already 0
 * (or missing), the endpoint no-ops and returns `decrementedFrom: 0`.
 */
export async function POST(req: Request) {
  try {
    const body = await parseBody(req);
    const userId = requireString(body.userId, 'userId');
    const passType = body.passType === 'free' ? 'free' : 'paid';

    if (!isFirestoreConfigured()) {
      return json({ success: true, note: 'Firestore not configured' });
    }

    const field = passType === 'paid' ? 'draftPasses' : 'freeDrafts';
    const db = getAdminFirestore();
    const userRef = db.collection(USERS_COLLECTION).doc(userId);

    const result = await db.runTransaction(async (tx) => {
      const snap = await tx.get(userRef);
      const current = (snap.exists ? (snap.data()?.[field] as number | undefined) : undefined) ?? 0;
      if (current <= 0) {
        return { decremented: false, before: current, after: current };
      }
      tx.set(userRef, { [field]: current - 1 }, { merge: true });
      return { decremented: true, before: current, after: current - 1 };
    });

    return json({
      success: true,
      field,
      decremented: result.decremented,
      before: result.before,
      after: result.after,
    });
  } catch (err) {
    if (err instanceof ApiError) return jsonError(err.message, err.status);
    console.error('[use-pass] POST failed:', err);
    return jsonError('Internal Server Error', 500);
  }
}
