import { NextRequest, NextResponse } from 'next/server';

const DRAFTS_API = process.env.DRAFTS_API_URL || 'http://localhost:7070';

/**
 * GET /api/rng/verify?eventId=xxx
 * Proxies to sbs-drafts-api RNG verification endpoint.
 */
export async function GET(req: NextRequest) {
  const eventId = req.nextUrl.searchParams.get('eventId');

  if (!eventId) {
    return NextResponse.json({ error: 'Missing eventId' }, { status: 400 });
  }

  try {
    const res = await fetch(`${DRAFTS_API}/rng/check/${encodeURIComponent(eventId)}`);

    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json({ error: text || 'Verification failed' }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
