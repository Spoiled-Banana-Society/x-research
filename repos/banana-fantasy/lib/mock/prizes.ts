import { EligibilityStatus, Prize, PrizeHistoryItem, PrizeWithdrawal } from '@/types';

// Mock prizes
export const mockPrizes: Prize[] = [
  { id: '1', contestName: 'Week 3 Contest', amount: 300, status: 'paid', paidDate: '2026-01-03' },
  { id: '2', contestName: 'Week 6 Contest', amount: 450, status: 'paid', paidDate: '2026-01-10' },
  { id: '3', contestName: 'Season Championship', amount: 2000, status: 'forfeited', forfeitReason: 'Eligibility not completed within 30 days' },
  { id: '4', contestName: 'Weekly Showdown #42', amount: 150, status: 'processing' },
  { id: '5', contestName: 'Week 8 Top Scorer', amount: 500, status: 'pending' },
];

export const mockWithdrawals: PrizeWithdrawal[] = [
  {
    id: 'w1',
    type: 'withdrawal',
    userId: '1',
    draftId: 'draft-892',
    amount: 200,
    method: 'bank',
    status: 'processing',
    createdAt: '2026-01-12',
  },
  {
    id: 'w2',
    type: 'withdrawal',
    userId: '1',
    draftId: 'draft-756',
    amount: 150,
    method: 'usdc',
    status: 'completed',
    createdAt: '2026-01-05',
    updatedAt: '2026-01-06',
  },
];

export const mockPrizeHistory: PrizeHistoryItem[] = [
  ...mockPrizes.map((prize) => ({
    ...prize,
    type: 'win' as const,
    draftId: `draft-${prize.id}`,
    createdAt: prize.paidDate,
  })),
  ...mockWithdrawals,
];

// Mock eligibility
export const mockEligibility: EligibilityStatus = {
  isVerified: true,
  season: 2026,
  w9Completed: true,
  lastVerifiedDate: '2025-12-01',
  kycStatus: 'verified',
  ageStatus: 'verified',
  regionStatus: 'verified',
  verificationUrl: '/verify',
};
