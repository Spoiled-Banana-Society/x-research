export const dynamic = "force-dynamic";
import { FieldValue } from 'firebase-admin/firestore';

import { ApiError } from '@/lib/api/errors';
import { json, jsonError, parseBody, requireString } from '@/lib/api/routeUtils';
import { getAdminFirestore, isFirestoreConfigured } from '@/lib/firebaseAdmin';
import { isAdminMintConfigured, reserveTokensToWallet } from '@/lib/onchain/adminMint';
import { reconcilePassesForWallet } from '@/lib/onchain/reconcilePasses';
import { addActivityEventToTx, buildActivityEventDoc, logActivityEvent } from '@/lib/activityEvents';
import { logger } from '@/lib/logger';

const USERS_COLLECTION = 'v2_users';
const WALLET_REGEX = /^0x[0-9a-fA-F]{40}$/;

/**
 * POST /api/purchases/staging-mint
 *
 * Quick-mint helper for staging testing. Mints a REAL BBB4 NFT on Base via
 * the `reserveTokens` onlyOwner path, then directly increments the user's
 * Firestore `draftPasses` counter. The SSE balance stream pushes the
 * Firestore change to the client, so the header ticks up within ~200ms.
 *
 * Why direct Firestore writethrough instead of relying on the reconciler /
 * Alchemy webhook: the staging Go API rejects new tokenId registrations,
 * and the staging Alchemy webhook isn't reliably configured. The previous
 * version of this endpoint awaited a reconcile and the user count never
 * updated. Firestore is the user-facing source of truth on staging.
 *
 * Gated to NEXT_PUBLIC_ENVIRONMENT === 'staging' so it can never unlock
 * free mints in prod.
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

    // 1. Real on-chain mint.
    const { txHash, tokenIds } = await reserveTokensToWallet({ to: userId, count: quantity });

    // 2. Atomic Firestore commit: the counter increment AND the activity
    //    event are written in ONE Firestore transaction. Either both land
    //    or neither does — the activity feed and the header counter can
    //    never disagree about whether a mint happened.
    //
    //    Two-stage strategy:
    //      (a) try the transactional path (counter floor + activity event).
    //      (b) on transaction failure, fall back to atomic increment +
    //          best-effort activity log so we never lose a successful mint.
    let newDraftPasses: number | null = null;
    if (isFirestoreConfigured()) {
      const db = getAdminFirestore();
      const userRef = db.collection(USERS_COLLECTION).doc(userId);

      // Pre-build the activity event doc OUTSIDE the transaction (Firestore
      // doesn't allow new reads after a write inside a transaction).
      const activityDoc = await buildActivityEventDoc({
        type: 'pass_purchased',
        userId,
        walletAddress: userId,
        paymentMethod: 'free',
        quantity,
        tokenIds,
        txHash,
        metadata: { source: 'staging_mint_button', mintedOnChain: true },
      });

      try {
        newDraftPasses = await db.runTransaction(async (tx) => {
          const snap = await tx.get(userRef);
          const current = (snap.exists ? (snap.data()?.draftPasses as number | undefined) : undefined) ?? 0;
          const next = Math.max(0, current) + quantity;
          tx.set(userRef, { draftPasses: next }, { merge: true });
          addActivityEventToTx(tx, activityDoc);
          return next;
        });
      } catch (txErr) {
        console.error('[staging-mint] firestore transaction failed, falling back:', txErr);
        try {
          await userRef.set({ draftPasses: FieldValue.increment(quantity) }, { merge: true });
          const after = await userRef.get();
          newDraftPasses = (after.data()?.draftPasses as number | undefined) ?? null;
          // Best-effort activity log on the fallback path.
          await logActivityEvent({
            type: 'pass_purchased',
            userId,
            walletAddress: userId,
            paymentMethod: 'free',
            quantity,
            tokenIds,
            txHash,
            metadata: { source: 'staging_mint_button', mintedOnChain: true, fallbackPath: true },
          });
        } catch (incErr) {
          console.error('[staging-mint] atomic increment fallback also failed:', incErr);
          logger.warn('staging-mint.firestore_increment_failed', {
            userId,
            err: (incErr as Error).message,
          });
        }
      }
    } else {
      // Firestore unavailable — log activity best-effort.
      await logActivityEvent({
        type: 'pass_purchased',
        userId,
        walletAddress: userId,
        paymentMethod: 'free',
        quantity,
        tokenIds,
        txHash,
        metadata: { source: 'staging_mint_button', mintedOnChain: true },
      });
    }

    // 3. Best-effort reconcile so the Go API ledger eventually catches up
    //    for any downstream consumer. Fire-and-forget — must not block the
    //    response or affect the user-visible count.
    void reconcilePassesForWallet(userId).catch((reconcileErr) => {
      logger.warn('staging-mint.reconcile_failed', { userId, err: (reconcileErr as Error).message });
    });

    return json({ success: true, minted: quantity, tokenIds, txHash, draftPasses: newDraftPasses }, 200);
  } catch (err) {
    if (err instanceof ApiError) return jsonError(err.message, err.status);
    console.error('staging-mint error:', err);
    return jsonError((err as Error).message || 'Internal Server Error', 500);
  }
}
