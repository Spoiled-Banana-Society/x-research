import { logger } from '@/lib/logger';

interface PrivyLinkedAccount {
  type: string;
  address?: string;
  subject?: string;
}

export interface PrivyUser {
  id: string; // did:privy:xxx
  linked_accounts?: PrivyLinkedAccount[];
  wallet?: { address?: string };
}

interface CacheEntry {
  user: PrivyUser;
  cachedAt: number;
}

const CACHE_TTL_MS = 5 * 60 * 1000;
const cache = new Map<string, CacheEntry>();

function getAppId(): string {
  const id = (process.env.PRIVY_APP_ID || process.env.NEXT_PUBLIC_PRIVY_APP_ID || '').trim();
  if (!id) throw new Error('PRIVY_APP_ID not configured');
  return id;
}

function getAppSecret(): string {
  const secret = (process.env.PRIVY_APP_SECRET || '').trim();
  if (!secret) throw new Error('PRIVY_APP_SECRET not configured');
  return secret;
}

/**
 * Fetch Privy user record by DID (e.g. "did:privy:xxx"). Cached 5 min per DID
 * to avoid round-trips on every admin request.
 */
export async function fetchPrivyUser(did: string): Promise<PrivyUser | null> {
  const now = Date.now();
  const cached = cache.get(did);
  if (cached && now - cached.cachedAt < CACHE_TTL_MS) {
    return cached.user;
  }

  const appId = getAppId();
  const secret = getAppSecret();
  const auth = Buffer.from(`${appId}:${secret}`).toString('base64');
  const url = `https://auth.privy.io/api/v1/users/${encodeURIComponent(did)}`;

  try {
    const res = await fetch(url, {
      headers: {
        Authorization: `Basic ${auth}`,
        'privy-app-id': appId,
      },
    });
    if (!res.ok) {
      logger.warn('privy.fetch_user.failed', { did, status: res.status });
      return null;
    }
    const user = (await res.json()) as PrivyUser;
    cache.set(did, { user, cachedAt: now });
    return user;
  } catch (err) {
    logger.error('privy.fetch_user.error', { did, err });
    return null;
  }
}

/** Return all wallet addresses linked to the given Privy user (lowercased). */
export function linkedWalletsOf(user: PrivyUser): string[] {
  const wallets = new Set<string>();
  for (const account of user.linked_accounts ?? []) {
    if (account.type === 'wallet' && account.address) {
      wallets.add(account.address.toLowerCase());
    }
  }
  if (user.wallet?.address) wallets.add(user.wallet.address.toLowerCase());
  return [...wallets];
}
