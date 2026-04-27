import { rateLimit, RATE_LIMITS } from '@/lib/rateLimit';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { json, jsonError } from '@/lib/api/routeUtils';
import { getAdminFirestore, isFirestoreConfigured } from '@/lib/firebaseAdmin';
import { logger } from '@/lib/logger';

/**
 * GET /api/batches/{batchNumber}/proof
 *
 * Returns the on-chain commit/reveal proof for a given batch. Reads from
 * Firestore collection `batch_proofs/{batchNumber}` which is written by the
 * Go API at batch boundaries (see contracts/BBB4BatchProof.sol + the Go
 * batchproof package — both pending deploy as of this commit).
 *
 * Until the contract + Go integration ship, every batch returns
 * `{ status: 'pre-launch', ... }`. The frontend handles that state
 * gracefully (shows the distribution-rule explanation + a "rolling out"
 * disclaimer).
 */

interface BatchProofDoc {
  batchNumber: number;
  status: 'pending' | 'committed' | 'revealed' | 'pre-launch';
  seedHash?: string;
  commitTxHash?: string;
  commitBlock?: number;
  committedAt?: number;
  serverSeed?: string;
  revealTxHash?: string;
  revealedAt?: number;
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

    return json({
      batchNumber,
      status: data.status,
      seedHash: data.seedHash,
      commitTxHash: data.commitTxHash,
      commitBlock: data.commitBlock,
      committedAt: data.committedAt,
      serverSeed: data.status === 'revealed' ? data.serverSeed : undefined,
      revealTxHash: data.revealTxHash,
      revealedAt: data.revealedAt,
      jackpotPositions: data.jackpotPositions,
      hofPositions: data.hofPositions,
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
    preLaunchNote: note ?? 'Batch fills predate the on-chain commit/reveal rollout. Distribution constraint (94/5/1 per 100) was enforced in code.',
  };
}
