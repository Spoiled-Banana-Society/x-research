import { rateLimit, RATE_LIMITS } from '@/lib/rateLimit';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { json, jsonError } from '@/lib/api/routeUtils';
import { getAdminFirestore, isFirestoreConfigured } from '@/lib/firebaseAdmin';
import { logger } from '@/lib/logger';

/**
 * GET /api/batches/{batchNumber}/proof
 *
 * Returns the on-chain proof for a given batch. Reads `batch_proofs/{N}`
 * which the Go API writes at batch boundaries.
 *
 * Two variants share this endpoint:
 *   - "commit-reveal" (legacy BBB4BatchProof): status flows
 *     "" → "committed" → "revealed". Positions exposed at "revealed".
 *   - "vrf" (BBB4BatchProofVRF, Chainlink VRF v2.5): status flows
 *     "" → "requested" → "fulfilled". Positions exposed at "fulfilled".
 *
 * Pre-launch batches (no Firestore doc) return status='pre-launch' and the
 * frontend renders the rolling-out disclaimer.
 */

type ProofStatus =
  | 'pending'
  | 'committed'
  | 'revealed'
  | 'requested'
  | 'fulfilled'
  | 'pre-launch';

type ProofVariant = 'commit-reveal' | 'vrf' | 'vrf-commit';

interface BatchProofDoc {
  batchNumber: number;
  status: ProofStatus;
  variant?: ProofVariant;

  // Legacy commit-reveal
  seedHash?: string;
  commitTxHash?: string;
  commitBlock?: number;
  committedAt?: number;
  serverSeed?: string;
  publishTxHash?: string;
  publishBlock?: number;
  revealTxHash?: string;
  revealBlock?: number;
  revealedAt?: number;

  // VRF v2.5
  vrfRequestId?: string;
  vrfRequestTxHash?: string;
  vrfRequestBlock?: number;
  vrfRequestedAt?: number;
  vrfRandomness?: string;
  vrfFulfilledAt?: number;
  vrfCoordinator?: string;

  // VRF + commit hybrid
  saltHash?: string;
  serverSalt?: string;       // gated until revealed
  commitTxHashVrf?: string;  // tx that submitted requestRandomnessAndCommit
  revealSaltTxHash?: string;

  // Common (gated)
  jackpotPositions?: number[];
  hofPositions?: number[];
  preLaunchNote?: string;
}

export async function GET(req: Request, ctx: { params: { batchNumber: string } }) {
  const rateLimited = rateLimit(req, RATE_LIMITS.general);
  if (rateLimited) return rateLimited;

  try {
    const batchNumber = Number(ctx.params.batchNumber);
    if (!Number.isInteger(batchNumber) || batchNumber < 1) {
      return jsonError('Invalid batch number', 400);
    }

    if (!isFirestoreConfigured()) {
      return json(prelaunch(batchNumber, 'Firestore not configured in this environment.'));
    }

    const db = getAdminFirestore();
    const snap = await db.collection('batch_proofs').doc(String(batchNumber)).get();
    if (!snap.exists) {
      return json(prelaunch(batchNumber));
    }

    const data = snap.data() as BatchProofDoc | undefined;
    if (!data) return json(prelaunch(batchNumber));

    // Positions are gated until the seed/randomness is publicly verifiable
    // on-chain. Before that, exposing them via the API would let users time
    // their draft entries to land in the slots known to be Jackpot/HOF —
    // defeating the surprise and giving an unfair edge to anyone who scrapes
    // this endpoint.
    //   - commit-reveal: gated on status==='revealed' (server seed published).
    //   - vrf:           gated on status==='fulfilled' (coordinator delivered randomness).
    //                    Note: with vrf-only, randomness lands at batch start so
    //                    positions become public ~30s after batch starts. Users
    //                    can still scrape on-chain regardless of API gating.
    //   - vrf-commit:    gated on status==='revealed' (salt revealed at batch end).
    //                    The hybrid hides positions through the entire batch
    //                    because half the entropy (salt) is sealed off-chain
    //                    until reveal — the API gating actually matches the
    //                    on-chain reality.
    const variant: ProofVariant =
      data.variant === 'vrf' ? 'vrf'
      : data.variant === 'vrf-commit' ? 'vrf-commit'
      : 'commit-reveal';
    const isPubliclyVerifiable =
      variant === 'vrf'
        ? data.status === 'fulfilled'
        : data.status === 'revealed';

    return json({
      batchNumber,
      status: data.status,
      variant,

      // Legacy commit-reveal fields
      seedHash: data.seedHash,
      commitTxHash: data.commitTxHash,
      commitBlock: data.commitBlock,
      committedAt: data.committedAt,
      serverSeed: variant === 'commit-reveal' && isPubliclyVerifiable ? data.serverSeed : undefined,
      publishTxHash: data.publishTxHash,
      publishBlock: data.publishBlock,
      revealTxHash: data.revealTxHash,
      revealBlock: data.revealBlock,
      revealedAt: data.revealedAt,

      // VRF fields (always public — they're on-chain regardless)
      vrfRequestId: data.vrfRequestId,
      vrfRequestTxHash: data.vrfRequestTxHash,
      vrfRequestBlock: data.vrfRequestBlock,
      vrfRequestedAt: data.vrfRequestedAt,
      vrfRandomness:
        // vrf-only: gate on fulfillment. vrf-commit: only meaningful once
        // combined with the salt, but the randomness itself is on-chain
        // anyway so we expose it as soon as we have it.
        (variant === 'vrf' || variant === 'vrf-commit') && data.vrfFulfilledAt
          ? data.vrfRandomness
          : undefined,
      vrfFulfilledAt: data.vrfFulfilledAt,
      vrfCoordinator: data.vrfCoordinator,

      // VRF+commit fields. SaltHash is public from request time;
      // serverSalt is gated until reveal.
      saltHash: variant === 'vrf-commit' ? data.saltHash : undefined,
      commitTxHashVrf: variant === 'vrf-commit' ? data.commitTxHashVrf : undefined,
      serverSalt: variant === 'vrf-commit' && isPubliclyVerifiable ? data.serverSalt : undefined,
      revealSaltTxHash: variant === 'vrf-commit' ? data.revealSaltTxHash : undefined,

      // Common (gated)
      jackpotPositions: isPubliclyVerifiable ? data.jackpotPositions : undefined,
      hofPositions: isPubliclyVerifiable ? data.hofPositions : undefined,
      preLaunchNote: data.preLaunchNote,
    });
  } catch (err) {
    logger.error('batches.proof.failed', { err });
    return jsonError('Internal Server Error', 500);
  }
}

function prelaunch(batchNumber: number, note?: string) {
  return {
    batchNumber,
    status: 'pre-launch' as const,
    preLaunchNote:
      note ??
      'Batch fills predate the on-chain commit/reveal rollout. Distribution constraint (94/5/1 per 100) was enforced in code.',
  };
}
