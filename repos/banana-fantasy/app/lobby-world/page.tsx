'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

const QUICK_EMOTES = ['🍌', '🔥', '😎', '💪', '🏈', '🎯'];

export default function LobbyWorldPage() {
  const searchParams = useSearchParams();
  const draftId = searchParams?.get('id') || '';
  const draftName = searchParams?.get('name') || 'Your Draft Lobby';
  const speed = searchParams?.get('speed') || 'fast';

  const [feed, setFeed] = useState<string[]>([
    'Welcome to Lobby World 👋',
    'Warm up, queue your vibe, and get ready to draft.',
  ]);

  const backHref = useMemo(() => {
    const q = new URLSearchParams();
    if (draftId) q.set('id', draftId);
    if (draftName) q.set('name', draftName);
    if (speed) q.set('speed', speed);
    const query = q.toString();
    return `/draft-room${query ? `?${query}` : ''}`;
  }, [draftId, draftName, speed]);

  return (
    <main className="min-h-screen bg-black text-white px-4 py-6 sm:px-6">
      <div className="max-w-3xl mx-auto space-y-5">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Lobby World</h1>
          <Link href={backHref} className="px-4 py-2 rounded-lg border border-white/20 hover:bg-white/10 transition-colors">
            Back to Draft
          </Link>
        </div>

        <div className="rounded-xl border border-white/15 bg-white/[0.04] p-4">
          <p className="text-sm text-white/70">{draftName}</p>
          {draftId && <p className="text-xs text-white/40 mt-1">Draft ID: {draftId}</p>}
          <p className="text-xs text-white/50 mt-1">Speed: {speed}</p>
        </div>

        <div className="rounded-xl border border-white/15 bg-white/[0.04] p-4 space-y-3">
          <h2 className="text-lg font-semibold">Quick Emote Feed</h2>
          <div className="flex flex-wrap gap-2">
            {QUICK_EMOTES.map((emote) => (
              <button
                key={emote}
                onClick={() => setFeed((prev) => [`You sent ${emote}`, ...prev].slice(0, 16))}
                className="px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
              >
                {emote}
              </button>
            ))}
          </div>

          <div className="rounded-lg bg-black/40 border border-white/10 p-3 space-y-2 max-h-72 overflow-y-auto">
            {feed.map((item, idx) => (
              <p key={`${item}-${idx}`} className="text-sm text-white/85">{item}</p>
            ))}
          </div>

          <p className="text-xs text-white/45">MVP lobby world: lightweight pre-draft hangout view with quick interactions.</p>
        </div>
      </div>
    </main>
  );
}
