import { rateLimit, RATE_LIMITS } from "@/lib/rateLimit";
export const dynamic = 'force-dynamic';

import { createPublicClient, http, type Address } from 'viem';
import { FieldValue } from 'firebase-admin/firestore';

import { ApiError } from '@/lib/api/errors';
import { json, jsonError } from '@/lib/api/routeUtils';
import { getAdminFirestore, isFirestoreConfigured } from '@/lib/firebaseAdmin';
import { BASE, BASE_RPC_URL, BBB4_ABI, BBB4_CONTRACT_ADDRESS } from '@/lib/contracts/bbb4';
import { logger } from '@/lib/logger';
import { reconcilePassesForWallet } from '@/lib/onchain/reconcilePasses';

const USERS_COLLECTION = 'v2_users';
const WALLET_REGEX = /^0x[0-9a-fA-F]{40}$/;

const onchainClient = createPublicClient({ chain: BASE, transport: http(BASE_RPC_URL) });

/**
 * GET /api/owner/balance?userId=<wallet>
 *
 * Returns `wheelSpins`, `freeDrafts`, `jackpotEntries`, `hofEntries`,
 * `draftPasses`, `cardPurchaseCount` for a user. Firestore is the
 * user-facing source of truth — every endpoint that mints, grants, or
 * spends passes writes through to `v2_users/{userId}.draftPasses` so the
 * SSE stream can push the change.
 *
 * On-chain BBB4.balanceOf is read as a drift detector: if it's strictly
 * higher than the cached Firestore count (e.g. an Alchemy webhook missed
 * a recent mint), we writethrough up + fire a background reconcile. We
 * never ratchet *down* from a single on-chain read because BBB4 doesn't
 * burn on use, so balanceOf can be inflated by used tokens.
 */
export async function GET(req: Request) {
  const rateLimited = rateLimit(req, RATE_LIMITS.general);
  if (rateLimited) return rateLimited;

  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    if (!userId) return jsonError('Missing userId', 400);

    if (!isFirestoreConfigured()) {
      return json({ wheelSpins: 0, freeDrafts: 0, jackpotEntries: 0, hofEntries: 0, draftPasses: 0, cardPurchaseCount: 0 });
    }

    const db = getAdminFirestore();
    const snap = await db.collection(USERS_COLLECTION).doc(userId).get();
    const data = snap.exists ? (snap.data() ?? {}) : {};

    const cached = {
      wheelSpins: (data.wheelSpins as number | undefined) ?? 0,
      freeDrafts: (data.freeDrafts as number | undefined) ?? 0,
      jackpotEntries: (data.jackpotEntries as number | undefined) ?? 0,
      hofEntries: (data.hofEntries as number | undefined) ?? 0,
      draftPasses: (data.draftPasses as number | undefined) ?? 0,
      cardPurchaseCount: (data.cardPurchaseCount as number | undefined) ?? 0,
    };

    let draftPasses = cached.draftPasses;
    if (WALLET_REGEX.test(userId)) {
      try {
        const onchain = await onchainClient.readContract({
          address: BBB4_CONTRACT_ADDRESS,
          abi: BBB4_ABI,
          functionName: 'balanceOf',
          args: [userId as Address],
        });
        const onchainN = Number(onchain);
        // Drift writethrough: only ratchet up. A higher on-chain count
        // means a webhook missed a recent mint; we self-heal so the next
        // read is correct. We never ratchet down because balanceOf
        // includes used NFTs (BBB4 doesn't burn on use).
        if (onchainN > cached.draftPasses) {
          draftPasses = onchainN;
          logger.info('balance.drift_detected', {
            userId,
            cached: cached.draftPasses,
            onchain: onchainN,
          });
          try {
            await db.collection(USERS_COLLECTION).doc(userId).set(
              { draftPasses: onchainN, onchainSyncedAt: FieldValue.serverTimestamp() },
              { merge: true },
            );
          } catch (writeErr) {
            logger.warn('balance.writethrough_failed', { userId, err: (writeErr as Error).message });
          }
          void reconcilePassesForWallet(userId).catch((err) => {
            logger.warn('balance.reconcile_bg_failed', { userId, err: (err as Error).message });
          });
        }
      } catch (err) {
        logger.warn('balance.onchain_read_failed_using_cache', {
          userId,
          err: (err as Error).message,
        });
      }
    }

    return json({ ...cached, draftPasses });
  } catch (err) {
    if (err instanceof ApiError) return jsonError(err.message, err.status);
    console.error('[owner/balance] GET failed:', err);
    return jsonError('Internal Server Error', 500);
  }
}
