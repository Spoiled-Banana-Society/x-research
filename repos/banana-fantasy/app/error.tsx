'use client';


import { useEffect } from 'react';

export default function Error({
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
    <div className="min-h-screen bg-[#0a0a0f] flex flex-col items-center justify-center p-8">
      <div className="max-w-md text-center">
        <div className="text-6xl mb-6">🍌</div>
        <h1 className="text-white text-2xl font-bold mb-3">Oops! Something went wrong</h1>
        <p className="text-white/60 mb-6">
          Don&apos;t worry, your draft progress is safe. This is just a temporary hiccup.
        </p>
        {process.env.NODE_ENV === 'development' && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-left">
            <p className="text-red-400 text-sm font-mono break-all">{error.message}</p>
          </div>
        )}
        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            className="px-6 py-2.5 bg-yellow-500 text-black font-semibold rounded-lg hover:bg-yellow-400 transition-colors"
          >
            Try Again
          </button>
          <button
            onClick={() => window.location.href = '/'}
            className="px-6 py-2.5 bg-white/10 text-white font-medium rounded-lg hover:bg-white/20 transition-colors"
          >
            Go Home
          </button>
        </div>
      </div>
    </div>
  );
}
