/**
 * Guaranteed Draft Type Distribution Manager
 *
 * Every 100 drafts contains exactly: 1 Jackpot, 5 HOF, 94 Pro.
 * The order is randomized but the distribution is guaranteed.
 *
 * Stores batch state in localStorage. When the backend implements this,
 * replace claimNextType() with an API call.
 */

import type { DraftType } from '@/lib/draftRoomConstants';

const STORAGE_KEY = 'banana-batch-state';
const BATCH_SIZE = 100;

interface BatchState {
  /** Pre-shuffled sequence of 100 draft types */
  sequence: DraftType[];
  /** Next index to claim (0–99) */
  index: number;
  /** Batch number (increments each reset) */
  batchNumber: number;
  /** History of claimed types with draft IDs (for debugging) */
  history: Array<{ draftId: string; type: DraftType; claimedAt: number }>;
}

/** Fisher-Yates shuffle */
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Generate a shuffled sequence of exactly 1 JP, 5 HOF, 94 Pro */
function generateBatchSequence(): DraftType[] {
  const types: DraftType[] = [
    'jackpot',
    ...Array(5).fill('hof') as DraftType[],
    ...Array(94).fill('pro') as DraftType[],
  ];
  return shuffle(types);
}

/** Read current batch state from localStorage */
function readState(): BatchState {
  if (typeof window === 'undefined') {
    return { sequence: generateBatchSequence(), index: 0, batchNumber: 1, history: [] };
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as BatchState;
      if (parsed.sequence?.length === BATCH_SIZE && typeof parsed.index === 'number') {
        return parsed;
      }
    }
  } catch {}
  // First time or corrupted — initialize fresh batch
  const fresh: BatchState = {
    sequence: generateBatchSequence(),
    index: 0,
    batchNumber: 1,
    history: [],
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
  return fresh;
}

/** Write batch state to localStorage */
function writeState(state: BatchState) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

/**
 * Claim the next draft type from the batch.
 * Call this when a draft fills (10/10 players).
 * Returns the guaranteed type for this draft.
 */
export function claimNextType(draftId: string): DraftType {
  const state = readState();

  // If batch is exhausted, start a new one
  if (state.index >= BATCH_SIZE) {
    state.sequence = generateBatchSequence();
    state.index = 0;
    state.batchNumber += 1;
    state.history = []; // Clear history for new batch
  }

  const type = state.sequence[state.index];
  state.index += 1;

  // Record in history (keep last 20 for debugging)
  state.history.push({ draftId, type, claimedAt: Date.now() });
  if (state.history.length > 20) state.history = state.history.slice(-20);

  writeState(state);
  return type;
}

/**
 * Check if a draft already has a claimed type (prevents double-claiming on re-entry).
 */
export function getClaimedType(draftId: string): DraftType | null {
  const state = readState();
  const entry = state.history.find(h => h.draftId === draftId);
  return entry?.type ?? null;
}

/**
 * Get the current batch progress for the header indicator.
 */
export function getBatchProgress(): {
  current: number;
  total: number;
  jackpotRemaining: number;
  hofRemaining: number;
} {
  const state = readState();
  const claimed = state.sequence.slice(0, state.index);
  const remaining = state.sequence.slice(state.index);

  return {
    current: state.index,
    total: BATCH_SIZE,
    jackpotRemaining: remaining.filter(t => t === 'jackpot').length,
    hofRemaining: remaining.filter(t => t === 'hof').length,
  };
}

/**
 * Peek at what the next type would be (for debugging, don't use in production).
 */
export function peekNextType(): DraftType | null {
  const state = readState();
  if (state.index >= BATCH_SIZE) return null;
  return state.sequence[state.index];
}

/**
 * Reset the batch (for testing).
 */
export function resetBatch() {
  const fresh: BatchState = {
    sequence: generateBatchSequence(),
    index: 0,
    batchNumber: 1,
    history: [],
  };
  writeState(fresh);
}
