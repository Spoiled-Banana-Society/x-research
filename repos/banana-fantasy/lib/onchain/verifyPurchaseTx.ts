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
  tokenIds: string[];
}

/**
 * Verifies that a submitted txHash really minted `expectedQuantity` BBB4 NFTs
 * to `expectedFrom` on Base. Throws ApiError on failure.
 *
 * Intentionally does NOT check `receipt.from === expectedFrom` or
 * `receipt.to === BBB4` — those break for ERC-4337 smart-account / bundled
 * txs (Privy embedded wallets use this path) where `receipt.from` is the
 * bundler and `receipt.to` is the EntryPoint contract. The proof of mint is
 * the `Transfer(from=0x0, to=expectedFrom, tokenId)` event emitted by BBB4,
 * which is tamper-proof and works for both EOA and smart-account flows.
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

  const bbb4 = BBB4_CONTRACT_ADDRESS.toLowerCase() as Address;
  const recipientTopic = '0x' + '0'.repeat(24) + expectedFrom.slice(2).toLowerCase();

  // Count BBB4 mints (Transfer from 0x0) that landed on the expected wallet.
  // This proves the user received `expectedQuantity` freshly-minted BBB4 NFTs
  // in this transaction, regardless of whether the tx was direct or bundled.
  const mintLogs = receipt.logs.filter((log) => {
    if (log.address.toLowerCase() !== bbb4) return false;
    if (log.topics[0] !== TRANSFER_EVENT_TOPIC) return false;
    if (log.topics[1] !== ZERO_ADDRESS_TOPIC) return false; // from == 0x0
    if ((log.topics[2] ?? '').toLowerCase() !== recipientTopic) return false; // to == expected wallet
    return true;
  });

  if (mintLogs.length < expectedQuantity) {
    throw new ApiError(
      400,
      `Mint count mismatch: expected >= ${expectedQuantity} BBB4 mints to ${expectedFrom}, got ${mintLogs.length}`,
    );
  }

  // Replay window — block must be recent.
  const block = await client.getBlock({ blockNumber: receipt.blockNumber });
  const blockMs = Number(block.timestamp) * 1000;
  if (Date.now() - blockMs > REPLAY_WINDOW_MS) {
    throw new ApiError(400, 'Transaction is too old to credit');
  }

  const tokenIds = mintLogs.map((l) => BigInt(l.topics[3] ?? '0x0').toString());

  return {
    blockNumber: receipt.blockNumber,
    minted: mintLogs.length,
    tokenIds,
  };
}
