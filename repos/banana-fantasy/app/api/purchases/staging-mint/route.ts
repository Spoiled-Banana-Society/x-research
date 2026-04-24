export const dynamic = "force-dynamic";
import { ApiError } from '@/lib/api/errors';
import { json, jsonError, parseBody, requireString } from '@/lib/api/routeUtils';
import { isAdminMintConfigured, reserveTokensToWallet } from '@/lib/onchain/adminMint';
import { reconcilePassesForWallet } from '@/lib/onchain/reconcilePasses';
import { logActivityEvent } from '@/lib/activityEvents';
import { logger } from '@/lib/logger';

const WALLET_REGEX = /^0x[0-9a-fA-F]{40}$/;

/**
 * POST /api/purchases/staging-mint
 *
 * Quick-mint helper for staging testing. Produces REAL BBB4 NFTs on Base
 * via the `reserveTokens` onlyOwner admin-mint path — same contract call
 * as admin grants — so the resulting passes are indistinguishable from
 * the user-paid mint flow as far as on-chain state, Alchemy webhooks,
 * the live balance endpoint, and activity stream are concerned.
 *
 * No card / USDC approve / payment UX — that's the only difference from
 * the production path. Gated to `NEXT_PUBLIC_ENVIRONMENT === 'staging'`
 * so it can never unlock free mints in prod.
 */
export async function POST(req: Request) {
  if (process.env.NEXT_PUBLIC_ENVIRONMENT !== 'staging') {
    return jsonError('Not available in this environment', 403);
  }
  if (!isAdminMintConfigured()) {
    return jsonError('Admin mint not configured (BBB4_OWNER_PRIVATE_KEY missing)', 503);
  }
  try {
    const body = await parseBody(req);
    const userId = requireString(body.userId, 'userId').toLowerCase();
    if (!WALLET_REGEX.test(userId)) {
      return jsonError('userId must be a wallet address', 400);
    }

    const quantityRaw = body.quantity;
    const quantity = typeof quantityRaw === 'number' ? quantityRaw : Number(quantityRaw);
    if (!Number.isInteger(quantity) || quantity <= 0) {
      return jsonError('quantity must be a positive integer', 400);
    }
    if (quantity > 20) {
      return jsonError('staging mint capped at 20 per call', 400);
    }

    // Real on-chain mint.
    const { txHash, tokenIds } = await reserveTokensToWallet({ to: userId, count: quantity });

    // Synchronous reconcile so Firestore + Go API match on-chain before we
    // respond. The Alchemy webhook is best-effort (and isn't reliably
    // configured for staging), so we cannot count on it firing — this
    // guarantees the next /api/owner/balance read returns the new count.
    try {
      await reconcilePassesForWallet(userId);
    } catch (reconcileErr) {
      logger.warn('staging-mint.reconcile_failed', { userId, err: (reconcileErr as Error).message });
    }

    // Record as an activity event so the live feed and user profile
    // history pick up staging mints too. Tagged paymentMethod='free' so
    // they're filterable separately from paid purchases.
    await logActivityEvent({
      type: 'pass_purchased',
      userId,
      walletAddress: userId,
      paymentMethod: 'free',
      quantity,
      tokenIds,
      txHash,
      metadata: {
        source: 'staging_mint_button',
        mintedOnChain: true,
      },
    });

    return json({ success: true, minted: quantity, tokenIds, txHash }, 200);
  } catch (err) {
    if (err instanceof ApiError) return jsonError(err.message, err.status);
    console.error('staging-mint error:', err);
    return jsonError((err as Error).message || 'Internal Server Error', 500);
  }
}
