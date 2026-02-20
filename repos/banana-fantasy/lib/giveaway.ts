import { generateSeed, pickWeighted } from '@/lib/rng';

export interface GiveawayEntry<T = unknown> {
  id: string;
  weight: number;
  payload?: T;
}

export interface GiveawayResult<T = unknown> {
  seed: string;
  winner: GiveawayEntry<T>;
  roll: number;
  index: number;
}

export function selectGiveawayWinner<T>(entries: GiveawayEntry<T>[], seed?: string): GiveawayResult<T> {
  if (!entries.length) throw new Error('No giveaway entries provided');
  const total = entries.reduce((sum, entry) => sum + entry.weight, 0);
  if (total <= 0) throw new Error('Giveaway weights must sum to > 0');

  const normalized = entries.map((entry) => ({
    value: entry,
    probability: entry.weight / total,
  }));

  const finalSeed = seed ?? generateSeed();
  const { value, roll, index } = pickWeighted(normalized, finalSeed);
  return { seed: finalSeed, winner: value, roll, index };
}
