import { getAdminFirestore } from '@/lib/firebaseAdmin';
export const dynamic = 'force-dynamic';
import { json, jsonError, parseBody } from '@/lib/api/routeUtils';

const USERS_COLLECTION = 'v2_users';

export async function POST(req: Request) {
  try {
    const body = await parseBody(req);
    const userId = body.userId as string;
    const jackpotEntries = typeof body.jackpotEntries === 'number' ? body.jackpotEntries : undefined;
    const hofEntries = typeof body.hofEntries === 'number' ? body.hofEntries : undefined;
    const wheelSpins = typeof body.wheelSpins === 'number' ? body.wheelSpins : undefined;

    if (!userId) return jsonError('Missing userId', 400);

    const db = getAdminFirestore();
    const userRef = db.collection(USERS_COLLECTION).doc(userId);
    const patch: Record<string, number> = {};
    if (jackpotEntries !== undefined) patch.jackpotEntries = jackpotEntries;
    if (hofEntries !== undefined) patch.hofEntries = hofEntries;
    if (wheelSpins !== undefined) patch.wheelSpins = wheelSpins;

    await userRef.set(patch, { merge: true });
    return json({ success: true, patch }, 200);
  } catch (err) {
    console.error(err);
    return jsonError('Internal Server Error', 500);
  }
}
