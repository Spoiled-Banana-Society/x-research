'use client';

import React, { useState, useEffect, useCallback } from 'react';
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

function isIOS(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

function isIOSSafari(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent.toLowerCase();
  return /iphone|ipad|ipod/.test(ua) && /safari/.test(ua) && !/chrome|crios|fxios/.test(ua);
}

// ── Install Steps Modal ─────────────────────────────────────────────────

function InstallModal({ onClose, browser }: { onClose: () => void; browser: 'safari' | 'chrome' }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-[340px] bg-[#111118] border border-white/[0.08] rounded-2xl overflow-hidden animate-modal-sheet"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 pt-5 pb-1 text-center">
          <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-black border border-white/10 flex items-center justify-center">
            <Image src="/icons/icon-192.png" alt="SBS" width={44} height={44} className="rounded-xl" />
          </div>
          <h3 className="text-white font-bold text-lg">Install SBS</h3>
          <p className="text-white/40 text-xs mt-1">
            {browser === 'safari' ? '5 simple steps' : 'Open in Safari first'}
          </p>
        </div>

        {/* Steps */}
        <div className="px-5 py-4">
          {browser === 'chrome' ? (
            /* Chrome on iOS — need to switch to Safari */
            <div className="space-y-4">
              <Step
                num={1}
                icon={
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
                  </svg>
                }
                title="Open this page in Safari"
                desc="Copy the URL and paste it in Safari"
              />
              <Step
                num={2}
                icon={
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8" />
                    <polyline points="16 6 12 2 8 6" />
                    <line x1="12" y1="2" x2="12" y2="15" />
                  </svg>
                }
                title="Tap Share"
                desc="The square with arrow next to the URL bar"
              />
              <Step
                num={3}
                icon={
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <line x1="12" y1="8" x2="12" y2="16" />
                    <line x1="8" y1="12" x2="16" y2="12" />
                  </svg>
                }
                title={<>Scroll down &amp; tap <span className="text-banana">&quot;Add to Home Screen&quot;</span></>}
                desc="Then tap Add to confirm"
              />

              <CopyLinkButton />
            </div>
          ) : (
            /* Safari — 5 step install flow */
            <div className="space-y-3.5">
              <Step
                num={1}
                icon={
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="5" r="1.5" fill="#fbbf24" />
                    <circle cx="12" cy="12" r="1.5" fill="#fbbf24" />
                    <circle cx="12" cy="19" r="1.5" fill="#fbbf24" />
                  </svg>
                }
                title={<>Tap the <span className="text-banana">three dots</span> next to the URL</>}
                desc="Top-right of your browser"
              />
              <Step
                num={2}
                icon={
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8" />
                    <polyline points="16 6 12 2 8 6" />
                    <line x1="12" y1="2" x2="12" y2="15" />
                  </svg>
                }
                title={<>Tap <span className="text-banana">&quot;Share...&quot;</span></>}
                desc=""
              />
              <Step
                num={3}
                icon={
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                }
                title={<>Scroll down &amp; tap <span className="text-banana">&quot;View More&quot;</span></>}
                desc="The arrow pointing down"
              />
              <Step
                num={4}
                icon={
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <line x1="12" y1="8" x2="12" y2="16" />
                    <line x1="8" y1="12" x2="16" y2="12" />
                  </svg>
                }
                title={<>Tap <span className="text-banana">&quot;Add to Home Screen&quot;</span></>}
                desc=""
              />
              <Step
                num={5}
                icon={
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                }
                title={<>Tap <span className="text-banana">&quot;Add&quot;</span> — you&apos;re done!</>}
                desc="SBS is now on your home screen"
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 pb-5">
          <button
            onClick={onClose}
            className="w-full py-3 bg-banana text-black font-bold rounded-xl text-sm"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}

function Step({ num, icon, title, desc }: { num: number; icon: React.ReactNode; title: React.ReactNode; desc: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-xl bg-white/[0.06] border border-white/[0.08] flex items-center justify-center flex-shrink-0">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-white font-medium text-[13px] leading-tight">
          <span className="text-banana/60 font-bold mr-1">{num}.</span>
          {title}
        </p>
        {desc && <p className="text-white/30 text-[11px] mt-0.5">{desc}</p>}
      </div>
    </div>
  );
}

function CopyLinkButton() {
  const [copied, setCopied] = useState(false);
  const url = typeof window !== 'undefined' ? window.location.origin : '';

  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(url).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        });
      }}
      className="w-full py-2.5 bg-white/[0.06] text-white/60 font-medium rounded-xl text-xs flex items-center justify-center gap-2"
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
      </svg>
      {copied ? 'Copied! Paste in Safari' : 'Copy Link'}
    </button>
  );
}

// ── Main Card ───────────────────────────────────────────────────────────

export function AddToHomeScreenCard() {
  const { canInstall, isStandalone, triggerInstall } = useInstallPrompt();
  const [show, setShow] = useState(false);
  const [modalBrowser, setModalBrowser] = useState<'safari' | 'chrome' | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const isMobile = /iphone|ipad|ipod|android/i.test(navigator.userAgent);
    if (isMobile && !isStandalone && !isDismissed()) {
      setShow(true);
    }
  }, [isStandalone]);

  const handleInstall = useCallback(async () => {
    if (isIOS()) {
      setModalBrowser(isIOSSafari() ? 'safari' : 'chrome');
    } else {
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
            <Image src="/icons/icon-192.png" alt="SBS" width={40} height={40} className="rounded-lg" />
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

      {modalBrowser && (
        <InstallModal
          browser={modalBrowser}
          onClose={() => { setModalBrowser(null); handleDismiss(); }}
        />
      )}
    </>
  );
}

// ── Profile Dropdown Button ─────────────────────────────────────────────

export function InstallAppButton() {
  const { isStandalone, triggerInstall } = useInstallPrompt();
  const [isMobile, setIsMobile] = useState(false);
  const [modalBrowser, setModalBrowser] = useState<'safari' | 'chrome' | null>(null);

  useEffect(() => {
    setIsMobile(/iphone|ipad|ipod|android/i.test(navigator.userAgent));
  }, []);

  if (!isMobile || isStandalone) return null;

  const handleClick = () => {
    if (isIOS()) {
      setModalBrowser(isIOSSafari() ? 'safari' : 'chrome');
    } else {
      triggerInstall();
    }
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

      {modalBrowser && (
        <InstallModal
          browser={modalBrowser}
          onClose={() => setModalBrowser(null)}
        />
      )}
    </>
  );
}
