import { getAdminFirestore, isFirestoreConfigured } from '@/lib/firebaseAdmin';
import { logger } from '@/lib/logger';

export type UserEventType =
  | 'signup'
  | 'login'
  | 'x_linked'
  | 'first_purchase'
  | 'wallet_linked'
  | 'promo_claimed';

export interface UserEventRecord {
  userId: string;
  eventType: UserEventType;
  meta?: Record<string, unknown>;
  timestamp: string; // ISO
}

const COLLECTION = 'v2_user_events';

export async function logUserEvent(
  userId: string,
  eventType: UserEventType,
  meta?: Record<string, unknown>,
): Promise<void> {
  if (!isFirestoreConfigured()) return;
  try {
    const db = getAdminFirestore();
    const doc: UserEventRecord = {
      userId: userId.toLowerCase(),
      eventType,
      ...(meta ? { meta } : {}),
      timestamp: new Date().toISOString(),
    };
    await db.collection(COLLECTION).add(doc);
    logger.debug('user.event.logged', { userId: doc.userId, eventType });
  } catch (err) {
    logger.error('user.event.write_failed', { err, userId, eventType });
  }
}

export async function fetchRecentUserEvents(limit = 100): Promise<UserEventRecord[]> {
  if (!isFirestoreConfigured()) return [];
  const db = getAdminFirestore();
  const snap = await db
    .collection(COLLECTION)
    .orderBy('timestamp', 'desc')
    .limit(Math.min(limit, 500))
    .get();
  return snap.docs.map((d) => d.data() as UserEventRecord);
}

/**
 * Throttled login logger — only writes a `login` event at most once per 6 hours
 * per user to avoid spamming the collection on every page load.
 */
const loginThrottle = new Map<string, number>();
const LOGIN_THROTTLE_MS = 6 * 60 * 60 * 1000;

export async function logLoginIfFresh(userId: string, meta?: Record<string, unknown>): Promise<void> {
  const now = Date.now();
  const last = loginThrottle.get(userId.toLowerCase()) ?? 0;
  if (now - last < LOGIN_THROTTLE_MS) return;
  loginThrottle.set(userId.toLowerCase(), now);
  await logUserEvent(userId, 'login', meta);
}
