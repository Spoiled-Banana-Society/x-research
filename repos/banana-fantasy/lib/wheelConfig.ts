export interface WheelSegment {
  id: string;
  label: string;
  probability: number; // 0-1, all must sum to 1
  prizeType: 'draft_pass' | 'discount' | 'merch' | 'nothing' | 'custom';
  prizeValue?: number | string;
  color: string;
}

const DRAFT_ONE = 0.93;
const DRAFT_FIVE = 0.025;
const DRAFT_TEN = 0.01;
const DRAFT_TWENTY = 0.005;
const HOF = 0.02;
const JACKPOT = 0.01;

export const wheelSegments: WheelSegment[] = [
  { id: 'draft-1-a', label: '1 Draft', probability: DRAFT_ONE / 6, prizeType: 'draft_pass', prizeValue: 1, color: '#94a3b8' },
  { id: 'draft-5-a', label: '5 Drafts', probability: DRAFT_FIVE / 2, prizeType: 'draft_pass', prizeValue: 5, color: '#22c55e' },
  { id: 'draft-1-b', label: '1 Draft', probability: DRAFT_ONE / 6, prizeType: 'draft_pass', prizeValue: 1, color: '#94a3b8' },
  { id: 'jackpot', label: 'Jackpot', probability: JACKPOT, prizeType: 'custom', prizeValue: 'jackpot', color: '#ef4444' },
  { id: 'draft-1-c', label: '1 Draft', probability: DRAFT_ONE / 6, prizeType: 'draft_pass', prizeValue: 1, color: '#94a3b8' },
  { id: 'draft-10', label: '10 Drafts', probability: DRAFT_TEN, prizeType: 'draft_pass', prizeValue: 10, color: '#a78bfa' },
  { id: 'draft-1-d', label: '1 Draft', probability: DRAFT_ONE / 6, prizeType: 'draft_pass', prizeValue: 1, color: '#94a3b8' },
  { id: 'hof', label: 'HOF', probability: HOF, prizeType: 'custom', prizeValue: 'hof', color: '#d4af37' },
  { id: 'draft-1-e', label: '1 Draft', probability: DRAFT_ONE / 6, prizeType: 'draft_pass', prizeValue: 1, color: '#94a3b8' },
  { id: 'draft-5-b', label: '5 Drafts', probability: DRAFT_FIVE / 2, prizeType: 'draft_pass', prizeValue: 5, color: '#22c55e' },
  { id: 'draft-1-f', label: '1 Draft', probability: DRAFT_ONE / 6, prizeType: 'draft_pass', prizeValue: 1, color: '#94a3b8' },
  { id: 'draft-20', label: '20 Drafts', probability: DRAFT_TWENTY, prizeType: 'draft_pass', prizeValue: 20, color: '#f59e0b' },
];

export const WHEEL_SEGMENT_ANGLE = 360 / wheelSegments.length;
