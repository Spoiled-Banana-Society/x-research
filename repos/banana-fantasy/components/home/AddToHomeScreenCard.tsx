'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';

const DISMISS_KEY = 'sbs-a2hs-dismissed';
const DISMISS_DAYS = 7; // Show again after 7 days

type Platform = 'ios' | 'android' | 'other';

function detectPlatform(): Platform {
  if (typeof window === 'undefined') return 'other';
  const ua = window.navigator.userAgent.toLowerCase();
  if (/iphone|ipad|ipod/.test(ua)) return 'ios';
  if (/android/.test(ua)) return 'android';
  return 'other';
}

function isStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia?.('(display-mode: standalone)').matches ||
    Boolean((window.navigator as Navigator & { standalone?: boolean }).standalone)
  );
}

function isDismissed(): boolean {
  if (typeof window === 'undefined') return true;
  const ts = localStorage.getItem(DISMISS_KEY);
  if (!ts) return false;
  const dismissedAt = Number(ts);
  const daysSince = (Date.now() - dismissedAt) / (1000 * 60 * 60 * 24);
  return daysSince < DISMISS_DAYS;
}

export function AddToHomeScreenCard() {
  const [show, setShow] = useState(false);
  const [platform, setPlatform] = useState<Platform>('other');
  const deferredPromptRef = useRef<Event | null>(null);

  // Capture the beforeinstallprompt event (Chrome/Android)
  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      deferredPromptRef.current = e;
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  useEffect(() => {
    const p = detectPlatform();
    setPlatform(p);
    // Show on mobile only, not already installed, not recently dismissed
    if (p !== 'other' && !isStandalone() && !isDismissed()) {
      setShow(true);
    }
  }, []);

  const handleInstall = useCallback(async () => {
    // Try native install prompt first (Chrome/Android)
    if (deferredPromptRef.current) {
      try {
        (deferredPromptRef.current as any).prompt();
        const result = await (deferredPromptRef.current as any).userChoice;
        if (result.outcome === 'accepted') {
          setShow(false);
          return;
        }
      } catch {}
    }
    // Can't auto-prompt — show manual instructions
    // The UI already shows them below the button
  }, []);

  const handleDismiss = useCallback(() => {
    setShow(false);
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
  }, []);

  if (!show) return null;

  return (
    <aside className="mb-6 glass-card overflow-hidden">
      <div className="flex items-center gap-4 p-4">
        {/* App icon */}
        <div className="w-14 h-14 rounded-2xl bg-[#0a0a0f] border border-white/10 flex items-center justify-center flex-shrink-0 shadow-lg">
          <Image
            src="/icons/icon-192.png"
            alt="Banana Fantasy"
            width={48}
            height={48}
            className="rounded-xl"
          />
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0">
          <p className="text-white font-semibold text-sm">Get the App Experience</p>
          <p className="text-white/40 text-xs mt-0.5">
            Add to your home screen for instant access — no download needed.
          </p>
          {platform === 'ios' && (
            <p className="text-white/30 text-[10px] mt-1">
              Tap <span className="text-white/50 font-medium">Share</span> → <span className="text-white/50 font-medium">Add to Home Screen</span>
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-1.5 flex-shrink-0">
          {platform === 'android' && (
            <button
              onClick={handleInstall}
              className="px-4 py-2 bg-banana text-black text-xs font-bold rounded-lg hover:bg-banana/90 transition-colors"
            >
              Install
            </button>
          )}
          <button
            onClick={handleDismiss}
            className="px-3 py-1.5 text-white/30 text-[10px] hover:text-white/50 transition-colors"
          >
            Not now
          </button>
        </div>
      </div>
    </aside>
  );
}
