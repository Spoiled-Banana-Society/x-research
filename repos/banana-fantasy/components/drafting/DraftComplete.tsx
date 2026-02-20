'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export function DraftComplete() {
  const router = useRouter();

  useEffect(() => {
    const timeout = setTimeout(() => {
      router.push('/drafting');
    }, 10000);
    return () => clearTimeout(timeout);
  }, [router]);

  return (
    <div className="mt-[340px] text-center">
      <h1 className="font-primary text-center font-bold italic uppercase text-lg mt-5">Draft is complete</h1>
      <p className="px-3 text-center">Please wait while we are generating your card...</p>
      <div className="mx-auto text-center flex items-center justify-center">
        <div className="flex items-center gap-2 mt-4">
          <div className="w-4 h-4 rounded-full bg-white animate-bubble" style={{ animationDelay: '0s' }} />
          <div className="w-4 h-4 rounded-full bg-white animate-bubble" style={{ animationDelay: '0.2s' }} />
          <div className="w-4 h-4 rounded-full bg-white animate-bubble" style={{ animationDelay: '0.4s' }} />
        </div>
      </div>
      <style jsx>{`
        @keyframes bubble {
          0%, 80%, 100% { transform: scale(0); opacity: 0.3; }
          40% { transform: scale(1); opacity: 1; }
        }
        .animate-bubble { animation: bubble 1.4s infinite ease-in-out both; }
      `}</style>
    </div>
  );
}
