'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useInstallPrompt } from '@/hooks/useInstallPrompt';
import { usePWAInstallPromo } from '@/hooks/usePWAInstallPromo';
import { InstallModal } from '@/components/home/AddToHomeScreenCard';

function isIOS(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

function isIOSSafari(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent.toLowerCase();
  return /iphone|ipad|ipod/.test(ua) && /safari/.test(ua) && !/chrome|crios|fxios/.test(ua);
}

function useCountdown(endTime: string) {
  const [remaining, setRemaining] = useState('');

  useEffect(() => {
    if (!endTime) return;
    const tick = () => {
      const diff = new Date(endTime).getTime() - Date.now();
      if (diff <= 0) {
        setRemaining('Ended');
        return;
      }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setRemaining(`${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [endTime]);

  return remaining;
}

/** Small banner shown at top of InstallModal during the promo period */
export function PWAPromoBanner() {
  const { promoActive, promoEnd } = usePWAInstallPromo();
  const countdown = useCountdown(promoEnd);

  if (!promoActive || countdown === 'Ended') return null;

  return (
    <div className="mx-5 mt-5 mb-1 p-3 rounded-xl bg-banana/10 border border-banana/20">
      <p className="text-white font-semibold text-xs text-center">
        Install now for a chance to win 5 free spins!
      </p>
      <div className="flex items-center justify-center gap-1.5 mt-1.5">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
        <span className="text-banana font-mono font-bold text-xs tabular-nums">{countdown}</span>
        <span className="text-white/30 text-[10px]">remaining</span>
      </div>
    </div>
  );
}

export function PWAInstallPromoCard() {
  const { triggerInstall } = useInstallPrompt();
  const { hasEntered, entryCount, promoActive, promoEnd, drawTime, loading, raffleResult } = usePWAInstallPromo();
  const promoCountdown = useCountdown(promoEnd);
  const drawCountdown = useCountdown(drawTime);
  const [isMobile, setIsMobile] = useState(false);
  const [modalBrowser, setModalBrowser] = useState<'safari' | 'chrome' | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    setIsMobile(/iphone|ipad|ipod|android/i.test(navigator.userAgent));
  }, []);

  const handleInstall = useCallback(async () => {
    if (isIOS()) {
      setModalBrowser(isIOSSafari() ? 'safari' : 'chrome');
    } else {
      await triggerInstall();
    }
  }, [triggerInstall]);

  // Hide while loading
  if (loading) return null;

  // After draw is complete, show winner result
  if (raffleResult?.status === 'drawn') {
    const isWinner = raffleResult.isCurrentUserWinner;
    return (
      <aside className="mb-6 rounded-2xl border border-banana/20 bg-gradient-to-br from-[#1a1a2e] to-[#111118] overflow-hidden">
        <div className="px-4 py-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-banana text-lg">{isWinner ? '🎉' : '🎰'}</span>
            <h3 className="text-white font-bold text-sm">
              {isWinner ? 'You Won the Raffle!' : 'Raffle Complete'}
            </h3>
          </div>
          {isWinner ? (
            <p className="text-banana/70 text-xs mb-3">5 free spins added to your account!</p>
          ) : (
            <p className="text-white/40 text-xs mb-3">
              Winner: {raffleResult.winnerWallet ? `${raffleResult.winnerWallet.slice(0, 6)}...${raffleResult.winnerWallet.slice(-4)}` : 'Unknown'}
            </p>
          )}
          <Link
            href="/banana-wheel/raffle"
            className={`block w-full py-2.5 text-center font-bold rounded-xl text-sm transition-colors ${
              isWinner
                ? 'bg-banana text-black hover:bg-banana/90'
                : 'bg-white/[0.06] text-white/60 hover:bg-white/[0.1]'
            }`}
          >
            {isWinner ? 'Spin the Wheel' : 'View Results'}
          </Link>
        </div>
      </aside>
    );
  }

  // Promo ended but draw hasn't happened yet — show draw countdown
  if (!promoActive && drawTime && drawCountdown !== 'Ended') {
    return (
      <aside className="mb-6 rounded-2xl border border-banana/20 bg-gradient-to-br from-[#1a1a2e] to-[#111118] overflow-hidden">
        <div className="px-4 py-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-banana text-lg">🎰</span>
            <h3 className="text-white font-bold text-sm">Raffle Draw Coming</h3>
          </div>
          <p className="text-white/40 text-xs mb-3">
            {hasEntered ? "You're in! " : ''}The winner will be drawn live.
          </p>
          <div className="flex items-center gap-4 mb-3">
            <div className="flex items-center gap-1.5">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              <span className="text-banana font-mono font-bold text-sm tabular-nums">{drawCountdown}</span>
            </div>
            <span className="text-white/40 text-xs">{entryCount} entered</span>
          </div>
          <Link
            href="/banana-wheel/raffle"
            className="block w-full py-2.5 text-center bg-banana text-black font-bold rounded-xl text-sm hover:bg-banana/90 transition-colors"
          >
            Watch the Draw
          </Link>
        </div>
      </aside>
    );
  }

  // Promo ended and draw time passed but no result yet (loading) — hide
  if (!promoActive) return null;

  // Promo still active — show install promo (mobile only)
  if (!isMobile) return null;

  const ended = promoCountdown === 'Ended';

  return (
    <>
      <aside className="mb-6 rounded-2xl border border-banana/20 bg-gradient-to-br from-[#1a1a2e] to-[#111118] overflow-hidden">
        <div className="px-4 py-4">
          {/* Header row */}
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-banana text-lg">🎰</span>
                <h3 className="text-white font-bold text-sm">Install SBS — Win 5 Free Spins</h3>
              </div>
              <p className="text-white/40 text-xs leading-relaxed">
                Add to your home screen within 48hrs. 1 random winner gets 5 free spins!
              </p>
            </div>
          </div>

          {/* Stats row */}
          <div className="flex items-center gap-4 mb-3">
            {!ended && (
              <div className="flex items-center gap-1.5">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                <span className="text-banana font-mono font-bold text-sm tabular-nums">{promoCountdown}</span>
              </div>
            )}
            {ended && <span className="text-white/30 text-xs font-medium">Promo ended</span>}
            <div className="flex items-center gap-1.5">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ffffff40" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
              <span className="text-white/40 text-xs">{entryCount} entered</span>
            </div>
          </div>

          {/* CTA */}
          {hasEntered ? (
            <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/20 rounded-xl px-4 py-2.5">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6L9 17l-5-5" />
              </svg>
              <span className="text-green-400 font-semibold text-sm">You&apos;re entered!</span>
            </div>
          ) : !ended ? (
            <button
              onClick={handleInstall}
              className="w-full py-3 bg-banana text-black font-bold rounded-xl text-sm hover:bg-banana/90 transition-colors"
            >
              Install Now
            </button>
          ) : null}
        </div>
      </aside>

      {modalBrowser && (
        <InstallModal
          browser={modalBrowser}
          onClose={() => setModalBrowser(null)}
          promoBanner={<PWAPromoBanner />}
        />
      )}
    </>
  );
}
