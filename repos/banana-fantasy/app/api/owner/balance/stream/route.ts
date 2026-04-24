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

function buildPayload(
  data: Record<string, unknown> | undefined,
  onchainPasses: number | null,
): BalancePayload {
  const d = data ?? {};
  const cachedPasses = (d.draftPasses as number | undefined) ?? 0;
  // Firestore is the user-facing source of truth — every mint / grant /
  // promo / draft-entry endpoint writes through to v2_users/{userId}, and
  // those writes drive this stream. On-chain BBB4.balanceOf is a one-shot
  // drift detector on connect; if it's strictly higher than the cache we
  // ratchet up. We never ratchet down because BBB4 doesn't burn on use,
  // so balanceOf includes used NFTs.
  const draftPasses = onchainPasses != null && onchainPasses > cachedPasses
    ? onchainPasses
    : cachedPasses;
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
 *   - Initial snapshot on connect (Firestore cache + one on-chain drift check).
 *   - Any Firestore write to v2_users/{userId} (from mint endpoints, admin
 *     grants, spin transactions, draft-entry burns, Alchemy webhook, etc.).
 *
 * Replaces the 15s client-side polling. Typical push latency: <200ms from
 * the moment a Firestore write commits to the UI updating.
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

      // 1. Initial snapshot — read on-chain ONCE here as a drift check.
      //    Subsequent updates come from Firestore onSnapshot — every code
      //    path that affects draftPasses writes through to Firestore, so
      //    we don't need to keep polling on-chain within this connection.
      let firstSnapshotSent = false;
      try {
        const [snap, onchainPasses] = await Promise.all([userRef.get(), readOnchain()]);
        const data = snap.exists ? (snap.data() ?? {}) : {};
        const cachedPasses = (data.draftPasses as number | undefined) ?? 0;

        // If on-chain is strictly higher than Firestore, a webhook may have
        // missed a recent mint — write through up so subsequent onSnapshot
        // events show the right value.
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
      //    Firestore is the single authoritative source within this
      //    connection's lifetime — we don't re-read on-chain per update.
      const unsubscribe = userRef.onSnapshot(
        (snap) => {
          // Skip the very first onSnapshot fire — Firestore always emits
          // an initial value when subscribing, but we already sent that
          // above as the `snapshot` event.
          if (!firstSnapshotSent) {
            firstSnapshotSent = true;
            return;
          }
          const data = snap.exists ? (snap.data() ?? {}) : {};
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
