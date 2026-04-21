import { createPublicClient, http, keccak256, toBytes, type Address, type Hex } from 'viem';
import { BASE, BASE_RPC_URL, BBB4_CONTRACT_ADDRESS } from '@/lib/contracts/bbb4';
import { ApiError } from '@/lib/api/errors';

const TRANSFER_EVENT_TOPIC = keccak256(toBytes('Transfer(address,address,uint256)'));
const ZERO_ADDRESS_TOPIC = '0x' + '0'.repeat(64);

const REPLAY_WINDOW_MS = 24 * 60 * 60 * 1000; // 24h

const client = createPublicClient({
  chain: BASE,
  transport: http(BASE_RPC_URL),
});

export interface VerifiedMint {
  blockNumber: bigint;
  minted: number;
}

/**
 * Verifies that a submitted txHash is a real successful mint from BBB4 on Base
 * by the expected wallet, at least as many NFTs as expected. Throws ApiError on failure.
 */
export async function verifyPurchaseTx(opts: {
  txHash: string;
  expectedFrom: string;
  expectedQuantity: number;
}): Promise<VerifiedMint> {
  const { txHash, expectedFrom, expectedQuantity } = opts;

  if (!/^0x[0-9a-fA-F]{64}$/.test(txHash)) {
    throw new ApiError(400, 'Invalid txHash format');
  }
  if (!/^0x[0-9a-fA-F]{40}$/.test(expectedFrom)) {
    throw new ApiError(400, 'Invalid wallet address on purchase');
  }

  let receipt;
  try {
    receipt = await client.getTransactionReceipt({ hash: txHash as Hex });
  } catch {
    throw new ApiError(400, 'Transaction not found on-chain');
  }

  if (receipt.status !== 'success') {
    throw new ApiError(400, 'Transaction did not succeed on-chain');
  }

  const expectedTo = BBB4_CONTRACT_ADDRESS.toLowerCase() as Address;
  if (receipt.to?.toLowerCase() !== expectedTo) {
    throw new ApiError(400, 'Transaction is not a BBB4 mint');
  }

  if (receipt.from.toLowerCase() !== expectedFrom.toLowerCase()) {
    throw new ApiError(400, 'Transaction from-address does not match purchase wallet');
  }

  // Count ERC-721 Transfer(from=0x0, to=wallet, tokenId) logs emitted by BBB4
  const mintLogs = receipt.logs.filter((log) => {
    if (log.address.toLowerCase() !== expectedTo) return false;
    if (log.topics[0] !== TRANSFER_EVENT_TOPIC) return false;
    // Mint: from == 0x0
    if (log.topics[1] !== ZERO_ADDRESS_TOPIC) return false;
    return true;
  });

  if (mintLogs.length < expectedQuantity) {
    throw new ApiError(
      400,
      `Mint count mismatch: expected >= ${expectedQuantity}, got ${mintLogs.length}`,
    );
  }

  // Replay-window: block must be recent enough
  const block = await client.getBlock({ blockNumber: receipt.blockNumber });
  const blockMs = Number(block.timestamp) * 1000;
  if (Date.now() - blockMs > REPLAY_WINDOW_MS) {
    throw new ApiError(400, 'Transaction is too old to credit');
  }

  return {
    blockNumber: receipt.blockNumber,
    minted: mintLogs.length,
  };
}
