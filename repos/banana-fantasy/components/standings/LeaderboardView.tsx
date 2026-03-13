'use client';

import React, { useState, useMemo } from 'react';
import { formatScore } from '@/lib/formatters';
import { fetchJson } from '@/lib/appApiClient';
import { useSWRLike } from '@/hooks/useSWRLike';
import type { LeaderboardEntry } from '@/types';

interface LeaderboardViewProps {
  gameweek: string;
}

type LevelFilter = 'all' | 'Pro' | 'HOF' | 'Jackpot';
type SortField = 'SeasonScore' | 'WeekScore';

const filterPills: { id: LevelFilter; label: string; color: string }[] = [
  { id: 'all', label: 'All', color: 'bg-white/10 text-white/70 hover:bg-white/20' },
  { id: 'Pro', label: 'Pro', color: 'bg-pro/20 text-pro hover:bg-pro/30' },
  { id: 'HOF', label: 'HOF', color: 'bg-hof/20 text-hof hover:bg-hof/30' },
  { id: 'Jackpot', label: 'Jackpot', color: 'bg-jackpot/20 text-jackpot hover:bg-jackpot/30' },
];

const PAGE_SIZE = 20;

export function LeaderboardView({ gameweek }: LeaderboardViewProps) {
  const [level, setLevel] = useState<LevelFilter>('all');
  const [sortField, setSortField] = useState<SortField>('SeasonScore');
  const [page, setPage] = useState(0);

  const cacheKey = `leaderboard:${gameweek}:${level}:${sortField}`;
  const { data: entries, isValidating } = useSWRLike<LeaderboardEntry[]>(
    cacheKey,
    ({ signal }) =>
      fetchJson<LeaderboardEntry[]>('/api/leaderboard', {
        signal,
        query: { gameweek, level, orderBy: sortField, limit: '200' },
      }),
    { fallbackData: [] },
  );

  // Client-side pagination
  const totalPages = Math.ceil((entries?.length ?? 0) / PAGE_SIZE);
  const pageEntries = useMemo(() => {
    const start = page * PAGE_SIZE;
    return (entries || []).slice(start, start + PAGE_SIZE);
  }, [entries, page]);

  // Reset page when filter changes
  const handleLevelChange = (l: LevelFilter) => {
    setLevel(l);
    setPage(0);
  };

  return (
    <div>
      {/* Filter pills + sort toggle */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div className="flex gap-2">
          {filterPills.map((pill) => (
            <button
              key={pill.id}
              onClick={() => handleLevelChange(pill.id)}
              className={`
                text-xs font-semibold px-3 py-1.5 rounded-full transition-all
                ${level === pill.id
                  ? pill.id === 'all'
                    ? 'bg-white/20 text-white ring-1 ring-white/30'
                    : `${pill.color} ring-1 ring-current/30`
                  : 'bg-white/[0.04] text-white/40 hover:text-white/60'
                }
              `}
            >
              {pill.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1 bg-white/[0.04] rounded-lg p-0.5">
          <button
            onClick={() => { setSortField('SeasonScore'); setPage(0); }}
            className={`text-xs px-3 py-1.5 rounded-md transition-colors ${
              sortField === 'SeasonScore' ? 'bg-banana text-black font-semibold' : 'text-white/50 hover:text-white/70'
            }`}
          >
            Season
          </button>
          <button
            onClick={() => { setSortField('WeekScore'); setPage(0); }}
            className={`text-xs px-3 py-1.5 rounded-md transition-colors ${
              sortField === 'WeekScore' ? 'bg-banana text-black font-semibold' : 'text-white/50 hover:text-white/70'
            }`}
          >
            Weekly
          </button>
        </div>
      </div>

      {/* Loading skeleton */}
      {isValidating && (!entries || entries.length === 0) && (
        <div className="space-y-2">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="h-14 rounded-lg bg-white/[0.03] animate-pulse" />
          ))}
        </div>
      )}

      {/* Table */}
      {pageEntries.length > 0 && (
        <div className="rounded-xl border border-white/[0.06] overflow-hidden">
          {/* Header */}
          <div className="grid grid-cols-[40px_1fr_80px_80px] sm:grid-cols-[50px_1fr_100px_100px] gap-2 px-4 py-3 bg-white/[0.03] border-b border-white/[0.06]">
            <div className="text-[10px] uppercase tracking-wider text-white/30 font-medium">#</div>
            <div className="text-[10px] uppercase tracking-wider text-white/30 font-medium">Player</div>
            <div className="text-[10px] uppercase tracking-wider text-white/30 font-medium text-right">Weekly</div>
            <div className="text-[10px] uppercase tracking-wider text-white/30 font-medium text-right">Season</div>
          </div>

          {/* Rows */}
          <div className="divide-y divide-white/[0.04]">
            {pageEntries.map((entry, idx) => (
              <div
                key={`${entry.rank}-${idx}`}
                className={`
                  grid grid-cols-[40px_1fr_80px_80px] sm:grid-cols-[50px_1fr_100px_100px] gap-2 px-4 py-3 items-center transition-colors
                  ${entry.isCurrentUser ? 'bg-banana/[0.08]' : 'hover:bg-white/[0.03]'}
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
                    <span className="text-white/50 text-sm">{entry.rank}</span>
                  )}
                </div>

                {/* Player */}
                <div className="min-w-0">
                  <p className={`text-sm font-medium truncate ${entry.isCurrentUser ? 'text-banana' : 'text-white'}`}>
                    {entry.username}
                    {entry.isCurrentUser && <span className="ml-1.5 text-[10px] text-banana/60">(You)</span>}
                  </p>
                  {entry.teamName && (
                    <p className="text-white/30 text-xs truncate">{entry.teamName}</p>
                  )}
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
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {!isValidating && pageEntries.length === 0 && (
        <div className="text-center py-12">
          <p className="text-white/40">No leaderboard data available</p>
          <p className="text-white/25 text-xs mt-1">Scores will appear once gameweek scoring completes</p>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-4">
          <button
            onClick={() => setPage(Math.max(0, page - 1))}
            disabled={page === 0}
            className="text-xs px-3 py-1.5 rounded-lg bg-white/[0.04] text-white/50 hover:bg-white/[0.08] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            Prev
          </button>
          <span className="text-white/40 text-xs">
            {page + 1} / {totalPages}
          </span>
          <button
            onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
            disabled={page >= totalPages - 1}
            className="text-xs px-3 py-1.5 rounded-lg bg-white/[0.04] text-white/50 hover:bg-white/[0.08] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
