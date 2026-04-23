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

    // On-chain is the source of truth for draftPasses. We always read
    // BBB4.balanceOf via Alchemy and return that — Firestore is a backup
    // only for when Alchemy is briefly unreachable. This guarantees the
    // user-facing count matches what's actually in their wallet, with no
    // stale-cache drift in either direction.
    //
    // Background reconciliation still aligns the Go API's per-token ledger
    // and the Firestore cache so downstream reads stay consistent.
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
        draftPasses = onchainN;
        if (onchainN !== cached.draftPasses) {
          logger.info('balance.drift_detected', {
            userId,
            cached: cached.draftPasses,
            onchain: onchainN,
          });
          // Write on-chain count through to Firestore so admin panel + other
          // Firestore-direct readers see the correct value without having
          // to wait for the background reconcile.
          try {
            await db.collection(USERS_COLLECTION).doc(userId).set(
              { draftPasses: onchainN, onchainSyncedAt: FieldValue.serverTimestamp() },
              { merge: true },
            );
          } catch (writeErr) {
            logger.warn('balance.writethrough_failed', { userId, err: (writeErr as Error).message });
          }
          // Fire-and-forget full reconciliation — aligns Go API + Firestore.
          // Doesn't block the current response.
          void reconcilePassesForWallet(userId).catch((err) => {
            logger.warn('balance.reconcile_bg_failed', { userId, err: (err as Error).message });
          });
        }
      } catch (err) {
        // Alchemy read failed — fall back to the Firestore cache value.
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
