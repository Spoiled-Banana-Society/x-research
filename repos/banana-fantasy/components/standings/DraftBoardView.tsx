'use client';

import React from 'react';
import { Card } from '../ui/Card';
import { League } from '@/types';

interface DraftBoardViewProps {
  league: League;
}

// Mock draft board data
const mockDraftBoard = [
  { round: 1, picks: ['KC QB', 'BUF QB', 'SF RB', 'MIA WR', 'MIN WR', 'BAL RB', 'CIN WR', 'PHI RB', 'DAL WR', 'DET RB'] },
  { round: 2, picks: ['DET RB', 'DAL WR', 'PHI RB', 'CIN WR', 'BAL RB', 'MIN WR', 'MIA WR', 'SF RB', 'BUF QB', 'KC TE'] },
  { round: 3, picks: ['KC TE', 'SF TE', 'DET TE', 'GB WR', 'LAC WR', 'SEA WR', 'ARI WR', 'NYJ RB', 'CHI WR', 'TB WR'] },
  { round: 4, picks: ['TB WR', 'CHI WR', 'NYJ RB', 'ARI WR', 'SEA WR', 'LAC WR', 'GB WR', 'DET TE', 'SF TE', 'DAL DEF'] },
  { round: 5, picks: ['DAL DEF', 'CLE DEF', 'SF DEF', 'BAL K', 'SF K', 'DAL K', 'MIA K', 'KC DEF', 'BUF DEF', 'PIT K'] },
];

export function DraftBoardView({ league }: DraftBoardViewProps) {
  // Determine which picks belong to the user (simplified - in real app would use actual draft data)
  const userPicks = [2, 9]; // User drafted from positions 3 and 10 (0-indexed as 2 and 9)

  return (
    <div className="space-y-6">
      {/* League Info Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-text-primary">{league.name}</h3>
          <p className="text-text-secondary">Draft Board • {league.draftDate}</p>
        </div>
      </div>

      {/* Draft Board */}
      <Card className="p-0 overflow-x-auto">
        <table className="w-full min-w-[800px]">
          <thead>
            <tr className="bg-bg-tertiary border-b border-bg-elevated">
              <th className="px-4 py-3 text-left text-sm font-medium text-text-muted uppercase tracking-wider">
                Round
              </th>
              {Array.from({ length: 10 }, (_, i) => (
                <th
                  key={i}
                  className="px-3 py-3 text-center text-sm font-medium text-text-muted uppercase tracking-wider"
                >
                  Pick {i + 1}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-bg-tertiary">
            {mockDraftBoard.map((round) => (
              <tr key={round.round} className="hover:bg-bg-tertiary/30 transition-colors">
                <td className="px-4 py-3">
                  <span className="font-medium text-text-primary">R{round.round}</span>
                </td>
                {round.picks.map((pick, pickIndex) => {
                  const isUserPick = userPicks.includes(pickIndex);
                  return (
                    <td
                      key={pickIndex}
                      className={`
                        px-3 py-3 text-center text-sm
                        ${isUserPick ? 'bg-banana/20' : ''}
                      `}
                    >
                      <span
                        className={`
                          inline-block px-2 py-1 rounded
                          ${isUserPick ? 'bg-banana text-bg-primary font-semibold' : 'text-text-secondary'}
                        `}
                      >
                        {pick}
                      </span>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {/* Legend */}
      <div className="flex items-center gap-4 text-sm text-text-muted">
        <div className="flex items-center gap-2">
          <span className="w-4 h-4 bg-banana/20 rounded" />
          <span>Your picks</span>
        </div>
      </div>
    </div>
  );
}
