import { createPublicClient, http, type Address } from 'viem';
import { FieldValue } from 'firebase-admin/firestore';

import { BASE, BASE_RPC_URL, BBB4_ABI, BBB4_CONTRACT_ADDRESS } from '@/lib/contracts/bbb4';
import { getAdminFirestore, isFirestoreConfigured } from '@/lib/firebaseAdmin';
import { logger } from '@/lib/logger';
import { fetchGoApiAvailableCount } from '@/lib/onchain/reconcilePasses';

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
  goApiPasses: number | null,
  onchainPasses: number | null,
): BalancePayload {
  const d = data ?? {};
  const cachedPasses = (d.draftPasses as number | undefined) ?? 0;
  // Source-of-truth order for draftPasses:
  //   1. Go API "available" count — what the user can actually spend right
  //      now. Matches what getOwnerUser reads on the client. Handles staging
  //      mints (which never touch on-chain or Firestore) and prod mints
  //      (Go API is updated via webhook reconciliation).
  //   2. If Go API is unreachable, fall back to max(on-chain, cached).
  //   3. If on-chain also unreachable, fall back to cached Firestore.
  //
  // The old `max(on-chain, cached)` rule was unsafe because (a) on-chain
  // counts used + unused NFTs (BBB4 doesn't burn on use), and (b) staging
  // mints leave Firestore untouched, so the cache could ratchet upward
  // from prior testing and never come back down.
  let draftPasses: number;
  if (goApiPasses != null) {
    draftPasses = goApiPasses;
  } else if (onchainPasses != null) {
    draftPasses = Math.max(onchainPasses, cachedPasses);
  } else {
    draftPasses = cachedPasses;
  }
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

      // 1. Initial snapshot — Go API is the source of truth for draftPasses;
      //    on-chain is a fallback. Both are read once here. Firestore values
      //    for the other counters (wheelSpins, freeDrafts, etc.) come from
      //    the snapshot below and are pushed live via onSnapshot.
      let firstSnapshotSent = false;
      // Cache the Go API count for the connection's lifetime so onSnapshot
      // updates (which fire frequently for unrelated fields) don't make a
      // Go API call on every push. Refreshed on Firestore-write events that
      // could imply a pass count change (admin grants, spin mints, etc.).
      let lastGoApiCount: number | null = null;
      try {
        const [snap, goApiCount, onchainPasses] = await Promise.all([
          userRef.get(),
          fetchGoApiAvailableCount(userId),
          readOnchain(),
        ]);
        lastGoApiCount = goApiCount;
        const data = snap.exists ? (snap.data() ?? {}) : {};
        const cachedPasses = (data.draftPasses as number | undefined) ?? 0;

        // Drift writethrough: keep the Firestore cache aligned with the Go
        // API. Old code only ratcheted up; that left staging mints (Go-API
        // only) showing stale-high counts because Firestore was never
        // decremented. Now we sync in both directions whenever Go API is
        // reachable.
        if (goApiCount != null && goApiCount !== cachedPasses) {
          try {
            await userRef.set(
              { draftPasses: goApiCount, onchainSyncedAt: FieldValue.serverTimestamp() },
              { merge: true },
            );
          } catch (writeErr) {
            logger.warn('balance.stream.writethrough_failed', { userId, err: (writeErr as Error).message });
          }
        }

        send('snapshot', buildPayload(data, goApiCount, onchainPasses));
        firstSnapshotSent = true;
      } catch (err) {
        logger.warn('balance.stream.initial_failed', { userId, err: (err as Error).message });
      }

      // 2. Real-time Firestore listener. Each change pushes a fresh payload.
      //    We refresh the Go API count when Firestore writes happen because
      //    the writes that affect draftPasses (admin grants, spin mints,
      //    pass-burn during draft entry) all touch Firestore too. This keeps
      //    the per-update Go API hit infrequent and bounded by Firestore
      //    write frequency rather than firing on every snapshot.
      const unsubscribe = userRef.onSnapshot(
        async (snap) => {
          // Skip the very first onSnapshot fire — Firestore always emits
          // an initial value when subscribing, but we already sent that
          // above as the `snapshot` event. Without this guard the client
          // would see snapshot → identical update in rapid succession.
          if (!firstSnapshotSent) {
            firstSnapshotSent = true;
            return;
          }
          const data = snap.exists ? (snap.data() ?? {}) : {};
          // Refresh Go API count on each Firestore write so updates carry
          // the authoritative count. If the call fails, fall back to the
          // last known value rather than dropping back to the stale cache.
          const goApiCount = await fetchGoApiAvailableCount(userId);
          if (goApiCount != null) lastGoApiCount = goApiCount;
          send('update', buildPayload(data, lastGoApiCount, null));
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
