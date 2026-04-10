import { NextRequest, NextResponse } from 'next/server';
import { getAdminApp } from '@/lib/firebaseAdmin';

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
    // Use REST API with service account OAuth token to read RTDB
    // This bypasses security rules (admin access)
    const app = getAdminApp();
    const credential = app.options.credential;
    const token = await credential?.getAccessToken();

    const rtdbUrl = `https://sbs-staging-env-default-rtdb.firebaseio.com/drafts/${encodeURIComponent(draftId)}/numPlayers.json`;
    const res = await fetch(`${rtdbUrl}?access_token=${token?.access_token}`, { cache: 'no-store' });
    const val = await res.json();
    const numPlayers = typeof val === 'number' ? val : 0;

    return NextResponse.json({ numPlayers, players: [] });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[league-players] RTDB error:', msg);
    return NextResponse.json({ numPlayers: 0, players: [], debug: `error:${msg}` }, { status: 200 });
  }
}
