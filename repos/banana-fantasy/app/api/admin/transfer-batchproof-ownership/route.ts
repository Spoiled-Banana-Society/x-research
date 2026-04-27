import { rateLimit, RATE_LIMITS } from '@/lib/rateLimit';
export const dynamic = 'force-dynamic';

import {
  createPublicClient,
  createWalletClient,
  http,
  parseGwei,
  encodeFunctionData,
  isAddress,
  type Address,
  type Hex,
} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';

import { ApiError } from '@/lib/api/errors';
import { json, jsonError, parseBody } from '@/lib/api/routeUtils';
import { requireAdmin } from '@/lib/adminAuth';
import { logAdminAction } from '@/lib/adminAudit';
import { BASE, BASE_RPC_URL } from '@/lib/contracts/bbb4';
import { BBB4_BATCH_PROOF_ABI } from '@/lib/contracts/bbb4BatchProofArtifact';
import { getAdminFirestore, isFirestoreConfigured } from '@/lib/firebaseAdmin';
import { logger } from '@/lib/logger';
import { getRequestId } from '@/lib/requestId';

const SYSTEM_CONFIG = 'system_config';
const BATCH_PROOF_DOC = 'batchProof';

const BASE_GAS_PARAMS = {
  maxFeePerGas: parseGwei('0.1'),
  maxPriorityFeePerGas: parseGwei('0.001'),
};

function loadOldOwnerKey(): Hex | null {
  const raw = process.env.BBB4_OWNER_PRIVATE_KEY?.trim();
  if (!raw) return null;
  const hex = raw.startsWith('0x') ? raw : `0x${raw}`;
  if (!/^0x[0-9a-fA-F]{64}$/.test(hex)) return null;
  return hex as Hex;
}

/**
 * POST /api/admin/transfer-batchproof-ownership { newOwner: '0x...' }
 *
 * One-off admin endpoint. Calls BBB4BatchProof.transferOwnership(newOwner)
 * using BBB4_OWNER_PRIVATE_KEY (the existing admin signer that currently
 * owns the contract). After this commits, the new address controls
 * commit/publishSlots/reveal and the original admin wallet has no power
 * over the proof contract.
 *
 * The BBB4 NFT contract is unaffected — its ownership stays with the
 * original admin wallet. This is the whole point: separation of concerns
 * between minting and proof signing.
 *
 * Idempotent in the simplest sense: if the contract's owner already
 * matches `newOwner`, returns 200 with `{ alreadyTransferred: true }`.
 */
