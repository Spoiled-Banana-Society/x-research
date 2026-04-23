'use client';

import { useEffect, useState } from 'react';

import type { ActivityEventType, WalletType, PaymentMethod, DevicePlatform } from '@/lib/activityEvents';

export interface LiveActivityEvent {
  id: string;
  type: ActivityEventType;
  userId: string;
  walletAddress: string;
  username: string | null;
  walletType: WalletType;
  paymentMethod: PaymentMethod;
  quantity: number;
  tokenIds: string[];
  txHash: string | null;
  metadata: Record<string, unknown>;
  devicePlatform: DevicePlatform;
  userAgent: string | null;
  createdAt: number | null;
  createdAtIso: string;
}

export interface UseActivityStreamResult {
  events: LiveActivityEvent[];
  isConnected: boolean;
  error: string | null;
}

/**
 * Subscribe to a Server-Sent Events activity stream. Accepts any URL that
 * returns `snapshot` events with `{ events: LiveActivityEvent[] }` payloads
 * — works for both the admin-wide `/api/admin/activity/stream` and the
 * per-user `/api/user/activity/stream?userId=…` endpoints.
 *
 * Handles:
 * - Auto-reconnect (built into EventSource).
 * - Graceful teardown on unmount / URL change.
 * - Returns `isConnected` so the UI can show a live indicator.
 */
export function useActivityStream(url: string | null): UseActivityStreamResult {
  const [events, setEvents] = useState<LiveActivityEvent[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!url) {
      setEvents([]);
      setIsConnected(false);
      return;
    }

    let cancelled = false;
    const es = new EventSource(url);

    const handleSnapshot = (ev: MessageEvent) => {
      try {
        const payload = JSON.parse(ev.data) as { events?: LiveActivityEvent[] };
        if (!cancelled && Array.isArray(payload.events)) {
          setEvents(payload.events);
          setIsConnected(true);
          setError(null);
        }
      } catch {
        /* malformed SSE data — ignore */
      }
    };

    es.addEventListener('snapshot', handleSnapshot);
    es.addEventListener('update', handleSnapshot);

    es.onopen = () => {
      if (!cancelled) {
        setIsConnected(true);
        setError(null);
      }
    };

    es.onerror = () => {
      if (!cancelled) {
        setIsConnected(false);
        setError('connection_error');
      }
    };

    return () => {
      cancelled = true;
      es.close();
      setIsConnected(false);
    };
  }, [url]);

  return { events, isConnected, error };
}
