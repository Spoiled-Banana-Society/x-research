'use client';

import React from 'react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { League } from '@/types';

interface RosterViewProps {
  league: League;
}

export function RosterView({ league }: RosterViewProps) {
  return (
    <div className="grid lg:grid-cols-2 gap-6">
      {/* Team Card */}
      <Card className="p-0 overflow-hidden">
        <div className="bg-gradient-to-br from-banana/20 to-bg-tertiary p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                {league.type === 'jackpot' && <Badge type="jackpot">Jackpot</Badge>}
                {league.type === 'hof' && <Badge type="hof">HOF</Badge>}
              </div>
              <h3 className="text-xl font-bold text-text-primary">{league.name}</h3>
              <p className="text-text-muted text-sm">Drafted: {league.draftDate}</p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-banana">{league.seasonScore}</p>
              <p className="text-text-muted text-sm">Season Score</p>
            </div>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-3 gap-4 pt-4 border-t border-bg-elevated">
            <div className="text-center">
              <p className="text-2xl font-bold text-text-primary">#{league.leagueRank}</p>
              <p className="text-text-muted text-xs">League Rank</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-text-primary">#{league.weeklyRank.toLocaleString()}</p>
              <p className="text-text-muted text-xs">Weekly Rank</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-text-primary">{league.weeklyScore}</p>
              <p className="text-text-muted text-xs">Weekly Score</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Roster Table */}
      <Card className="p-0">
        <div className="px-4 py-3 bg-bg-tertiary border-b border-bg-elevated">
          <h4 className="font-semibold text-text-primary">Roster</h4>
        </div>
        <div className="divide-y divide-bg-tertiary">
          {league.roster.map((player, index) => (
            <div
              key={index}
              className="grid grid-cols-12 gap-2 px-4 py-3 items-center hover:bg-bg-tertiary/30 transition-colors"
            >
              {/* Position Slot */}
              <div className="col-span-2">
                <span className="text-text-muted text-sm font-medium">{player.slot}</span>
              </div>

              {/* Team Position */}
              <div className="col-span-4">
                <span className="text-text-primary font-medium">{player.teamPosition}</span>
              </div>

              {/* Weekly Points */}
              <div className="col-span-3 text-right">
                <span className="text-text-secondary">{player.weeklyPoints.toFixed(1)}</span>
                <span className="text-text-muted text-xs ml-1">wk</span>
              </div>

              {/* Season Points */}
              <div className="col-span-3 text-right">
                <span className="text-banana font-medium">{player.seasonPoints.toFixed(1)}</span>
                <span className="text-text-muted text-xs ml-1">szn</span>
              </div>
            </div>
          ))}
        </div>

        {/* Total Row */}
        <div className="grid grid-cols-12 gap-2 px-4 py-3 bg-bg-tertiary border-t border-bg-elevated">
          <div className="col-span-6">
            <span className="font-semibold text-text-primary">Total</span>
          </div>
          <div className="col-span-3 text-right">
            <span className="font-semibold text-text-primary">
              {league.roster.reduce((sum, p) => sum + p.weeklyPoints, 0).toFixed(1)}
            </span>
          </div>
          <div className="col-span-3 text-right">
            <span className="font-bold text-banana">
              {league.roster.reduce((sum, p) => sum + p.seasonPoints, 0).toFixed(1)}
            </span>
          </div>
        </div>
      </Card>
    </div>
  );
}
