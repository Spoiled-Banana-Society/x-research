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
      // Try scoring endpoint first
      const data = await fetchJson<unknown>('/api/standings', {
        signal,
        query: { wallet: wallet!, draftId: draftId!, gameweek, orderBy: 'scoreSeason' },
      });
      let entries: unknown[] = [];
      if (Array.isArray(data)) entries = data;
      else if (data && typeof data === 'object') {
        const obj = data as Record<string, unknown>;
        if (Array.isArray(obj.standings)) entries = obj.standings;
        else if (Array.isArray(obj.leaderboard)) entries = obj.leaderboard;
        else if (Array.isArray(obj.entries)) entries = obj.entries;
      }

      // If scoring data exists, use it
      if (entries.length > 0) return entries;

      // Fall back to draft summary — shows rosters even without scores
      try {
        const apiBase = '/api/draft-lookup';
        const [infoRes, summaryRes] = await Promise.all([
          fetchJson<{ draftOrder: { ownerId: string; tokenId: string }[]; pickNumber: number }>(`${apiBase}?draftId=${draftId}&type=info`, { signal }),
          fetchJson<{ playerInfo: { ownerAddress: string; playerId: string; position: string; team: string; pickNum: number } }[]>(`${apiBase}?draftId=${draftId}&type=summary`, { signal }),
        ]);
        const info = infoRes;
        const summary = summaryRes;

        // Group picks by owner to build team rosters
        const ownerPicks: Record<string, { playerId: string; position: string; team: string; pickNum: number }[]> = {};
        for (const pick of summary) {
          const owner = pick.playerInfo?.ownerAddress;
          if (!owner) continue;
          if (!ownerPicks[owner]) ownerPicks[owner] = [];
          ownerPicks[owner].push({
            playerId: pick.playerInfo.playerId,
            position: pick.playerInfo.position,
            team: pick.playerInfo.team,
            pickNum: pick.playerInfo.pickNum,
          });
        }

        // Extract league-level metadata
        const infoObj = info as Record<string, unknown>;
        const leagueLevel = String(infoObj.level ?? infoObj.draftLevel ?? infoObj.draftType ?? 'Pro');

        // Build leaderboard-like entries from draft order
        return info.draftOrder.map((player, idx) => {
          const id = player.ownerId;
          let displayName: string;
          if (id.startsWith('bot-')) {
            displayName = `Bot ${idx + 1}`;
          } else if (id.startsWith('0x') && id.length >= 10) {
            displayName = `${id.slice(0, 6)}...${id.slice(-4)}`;
          } else {
            displayName = id.slice(0, 12);
          }
          return {
            rank: idx + 1,
            displayName,
            ownerWallet: id,
            weeklyScore: 0,
            seasonScore: 0,
            isCurrentUser: id.toLowerCase() === wallet?.toLowerCase(),
            roster: (ownerPicks[id] || []).map(p => `${p.team} ${p.position}`),
            pickCount: (ownerPicks[id] || []).length,
            leagueLevel,
          };
        });
      } catch {
        return [];
      }
    },
    { enabled: !!wallet && !!draftId, fallbackData: [] },
  );
}
