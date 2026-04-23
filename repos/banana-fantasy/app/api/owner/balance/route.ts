import { rateLimit, RATE_LIMITS } from "@/lib/rateLimit";
export const dynamic = 'force-dynamic';

import { createPublicClient, http, type Address } from 'viem';

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
 * `draftPasses`, `cardPurchaseCount` for a user. Uses Firestore as a fast
 * cache, but reads BBB4.balanceOf on-chain via Alchemy as a drift detector —
 * if the Firestore counter is behind on-chain (e.g. a verify step failed
 * silently), we surface the drift in logs + self-heal the cached counter.
 * On-chain is always the source of truth for ownership.
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

    // On-chain drift detection + self-heal for draftPasses. Only runs for
    // real wallet userIds (Privy DIDs get skipped) and only upward — if
    // on-chain shows MORE NFTs than the counter, heal up. We never heal
    // downward from this endpoint because "counter > on-chain" could mean
    // the user transferred out, which needs admin attention, not silent loss.
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
        if (onchainN !== cached.draftPasses) {
          logger.info('balance.drift_detected', {
            userId,
            cached: cached.draftPasses,
            onchain: onchainN,
          });
          // Fire-and-forget full reconciliation — aligns Firestore + Go API
          // to on-chain ownership. Doesn't block the current response.
          // Next balance fetch picks up the reconciled value.
          void reconcilePassesForWallet(userId).catch((err) => {
            logger.warn('balance.reconcile_bg_failed', { userId, err: (err as Error).message });
          });
          // Return on-chain count immediately for a truthful first paint when
          // on-chain is HIGHER (newly minted, cache hasn't caught up). For
          // downward drift (transfer out), keep cached value — the reconciler
          // will bring it down on the next read once Go API sync completes.
          if (onchainN > cached.draftPasses) {
            draftPasses = onchainN;
          }
        }
      } catch (err) {
        logger.warn('balance.onchain_read_failed', { userId, err: (err as Error).message });
      }
    }

    return json({ ...cached, draftPasses });
  } catch (err) {
    if (err instanceof ApiError) return jsonError(err.message, err.status);
    console.error('[owner/balance] GET failed:', err);
    return jsonError('Internal Server Error', 500);
  }
}
