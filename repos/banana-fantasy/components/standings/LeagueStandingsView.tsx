'use client';

import React from 'react';
import { formatScore } from '@/lib/formatters';
import { useLeagueDetail } from '@/hooks/useStandings';
import type { League } from '@/types';

interface LeagueStandingsViewProps {
  league: League;
  gameweek: string;
}

export function LeagueStandingsView({ league, gameweek }: LeagueStandingsViewProps) {
  const draftId = league.id;
  const { data: rawStandings, isValidating, error } = useLeagueDetail(draftId, gameweek);

  // Map raw API data to display format
  const standings = (rawStandings || []).map((entry: unknown, idx: number) => {
    if (typeof entry !== 'object' || !entry) {
      return { rank: idx + 1, displayName: '-', weeklyScore: 0, seasonScore: 0, isCurrentUser: false };
    }
    const e = entry as Record<string, unknown>;
    return {
      rank: typeof e.rank === 'number' ? e.rank : idx + 1,
      displayName: String(e.displayName || e.ownerWallet || e.cardId || '-').slice(0, 20),
      weeklyScore: Number(e.weeklyScore ?? e.weekScore ?? e.scoreWeek ?? 0),
      seasonScore: Number(e.seasonScore ?? e.scoreSeason ?? 0),
      isCurrentUser: Boolean(e.isCurrentUser),
    };
  });

  if (isValidating && standings.length === 0) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="h-12 rounded-lg bg-white/[0.03] animate-pulse" />
        ))}
      </div>
    );
  }

  if (error || standings.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-white/40 text-sm">League standings not available yet</p>
        <p className="text-white/25 text-xs mt-1">Check back after gameweek scores are calculated</p>
      </div>
    );
  }

  return (
    <div>
      {/* Table header */}
      <div className="grid grid-cols-[40px_1fr_80px_80px] sm:grid-cols-[50px_1fr_100px_100px] gap-2 px-3 py-2 text-[10px] uppercase tracking-wider text-white/30 font-medium">
        <div>#</div>
        <div>Player</div>
        <div className="text-right">Weekly</div>
        <div className="text-right">Season</div>
      </div>

      <div className="space-y-1">
        {standings.map((entry, idx: number) => {
          const isTop2 = entry.rank <= 2;
          return (
            <React.Fragment key={idx}>
              <div
                className={`
                  grid grid-cols-[40px_1fr_80px_80px] sm:grid-cols-[50px_1fr_100px_100px] gap-2 px-3 py-2.5 rounded-lg items-center transition-colors
                  ${entry.isCurrentUser ? 'bg-banana/[0.08] ring-1 ring-banana/20' : 'hover:bg-white/[0.03]'}
                `}
              >
                {/* Rank */}
                <div>
                  {entry.rank <= 3 ? (
                    <span
                      className={`
                        w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold
                        ${entry.rank === 1 ? 'bg-yellow-500 text-black' : ''}
                        ${entry.rank === 2 ? 'bg-gray-400 text-black' : ''}
                        ${entry.rank === 3 ? 'bg-orange-600 text-white' : ''}
                      `}
                    >
                      {entry.rank}
                    </span>
                  ) : (
                    <span className="text-white/50 text-sm font-medium">{entry.rank}</span>
                  )}
                </div>

                {/* Name */}
                <div className={`text-sm font-medium truncate ${entry.isCurrentUser ? 'text-banana' : 'text-white/80'}`}>
                  {entry.displayName}
                  {entry.isCurrentUser && <span className="ml-1.5 text-[10px] text-banana/60">(You)</span>}
                </div>

                {/* Weekly */}
                <div className="text-right text-white/60 text-sm">
                  {formatScore(entry.weeklyScore)}
                </div>

                {/* Season */}
                <div className={`text-right font-semibold text-sm ${entry.isCurrentUser ? 'text-banana' : 'text-white'}`}>
                  {formatScore(entry.seasonScore)}
                </div>
              </div>

              {/* Advancement line between rank 2 and 3 */}
              {isTop2 && entry.rank === 2 && standings.length > 2 && (
                <div className="flex items-center gap-2 px-3 py-1">
                  <div className="flex-1 h-px bg-green-500/30" />
                  <span className="text-[9px] uppercase tracking-wider text-green-500/50 font-medium">Advance</span>
                  <div className="flex-1 h-px bg-green-500/30" />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
