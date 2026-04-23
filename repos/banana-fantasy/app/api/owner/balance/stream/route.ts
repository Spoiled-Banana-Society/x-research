import { createPublicClient, http, type Address } from 'viem';

import { BASE, BASE_RPC_URL, BBB4_ABI, BBB4_CONTRACT_ADDRESS } from '@/lib/contracts/bbb4';
import { getAdminFirestore, isFirestoreConfigured } from '@/lib/firebaseAdmin';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';
// SSE must run on the Node runtime (edge lacks firebase-admin).
export const runtime = 'nodejs';

const USERS_COLLECTION = 'v2_users';
const WALLET_REGEX = /^0x[0-9a-fA-F]{40}$/;

// Vercel serverless functions time out (60s on Pro). We proactively close
// slightly before that so EventSource cleanly reconnects instead of the
// platform killing us mid-stream. The client auto-reconnects transparently.
const STREAM_LIFETIME_MS = 55_000;
const KEEPALIVE_INTERVAL_MS = 15_000;

const onchainClient = createPublicClient({ chain: BASE, transport: http(BASE_RPC_URL) });

interface BalancePayload {
  wheelSpins: number;
  freeDrafts: number;
  jackpotEntries: number;
  hofEntries: number;
  draftPasses: number;
  cardPurchaseCount: number;
}

function buildPayload(data: Record<string, unknown> | undefined, onchainPasses: number | null): BalancePayload {
  const d = data ?? {};
  const cachedPasses = (d.draftPasses as number | undefined) ?? 0;
  return {
    wheelSpins: (d.wheelSpins as number | undefined) ?? 0,
    freeDrafts: (d.freeDrafts as number | undefined) ?? 0,
    jackpotEntries: (d.jackpotEntries as number | undefined) ?? 0,
    hofEntries: (d.hofEntries as number | undefined) ?? 0,
    // Prefer on-chain when available; fall back to Firestore cache. On-chain
    // is always the authoritative source for BBB4 pass ownership.
    draftPasses: onchainPasses ?? cachedPasses,
    cardPurchaseCount: (d.cardPurchaseCount as number | undefined) ?? 0,
  };
}

/**
 * GET /api/owner/balance/stream?userId=<wallet>
 *
 * Server-Sent Events stream of a user's balance. Pushed to the client:
 *   - Initial snapshot on connect (combined Firestore + on-chain balanceOf).
 *   - Any Firestore write to v2_users/{userId} (from Alchemy webhook,
 *     balance endpoint writethrough, admin grants, spin mints, etc.).
 *   - Periodic on-chain refresh (covers the rare case where an Alchemy
 *     webhook is delayed).
 *
 * Replaces the 15s client-side polling. Typical push latency: <200ms
 * from the moment an on-chain event is confirmed to the UI updating.
 * This is the pattern Coinbase / OpenSea / Rainbow use for real-time
 * wallet state: server listens to truth, pushes to client on change.
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const userId = (searchParams.get('userId') ?? '').trim().toLowerCase();
  if (!userId) {
    return new Response('Missing userId', { status: 400 });
  }

  if (!isFirestoreConfigured()) {
    // Degraded mode: send one empty snapshot and close.
    const empty: BalancePayload = {
      wheelSpins: 0, freeDrafts: 0, jackpotEntries: 0, hofEntries: 0, draftPasses: 0, cardPurchaseCount: 0,
    };
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode(`event: snapshot\ndata: ${JSON.stringify(empty)}\n\n`));
        controller.close();
      },
    });
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
      },
    });
  }

  const db = getAdminFirestore();
  const userRef = db.collection(USERS_COLLECTION).doc(userId);
  const encoder = new TextEncoder();

  // Local helper: read BBB4.balanceOf on-chain. Quiet on failure — we'll fall
  // back to the cached value in that case.
  const readOnchain = async (): Promise<number | null> => {
    if (!WALLET_REGEX.test(userId)) return null;
    try {
      const v = await onchainClient.readContract({
        address: BBB4_CONTRACT_ADDRESS,
        abi: BBB4_ABI,
        functionName: 'balanceOf',
        args: [userId as Address],
      });
      return Number(v);
    } catch (err) {
      logger.debug('balance.stream.onchain_read_failed', { userId, err: (err as Error).message });
      return null;
    }
  };

  const stream = new ReadableStream({
    async start(controller) {
      let closed = false;
      const send = (event: string, payload: unknown) => {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`));
        } catch {
          closed = true;
        }
      };

      // 1. Initial snapshot — combine Firestore + on-chain for immediate truth.
      try {
        const [snap, onchainPasses] = await Promise.all([userRef.get(), readOnchain()]);
        const data = snap.exists ? (snap.data() ?? {}) : {};
        send('snapshot', buildPayload(data, onchainPasses));
      } catch (err) {
        logger.warn('balance.stream.initial_failed', { userId, err: (err as Error).message });
      }

      // 2. Real-time Firestore listener on the user doc. Fires the microsecond
      //    an Alchemy webhook / balance writethrough / admin action changes the
      //    doc. Each change triggers a fresh on-chain read so draftPasses
      //    always reflects truth, not a stale Firestore counter.
      const unsubscribe = userRef.onSnapshot(
        async (snap) => {
          const data = snap.exists ? (snap.data() ?? {}) : {};
          const onchainPasses = await readOnchain();
          send('update', buildPayload(data, onchainPasses));
        },
        (err) => {
          logger.warn('balance.stream.snapshot_err', { userId, err: err.message });
        },
      );

      // 3. Keepalive ping every 15s so proxies don't drop the connection.
      const keepalive = setInterval(() => {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(`: ping ${Date.now()}\n\n`));
        } catch {
          closed = true;
        }
      }, KEEPALIVE_INTERVAL_MS);

      // 4. Graceful close before Vercel's serverless timeout. Client EventSource
      //    reconnects automatically, so the user never sees a gap.
      const lifetime = setTimeout(() => {
        if (closed) return;
        closed = true;
        try { unsubscribe(); } catch { /* ignore */ }
        clearInterval(keepalive);
        try { controller.close(); } catch { /* ignore */ }
      }, STREAM_LIFETIME_MS);

      // 5. Client disconnect cleanup.
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
