'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { fetchJson } from '@/lib/appApiClient';
import type { DraftQueue, QueueRound } from '@/types';

function JoinSection({ type, entries, userId, queues, onJoined }: {
  type: 'jackpot' | 'hof';
  entries: number;
  userId: string;
  queues: Record<string, DraftQueue>;
  onJoined: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const isJackpot = type === 'jackpot';
  const color = isJackpot ? '#ef4444' : '#D4AF37';
  const label = isJackpot ? 'Jackpot' : 'HOF';

  // Check current membership across all speeds
  const countRoundsIn = (speed: 'fast' | 'slow') => {
    const q = queues[`${type}-${speed}`];
    if (!q?.rounds) return 0;
    return q.rounds.filter(r => r.status === 'filling' && r.members.some(m => m.wallet === userId)).length;
  };
  const inFast = countRoundsIn('fast');
  const inSlow = countRoundsIn('slow');
  const currentSpeed: 'fast' | 'slow' | 'any' | null = inFast > 0 && inSlow > 0 ? 'any' : inFast > 0 ? 'fast' : inSlow > 0 ? 'slow' : null;
  const totalQueued = inFast + inSlow;

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

  const options = [
    { label: '⚡ 30 sec', value: 'fast' as const, desc: 'Live draft' },
    { label: '🕐 8 hour', value: 'slow' as const, desc: 'Draft over days' },
    { label: '🤷 Don\'t care', value: 'any' as const, desc: 'Whichever fills first' },
  ];

  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-xl">{isJackpot ? '🔥' : '🏆'}</span>
        <span className="font-bold" style={{ color }}>{label}</span>
      </div>
      <p className="text-white/40 text-sm mb-3">
        {entries > 0 && `${entries} ${entries === 1 ? 'entry' : 'entries'} available`}
        {entries > 0 && totalQueued > 0 && ' · '}
        {totalQueued > 0 && `${totalQueued} in queue`}
        {entries === 0 && totalQueued === 0 && 'No entries — spin the wheel!'}
      </p>
      {(entries > 0 || totalQueued > 0) && (
        <>
          <p className="text-white/50 text-xs mb-2">
            {currentSpeed ? 'Change speed (moves all entries):' : 'Pick your draft speed:'}
          </p>
          <div className="flex gap-2">
            {options.map(opt => {
              const isSelected = currentSpeed === opt.value;
              return (
                <button
                  key={opt.value}
                  onClick={() => handleJoin(opt.value)}
                  disabled={loading || (isSelected && entries === 0)}
                  className={`flex-1 py-2.5 px-2 rounded-xl text-xs font-semibold transition-all border ${
                    isSelected
                      ? 'border-banana bg-banana/15 text-banana'
                      : 'border-white/20 hover:border-banana hover:bg-banana/10 text-white'
                  } disabled:opacity-70`}
                >
                  <span className="block">{opt.label}</span>
                  <span className="block text-[10px] mt-0.5 font-normal text-white/40">{opt.desc}</span>
                </button>
              );
            })}
          </div>
          {currentSpeed === 'any' && (
            <p className="text-white/30 text-xs mt-2 text-center">
              You're in both queues but will only draft in one — whichever fills first.
            </p>
          )}
        </>
      )}
    </div>
  );
}

function RoundRow({ round, userId, queueLabel }: { round: QueueRound; userId?: string; queueLabel: string }) {
  const isMember = round.members.some(m => m.wallet === userId);
  const timeUntil = (ts: number | null) => {
    if (!ts) return '';
    const diff = ts - Date.now();
    if (diff <= 0) return 'Now!';
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  return (
    <div className={`rounded-lg border ${isMember ? 'border-banana/30 bg-banana/5' : 'border-white/[0.06] bg-white/[0.01]'} p-3`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-white/50 text-xs font-mono">Draft #{round.roundId}</span>
          {isMember && <span className="text-banana text-[10px] font-semibold">YOU</span>}
        </div>
        <div className="flex items-center gap-2">
          {round.status === 'scheduled' && (
            <span className="text-green-400 text-xs font-semibold">{timeUntil(round.scheduledTime)}</span>
          )}
          {round.status === 'drafting' && (
            <span className="text-banana text-xs font-semibold animate-pulse">Live!</span>
          )}
          <span className="text-white font-bold text-xs">{round.members.length}/10</span>
        </div>
      </div>
      <div className="h-1 bg-white/10 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${(round.members.length / 10) * 100}%`,
            backgroundColor: round.status === 'scheduled' ? '#4ade80' : round.status === 'drafting' ? '#fbbf24' : '#6b7280',
          }}
        />
      </div>
    </div>
  );
}

function QueueSection({ queue, userId }: { queue: DraftQueue; userId?: string }) {
  const isJackpot = queue.type === 'jackpot';
  const color = isJackpot ? '#ef4444' : '#D4AF37';
  const label = isJackpot ? 'Jackpot' : 'HOF';
  const speedLabel = queue.draftSpeed === 'fast' ? '30 sec' : '8 hour';
  const speedIcon = queue.draftSpeed === 'fast' ? '⚡' : '🕐';
  const activeRounds = queue.rounds?.filter(r => r.status !== 'completed') || [];

  if (activeRounds.length === 0) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 px-1">
        <span>{isJackpot ? '🔥' : '🏆'}</span>
        <span className="font-bold text-sm" style={{ color }}>{label}</span>
        <span className="text-white/30 text-xs">·</span>
        <span className="text-white/50 text-xs">{speedIcon} {speedLabel}</span>
      </div>
      {activeRounds.map(round => (
        <RoundRow key={round.roundId} round={round} userId={userId} queueLabel={`${label} ${speedLabel}`} />
      ))}
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
  const hasActiveRounds = queues && queueIds.some(id => queues[id]?.rounds?.some(r => r.status !== 'completed'));

  return (
    <div className="w-full px-4 sm:px-8 lg:px-12 pt-16 pb-20 min-h-[calc(100vh-64px)]">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-2">Special Drafts</h1>
        <p className="text-white/50 mb-8">
          Win Jackpot or HOF on the Banana Wheel → pick your speed → auto-queued.
          Each entry = one draft. You'll never be in the same draft twice.
        </p>

        {/* Join sections */}
        {isLoggedIn && user && queues && (
          <div className="space-y-3 mb-8">
            <JoinSection type="jackpot" entries={user.jackpotEntries || 0} userId={user.id} queues={queues} onJoined={fetchQueues} />
            <JoinSection type="hof" entries={user.hofEntries || 0} userId={user.id} queues={queues} onJoined={fetchQueues} />
          </div>
        )}

        {/* Active queues with rounds */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2].map(i => <div key={i} className="h-20 rounded-xl bg-white/[0.03] animate-pulse" />)}
          </div>
        ) : hasActiveRounds ? (
          <div className="space-y-6">
            {queueIds.map(id => queues![id] && (
              <QueueSection key={id} queue={queues![id]} userId={user?.id} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-white/30">
            <p className="text-lg mb-1">No active queues yet</p>
            <p className="text-sm">Win entries from the Banana Wheel to get started</p>
          </div>
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
