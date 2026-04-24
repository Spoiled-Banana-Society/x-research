import { NextRequest, NextResponse } from 'next/server';
import { getAdminApp } from '@/lib/firebaseAdmin';

const DRAFTS_API_URL = process.env.NEXT_PUBLIC_STAGING_DRAFTS_API_URL
  || 'https://sbs-drafts-api-staging-652484219017.us-central1.run.app';

/**
 * GET /api/drafts/league-players?draftId=xxx
 *
 * Reads Firebase RTDB for the current player count.
 * The Go API writes numPlayers to RTDB at drafts/{draftId}/numPlayers on every join.
 *
 * Fallback: RTDB numPlayers is sometimes stale (backend bug: fill-bots doesn't always
 * update it to 10 when the draft starts). If RTDB reports <10, also check the Go API's
 * /state/info — if it has 10 draftOrder entries and a draftStartTime, return 10 so the
 * frontend can transition out of the filling phase.
 */
export async function GET(req: NextRequest) {
  const draftId = req.nextUrl.searchParams.get('draftId');
  if (!draftId) {
    return NextResponse.json({ error: 'Missing draftId' }, { status: 400 });
  }

  try {
    const app = getAdminApp();
    const credential = app.options.credential;
    const token = await credential?.getAccessToken();

    const rtdbUrl = `https://sbs-staging-env-default-rtdb.firebaseio.com/drafts/${encodeURIComponent(draftId)}/numPlayers.json`;
    const res = await fetch(`${rtdbUrl}?access_token=${token?.access_token}`, { cache: 'no-store' });
    const val = await res.json();
    let numPlayers = typeof val === 'number' ? val : 0;

    if (numPlayers < 10) {
      try {
        const infoRes = await fetch(
          `${DRAFTS_API_URL}/draft/${encodeURIComponent(draftId)}/state/info`,
          { cache: 'no-store' }
        );
        if (infoRes.ok) {
          const info = await infoRes.json();
          const orderLen = Array.isArray(info?.draftOrder) ? info.draftOrder.length : 0;
          if (orderLen >= 10 && Number(info?.draftStartTime) > 0) {
            numPlayers = 10;
          } else if (orderLen > numPlayers) {
            numPlayers = orderLen;
          }
        }
      } catch { /* ignore — fall back to RTDB value */ }
    }

    return NextResponse.json({ numPlayers, players: [] });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[league-players] RTDB error:', msg);
    return NextResponse.json({ numPlayers: 0, players: [], debug: `error:${msg}` }, { status: 200 });
  }
}
