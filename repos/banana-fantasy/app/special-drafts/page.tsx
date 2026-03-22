'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { fetchJson } from '@/lib/appApiClient';
import type { DraftQueue } from '@/types';

function JoinSection({ type, entries, userId, onJoined }: {
  type: 'jackpot' | 'hof';
  entries: number;
  userId: string;
  onJoined: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const isJackpot = type === 'jackpot';
  const color = isJackpot ? '#ef4444' : '#D4AF37';
  const label = isJackpot ? 'Jackpot' : 'HOF';

  const handleJoin = async (speed: 'fast' | 'slow' | 'any') => {
    setLoading(true);
    try {
      await fetchJson('/api/queues', {
        method: 'POST',
        body: JSON.stringify({ userId, queueType: type, speed }),
      });
      onJoined();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to join');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xl">{isJackpot ? '🔥' : '🏆'}</span>
        <span className="font-bold" style={{ color }}>{label}</span>
        <span className="text-white/40 text-sm">— {entries} {entries === 1 ? 'entry' : 'entries'} available</span>
      </div>
      <p className="text-white/50 text-sm mb-3">Pick your draft speed to join a queue:</p>
      <div className="flex gap-2">
        {[
          { label: '⚡ 30 sec', value: 'fast' as const },
          { label: '🕐 8 hour', value: 'slow' as const },
          { label: '🤷 Either', value: 'any' as const },
        ].map(opt => (
          <button
            key={opt.value}
            onClick={() => handleJoin(opt.value)}
            disabled={loading}
            className="flex-1 py-3 rounded-xl text-sm font-semibold transition-all border border-white/20 hover:border-banana hover:bg-banana/10 text-white disabled:opacity-50"
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function QueueCard({ queue, userId }: { queue: DraftQueue; userId: string | undefined }) {
  const isJackpot = queue.type === 'jackpot';
  const color = isJackpot ? '#ef4444' : '#D4AF37';
  const label = isJackpot ? 'Jackpot' : 'HOF';
  const speedLabel = queue.draftSpeed === 'fast' ? '30 sec' : '8 hour';
  const speedIcon = queue.draftSpeed === 'fast' ? '⚡' : '🕐';
  const isMember = queue.members.some(m => m.wallet === userId);

  const timeUntil = (ts: number | null) => {
    if (!ts) return '';
    const diff = ts - Date.now();
    if (diff <= 0) return 'Now!';
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  return (
    <div className={`rounded-xl border ${isMember ? 'border-banana/40 bg-banana/5' : 'border-white/10 bg-white/[0.02]'} p-4 flex flex-col gap-3`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span>{isJackpot ? '🔥' : '🏆'}</span>
          <span className="font-bold text-sm" style={{ color }}>{label}</span>
          <span className="text-white/40 text-xs">·</span>
          <span className="text-white/60 text-xs">{speedIcon} {speedLabel}</span>
        </div>
        <span className="text-white font-bold text-sm">{queue.members.length}/10</span>
      </div>

      <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${(queue.members.length / 10) * 100}%`, backgroundColor: color }}
        />
      </div>

      {queue.status === 'scheduled' && (
        <div className="flex items-center justify-between">
          <span className="text-green-400 text-xs font-semibold">Scheduled</span>
          <span className="text-white text-sm font-bold">{timeUntil(queue.scheduledTime)}</span>
        </div>
      )}

      {queue.status === 'drafting' && (
        <span className="text-banana text-xs font-bold animate-pulse">Draft In Progress!</span>
      )}

      {isMember && queue.status === 'filling' && (
        <span className="text-banana text-xs">You're in this queue</span>
      )}

      {queue.members.length > 0 && (
        <div className="text-xs text-white/30 space-y-0.5">
          {queue.members.map(m => (
            <span key={m.wallet} className={`block ${m.wallet === userId ? 'text-banana' : ''}`}>
              {m.wallet === userId ? 'You' : `${m.wallet.slice(0, 6)}...${m.wallet.slice(-4)}`}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export default function SpecialDraftsPage() {
  const { user, isLoggedIn } = useAuth();
  const [queues, setQueues] = useState<Record<string, DraftQueue> | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchQueues = useCallback(async () => {
    try {
      const data = await fetchJson<Record<string, DraftQueue>>('/api/queues');
      setQueues(data);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchQueues();
    const interval = setInterval(fetchQueues, 10000);
    return () => clearInterval(interval);
  }, [fetchQueues]);

  const queueIds = ['jackpot-fast', 'jackpot-slow', 'hof-fast', 'hof-slow'];

  return (
    <div className="w-full px-4 sm:px-8 lg:px-12 pt-16 pb-20 min-h-[calc(100vh-64px)]">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-2">Special Drafts</h1>
        <p className="text-white/50 mb-8">
          Win Jackpot or HOF on the Banana Wheel → pick your speed → auto-queued.
          Once 10 winners fill a queue, the draft is scheduled 48 hours out.
        </p>

        {/* Join buttons for users with entries */}
        {isLoggedIn && user && ((user.jackpotEntries || 0) > 0 || (user.hofEntries || 0) > 0) && (
          <div className="space-y-4 mb-8">
            {(user.jackpotEntries || 0) > 0 && (
              <JoinSection type="jackpot" entries={user.jackpotEntries || 0} userId={user.id} onJoined={fetchQueues} />
            )}
            {(user.hofEntries || 0) > 0 && (
              <JoinSection type="hof" entries={user.hofEntries || 0} userId={user.id} onJoined={fetchQueues} />
            )}
          </div>
        )}

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4].map(i => <div key={i} className="h-28 rounded-xl bg-white/[0.03] animate-pulse" />)}
          </div>
        ) : queues ? (
          <div className="space-y-3">
            {queueIds.map(id => queues[id] && (
              <QueueCard key={id} queue={queues[id]} userId={user?.id} />
            ))}
          </div>
        ) : (
          <p className="text-white/40">Failed to load queues.</p>
        )}

        {/* How it works */}
        <div className="mt-12 border-t border-white/10 pt-8">
          <h2 className="text-lg font-bold text-white mb-4">How It Works</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { step: '1', title: 'Win on the Wheel', desc: 'Land on Jackpot or HOF' },
              { step: '2', title: 'Pick Your Speed', desc: '30 sec, 8 hour, or either — auto-queued' },
              { step: '3', title: 'Draft Starts', desc: 'Once 10 fill, scheduled 48hrs out' },
            ].map(s => (
              <div key={s.step} className="text-center">
                <div className="w-8 h-8 rounded-full bg-banana/20 text-banana font-bold text-sm flex items-center justify-center mx-auto mb-2">
                  {s.step}
                </div>
                <h3 className="text-white font-semibold text-sm">{s.title}</h3>
                <p className="text-white/40 text-xs mt-1">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
