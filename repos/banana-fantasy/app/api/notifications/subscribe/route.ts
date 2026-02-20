import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/notifications/subscribe
 * Stores a user's OneSignal player ID associated with their wallet address.
 * In production this would write to Firestore; for now it logs and returns success.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { walletAddress, playerId } = body;

    if (!walletAddress || typeof walletAddress !== 'string') {
      return NextResponse.json({ error: 'walletAddress required' }, { status: 400 });
    }
    if (!playerId || typeof playerId !== 'string') {
      return NextResponse.json({ error: 'playerId required' }, { status: 400 });
    }

    // TODO: Store in Firestore — notificationSubscriptions/{walletAddress}
    // For now, log subscription for backend wiring
    console.log(`[notifications/subscribe] wallet=${walletAddress} playerId=${playerId}`);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[notifications/subscribe] Error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
