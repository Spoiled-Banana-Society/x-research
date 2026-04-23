import { NextRequest, NextResponse } from 'next/server';
import { getAdminFirestore, isFirestoreConfigured } from '@/lib/firebaseAdmin';
import { FieldValue } from 'firebase-admin/firestore';
import { getPrivyUser } from '@/lib/auth';
import { logger } from '@/lib/logger';

const ONESIGNAL_APP_ID = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID;
const ONESIGNAL_REST_API_KEY = process.env.ONESIGNAL_REST_API_KEY;
// Shared secret for server-to-server callers (the Cloud Function). If unset,
// the route still accepts authenticated Privy users, but server callers are
// blocked — set this in Vercel env to enable the backend trigger path.
const INTERNAL_SECRET = process.env.NOTIFICATIONS_INTERNAL_SECRET;
const SENT_COLLECTION = 'notificationsSent';

/**
 * Callers must be either:
 *   (a) an authenticated Privy user (client-side trigger from a tab watching
 *       the draft) — we rely on the user being logged in, not on them being
 *       the next drafter, because the current drafter can't push to themself
 *       and dedup handles the rest
 *   (b) an internal server caller presenting the X-Internal-Secret header
 *       (the Cloud Function listening on RTDB)
 * If neither, 401. Prevents a random caller from spamming pushes to any
 * wallet via guessed (draftId, pickNumber) pairs.
 */
async function authorize(req: NextRequest): Promise<{ ok: true } | { ok: false; status: number; error: string }> {
  const secretHeader = req.headers.get('x-internal-secret');
  if (INTERNAL_SECRET && secretHeader && secretHeader === INTERNAL_SECRET) {
    return { ok: true };
  }
  try {
    await getPrivyUser(req);
    return { ok: true };
  } catch {
    return { ok: false, status: 401, error: 'Unauthorized' };
  }
}

/**
 * POST /api/notifications/pick-up
 * Fires a "your pick is up" push to a user via OneSignal, targeted by their
 * lowercased walletAddress tag (set during opt-in).
 *
 * Body: {
 *   walletAddress: string,
 *   draftId: string,
 *   draftName?: string,
 *   pickNumber?: number,      // for dedup; only send once per (wallet, draft, pick)
 *   pickLengthSeconds?: number, // e.g. 28800 for slow; used for push TTL + copy
 * }
 *
 * Dedup is atomic: we try to CREATE a dedup doc first; if it already exists
 * (concurrent caller got there) we exit early without sending. We then send
 * the push and flag the doc as delivered. A transient OneSignal failure
 * marks the doc as failed instead of poisoning forever, so a retry can
 * still go through after the TTL expires.
 */
export async function POST(req: NextRequest) {
  try {
    const auth = await authorize(req);
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

    if (!ONESIGNAL_APP_ID || !ONESIGNAL_REST_API_KEY) {
      return NextResponse.json({ error: 'OneSignal not configured' }, { status: 503 });
    }

    const body = await req.json();
    const walletAddress = typeof body.walletAddress === 'string' ? body.walletAddress.trim().toLowerCase() : '';
    const draftId = typeof body.draftId === 'string' ? body.draftId.trim() : '';
    const draftName = typeof body.draftName === 'string' ? body.draftName : '';
    const pickNumber = Number.isFinite(body.pickNumber) ? Number(body.pickNumber) : null;
    const pickLengthSeconds = Number.isFinite(body.pickLengthSeconds)
      ? Number(body.pickLengthSeconds)
      : null;

    if (!walletAddress) return NextResponse.json({ error: 'walletAddress required' }, { status: 400 });
    if (!draftId) return NextResponse.json({ error: 'draftId required' }, { status: 400 });

    // Atomic dedup via Firestore create(). Only the first concurrent caller
    // lands the doc; others bounce out with AlreadyExists.
    let dedupRef: FirebaseFirestore.DocumentReference | null = null;
    if (isFirestoreConfigured() && pickNumber != null) {
      const db = getAdminFirestore();
      const dedupId = `${walletAddress}__${draftId}__${pickNumber}`;
      dedupRef = db.collection(SENT_COLLECTION).doc(dedupId);
      try {
        await dedupRef.create({
          walletAddress,
          draftId,
          pickNumber,
          status: 'pending',
          startedAt: FieldValue.serverTimestamp(),
        });
      } catch {
        // AlreadyExists — another caller is handling (or already handled) this pick.
        return NextResponse.json({ ok: true, deduped: true });
      }
    }

    const timerCopy = pickLengthSeconds
      ? pickLengthSeconds >= 3600
        ? `${Math.round(pickLengthSeconds / 3600)} hours`
        : `${pickLengthSeconds} seconds`
      : null;

    const title = '🍌 You\'re on the clock!';
    const message = draftName
      ? timerCopy
        ? `${draftName} — tap to pick. ${timerCopy} before it auto-drafts.`
        : `${draftName} — tap to pick.`
      : timerCopy
        ? `Your pick is up. ${timerCopy} before it auto-drafts.`
        : 'Your pick is up — tap to pick.';

    const ttl = pickLengthSeconds ?? 600;

    try {
      const response = await fetch('https://onesignal.com/api/v1/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Basic ${ONESIGNAL_REST_API_KEY}`,
        },
        body: JSON.stringify({
          app_id: ONESIGNAL_APP_ID,
          filters: [
            { field: 'tag', key: 'walletAddress', relation: '=', value: walletAddress },
          ],
          headings: { en: title },
          contents: { en: message },
          url: `${process.env.NEXT_PUBLIC_APP_URL ?? 'https://banana-fantasy-sbs.vercel.app'}/draft-room?id=${draftId}`,
          chrome_web_badge: '/icons/icon-192.png',
          chrome_web_icon: '/icons/icon-192.png',
          ttl,
        }),
      });

      if (!response.ok) {
        const errorBody = await response.text().catch(() => '');
        console.error('[pick-up] OneSignal error:', response.status, errorBody);
        // Flag the dedup doc as failed so a future retry isn't permanently blocked.
        if (dedupRef) {
          await dedupRef.set({ status: 'failed', failedAt: FieldValue.serverTimestamp() }, { merge: true }).catch(() => {});
        }
        return NextResponse.json({ error: 'Failed to send notification' }, { status: 502 });
      }

      const result = await response.json();
      if (dedupRef) {
        await dedupRef.set(
          { status: 'sent', sentAt: FieldValue.serverTimestamp(), recipients: result.recipients ?? 0 },
          { merge: true },
        ).catch(() => {});
      }
      logger.debug(
        `[pick-up] sent wallet=${walletAddress} draft=${draftId} pick=${pickNumber ?? '?'} recipients=${result.recipients}`,
      );
      return NextResponse.json({ ok: true, recipients: result.recipients ?? 0 });
    } catch (sendErr) {
      console.error('[pick-up] send threw:', sendErr);
      if (dedupRef) {
        await dedupRef.set({ status: 'failed', failedAt: FieldValue.serverTimestamp() }, { merge: true }).catch(() => {});
      }
      return NextResponse.json({ error: 'Failed to send notification' }, { status: 502 });
    }
  } catch (err) {
    console.error('[pick-up] Error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
