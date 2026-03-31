export const dynamic = "force-dynamic";
import { ApiError } from '@/lib/api/errors';
import { json, jsonError, parseBody, requireString } from '@/lib/api/routeUtils';
import { getAdminFirestore, isFirestoreConfigured } from '@/lib/firebaseAdmin';
import { getStagingApiUrl } from '@/lib/staging';
import { FieldValue } from 'firebase-admin/firestore';

const USERS_COLLECTION = 'v2_users';

export async function POST(req: Request) {
  try {
    const body = await parseBody(req);
    const userId = requireString(body.userId, 'userId');

    const quantityRaw = body.quantity;
    const quantity = typeof quantityRaw === 'number' ? quantityRaw : Number(quantityRaw);
    if (!Number.isInteger(quantity) || quantity <= 0) {
      return jsonError('quantity must be a positive integer', 400);
    }

    // 1. Mint tokens via Go API using the real mint endpoint (numeric IDs).
    const goApiUrl = getStagingApiUrl();
    const baseId = Date.now();
    const mintedTokens: number[] = [];
    for (let i = 0; i < quantity; i++) {
      const tokenId = baseId + i;
      const mintRes = await fetch(`${goApiUrl}/owner/${userId}/draftToken/mint`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ minId: tokenId, maxId: tokenId }),
      });
      if (!mintRes.ok) {
        const mintErr = await mintRes.text().catch(() => 'Unknown error');
        return jsonError(`Go API mint failed (token ${i + 1}/${quantity}): ${mintErr}`, 502);
      }
      mintedTokens.push(tokenId);
    }

    // 2. Increment draftPasses in Firestore so the count persists on reload
    if (isFirestoreConfigured()) {
      try {
        const db = getAdminFirestore();
        const userRef = db.collection(USERS_COLLECTION).doc(userId);
        await userRef.set(
          { draftPasses: FieldValue.increment(quantity) },
          { merge: true }
        );
      } catch (dbErr) {
        console.warn('staging-mint: Firestore draftPasses increment failed:', dbErr);
      }
    }

    return json({ success: true, minted: quantity, tokenIds: mintedTokens }, 200);
  } catch (err) {
    if (err instanceof ApiError) return jsonError(err.message, err.status);
    console.error('staging-mint error:', err);
    return jsonError('Internal Server Error', 500);
  }
}
