'use client';

import React, { useState, useMemo } from 'react';
import { TeamCard } from '@/components/standings/TeamCard';
import { TeamDetail } from '@/components/standings/TeamDetail';
import { CompletedDrafts } from '@/components/standings/CompletedDrafts';
import { LeaderboardView } from '@/components/standings/LeaderboardView';
import { useAuth } from '@/hooks/useAuth';
import { useHistory } from '@/hooks/useHistory';
import { useLeagues } from '@/hooks/useLeagues';
import { useGameweek } from '@/hooks/useStandings';
import { formatScore, formatRank, formatGameweek } from '@/lib/formatters';
import type { League, CompletedDraft } from '@/types';

type ViewMode = 'myteams' | 'leaderboard';

export default function StandingsPage() {
  const { isLoggedIn, user } = useAuth();
  const historyQuery = useHistory({ userId: user?.id });
  const leaguesQuery = useLeagues({ userId: user?.id, status: 'active' });
  const { data: currentGameweek } = useGameweek();

  const completedDrafts = historyQuery.data ?? [];
  const leagues = leaguesQuery.data;

  const [viewMode, setViewMode] = useState<ViewMode>(isLoggedIn ? 'myteams' : 'leaderboard');
  const [selectedLeague, setSelectedLeague] = useState<League | null>(null);
  const [gameweek, setGameweek] = useState<string>(currentGameweek);

  // Update gameweek when API returns
  React.useEffect(() => {
    if (currentGameweek && currentGameweek !== '2025REG-01') {
      setGameweek(currentGameweek);
    }
  }, [currentGameweek]);

  // Summary stats
  const summaryStats = useMemo(() => {
    const totalTeams = leagues.length;
    const bestRank = leagues.reduce((best, l) => {
      if (l.leagueRank > 0 && (best === 0 || l.leagueRank < best)) return l.leagueRank;
      return best;
    }, 0);
    const totalSeasonScore = leagues.reduce((sum, l) => sum + l.seasonScore, 0);
    return { totalTeams, bestRank, totalSeasonScore };
  }, [leagues]);

  // Generate gameweek options (REG weeks 1-18)
  const gameweekOptions = useMemo(() => {
    const opts: { value: string; label: string }[] = [];
    for (let i = 1; i <= 18; i++) {
      const val = `2025REG-${String(i).padStart(2, '0')}`;
      opts.push({ value: val, label: `Week ${i}` });
    }
    return opts;
  }, []);

  const handleSelectLeague = (league: League) => {
    setSelectedLeague(selectedLeague?.id === league.id ? null : league);
  };

  const handleViewDraftDetails = (_draft: CompletedDraft) => {
    // Could scroll to the team card or open detail
  };

  return (
    <div className="w-full px-4 sm:px-8 lg:px-12 py-8 max-w-5xl mx-auto">
      {/* Page header with toggle + gameweek selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1">Standings</h1>
          <p className="text-white/40 text-sm">
            {isLoggedIn ? 'Track your teams and league performance' : 'View the global leaderboard'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Gameweek selector */}
          <select
            value={gameweek}
            onChange={(e) => setGameweek(e.target.value)}
            className="bg-white/[0.06] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white/70 focus:outline-none focus:ring-1 focus:ring-banana/40 appearance-none cursor-pointer"
          >
            {gameweekOptions.map((opt) => (
              <option key={opt.value} value={opt.value} className="bg-bg-primary text-white">
                {opt.label}
              </option>
            ))}
          </select>

          {/* My Teams / Leaderboard toggle */}
          {isLoggedIn && (
            <div className="flex bg-white/[0.04] rounded-lg p-0.5">
              <button
                onClick={() => setViewMode('myteams')}
                className={`text-sm px-4 py-2 rounded-md font-medium transition-colors ${
                  viewMode === 'myteams'
                    ? 'bg-banana text-black'
                    : 'text-white/50 hover:text-white/70'
                }`}
              >
                My Teams
              </button>
              <button
                onClick={() => setViewMode('leaderboard')}
                className={`text-sm px-4 py-2 rounded-md font-medium transition-colors ${
                  viewMode === 'leaderboard'
                    ? 'bg-banana text-black'
                    : 'text-white/50 hover:text-white/70'
                }`}
              >
                Leaderboard
              </button>
            </div>
          )}
        </div>
      </div>

      {/* MY TEAMS VIEW */}
      {isLoggedIn && viewMode === 'myteams' && (
        <>
          {/* Summary bar */}
          {leagues.length > 0 && (
            <div className="flex items-center gap-6 mb-6 px-1">
              <div className="flex items-center gap-2">
                <span className="text-white/40 text-sm">Teams:</span>
                <span className="text-white font-semibold">{summaryStats.totalTeams}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-white/40 text-sm">Best Rank:</span>
                <span className="text-white font-semibold">
                  {summaryStats.bestRank > 0 ? formatRank(summaryStats.bestRank) : '-'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-white/40 text-sm">Total Score:</span>
                <span className="text-banana font-bold">{formatScore(summaryStats.totalSeasonScore)}</span>
              </div>
            </div>
          )}

          {/* Loading skeleton */}
          {leaguesQuery.isValidating && leagues.length === 0 && (
            <div className="space-y-3 mb-8">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-24 rounded-2xl bg-white/[0.03] animate-pulse" />
              ))}
            </div>
          )}

          {/* Team cards */}
          {leagues.length > 0 && (
            <div className="space-y-3 mb-6">
              {leagues.map((league) => (
                <TeamCard
                  key={league.id}
                  league={league}
                  isSelected={selectedLeague?.id === league.id}
                  onSelect={handleSelectLeague}
                />
              ))}
            </div>
          )}

          {/* Selected team detail */}
          {selectedLeague && (
            <div className="mb-8">
              <TeamDetail league={selectedLeague} gameweek={gameweek} />
            </div>
          )}

          {/* Empty state */}
          {!leaguesQuery.isValidating && leagues.length === 0 && (
            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] px-6 py-16 text-center mb-8">
              <div className="text-4xl mb-4">🏈</div>
              <p className="text-white/50 font-medium mb-2">No teams yet</p>
              <p className="text-white/30 text-sm mb-6">Draft to get started!</p>
              <a
                href="/"
                className="inline-block px-6 py-2.5 bg-banana text-black font-semibold rounded-xl hover:bg-banana-dark transition-colors"
              >
                Start Drafting
              </a>
            </div>
          )}

          {/* Completed drafts section */}
          {completedDrafts.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold text-white mb-4">Completed Drafts</h2>
              <CompletedDrafts
                drafts={completedDrafts}
                onViewDetails={handleViewDraftDetails}
              />
            </section>
          )}
        </>
      )}

      {/* LEADERBOARD VIEW */}
      {(viewMode === 'leaderboard' || !isLoggedIn) && (
        <LeaderboardView gameweek={gameweek} />
      )}
    </div>
  );
}
