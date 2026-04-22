import { NextRequest, NextResponse } from 'next/server';
import { getAdminFirestore, isFirestoreConfigured } from '@/lib/firebaseAdmin';
import { FieldValue } from 'firebase-admin/firestore';
import { logger } from '@/lib/logger';

const COLLECTION = 'notificationSubscriptions';

/**
 * POST /api/notifications/subscribe
 * Persists a user's OneSignal player ID keyed by their wallet address so
 * server-side code (cron jobs, pick-up handlers, queue triggers) can look up
 * the playerId and fire targeted pushes.
 *
 * Body: { walletAddress: string, playerId: string }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const walletAddress = typeof body.walletAddress === 'string' ? body.walletAddress.trim().toLowerCase() : '';
    const playerId = typeof body.playerId === 'string' ? body.playerId.trim() : '';

    if (!walletAddress) {
      return NextResponse.json({ error: 'walletAddress required' }, { status: 400 });
    }
    if (!playerId) {
      return NextResponse.json({ error: 'playerId required' }, { status: 400 });
    }

    if (!isFirestoreConfigured()) {
      logger.debug(`[notifications/subscribe] firestore not configured — logging only wallet=${walletAddress} playerId=${playerId}`);
      return NextResponse.json({ ok: true, persisted: false });
    }

    const db = getAdminFirestore();
    await db.collection(COLLECTION).doc(walletAddress).set(
      {
        walletAddress,
        playerId,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );

    return NextResponse.json({ ok: true, persisted: true });
  } catch (err) {
    console.error('[notifications/subscribe] Error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

/**
 * DELETE /api/notifications/subscribe?walletAddress=0x...
 * Removes the subscription when a user opts out.
 */
export async function DELETE(req: NextRequest) {
  try {
    const walletAddress = (req.nextUrl.searchParams.get('walletAddress') || '').trim().toLowerCase();
    if (!walletAddress) {
      return NextResponse.json({ error: 'walletAddress required' }, { status: 400 });
    }
    if (!isFirestoreConfigured()) {
      return NextResponse.json({ ok: true, persisted: false });
    }
    const db = getAdminFirestore();
    await db.collection(COLLECTION).doc(walletAddress).delete();
    return NextResponse.json({ ok: true, persisted: true });
  } catch (err) {
    console.error('[notifications/subscribe DELETE] Error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
