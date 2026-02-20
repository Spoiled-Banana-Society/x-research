'use client';

import React, { useState } from 'react';
import {
  getTopExposures,
  getExposureByPosition,
  positions,
  ExposureEntry,
  getByeWeekExposure,
  getTeamStacks,
  teamByeWeeks,
  DraftHistory,
  DraftTiming,
  TeamStack,
} from '@/lib/exposureUtils';
import { getTeamPosition, getTeamPositionDepthChart } from '@/lib/teamPositions';
import { useExposure } from '@/hooks/useExposure';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';

// Position color mapping
const getPositionColor = (position: string): string => {
  if (position === 'QB') return '#ef4444'; // Red
  if (position.startsWith('RB')) return '#22c55e'; // Green
  if (position.startsWith('WR')) return '#a855f7'; // Purple
  if (position === 'TE') return '#3b82f6'; // Blue
  if (position === 'DST') return '#f97316'; // Orange
  return '#94a3b8'; // Gray default
};

type ExposureView = 'positions' | 'byeweek' | 'stacks' | 'timing';
type LayoutMode = 'grid' | 'table';
type ExposureFilter = 'all' | 'high' | 'low';

export default function ExposurePage() {
  const exposureQuery = useExposure();
  const userExposure = exposureQuery.data ?? { username: '', totalDrafts: 0, exposures: [] };
  const draftTiming: DraftTiming[] = [];
  const draftHistory: DraftHistory[] = [];
  const teamStacks: TeamStack[] = [];
  const [activeView, setActiveView] = useState<ExposureView>('positions');
  const [selectedPosition, setSelectedPosition] = useState('all');
  const [selectedExposure, setSelectedExposure] = useState<ExposureEntry | null>(null);
  const [layoutMode, setLayoutMode] = useState<LayoutMode>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [exposureFilter, setExposureFilter] = useState<ExposureFilter>('all');

  // Get depth chart data for the selected exposure
  const getDepthChartForExposure = (entry: ExposureEntry) => {
    return getTeamPositionDepthChart(entry.team, entry.position);
  };

  const selectedDepthChart = selectedExposure ? getDepthChartForExposure(selectedExposure) : [];
  const selectedTeamPosition = selectedExposure
    ? getTeamPosition(selectedExposure.team, selectedExposure.position)
    : null;

  const getColor = (exp: number) => {
    if (exp >= 35) return 'text-[#ff6b6b]';
    if (exp >= 25) return 'text-[#fbbf24]';
    if (exp >= 15) return 'text-[#4ade80]';
    return 'text-[#94a3b8]';
  };

  const _getBarColor = (exp: number) => {
    if (exp >= 35) return 'bg-[#ff6b6b]';
    if (exp >= 25) return 'bg-[#fbbf24]';
    if (exp >= 15) return 'bg-[#4ade80]';
    return 'bg-[#94a3b8]';
  };

  const exposureDataRaw = selectedPosition === 'all'
    ? getTopExposures(userExposure.exposures, 50)
    : getExposureByPosition(userExposure.exposures, selectedPosition);

  // Apply search and exposure level filters
  const exposureData = exposureDataRaw.filter(e => {
    // Search filter
    if (searchQuery.trim()) {
      const matchesSearch = e.teamPosition.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.team.toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchesSearch) return false;
    }
    // Exposure level filter
    if (exposureFilter === 'high' && e.exposure < 25) return false;
    if (exposureFilter === 'low' && e.exposure >= 15) return false;
    return true;
  });

  return (
    <div className="w-full min-h-screen px-4 sm:px-8 lg:px-12 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white mb-1">My Exposure</h1>
            <p className="text-white/50">{userExposure.totalDrafts} total drafts · Tracking your team position ownership</p>
          </div>
        </div>

        {/* View Tabs */}
        <div className="flex gap-1 p-1 bg-white/5 rounded-xl w-fit">
          {[
            { id: 'positions' as const, label: 'Positions' },
            { id: 'byeweek' as const, label: 'Bye Weeks' },
            { id: 'stacks' as const, label: 'Stacks' },
            { id: 'timing' as const, label: 'Draft Timing' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveView(tab.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeView === tab.id
                  ? 'bg-white/10 text-white'
                  : 'text-white/40 hover:text-white/60'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Position Filter Pills - Only show for positions view */}
        {activeView === 'positions' && (
          <>
            <div className="flex items-center justify-between mt-4">
              <div className="flex gap-1.5">
                <button
                  onClick={() => setSelectedPosition('all')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    selectedPosition === 'all'
                      ? 'bg-white/10 text-white'
                      : 'text-white/40 hover:text-white/60'
                  }`}
                >
                  All
                </button>
                {positions.map((pos) => (
                  <button
                    key={pos}
                    onClick={() => setSelectedPosition(pos)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      selectedPosition === pos
                        ? 'bg-white/10 text-white'
                        : 'text-white/40 hover:text-white/60'
                    }`}
                  >
                    {pos}
                  </button>
                ))}
              </div>

              {/* Layout Toggle */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setLayoutMode('grid')}
                  className={`p-2 rounded-lg transition-all ${
                    layoutMode === 'grid' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/60'
                  }`}
                  title="Grid view"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
                  </svg>
                </button>
                <button
                  onClick={() => setLayoutMode('table')}
                  className={`p-2 rounded-lg transition-all ${
                    layoutMode === 'table' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/60'
                  }`}
                  title="Table view"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
                  </svg>
                </button>
              </div>
            </div>

            {/* Search & Exposure Filter Row */}
            <div className="flex items-center gap-4 mt-4">
              {/* Search Bar */}
              <div className="relative max-w-xs">
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
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30"
                >
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.3-4.3" />
                </svg>
                <input
                  type="text"
                  placeholder="Search positions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm placeholder-white/30 focus:outline-none focus:border-white/20 transition-colors"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
                    </svg>
                  </button>
                )}
              </div>

              {/* Exposure Level Filter */}
              <div className="flex items-center gap-1 p-1 bg-white/5 rounded-lg">
                <button
                  onClick={() => setExposureFilter('all')}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                    exposureFilter === 'all'
                      ? 'bg-white/10 text-white'
                      : 'text-white/40 hover:text-white/60'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setExposureFilter('high')}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                    exposureFilter === 'high'
                      ? 'bg-red-500/20 text-red-400'
                      : 'text-white/40 hover:text-white/60'
                  }`}
                >
                  High 25%+
                </button>
                <button
                  onClick={() => setExposureFilter('low')}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                    exposureFilter === 'low'
                      ? 'bg-blue-500/20 text-blue-400'
                      : 'text-white/40 hover:text-white/60'
                  }`}
                >
                  Low &lt;15%
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Positions View */}
      {activeView === 'positions' && (
        <>
          {/* Results count */}
          {searchQuery && (
            <div className="text-white/40 text-sm mb-4">
              {exposureData.length} result{exposureData.length !== 1 ? 's' : ''} for &quot;{searchQuery}&quot;
            </div>
          )}

          {/* Grid View */}
          {layoutMode === 'grid' && (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {exposureData.map((entry, idx) => {
                const byeWeek = teamByeWeeks[entry.team];
                return (
                  <div
                    key={entry.teamPosition}
                    onClick={() => setSelectedExposure(entry)}
                    className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] transition-all cursor-pointer"
                  >
                    <div className="flex items-center justify-between mb-1">
                      {selectedPosition === 'all' && (
                        <span className="text-white/20 text-xs">#{idx + 1}</span>
                      )}
                      <span className="text-white/30 text-xs">BYE {byeWeek}</span>
                    </div>
                    <div
                      className="font-semibold text-base mb-3"
                      style={{ color: getPositionColor(entry.position) }}
                    >
                      {entry.teamPosition}
                    </div>
                    <div className="h-1.5 bg-white/10 rounded-full overflow-hidden mb-3">
                      <div
                        className="h-full bg-white/40 rounded-full"
                        style={{ width: `${entry.exposure}%` }}
                      />
                    </div>
                    <div className="flex items-baseline justify-between">
                      <span className="text-xl font-bold text-white">
                        {entry.exposure}%
                      </span>
                      <span className="text-white/30 text-sm">
                        {entry.drafts}/{entry.totalDrafts}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Table View */}
          {layoutMode === 'table' && (
            <div className="rounded-xl border border-white/[0.06] overflow-x-auto">
              {/* Table Header */}
              <div className="grid grid-cols-12 gap-4 px-4 py-3 bg-white/[0.03] border-b border-white/[0.06] text-xs text-white/40 uppercase tracking-wider min-w-[600px]">
                <div className="col-span-1">#</div>
                <div className="col-span-3">Position</div>
                <div className="col-span-1 text-center">BYE</div>
                <div className="col-span-4">Exposure</div>
                <div className="col-span-2 text-center">Drafts</div>
                <div className="col-span-1 text-right">%</div>
              </div>

              {/* Table Rows */}
              <div className="divide-y divide-white/[0.04]">
                {exposureData.map((entry, idx) => {
                  const byeWeek = teamByeWeeks[entry.team];
                  return (
                    <div
                      key={entry.teamPosition}
                      onClick={() => setSelectedExposure(entry)}
                      className="grid grid-cols-12 gap-4 px-4 py-3 items-center hover:bg-white/[0.02] transition-all cursor-pointer min-w-[600px]"
                    >
                      <div className="col-span-1 text-white/30 text-sm">{idx + 1}</div>
                      <div className="col-span-3">
                        <span
                          className="font-semibold"
                          style={{ color: getPositionColor(entry.position) }}
                        >
                          {entry.teamPosition}
                        </span>
                      </div>
                      <div className="col-span-1 text-center text-white/40 text-sm">{byeWeek}</div>
                      <div className="col-span-4">
                        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-white/40 rounded-full"
                            style={{ width: `${entry.exposure}%` }}
                          />
                        </div>
                      </div>
                      <div className="col-span-2 text-center text-white/50 text-sm">
                        {entry.drafts} / {entry.totalDrafts}
                      </div>
                      <div className="col-span-1 text-right text-white font-semibold">
                        {entry.exposure}%
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}

      {/* Bye Week View */}
      {activeView === 'byeweek' && (
        <div className="space-y-4">
          <p className="text-white/50 text-sm">See which bye weeks you&apos;re most exposed to across your drafts</p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {getByeWeekExposure(userExposure).map((bye) => (
              <div
                key={bye.week}
                className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]"
              >
                <div className="text-white/40 text-xs mb-1">Week</div>
                <div className="text-2xl font-bold text-white mb-3">{bye.week}</div>
                <div className="h-1.5 bg-white/10 rounded-full overflow-hidden mb-3">
                  <div
                    className="h-full bg-white/40 rounded-full"
                    style={{ width: `${Math.min(bye.exposure, 100)}%` }}
                  />
                </div>
                <div className="flex items-baseline justify-between mb-2">
                  <span className="text-lg font-bold text-white">{bye.exposure}%</span>
                  <span className="text-white/30 text-sm">{bye.drafts} drafts</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {bye.teams.slice(0, 4).map((team) => (
                    <span key={team} className="text-xs text-white/40 bg-white/5 px-1.5 py-0.5 rounded">
                      {team}
                    </span>
                  ))}
                  {bye.teams.length > 4 && (
                    <span className="text-xs text-white/30">+{bye.teams.length - 4}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stacks View */}
      {activeView === 'stacks' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-white/50 text-sm">Multiple positions from the same team in your drafts</p>
            {/* Search for stacks */}
            <div className="relative max-w-xs">
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
                className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.3-4.3" />
              </svg>
              <input
                type="text"
                placeholder="Search teams or stacks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm placeholder-white/30 focus:outline-none focus:border-white/20 transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
                  </svg>
                </button>
              )}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {getTeamStacks(teamStacks)
              .filter(stack => {
                if (!searchQuery.trim()) return true;
                const query = searchQuery.toLowerCase();
                return (
                  stack.team.toLowerCase().includes(query) ||
                  stack.stackType.toLowerCase().includes(query) ||
                  stack.positions.some(p => p.toLowerCase().includes(query))
                );
              })
              .map((stack, idx) => (
              <div
                key={`${stack.team}-${idx}`}
                className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xl font-bold text-white">{stack.team}</span>
                  <span className="text-xs text-white/40 bg-white/5 px-2 py-1 rounded-full">
                    {stack.stackType}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {stack.positions.map((pos) => (
                    <span
                      key={pos}
                      className="text-xs font-medium px-2 py-1 rounded"
                      style={{
                        backgroundColor: `${getPositionColor(pos)}20`,
                        color: getPositionColor(pos)
                      }}
                    >
                      {pos}
                    </span>
                  ))}
                </div>
                <div className="h-1.5 bg-white/10 rounded-full overflow-hidden mb-3">
                  <div
                    className="h-full bg-white/40 rounded-full"
                    style={{ width: `${stack.exposure}%` }}
                  />
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="text-lg font-bold text-white">{stack.exposure}%</span>
                  <span className="text-white/30 text-sm">{stack.drafts}/{stack.totalDrafts}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Draft Timing View */}
      {activeView === 'timing' && (
        <div className="space-y-6">
          <p className="text-white/50 text-sm">When you drafted - early drafts have more uncertainty, late drafts have more info</p>

          {/* Timing Summary Cards */}
          <div className="grid grid-cols-3 gap-4">
            {draftTiming.map((timing) => (
              <div
                key={timing.period}
                className={`p-4 rounded-xl border ${
                  timing.period === 'early'
                    ? 'bg-blue-500/10 border-blue-500/20'
                    : timing.period === 'mid'
                    ? 'bg-banana/10 border-banana/20'
                    : 'bg-green-500/10 border-green-500/20'
                }`}
              >
                <div className="text-white/40 text-xs mb-1">{timing.dateRange}</div>
                <div className={`text-lg font-bold mb-1 ${
                  timing.period === 'early'
                    ? 'text-blue-400'
                    : timing.period === 'mid'
                    ? 'text-banana'
                    : 'text-green-400'
                }`}>
                  {timing.label}
                </div>
                <div className="text-3xl font-bold text-white mb-2">{timing.drafts}</div>
                <div className="text-white/40 text-sm">{timing.exposure}% of drafts</div>
              </div>
            ))}
          </div>

          {/* Draft History */}
          <div>
            <h3 className="text-white font-semibold mb-3">Draft History</h3>
            <div className="space-y-2">
              {draftHistory.map((draft) => (
                <div
                  key={draft.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${
                      draft.period === 'early'
                        ? 'bg-blue-400'
                        : draft.period === 'mid'
                        ? 'bg-banana'
                        : 'bg-green-400'
                    }`} />
                    <div>
                      <div className="text-white font-medium">{draft.contestName}</div>
                      <div className="text-white/40 text-sm">{new Date(draft.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                    </div>
                  </div>
                  <div className="text-white/60">${draft.entryFee}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Depth Chart Modal */}
      <Modal
        isOpen={!!selectedExposure}
        onClose={() => setSelectedExposure(null)}
        title={selectedExposure ? `${selectedExposure.teamPosition} Depth Chart` : ''}
        size="md"
      >
        {selectedExposure && (
          <div className="space-y-4">
            {/* Exposure Stats Summary */}
            <div className="grid grid-cols-3 gap-4 p-4 bg-bg-tertiary rounded-xl">
              <div className="text-center">
                <p className="text-text-muted text-xs uppercase tracking-wider mb-1">Exposure</p>
                <p className={`font-bold text-xl ${getColor(selectedExposure.exposure)}`}>
                  {selectedExposure.exposure}%
                </p>
              </div>
              <div className="text-center">
                <p className="text-text-muted text-xs uppercase tracking-wider mb-1">Drafts</p>
                <p className="text-text-primary font-bold text-xl">{selectedExposure.drafts}</p>
              </div>
              <div className="text-center">
                <p className="text-text-muted text-xs uppercase tracking-wider mb-1">Total</p>
                <p className="text-text-secondary font-bold text-xl">{selectedExposure.totalDrafts}</p>
              </div>
            </div>

            {/* Season Stats from Rankings */}
            {selectedTeamPosition && (() => {
              // Calculate depth score based on how close top performers are
              const healthyPlayers = selectedDepthChart.filter(p => p.status !== 'injured');
              const injuredPlayers = selectedDepthChart.filter(p => p.status === 'injured');
              const sortedHealthy = [...healthyPlayers].sort((a, b) => b.projectedPoints - a.projectedPoints);

              // Depth score: if #2 is close to #1, depth is good
              let depthLabel = 'Weak';
              let depthColor = 'text-red-400';
              let depthBg = 'bg-red-500/10';

              if (sortedHealthy.length >= 2) {
                const topPoints = sortedHealthy[0].projectedPoints;
                const secondPoints = sortedHealthy[1].projectedPoints;
                const depthRatio = secondPoints / topPoints;

                if (depthRatio >= 0.85) {
                  depthLabel = 'Strong';
                  depthColor = 'text-green-400';
                  depthBg = 'bg-green-500/10';
                } else if (depthRatio >= 0.70) {
                  depthLabel = 'Solid';
                  depthColor = 'text-banana';
                  depthBg = 'bg-banana/10';
                } else {
                  depthLabel = 'Top Heavy';
                  depthColor = 'text-orange-400';
                  depthBg = 'bg-orange-500/10';
                }
              }

              // Check if top player is injured
              const topPlayerInjured = selectedDepthChart.length > 0 &&
                [...selectedDepthChart].sort((a, b) => b.projectedPoints - a.projectedPoints)[0]?.status === 'injured';

              return (
                <>
                  <div className="p-4 bg-banana/5 rounded-xl border border-banana/20">
                    <p className="text-text-muted text-xs uppercase tracking-wider mb-3">Position Stats · Based on top performer each week</p>
                    <div className="grid grid-cols-4 gap-3">
                      <div className="text-center">
                        <p className="text-text-primary font-bold text-xl">{selectedTeamPosition.byeWeek}</p>
                        <p className="text-text-muted text-xs">BYE</p>
                      </div>
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <p className="text-text-primary font-bold text-xl">{selectedTeamPosition.adp}</p>
                          {selectedTeamPosition.adpChange !== 0 && (
                            <span className={`text-sm font-medium ${
                              selectedTeamPosition.adpChange > 0 ? 'text-green-400' : 'text-red-400'
                            }`}>
                              {selectedTeamPosition.adpChange > 0 ? `+${selectedTeamPosition.adpChange}` : selectedTeamPosition.adpChange}
                            </span>
                          )}
                        </div>
                        <p className="text-text-muted text-xs">ADP</p>
                      </div>
                      <div className="text-center">
                        <p className="text-banana font-bold text-xl">{selectedTeamPosition.seasonPoints.toFixed(1)}</p>
                        <p className="text-text-muted text-xs">Season</p>
                      </div>
                      <div className="text-center">
                        <p className="text-text-secondary font-bold text-xl">{selectedTeamPosition.projectedPoints.toFixed(1)}</p>
                        <p className="text-text-muted text-xs">Projected</p>
                      </div>
                    </div>
                  </div>

                  {/* Depth & Injury Indicator */}
                  <div className="flex gap-3">
                    <div className={`flex-1 p-3 rounded-xl ${depthBg} border border-white/5`}>
                      <div className="flex items-center justify-between">
                        <span className="text-text-muted text-xs uppercase tracking-wider">Depth</span>
                        <span className={`font-semibold text-sm ${depthColor}`}>{depthLabel}</span>
                      </div>
                      <p className="text-text-muted text-xs mt-1">
                        {depthLabel === 'Strong' && 'Multiple high scorers - safe floor'}
                        {depthLabel === 'Solid' && 'Good backup options available'}
                        {depthLabel === 'Top Heavy' && 'Relies on primary scorer'}
                        {depthLabel === 'Weak' && 'Limited scoring options'}
                      </p>
                    </div>

                    {injuredPlayers.length > 0 && (
                      <div className={`flex-1 p-3 rounded-xl ${topPlayerInjured ? 'bg-red-500/10' : 'bg-orange-500/10'} border border-white/5`}>
                        <div className="flex items-center justify-between">
                          <span className="text-text-muted text-xs uppercase tracking-wider">Injury</span>
                          <span className={`font-semibold text-sm ${topPlayerInjured ? 'text-red-400' : 'text-orange-400'}`}>
                            {injuredPlayers.length} OUT
                          </span>
                        </div>
                        <p className="text-text-muted text-xs mt-1">
                          {topPlayerInjured
                            ? 'Top scorer injured - next man up'
                            : 'Backup injured - depth reduced'}
                        </p>
                      </div>
                    )}
                  </div>
                </>
              );
            })()}

            {/* Depth Chart Players */}
            {selectedDepthChart.length > 0 && selectedExposure && (
              <div>
                <h4 className="text-sm font-medium text-text-muted uppercase tracking-wider mb-1">Projected Scoring Order</h4>
                <p className="text-text-muted text-xs mb-3">Ranked by projected points · You score the top performer each week</p>
                <div className="space-y-2">
                  {(() => {
                    // Sort by projected points, injured players at bottom
                    const sorted = [...selectedDepthChart].sort((a, b) => {
                      if (a.status === 'injured' && b.status !== 'injured') return 1;
                      if (b.status === 'injured' && a.status !== 'injured') return -1;
                      return b.projectedPoints - a.projectedPoints;
                    });
                    // Get base position without number (WR1 -> WR, RB2 -> RB)
                    const basePos = selectedExposure.position.replace(/[0-9]/g, '');
                    // Track position number for non-injured
                    let posRank = 0;

                    return sorted.map((player, index) => {
                      const isInjured = player.status === 'injured';
                      if (!isInjured) posRank++;
                      const projLabel = isInjured ? 'OUT' : `Proj ${basePos}${posRank}`;

                      return (
                        <div
                          key={index}
                          className={`flex items-center justify-between p-4 rounded-xl transition-colors ${
                            isInjured
                              ? 'bg-red-500/10 border border-red-500/20 opacity-60'
                              : posRank === 1
                              ? 'bg-banana/10 border border-banana/20'
                              : 'bg-bg-tertiary border border-bg-elevated'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                              isInjured
                                ? 'bg-red-500/20 text-red-400'
                                : posRank === 1
                                ? 'bg-banana/20 text-banana'
                                : 'bg-white/10 text-white/60'
                            }`}>
                              {isInjured ? '—' : posRank}
                            </div>
                            <div>
                              <p className={`font-medium ${isInjured ? 'text-text-muted line-through' : 'text-text-primary'}`}>{player.name}</p>
                              <p className={`text-xs font-medium ${
                                isInjured
                                  ? 'text-red-400'
                                  : posRank === 1
                                  ? 'text-banana'
                                  : 'text-text-muted'
                              }`}>
                                {projLabel}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className={`font-medium ${isInjured ? 'text-text-muted' : 'text-text-primary'}`}>{player.projectedPoints.toFixed(1)}</p>
                            <p className="text-xs text-text-muted">Proj Pts</p>
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>
            )}

            {/* Close Button */}
            <Button
              variant="ghost"
              onClick={() => setSelectedExposure(null)}
              className="w-full"
            >
              Close
            </Button>
          </div>
        )}
      </Modal>
    </div>
  );
}
