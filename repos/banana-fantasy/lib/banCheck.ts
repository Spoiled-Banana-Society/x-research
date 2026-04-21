import { getAdminFirestore, isFirestoreConfigured } from '@/lib/firebaseAdmin';

const USERS_COLLECTION = 'v2_users';
const CACHE_TTL_MS = 30_000;

interface CacheEntry {
  banned: boolean;
  cachedAt: number;
}

const cache = new Map<string, CacheEntry>();

/**
 * Check if a wallet address is banned. Cached 30s in-memory per Vercel
 * instance. Returns false (fail-open) if Firestore isn't configured or the
 * read errors — we never want auth to fail because the ban lookup blew up.
 */
export async function isUserBanned(walletOrId: string): Promise<boolean> {
  if (!walletOrId) return false;
  if (!isFirestoreConfigured()) return false;
  const key = walletOrId.toLowerCase();
  const now = Date.now();
  const cached = cache.get(key);
  if (cached && now - cached.cachedAt < CACHE_TTL_MS) return cached.banned;

  try {
    const db = getAdminFirestore();
    const doc = await db.collection(USERS_COLLECTION).doc(key).get();
    const banned = doc.data()?.banned === true;
    cache.set(key, { banned, cachedAt: now });
    return banned;
  } catch {
    return false;
  }
}

/**
 * Bust the ban cache for a user — called by the ban/unban admin endpoint so
 * the change takes effect immediately instead of waiting for TTL.
 */
export function clearBanCache(walletOrId: string): void {
  if (!walletOrId) return;
  cache.delete(walletOrId.toLowerCase());
}
