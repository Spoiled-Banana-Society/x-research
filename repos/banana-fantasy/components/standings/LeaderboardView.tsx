'use client';

import React from 'react';
import { Card } from '../ui/Card';
import { LeaderboardEntry, League } from '@/types';

interface LeaderboardViewProps {
  league: League;
  leaderboard: LeaderboardEntry[];
}

export function LeaderboardView({ league, leaderboard }: LeaderboardViewProps) {
  return (
    <div className="space-y-6">
      {/* League Info Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-text-primary">{league.name}</h3>
          <p className="text-text-secondary">League Leaderboard</p>
        </div>
        <div className="flex items-center gap-6">
          <div className="text-center">
            <p className="text-2xl font-bold text-text-primary">#{league.leagueRank}</p>
            <p className="text-text-muted text-sm">Your Rank</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-banana">{league.seasonScore}</p>
            <p className="text-text-muted text-sm">Your Score</p>
          </div>
        </div>
      </div>

      {/* Leaderboard Table */}
      <Card className="p-0">
        <div className="grid grid-cols-12 gap-4 px-6 py-4 bg-bg-tertiary border-b border-bg-elevated">
          <div className="col-span-1 text-sm font-medium text-text-muted uppercase tracking-wider">
            #
          </div>
          <div className="col-span-5 text-sm font-medium text-text-muted uppercase tracking-wider">
            Team
          </div>
          <div className="col-span-3 text-sm font-medium text-text-muted uppercase tracking-wider text-right">
            Weekly
          </div>
          <div className="col-span-3 text-sm font-medium text-text-muted uppercase tracking-wider text-right">
            Season
          </div>
        </div>

        <div className="divide-y divide-bg-tertiary">
          {leaderboard.map((entry) => (
            <div
              key={entry.rank}
              className={`
                grid grid-cols-12 gap-4 px-6 py-4 items-center transition-colors
                ${entry.isCurrentUser ? 'bg-banana/10' : 'hover:bg-bg-tertiary/50'}
              `}
            >
              {/* Rank */}
              <div className="col-span-1">
                {entry.rank <= 3 ? (
                  <span
                    className={`
                      w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold
                      ${entry.rank === 1 ? 'bg-yellow-500 text-bg-primary' : ''}
                      ${entry.rank === 2 ? 'bg-gray-400 text-bg-primary' : ''}
                      ${entry.rank === 3 ? 'bg-orange-600 text-bg-primary' : ''}
                    `}
                  >
                    {entry.rank}
                  </span>
                ) : (
                  <span className="text-text-secondary font-medium">{entry.rank}</span>
                )}
              </div>

              {/* Team/User */}
              <div className="col-span-5">
                <p className={`font-medium ${entry.isCurrentUser ? 'text-banana' : 'text-text-primary'}`}>
                  {entry.username}
                  {entry.isCurrentUser && <span className="ml-2 text-xs">(You)</span>}
                </p>
                <p className="text-text-muted text-sm">{entry.teamName}</p>
              </div>

              {/* Weekly Score */}
              <div className="col-span-3 text-right">
                <span className="text-text-secondary">{entry.weeklyScore}</span>
              </div>

              {/* Season Score */}
              <div className="col-span-3 text-right">
                <span className={`font-bold ${entry.isCurrentUser ? 'text-banana' : 'text-text-primary'}`}>
                  {entry.seasonScore}
                </span>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
