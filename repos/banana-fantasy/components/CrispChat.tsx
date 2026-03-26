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

    // Push Crisp widget above mobile bottom tab bar (56px + safe area)
    const style = document.createElement('style');
    style.textContent = `
      @media (max-width: 767px) {
        .crisp-client .cc-1brb6 .cc-unoo,
        .crisp-client .cc-1brb6,
        #crisp-chatbox { bottom: 64px !important; }
      }
    `;
    document.head.appendChild(style);

    return () => {
      const crispScript = document.querySelector('script[src="https://client.crisp.chat/l.js"]');
      if (crispScript) crispScript.remove();
      style.remove();
    };
  }, []);

  return null;
}