export async function POST(req: Request) {
  const requestId = getRequestId(req);
  const rateLimited = rateLimit(req, RATE_LIMITS.admin);
  if (rateLimited) return rateLimited;

  let actorWallet = '';
  try {
    const admin = await requireAdmin(req);
    actorWallet = admin.walletAddress ?? admin.userId;

    const body = await parseBody(req);
    const newOwnerRaw = typeof body.newOwner === 'string' ? body.newOwner.trim() : '';
    if (!isAddress(newOwnerRaw)) {
      throw new ApiError(400, `Invalid newOwner address: ${newOwnerRaw}`);
    }
    const newOwner = newOwnerRaw as Address;

    const key = loadOldOwnerKey();
    if (!key) return jsonError('BBB4_OWNER_PRIVATE_KEY not configured', 503);

    // Look up the deployed contract address from Firestore (set by the
    // deploy-batch-proof endpoint). Fall back to env var if Firestore is
    // unavailable for some reason.
    let contractAddress: Address | null = null;
    if (isFirestoreConfigured()) {
      const db = getAdminFirestore();
      const snap = await db.collection(SYSTEM_CONFIG).doc(BATCH_PROOF_DOC).get();
      if (snap.exists) {
        const data = snap.data();
        if (data && typeof data.contractAddress === 'string' && isAddress(data.contractAddress)) {
          contractAddress = data.contractAddress as Address;
        }
      }
    }
    if (!contractAddress) {
      const fromEnv = process.env.NEXT_PUBLIC_BBB4_BATCH_PROOF_ADDRESS?.trim();
      if (fromEnv && isAddress(fromEnv)) contractAddress = fromEnv as Address;
    }
    if (!contractAddress) {
      throw new ApiError(503, 'No BatchProof contract address on file (Firestore system_config/batchProof or env)');
    }

    const account = privateKeyToAccount(key);
    const publicClient = createPublicClient({ chain: BASE, transport: http(BASE_RPC_URL) });
    const walletClient = createWalletClient({ account, chain: BASE, transport: http(BASE_RPC_URL) });

    // Read current owner. Skip the tx if it's already what the caller wants.
    const currentOwner = (await publicClient.readContract({
      address: contractAddress,
      abi: BBB4_BATCH_PROOF_ABI,
      functionName: 'owner',
    })) as Address;

    if (currentOwner.toLowerCase() === newOwner.toLowerCase()) {
      return json({
        success: true,
        alreadyTransferred: true,
        contractAddress,
        currentOwner,
        note: 'Contract owner is already the requested address — no transaction needed.',
        requestId,
      });
    }

    if (currentOwner.toLowerCase() !== account.address.toLowerCase()) {
      return jsonError(
        `Current contract owner is ${currentOwner}, not the configured signer (${account.address}). The signer cannot transfer ownership.`,
        400,
      );
    }

    // Encode + send the transferOwnership(newOwner) call manually so we
    // can apply our pinned Base gas params consistently.
    const data = encodeFunctionData({
      abi: BBB4_BATCH_PROOF_ABI,
      functionName: 'transferOwnership',
      args: [newOwner],
    });

    logger.info('admin.transfer_batchproof.submitting', {
      requestId,
      actor: actorWallet,
      from: account.address,
      to: contractAddress,
      newOwner,
    });

    const txHash = await walletClient.sendTransaction({
      to: contractAddress,
      data,
      value: 0n,
      ...BASE_GAS_PARAMS,
    });

    const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });
    if (receipt.status !== 'success') {
      throw new ApiError(500, `Transfer transaction reverted: ${txHash}`);
    }

    // Confirm on-chain that the new owner is in fact the new owner.
    const confirmedOwner = (await publicClient.readContract({
      address: contractAddress,
      abi: BBB4_BATCH_PROOF_ABI,
      functionName: 'owner',
    })) as Address;

    // Persist the new owner alongside the contract address so future Go
    // API + admin endpoints can read it. (Doesn't store the new private
    // key — that's Boris's job to put in Secret Manager.)
    if (isFirestoreConfigured()) {
      const db = getAdminFirestore();
      await db.collection(SYSTEM_CONFIG).doc(BATCH_PROOF_DOC).set(
        {
          ownerAddress: confirmedOwner,
          previousOwnerAddress: account.address,
          ownershipTransferredAt: Date.now(),
          ownershipTransferTxHash: txHash,
        },
        { merge: true },
      );
    }

    await logAdminAction({
      actor: actorWallet,
      action: 'transfer-batchproof-ownership',
      target: contractAddress,
      before: { owner: account.address },
      after: {
        owner: confirmedOwner,
        txHash,
        blockNumber: Number(receipt.blockNumber),
      },
      requestId,
    });

    logger.info('admin.transfer_batchproof.success', {
      requestId,
      actor: actorWallet,
      contractAddress,
      from: account.address,
      to: confirmedOwner,
      txHash,
    });

    return json({
      success: true,
      contractAddress,
      previousOwner: account.address,
      newOwner: confirmedOwner,
      txHash,
      blockNumber: Number(receipt.blockNumber),
      basescanTx: `https://basescan.org/tx/${txHash}`,
      requestId,
    });
  } catch (err) {
    logger.error('admin.transfer_batchproof.failed', { requestId, actor: actorWallet, err });
    if (err instanceof ApiError) return jsonError(err.message, err.status, { requestId });
    return jsonError((err as Error).message || 'Internal Server Error', 500, { requestId });
  }
}
