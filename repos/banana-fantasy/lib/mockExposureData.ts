// Mock exposure data - will be replaced with live API data later

import type {
  DraftHistory,
  DraftTiming,
  TeamStack,
  UserExposure,
} from '@/lib/exposureUtils';

// Mock user exposure data
export const mockUserExposure: UserExposure = {
  username: 'BananaKing99',
  totalDrafts: 20,
  exposures: [
    // QBs - high exposure
    { team: 'KC', position: 'QB', teamPosition: 'KC QB', drafts: 7, totalDrafts: 20, exposure: 35 },
    { team: 'PHI', position: 'QB', teamPosition: 'PHI QB', drafts: 5, totalDrafts: 20, exposure: 25 },
    { team: 'BUF', position: 'QB', teamPosition: 'BUF QB', drafts: 4, totalDrafts: 20, exposure: 20 },
    { team: 'MIA', position: 'QB', teamPosition: 'MIA QB', drafts: 3, totalDrafts: 20, exposure: 15 },
    { team: 'CIN', position: 'QB', teamPosition: 'CIN QB', drafts: 1, totalDrafts: 20, exposure: 5 },

    // WR1s
    { team: 'MIA', position: 'WR1', teamPosition: 'MIA WR1', drafts: 6, totalDrafts: 20, exposure: 30 },
    { team: 'SF', position: 'WR1', teamPosition: 'SF WR1', drafts: 5, totalDrafts: 20, exposure: 25 },
    { team: 'CIN', position: 'WR1', teamPosition: 'CIN WR1', drafts: 4, totalDrafts: 20, exposure: 20 },
    { team: 'MIN', position: 'WR1', teamPosition: 'MIN WR1', drafts: 3, totalDrafts: 20, exposure: 15 },
    { team: 'PHI', position: 'WR1', teamPosition: 'PHI WR1', drafts: 2, totalDrafts: 20, exposure: 10 },

    // WR2s
    { team: 'DAL', position: 'WR2', teamPosition: 'DAL WR2', drafts: 5, totalDrafts: 20, exposure: 25 },
    { team: 'DET', position: 'WR2', teamPosition: 'DET WR2', drafts: 5, totalDrafts: 20, exposure: 25 },
    { team: 'SEA', position: 'WR2', teamPosition: 'SEA WR2', drafts: 4, totalDrafts: 20, exposure: 20 },
    { team: 'LAR', position: 'WR2', teamPosition: 'LAR WR2', drafts: 3, totalDrafts: 20, exposure: 15 },
    { team: 'TB', position: 'WR2', teamPosition: 'TB WR2', drafts: 3, totalDrafts: 20, exposure: 15 },

    // RB1s
    { team: 'SF', position: 'RB1', teamPosition: 'SF RB1', drafts: 6, totalDrafts: 20, exposure: 30 },
    { team: 'MIA', position: 'RB1', teamPosition: 'MIA RB1', drafts: 4, totalDrafts: 20, exposure: 20 },
    { team: 'DAL', position: 'RB1', teamPosition: 'DAL RB1', drafts: 4, totalDrafts: 20, exposure: 20 },
    { team: 'BAL', position: 'RB1', teamPosition: 'BAL RB1', drafts: 3, totalDrafts: 20, exposure: 15 },
    { team: 'DET', position: 'RB1', teamPosition: 'DET RB1', drafts: 3, totalDrafts: 20, exposure: 15 },

    // RB2s
    { team: 'KC', position: 'RB2', teamPosition: 'KC RB2', drafts: 5, totalDrafts: 20, exposure: 25 },
    { team: 'GB', position: 'RB2', teamPosition: 'GB RB2', drafts: 4, totalDrafts: 20, exposure: 20 },
    { team: 'LAR', position: 'RB2', teamPosition: 'LAR RB2', drafts: 4, totalDrafts: 20, exposure: 20 },
    { team: 'CLE', position: 'RB2', teamPosition: 'CLE RB2', drafts: 4, totalDrafts: 20, exposure: 20 },
    { team: 'CHI', position: 'RB2', teamPosition: 'CHI RB2', drafts: 3, totalDrafts: 20, exposure: 15 },

    // TEs
    { team: 'KC', position: 'TE', teamPosition: 'KC TE', drafts: 8, totalDrafts: 20, exposure: 40 },
    { team: 'SF', position: 'TE', teamPosition: 'SF TE', drafts: 4, totalDrafts: 20, exposure: 20 },
    { team: 'DAL', position: 'TE', teamPosition: 'DAL TE', drafts: 3, totalDrafts: 20, exposure: 15 },
    { team: 'DET', position: 'TE', teamPosition: 'DET TE', drafts: 3, totalDrafts: 20, exposure: 15 },
    { team: 'MIA', position: 'TE', teamPosition: 'MIA TE', drafts: 2, totalDrafts: 20, exposure: 10 },

    // DSTs
    { team: 'SF', position: 'DST', teamPosition: 'SF DST', drafts: 6, totalDrafts: 20, exposure: 30 },
    { team: 'DAL', position: 'DST', teamPosition: 'DAL DST', drafts: 5, totalDrafts: 20, exposure: 25 },
    { team: 'BAL', position: 'DST', teamPosition: 'BAL DST', drafts: 4, totalDrafts: 20, exposure: 20 },
    { team: 'NYJ', position: 'DST', teamPosition: 'NYJ DST', drafts: 3, totalDrafts: 20, exposure: 15 },
    { team: 'CLE', position: 'DST', teamPosition: 'CLE DST', drafts: 2, totalDrafts: 20, exposure: 10 },
  ],
};

