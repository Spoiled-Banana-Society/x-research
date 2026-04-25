export const dynamic = 'force-dynamic';

import { json, jsonError } from '@/lib/api/routeUtils';
import { getAdminWalletAddress } from '@/lib/onchain/adminMint';

/**
 * GET /api/purchases/admin-wallet
 *
 * Returns the public address of the server wallet that acts as the
 * `spender` on EIP-2612 USDC permits for the card-mint flow. The client
 * needs this to build the typed-data it asks the user to sign. The address
 * is public by definition (it's the admin wallet's on-chain address), so
 * no auth required.
 */
export async function GET() {
  const address = getAdminWalletAddress();
  if (!address) {
    return jsonError('Admin wallet not configured', 503);
  }
  return json({ address });
}
