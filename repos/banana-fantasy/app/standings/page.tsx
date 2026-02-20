'use client';

import React, { useState } from 'react';
import { LeagueList } from '@/components/standings/LeagueList';
import { CompletedDrafts } from '@/components/standings/CompletedDrafts';
import { RosterView } from '@/components/standings/RosterView';
import { LeaderboardView } from '@/components/standings/LeaderboardView';
import { DraftBoardView } from '@/components/standings/DraftBoardView';
import { useAuth } from '@/hooks/useAuth';
import { useContests } from '@/hooks/useContests';
import { useHistory } from '@/hooks/useHistory';
import { useLeagues } from '@/hooks/useLeagues';
import { useLeaderboard } from '@/hooks/useLeaderboard';
import { League, CompletedDraft } from '@/types';

type TabType = 'roster' | 'leaderboard' | 'draftboard';

export default function StandingsPage() {
  const { isLoggedIn, user } = useAuth();
  const _contestsQuery = useContests();
  const historyQuery = useHistory({ userId: user?.id });
  const leaguesQuery = useLeagues({ userId: user?.id, status: 'active' });
  const leaderboardQuery = useLeaderboard();
  const completedDrafts = historyQuery.data ?? [];
  const leaderboard = leaderboardQuery.data;
  const leagues = leaguesQuery.data;
  const [selectedLeague, setSelectedLeague] = useState<League | null>(
    isLoggedIn ? leagues[0] : null
  );
  const [activeTab, setActiveTab] = useState<TabType>('roster');

  const handleSelectLeague = (league: League) => {
    setSelectedLeague(league);
    setActiveTab('roster');
  };

  const handleViewDraftDetails = (draft: CompletedDraft) => {
    alert(`Viewing draft board for ${draft.contestName}`);
  };

  const tabs: { id: TabType; label: string }[] = [
    { id: 'roster', label: 'Roster' },
    { id: 'leaderboard', label: 'Leaderboard' },
    { id: 'draftboard', label: 'Draft Board' },
  ];

  return (
    <div className="w-full px-4 sm:px-8 lg:px-12 py-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-text-primary mb-2">Standings</h1>
        <p className="text-text-secondary">
          {isLoggedIn
            ? 'Track your leagues and team performance'
            : 'View the public leaderboard'}
        </p>
      </div>

      {isLoggedIn ? (
        <>
          {/* Completed Drafts Section */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-text-primary mb-4">Completed Drafts</h2>
            <CompletedDrafts
              drafts={completedDrafts}
              onViewDetails={handleViewDraftDetails}
            />
          </section>

          {/* User's Active Leagues */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-text-primary mb-4">Active Leagues</h2>
            <LeagueList
              leagues={leagues}
              selectedLeagueId={selectedLeague?.id || null}
              onSelectLeague={handleSelectLeague}
            />
          </section>

          {/* Selected League Details */}
          {selectedLeague && (
            <section>
              {/* Tab Navigation */}
              <div className="flex items-center gap-1 mb-6 bg-bg-secondary p-1 rounded-lg w-fit">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`
                      px-4 py-2 rounded-md text-sm font-medium transition-colors
                      ${activeTab === tab.id
                        ? 'bg-banana text-bg-primary'
                        : 'text-text-secondary hover:text-text-primary hover:bg-bg-tertiary'
                      }
                    `}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              {activeTab === 'roster' && <RosterView league={selectedLeague} />}
              {activeTab === 'leaderboard' && (
                <LeaderboardView league={selectedLeague} leaderboard={leaderboard} />
              )}
              {activeTab === 'draftboard' && <DraftBoardView league={selectedLeague} />}
            </section>
          )}
        </>
      ) : (
        /* Public Leaderboard for logged out users */
        <section>
          <h2 className="text-xl font-semibold text-text-primary mb-4">Public Leaderboard</h2>
          <div className="bg-bg-secondary border border-bg-tertiary rounded-xl overflow-hidden">
            <div className="grid grid-cols-[40px_1fr_auto_auto] sm:grid-cols-12 gap-2 sm:gap-4 px-3 sm:px-6 py-3 sm:py-4 bg-bg-tertiary border-b border-bg-elevated">
              <div className="sm:col-span-1 text-xs sm:text-sm font-medium text-text-muted uppercase tracking-wider">
                #
              </div>
              <div className="sm:col-span-5 text-xs sm:text-sm font-medium text-text-muted uppercase tracking-wider">
                Player
              </div>
              <div className="sm:col-span-3 text-xs sm:text-sm font-medium text-text-muted uppercase tracking-wider text-right min-w-[50px]">
                Weekly
              </div>
              <div className="sm:col-span-3 text-xs sm:text-sm font-medium text-text-muted uppercase tracking-wider text-right min-w-[50px]">
                Season
              </div>
            </div>

            <div className="divide-y divide-bg-tertiary">
              {leaderboard.map((entry) => (
                <div
                  key={entry.rank}
                  className="grid grid-cols-[40px_1fr_auto_auto] sm:grid-cols-12 gap-2 sm:gap-4 px-3 sm:px-6 py-3 sm:py-4 items-center hover:bg-bg-tertiary/50 transition-colors"
                >
                  <div className="sm:col-span-1">
                    {entry.rank <= 3 ? (
                      <span
                        className={`
                          w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center text-xs sm:text-sm font-bold
                          ${entry.rank === 1 ? 'bg-yellow-500 text-bg-primary' : ''}
                          ${entry.rank === 2 ? 'bg-gray-400 text-bg-primary' : ''}
                          ${entry.rank === 3 ? 'bg-orange-600 text-bg-primary' : ''}
                        `}
                      >
                        {entry.rank}
                      </span>
                    ) : (
                      <span className="text-text-secondary font-medium text-sm">{entry.rank}</span>
                    )}
                  </div>
                  <div className="sm:col-span-5 min-w-0">
                    <p className="font-medium text-text-primary text-sm sm:text-base truncate">{entry.username}</p>
                    <p className="text-text-muted text-xs sm:text-sm truncate">{entry.teamName}</p>
                  </div>
                  <div className="sm:col-span-3 text-right min-w-[50px]">
                    <span className="text-text-secondary text-sm">{entry.weeklyScore}</span>
                  </div>
                  <div className="sm:col-span-3 text-right min-w-[50px]">
                    <span className="font-bold text-text-primary text-sm">{entry.seasonScore}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
