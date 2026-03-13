'use client';

import React from 'react';
import { formatScore } from '@/lib/formatters';
import { POSITION_PILL_STYLES } from '@/lib/draftRoomConstants';
import type { League } from '@/types';

interface RosterViewProps {
  league: League;
}

function getPillStyle(slot: string): string {
  const base = slot.replace(/\d+/g, '').toUpperCase();
  return POSITION_PILL_STYLES[base] || 'bg-white/10 text-white/60';
}

export function RosterView({ league }: RosterViewProps) {
  // Season total: sum ALL players (best ball accumulates everything)
  const totalSeason = league.roster.reduce((sum, p) => sum + p.seasonPoints, 0);
  // Weekly total: only lineup players count (best ball optimal lineup)
  const totalWeekly = league.roster.reduce(
    (sum, p) => sum + (p.isInLineup ? p.weeklyPoints : 0),
    0
  );

  return (
    <div>
      {/* Table header */}
      <div className="grid grid-cols-[52px_28px_1fr_72px_72px] sm:grid-cols-[64px_36px_1fr_96px_96px] gap-1.5 sm:gap-2 px-3 py-2 text-[10px] uppercase tracking-wider text-white/30 font-medium">
        <div>Pos</div>
        <div className="text-center leading-tight" title="In Lineup">
          <span className="block">In</span>
          <span className="block text-[8px] -mt-0.5">Lineup</span>
        </div>
        <div>Player</div>
        <div className="text-right">Weekly</div>
        <div className="text-right">Season</div>
      </div>

      {/* Roster rows */}
      <div className="space-y-0.5">
        {league.roster.map((player, index) => {
          const inLineup = player.isInLineup === true;
          const displayName = player.playerName || player.teamPosition;

          return (
            <div
              key={index}
              className="grid grid-cols-[52px_28px_1fr_72px_72px] sm:grid-cols-[64px_36px_1fr_96px_96px] gap-1.5 sm:gap-2 px-3 py-2.5 rounded-lg hover:bg-white/[0.03] transition-colors items-center"
            >
              {/* Position pill */}
              <div>
                <span
                  className={`inline-block text-[11px] font-semibold px-2 py-0.5 rounded-full ${getPillStyle(player.slot)}`}
                >
                  {player.slot}
                </span>
              </div>

              {/* Lineup indicator */}
              <div className="text-center">
                {inLineup && (
                  <span className="text-[10px] text-green-400" aria-label="In lineup">
                    {'\u25CF'}
                  </span>
                )}
              </div>

              {/* Player name */}
              <div
                className={`text-sm font-medium truncate ${
                  inLineup ? 'text-white/80' : 'text-white/40'
                }`}
              >
                {displayName}
              </div>

              {/* Weekly points */}
              <div
                className={`text-right text-sm ${
                  inLineup ? 'text-green-400/80' : 'text-white/30'
                }`}
              >
                {formatScore(player.weeklyPoints)}
              </div>

              {/* Season points */}
              <div
                className={`text-right font-semibold text-sm ${
                  inLineup ? 'text-banana' : 'text-banana/40'
                }`}
              >
                {formatScore(player.seasonPoints)}
              </div>
            </div>
          );
        })}
      </div>

      {/* Total row */}
      <div className="grid grid-cols-[52px_28px_1fr_72px_72px] sm:grid-cols-[64px_36px_1fr_96px_96px] gap-1.5 sm:gap-2 px-3 py-3 mt-2 border-t border-white/[0.06]">
        <div />
        <div />
        <div className="text-white font-semibold text-sm">Total</div>
        <div className="text-right text-white font-semibold text-sm">
          {formatScore(totalWeekly)}
        </div>
        <div className="text-right text-banana font-bold text-sm">
          {formatScore(totalSeason)}
        </div>
      </div>
    </div>
  );
}
