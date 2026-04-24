import { NextRequest, NextResponse } from 'next/server';
import { getAdminFirestore, isFirestoreConfigured } from '@/lib/firebaseAdmin';
import { FieldValue } from 'firebase-admin/firestore';
import { logger } from '@/lib/logger';

const ONESIGNAL_APP_ID = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID;
const ONESIGNAL_REST_API_KEY = process.env.ONESIGNAL_REST_API_KEY;
const SENT_COLLECTION = 'notificationsSent';

/**
 * POST /api/notifications/pick-up
 * Fires a "your pick is up" push to a user via OneSignal, targeted by their
 * walletAddress tag (set during opt-in).
 *
 * Body: {
 *   walletAddress: string,
 *   draftId: string,
 *   draftName?: string,
 *   pickNumber?: number,     // for dedup; only send once per (wallet, draft, pick)
 *   pickLengthSeconds?: number, // e.g. 28800 for slow; used for push TTL + copy
 * }
 */
export async function POST(req: NextRequest) {
  try {
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

    // Server-side dedup: only send once per (wallet, draftId, pickNumber). Any
    // client that sees the same pick event won't double-fire.
    if (isFirestoreConfigured() && pickNumber != null) {
      const db = getAdminFirestore();
      const dedupId = `${walletAddress}__${draftId}__${pickNumber}`;
      const ref = db.collection(SENT_COLLECTION).doc(dedupId);
      const existing = await ref.get();
      if (existing.exists) {
        return NextResponse.json({ ok: true, deduped: true });
      }
      await ref.set({
        walletAddress,
        draftId,
        pickNumber,
        sentAt: FieldValue.serverTimestamp(),
      });
    }

    // Timer copy: "You're on the clock — 8 hours to pick" for slow, "30 seconds" for fast.
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

    // TTL: expire the push if the user doesn't pick it up before the timer runs out.
    // Fall back to 10 minutes if we don't know the pick length.
    const ttl = pickLengthSeconds ?? 600;

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
        chrome_web_badge: '/banana-icon-192.png',
        chrome_web_icon: '/banana-icon-192.png',
        ttl,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error('[pick-up] OneSignal error:', response.status, errorBody);
      return NextResponse.json({ error: 'Failed to send notification' }, { status: 502 });
    }

    const result = await response.json();
    logger.debug(
      `[pick-up] sent wallet=${walletAddress} draft=${draftId} pick=${pickNumber ?? '?'} recipients=${result.recipients}`,
    );

    return NextResponse.json({ ok: true, recipients: result.recipients ?? 0 });
  } catch (err) {
    console.error('[pick-up] Error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
