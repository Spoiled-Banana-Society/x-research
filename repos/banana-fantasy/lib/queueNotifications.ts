/**
 * Send notifications for special draft queue events.
 * Uses the marketplace notifications API (Firestore-backed).
 */

const API_BASE = typeof window !== 'undefined' ? '' : (process.env.NEXT_PUBLIC_APP_URL || '');

async function sendNotification(wallet: string, type: string, title: string, message: string, link?: string) {
  try {
    await fetch(`${API_BASE}/api/marketplace/notifications`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ wallet, type, title, message, link: link || '/special-drafts' }),
    });
  } catch {}
}

/** Notify user they've been queued after picking speed */
export async function notifyQueueJoined(
  wallet: string,
  type: 'jackpot' | 'hof',
  speed: 'fast' | 'slow' | 'any',
  draftCount: number,
) {
  const label = type === 'jackpot' ? 'Jackpot' : 'HOF';
  const speedText = speed === 'any' ? 'either speed' : speed === 'fast' ? '30-second' : '8-hour';
  await sendNotification(
    wallet,
    `${type}_queue`,
    `${type === 'jackpot' ? '🔥' : '🏆'} ${label} Draft Queued!`,
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
  const speedText = speed === 'fast' ? '30-second' : '8-hour';
  const dateStr = new Date(scheduledTime).toLocaleString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric',
    hour: 'numeric', minute: '2-digit', hour12: true,
  });

  const promises = wallets.map(wallet =>
    sendNotification(
      wallet,
      `${type}_queue`,
      `${type === 'jackpot' ? '🔥' : '🏆'} ${label} Draft Scheduled!`,
      `10 winners are in! Your ${speedText} ${label} draft starts ${dateStr}. We'll remind you before it begins.`,
    )
  );
  await Promise.allSettled(promises);
}
