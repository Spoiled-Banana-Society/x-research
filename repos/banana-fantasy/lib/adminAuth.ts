import { ApiError } from '@/lib/api/errors';
import { getPrivyUser } from '@/lib/auth';
import { isWalletAdmin } from '@/lib/adminAllowlist';

export function isAdmin(userId: string): boolean {
  return isWalletAdmin(userId);
}

export async function requireAdmin(req: Request): Promise<{ userId: string; walletAddress: string | null }> {
  const user = await getPrivyUser(req);
  const identifier = user.walletAddress || user.userId;
  if (!isAdmin(identifier)) {
    throw new ApiError(403, 'Forbidden');
  }
  return user;
}
