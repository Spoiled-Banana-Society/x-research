'use client';

import React from 'react';
import { formatScore, formatRank } from '@/lib/formatters';
import type { League } from '@/types';

interface TeamCardProps {
  league: League;
  isSelected: boolean;
  onSelect: (league: League) => void;
  index?: number;
}

const typeConfig = {
  jackpot: {
    label: 'Jackpot',
    color: 'bg-jackpot',
    text: 'text-jackpot',
    border: 'border-red-500/40',
    bg: 'bg-gradient-to-r from-red-500/15 via-red-500/5 to-transparent',
    accentBar: 'bg-gradient-to-b from-red-400 to-red-600',
  },
  hof: {
    label: 'HOF',
    color: 'bg-hof',
    text: 'text-hof',
    border: 'border-[#D4AF37]/40',
    bg: 'bg-gradient-to-r from-[#D4AF37]/15 via-[#D4AF37]/5 to-transparent',
    accentBar: 'bg-gradient-to-b from-[#D4AF37] to-yellow-700',
  },
  pro: {
    label: 'Pro',
    color: 'bg-pro',
    text: 'text-pro',
    border: 'border-purple-500/25',
    bg: 'bg-white/[0.02]',
    accentBar: 'bg-gradient-to-b from-purple-400 to-purple-700',
  },
  regular: {
    label: 'Pro',
    color: 'bg-pro',
    text: 'text-pro',
    border: 'border-purple-500/25',
    bg: 'bg-white/[0.02]',
    accentBar: 'bg-gradient-to-b from-purple-400 to-purple-700',
  },
};

function getPlaceBadge(place: number) {
  if (place === 1) {
    return (
      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center shadow-lg shadow-yellow-500/30 flex-shrink-0">
        <span className="text-xs font-bold text-black">1</span>
      </div>
    );
  }
  if (place === 2) {
    return (
      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-gray-300 to-gray-500 flex items-center justify-center shadow-lg shadow-gray-400/30 flex-shrink-0">
        <span className="text-xs font-bold text-black">2</span>
      </div>
    );
  }
  if (place === 3) {
    return (
      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-orange-400 to-orange-700 flex items-center justify-center shadow-lg shadow-orange-500/30 flex-shrink-0">
        <span className="text-xs font-bold text-white">3</span>
      </div>
    );
  }
  return (
    <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
      <span className="text-xs font-medium text-white/60">{place}</span>
    </div>
  );
}

export function TeamCard({ league, isSelected, onSelect, index = 0 }: TeamCardProps) {
  const config = typeConfig[league.type] || typeConfig.regular;
  const inTheMoney = league.leagueRank > 0 && league.leagueRank <= 2;
  const isCompleted = league.status === 'completed';

  return (
    <button
      onClick={() => onSelect(league)}
      className={`
        animate-card-enter w-full text-left rounded-2xl overflow-hidden border transition-all duration-200
        ${isCompleted ? 'opacity-80' : ''}
        ${isSelected
          ? 'border-banana/50 bg-banana/[0.06] ring-1 ring-banana/20'
          : `${config.border} ${config.bg} hover:brightness-125`
        }
      `}
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <div className="flex items-stretch">
        {/* Left accent bar — green if in the money, otherwise type gradient */}
        <div
          className={`w-1.5 flex-shrink-0 rounded-l-2xl ${
            inTheMoney
              ? 'bg-gradient-to-b from-green-400 to-green-600'
              : config.accentBar
          }`}
        />

        <div className="flex-1 px-4 py-4 sm:px-5 min-w-0">
          {/* Top row: rank badge + league name + type pill + prize + completed badge */}
          <div className="flex items-center gap-2.5 mb-3">
            {/* Rank badge */}
            {league.leagueRank > 0 && getPlaceBadge(league.leagueRank)}

            {/* League name */}
            <h3 className="text-white font-medium text-sm sm:text-base truncate">
              {league.name}
            </h3>

            {/* Type pill */}
            <span
              className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full flex-shrink-0 ${config.color}/20 ${config.text}`}
            >
              {config.label}
            </span>

            {/* Prize pill */}
            {league.prizeIndicator != null && league.prizeIndicator > 0 && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 flex-shrink-0">
                ${league.prizeIndicator}
              </span>
            )}

            {/* Completed badge */}
            {isCompleted && (
              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-white/10 text-white/50 flex-shrink-0">
                Completed
              </span>
            )}
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <p className="text-white/40 text-[10px] uppercase tracking-wider mb-0.5">Rank</p>
              <p className="text-white font-bold text-lg">
                {league.leagueRank > 0 ? formatRank(league.leagueRank) : '-'}
              </p>
            </div>
            <div>
              <p className="text-white/40 text-[10px] uppercase tracking-wider mb-0.5">Weekly</p>
              <p className="text-white/80 font-semibold text-lg">
                {formatScore(league.weeklyScore)}
              </p>
            </div>
            <div>
              <p className="text-white/40 text-[10px] uppercase tracking-wider mb-0.5">Season</p>
              <p className="text-banana font-bold text-lg">
                {formatScore(league.seasonScore)}
              </p>
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
            className={`transition-transform duration-200 ${
              isSelected ? 'text-banana rotate-90' : 'text-white/20'
            }`}
          >
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </div>
      </div>
    </button>
  );
}
