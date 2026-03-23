'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { fetchJson } from '@/lib/appApiClient';
import type { DraftQueue } from '@/types';

export function SpecialDraftBanner() {
  const { user, isLoggedIn } = useAuth();
  const [queuedCount, setQueuedCount] = useState(0);

  // Check if user is in any queue
  useEffect(() => {
    if (!isLoggedIn || !user?.id) return;
    fetchJson<Record<string, DraftQueue>>('/api/queues')
      .then(queues => {
        let total = 0;
        for (const q of Object.values(queues)) {
          total += (q.rounds || []).filter(r =>
            (r.status === 'filling' || r.status === 'ready') &&
            r.members.some(m => m.wallet === user.id)
          ).length;
        }
        setQueuedCount(total);
      })
      .catch(() => {});
  }, [isLoggedIn, user?.id]);

  if (!isLoggedIn || !user) return null;

  const jpEntries = user.jackpotEntries || 0;
  const hofEntries = user.hofEntries || 0;
  const hasEntries = jpEntries > 0 || hofEntries > 0;
  const hasQueues = queuedCount > 0;

  if (!hasEntries && !hasQueues) return null;

  return (
    <Link
      href="/special-drafts"
      className="block w-full max-w-3xl mx-auto mb-6 group"
    >
      <div className="relative overflow-hidden rounded-2xl border border-banana/30 bg-gradient-to-r from-banana/10 via-banana/5 to-transparent p-4 sm:p-5 transition-all hover:border-banana/50 hover:shadow-[0_0_20px_rgba(251,191,36,0.15)]">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{jpEntries > 0 ? '🔥' : hasQueues ? '⏳' : '🏆'}</span>
            <div>
              {hasEntries ? (
                <p className="text-white font-semibold text-sm sm:text-base">
                  You have {jpEntries > 0 && <span className="text-red-400">{jpEntries} Jackpot</span>}
                  {jpEntries > 0 && hofEntries > 0 && ' & '}
                  {hofEntries > 0 && <span className="text-yellow-400">{hofEntries} HOF</span>}
                  {' '}{(jpEntries + hofEntries) === 1 ? 'entry' : 'entries'}!
                </p>
              ) : (
                <p className="text-white font-semibold text-sm sm:text-base">
                  You have <span className="text-banana">{queuedCount}</span> special draft{queuedCount !== 1 ? 's' : ''} queued
                </p>
              )}
              <p className="text-white/40 text-xs sm:text-sm">
                {hasEntries
                  ? 'Spin the wheel to queue up'
                  : 'Waiting for 10 winners · Draft starts immediately when full'}
              </p>
            </div>
          </div>
          <span className="text-banana font-semibold text-sm whitespace-nowrap group-hover:translate-x-1 transition-transform">
            View →
          </span>
        </div>
      </div>
    </Link>
  );
}
