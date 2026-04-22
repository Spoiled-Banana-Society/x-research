import { rateLimit, RATE_LIMITS } from '@/lib/rateLimit';
export const dynamic = 'force-dynamic';

import { FieldValue } from 'firebase-admin/firestore';
import { ApiError } from '@/lib/api/errors';
import { json, jsonError, parseBody } from '@/lib/api/routeUtils';
import { requireAdmin } from '@/lib/adminAuth';
import { getAdminFirestore, isFirestoreConfigured } from '@/lib/firebaseAdmin';
import { logger } from '@/lib/logger';
import { getRequestId } from '@/lib/requestId';
import { logAdminAction } from '@/lib/adminAudit';
import { isAdminMintConfigured, reserveTokensToWallet } from '@/lib/onchain/adminMint';
import { recordPassOrigins } from '@/lib/onchain/passOrigin';

const USERS_COLLECTION = 'v2_users';

function normalizeWallet(raw: string): string {
  return raw.trim().toLowerCase();
}

export async function POST(req: Request) {
  const requestId = getRequestId(req);
  const start = Date.now();
  const rateLimited = rateLimit(req, RATE_LIMITS.admin);
  if (rateLimited) return rateLimited;

  let actorWallet = '';
  try {
    const admin = await requireAdmin(req);
    actorWallet = admin.walletAddress ?? admin.userId;

    if (!isFirestoreConfigured()) throw new ApiError(503, 'Firestore not configured');

    const body = await parseBody(req);
    const rawIdentifier = typeof body.identifier === 'string' ? body.identifier.trim() : '';
    const count = Number(body.count);

    if (!rawIdentifier) throw new ApiError(400, 'Missing identifier (wallet or username)');
    if (!Number.isFinite(count) || !Number.isInteger(count) || count === 0) {
      throw new ApiError(400, 'count must be a non-zero integer');
    }
    if (Math.abs(count) > 1000) throw new ApiError(400, 'count out of range (max 1000)');

    logger.info('admin.grant_drafts.request', { requestId, actor: actorWallet, identifier: rawIdentifier, count });

    const db = getAdminFirestore();
    let userDocId: string | null = null;
    let resolvedWallet: string | null = null;
    let resolvedUsername: string | null = null;
    let beforeFreeDrafts = 0;

    if (/^0x[0-9a-fA-F]{40}$/.test(rawIdentifier)) {
      const wallet = normalizeWallet(rawIdentifier);
      const direct = await db.collection(USERS_COLLECTION).doc(wallet).get();
      if (direct.exists) {
        userDocId = wallet;
        const data = direct.data();
        resolvedWallet = (data?.walletAddress as string) ?? wallet;
        resolvedUsername = (data?.username as string) ?? null;
        beforeFreeDrafts = (data?.freeDrafts as number | undefined) ?? 0;
      } else {
        const snap = await db.collection(USERS_COLLECTION).where('walletAddress', '==', wallet).limit(1).get();
        if (!snap.empty) {
          userDocId = snap.docs[0].id;
          const data = snap.docs[0].data();
          resolvedWallet = (data.walletAddress as string) ?? wallet;
          resolvedUsername = (data.username as string) ?? null;
          beforeFreeDrafts = (data.freeDrafts as number | undefined) ?? 0;
        }
      }
    }

    if (!userDocId) {
      const snap = await db.collection(USERS_COLLECTION).where('username', '==', rawIdentifier).limit(1).get();
      if (!snap.empty) {
        userDocId = snap.docs[0].id;
        const data = snap.docs[0].data();
        resolvedWallet = (data.walletAddress as string) ?? null;
        resolvedUsername = (data.username as string) ?? null;
        beforeFreeDrafts = (data.freeDrafts as number | undefined) ?? 0;
      }
    }

    if (!userDocId) throw new ApiError(404, `User not found for "${rawIdentifier}"`);

    const userRef = db.collection(USERS_COLLECTION).doc(userDocId);

    // When the on-chain admin mint is wired up, grants produce real BBB4 NFTs.
    // Until Richard hands off ownership, fall back to the legacy Firestore
    // counter so staging keeps working.
    const mintOnChain = isAdminMintConfigured() && count > 0;
    let txHash: string | undefined;
    let mintedTokenIds: string[] = [];

    if (mintOnChain) {
      if (!resolvedWallet) {
        throw new ApiError(422, 'User has no wallet on file — cannot mint NFT grant');
      }
      const res = await reserveTokensToWallet({ to: resolvedWallet, count });
      txHash = res.txHash;
      mintedTokenIds = res.tokenIds;
      await recordPassOrigins({
        tokenIds: mintedTokenIds,
        origin: 'admin_grant',
        ownerAtMint: resolvedWallet,
        txHash,
        reason: `admin_grant:${actorWallet}`,
      });
    } else {
      await userRef.set({ freeDrafts: FieldValue.increment(count) }, { merge: true });
    }

    const fresh = await userRef.get();
    const newFreeDrafts = (fresh.data()?.freeDrafts as number | undefined) ?? 0;

    await logAdminAction({
      actor: actorWallet,
      action: 'grant-drafts',
      target: userDocId,
      before: { freeDrafts: beforeFreeDrafts },
      after: {
        freeDrafts: newFreeDrafts,
        granted: count,
        ...(txHash ? { txHash, tokenIds: mintedTokenIds } : {}),
      },
      requestId,
    });

    const notifyWallet = (resolvedWallet ?? userDocId).toLowerCase();
    if (notifyWallet) {
      try {
        const title = count > 0 ? 'Free Drafts Granted!' : 'Drafts Adjusted';
        const message = mintOnChain
          ? `We just minted ${count} free draft pass NFT${count !== 1 ? 's' : ''} to your wallet.`
          : count > 0
            ? `You received ${count} free draft${count !== 1 ? 's' : ''}. You now have ${newFreeDrafts} total.`
            : `An admin adjusted your free drafts by ${count}. You now have ${newFreeDrafts} total.`;
        await db.collection('marketplace_notifications').add({
          wallet: notifyWallet,
          type: 'promo',
          title,
          message,
          link: '/drafting',
          read: false,
          createdAt: FieldValue.serverTimestamp(),
        });
      } catch (notifyErr) {
        logger.warn('admin.grant_drafts.notify_failed', { requestId, err: notifyErr });
      }
    }

    logger.info('admin.grant_drafts.ok', {
      requestId,
      actor: actorWallet,
      target: userDocId,
      before: beforeFreeDrafts,
      after: newFreeDrafts,
      granted: count,
      mintOnChain,
      txHash,
      tokenIds: mintedTokenIds,
      durationMs: Date.now() - start,
    });

    return json({
      success: true,
      userId: userDocId,
      walletAddress: resolvedWallet,
      username: resolvedUsername,
      granted: count,
      freeDrafts: newFreeDrafts,
      mintOnChain,
      txHash,
      tokenIds: mintedTokenIds,
      requestId,
    });
  } catch (err) {
    logger.error('admin.grant_drafts.failed', {
      requestId,
      actor: actorWallet,
      err,
      durationMs: Date.now() - start,
    });
    if (err instanceof ApiError) return jsonError(err.message, err.status, { requestId });
    return jsonError('Internal Server Error', 500, { requestId });
  }
}
