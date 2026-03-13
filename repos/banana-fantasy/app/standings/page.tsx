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
  const [teamSearch, setTeamSearch] = useState('');
  const [teamsPage, setTeamsPage] = useState(0);
  const TEAMS_PER_PAGE = 20;

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

  // Filter leagues by search query (league name, league ID, card ID, roster)
  const filteredLeagues = useMemo(() => {
    if (!teamSearch.trim()) return leagues;
    const q = teamSearch.trim().toLowerCase().replace(/^#/, '');
    return leagues.filter((league) => {
      // Match league name (e.g. "BBB #42")
      if (league.name.toLowerCase().includes(q)) return true;
      // Match league ID (e.g. "2025-fast-draft-42")
      if (league.id.toLowerCase().includes(q)) return true;
      // Match just the number from league name
      const numMatch = league.name.match(/#(\d+)/);
      if (numMatch && numMatch[1].includes(q)) return true;
      // Match roster players (e.g. "KC QB")
      if (league.roster.some(p => p.teamPosition.toLowerCase().includes(q) || p.slot.toLowerCase().includes(q))) return true;
      return false;
    });
  }, [leagues, teamSearch]);

  // Paginate filtered leagues
  const totalTeamPages = Math.ceil(filteredLeagues.length / TEAMS_PER_PAGE);
  const paginatedLeagues = useMemo(() => {
    const start = teamsPage * TEAMS_PER_PAGE;
    return filteredLeagues.slice(start, start + TEAMS_PER_PAGE);
  }, [filteredLeagues, teamsPage]);

  // Reset page when search changes
  React.useEffect(() => { setTeamsPage(0); }, [teamSearch]);

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

          {/* Search bar */}
          {leagues.length > 0 && (
            <div className="relative mb-5">
              <svg className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
              </svg>
              <input
                type="text"
                value={teamSearch}
                onChange={(e) => setTeamSearch(e.target.value)}
                placeholder="Search by league # or roster (e.g. 42, KC QB)"
                className="w-full bg-white/[0.04] border border-white/[0.06] rounded-xl pl-9 pr-9 py-2.5 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-banana/40 focus:ring-1 focus:ring-banana/20 transition-colors"
              />
              {teamSearch && (
                <button
                  onClick={() => setTeamSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path d="M6 18L18 6M6 6l12 12"/>
                  </svg>
                </button>
              )}
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
              {filteredLeagues.length > 0 ? (
                <>
                  {/* Show count when filtered or paginated */}
                  {(teamSearch || filteredLeagues.length > TEAMS_PER_PAGE) && (
                    <p className="text-white/30 text-xs px-1 mb-2">
                      Showing {teamsPage * TEAMS_PER_PAGE + 1}-{Math.min((teamsPage + 1) * TEAMS_PER_PAGE, filteredLeagues.length)} of {filteredLeagues.length} teams
                    </p>
                  )}
                  {paginatedLeagues.map((league) => (
                    <TeamCard
                      key={league.id}
                      league={league}
                      isSelected={selectedLeague?.id === league.id}
                      onSelect={handleSelectLeague}
                    />
                  ))}
                  {/* Pagination */}
                  {totalTeamPages > 1 && (
                    <div className="flex items-center justify-center gap-2 pt-2">
                      <button
                        onClick={() => setTeamsPage(Math.max(0, teamsPage - 1))}
                        disabled={teamsPage === 0}
                        className="text-xs px-3 py-1.5 rounded-lg bg-white/[0.04] text-white/50 hover:bg-white/[0.08] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                      >
                        Prev
                      </button>
                      <span className="text-white/40 text-xs">
                        {teamsPage + 1} / {totalTeamPages}
                      </span>
                      <button
                        onClick={() => setTeamsPage(Math.min(totalTeamPages - 1, teamsPage + 1))}
                        disabled={teamsPage >= totalTeamPages - 1}
                        className="text-xs px-3 py-1.5 rounded-lg bg-white/[0.04] text-white/50 hover:bg-white/[0.08] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                      >
                        Next
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-8 rounded-xl border border-white/[0.04] bg-white/[0.02]">
                  <p className="text-white/40 text-sm">No teams match &ldquo;{teamSearch}&rdquo;</p>
                  <button onClick={() => setTeamSearch('')} className="text-banana text-xs mt-1 hover:underline">Clear search</button>
                </div>
              )}
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

          {/* Completed drafts section — hidden when searching */}
          {!teamSearch && completedDrafts.length > 0 && (
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
