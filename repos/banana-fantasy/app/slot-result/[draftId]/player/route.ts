export const dynamic = 'force-dynamic';

function videoFor(type: string | null): string | null {
  if (type === 'hof') return '/slots/hof.mp4';
  if (type === 'jackpot') return '/slots/jackpot.mp4';
  return '/slots/jackpot.mp4';
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const type = url.searchParams.get('type');
  const src = videoFor(type);

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
