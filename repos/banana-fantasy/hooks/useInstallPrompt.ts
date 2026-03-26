'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

/**
 * Captures the browser's beforeinstallprompt event and provides
 * a way to trigger the native install dialog.
 *
 * Shared across the home page card and profile dropdown button.
 */
export function useInstallPrompt() {
  const [canInstall, setCanInstall] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const promptRef = useRef<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check if already installed
    const standalone =
      window.matchMedia?.('(display-mode: standalone)').matches ||
      Boolean((window.navigator as Navigator & { standalone?: boolean }).standalone);
    setIsStandalone(standalone);

    // Check iOS
    setIsIOS(/iphone|ipad|ipod/i.test(navigator.userAgent));

    // Listen for the install prompt event (Chrome/Edge/Android)
    const handler = (e: Event) => {
      e.preventDefault();
      promptRef.current = e as BeforeInstallPromptEvent;
      setCanInstall(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    // Also listen for successful install
    window.addEventListener('appinstalled', () => {
      setCanInstall(false);
      setIsStandalone(true);
      promptRef.current = null;
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const triggerInstall = useCallback(async (): Promise<boolean> => {
    if (!promptRef.current) return false;
    try {
      await promptRef.current.prompt();
      const result = await promptRef.current.userChoice;
      if (result.outcome === 'accepted') {
        setCanInstall(false);
        promptRef.current = null;
        return true;
      }
    } catch {}
    return false;
  }, []);

  return { canInstall, isIOS, isStandalone, triggerInstall };
}
