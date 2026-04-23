import { rateLimit, RATE_LIMITS } from '@/lib/rateLimit';
export const dynamic = 'force-dynamic';

import { ApiError } from '@/lib/api/errors';
import { json, jsonError, parseBody } from '@/lib/api/routeUtils';
import { requireAdmin } from '@/lib/adminAuth';
import { reconcilePassesForWallet } from '@/lib/onchain/reconcilePasses';
import { logAdminAction } from '@/lib/adminAudit';
import { logger } from '@/lib/logger';
import { getRequestId } from '@/lib/requestId';

const WALLET_REGEX = /^0x[0-9a-fA-F]{40}$/;

export async function POST(req: Request) {
  const requestId = getRequestId(req);
  const rateLimited = rateLimit(req, RATE_LIMITS.admin);
  if (rateLimited) return rateLimited;

  let actorWallet = '';
  try {
    const admin = await requireAdmin(req);
    actorWallet = admin.walletAddress ?? admin.userId;

    const body = await parseBody(req);
    const wallet = typeof body.wallet === 'string' ? body.wallet.trim() : '';
    if (!WALLET_REGEX.test(wallet)) throw new ApiError(400, 'Invalid wallet address');

    const result = await reconcilePassesForWallet(wallet);

    await logAdminAction({
      actor: actorWallet,
      action: 'reset-user',
      target: wallet,
      before: { draftPasses: result.beforeCounter },
      after: {
        draftPasses: result.afterCounter,
        onChainCount: result.onChainCount,
        registeredWithGoApi: result.registeredWithGoApi,
        removedFromGoApi: result.removedFromGoApi,
      },
      requestId,
    });

    logger.info('admin.reconcile_passes.ok', { requestId, actor: actorWallet, wallet, result });
    return json({ success: true, ...result, requestId });
  } catch (err) {
    logger.error('admin.reconcile_passes.failed', { requestId, actor: actorWallet, err });
    if (err instanceof ApiError) return jsonError(err.message, err.status, { requestId });
    return jsonError('Internal Server Error', 500, { requestId });
  }
}
