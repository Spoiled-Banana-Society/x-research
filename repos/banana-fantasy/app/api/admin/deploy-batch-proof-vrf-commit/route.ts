import { rateLimit, RATE_LIMITS } from '@/lib/rateLimit';
export const dynamic = 'force-dynamic';

import {
  createPublicClient,
  createWalletClient,
  http,
  parseGwei,
  isAddress,
  isHex,
  type Address,
  type Hex,
} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';

import { ApiError } from '@/lib/api/errors';
import { json, jsonError, parseBody } from '@/lib/api/routeUtils';
import { requireAdmin } from '@/lib/adminAuth';
import { logAdminAction } from '@/lib/adminAudit';
import { BASE, BASE_RPC_URL } from '@/lib/contracts/bbb4';
import {
  BBB4_BATCH_PROOF_VRF_COMMIT_BYTECODE,
  BBB4_BATCH_PROOF_VRF_COMMIT_ABI,
} from '@/lib/contracts/bbb4BatchProofVRFCommitArtifact';
import { getAdminFirestore, isFirestoreConfigured } from '@/lib/firebaseAdmin';
import { logger } from '@/lib/logger';
import { getRequestId } from '@/lib/requestId';

const SYSTEM_CONFIG = 'system_config';
const BATCH_PROOF_DOC = 'batchProof';

const BASE_GAS_PARAMS = {
  maxFeePerGas: parseGwei('0.1'),
  maxPriorityFeePerGas: parseGwei('0.001'),
};

function loadPrivateKey(): Hex | null {
  const raw = process.env.BBB4_OWNER_PRIVATE_KEY?.trim();
  if (!raw) return null;
  const hex = raw.startsWith('0x') ? raw : `0x${raw}`;
  if (!/^0x[0-9a-fA-F]{64}$/.test(hex)) return null;
  return hex as Hex;
}

interface BatchProofConfig {
  contractAddress?: Address;
  contractVariant?: string;
  vrfCoordinator?: Address;
  vrfSubscriptionId?: string;
  vrfKeyHash?: Hex;
  deployerAddress?: Address;
  deployTxHash?: Hex;
  deployedAt?: number;
  ownerAddress?: Address;
}

