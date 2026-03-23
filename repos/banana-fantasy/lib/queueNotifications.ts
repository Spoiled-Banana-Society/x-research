/**
 * Send notifications for special draft queue events.
 * Writes directly to Firestore (server-side).
 */

import { getAdminFirestore, isFirestoreConfigured } from '@/lib/firebaseAdmin';
import { FieldValue } from 'firebase-admin/firestore';

const COLLECTION = 'marketplace_notifications';

async function sendNotification(wallet: string, type: string, title: string, message: string, link?: string) {
  if (!isFirestoreConfigured()) return;
  try {
    const db = getAdminFirestore();
    await db.collection(COLLECTION).add({
      wallet: wallet.toLowerCase(),
      type,
      title,
      message,
      link: link || '/special-drafts',
      read: false,
      createdAt: FieldValue.serverTimestamp(),
    });
  } catch (err) {
    console.error('[QueueNotif] Failed to send:', err);
  }
}

/** Notify user they've been queued */
export async function notifyQueueJoined(wallet: string, type: 'jackpot' | 'hof', draftCount: number) {
  const label = type === 'jackpot' ? 'Jackpot' : 'HOF';
  const emoji = type === 'jackpot' ? '🔥' : '🏆';
  await sendNotification(
    wallet,
    `${type}_queue`,
    `${emoji} ${label} Draft Queued!`,
    `You're in ${draftCount} ${label} draft queue${draftCount !== 1 ? 's' : ''} (8-hour picks). The draft starts as soon as 10 winners fill the queue!`,
  );
}

/** Notify ALL members that a round is full — draft starting now */
export async function notifyQueueFilled(wallets: string[], type: 'jackpot' | 'hof') {
  const label = type === 'jackpot' ? 'Jackpot' : 'HOF';
  const emoji = type === 'jackpot' ? '🔥' : '🏆';
  const promises = wallets.map(wallet =>
    sendNotification(
      wallet,
      `${type}_queue`,
      `${emoji} ${label} Draft Starting!`,
      `10 winners are in! Your ${label} draft is starting now. 8-hour picks — draft at your own pace.`,
    )
  );
  await Promise.allSettled(promises);
}
