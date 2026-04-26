export const dynamic = 'force-dynamic';

import { createPublicClient, http } from 'viem';

import { json, jsonError } from '@/lib/api/routeUtils';
import { BASE, BASE_RPC_URL } from '@/lib/contracts/bbb4';
import { getAdminWalletAddress } from '@/lib/onchain/adminMint';

// Same floor as the card-mint route — keep these in sync if you change it.
// We pin gas params to Base-realistic values (0.1 gwei max) in adminMint.ts,
// so a full card-mint flow (3 txs × ~150k gas × 0.1 gwei) needs ~0.0001 ETH
// of pre-funded headroom. Floor at 5× that for spike tolerance.
const ADMIN_WALLET_GAS_FLOOR_WEI = 500_000_000_000_000n; // 0.0005 ETH (~$1.50)

const publicClient = createPublicClient({ chain: BASE, transport: http(BASE_RPC_URL) });

/**
 * GET /api/purchases/admin-wallet
 *
 * Returns the admin wallet's public address and a `healthy` flag indicating
 * whether the wallet has enough ETH on Base to honor a card-mint request.
 * The client uses `healthy` to surface a "purchases temporarily paused"
 * state before asking the user to sign a permit they can't actually use.
 */
export async function GET() {
  const address = getAdminWalletAddress();
  if (!address) {
    return jsonError('Admin wallet not configured', 503);
  }
  let healthy = true;
  let balanceWei: string | null = null;
  try {
    const balance = await publicClient.getBalance({ address });
    balanceWei = balance.toString();
    healthy = balance >= ADMIN_WALLET_GAS_FLOOR_WEI;
  } catch {
    // RPC blip — assume healthy and let the card-mint route's pre-flight
    // catch any real shortage. Better than blocking purchases on a flaky
    // public RPC node.
  }
  return json({ address, healthy, balanceWei });
}