/**
 * POST /api/admin/deploy-batch-proof-vrf-commit
 *   { vrfCoordinator: '0x...', subscriptionId: '12345...', keyHash: '0x...', initialOwner: '0x...' }
 *
 * Deploys BBB4BatchProofVRFCommit.sol — the salt-commit + Chainlink VRF
 * v2.5 hybrid that hides slot positions from the public during a batch
 * (commit-reveal property) while still binding entropy to a decentralized
 * oracle (VRF property).
 *
 * After this lands, you must (one-time):
 *   1. In the Chainlink VRF dashboard, add the deployed contract address
 *      as a "Consumer" of the subscription whose ID you passed here.
 *   2. Make sure the subscription has at least a few LINK funded.
 *
 * Idempotent: if Firestore system_config/batchProof already has a
 * `vrf-commit` contract on file with bytecode on Base, this endpoint
 * refuses to redeploy. Delete the doc to force a fresh deploy.
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
    const vrfCoordinatorRaw = typeof body.vrfCoordinator === 'string' ? body.vrfCoordinator.trim() : '';
    const subscriptionIdRaw = typeof body.subscriptionId === 'string' ? body.subscriptionId.trim() : '';
    const keyHashRaw = typeof body.keyHash === 'string' ? body.keyHash.trim() : '';
    const initialOwnerRaw = typeof body.initialOwner === 'string' ? body.initialOwner.trim() : '';

    if (!isAddress(vrfCoordinatorRaw)) {
      throw new ApiError(400, `Invalid vrfCoordinator: ${vrfCoordinatorRaw}`);
    }
    if (!isAddress(initialOwnerRaw)) {
      throw new ApiError(400, `Invalid initialOwner: ${initialOwnerRaw}`);
    }
    if (!isHex(keyHashRaw) || keyHashRaw.length !== 66) {
      throw new ApiError(400, `Invalid keyHash (need 0x + 64 hex chars): ${keyHashRaw}`);
    }
    let subscriptionId: bigint;
    try {
      subscriptionId = BigInt(subscriptionIdRaw);
    } catch {
      throw new ApiError(400, `Invalid subscriptionId (need uint256 decimal or 0x-hex): ${subscriptionIdRaw}`);
    }
    if (subscriptionId <= 0n) throw new ApiError(400, 'subscriptionId must be > 0');

    const vrfCoordinator = vrfCoordinatorRaw as Address;
    const initialOwner = initialOwnerRaw as Address;
    const keyHash = keyHashRaw as Hex;

    const key = loadPrivateKey();
    if (!key) return jsonError('BBB4_OWNER_PRIVATE_KEY not configured', 503);

    const account = privateKeyToAccount(key);
    const publicClient = createPublicClient({ chain: BASE, transport: http(BASE_RPC_URL) });

    if (isFirestoreConfigured()) {
      const db = getAdminFirestore();
      const snap = await db.collection(SYSTEM_CONFIG).doc(BATCH_PROOF_DOC).get();
      if (snap.exists) {
        const existing = snap.data() as BatchProofConfig | undefined;
        if (existing?.contractAddress && existing.contractVariant === 'vrf-commit') {
          const code = await publicClient.getCode({ address: existing.contractAddress });
          if (code && code !== '0x') {
            return json({
              success: true,
              alreadyDeployed: true,
              contractAddress: existing.contractAddress,
              contractVariant: 'vrf-commit',
              note: 'A vrf-commit BatchProof contract is already deployed and on file. Delete system_config/batchProof in Firestore to force a fresh deploy.',
              requestId,
            });
          }
        }
      }
    }

    const balance = await publicClient.getBalance({ address: account.address });
    const minWei = 500_000_000_000_000n;
    if (balance < minWei) {
      return jsonError(
        `Signer ${account.address} has ${balance} wei (~${Number(balance) / 1e18} ETH); need at least 0.0005 ETH for deploy gas.`,
        400,
      );
    }

    const walletClient = createWalletClient({
      account,
      chain: BASE,
      transport: http(BASE_RPC_URL),
    });

    logger.info('admin.deploy_batch_proof_vrf_commit.submitting', {
      requestId,
      actor: actorWallet,
      from: account.address,
      vrfCoordinator,
      subscriptionId: subscriptionId.toString(),
      keyHash,
      initialOwner,
    });

    const txHash = await walletClient.deployContract({
      abi: BBB4_BATCH_PROOF_VRF_COMMIT_ABI,
      bytecode: BBB4_BATCH_PROOF_VRF_COMMIT_BYTECODE,
      args: [vrfCoordinator, subscriptionId, keyHash, initialOwner],
      ...BASE_GAS_PARAMS,
    });

    const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });
    if (receipt.status !== 'success' || !receipt.contractAddress) {
      throw new ApiError(500, `Deploy transaction reverted: ${txHash}`);
    }
    const contractAddress = receipt.contractAddress;

    if (isFirestoreConfigured()) {
      const db = getAdminFirestore();
      const config: BatchProofConfig = {
        contractAddress,
        contractVariant: 'vrf-commit',
        vrfCoordinator,
        vrfSubscriptionId: subscriptionId.toString(),
        vrfKeyHash: keyHash,
        deployerAddress: account.address,
        deployTxHash: txHash,
        deployedAt: Date.now(),
        ownerAddress: initialOwner,
      };
      await db.collection(SYSTEM_CONFIG).doc(BATCH_PROOF_DOC).set(config);
    }

    await logAdminAction({
      actor: actorWallet,
      action: 'deploy-batch-proof',
      target: contractAddress,
      after: {
        contractAddress,
        contractVariant: 'vrf-commit',
        vrfCoordinator,
        subscriptionId: subscriptionId.toString(),
        keyHash,
        initialOwner,
        deployTxHash: txHash,
        deployerAddress: account.address,
        gasUsed: receipt.gasUsed.toString(),
        blockNumber: Number(receipt.blockNumber),
      },
      requestId,
    });

    return json({
      success: true,
      contractAddress,
      contractVariant: 'vrf-commit',
      deployTxHash: txHash,
      deployerAddress: account.address,
      vrfCoordinator,
      subscriptionId: subscriptionId.toString(),
      keyHash,
      initialOwner,
      blockNumber: Number(receipt.blockNumber),
      gasUsed: receipt.gasUsed.toString(),
      basescanContract: `https://basescan.org/address/${contractAddress}`,
      basescanTx: `https://basescan.org/tx/${txHash}`,
      nextSteps: [
        `Open https://vrf.chain.link → Subscriptions → ${subscriptionId.toString()} → Add consumer → paste ${contractAddress}`,
        'Make sure the subscription has at least 1 LINK funded',
        'After both steps, the next batch boundary will use the VRF+commit hybrid (positions hidden during batch, revealed at close)',
      ],
      requestId,
    });
  } catch (err) {
    logger.error('admin.deploy_batch_proof_vrf_commit.failed', { requestId, actor: actorWallet, err });
    if (err instanceof ApiError) return jsonError(err.message, err.status, { requestId });
    return jsonError((err as Error).message || 'Internal Server Error', 500, { requestId });
  }
}
