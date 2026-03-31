export const dynamic = "force-dynamic";
import { ApiError } from '@/lib/api/errors';
import { json, jsonError, parseBody, requireString } from '@/lib/api/routeUtils';
import { isFirestoreConfigured } from '@/lib/firebaseAdmin';
import { getStagingApiUrl } from '@/lib/staging';

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
    //    The /staging/mint-tokens/ endpoint creates string-based IDs that crash
    //    the /draftToken/all endpoint (strconv.Atoi fails), so we use the real
    //    /owner/{wallet}/draftToken/mint endpoint with high numeric IDs instead.
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

    // 2. Optionally create purchase record if Firestore is available
    if (isFirestoreConfigured()) {
      try {
        const { createPurchase, verifyPurchase } = await import('@/lib/db');
        const { purchase } = await createPurchase(userId, quantity, 'usdc');
        const txHash = `staging-${Date.now()}`;
        await verifyPurchase(purchase.id, txHash);
      } catch (dbErr) {
        // Firestore record is optional for staging mint — Go API mint is what matters
        console.warn('staging-mint: Firestore record failed (non-fatal):', dbErr);
      }
    }

    return json({ success: true, minted: quantity, tokenIds: mintedTokens }, 200);
  } catch (err) {
    if (err instanceof ApiError) return jsonError(err.message, err.status);
    console.error('staging-mint error:', err);
    return jsonError('Internal Server Error', 500);
  }
}
