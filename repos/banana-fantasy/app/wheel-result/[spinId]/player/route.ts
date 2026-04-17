import { getAdminFirestore, isFirestoreConfigured } from '@/lib/firebaseAdmin';

export const dynamic = 'force-dynamic';

interface WheelSpinDoc {
  result: string;
}

async function fetchSpin(spinId: string): Promise<WheelSpinDoc | null> {
  if (!isFirestoreConfigured()) return null;
  try {
    const db = getAdminFirestore();
    const snap = await db.collection('wheelSpins').doc(spinId).get();
    if (!snap.exists) return null;
    return snap.data() as WheelSpinDoc;
  } catch {
    return null;
  }
}

function videoFor(result: string): string | null {
  if (result === 'jackpot') return '/slots/jackpot.mp4';
  if (result === 'hof') return '/slots/hof.mp4';
  return null;
}

export async function GET(_req: Request, { params }: { params: { spinId: string } }) {
  const spin = await fetchSpin(params.spinId);
  const src = spin ? videoFor(spin.result) : null;

  if (!src) {
    return new Response('Not Found', { status: 404 });
  }

  const html = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>SBS Fantasy</title>
    <style>
      html, body { margin: 0; padding: 0; background: #000; width: 100%; height: 100%; overflow: hidden; }
      video { width: 100%; height: 100%; object-fit: contain; }
    </style>
  </head>
  <body>
    <video src="${src}" autoplay loop muted playsinline></video>
  </body>
</html>`;

  return new Response(html, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, max-age=600',
    },
  });
}
