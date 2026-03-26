'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import { useInstallPrompt } from '@/hooks/useInstallPrompt';

const DISMISS_KEY = 'sbs-a2hs-dismissed';
const DISMISS_DAYS = 0; // TODO: set back to 3 after testing

function isDismissed(): boolean {
  if (typeof window === 'undefined') return true;
  const ts = localStorage.getItem(DISMISS_KEY);
  if (!ts) return false;
  return (Date.now() - Number(ts)) / (1000 * 60 * 60 * 24) < DISMISS_DAYS;
}

function isIOSSafari(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent.toLowerCase();
  return /iphone|ipad|ipod/.test(ua) && /safari/.test(ua) && !/chrome|crios|fxios/.test(ua);
}

function isIOSChrome(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent.toLowerCase();
  return /iphone|ipad|ipod/.test(ua) && /crios/.test(ua);
}

// ── iOS Safari Install Walkthrough ──────────────────────────────────────

function SafariInstallModal({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState(1);
  const visibilityRef = useRef(false);

  // Auto-advance when user returns from share sheet
  useEffect(() => {
    if (step !== 1 && step !== 2) return;

    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') {
        visibilityRef.current = true;
      } else if (document.visibilityState === 'visible' && visibilityRef.current) {
        visibilityRef.current = false;
        // User came back from share sheet — advance to next step
        setStep(prev => Math.min(prev + 1, 3));
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [step]);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-sm bg-[#111118] border border-white/[0.08] rounded-t-2xl overflow-hidden animate-modal-sheet"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 pt-5 pb-2">
          <h3 className="text-white font-bold text-lg">Install Banana Fantasy</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/[0.06] flex items-center justify-center text-white/50">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-5 pb-6">
          {/* Step 1: Tap Share */}
          {step === 1 && (
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-banana/10 flex items-center justify-center">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8" />
                  <polyline points="16 6 12 2 8 6" />
                  <line x1="12" y1="2" x2="12" y2="15" />
                </svg>
              </div>
              <p className="text-white font-semibold text-base mb-1">Tap the Share button</p>
              <p className="text-white/40 text-sm">
                The square with an arrow at the bottom of Safari
              </p>
              <div className="mt-5 flex justify-center animate-bounce">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round">
                  <path d="M12 5v14M5 12l7 7 7-7" />
                </svg>
              </div>
              <p className="text-white/20 text-[10px] mt-3">Auto-advances when you tap Share</p>
            </div>
          )}

          {/* Step 2: Add to Home Screen */}
          {step === 2 && (
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-banana/10 flex items-center justify-center">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <line x1="12" y1="8" x2="12" y2="16" />
                  <line x1="8" y1="12" x2="16" y2="12" />
                </svg>
              </div>
              <p className="text-white font-semibold text-base mb-1">Tap &quot;Add to Home Screen&quot;</p>
              <p className="text-white/40 text-sm">
                Scroll down in the share menu to find it
              </p>
              <p className="text-white/20 text-[10px] mt-4">Auto-advances when you return</p>
            </div>
          )}

          {/* Step 3: Confirm */}
          {step === 3 && (
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-green-500/10 flex items-center justify-center">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
              </div>
              <p className="text-white font-semibold text-base mb-1">Tap &quot;Add&quot; to confirm</p>
              <p className="text-white/40 text-sm">
                Top-right corner. Banana Fantasy will appear on your home screen!
              </p>
              <button
                onClick={onClose}
                className="mt-5 w-full py-3 bg-banana text-black font-bold rounded-xl text-sm"
              >
                Done
              </button>
            </div>
          )}

          {/* Step dots */}
          <div className="flex justify-center gap-2 mt-5">
            {[1, 2, 3].map(s => (
              <div
                key={s}
                className={`h-1 rounded-full transition-all ${
                  s === step ? 'w-6 bg-banana' : s < step ? 'w-1.5 bg-banana/40' : 'w-1.5 bg-white/10'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── iOS Chrome → Safari Redirect ────────────────────────────────────────

function ChromeToSafariModal({ onClose }: { onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  const url = typeof window !== 'undefined' ? window.location.href : '';

  const handleCopy = () => {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // Try to open in Safari directly
  const handleOpenSafari = () => {
    // Copy first as backup
    navigator.clipboard.writeText(url).catch(() => {});
    // Try Safari URL scheme
    window.location.href = `x-safari-${url}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-sm bg-[#111118] border border-white/[0.08] rounded-t-2xl overflow-hidden animate-modal-sheet"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 pt-5 pb-2">
          <h3 className="text-white font-bold text-lg">Open in Safari</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/[0.06] flex items-center justify-center text-white/50">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-5 pb-6 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-blue-500/10 flex items-center justify-center">
            {/* Safari compass icon */}
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
            </svg>
          </div>
          <p className="text-white font-semibold text-base mb-1">Safari required</p>
          <p className="text-white/40 text-sm mb-5">
            Adding to your home screen only works in Safari. Open this page in Safari to continue.
          </p>

          <button
            onClick={handleOpenSafari}
            className="w-full py-3 bg-banana text-black font-bold rounded-xl text-sm mb-2"
          >
            Open in Safari
          </button>
          <button
            onClick={handleCopy}
            className="w-full py-2.5 bg-white/[0.06] text-white/70 font-medium rounded-xl text-sm"
          >
            {copied ? 'Copied! Now open Safari and paste' : 'Copy Link'}
          </button>
          <button onClick={onClose} className="mt-3 text-white/20 text-xs">
            Later
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Card ───────────────────────────────────────────────────────────

export function AddToHomeScreenCard() {
  const { canInstall, isStandalone, triggerInstall } = useInstallPrompt();
  const [show, setShow] = useState(false);
  const [showSafariModal, setShowSafariModal] = useState(false);
  const [showChromeModal, setShowChromeModal] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const isMobile = /iphone|ipad|ipod|android/i.test(navigator.userAgent);
    if (isMobile && !isStandalone && !isDismissed()) {
      setShow(true);
    }
  }, [isStandalone]);

  const handleInstall = useCallback(async () => {
    if (isIOSSafari()) {
      setShowSafariModal(true);
    } else if (isIOSChrome()) {
      setShowChromeModal(true);
    } else {
      // Android — native prompt
      const installed = await triggerInstall();
      if (installed) setShow(false);
    }
  }, [triggerInstall]);

  const handleDismiss = useCallback(() => {
    setShow(false);
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
  }, []);

  if (!show) return null;

  return (
    <>
      <aside className="mb-6 rounded-2xl border border-banana/20 bg-gradient-to-r from-banana/[0.06] to-transparent overflow-hidden">
        <div className="flex items-center gap-3 px-4 py-3">
          <div className="w-12 h-12 rounded-xl bg-black border border-white/10 flex items-center justify-center flex-shrink-0">
            <Image src="/icons/icon-192.png" alt="Banana Fantasy" width={40} height={40} className="rounded-lg" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white font-semibold text-[13px]">Get the App</p>
            <p className="text-white/40 text-[11px]">Add to home screen — works like a real app</p>
          </div>
          <div className="flex flex-col items-end gap-1 flex-shrink-0">
            <button
              onClick={handleInstall}
              className="px-4 py-1.5 bg-banana text-black text-xs font-bold rounded-full hover:bg-banana/90 transition-colors"
            >
              Install
            </button>
            <button onClick={handleDismiss} className="text-white/20 text-[9px]">
              Later
            </button>
          </div>
        </div>
      </aside>

      {showSafariModal && <SafariInstallModal onClose={() => { setShowSafariModal(false); handleDismiss(); }} />}
      {showChromeModal && <ChromeToSafariModal onClose={() => { setShowChromeModal(false); handleDismiss(); }} />}
    </>
  );
}

// ── Profile Dropdown Button ─────────────────────────────────────────────

export function InstallAppButton() {
  const { isStandalone, triggerInstall } = useInstallPrompt();
  const [isMobile, setIsMobile] = useState(false);
  const [showSafariModal, setShowSafariModal] = useState(false);
  const [showChromeModal, setShowChromeModal] = useState(false);

  useEffect(() => {
    setIsMobile(/iphone|ipad|ipod|android/i.test(navigator.userAgent));
  }, []);

  if (!isMobile || isStandalone) return null;

  const handleClick = () => {
    if (isIOSSafari()) setShowSafariModal(true);
    else if (isIOSChrome()) setShowChromeModal(true);
    else triggerInstall();
  };

  return (
    <>
      <button
        onClick={handleClick}
        className="w-full px-4 py-2 text-left text-text-secondary hover:bg-bg-tertiary hover:text-text-primary transition-colors flex items-center gap-3 text-sm"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
        </svg>
        Install App
      </button>

      {showSafariModal && <SafariInstallModal onClose={() => setShowSafariModal(false)} />}
      {showChromeModal && <ChromeToSafariModal onClose={() => setShowChromeModal(false)} />}
    </>
  );
}
