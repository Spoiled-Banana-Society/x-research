import { NextRequest, NextResponse } from 'next/server';
import { getAdminApp } from '@/lib/firebaseAdmin';
import { getDatabase } from 'firebase-admin/database';

/**
 * GET /api/drafts/league-players?draftId=xxx
 *
 * Reads Firebase RTDB for the current player count.
 * The Go API writes numPlayers to RTDB at drafts/{draftId}/numPlayers on every join.
 */
export async function GET(req: NextRequest) {
  const draftId = req.nextUrl.searchParams.get('draftId');
  if (!draftId) {
    return NextResponse.json({ error: 'Missing draftId' }, { status: 400 });
  }

  try {
    const app = getAdminApp();
    const rtdb = getDatabase(app, 'https://sbs-staging-env-default-rtdb.firebaseio.com');
    const snap = await rtdb.ref(`drafts/${draftId}/numPlayers`).get();
    const numPlayers = snap.exists() ? Number(snap.val()) || 0 : 0;

    return NextResponse.json({ numPlayers, players: [] });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[league-players] RTDB error:', msg);
    return NextResponse.json({ numPlayers: 0, players: [], debug: `error:${msg}` }, { status: 200 });
  }
}
