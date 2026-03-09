'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { MarketplaceTeam, DraftType } from '@/lib/opensea';
import type { CollectionStats } from '@/lib/opensea';
import { getOwnerDraftTokens, type ApiDraftToken } from '@/lib/api/owner';

// ── Collection Stats ────────────────────────────────────────────────

interface UseCollectionStatsResult {
  data: CollectionStats | null;
  isLoading: boolean;
  error: unknown;
  refetch: () => void;
}

export function useCollectionStats(): UseCollectionStatsResult {
  const [data, setData] = useState<CollectionStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch('/api/marketplace/collection');
      if (!res.ok) throw new Error(`Failed to fetch stats: ${res.status}`);
      const json = await res.json();
      setData(json);
      setError(null);
    } catch (err) {
      setError(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 60_000);
    return () => clearInterval(interval);
  }, [fetchStats]);

  return { data, isLoading, error, refetch: fetchStats };
}

// ── Listings (Buy Tab) ──────────────────────────────────────────────

interface UseListingsResult {
  data: MarketplaceTeam[];
  isLoading: boolean;
  error: unknown;
  hasMore: boolean;
  loadMore: () => void;
  refetch: () => void;
}

export function useListings(
  sort: string = 'price',
  direction: string = 'asc',
  limit: number = 50,
): UseListingsResult {
  const [data, setData] = useState<MarketplaceTeam[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);

  const fetchListings = useCallback(async (append = false, nextCursor?: string | null) => {
    if (!append) setIsLoading(true);
    try {
      const params = new URLSearchParams({
        sort,
        direction,
        limit: String(limit),
      });
      if (nextCursor) params.set('cursor', nextCursor);

      const res = await fetch(`/api/marketplace/listings?${params}`);
      if (!res.ok) throw new Error(`Failed to fetch listings: ${res.status}`);
      const json = await res.json();

      const listings: MarketplaceTeam[] = json.listings ?? [];
      setData(prev => append ? [...prev, ...listings] : listings);
      setCursor(json.next ?? null);
      setHasMore(!!json.next);
      setError(null);
    } catch (err) {
      setError(err);
    } finally {
      setIsLoading(false);
    }
  }, [sort, direction, limit]);

  useEffect(() => {
    fetchListings(false);
  }, [fetchListings]);

  const loadMore = useCallback(() => {
    if (cursor) fetchListings(true, cursor);
  }, [cursor, fetchListings]);

  const refetch = useCallback(() => {
    fetchListings(false);
  }, [fetchListings]);

  return { data, isLoading, error, hasMore, loadMore, refetch };
}

// ── My NFTs (Sell Tab) ──────────────────────────────────────────────

interface UseMyNftsResult {
  data: MarketplaceTeam[];
  isLoading: boolean;
  error: unknown;
  refetch: () => void;
}

/**
 * Enrich OpenSea NFT data with SBS backend stats (rank, points, roster, level).
 */
function enrichWithBackendData(
  nfts: MarketplaceTeam[],
  tokens: ApiDraftToken[],
): MarketplaceTeam[] {
  return nfts.map(nft => {
    // Match by cardId (token ID)
    const token = tokens.find(t => t.cardId === nft.tokenId);
    if (!token) return nft;

    const level = token.level;
    const draftType: DraftType =
      level === 'Jackpot' ? 'jackpot' : level === 'Hall of Fame' ? 'hof' : 'pro';

    const rank = token.rank ? parseInt(token.rank, 10) : 0;
    const points = token.seasonScore ? Number(token.seasonScore) : 0;
    const weekScore = token.weekScore ? Number(token.weekScore) : 0;

    // Build roster display strings from backend roster data
    const roster: string[] = [];
    if (token.roster) {
      const posOrder = ['QB', 'RB', 'WR', 'TE', 'DST'] as const;
      for (const pos of posOrder) {
        const players = token.roster[pos];
        if (players?.length) {
          players.forEach(p => roster.push(`${p.team} ${p.position}`));
        }
      }
    }

    const colorMap: Record<DraftType, string> = {
      jackpot: 'from-error to-red-700',
      hof: 'from-hof to-pink-600',
      pro: 'from-pro to-blue-600',
    };

    return {
      ...nft,
      draftType,
      isHof: draftType === 'hof' || draftType === 'jackpot',
      isJackpot: draftType === 'jackpot',
      rank: Number.isFinite(rank) ? rank : 0,
      points: Number.isFinite(points) ? points : 0,
      weeklyAvg: Number.isFinite(weekScore) ? weekScore : 0,
      roster: roster.length > 0 ? roster : nft.roster,
      color: colorMap[draftType],
      name: token.leagueDisplayName || nft.name,
    };
  });
}

export function useMyNfts(walletAddress: string | null): UseMyNftsResult {
  const [data, setData] = useState<MarketplaceTeam[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const fetchingRef = useRef<string | null>(null);

  const fetchMyNfts = useCallback(async () => {
    if (!walletAddress) {
      setData([]);
      return;
    }
    // Avoid duplicate fetches
    if (fetchingRef.current === walletAddress) return;
    fetchingRef.current = walletAddress;

    setIsLoading(true);
    try {
      // Fetch OpenSea NFTs and SBS backend tokens in parallel
      const [nftRes, tokens] = await Promise.all([
        fetch(`/api/marketplace/nfts?owner=${encodeURIComponent(walletAddress)}`),
        getOwnerDraftTokens(walletAddress).catch(() => [] as ApiDraftToken[]),
      ]);

      if (!nftRes.ok) throw new Error(`Failed to fetch NFTs: ${nftRes.status}`);
      const json = await nftRes.json();
      const rawNfts: MarketplaceTeam[] = json.nfts ?? [];

      // Enrich with backend data
      const enriched = enrichWithBackendData(rawNfts, tokens);
      setData(enriched);
      setError(null);
    } catch (err) {
      setError(err);
    } finally {
      setIsLoading(false);
      fetchingRef.current = null;
    }
  }, [walletAddress]);

  useEffect(() => {
    fetchMyNfts();
  }, [fetchMyNfts]);

  return { data, isLoading, error, refetch: fetchMyNfts };
}

// ── Single NFT Detail ───────────────────────────────────────────────

export function useNftDetail(tokenId: string | null) {
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);

  const fetchNft = useCallback(async () => {
    if (!tokenId) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/marketplace/nft/${tokenId}`);
      if (!res.ok) throw new Error(`Failed to fetch NFT: ${res.status}`);
      setData(await res.json());
      setError(null);
    } catch (err) {
      setError(err);
    } finally {
      setIsLoading(false);
    }
  }, [tokenId]);

  useEffect(() => {
    fetchNft();
  }, [fetchNft]);

  return { data, isLoading, error, refetch: fetchNft };
}
