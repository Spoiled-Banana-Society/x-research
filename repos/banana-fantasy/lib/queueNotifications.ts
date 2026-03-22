/**
 * Send notifications for special draft queue events.
 * Writes directly to Firestore (server-side) — no HTTP needed.
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

/** Notify user they've been queued after picking speed */
export async function notifyQueueJoined(
  wallet: string,
  type: 'jackpot' | 'hof',
  speed: 'fast' | 'slow' | 'any',
  draftCount: number,
) {
  const label = type === 'jackpot' ? 'Jackpot' : 'HOF';
  const emoji = type === 'jackpot' ? '🔥' : '🏆';
  const speedText = speed === 'any' ? 'either speed' : speed === 'fast' ? '30-second' : '8-hour';
  await sendNotification(
    wallet,
    `${type}_queue`,
    `${emoji} ${label} Draft Queued!`,
    `You're in ${draftCount} ${label} draft queue${draftCount !== 1 ? 's' : ''} (${speedText}). Once 10 winners fill a queue, the draft starts 48 hours later. We'll notify you!`,
  );
}

/** Notify ALL members of a round that it filled and is scheduled */
export async function notifyQueueFilled(
  wallets: string[],
  type: 'jackpot' | 'hof',
  speed: 'fast' | 'slow',
  scheduledTime: number,
) {
  const label = type === 'jackpot' ? 'Jackpot' : 'HOF';
  const emoji = type === 'jackpot' ? '🔥' : '🏆';
  const speedText = speed === 'fast' ? '30-second' : '8-hour';
  const dateStr = new Date(scheduledTime).toLocaleString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric',
    hour: 'numeric', minute: '2-digit', hour12: true,
  });

  const promises = wallets.map(wallet =>
    sendNotification(
      wallet,
      `${type}_queue`,
      `${emoji} ${label} Draft Scheduled!`,
      `10 winners are in! Your ${speedText} ${label} draft starts ${dateStr}. We'll remind you before it begins.`,
    )
  );
  await Promise.allSettled(promises);
}
