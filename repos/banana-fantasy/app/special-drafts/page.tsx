'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { fetchJson } from '@/lib/appApiClient';
import type { DraftQueue, QueueType } from '@/types';

function QueueCard({ queue, userId, onAction }: {
  queue: DraftQueue;
  userId: string | undefined;
  onAction: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const isMember = queue.members.some(m => m.wallet === userId);
  const myVote = queue.members.find(m => m.wallet === userId)?.vote;
  const isJackpot = queue.type === 'jackpot';
  const color = isJackpot ? '#ef4444' : '#D4AF37';
  const label = isJackpot ? 'JACKPOT' : 'HALL OF FAME';

  const handleAction = async (action: string, extra?: Record<string, string>) => {
    if (!userId) return;
    setLoading(true);
    try {
      await fetchJson('/api/queues', {
        method: 'POST',
        body: JSON.stringify({ action, userId, queueType: queue.type, ...extra }),
      });
      onAction();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Action failed');
    } finally {
      setLoading(false);
    }
  };

  const timeUntil = (ts: number | null) => {
    if (!ts) return '';
    const diff = ts - Date.now();
    if (diff <= 0) return 'Now';
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-sm p-6 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <span className="text-2xl">{isJackpot ? '🔥' : '🏆'}</span>
        <div>
          <h3 className="text-lg font-bold" style={{ color }}>{label}</h3>
          <p className="text-white/50 text-sm">Draft Queue</p>
        </div>
      </div>

      {/* Progress */}
      <div>
        <div className="flex justify-between text-sm mb-2">
          <span className="text-white/60">Players</span>
          <span className="font-bold text-white">{queue.members.length}/10</span>
        </div>
        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${(queue.members.length / 10) * 100}%`, backgroundColor: color }}
          />
        </div>
      </div>

      {/* Status-specific content */}
      {queue.status === 'filling' && (
        <div className="text-center">
          <p className="text-white/50 text-sm mb-3">
            {queue.members.length === 0
              ? 'Be the first to join!'
              : `Waiting for ${10 - queue.members.length} more winner${10 - queue.members.length !== 1 ? 's' : ''}...`}
          </p>
          {!isMember ? (
            <button
              onClick={() => handleAction('join')}
              disabled={loading || !userId}
              className="w-full py-3 rounded-xl font-semibold text-black transition-all hover:brightness-110 disabled:opacity-50"
              style={{ backgroundColor: color }}
            >
              {loading ? 'Joining...' : `Join ${label} Queue`}
            </button>
          ) : (
            <button
              onClick={() => handleAction('leave')}
              disabled={loading}
              className="w-full py-3 rounded-xl font-semibold border border-white/20 text-white/70 hover:bg-white/5 transition-all disabled:opacity-50"
            >
              {loading ? 'Leaving...' : 'Leave Queue'}
            </button>
          )}
        </div>
      )}

      {queue.status === 'voting' && (
        <div className="text-center">
          <p className="text-banana font-semibold mb-1">Vote on Draft Speed!</p>
          <p className="text-white/40 text-xs mb-3">
            {queue.votingDeadline ? `Voting ends in ${timeUntil(queue.votingDeadline)}` : 'Vote now'}
          </p>
          {isMember && (
            <div className="flex gap-2">
              <button
                onClick={() => handleAction('vote', { speed: 'fast' })}
                disabled={loading}
                className={`flex-1 py-3 rounded-xl font-semibold text-sm transition-all border ${
                  myVote === 'fast'
                    ? 'border-banana bg-banana/15 text-banana'
                    : 'border-white/20 text-white/60 hover:border-white/40'
                }`}
              >
                ⚡ Fast (30s)
              </button>
              <button
                onClick={() => handleAction('vote', { speed: 'slow' })}
                disabled={loading}
                className={`flex-1 py-3 rounded-xl font-semibold text-sm transition-all border ${
                  myVote === 'slow'
                    ? 'border-banana bg-banana/15 text-banana'
                    : 'border-white/20 text-white/60 hover:border-white/40'
                }`}
              >
                🕐 Slow (8hr)
              </button>
            </div>
          )}
          <p className="text-white/30 text-xs mt-2">
            {queue.members.filter(m => m.vote).length}/10 voted
          </p>
        </div>
      )}

      {queue.status === 'scheduled' && (
        <div className="text-center">
          <p className="text-green-400 font-semibold mb-1">Draft Scheduled!</p>
          <p className="text-white text-2xl font-bold mb-1">
            {queue.scheduledTime ? timeUntil(queue.scheduledTime) : '—'}
          </p>
          <p className="text-white/40 text-sm">
            {queue.draftSpeed === 'fast' ? '⚡ Fast Draft (30s picks)' : '🕐 Slow Draft (8hr picks)'}
          </p>
          {queue.scheduledTime && (
            <p className="text-white/30 text-xs mt-2">
              {new Date(queue.scheduledTime).toLocaleString()}
            </p>
          )}
        </div>
      )}

      {queue.status === 'drafting' && (
        <div className="text-center">
          <p className="text-banana font-bold text-lg animate-pulse">Draft In Progress!</p>
        </div>
      )}

      {/* Member list */}
      {queue.members.length > 0 && (
        <div className="border-t border-white/10 pt-3">
          <p className="text-white/40 text-xs uppercase tracking-wider mb-2">Players</p>
          <div className="space-y-1">
            {queue.members.map((m, i) => (
              <div key={m.wallet} className="flex items-center justify-between text-sm">
                <span className={`font-mono ${m.wallet === userId ? 'text-banana' : 'text-white/60'}`}>
                  {m.wallet === userId ? 'You' : `${m.wallet.slice(0, 6)}...${m.wallet.slice(-4)}`}
                </span>
                {queue.status === 'voting' && (
                  <span className={`text-xs ${m.vote ? 'text-green-400' : 'text-white/30'}`}>
                    {m.vote ? (m.vote === 'fast' ? '⚡' : '🕐') : '—'}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function SpecialDraftsPage() {
  const { user, isLoggedIn } = useAuth();
  const [queues, setQueues] = useState<{ jackpot: DraftQueue; hof: DraftQueue } | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchQueues = useCallback(async () => {
    try {
      const data = await fetchJson<{ jackpot: DraftQueue; hof: DraftQueue }>('/api/queues');
      setQueues(data);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchQueues();
    const interval = setInterval(fetchQueues, 10000);
    return () => clearInterval(interval);
  }, [fetchQueues]);

  const jpEntries = user?.jackpotEntries || 0;
  const hofEntries = user?.hofEntries || 0;

  return (
    <div className="w-full px-4 sm:px-8 lg:px-12 pt-16 pb-20 min-h-[calc(100vh-64px)]">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-2">Special Drafts</h1>
        <p className="text-white/50 mb-8">
          Win Jackpot or HOF entries from the Banana Wheel, then queue up for exclusive drafts against other winners.
        </p>

        {/* Entry counts */}
        {isLoggedIn && (jpEntries > 0 || hofEntries > 0) && (
          <div className="flex gap-4 mb-6">
            {jpEntries > 0 && (
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/30">
                <span>🔥</span>
                <span className="text-red-400 font-semibold">{jpEntries} Jackpot {jpEntries === 1 ? 'Entry' : 'Entries'}</span>
              </div>
            )}
            {hofEntries > 0 && (
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-yellow-500/10 border border-yellow-500/30">
                <span>🏆</span>
                <span className="text-yellow-400 font-semibold">{hofEntries} HOF {hofEntries === 1 ? 'Entry' : 'Entries'}</span>
              </div>
            )}
          </div>
        )}

        {/* Queue cards */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="h-64 rounded-2xl bg-white/[0.03] animate-pulse" />
            <div className="h-64 rounded-2xl bg-white/[0.03] animate-pulse" />
          </div>
        ) : queues ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <QueueCard queue={queues.jackpot} userId={user?.id} onAction={fetchQueues} />
            <QueueCard queue={queues.hof} userId={user?.id} onAction={fetchQueues} />
          </div>
        ) : (
          <p className="text-white/40">Failed to load queues.</p>
        )}

        {/* How it works */}
        <div className="mt-12 border-t border-white/10 pt-8">
          <h2 className="text-xl font-bold text-white mb-4">How It Works</h2>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            {[
              { step: '1', title: 'Win an Entry', desc: 'Spin the Banana Wheel and land on Jackpot or HOF' },
              { step: '2', title: 'Join the Queue', desc: 'Use your entry to join the queue. Need 10 winners.' },
              { step: '3', title: 'Vote on Speed', desc: 'All 10 vote: fast (30s) or slow (8hr) picks' },
              { step: '4', title: 'Draft!', desc: 'Draft scheduled 48hrs out. No-shows auto-pick.' },
            ].map(s => (
              <div key={s.step} className="text-center">
                <div className="w-10 h-10 rounded-full bg-banana/20 text-banana font-bold text-lg flex items-center justify-center mx-auto mb-2">
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
