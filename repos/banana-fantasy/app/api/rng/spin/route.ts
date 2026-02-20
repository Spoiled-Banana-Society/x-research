import { NextRequest, NextResponse } from 'next/server';

const DRAFTS_API = process.env.DRAFTS_API_URL || 'http://localhost:7070';

/**
 * POST /api/rng/spin
 * Proxies to sbs-drafts-api SpinWheel RNG endpoint.
 * Body: { spinId, clientSeed, prizes, weights }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { spinId, clientSeed, prizes, weights } = body;

    if (!spinId || !clientSeed) {
      return NextResponse.json({ error: 'Missing spinId or clientSeed' }, { status: 400 });
    }

    const res = await fetch(`${DRAFTS_API}/rng/spin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ spinId, clientSeed, prizes, weights }),
    });

    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json({ error: text || 'RNG spin failed' }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
