'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { fetchJson } from '@/lib/appApiClient';
import type { DraftQueue, QueueRound } from '@/types';

function RoundRow({ round, userId, typeLabel, queueType }: { round: QueueRound; userId?: string; typeLabel: string; queueType: string }) {
  const router = useRouter();
  const isMember = round.members.some(m => m.wallet?.toLowerCase() === userId?.toLowerCase());
  const [creating, setCreating] = useState(false);

  async function handleEnterDraft() {
    // If draftId already exists, navigate directly
    if (round.draftId) {
      router.push(`/draft-room?draftId=${round.draftId}&id=${round.draftId}&speed=slow&mode=live&wallet=${userId || ''}&special=true&specialType=${queueType}`);
      return;
    }

    // No draftId yet — create the draft via our API
    setCreating(true);
    try {
      const res = await fetchJson<{ draftId: string }>('/api/queues/create-draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userId || '',
          queueType,
          roundId: round.roundId,
        }),
      });

      if (res.draftId) {
        router.push(`/draft-room?draftId=${res.draftId}&id=${res.draftId}&speed=slow&mode=live&wallet=${userId || ''}&special=true&specialType=${queueType}`);
      } else {
        console.error('No draftId returned from create-draft');
        setCreating(false);
      }
    } catch (err) {
      console.error('Failed to create special draft:', err);
      // Fall back: navigate to draft room without draftId — it will create the draft itself
      router.push(`/draft-room?speed=slow&mode=live&wallet=${userId || ''}&special=true&specialType=${queueType}&queueRoundId=${round.roundId}&queueType=${queueType}`);
    }
  }

  return (
    <div className={`rounded-lg border ${isMember ? 'border-banana/30 bg-banana/5' : 'border-white/[0.06] bg-white/[0.01]'} p-3`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-white/50 text-xs font-mono">{typeLabel} #{round.roundId}</span>
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
          {round.status === 'filling' && round.draftId && `Enter now — waiting for ${10 - round.members.length} more winner${10 - round.members.length !== 1 ? 's' : ''}`}
          {round.status === 'filling' && !round.draftId && `Enter to watch the draft fill up`}
          {round.status === 'ready' && '10 winners in — draft is starting!'}
          {round.status === 'drafting' && 'Draft is live!'}
        </p>
        {isMember && (
          creating ? (
            <span className="px-3 py-1.5 bg-white/5 text-white/40 text-xs font-bold rounded-lg flex items-center gap-1.5">
              <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
              Entering...
            </span>
          ) : (
            <button
              onClick={handleEnterDraft}
              className="w-20 py-2 rounded-lg font-semibold text-sm text-center transition-all hover:scale-105 bg-white text-black hover:bg-white/90"
            >
              Enter Draft
            </button>
          )
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
    r.status !== 'completed' && r.members.some(m => m.wallet?.toLowerCase() === userId?.toLowerCase())
  );

  if (activeRounds.length === 0) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 px-1">
        <span>{isJackpot ? '🔥' : '🏆'}</span>
        <span className="font-bold text-sm" style={{ color }}>{label}</span>
        <span className="text-white/30 text-xs">·</span>
        <span className="text-white/50 text-xs">8-hour picks</span>
      </div>
      {activeRounds.map(round => (
        <RoundRow key={round.roundId} round={round} userId={userId} typeLabel={label} queueType={queue.type} />
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

  // Poll every 5s
  useEffect(() => {
    fetchQueues();
    const interval = setInterval(fetchQueues, 5000);
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
          Win Jackpot or HOF on the Banana Wheel and enter your exclusive 8-hour draft.
          Watch it fill up, then draft when 10 winners are in.
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
              { step: '2', title: 'Enter Draft Room', desc: 'Watch it fill as winners join' },
              { step: '3', title: 'Draft Starts', desc: '10 winners fill, bots auto-fill in staging' },
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
