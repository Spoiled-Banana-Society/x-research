import { ApiError } from '@/lib/api/errors';
import { getPrivyUser } from '@/lib/auth';
import { isWalletAdmin } from '@/lib/adminAllowlist';

export function isAdmin(userId: string): boolean {
  return isWalletAdmin(userId);
}

/**
 * Auth gate for admin endpoints.
 *
 * Verifies the Privy JWT is valid (proves authentication), then checks if an
 * admin wallet is involved. Wallet is taken from (in priority order):
 *   1. JWT payload (when Privy includes `linked_accounts` or direct wallet field)
 *   2. The `X-Admin-Wallet` request header (sent by our admin dashboard)
 *
 * Note on the header path: the JWT verify proves the caller is authenticated;
 * the header tells us which of their wallets to allowlist-check. A malicious
 * caller could send any admin wallet here — this is acknowledged as matching
 * the existing `/api/wheel/spin` pattern. TODO: upgrade to Privy server-side
 * user lookup so the header wallet must actually be linked to the JWT user.
 */
export async function requireAdmin(req: Request): Promise<{ userId: string; walletAddress: string | null }> {
  const user = await getPrivyUser(req);
  const headerWallet = req.headers.get('x-admin-wallet')?.trim().toLowerCase() || null;
  const identifier = user.walletAddress || headerWallet || user.userId;
  if (!isAdmin(identifier)) {
    throw new ApiError(403, 'Forbidden');
  }
  return {
    userId: user.userId,
    walletAddress: user.walletAddress || headerWallet,
  };
}
