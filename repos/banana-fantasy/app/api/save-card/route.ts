import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get('url');
  if (!url) {
    return NextResponse.json({ error: 'Missing url parameter' }, { status: 400 });
  }

  // Only allow GCS image URLs
  if (!url.startsWith('https://storage.googleapis.com/')) {
    return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });
  }

  try {
    const res = await fetch(url);
    if (!res.ok) {
      return NextResponse.json({ error: 'Failed to fetch image' }, { status: 502 });
    }

    const blob = await res.blob();
    const headers = new Headers();
    headers.set('Content-Type', blob.type || 'image/png');
    headers.set('Content-Disposition', 'attachment; filename="sbs-team-card.png"');

    return new NextResponse(blob, { headers });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch image' }, { status: 500 });
  }
}
