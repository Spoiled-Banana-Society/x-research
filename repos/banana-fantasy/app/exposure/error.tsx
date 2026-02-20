'use client';


import { useEffect } from 'react';

export default function ExposureError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Error caught by boundary:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center px-4">
      <div className="max-w-md text-center">
        <div className="text-5xl mb-4">🎯</div>
        <h2 className="text-white text-xl font-bold mb-2">Exposure data unavailable</h2>
        <p className="text-white/50 mb-6 text-sm">Try refreshing the page.</p>
        <button onClick={reset} className="px-5 py-2.5 bg-[#F3E216] text-black font-semibold rounded-lg hover:bg-yellow-400 transition-colors">Try Again</button>
      </div>
    </div>
  );
}
