import { getAdminFirestore, isFirestoreConfigured } from '@/lib/firebaseAdmin';
import { ACTIVITY_EVENTS_COLLECTION } from '@/lib/activityEvents';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const STREAM_LIFETIME_MS = 55_000;
const KEEPALIVE_INTERVAL_MS = 15_000;
const PAGE_SIZE = 100;
const WALLET_REGEX = /^0x[0-9a-fA-F]{40}$/;

/**
 * GET /api/user/activity/stream?userId=<wallet>
 *
 * SSE stream of one user's activity events. Uses Firestore onSnapshot
 * with a userId filter so the user's profile history updates in real
 * time as new purchases, grants, spins, and promos land.
 *
 * Public by userId — no auth — because the user needs it on their own
 * profile page and the events themselves carry no secrets (everything
 * in the payload is derivable from on-chain data the user already owns).
 * Rate-limited by the general bucket.
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const userId = (searchParams.get('userId') ?? '').trim().toLowerCase();
  if (!userId || !WALLET_REGEX.test(userId)) {
    return new Response('Invalid userId', { status: 400 });
  }

  if (!isFirestoreConfigured()) {
    return new Response('Firestore not configured', { status: 503 });
  }

  const db = getAdminFirestore();
  const colRef = db
    .collection(ACTIVITY_EVENTS_COLLECTION)
    .where('userId', '==', userId)
    .orderBy('createdAt', 'desc')
    .limit(PAGE_SIZE);
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      let closed = false;
      const send = (event: string, payload: unknown) => {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`));
        } catch {
          closed = true;
        }
      };

      const unsubscribe = colRef.onSnapshot(
        (snap) => {
          const events = snap.docs.map((d) => {
            const data = d.data();
            return {
              id: d.id,
              ...data,
              createdAt: data.createdAt?.toMillis?.() ?? null,
            };
          });
          send('snapshot', { events });
        },
        (err) => {
          logger.warn('user.activity.stream.err', { userId, err: err.message });
        },
      );

      const keepalive = setInterval(() => {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(`: ping ${Date.now()}\n\n`));
        } catch {
          closed = true;
        }
      }, KEEPALIVE_INTERVAL_MS);

      const lifetime = setTimeout(() => {
        if (closed) return;
        closed = true;
        try { unsubscribe(); } catch { /* ignore */ }
        clearInterval(keepalive);
        try { controller.close(); } catch { /* ignore */ }
      }, STREAM_LIFETIME_MS);

      req.signal.addEventListener('abort', () => {
        if (closed) return;
        closed = true;
        try { unsubscribe(); } catch { /* ignore */ }
        clearInterval(keepalive);
        clearTimeout(lifetime);
        try { controller.close(); } catch { /* ignore */ }
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
