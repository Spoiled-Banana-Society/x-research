'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { fetchJson } from '@/lib/appApiClient';
import type { DraftQueue, QueueRound } from '@/types';

function RoundRow({ round, userId }: { round: QueueRound; userId?: string }) {
  const isMember = round.members.some(m => m.wallet === userId);

  return (
    <div className={`rounded-lg border ${isMember ? 'border-banana/30 bg-banana/5' : 'border-white/[0.06] bg-white/[0.01]'} p-3`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-white/50 text-xs font-mono">Draft #{round.roundId}</span>
          {isMember && <span className="text-banana text-[10px] font-semibold">YOU</span>}
        </div>
        <div className="flex items-center gap-2">
          {round.status === 'ready' && (
            <span className="text-green-400 text-xs font-semibold animate-pulse">Starting!</span>
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
            backgroundColor: round.status === 'ready' ? '#4ade80' : round.status === 'drafting' ? '#fbbf24' : '#6b7280',
          }}
        />
      </div>
      <div className="flex items-center justify-between mt-1">
        <p className="text-white/30 text-[10px]">
          {round.status === 'filling' && `Waiting for ${10 - round.members.length} more winner${10 - round.members.length !== 1 ? 's' : ''} · Draft starts immediately when full`}
          {round.status === 'ready' && '10 winners in — draft is starting!'}
          {round.status === 'drafting' && 'Draft is live!'}
        </p>
        {(round.status === 'ready' || round.status === 'drafting') && round.draftId && isMember && (
          <a
            href={`/draft-room?id=${round.draftId}&speed=slow&mode=live&wallet=${userId || ''}`}
            className="px-3 py-1.5 bg-banana text-black text-xs font-bold rounded-lg hover:brightness-110 transition-all"
          >
            Enter Draft
          </a>
        )}
      </div>
    </div>
  );
}

function QueueSection({ queue, userId }: { queue: DraftQueue; userId?: string }) {
  const isJackpot = queue.type === 'jackpot';
  const color = isJackpot ? '#ef4444' : '#D4AF37';
  const label = isJackpot ? 'Jackpot' : 'HOF';
  const activeRounds = (queue.rounds || []).filter(r =>
    r.status !== 'completed' && r.members.some(m => m.wallet === userId)
  );

  if (activeRounds.length === 0) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 px-1">
        <span>{isJackpot ? '🔥' : '🏆'}</span>
        <span className="font-bold text-sm" style={{ color }}>{label}</span>
        <span className="text-white/30 text-xs">·</span>
        <span className="text-white/50 text-xs">🕐 8-hour picks</span>
      </div>
      {activeRounds.map(round => (
        <RoundRow key={round.roundId} round={round} userId={userId} />
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

  const hasActiveRounds = queues && Object.values(queues).some(q =>
    q.rounds?.some(r => r.status !== 'completed' && r.members.some(m => m.wallet === user?.id))
  );

  return (
    <div className="w-full px-4 sm:px-8 lg:px-12 pt-16 pb-20 min-h-[calc(100vh-64px)]">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-2">Special Drafts</h1>
        <p className="text-white/50 mb-8">
          Win Jackpot or HOF on the Banana Wheel → auto-queued for an exclusive 8-hour draft.
          Once 10 winners fill the queue, the draft starts immediately.
        </p>

        {loading ? (
          <div className="space-y-4">
            {[1, 2].map(i => <div key={i} className="h-20 rounded-xl bg-white/[0.03] animate-pulse" />)}
          </div>
        ) : hasActiveRounds ? (
          <div className="space-y-6">
            {queues && ['jackpot', 'hof'].map(type =>
              queues[type] && <QueueSection key={type} queue={queues[type]} userId={user?.id} />
            )}
          </div>
        ) : (
          <div className="text-center py-12 text-white/30">
            <p className="text-lg mb-1">No active queues</p>
            <p className="text-sm">Win Jackpot or HOF on the Banana Wheel to get started</p>
          </div>
        )}

        {/* How it works */}
        <div className="mt-12 border-t border-white/10 pt-8">
          <h2 className="text-lg font-bold text-white mb-4">How It Works</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { step: '1', title: 'Win on the Wheel', desc: 'Land on Jackpot or HOF' },
              { step: '2', title: 'Auto-Queued', desc: 'Placed in the next available draft' },
              { step: '3', title: 'Draft Starts', desc: '10 winners fill → draft begins immediately' },
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
