import { rateLimit, RATE_LIMITS } from "@/lib/rateLimit";
export const dynamic = "force-dynamic";
import { ApiError } from '@/lib/api/errors';
import { json, jsonError, parseBody, requireString } from '@/lib/api/routeUtils';
import { createPurchase } from '@/lib/db';

export async function POST(req: Request) {
  const rateLimited = rateLimit(req, RATE_LIMITS.purchases);
  if (rateLimited) return rateLimited;
  try {
    const body = await parseBody(req);
    const userId = requireString(body.userId, 'userId');

    const quantityRaw = body.quantity;
    const quantity = typeof quantityRaw === 'number' ? quantityRaw : Number(quantityRaw);
    if (!Number.isInteger(quantity) || quantity <= 0) {
      return jsonError('quantity must be a positive integer', 400);
    }

    const paymentMethod = body.paymentMethod === 'card' ? 'card' : 'usdc';

    if (paymentMethod === 'card') {
      const cardToken = typeof body.cardToken === 'string' ? body.cardToken.trim() : '';
      if (!cardToken) {
        return jsonError('Payment required', 400);
      }
      // Require card tokens from the checkout flow (prefixed with test_)
      // This prevents direct API calls from auto-succeeding without going through payment
      if (!cardToken.startsWith('test_')) {
        return jsonError('Invalid payment token. Please complete checkout.', 402);
      }
    }

    // USDC payments must provide a transaction hash for on-chain verification
    if (paymentMethod === 'usdc') {
      const txHash = typeof body.txHash === 'string' ? body.txHash.trim() : '';
      if (!txHash) {
        return jsonError('Transaction hash required for USDC payments', 400);
      }
    }

    const result = await createPurchase(userId, quantity, paymentMethod);
    return json(result, 201);
  } catch (err) {
    if (err instanceof ApiError) return jsonError(err.message, err.status);
    console.error(err);
    return jsonError('Internal Server Error', 500);
  }
}
