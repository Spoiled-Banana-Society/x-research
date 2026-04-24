import { rateLimit, RATE_LIMITS } from "@/lib/rateLimit";
export const dynamic = 'force-dynamic';

import { createPublicClient, http, type Address } from 'viem';
import { FieldValue } from 'firebase-admin/firestore';

import { ApiError } from '@/lib/api/errors';
import { json, jsonError } from '@/lib/api/routeUtils';
import { getAdminFirestore, isFirestoreConfigured } from '@/lib/firebaseAdmin';
import { BASE, BASE_RPC_URL, BBB4_ABI, BBB4_CONTRACT_ADDRESS } from '@/lib/contracts/bbb4';
import { logger } from '@/lib/logger';
import { fetchGoApiAvailableCount, reconcilePassesForWallet } from '@/lib/onchain/reconcilePasses';

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

    // The Go API's "available" token count is the source of truth for
    // draftPasses — it's what the rest of the frontend already uses
    // (getOwnerUser → getOwnerDraftTokens). On-chain BBB4.balanceOf counts
    // *all* NFTs (used + unused, since the contract doesn't burn on use)
    // and staging mints don't touch the contract at all, so neither cached
    // Firestore nor on-chain is reliable for "passes the user can spend
    // right now." The Go API is the single ledger that tracks both.
    //
    // Drift writethrough: if Firestore disagrees with the Go API count we
    // correct it both ways. The old code only ratcheted up; that left
    // staging mints (which only touch the Go API) showing stale-high
    // counts because Firestore was never decremented.
    //
    // Fallback: if the Go API is unreachable, fall back to the cached
    // Firestore value plus on-chain max — old behavior — so a transient
    // outage doesn't zero a real user's pass count.
    let draftPasses = cached.draftPasses;
    if (WALLET_REGEX.test(userId)) {
      const goApiCount = await fetchGoApiAvailableCount(userId);
      if (goApiCount != null) {
        draftPasses = goApiCount;

        if (goApiCount !== cached.draftPasses) {
          logger.info('balance.drift_detected', {
            userId,
            cached: cached.draftPasses,
            goApi: goApiCount,
          });
          try {
            await db.collection(USERS_COLLECTION).doc(userId).set(
              { draftPasses: goApiCount, onchainSyncedAt: FieldValue.serverTimestamp() },
              { merge: true },
            );
          } catch (writeErr) {
            logger.warn('balance.writethrough_failed', { userId, err: (writeErr as Error).message });
          }
          // Background reconciliation aligns on-chain → Go API → Firestore.
          // Only run if Go API count is higher than on-chain might suggest a
          // recent mint that Alchemy webhook missed; otherwise it's noise.
          void reconcilePassesForWallet(userId).catch((err) => {
            logger.warn('balance.reconcile_bg_failed', { userId, err: (err as Error).message });
          });
        }
      } else {
        // Go API unreachable — fall back to on-chain + cache like before.
        try {
          const onchain = await onchainClient.readContract({
            address: BBB4_CONTRACT_ADDRESS,
            abi: BBB4_ABI,
            functionName: 'balanceOf',
            args: [userId as Address],
          });
          const onchainN = Number(onchain);
          draftPasses = Math.max(onchainN, cached.draftPasses);
        } catch (err) {
          logger.warn('balance.onchain_fallback_failed_using_cache', {
            userId,
            err: (err as Error).message,
          });
        }
      }
    }

    return json({ ...cached, draftPasses });
  } catch (err) {
    if (err instanceof ApiError) return jsonError(err.message, err.status);
    console.error('[owner/balance] GET failed:', err);
    return jsonError('Internal Server Error', 500);
  }
}
