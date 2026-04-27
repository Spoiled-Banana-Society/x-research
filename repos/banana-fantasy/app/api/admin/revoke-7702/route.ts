import { rateLimit, RATE_LIMITS } from '@/lib/rateLimit';
export const dynamic = 'force-dynamic';

import { createPublicClient, createWalletClient, http, parseGwei, type Hex } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';

import { ApiError } from '@/lib/api/errors';
import { json, jsonError } from '@/lib/api/routeUtils';
import { requireAdmin } from '@/lib/adminAuth';
import { logAdminAction } from '@/lib/adminAudit';
import { BASE, BASE_RPC_URL } from '@/lib/contracts/bbb4';
import { logger } from '@/lib/logger';
import { getRequestId } from '@/lib/requestId';

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000' as const;

function loadPrivateKey(): Hex | null {
  const raw = process.env.BBB4_OWNER_PRIVATE_KEY?.trim();
  if (!raw) return null;
  const hex = raw.startsWith('0x') ? raw : `0x${raw}`;
  if (!/^0x[0-9a-fA-F]{64}$/.test(hex)) return null;
  return hex as Hex;
}

/**
 * POST /api/admin/revoke-7702
 *
 * One-off admin endpoint to revoke an accidental EIP-7702 delegation on the
 * admin wallet (BBB4_OWNER_PRIVATE_KEY). Today's diagnosis: the admin wallet
 * was delegated to a smart-account contract, which causes Alchemy to enforce
 * a "1 in-flight tx" limit, breaking our 3-step card-mint flow (permit →
 * transferFrom → reserveTokens).
 *
 * Revoking is just signing a new EIP-7702 authorization with the delegate
 * set to the zero address. After this commits, the admin wallet's bytecode
 * goes back to `0x` (plain EOA) and Alchemy stops rate-limiting it.
 *
 * Idempotent: if the wallet isn't currently delegated, refuses with 200 +
 * a no-op note. After it commits, this endpoint should be removed in a
 * follow-up cleanup.
 */
export async function POST(req: Request) {
  const requestId = getRequestId(req);
  const rateLimited = rateLimit(req, RATE_LIMITS.admin);
  if (rateLimited) return rateLimited;

  let actorWallet = '';
  try {
    const admin = await requireAdmin(req);
    actorWallet = admin.walletAddress ?? admin.userId;

    const key = loadPrivateKey();
    if (!key) {
      return jsonError('BBB4_OWNER_PRIVATE_KEY not configured', 503);
    }

    const account = privateKeyToAccount(key);
    const publicClient = createPublicClient({ chain: BASE, transport: http(BASE_RPC_URL) });
    const walletClient = createWalletClient({
      account,
      chain: BASE,
      transport: http(BASE_RPC_URL),
    });

    // Confirm the wallet is actually delegated before doing anything.
    const codeBefore = await publicClient.getCode({ address: account.address });
    if (!codeBefore || codeBefore === '0x') {
      logger.info('admin.revoke7702.not_delegated', { requestId, actor: actorWallet });
      return json({
        success: true,
        alreadyRevoked: true,
        address: account.address,
        codeBefore: codeBefore ?? '0x',
        note: 'Admin wallet is already a plain EOA — nothing to revoke.',
        requestId,
      });
    }

    const isDelegated = codeBefore.toLowerCase().startsWith('0xef0100');
    if (!isDelegated) {
      throw new ApiError(409, `Wallet has bytecode but it's not a 7702 delegation marker (got prefix ${codeBefore.slice(0, 8)}). Refusing to touch — investigate manually.`);
    }
    const previousDelegate = `0x${codeBefore.slice(8, 48)}`;

    // Sign the revoke authorization. delegate=0x0, chainId=Base.
    //
    // Self-signing case: the EIP-7702 spec requires the authorization's
    // nonce to equal the *post-tx* nonce of the signer when the signer is
    // also the executor. Since the tx itself bumps the nonce by 1, we pass
    // (current nonce + 1).
    const currentNonce = await publicClient.getTransactionCount({
      address: account.address,
      blockTag: 'pending',
    });
    const authorization = await account.signAuthorization({
      address: ZERO_ADDRESS,
      chainId: BASE.id,
      nonce: currentNonce + 1,
    });

    // Submit a self-tx that carries the authorization. Empty data is fine.
    const txHash = await walletClient.sendTransaction({
      authorizationList: [authorization],
      to: account.address,
      data: '0x',
      value: 0n,
      maxFeePerGas: parseGwei('0.1'),
      maxPriorityFeePerGas: parseGwei('0.001'),
    });

    logger.info('admin.revoke7702.tx_sent', { requestId, actor: actorWallet, txHash });

    const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash, timeout: 60_000 });

    if (receipt.status !== 'success') {
      throw new ApiError(500, `Revoke tx reverted: ${txHash}`);
    }

    // Confirm the bytecode is now empty.
    const codeAfter = await publicClient.getCode({ address: account.address });
    const cleared = !codeAfter || codeAfter === '0x';

    await logAdminAction({
      actor: actorWallet,
      action: 'revoke-7702',
      target: account.address,
      before: { bytecode: codeBefore, delegate: previousDelegate },
      after: { bytecode: codeAfter ?? '0x', cleared, txHash },
      requestId,
    });

    logger.info('admin.revoke7702.ok', {
      requestId,
      actor: actorWallet,
      address: account.address,
      cleared,
      txHash,
    });

    return json({
      success: true,
      address: account.address,
      previousDelegate,
      txHash,
      codeBefore,
      codeAfter: codeAfter ?? '0x',
      cleared,
      requestId,
    });
  } catch (err) {
    logger.error('admin.revoke7702.failed', { requestId, actor: actorWallet, err });
    if (err instanceof ApiError) return jsonError(err.message, err.status, { requestId });
    return jsonError((err as Error).message || 'Internal Server Error', 500, { requestId });
  }
}
