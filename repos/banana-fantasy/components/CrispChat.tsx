'use client';

import { useEffect } from 'react';

declare global {
  interface Window {
    $crisp: unknown[];
    CRISP_WEBSITE_ID: string;
  }
}

export function CrispChat() {
  useEffect(() => {
    window.$crisp = [];
    window.CRISP_WEBSITE_ID = 'ed386428-a6f2-435a-a3e1-043f0a078093';

    const script = document.createElement('script');
    script.src = 'https://client.crisp.chat/l.js';
    script.async = true;
    document.head.appendChild(script);

    // Hide Crisp floating bubble entirely — chat opens via profile dropdown "Support" button
    // The chat window itself still shows when opened programmatically
    window.$crisp.push(['config', 'hide:on:initial:load', true]);

    const style = document.createElement('style');
    style.id = 'crisp-hide';
    style.textContent = `
      .crisp-client .cc-1brb6 { display: none !important; visibility: hidden !important; }
    `;
    document.head.appendChild(style);

    // Once Crisp loads, hide the bubble via API too
    const waitForCrisp = setInterval(() => {
      if (window.$crisp && typeof (window.$crisp as unknown[]).push === 'function') {
        try { (window.$crisp as unknown[]).push(['do', 'chat:hide']); } catch {}
        clearInterval(waitForCrisp);
      }
    }, 500);
    setTimeout(() => clearInterval(waitForCrisp), 10000);

    return () => {
      const crispScript = document.querySelector('script[src="https://client.crisp.chat/l.js"]');
      if (crispScript) crispScript.remove();
      style.remove();
    };
  }, []);

  return null;
}
