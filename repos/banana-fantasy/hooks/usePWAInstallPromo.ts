'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { pushNotification } from '@/components/NotificationCenter';

const ENTERED_KEY = 'sbs-pwa-promo-entered';
const RAFFLE_SEEN_KEY = 'sbs-pwa-raffle-seen';

export interface RaffleResult {
  status: 'waiting' | 'drawn' | 'no_entries';
  winnerWallet?: string;
  winnerUserId?: string;
  isCurrentUserWinner?: boolean;
  entrantCount: number;
  entrants: string[];
  drawnAt?: string;
  seed?: string;
  drawTime: string;
}

/**
 * Detects standalone mode (opened from home screen) and auto-records
 * the user's entry in the PWA install promo if eligible.
 * Also manages raffle result fetching after promo ends.
 */
export function usePWAInstallPromo() {
  const { user, isLoggedIn } = useAuth();
  const [hasEntered, setHasEntered] = useState(false);
  const [entryCount, setEntryCount] = useState(0);
  const [promoActive, setPromoActive] = useState(true);
  const [promoEnd, setPromoEnd] = useState('');
  const [drawTime, setDrawTime] = useState('');
  const [loading, setLoading] = useState(true);
  const [raffleResult, setRaffleResult] = useState<RaffleResult | null>(null);

  // Fetch promo status
  const fetchStatus = useCallback(async () => {
    try {
      const params = user?.id ? `?userId=${encodeURIComponent(user.id)}` : '';
      const res = await fetch(`/api/promos/pwa-install${params}`);
      if (!res.ok) return;
      const data = await res.json();
      setEntryCount(data.entryCount ?? 0);
      setHasEntered(data.hasEntered ?? false);
      setPromoActive(data.promoActive ?? false);
      setPromoEnd(data.promoEnd ?? '');
      setDrawTime(data.drawTime ?? '');
      if (data.hasEntered) {
        localStorage.setItem(ENTERED_KEY, '1');
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  // Fetch raffle result when promo has ended
  const fetchRaffleResult = useCallback(async () => {
    try {
      const params = user?.id ? `?promoId=pwa-install-promo&userId=${encodeURIComponent(user.id)}` : '?promoId=pwa-install-promo';
      const res = await fetch(`/api/promos/pwa-raffle-result${params}`);
      if (!res.ok) return;
      const data = await res.json() as RaffleResult;
      setRaffleResult(data);

      // Notify winner on first discovery
      if (data.status === 'drawn' && data.isCurrentUserWinner && localStorage.getItem(RAFFLE_SEEN_KEY) !== '1') {
        pushNotification({
          type: 'promo',
          title: 'You Won the Raffle!',
          message: '5 free spins have been added to your account!',
          link: '/banana-wheel',
        });
      }
    } catch {
      // silent
    }
  }, [user?.id]);

  useEffect(() => {
    if (!promoActive && !loading) {
      fetchRaffleResult();
    }
  }, [promoActive, loading, fetchRaffleResult]);

  // Auto-detect standalone mode and record entry
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!isLoggedIn || !user?.id || !user?.walletAddress) return;
    if (localStorage.getItem(ENTERED_KEY) === '1') return;

    const isStandalone =
      window.matchMedia?.('(display-mode: standalone)').matches ||
      Boolean((window.navigator as Navigator & { standalone?: boolean }).standalone);

    if (!isStandalone) return;

    // Record entry
    const record = async () => {
      try {
        const res = await fetch('/api/promos/pwa-install', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ wallet: user.walletAddress, userId: user.id }),
        });
        const data = await res.json();
        if (data.entered || data.alreadyEntered) {
          setHasEntered(true);
          localStorage.setItem(ENTERED_KEY, '1');
          if (data.entered) {
            pushNotification({
              type: 'promo',
              title: "You're entered!",
              message: 'You could win 5 free spins. Winner picked when the timer ends.',
            });
          }
          fetchStatus();
        }
      } catch {
        // silent
      }
    };

    record();
  }, [isLoggedIn, user?.id, user?.walletAddress, fetchStatus]);

  const markRaffleSeen = useCallback(() => {
    localStorage.setItem(RAFFLE_SEEN_KEY, '1');
  }, []);

  const hasSeenRaffle = typeof window !== 'undefined' && localStorage.getItem(RAFFLE_SEEN_KEY) === '1';

  return {
    hasEntered,
    entryCount,
    promoActive,
    promoEnd,
    drawTime,
    loading,
    raffleResult,
    hasSeenRaffle,
    markRaffleSeen,
    refetch: fetchStatus,
    refetchRaffle: fetchRaffleResult,
  };
}
