import { NextRequest, NextResponse } from 'next/server';
import { getAdminApp } from '@/lib/firebaseAdmin';

const DRAFTS_API_URL = process.env.NEXT_PUBLIC_STAGING_DRAFTS_API_URL
  || 'https://sbs-drafts-api-staging-652484219017.us-central1.run.app';

/**
 * GET /api/drafts/league-players?draftId=xxx
 *
 * Returns the current player count for a draft. Primary source is Firebase
 * RTDB `drafts/{draftId}/numPlayers` which the Go API writes on every join.
 *
 * Fallback: RTDB numPlayers is sometimes stale (fill-bots paths don't always
 * update it). Whenever RTDB reports < 10 OR the RTDB read fails entirely, we
 * also check the Go API's /state/info — if it has a full draftOrder and
 * draftStartTime we report 10; otherwise we take max(RTDB, order length).
 *
 * Only returns 502 when BOTH RTDB and Go /state/info fail or are silent, so a
 * transient RTDB outage doesn't take down the drafting page's filling poll.
 */
export async function GET(req: NextRequest) {
  const draftId = req.nextUrl.searchParams.get('draftId');
  if (!draftId) {
    return NextResponse.json({ error: 'Missing draftId' }, { status: 400 });
  }

  // Step 1 — RTDB read. Any failure here just leaves rtdbPlayers=0 and falls
  // through to the Go fallback below. Isolated try/catch so it can't short
  // circuit the route on a transient network/auth blip.
  let rtdbPlayers = 0;
  let rtdbOk = false;
  try {
    const app = getAdminApp();
    const credential = app.options.credential;
    const token = await credential?.getAccessToken();
    const rtdbUrl = `https://sbs-staging-env-default-rtdb.firebaseio.com/drafts/${encodeURIComponent(draftId)}/numPlayers.json`;
    const res = await fetch(`${rtdbUrl}?access_token=${token?.access_token}`, { cache: 'no-store' });
    if (res.ok) {
      const val = await res.json();
      if (typeof val === 'number') {
        rtdbPlayers = val;
        rtdbOk = true;
      } else if (val === null) {
        // RTDB null = key absent (draft filling hasn't written yet). That's a
        // normal state, not an error; keep numPlayers=0 and still attempt Go.
        rtdbOk = true;
      }
    }
  } catch (rtdbErr) {
    console.warn('[league-players] RTDB read failed, will try Go fallback:', rtdbErr);
  }

  let numPlayers = rtdbPlayers;

  // Step 2 — Go /state/info fallback. Runs when RTDB says <10 (including the
  // "not yet written" 0 case) OR when the RTDB read itself failed. If Go
  // shows the draft has started (full draftOrder + draftStartTime) we report
  // 10 so the drafting page can transition out of filling even if RTDB is
  // behind. Otherwise we take whichever source is higher.
  let goOk = false;
  if (numPlayers < 10) {
    try {
      const infoRes = await fetch(
        `${DRAFTS_API_URL}/draft/${encodeURIComponent(draftId)}/state/info`,
        { cache: 'no-store' },
      );
      if (infoRes.ok) {
        const info = await infoRes.json();
        const orderLen = Array.isArray(info?.draftOrder) ? info.draftOrder.length : 0;
        if (orderLen >= 10 && Number(info?.draftStartTime) > 0) {
          numPlayers = 10;
        } else if (orderLen > numPlayers) {
          numPlayers = orderLen;
        }
        goOk = true;
      } else if (infoRes.status === 404) {
        // Go responded but no draft-state doc exists yet — normal for filling
        // drafts. We trust the RTDB value in this case (or 0 if it was silent).
        goOk = true;
      }
    } catch (goErr) {
      console.warn('[league-players] Go /state/info fallback failed:', goErr);
    }
  }

  // If both sources failed with no usable signal, 502. Otherwise return
  // whatever we got — 0 is a valid "draft exists but nobody's joined yet"
  // signal that callers handle gracefully.
  if (!rtdbOk && !goOk) {
    return NextResponse.json({ error: 'Failed to read draft state' }, { status: 502 });
  }

  return NextResponse.json({ numPlayers, players: [] });
}
