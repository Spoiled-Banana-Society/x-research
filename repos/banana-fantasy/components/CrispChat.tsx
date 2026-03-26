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

    // Push Crisp widget above mobile bottom tab bar
    const style = document.createElement('style');
    style.textContent = `
      @media (max-width: 767px) {
        .crisp-client .cc-1brb6,
        .crisp-client .cc-1brb6 .cc-unoo,
        .crisp-client [data-full-view="true"],
        .crisp-client [class*="cc-"] { bottom: 70px !important; }
        #crisp-chatbox { bottom: 70px !important; }
      }
    `;
    document.head.appendChild(style);

    // Also use Crisp JS API to offset position once loaded
    const waitForCrisp = setInterval(() => {
      if (window.$crisp && typeof (window.$crisp as any).push === 'function') {
        try { (window.$crisp as any).push(['config', 'position:reverse', true]); } catch {}
        try { (window.$crisp as any).push(['config', 'container:index', 69]); } catch {}
        clearInterval(waitForCrisp);
      }
    }, 1000);
    setTimeout(() => clearInterval(waitForCrisp), 10000);

    return () => {
      const crispScript = document.querySelector('script[src="https://client.crisp.chat/l.js"]');
      if (crispScript) crispScript.remove();
      style.remove();
    };
  }, []);

  return null;
}
