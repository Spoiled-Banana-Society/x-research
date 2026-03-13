'use client';

import React from 'react';
import { formatScore, formatRank } from '@/lib/formatters';
import type { League } from '@/types';

interface TeamCardProps {
  league: League;
  isSelected: boolean;
  onSelect: (league: League) => void;
}

const typeConfig = {
  jackpot: { label: 'Jackpot', color: 'bg-jackpot', text: 'text-jackpot', border: 'border-jackpot/40', glow: 'from-jackpot/10' },
  hof: { label: 'HOF', color: 'bg-hof', text: 'text-hof', border: 'border-hof/40', glow: 'from-hof/10' },
  pro: { label: 'Pro', color: 'bg-pro', text: 'text-pro', border: 'border-pro/40', glow: 'from-pro/10' },
  regular: { label: 'Pro', color: 'bg-pro', text: 'text-pro', border: 'border-pro/40', glow: 'from-pro/10' },
};

export function TeamCard({ league, isSelected, onSelect }: TeamCardProps) {
  const config = typeConfig[league.type] || typeConfig.regular;

  return (
    <button
      onClick={() => onSelect(league)}
      className={`
        w-full text-left rounded-2xl overflow-hidden border transition-all duration-200
        ${isSelected
          ? 'border-banana/50 bg-banana/[0.06] ring-1 ring-banana/20'
          : `${config.border} bg-white/[0.02] hover:bg-white/[0.04]`
        }
      `}
    >
      <div className="flex items-stretch">
        {/* Type accent bar */}
        <div className={`w-1 ${config.color} flex-shrink-0`} />

        <div className="flex-1 px-4 py-4 sm:px-5">
          {/* Top row: league name + type badge */}
          <div className="flex items-center gap-2 mb-3">
            <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${config.color}/20 ${config.text}`}>
              {config.label}
            </span>
            <h3 className="text-white font-medium text-sm sm:text-base truncate">{league.name}</h3>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <p className="text-white/40 text-[10px] uppercase tracking-wider mb-0.5">Rank</p>
              <p className="text-white font-bold text-lg">{league.leagueRank > 0 ? formatRank(league.leagueRank) : '-'}</p>
            </div>
            <div>
              <p className="text-white/40 text-[10px] uppercase tracking-wider mb-0.5">Weekly</p>
              <p className="text-white/80 font-semibold text-lg">{formatScore(league.weeklyScore)}</p>
            </div>
            <div>
              <p className="text-white/40 text-[10px] uppercase tracking-wider mb-0.5">Season</p>
              <p className="text-banana font-bold text-lg">{formatScore(league.seasonScore)}</p>
            </div>
          </div>
        </div>

        {/* Arrow indicator */}
        <div className="flex items-center pr-4 flex-shrink-0">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`transition-transform duration-200 ${isSelected ? 'text-banana rotate-90' : 'text-white/20'}`}
          >
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </div>
      </div>
    </button>
  );
}
