import { WheelSpin } from '@/types';

// Mock wheel spin history
export const mockWheelHistory: WheelSpin[] = [
  { id: '1', date: '2026-01-15', prize: { type: 'drafts', amount: 5 }, claimed: true },
  { id: '2', date: '2026-01-12', prize: { type: 'drafts', amount: 1 }, claimed: true },
  { id: '3', date: '2026-01-10', prize: { type: 'jackpot' }, claimed: true },
  { id: '4', date: '2026-01-08', prize: { type: 'drafts', amount: 10 }, claimed: true },
  { id: '5', date: '2026-01-05', prize: { type: 'hof' }, claimed: true },
  { id: '6', date: '2026-01-02', prize: { type: 'drafts', amount: 1 }, claimed: true },
  { id: '7', date: '2025-12-28', prize: { type: 'drafts', amount: 1 }, claimed: true },
  { id: '8', date: '2025-12-25', prize: { type: 'drafts', amount: 5 }, claimed: true },
  { id: '9', date: '2025-12-20', prize: { type: 'drafts', amount: 1 }, claimed: true },
  { id: '10', date: '2025-12-15', prize: { type: 'drafts', amount: 1 }, claimed: true },
  { id: '11', date: '2025-12-10', prize: { type: 'hof' }, claimed: true },
  { id: '12', date: '2025-12-05', prize: { type: 'drafts', amount: 5 }, claimed: true },
  { id: '13', date: '2025-12-01', prize: { type: 'drafts', amount: 1 }, claimed: true },
  { id: '14', date: '2025-11-25', prize: { type: 'drafts', amount: 1 }, claimed: true },
  { id: '15', date: '2025-11-20', prize: { type: 'drafts', amount: 10 }, claimed: true },
];

// Wheel segments configuration with percentages (visual segments are equal, odds are weighted)
// Jackpot: 1%, 20 Drafts: 1%, HOF: 5%, 10 Drafts: 2%, 5 Drafts: 5%, 1 Draft: 89%
export const wheelSegments = [
  { prize: { type: 'drafts', amount: 1 } as const, color: '#94a3b8', label: '1 Draft', percent: 89 },
  { prize: { type: 'drafts', amount: 5 } as const, color: '#22c55e', label: '5 Drafts', percent: 5 },
  { prize: { type: 'drafts', amount: 1 } as const, color: '#94a3b8', label: '1 Draft', percent: 0 },
  { prize: { type: 'jackpot' } as const, color: '#ef4444', label: 'Jackpot', percent: 1 },
  { prize: { type: 'drafts', amount: 1 } as const, color: '#94a3b8', label: '1 Draft', percent: 0 },
  { prize: { type: 'drafts', amount: 10 } as const, color: '#a78bfa', label: '10 Drafts', percent: 2 },
  { prize: { type: 'drafts', amount: 1 } as const, color: '#94a3b8', label: '1 Draft', percent: 0 },
  { prize: { type: 'hof' } as const, color: '#d4af37', label: 'HOF', percent: 2 },
  { prize: { type: 'drafts', amount: 1 } as const, color: '#94a3b8', label: '1 Draft', percent: 0 },
  { prize: { type: 'drafts', amount: 5 } as const, color: '#22c55e', label: '5 Drafts', percent: 0 },
  { prize: { type: 'drafts', amount: 1 } as const, color: '#94a3b8', label: '1 Draft', percent: 0 },
  { prize: { type: 'drafts', amount: 20 } as const, color: '#f59e0b', label: '20 Drafts', percent: 1 },
];
