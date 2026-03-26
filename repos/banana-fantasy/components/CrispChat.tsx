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

    // Hide Crisp floating bubble on mobile — accessible via profile dropdown "Support" button
    // Desktop: keep floating bubble visible
    const style = document.createElement('style');
    style.textContent = `
      @media (max-width: 767px) {
        .crisp-client .cc-1brb6,
        .crisp-client [data-visible] { display: none !important; }
        .crisp-client .cc-1brb6[data-full-view="true"],
        .crisp-client [data-full-view="true"] { display: block !important; bottom: 0 !important; }
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
