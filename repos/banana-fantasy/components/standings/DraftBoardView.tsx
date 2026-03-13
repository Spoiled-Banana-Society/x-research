'use client';

import React from 'react';
import type { League } from '@/types';

interface DraftBoardViewProps {
  league: League;
}

export function DraftBoardView({ league }: DraftBoardViewProps) {
  // Build draft board from roster data — each roster player was drafted
  // For now, show the roster as a draft recap since full draft board data
  // would need a separate API call
  const rosterPicks = league.roster.map((p, idx) => ({
    round: Math.floor(idx / 1) + 1,
    pick: p.teamPosition,
    slot: p.slot,
  }));

  if (rosterPicks.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-white/40 text-sm">Draft board not available</p>
        <p className="text-white/25 text-xs mt-1">Draft data will appear after the draft completes</p>
      </div>
    );
  }

  return (
    <div>
      <p className="text-white/30 text-xs uppercase tracking-wider mb-3">Your Draft Picks</p>

      <div className="space-y-1">
        {rosterPicks.map((pick, idx) => (
          <div
            key={idx}
            className="grid grid-cols-[40px_60px_1fr] gap-2 px-3 py-2.5 rounded-lg bg-banana/[0.04] items-center"
          >
            {/* Round */}
            <span className="text-white/40 text-xs font-medium">R{pick.round}</span>

            {/* Position */}
            <span className="text-banana/70 text-xs font-semibold">{pick.slot}</span>

            {/* Pick */}
            <span className="text-banana font-medium text-sm">{pick.pick}</span>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-2 mt-4 text-xs text-white/30">
        <span className="w-3 h-3 rounded bg-banana/20" />
        <span>Your picks</span>
      </div>
    </div>
  );
}
