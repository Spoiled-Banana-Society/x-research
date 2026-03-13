'use client';

import { fetchJson } from '@/lib/appApiClient';
import { useSWRLike } from '@/hooks/useSWRLike';
import { useAuth } from '@/hooks/useAuth';

/**
 * Fetch the current gameweek from the Go API.
 */
export function useGameweek() {
  return useSWRLike<string>(
    'standings:gameweek',
    async ({ signal }) => {
      const data = await fetchJson<unknown>('/api/standings?action=gameweek', { signal });
      // API may return { gameweek: "2025REG-05" } or a plain string
      if (typeof data === 'string') return data;
      if (data && typeof data === 'object' && 'gameweek' in (data as Record<string, unknown>)) {
        return String((data as Record<string, unknown>).gameweek);
      }
      return '2025REG-01';
    },
    { fallbackData: '2025REG-01' },
  );
}

/**
 * Fetch the user's teams across all leagues for standings.
 * Uses the real /api/standings proxy → Go drafts API.
 */
export function useMyTeams(gameweek: string) {
  const { user } = useAuth();
  const wallet = user?.walletAddress;

  return useSWRLike<unknown[]>(
    wallet ? `standings:myteams:${wallet}:${gameweek}` : null,
    async ({ signal }) => {
      const data = await fetchJson<unknown>('/api/standings', {
        signal,
        query: { wallet: wallet!, gameweek, orderBy: 'scoreSeason', level: 'all' },
      });
      // API may return array directly or { teams: [...] }
      if (Array.isArray(data)) return data;
      if (data && typeof data === 'object') {
        const obj = data as Record<string, unknown>;
        if (Array.isArray(obj.teams)) return obj.teams;
        if (Array.isArray(obj.entries)) return obj.entries;
        if (Array.isArray(obj.leaderboard)) return obj.leaderboard;
      }
      return [];
    },
    { enabled: !!wallet, fallbackData: [] },
  );
}

/**
 * Fetch league-specific standings (10-player leaderboard for a specific draft).
 */
export function useLeagueDetail(draftId: string | null, gameweek: string) {
  const { user } = useAuth();
  const wallet = user?.walletAddress;

  return useSWRLike<unknown[]>(
    wallet && draftId ? `standings:league:${draftId}:${wallet}:${gameweek}` : null,
    async ({ signal }) => {
      const data = await fetchJson<unknown>('/api/standings', {
        signal,
        query: { wallet: wallet!, draftId: draftId!, gameweek, orderBy: 'scoreSeason' },
      });
      if (Array.isArray(data)) return data;
      if (data && typeof data === 'object') {
        const obj = data as Record<string, unknown>;
        if (Array.isArray(obj.standings)) return obj.standings;
        if (Array.isArray(obj.leaderboard)) return obj.leaderboard;
        if (Array.isArray(obj.entries)) return obj.entries;
      }
      return [];
    },
    { enabled: !!wallet && !!draftId, fallbackData: [] },
  );
}
