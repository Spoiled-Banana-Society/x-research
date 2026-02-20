'use client';

import React from 'react';

type Platform = 'ios' | 'android' | 'other';

function detectPlatform(userAgent: string): Platform {
  const ua = userAgent.toLowerCase();
  const isIOS = /iphone|ipad|ipod/.test(ua);
  const isAndroid = /android/.test(ua);

  if (isIOS) return 'ios';
  if (isAndroid) return 'android';
  return 'other';
}

function isStandaloneDisplayMode() {
  if (typeof window === 'undefined') return false;

  const standaloneMatch = window.matchMedia?.('(display-mode: standalone)').matches;
  const iosStandalone = (window.navigator as Navigator & { standalone?: boolean }).standalone;

  return Boolean(standaloneMatch || iosStandalone);
}

const STORAGE_KEY = 'sbs-a2hs-dismissed-v1';

export function AddToHomeScreenCard() {
  const [ready, setReady] = React.useState(false);
  const [dismissed, setDismissed] = React.useState(true);
  const [platform, setPlatform] = React.useState<Platform>('other');

  React.useEffect(() => {
    if (typeof window === 'undefined') return;

    const uaPlatform = detectPlatform(window.navigator.userAgent);
    const hasDismissed = window.localStorage.getItem(STORAGE_KEY) === '1';
    const standalone = isStandaloneDisplayMode();

    setPlatform(uaPlatform);
    setDismissed(hasDismissed || standalone || uaPlatform === 'other');
    setReady(true);
  }, []);

  const onDismiss = () => {
    setDismissed(true);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, '1');
    }
  };

  if (!ready || dismissed) return null;

  return (
    <aside className="mb-4 rounded-xl border border-[#F3E216]/30 bg-black/40 p-3 sm:p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-[#F3E216]">Add Banana Fantasy to your home screen</p>
          {platform === 'ios' ? (
            <p className="mt-1 text-xs text-text-secondary">
              In Safari: tap <span className="font-semibold">Share</span> → <span className="font-semibold">Add to Home Screen</span>.
            </p>
          ) : (
            <p className="mt-1 text-xs text-text-secondary">
              In Chrome: tap <span className="font-semibold">⋮</span> → <span className="font-semibold">Add to Home screen</span>.
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={onDismiss}
          className="text-xs text-text-secondary hover:text-text-primary min-h-[32px]"
          aria-label="Dismiss add to home screen tip"
        >
          Dismiss
        </button>
      </div>
    </aside>
  );
}