export const mockTeamStacks: TeamStack[] = [
  { team: 'KC', positions: ['QB', 'TE'], stackType: 'QB + TE', drafts: 6, totalDrafts: 20, exposure: 30 },
  { team: 'MIA', positions: ['QB', 'WR1', 'RB1'], stackType: 'Full Stack', drafts: 3, totalDrafts: 20, exposure: 15 },
  { team: 'SF', positions: ['RB1', 'TE'], stackType: 'RB + TE', drafts: 4, totalDrafts: 20, exposure: 20 },
  { team: 'PHI', positions: ['QB', 'WR1'], stackType: 'QB + WR', drafts: 4, totalDrafts: 20, exposure: 20 },
  { team: 'DAL', positions: ['WR2', 'RB1', 'TE'], stackType: 'Skill Stack', drafts: 3, totalDrafts: 20, exposure: 15 },
  { team: 'CIN', positions: ['QB', 'WR1'], stackType: 'QB + WR', drafts: 3, totalDrafts: 20, exposure: 15 },
  { team: 'DET', positions: ['WR2', 'RB1', 'TE'], stackType: 'Skill Stack', drafts: 3, totalDrafts: 20, exposure: 15 },
  { team: 'KC', positions: ['QB', 'TE', 'RB2'], stackType: 'Full Stack', drafts: 2, totalDrafts: 20, exposure: 10 },
  { team: 'BUF', positions: ['QB'], stackType: 'Single', drafts: 4, totalDrafts: 20, exposure: 20 },
  { team: 'SF', positions: ['WR1', 'RB1', 'TE', 'DST'], stackType: 'Full Stack', drafts: 2, totalDrafts: 20, exposure: 10 },
];

// Draft timing - when drafts occurred
export const mockDraftTiming: DraftTiming[] = [
  { period: 'early', label: 'Early Season', dateRange: 'Jun 1 - Jul 15', drafts: 5, totalDrafts: 20, exposure: 25 },
  { period: 'mid', label: 'Mid Season', dateRange: 'Jul 16 - Aug 20', drafts: 8, totalDrafts: 20, exposure: 40 },
  { period: 'late', label: 'Late Season', dateRange: 'Aug 21 - Sep 5', drafts: 7, totalDrafts: 20, exposure: 35 },
];

export const mockDraftHistory: DraftHistory[] = [
  { id: '1', date: '2024-06-05', period: 'early', contestName: 'Best Ball Mania', entryFee: 25 },
  { id: '2', date: '2024-06-12', period: 'early', contestName: 'Best Ball Mania', entryFee: 25 },
  { id: '3', date: '2024-06-20', period: 'early', contestName: 'Underdog Main', entryFee: 5 },
  { id: '4', date: '2024-07-01', period: 'early', contestName: 'Best Ball Mania', entryFee: 25 },
  { id: '5', date: '2024-07-10', period: 'early', contestName: 'Underdog Main', entryFee: 5 },
  { id: '6', date: '2024-07-18', period: 'mid', contestName: 'Best Ball Mania', entryFee: 25 },
  { id: '7', date: '2024-07-25', period: 'mid', contestName: 'Best Ball Mania', entryFee: 25 },
  { id: '8', date: '2024-08-01', period: 'mid', contestName: 'Underdog Main', entryFee: 5 },
  { id: '9', date: '2024-08-05', period: 'mid', contestName: 'Best Ball Mania', entryFee: 25 },
  { id: '10', date: '2024-08-10', period: 'mid', contestName: 'Underdog Main', entryFee: 5 },
  { id: '11', date: '2024-08-12', period: 'mid', contestName: 'Best Ball Mania', entryFee: 25 },
  { id: '12', date: '2024-08-15', period: 'mid', contestName: 'Underdog Main', entryFee: 5 },
  { id: '13', date: '2024-08-18', period: 'mid', contestName: 'Best Ball Mania', entryFee: 25 },
  { id: '14', date: '2024-08-22', period: 'late', contestName: 'Best Ball Mania', entryFee: 25 },
  { id: '15', date: '2024-08-25', period: 'late', contestName: 'Underdog Main', entryFee: 5 },
  { id: '16', date: '2024-08-28', period: 'late', contestName: 'Best Ball Mania', entryFee: 25 },
  { id: '17', date: '2024-09-01', period: 'late', contestName: 'Underdog Main', entryFee: 5 },
  { id: '18', date: '2024-09-02', period: 'late', contestName: 'Best Ball Mania', entryFee: 25 },
  { id: '19', date: '2024-09-03', period: 'late', contestName: 'Best Ball Mania', entryFee: 25 },
  { id: '20', date: '2024-09-04', period: 'late', contestName: 'Underdog Main', entryFee: 5 },
];
