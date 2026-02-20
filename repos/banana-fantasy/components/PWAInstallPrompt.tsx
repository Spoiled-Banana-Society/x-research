'use client';

import { useState, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [showIOSPrompt, setShowIOSPrompt] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (window.matchMedia('(display-mode: standalone)').matches) return;

    const dismissedAt = localStorage.getItem('pwa-install-dismissed');
    if (
      dismissedAt &&
      Date.now() - Number(dismissedAt) < 7 * 24 * 60 * 60 * 1000
    ) {
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', handler);

    const isIOS = /iphone|ipad|ipod/.test(navigator.userAgent.toLowerCase());
    const isStandalone = (navigator as unknown as { standalone?: boolean })
      .standalone;
    if (isIOS && !isStandalone) {
      setShowIOSPrompt(true);
    }

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem('pwa-install-dismissed', String(Date.now()));
  };

  if (dismissed) return null;
  if (!deferredPrompt && !showIOSPrompt) return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 16,
        left: 16,
        right: 16,
        zIndex: 9999,
        background: '#1a1a1a',
        border: '1px solid #F3E216',
        borderRadius: 12,
        padding: 16,
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        boxShadow: '0 4px 24px rgba(243, 226, 22, 0.15)',
      }}
    >
      <span style={{ fontSize: 32 }}>🍌</span>
      <div style={{ flex: 1 }}>
        <div
          style={{ fontWeight: 700, color: '#F3E216', fontSize: 14 }}
        >
          Add Banana Fantasy to Home Screen
        </div>
        <div style={{ color: '#aaa', fontSize: 12, marginTop: 2 }}>
          {showIOSPrompt
            ? 'Tap the Share button, then "Add to Home Screen"'
            : 'Get the full app experience — fast, offline-ready'}
        </div>
      </div>
      {deferredPrompt && (
        <button
          onClick={handleInstall}
          style={{
            background: '#F3E216',
            color: '#000',
            border: 'none',
            borderRadius: 8,
            padding: '8px 16px',
            fontWeight: 700,
            fontSize: 13,
            cursor: 'pointer',
            whiteSpace: 'nowrap',
          }}
        >
          Install
        </button>
      )}
      <button
        onClick={handleDismiss}
        style={{
          background: 'transparent',
          border: 'none',
          color: '#666',
          fontSize: 18,
          cursor: 'pointer',
          padding: 4,
        }}
      >
        ✕
      </button>
    </div>
  );
}
