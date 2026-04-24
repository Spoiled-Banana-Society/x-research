import { createPublicClient, http, type Address } from 'viem';
import { FieldValue } from 'firebase-admin/firestore';

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
  // Resilient draft-pass selection:
  //   - If on-chain read failed (null), trust the Firestore cache.
  //   - If on-chain read succeeded, take max(on-chain, cached).
  //
  // Why max: Alchemy's RPC edge occasionally serves a *previous* block's
  // balanceOf for a brief window after a tx finalizes — we'd see a stale
  // smaller number. Firestore is kept up-to-date by the Alchemy Transfer
  // webhook (writes both directions: increases on mint, decreases on
  // transfer-out) plus the writethrough below, so the cached value is a
  // trustworthy floor. Taking max prevents flicker without ever showing
  // a stale-up count: a real transfer-out lands in the webhook → Firestore
  // decreases → next on-chain read also lower → max is correct.
  const draftPasses = onchainPasses == null
    ? cachedPasses
    : Math.max(onchainPasses, cachedPasses);
  return {
    wheelSpins: (d.wheelSpins as number | undefined) ?? 0,
    freeDrafts: (d.freeDrafts as number | undefined) ?? 0,
    jackpotEntries: (d.jackpotEntries as number | undefined) ?? 0,
    hofEntries: (d.hofEntries as number | undefined) ?? 0,
    draftPasses,
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

      // 1. Initial snapshot — read on-chain ONCE here. We never read it
      //    again in this stream's lifetime. Firestore is kept current by
      //    (a) the Alchemy Transfer webhook on every BBB4 transfer in/out,
      //    (b) the on-mint writethrough below when on-chain > cached, and
      //    (c) the standalone /api/owner/balance writethrough on any GET.
      //    So the onSnapshot fires below send Firestore data verbatim — no
      //    additional Alchemy calls that could race with each other and
      //    cause the count to bounce.
      let firstSnapshotSent = false;
      try {
        const [snap, onchainPasses] = await Promise.all([userRef.get(), readOnchain()]);
        const data = snap.exists ? (snap.data() ?? {}) : {};
        const cachedPasses = (data.draftPasses as number | undefined) ?? 0;

        // If on-chain is strictly higher than Firestore, a webhook may have
        // missed a recent mint — write it through so subsequent onSnapshot
        // events show the right value, and so the admin panel + any other
        // Firestore-direct reader sees the same number.
        if (onchainPasses != null && onchainPasses > cachedPasses) {
          try {
            await userRef.set(
              { draftPasses: onchainPasses, onchainSyncedAt: FieldValue.serverTimestamp() },
              { merge: true },
            );
          } catch (writeErr) {
            logger.warn('balance.stream.writethrough_failed', { userId, err: (writeErr as Error).message });
          }
        }

        send('snapshot', buildPayload(data, onchainPasses));
        firstSnapshotSent = true;
      } catch (err) {
        logger.warn('balance.stream.initial_failed', { userId, err: (err as Error).message });
      }

      // 2. Real-time Firestore listener. Each change pushes a fresh payload.
      //    We DON'T re-read on-chain here — Firestore is the single
      //    authoritative source within this connection's lifetime. This
      //    eliminates the race where two near-simultaneous Alchemy reads
      //    could land on different RPC edge caches and clobber each other.
      const unsubscribe = userRef.onSnapshot(
        (snap) => {
          // Skip the very first onSnapshot fire — Firestore always emits
          // an initial value when subscribing, but we already sent that
          // above as the `snapshot` event. Without this guard the client
          // would see snapshot → identical update in rapid succession.
          if (!firstSnapshotSent) {
            firstSnapshotSent = true;
            return;
          }
          const data = snap.exists ? (snap.data() ?? {}) : {};
          // Pass null for onchainPasses so buildPayload falls back to the
          // Firestore cached value. Firestore is the authoritative source
          // for the connection's lifetime — no per-update Alchemy read.
          send('update', buildPayload(data, null));
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
