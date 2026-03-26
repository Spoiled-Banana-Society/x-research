'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { useInstallPrompt } from '@/hooks/useInstallPrompt';

const DISMISS_KEY = 'sbs-a2hs-dismissed';
const DISMISS_DAYS = 3;

function isDismissed(): boolean {
  if (typeof window === 'undefined') return true;
  const ts = localStorage.getItem(DISMISS_KEY);
  if (!ts) return false;
  return (Date.now() - Number(ts)) / (1000 * 60 * 60 * 24) < DISMISS_DAYS;
}

export function AddToHomeScreenCard() {
  const { canInstall, isIOS, isStandalone, triggerInstall } = useInstallPrompt();
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Show on mobile only, not installed, not dismissed
    if (typeof window === 'undefined') return;
    const isMobile = /iphone|ipad|ipod|android/i.test(navigator.userAgent);
    if (isMobile && !isStandalone && !isDismissed()) {
      setShow(true);
    }
  }, [isStandalone]);

  const handleInstall = useCallback(async () => {
    const installed = await triggerInstall();
    if (installed) setShow(false);
  }, [triggerInstall]);

  const handleDismiss = useCallback(() => {
    setShow(false);
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
  }, []);

  if (!show) return null;

  return (
    <aside className="mb-6 rounded-2xl border border-banana/20 bg-gradient-to-r from-banana/[0.06] to-transparent overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-3">
        {/* App icon */}
        <div className="w-12 h-12 rounded-xl bg-black border border-white/10 flex items-center justify-center flex-shrink-0">
          <Image src="/icons/icon-192.png" alt="Banana Fantasy" width={40} height={40} className="rounded-lg" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className="text-white font-semibold text-[13px]">Get the App</p>
          <p className="text-white/40 text-[11px]">Add to home screen — instant access, no download</p>
        </div>

        {/* Button */}
        {isIOS ? (
          <div className="flex flex-col items-end flex-shrink-0">
            <p className="text-banana text-[10px] font-semibold">
              Share → Add to Home
            </p>
            <button onClick={handleDismiss} className="text-white/20 text-[9px] mt-1">
              Got it
            </button>
          </div>
        ) : canInstall ? (
          <div className="flex flex-col items-end gap-1 flex-shrink-0">
            <button
              onClick={handleInstall}
              className="px-4 py-1.5 bg-banana text-black text-xs font-bold rounded-full hover:bg-banana/90 transition-colors"
            >
              Add
            </button>
            <button onClick={handleDismiss} className="text-white/20 text-[9px]">
              Later
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-end flex-shrink-0">
            <p className="text-banana text-[10px] font-semibold">
              Menu → Add to Home
            </p>
            <button onClick={handleDismiss} className="text-white/20 text-[9px] mt-1">
              Got it
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}

/**
 * Compact install button for profile dropdown
 */
export function InstallAppButton() {
  const { canInstall, isIOS, isStandalone, triggerInstall } = useInstallPrompt();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setIsMobile(/iphone|ipad|ipod|android/i.test(navigator.userAgent));
  }, []);

  if (!isMobile || isStandalone) return null;

  if (isIOS) {
    return (
      <div className="w-full px-4 py-2 text-left text-text-secondary text-sm flex items-center gap-3">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
        </svg>
        <span>Share → Add to Home Screen</span>
      </div>
    );
  }

  return (
    <button
      onClick={() => triggerInstall()}
      className="w-full px-4 py-2 text-left text-text-secondary hover:bg-bg-tertiary hover:text-text-primary transition-colors flex items-center gap-3 text-sm"
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
      </svg>
      Install App
    </button>
  );
}
