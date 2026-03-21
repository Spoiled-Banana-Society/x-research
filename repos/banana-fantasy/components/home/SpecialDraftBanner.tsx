'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';

export function SpecialDraftBanner() {
  const { user, isLoggedIn } = useAuth();

  if (!isLoggedIn || !user) return null;

  const jpEntries = user.jackpotEntries || 0;
  const hofEntries = user.hofEntries || 0;

  if (jpEntries <= 0 && hofEntries <= 0) return null;

  return (
    <Link
      href="/special-drafts"
      className="block w-full max-w-3xl mx-auto mb-6 group"
    >
      <div className="relative overflow-hidden rounded-2xl border border-banana/30 bg-gradient-to-r from-banana/10 via-banana/5 to-transparent p-4 sm:p-5 transition-all hover:border-banana/50 hover:shadow-[0_0_20px_rgba(251,191,36,0.15)]">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{jpEntries > 0 ? '🔥' : '🏆'}</span>
            <div>
              <p className="text-white font-semibold text-sm sm:text-base">
                You have {jpEntries > 0 && <span className="text-red-400">{jpEntries} Jackpot</span>}
                {jpEntries > 0 && hofEntries > 0 && ' & '}
                {hofEntries > 0 && <span className="text-yellow-400">{hofEntries} HOF</span>}
                {' '}
                {(jpEntries + hofEntries) === 1 ? 'entry' : 'entries'}!
              </p>
              <p className="text-white/40 text-xs sm:text-sm">Join the queue for an exclusive draft against other winners</p>
            </div>
          </div>
          <span className="text-banana font-semibold text-sm whitespace-nowrap group-hover:translate-x-1 transition-transform">
            View Queue →
          </span>
        </div>
      </div>
    </Link>
  );
}
