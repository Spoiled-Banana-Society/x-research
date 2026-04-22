import {
  createPublicClient,
  createWalletClient,
  http,
  parseEventLogs,
  type Address,
  type Hex,
} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { BASE, BASE_RPC_URL, BBB4_ABI, BBB4_CONTRACT_ADDRESS } from '@/lib/contracts/bbb4';
import { ApiError } from '@/lib/api/errors';
import { logger } from '@/lib/logger';

const RECEIPT_TIMEOUT_MS = 60_000;

function loadPrivateKey(): Hex | null {
  const raw = process.env.BBB4_OWNER_PRIVATE_KEY?.trim();
  if (!raw) return null;
  const hex = raw.startsWith('0x') ? raw : `0x${raw}`;
  if (!/^0x[0-9a-fA-F]{64}$/.test(hex)) return null;
  return hex as Hex;
}

export function isAdminMintConfigured(): boolean {
  return loadPrivateKey() !== null;
}

export interface ReserveTokensResult {
  txHash: Hex;
  tokenIds: string[];
}

/**
 * Calls BBB4.reserveTokens(to, count) from the configured owner wallet.
 * Returns the tx hash and minted tokenIds (parsed from Transfer event logs).
 *
 * Throws ApiError(503) if BBB4_OWNER_PRIVATE_KEY is missing — callers can
 * fall back to a Firestore-only path while the ops wallet is being set up.
 */
export async function reserveTokensToWallet(opts: {
  to: string;
  count: number;
}): Promise<ReserveTokensResult> {
  const { to, count } = opts;

  if (!/^0x[0-9a-fA-F]{40}$/.test(to)) {
    throw new ApiError(400, 'Invalid recipient wallet');
  }
  if (!Number.isInteger(count) || count <= 0) {
    throw new ApiError(400, 'count must be a positive integer');
  }

  const key = loadPrivateKey();
  if (!key) {
    throw new ApiError(503, 'Admin mint is not configured (missing BBB4_OWNER_PRIVATE_KEY)');
  }

  const account = privateKeyToAccount(key);
  const walletClient = createWalletClient({
    account,
    chain: BASE,
    transport: http(BASE_RPC_URL),
  });
  const publicClient = createPublicClient({
    chain: BASE,
    transport: http(BASE_RPC_URL),
  });

  const recipient = to.toLowerCase() as Address;

  const txHash = await walletClient.writeContract({
    address: BBB4_CONTRACT_ADDRESS,
    abi: BBB4_ABI,
    functionName: 'reserveTokens',
    args: [recipient, BigInt(count)],
  });

  logger.info('adminMint.tx.sent', { to: recipient, count, txHash });

  const receipt = await publicClient.waitForTransactionReceipt({
    hash: txHash,
    timeout: RECEIPT_TIMEOUT_MS,
  });

  if (receipt.status !== 'success') {
    throw new ApiError(500, `reserveTokens reverted (tx ${txHash})`);
  }

  const events = parseEventLogs({
    abi: BBB4_ABI,
    eventName: 'Transfer',
    logs: receipt.logs,
  });

  const tokenIds = events
    .filter((e) => e.args.to.toLowerCase() === recipient)
    .map((e) => e.args.tokenId.toString());

  if (tokenIds.length < count) {
    logger.warn('adminMint.tokenId_mismatch', {
      txHash,
      expected: count,
      parsed: tokenIds.length,
    });
  }

  return { txHash, tokenIds };
}
