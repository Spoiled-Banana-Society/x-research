'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ContestCard } from '@/components/home/ContestCard';
import { PromoCarousel } from '@/components/home/PromoCarousel';
import { AddToHomeScreenCard } from '@/components/home/AddToHomeScreenCard';
import { ContestDetailsModal } from '@/components/modals/ContestDetailsModal';
import { EntryFlowModal } from '@/components/modals/EntryFlowModal';
import { BuyPassesModal } from '@/components/modals/BuyPassesModal';
import { useAuth } from '@/hooks/useAuth';
import { useModalStack } from '@/hooks/useModalStack';
import { useContests } from '@/hooks/useContests';
import { usePromos } from '@/hooks/usePromos';
import { getDraftsApiUrl, isStagingMode as _isStagingMode } from '@/lib/staging';
import { SkeletonContestCard } from '@/components/ui/Skeleton';
import { consumePromoDraftType, peekPromoDraftType } from '@/lib/promoDraftType';
import * as draftStore from '@/lib/draftStore';

export default function HomePage() {
  const router = useRouter();
  const { isLoggedIn, user, setShowLoginModal, updateUser } = useAuth();
  const [isJoiningDraft, setIsJoiningDraft] = React.useState(false);
  const contestsQuery = useContests();
  const promosQuery = usePromos({ userId: user?.id });

  const selectedContest = contestsQuery.data?.[0];
  const modals = useModalStack();
  const joinInFlightRef = React.useRef(false);

  const withTimeout = React.useCallback(async (promise: Promise<unknown>, timeoutMs: number, label: string): Promise<unknown> => {
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutId = setTimeout(() => {
        reject(new Error(`${label} timed out after ${Math.round(timeoutMs / 1000)}s`));
      }, timeoutMs);
    });

    try {
      return await Promise.race([promise, timeoutPromise]);
    } finally {
      if (timeoutId) clearTimeout(timeoutId);
    }
  }, []);

  const buildDraftRoomUrl = React.useCallback((draftId: string, contestName: string, speed: 'fast' | 'slow') => {
    const params = new URLSearchParams({
      id: draftId,
      name: contestName,
      speed,
    });

    // Add live mode params only in staging mode
    if (user?.walletAddress && _isStagingMode()) {
      params.set('mode', 'live');
      params.set('wallet', user.walletAddress);
    }

    if (typeof window !== 'undefined') {
      const current = new URLSearchParams(window.location.search);
      if (current.get('staging') === 'true') params.set('staging', 'true');
      const apiUrl = current.get('apiUrl');
      const wsUrl = current.get('wsUrl');
      if (apiUrl) params.set('apiUrl', apiUrl);
      if (wsUrl) params.set('wsUrl', wsUrl);
    }

    return `/draft-room?${params.toString()}`;
  }, [user?.walletAddress]);

  const recoverStagingJoinFromServerError = React.useCallback(async (walletAddress: string, speed: 'fast' | 'slow') => {
    const apiBase = getDraftsApiUrl();
    const wallet = walletAddress.trim().toLowerCase();
    const draftType = speed === 'fast' ? 'fast' : 'slow';

    // 1) try the staging join fallback endpoint first
    try {
      const joinRes = await fetch(`${apiBase}/staging/join-draft`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ draftType, walletAddress: wallet }),
      });
      if (joinRes.ok) {
        const joined = await joinRes.json() as Record<string, unknown>;
        const joinedDraftId = String(joined.draftId ?? joined.leagueId ?? joined.id ?? '');
        if (joinedDraftId) return joinedDraftId;
      }
    } catch {
      // continue to user-drafts fallback
    }

    // 2) if already joined/locked state exists, recover newest draft for this wallet
    try {
      const draftsRes = await fetch(`${apiBase}/staging/user-drafts/${wallet}`);
      if (!draftsRes.ok) return null;
      const draftsJson = await draftsRes.json() as { drafts?: Array<Record<string, unknown>> } | Array<Record<string, unknown>>;
      const drafts = Array.isArray(draftsJson) ? draftsJson : (draftsJson?.drafts ?? []);
      const latest = drafts.find((d) => Boolean(d?.draftId || d?.leagueId || d?.id));
      if (!latest) return null;
      return String(latest.draftId ?? latest.leagueId ?? latest.id ?? '');
    } catch {
      return null;
    }
  }, []);

  const handleEnter = () => {
    if (!isLoggedIn) {
      setShowLoginModal(true);
      return;
    }

    const paidPasses = user?.draftPasses || 0;
    const freePasses = user?.freeDrafts || 0;
    const totalPasses = paidPasses + freePasses;

    if (totalPasses <= 0) {
      modals.push('buy-passes');
      return;
    }

    modals.push('entry-flow');
  };

  const handleEntryComplete = async (passType: 'paid' | 'free', speed: 'fast' | 'slow') => {
    if (joinInFlightRef.current) {
      console.warn('[Home] Duplicate join blocked: join already in flight');
      return;
    }
    joinInFlightRef.current = true;
    setIsJoiningDraft(true);
    modals.closeAll();

    if (!user?.walletAddress) {
      joinInFlightRef.current = false;
      setIsJoiningDraft(false);
      return;
    }

    const prevPaidPasses = user?.draftPasses || 0;
    const prevFreePasses = user?.freeDrafts || 0;
    let deducted = false;

    if (passType === 'paid' && prevPaidPasses <= 0) {
      joinInFlightRef.current = false;
      setIsJoiningDraft(false);
      alert('No paid draft passes available.');
      return;
    }
    if (passType === 'free' && prevFreePasses <= 0) {
      joinInFlightRef.current = false;
      setIsJoiningDraft(false);
      alert('No free draft passes available.');
      return;
    }

    // Deduct the selected pass type (optimistic)
    if (passType === 'paid') {
      updateUser({ draftPasses: Math.max(0, prevPaidPasses - 1) });
    } else {
      updateUser({ freeDrafts: Math.max(0, prevFreePasses - 1) });
    }
    deducted = true;

    try {
      // Call real backend to join a draft
      const { joinDraft } = await import('@/lib/api/leagues');
      const forcedDraftType = peekPromoDraftType();
      const draftRoom = (await withTimeout(
        joinDraft(user.walletAddress, speed, 1, forcedDraftType ?? undefined),
        20000,
        'Draft join request'
      )) as Awaited<ReturnType<typeof joinDraft>>;
      if (!draftRoom?.id) {
        throw new Error('Draft join failed: missing draft ID');
      }

      const draftId = draftRoom.id;
      const contestName = draftRoom.contestName || `BBB #${draftId}`;

      // Save to store for tracking (reactive — drafting page updates automatically)
      draftStore.addDraft({
        id: draftId,
        contestName,
        status: 'filling',
        type: null, // unrevealed until slot machine
        draftSpeed: speed,
        players: draftRoom.players || 1,
        maxPlayers: draftRoom.maxPlayers || 10,
        joinedAt: Date.now(),
        phase: 'filling',
        fillingStartedAt: Date.now(),
        fillingInitialPlayers: draftRoom.players || 1,
      });

      if (forcedDraftType) {
        consumePromoDraftType(forcedDraftType);
      }

      // In staging mode, fill the league with 9 bots so draft can start
      if (_isStagingMode()) {
        try {
          const { stagingFillBots } = await import('@/lib/api/leagues');
          await stagingFillBots(speed, 9);
          console.log('[Home] Staging bots filled');
        } catch (fillErr) {
          console.warn('[Home] Bot fill failed (continuing anyway):', fillErr);
        }
        // Wait for backend to create draft state after 10th player joins
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

      // Go to draft lobby (fills up → slot machine reveal → draft room)
      router.push(buildDraftRoomUrl(draftId, contestName, speed));
    } catch (err) {
      // Fallback: if API unavailable, start a local draft with bots
      if (!_isStagingMode()) {
        const localDraftId = `local-${Date.now()}`;
        const localContestName = `BBB #${Math.floor(Math.random() * 9000) + 1000}`;
        draftStore.addDraft({
          id: localDraftId,
          contestName: localContestName,
          status: 'filling',
          type: null,
          draftSpeed: speed,
          players: 1,
          maxPlayers: 10,
          joinedAt: Date.now(),
          phase: 'filling',
          fillingStartedAt: Date.now(),
          fillingInitialPlayers: 1,
        });
        router.push(buildDraftRoomUrl(localDraftId, localContestName, speed));
        return;
      }

      const apiStatus = typeof err === 'object' && err != null && 'status' in err ? Number((err as { status?: unknown }).status) : null;
      const apiMessage = err instanceof Error ? err.message : '';
      const apiBody = typeof err === 'object' && err != null && 'body' in err ? String((err as { body?: unknown }).body ?? '') : '';
      const looksLikeEntryStateMismatch = /already|joined|join|locked|entry|exists|owner/i.test(`${apiMessage} ${apiBody}`);
      const isStaging = _isStagingMode();
      const looksLikeJoinTransitionFailure = /timeout|fetch|failed to fetch|network|aborted|join/i.test(`${apiMessage} ${apiBody}`);

      // Mobile/Safari staging edge: backend may emit hard 500 for already-joined/locked join attempts.
      // Recover by routing user into the existing draft instead of surfacing raw 500.
      if (user?.walletAddress && (
        (apiStatus === 500 && looksLikeEntryStateMismatch)
        || (isStaging && looksLikeJoinTransitionFailure)
      )) {
        const recoveredDraftId = await recoverStagingJoinFromServerError(user.walletAddress, speed);
        if (recoveredDraftId) {
          router.push(buildDraftRoomUrl(recoveredDraftId, `BBB #${recoveredDraftId}`, speed));
          return;
        }
      }

      // Revert optimistic update on failure
      if (deducted && passType === 'paid') {
        updateUser({ draftPasses: prevPaidPasses });
      } else if (deducted) {
        updateUser({ freeDrafts: prevFreePasses });
      }
      alert(err instanceof Error ? err.message : 'Failed to join draft. Please try again.');
    } finally {
      joinInFlightRef.current = false;
      setIsJoiningDraft(false);
    }
  };

  const handlePurchaseComplete = () => {
    // Don't close BuyPassesModal — let it handle pick-speed → join → redirect internally
  };

  const handleDetails = () => {
    modals.push('contest-details');
  };

  return (
    <div className="w-full px-4 sm:px-8 lg:px-12 pt-16 flex flex-col min-h-[calc(100vh-64px)]">
      {/* Featured Contest */}
      <section className="mb-6">
        {contestsQuery.isValidating && !selectedContest ? (
          <SkeletonContestCard />
        ) : selectedContest ? (
          <ContestCard
            contest={selectedContest}
            draftCount={isLoggedIn ? (user?.draftPasses || 0) + (user?.freeDrafts || 0) : 0}
            onEnter={handleEnter}
            onDetails={handleDetails}
          />
        ) : (
          <SkeletonContestCard />
        )}
      </section>

      {/* Promo Carousel */}
      <section className="mb-4">
        <PromoCarousel promos={promosQuery.promos || []} />
      </section>

      <AddToHomeScreenCard />

      {/* Contest Details Modal */}
      {selectedContest && (
        <ContestDetailsModal
          isOpen={modals.isOpen('contest-details')}
          onClose={() => modals.pop()}
          contest={selectedContest}
          onEnter={() => {
            modals.pop();
            handleEnter();
          }}
        />
      )}

      {/* Entry Flow Modal (Pass Type + Speed in one) */}
      <EntryFlowModal
        isOpen={modals.isOpen('entry-flow')}
        onClose={() => modals.closeAll()}
        onComplete={handleEntryComplete}
        paidPasses={user?.draftPasses || 0}
        freePasses={user?.freeDrafts || 0}
        isSubmitting={isJoiningDraft}
      />

      {/* Buy Passes Modal (shown when user has no passes) */}
      <BuyPassesModal
        isOpen={modals.isOpen('buy-passes')}
        onClose={() => modals.closeAll()}
        onPurchaseComplete={handlePurchaseComplete}
      />

    </div>
  );
}
