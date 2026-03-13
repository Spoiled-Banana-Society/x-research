'use client';

import React from 'react';
import { formatScore } from '@/lib/formatters';
import type { League } from '@/types';

interface RosterViewProps {
  league: League;
}

const positionColors: Record<string, string> = {
  QB: 'bg-red-500/20 text-red-400',
  RB: 'bg-blue-500/20 text-blue-400',
  WR: 'bg-green-500/20 text-green-400',
  TE: 'bg-orange-500/20 text-orange-400',
  DST: 'bg-purple-500/20 text-purple-400',
  K: 'bg-cyan-500/20 text-cyan-400',
};

function getPositionColor(slot: string): string {
  const base = slot.replace(/\d+/g, '').toUpperCase();
  return positionColors[base] || 'bg-white/10 text-white/60';
}

export function RosterView({ league }: RosterViewProps) {
  const totalWeekly = league.roster.reduce((sum, p) => sum + p.weeklyPoints, 0);
  const totalSeason = league.roster.reduce((sum, p) => sum + p.seasonPoints, 0);

  return (
    <div>
      {/* Table header */}
      <div className="grid grid-cols-[60px_1fr_80px_80px] sm:grid-cols-[70px_1fr_100px_100px] gap-2 px-3 py-2 text-[10px] uppercase tracking-wider text-white/30 font-medium">
        <div>Pos</div>
        <div>Player</div>
        <div className="text-right">Weekly</div>
        <div className="text-right">Season</div>
      </div>

      {/* Roster rows */}
      <div className="space-y-1">
        {league.roster.map((player, index) => (
          <div
            key={index}
            className="grid grid-cols-[60px_1fr_80px_80px] sm:grid-cols-[70px_1fr_100px_100px] gap-2 px-3 py-2.5 rounded-lg hover:bg-white/[0.03] transition-colors items-center"
          >
            {/* Position pill */}
            <div>
              <span className={`inline-block text-[11px] font-semibold px-2 py-0.5 rounded-full ${getPositionColor(player.slot)}`}>
                {player.slot}
              </span>
            </div>

            {/* Team position */}
            <div className="text-white/80 text-sm font-medium truncate">
              {player.teamPosition}
            </div>

            {/* Weekly points */}
            <div className="text-right text-white/60 text-sm">
              {formatScore(player.weeklyPoints)}
            </div>

            {/* Season points */}
            <div className="text-right text-banana font-semibold text-sm">
              {formatScore(player.seasonPoints)}
            </div>
          </div>
        ))}
      </div>

      {/* Total row */}
      <div className="grid grid-cols-[60px_1fr_80px_80px] sm:grid-cols-[70px_1fr_100px_100px] gap-2 px-3 py-3 mt-2 border-t border-white/[0.06]">
        <div />
        <div className="text-white font-semibold text-sm">Total</div>
        <div className="text-right text-white font-semibold text-sm">{formatScore(totalWeekly)}</div>
        <div className="text-right text-banana font-bold text-sm">{formatScore(totalSeason)}</div>
      </div>
    </div>
  );
}
