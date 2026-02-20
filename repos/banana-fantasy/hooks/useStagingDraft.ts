'use client';

import { useCallback, useState } from 'react';
import { getDraftsApiUrl, getDraftServerUrl, isStagingMode } from '@/lib/staging';

export type DraftSpeed = 'fast' | 'slow';

interface StagingDraft {
  id: string;
  draftType: string;
  status: string;
  playerCount: number;
  maxPlayers: number;
}

interface UseStagingDraftResult {
  createAndJoin: (speed: DraftSpeed, walletAddress: string) => Promise<StagingDraft | null>;
  fillBots: (draftId: string, count?: number) => Promise<boolean>;
  getUserDrafts: (walletAddress: string) => Promise<StagingDraft[]>;
  isCreating: boolean;
  isFilling: boolean;
  error: string | null;
}

export function useStagingDraft(): UseStagingDraftResult {
  const [isCreating, setIsCreating] = useState(false);
  const [isFilling, setIsFilling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const apiUrl = getDraftsApiUrl();

  const createAndJoin = useCallback(async (speed: DraftSpeed, walletAddress: string): Promise<StagingDraft | null> => {
    if (!isStagingMode()) {
      setError('Staging mode not active. Add ?staging=true to URL.');
      return null;
    }
    setIsCreating(true);
    setError(null);
    try {
      // Create a draft via staging API
      const draftType = speed === 'fast' ? 'fast' : 'slow';
      const res = await fetch(`${apiUrl}/staging/create-draft`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          draftType,
          walletAddress,
          speed: speed === 'fast' ? 30 : 28800, // 30s or 8hr pick timer
        }),
      });

      if (!res.ok) {
        // Fallback: try joining an existing open draft
        const joinRes = await fetch(`${apiUrl}/staging/join-draft`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ draftType, walletAddress }),
        });
        if (joinRes.ok) {
          const data = await joinRes.json();
          return data as StagingDraft;
        }
        throw new Error(`Failed to create/join draft: ${await res.text()}`);
      }

      const data = await res.json();
      return data as StagingDraft;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to create draft';
      setError(msg);
      return null;
    } finally {
      setIsCreating(false);
    }
  }, [apiUrl]);

  const fillBots = useCallback(async (draftType: string, count: number = 9): Promise<boolean> => {
    if (!isStagingMode()) return false;
    setIsFilling(true);
    setError(null);
    try {
      const res = await fetch(`${apiUrl}/staging/fill-bots/${draftType}?count=${count}`, {
        method: 'POST',
      });
      if (!res.ok) throw new Error(await res.text());
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fill bots');
      return false;
    } finally {
      setIsFilling(false);
    }
  }, [apiUrl]);

  const getUserDrafts = useCallback(async (walletAddress: string): Promise<StagingDraft[]> => {
    try {
      const res = await fetch(`${apiUrl}/staging/user-drafts/${walletAddress}`);
      if (!res.ok) return [];
      const data = await res.json();
      return (data.drafts || data || []) as StagingDraft[];
    } catch {
      return [];
    }
  }, [apiUrl]);

  return { createAndJoin, fillBots, getUserDrafts, isCreating, isFilling, error };
}
