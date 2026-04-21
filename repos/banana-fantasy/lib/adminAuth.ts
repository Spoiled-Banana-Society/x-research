import { ApiError } from '@/lib/api/errors';
import { getPrivyUser } from '@/lib/auth';
import { isWalletAdmin } from '@/lib/adminAllowlist';
import { fetchPrivyUser, linkedWalletsOf } from '@/lib/privyServer';
import { logger } from '@/lib/logger';

export function isAdmin(userId: string): boolean {
  return isWalletAdmin(userId);
}

/**
 * Auth gate for admin endpoints.
 *
 * 1. Verify the Privy JWT (proves the caller is authenticated).
 * 2. If the JWT payload already carried a wallet, check it against the admin allowlist.
 * 3. Otherwise, look the user up by DID via Privy's server API to get their linked
 *    wallets, then check if any of them are in the allowlist.
 *
 * This replaces the previous trust-based `X-Admin-Wallet` header — we no longer
 * accept a client-supplied wallet for the allowlist check.
 */
export async function requireAdmin(
  req: Request,
): Promise<{ userId: string; walletAddress: string | null }> {
  const user = await getPrivyUser(req);

  // Fast path: JWT already had a wallet that's on the allowlist
  if (user.walletAddress && isAdmin(user.walletAddress)) {
    return { userId: user.userId, walletAddress: user.walletAddress };
  }

  // Fallback: server-side Privy user lookup to find linked wallets
  const privyUser = await fetchPrivyUser(user.userId);
  if (!privyUser) {
    logger.warn('admin.auth.privy_lookup_failed', { did: user.userId });
    throw new ApiError(403, 'Forbidden');
  }

  const linked = linkedWalletsOf(privyUser);
  const adminWallet = linked.find((w) => isAdmin(w));
  if (!adminWallet) {
    throw new ApiError(403, 'Forbidden');
  }

  return { userId: user.userId, walletAddress: adminWallet };
}
