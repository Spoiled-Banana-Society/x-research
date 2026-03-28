'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { usePromos } from '@/hooks/usePromos';
import { getDraftTypeColor, isDraftingOpen } from '@/lib/draftTypes';
import { Tooltip } from '@/components/ui/Tooltip';
import { PromoModal } from '@/components/modals/PromoModal';
import { EntryFlowModal } from '@/components/modals/EntryFlowModal';
import { VerifiedBadge } from '@/components/ui/VerifiedBadge';
import { Promo } from '@/types';
import { isStagingMode, getDraftServerUrl } from '@/lib/staging';
import { useActiveDrafts } from '@/hooks/useActiveDrafts';
import * as draftStore from '@/lib/draftStore';
import type { DraftState } from '@/lib/draftStore';
import type { ApiDraftToken } from '@/lib/api/owner';
import { DRAFT_PLAYERS } from '@/lib/draftRoomConstants';
import * as draftApi from '@/lib/draftApi';
import { leaveDraft } from '@/lib/api/leagues';
import { useContests } from '@/hooks/useContests';
import { ContestDetailsModal } from '@/components/modals/ContestDetailsModal';

import { fetchJson } from '@/lib/appApiClient';
import type { DraftQueue } from '@/types';

type Draft = DraftState;

function SpecialDraftRow({ item, walletAddress, userId }: {
  item: { type: string; round: any; color: string; label: string };
  walletAddress?: string | null;
  userId?: string;
}) {
  const [creating, setCreating] = useState(false);
  const [draftState, setDraftState] = useState<{ turnsAway: number; isYourTurn: boolean; pickEndTime: number; playerCount: number } | null>(null);
  const r = item.round;
  const canEnter = !!r.draftId;
  const accentColor = item.color;
  const isFilling = r.status === 'filling';
  const isLive = r.status === 'ready' || r.status === 'drafting';

  // Poll Go API for draft progress when live
  useEffect(() => {
    if (!isLive || !r.draftId || !walletAddress) return;
    let cancelled = false;
    const poll = async () => {
      try {
        const info = await draftApi.getDraftInfo(r.draftId);
        if (cancelled) return;
        const wallet = walletAddress.toLowerCase();
        const currentDrafter = (info.currentDrafter || '').toLowerCase();
        const isYourTurn = wallet === currentDrafter;
        const playerCount = info.draftOrder?.length || 10;
        const userIndex = info.draftOrder.findIndex((e: { ownerId: string }) => e.ownerId.toLowerCase() === wallet);
        let turnsAway = 0;
        if (!isYourTurn && userIndex >= 0) {
          const totalPicks = (info.draftOrder.length || 10) * 15;
          for (let i = 1; i <= totalPicks - info.pickNumber + 1; i++) {
            const round = Math.ceil((info.pickNumber + i) / 10);
            const posInRound = ((info.pickNumber + i - 1) % 10);
            const drafterIdx = round % 2 === 1 ? posInRound : 9 - posInRound;
            if (drafterIdx === userIndex) { turnsAway = i; break; }
          }
        }
        setDraftState({ turnsAway, isYourTurn, pickEndTime: info.currentPickEndTime || 0, playerCount });
      } catch { /* draft state not ready yet */ }
    };
    poll();
    const interval = setInterval(poll, 10000);
    return () => { cancelled = true; clearInterval(interval); };
  }, [isLive, r.draftId, walletAddress]);

  async function handleEnter(e?: React.MouseEvent) {
    if (e) e.stopPropagation();

    if (canEnter) {
      window.location.href = `/draft-room?draftId=${r.draftId}&id=${r.draftId}&speed=slow&mode=live&wallet=${walletAddress || ''}&special=true&specialType=${item.type}`;
      return;
    }

    // No draftId yet — create the draft via API, then navigate
    setCreating(true);
    try {
      const res = await fetchJson<{ draftId: string }>('/api/queues/create-draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userId || walletAddress || '',
          queueType: item.type,
          roundId: r.roundId,
        }),
      });

      if (res.draftId) {
        window.location.href = `/draft-room?draftId=${res.draftId}&id=${res.draftId}&speed=slow&mode=live&wallet=${walletAddress || ''}&special=true&specialType=${item.type}`;
      } else {
        // Fallback: navigate to draft room without draftId
        window.location.href = `/draft-room?speed=slow&mode=live&wallet=${walletAddress || ''}&special=true&specialType=${item.type}&queueRoundId=${r.roundId}&queueType=${item.type}`;
      }
    } catch {
      // Fallback: navigate to draft room without draftId
      window.location.href = `/draft-room?speed=slow&mode=live&wallet=${walletAddress || ''}&special=true&specialType=${item.type}&queueRoundId=${r.roundId}&queueType=${item.type}`;
    }
  }

  return (
    <div
      key={`${item.type}-${r.roundId}`}
      className={`group cursor-pointer transition-all overflow-hidden rounded-lg hover:bg-white/[0.03] border-2 ${
        isLive ? 'border-banana bg-banana/10' : 'border-transparent'
      }`}
      onClick={() => handleEnter()}
    >
      {/* Same row layout as regular drafts */}
      <div className="flex items-center justify-between px-5 py-3">
        {/* Name */}
        <div className="w-20 flex-shrink-0">
          <span className="text-white/80 font-medium">{item.label} #{r.roundId}</span>
        </div>

        {/* Speed — hidden on small screens */}
        <div className="w-16 flex-shrink-0 text-center hidden sm:block">
          <span className="text-white/50 text-sm">8 hour</span>
        </div>

        {/* Type — hidden on small screens */}
        <div className="w-28 flex-shrink-0 hidden sm:flex items-center justify-center gap-1.5">
          <span className="text-sm font-semibold" style={{ color: accentColor }}>
            {item.type === 'jackpot' ? 'JACKPOT' : 'HALL OF FAME'}
          </span>
        </div>

        {/* Status — progress bar + count (matches regular filling drafts) */}
        <div className="w-28 flex-shrink-0 flex items-center justify-center">
          {isFilling ? (
            <div className="flex flex-col items-center gap-1">
              <div className="w-20 h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${(r.members.length / 10) * 100}%`,
                    backgroundColor: accentColor
                  }}
                />
              </div>
              <span className="text-xs tabular-nums">
                <span className="text-white font-semibold">{r.members.length}</span>
                <span className="text-white/40">/10</span>
              </span>
            </div>
          ) : isLive && draftState?.isYourTurn ? (
            <span className="text-banana font-bold text-sm animate-pulse">Your turn!</span>
          ) : isLive && draftState && draftState.turnsAway > 0 ? (
            <span className="text-white/50 text-sm">
              {draftState.turnsAway} pick{draftState.turnsAway !== 1 ? 's' : ''} away
            </span>
          ) : isLive && draftState ? (
            <span className="text-white/50 text-sm">In progress</span>
          ) : isLive ? (
            <span className="text-banana font-bold text-sm animate-pulse">
              {r.status === 'ready' ? 'Starting!' : 'Live!'}
            </span>
          ) : (
            <span className="text-white/50 text-sm">In progress</span>
          )}
          {/* Show Go API player count when live */}
          {isLive && draftState?.playerCount && (
            <span className="text-white/40 text-xs ml-1.5 tabular-nums">
              {draftState.playerCount}/10
            </span>
          )}
        </div>

        {/* Button */}
        <div className="w-28 flex-shrink-0 flex items-center justify-end gap-2">
          {creating ? (
            <span className="w-20 py-2 rounded-lg font-semibold text-[11px] text-center bg-white/10 text-white/40 flex items-center justify-center gap-1">
              <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
              Entering
            </span>
          ) : (
            <button
              onClick={(e) => handleEnter(e)}
              className={`w-20 py-2 rounded-lg font-semibold text-sm transition-all hover:scale-105 flex items-center justify-center ${
                draftState?.isYourTurn
                  ? 'bg-banana text-black hover:bg-banana/90 animate-pulse'
                  : 'bg-white text-black hover:bg-white/90'
              }`}
            >
              {draftState?.isYourTurn ? 'Pick Now' : 'Enter'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function SpecialDraftsSection({ userId, walletAddress }: { userId?: string; walletAddress?: string | null }) {
  const [queues, setQueues] = useState<Record<string, DraftQueue> | null>(null);
  useEffect(() => {
    if (!userId) return;
    fetchJson<Record<string, DraftQueue>>('/api/queues')
      .then(setQueues).catch(() => {});
    const interval = setInterval(() => {
      fetchJson<Record<string, DraftQueue>>('/api/queues')
        .then(setQueues).catch(() => {});
    }, 5000);
    return () => clearInterval(interval);
  }, [userId]);

  if (!queues || !userId) return null;

  const myRounds: Array<{ type: string; round: any; color: string; label: string }> = [];
  for (const [, q] of Object.entries(queues)) {
    const isJP = q.type === 'jackpot';
    for (const r of q.rounds || []) {
      if (r.status === 'completed') continue;
      if (!r.members.some((m: any) => m.wallet?.toLowerCase() === userId?.toLowerCase() || m.wallet?.toLowerCase() === walletAddress?.toLowerCase())) continue;
      myRounds.push({
        type: q.type,
        round: r,
        color: isJP ? '#ef4444' : '#D4AF37',
        label: isJP ? 'Jackpot' : 'HOF',
      });
    }
  }

  if (myRounds.length === 0) return null;

  return (
    <div className="space-y-1.5 mb-3">
      {myRounds.map((item) => (
        <SpecialDraftRow
          key={`${item.type}-${item.round.roundId}`}
          item={item}
          walletAddress={walletAddress}
          userId={userId}
        />
      ))}
    </div>
  );
}

/** Snake draft: get drafter index for a given pick number (10 players) */
function getSnakeDrafterIndex(pickNumber: number): number {
  const round = Math.ceil(pickNumber / 10);
  const posInRound = ((pickNumber - 1) % 10);
  return round % 2 === 1 ? posInRound : 9 - posInRound;
}

/** Compute turnsUntilUserPick + isUserTurn from server draft info */
function computeTurnsFromServer(
  info: draftApi.DraftInfoResponse,
  walletAddress: string,
): { turnsUntilUserPick: number; isUserTurn: boolean; pickEndTimestamp: number | undefined } {
  const wallet = walletAddress.toLowerCase();
  const currentDrafter = (info.currentDrafter || '').toLowerCase();
  const isUserTurn = wallet !== '' && wallet === currentDrafter;

  const userIndex = info.draftOrder.findIndex(
    entry => entry.ownerId.toLowerCase() === wallet,
  );

  let turnsUntilUserPick = 0;
  if (!isUserTurn && userIndex >= 0) {
    const totalPicks = (info.draftOrder.length || 10) * 15;
    for (let i = 1; i <= totalPicks - info.pickNumber + 1; i++) {
      if (getSnakeDrafterIndex(info.pickNumber + i) === userIndex) {
        turnsUntilUserPick = i;
        break;
      }
    }
  }

  const pickEndTimestamp = info.currentPickEndTime || undefined;

  return { turnsUntilUserPick, isUserTurn, pickEndTimestamp };
}

// Format relative time (e.g., "5 min ago", "2 hrs ago")
function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return 'just now';
  if (minutes < 60) return `${minutes} min ago`;
  if (hours < 24) return `${hours} hr${hours > 1 ? 's' : ''} ago`;
  return `${days} day${days > 1 ? 's' : ''} ago`;
}

// Window-level timer for randomizing bar — survives React re-renders AND module reloads.
// Once a draft starts randomizing, the timer sticks until the bar finishes.
function getBarTimers(): Map<string, number> {
  if (typeof window === 'undefined') return new Map();
  if (!(window as any).__draftBarTimers) {
    (window as any).__draftBarTimers = new Map<string, number>();
  }
  return (window as any).__draftBarTimers;
}

export default function DraftingPage() {
  const router = useRouter();
  const { isLoggedIn, user, setShowLoginModal, updateUser } = useAuth();
  const contestsQuery = useContests();
  const contest = contestsQuery.data?.[0] ?? null;
  const [showContestDetails, setShowContestDetails] = useState(false);
  const [infoTopic, setInfoTopic] = useState<string | null>(null);
  const promosQuery = usePromos({ userId: user?.id });
  const promos = promosQuery.promos ?? [];
  const promoCount = promos.length;
  const localDrafts = useActiveDrafts();
  const [liveDrafts, setLiveDrafts] = useState<Draft[]>([]);
  // Don't block rendering on API — show local drafts immediately
  const [isLoading, setIsLoading] = useState(false);
  const [liveLoading, setLiveLoading] = useState(true);
  const isLive = isStagingMode() && !!user?.walletAddress;
  const [_timers, setTimers] = useState<Record<string, number>>({});
  const [exitingDraft, setExitingDraft] = useState<Draft | null>(null);
  const [showNoPasses, setShowNoPasses] = useState(false);
  const [selectedPromo, setSelectedPromo] = useState<Promo | null>(null);
  const [claimedPromos, setClaimedPromos] = useState<Set<string>>(new Set());
  const [claimSuccess, setClaimSuccess] = useState<{ show: boolean; count: number }>({ show: false, count: 0 });
  const [promoIndex, setPromoIndex] = useState(0);
  const [promoAutoRotate, setPromoAutoRotate] = useState(true);
  const [showEntryFlow, setShowEntryFlow] = useState(false);
  const [hiddenDraftIds, setHiddenDraftIds] = useState<Set<string>>(() => {
    if (typeof window === 'undefined') return new Set();
    try {
      const stored = localStorage.getItem('banana-hidden-drafts');
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch { return new Set(); }
  });


  const handleClaim = async (promo: Promo, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (claimedPromos.has(promo.id)) return;

    setClaimedPromos(prev => new Set([...Array.from(prev), promo.id]));
    const fallbackCount = promo.claimCount || 1;
    const claimResult = await promosQuery.claimPromo(promo.id);
    if (!claimResult && user) {
      updateUser({ wheelSpins: (user.wheelSpins || 0) + fallbackCount });
    }
    setClaimSuccess({ show: true, count: claimResult?.spinsAdded ?? fallbackCount });
    setTimeout(() => setClaimSuccess({ show: false, count: 0 }), 2000);
  };

  // Build draft room URL with live mode params when applicable
  const buildDraftRoomUrl = (draft: Draft) => {
    const params = new URLSearchParams({
      id: draft.id,
      name: draft.contestName,
      speed: draft.draftSpeed,
      players: String(draft.players),
    });
    if (isLive && user?.walletAddress) {
      params.set('mode', 'live');
      params.set('wallet', user.walletAddress);
    }
    if (draft.passType) params.set('passType', draft.passType);
    return `/draft-room?${params.toString()}`;
  };

  const handleEnterDraft = () => {
    if (!isDraftingOpen()) {
      alert('Drafting is closed for the season.');
      return;
    }

    if (!isLoggedIn) {
      setShowLoginModal(true);
      return;
    }

    const paidPasses = user?.draftPasses || 0;
    const freePasses = user?.freeDrafts || 0;
    const totalPasses = paidPasses + freePasses;

    if (totalPasses <= 0) {
      setShowNoPasses(true);
      return;
    }

    setShowEntryFlow(true);
  };

  const handleEntryComplete = (passType: 'paid' | 'free', speed: 'fast' | 'slow') => {
    setShowEntryFlow(false);
    enterDraftWithPassType(passType, speed);
  };

  const enterDraftWithPassType = (passType: 'paid' | 'free', speed: 'fast' | 'slow' = 'fast') => {
    if (!user?.walletAddress) return;

    // Deduct the selected pass type locally (optimistic)
    if (passType === 'paid') {
      updateUser({ draftPasses: Math.max(0, (user?.draftPasses || 0) - 1) });
    } else {
      updateUser({ freeDrafts: Math.max(0, (user?.freeDrafts || 0) - 1) });
    }

    // Navigate IMMEDIATELY to draft room — it will handle joinDraft + fill-bots
    const params = new URLSearchParams({
      speed,
      mode: 'live',
      wallet: user.walletAddress,
      passType,
    });
    router.push(`/draft-room?${params.toString()}`);
  };

  // In live/staging mode, load real draft tokens from API (non-blocking — local drafts show immediately)
  useEffect(() => {
    if (!isLive) {
      setLiveLoading(false);
      return;
    }
    let cancelled = false;
    async function loadLiveDrafts() {
      try {
        const { getOwnerDraftTokens } = await import('@/lib/api/owner');
        const raw = await getOwnerDraftTokens(user!.walletAddress!);
        if (cancelled) return;
        const tokens: ApiDraftToken[] = Array.isArray(raw) ? raw : [];
        // Only show tokens that are actively in a league (have a leagueId).
        // Available/unused tokens have empty leagueId and should not appear as drafts.
        const activeTokens = tokens.filter((t) => {
          if (!t.leagueId || hiddenDraftIds.has(t.leagueId) || hiddenDraftIds.has(t.cardId)) return false;
          // Completed drafts have a full 15-player roster — don't show as active
          if (t.roster) {
            const rosterCount = (t.roster.QB?.length || 0) + (t.roster.RB?.length || 0)
              + (t.roster.WR?.length || 0) + (t.roster.TE?.length || 0) + (t.roster.DST?.length || 0);
            if (rosterCount >= 15) return false;
          }
          return true;
        });
        const mapped: Draft[] = activeTokens.map((t) => ({
          id: t.leagueId || t.cardId,
          contestName: t.leagueDisplayName || `League #${t.leagueId || t.cardId}`,
          status: 'drafting' as const,
          type: t.level === 'Jackpot' ? 'jackpot' as const : t.level === 'Hall of Fame' ? 'hof' as const : 'pro' as const,
          draftSpeed: 'fast' as const,
          players: 10,
          maxPlayers: 10,
          lastUpdated: Date.now(),
        }));
        // Ensure API drafts are in draftStore with liveWalletAddress so
        // the 3s poll can sync picks-away and timer data from the server
        for (const d of mapped) {
          if (!draftStore.getDraft(d.id) && !hiddenDraftIds.has(d.id)) {
            draftStore.addDraft({ ...d, liveWalletAddress: user!.walletAddress!, phase: 'drafting' });
          }
        }
        setLiveDrafts(mapped);
      } catch (err) {
        console.error('[Drafting] Failed to load live drafts:', err);
      } finally {
        if (!cancelled) setLiveLoading(false);
      }
    }
    loadLiveDrafts();
    return () => { cancelled = true; };
  }, [isLive, user, hiddenDraftIds]);

  // REST polling: refresh live draft state on mount, focus, and every 10s
  useEffect(() => {
    if (!isLive || !user?.walletAddress) return;
    let cancelled = false;
    let intervalId: ReturnType<typeof setInterval> | null = null;

    const syncLiveDrafts = async () => {
      const allDrafts = draftStore.getActiveDrafts();
      const liveDraftsToSync = allDrafts.filter(
        d => d.liveWalletAddress && (d.status === 'filling' || d.status === 'drafting' || d.phase === 'drafting'),
      );

      for (const draft of liveDraftsToSync) {
        if (cancelled) return;

        // Skip drafts actively managed by the draft-room tab.
        // Both pages writing to draftStore simultaneously causes state conflicts and freezes.
        const heartbeat = localStorage.getItem(`draft-room-ws:${draft.id}`);
        if (heartbeat && Date.now() - Number(heartbeat) < 10_000) {
          continue;
        }

        try {
          const info = await draftApi.getDraftInfo(draft.id);
          if (cancelled) return;

          // Re-read fresh state — tick effect may have updated type/phase during async API call
          const fresh = draftStore.getDraft(draft.id) || draft;

          const playerCount = info.draftOrder?.length || 0;
          const hasDraftStarted = playerCount >= 10 && info.pickNumber >= 1;
          const isFull = playerCount >= 10;

          // Track promos — only paid drafts count (free drafts don't earn promo progress)
          const isPaid = draft.passType !== 'free';
          if (isFull && user?.id && isPaid) {
            const trackedKey = `promo-tracked:${draft.id}`;
            if (!localStorage.getItem(trackedKey)) {
              localStorage.setItem(trackedKey, '1');
              fetch('/api/promos/draft-complete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user.id, draftId: draft.id }),
              }).catch(() => {});
            }

            // Track Pick 10 promo — check if user has position #10 (index 9)
            if (info.draftOrder && draft.liveWalletAddress) {
              const userIdx = info.draftOrder.findIndex(
                (e: { ownerId: string }) => e.ownerId.toLowerCase() === draft.liveWalletAddress!.toLowerCase()
              );
              if (userIdx === 9) {
                const pick10Key = `promo-pick10:${draft.id}`;
                if (!localStorage.getItem(pick10Key)) {
                  localStorage.setItem(pick10Key, '1');
                  fetch('/api/promos/pick10', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId: user.id, draftId: draft.id, draftName: draft.contestName }),
                  }).catch(() => {});
                }
              }
            }
          }

          if (hasDraftStarted) {
            // Draft is actively in progress — compute picks away
            const { turnsUntilUserPick, isUserTurn, pickEndTimestamp } =
              computeTurnsFromServer(info, draft.liveWalletAddress!);

            const totalPicks = (info.draftOrder?.length || 10) * 15;
            const isCompleted = info.pickNumber >= totalPicks;

            if (isCompleted) {
              draftStore.removeDraft(draft.id);
            } else {
              const nowMs = Date.now();

              // REST API never returns currentPickEndTime — preserve the value
              // set by WebSocket timer_update events so the countdown doesn't reset
              const effectivePickEnd = pickEndTimestamp || fresh.pickEndTimestamp;

              // Check if the animation timeline is still playing.
              // Full timeline from randomizingStartedAt: 15s bar + 60s countdown = 75s.
              // From preSpinStartedAt: 60s countdown.
              // While animation plays, save pick data but DON'T change display state.
              const animStillRunning = (() => {
                if (fresh.randomizingStartedAt && !fresh.preSpinStartedAt) {
                  return (nowMs - fresh.randomizingStartedAt) < 63000; // 3s bar + 60s countdown
                }
                if (fresh.preSpinStartedAt) {
                  return ((nowMs - fresh.preSpinStartedAt) / 1000) < 60;
                }
                return false;
              })();

              if (animStillRunning) {
                // Animation is playing — save server pick data only
                draftStore.updateDraft(draft.id, {
                  currentPick: turnsUntilUserPick,
                  isYourTurn: isUserTurn,
                  pickEndTimestamp: effectivePickEnd,
                  timeRemaining: isUserTurn && effectivePickEnd
                    ? Math.max(0, Math.ceil(effectivePickEnd - nowMs / 1000))
                    : undefined,
                });
              } else if (!fresh.randomizingStartedAt && !fresh.preSpinStartedAt) {
                // No animation ever started — start it now so user sees the full sequence
                draftStore.updateDraft(draft.id, {
                  players: 10,
                  randomizingStartedAt: nowMs,
                  currentPick: turnsUntilUserPick,
                  isYourTurn: isUserTurn,
                  pickEndTimestamp: effectivePickEnd,
                  timeRemaining: isUserTurn && effectivePickEnd
                    ? Math.max(0, Math.ceil(effectivePickEnd - nowMs / 1000))
                    : undefined,
                });
              } else {
                // Animation is done — safe to transition to drafting
                draftStore.updateDraft(draft.id, {
                  status: 'drafting',
                  phase: 'drafting',
                  players: 10,
                  type: fresh.type || fresh.draftType || null,
                  draftType: fresh.draftType || fresh.type || null,
                  randomizingStartedAt: undefined,
                  currentPick: turnsUntilUserPick,
                  isYourTurn: isUserTurn,
                  pickEndTimestamp: effectivePickEnd,
                  timeRemaining: isUserTurn && effectivePickEnd
                    ? Math.max(0, Math.ceil(effectivePickEnd - nowMs / 1000))
                    : undefined,
                });
              }
            }
          } else if (isFull) {
            // 10/10 but draft hasn't started yet
            const patch: Partial<DraftState> = { players: 10 };

            if (info.draftStartTime) {
              const serverPreSpin = info.draftStartTime * 1000 - 60000;
              if (!fresh.preSpinStartedAt) {
                if (fresh.randomizingStartedAt) {
                  // Bar is running — only skip to countdown if 15s elapsed
                  const barStillRunning = (Date.now() - fresh.randomizingStartedAt) < 3000;
                  if (!barStillRunning) {
                    patch.preSpinStartedAt = serverPreSpin;
                    patch.randomizingStartedAt = undefined;
                    patch.phase = 'pre-spin';
                  }
                } else {
                  // Bar hasn't started yet — start it now instead of skipping to countdown
                  patch.randomizingStartedAt = Date.now();
                }
              } else if (Math.abs(fresh.preSpinStartedAt - serverPreSpin) > 2000) {
                // Tick effect set a local timestamp — correct it to match server
                patch.preSpinStartedAt = serverPreSpin;
              }
            }

            draftStore.updateDraft(draft.id, patch);
          } else if (playerCount > 0 && draft.status === 'filling') {
            // Still filling — update player count
            draftStore.updateDraft(draft.id, {
              players: playerCount,
            });
          }
        } catch (err) {
          // getDraftInfo may 404/500 for very new drafts — that's fine
          console.warn(`[Drafting] Failed to sync draft ${draft.id}:`, err);
        }
      }
    };

    // Sync immediately on mount
    syncLiveDrafts();

    // Sync on window focus (debounced)
    let focusTimeout: ReturnType<typeof setTimeout> | null = null;
    const onFocus = () => {
      if (focusTimeout) clearTimeout(focusTimeout);
      focusTimeout = setTimeout(syncLiveDrafts, 500);
    };
    window.addEventListener('focus', onFocus);

    // Poll every 3 seconds for live draft updates (picks away, timers)
    intervalId = setInterval(syncLiveDrafts, 3_000);

    return () => {
      cancelled = true;
      window.removeEventListener('focus', onFocus);
      if (focusTimeout) clearTimeout(focusTimeout);
      if (intervalId) clearInterval(intervalId);
    };
  }, [isLive, user?.walletAddress]);

  // WebSocket keepalive: maintain a WS connection to each draft in 'drafting' phase
  // so the Go server keeps processing bot picks and timer expiry.
  // Without this, the server freezes picks when no one is connected via WebSocket.
  const wsConnectionsRef = useRef<Map<string, WebSocket>>(new Map());

  useEffect(() => {
    if (!isLive || !user?.walletAddress) return;

    const wallet = user.walletAddress.trim().toLowerCase();
    const serverUrl = getDraftServerUrl() || 'wss://sbs-drafts-server-staging-652484219017.us-central1.run.app';

    // Check every 3s which drafts need WebSocket connections
    const syncConnections = () => {
      const allDrafts = draftStore.getActiveDrafts();
      const draftingDrafts = allDrafts.filter(
        d => d.liveWalletAddress && d.phase === 'drafting' && d.status === 'drafting',
      );

      const activeIds = new Set(draftingDrafts.map(d => d.id));
      const conns = wsConnectionsRef.current;

      // Close connections for drafts no longer in drafting phase or
      // where the draft-room tab now has its own active WS connection
      conns.forEach((ws, id) => {
        const heartbeat = localStorage.getItem(`draft-room-ws:${id}`);
        const draftRoomActive = heartbeat && Date.now() - Number(heartbeat) < 10_000;
        if (!activeIds.has(id) || draftRoomActive) {
          ws.close();
          conns.delete(id);
        }
      });

      // Open connections for drafts that need them
      for (const draft of draftingDrafts) {
        if (conns.has(draft.id)) continue; // already connected

        // Skip if the draft-room tab already has an active WS for this draft.
        // Dual connections confuse the Go server and cause freezes/glitches.
        const heartbeat = localStorage.getItem(`draft-room-ws:${draft.id}`);
        if (heartbeat && Date.now() - Number(heartbeat) < 10_000) {
          continue; // draft-room has it covered
        }

        const url = `${serverUrl}/ws?address=${encodeURIComponent(wallet)}&draftName=${encodeURIComponent(draft.id)}`;
        const ws = new WebSocket(url);
        conns.set(draft.id, ws);

        // Keepalive ping every 30s
        let pingInterval: ReturnType<typeof setInterval> | null = null;

        ws.onopen = () => {
          console.log(`[Drafting WS] connected to ${draft.id}`);
          pingInterval = setInterval(() => {
            if (ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({ type: 'ping', payload: {} }));
            }
          }, 30_000);
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            const { type, payload } = data;
            const draftId = draft.id;

            if (type === 'timer_update' && payload) {
              // Backend bug: slow draft pickLength is 480s (8 min) instead of 28800s (8 hr).
              // Adjust endOfTurnTimestamp for slow drafts so the countdown shows 8 hours.
              let endTs = payload.endOfTurnTimestamp;
              if (draft.draftSpeed === 'slow' && payload.startOfTurnTimestamp && endTs) {
                const serverPickLen = endTs - payload.startOfTurnTimestamp;
                if (serverPickLen < 3600) {
                  endTs = payload.startOfTurnTimestamp + 28800;
                }
              }
              const currentDrafter = (payload.currentDrafter || '').toLowerCase();
              const isUserTurn = wallet === currentDrafter;
              draftStore.updateDraft(draftId, {
                pickEndTimestamp: endTs,
                isYourTurn: isUserTurn,
                timeRemaining: endTs ? Math.max(0, Math.ceil(endTs - Date.now() / 1000)) : undefined,
              });
            }

            if (type === 'draft_info_update' && payload) {
              // Compute picks away from server data
              const info = payload;
              const currentDrafter = (info.currentDrafter || '').toLowerCase();
              const isUserTurn = wallet === currentDrafter;
              const userIndex = (info.draftOrder || []).findIndex(
                (entry: { ownerId: string }) => entry.ownerId.toLowerCase() === wallet,
              );

              let turnsUntilUserPick = 0;
              if (!isUserTurn && userIndex >= 0) {
                const totalPicks = (info.draftOrder?.length || 10) * 15;
                for (let i = 1; i <= totalPicks - info.pickNumber + 1; i++) {
                  if (getSnakeDrafterIndex(info.pickNumber + i) === userIndex) {
                    turnsUntilUserPick = i;
                    break;
                  }
                }
              }

              draftStore.updateDraft(draftId, {
                currentPick: turnsUntilUserPick,
                isYourTurn: isUserTurn,
                enginePickNumber: info.pickNumber,
              });
            }

            if (type === 'draft_complete') {
              draftStore.removeDraft(draftId);
              ws.close();
              conns.delete(draftId);
            }
          } catch {
            // Ignore non-JSON messages
          }
        };

        ws.onclose = () => {
          if (pingInterval) clearInterval(pingInterval);
          conns.delete(draft.id);
        };

        ws.onerror = () => {
          // onclose will fire after error
        };
      }
    };

    syncConnections();
    const interval = setInterval(syncConnections, 3_000);

    return () => {
      clearInterval(interval);
      const conns = wsConnectionsRef.current;
      conns.forEach((ws) => ws.close());
      conns.clear();
    };
  }, [isLive, user?.walletAddress]);

  // Merge local + live drafts: localStorage drafts are the source of truth for
  // filling/pre-spin phases (they have timestamps). API drafts supplement with
  // server-confirmed data. Local drafts take priority (fresher state).
  // Memoized to prevent infinite re-render loops from useEffect dependencies.
  const activeDrafts: Draft[] = useMemo(() => {
    if (!isLive) return localDrafts;
    const localIds = new Set(localDrafts.map(d => d.id));
    const apiOnly = liveDrafts.filter(d => !localIds.has(d.id));
    const all = [...localDrafts, ...apiOnly];
    return all.filter(d => !hiddenDraftIds.has(d.id) && d.status !== 'completed');
  }, [isLive, localDrafts, liveDrafts, hiddenDraftIds]);

  // Filter out special drafts (Jackpot/HOF from wheel) — SpecialDraftsSection already shows them
  const nonSpecialDrafts = activeDrafts.filter(d => !d.isSpecial);

  // Sort drafts: Your turn > In progress (by picks away) > Filling (oldest first, newest at bottom)
  const sortedDrafts = [...nonSpecialDrafts].sort((a, b) => {
    // Your turn drafts first
    if (a.isYourTurn && !b.isYourTurn) return -1;
    if (!a.isYourTurn && b.isYourTurn) return 1;

    // Then drafting (in progress), sorted by picks away (lower = closer to your turn)
    const aIsDrafting = a.status === 'drafting';
    const bIsDrafting = b.status === 'drafting';
    if (aIsDrafting && !bIsDrafting) return -1;
    if (!aIsDrafting && bIsDrafting) return 1;

    if (aIsDrafting && bIsDrafting) {
      return (a.currentPick || 99) - (b.currentPick || 99);
    }

    // Then filling drafts, sorted by join time (oldest first, newest at bottom)
    return (a.joinedAt || 0) - (b.joinedAt || 0);
  });

  // Initialize timers
  useEffect(() => {
    const initial: Record<string, number> = {};
    activeDrafts.forEach(draft => {
      if (draft.timeRemaining) {
        initial[draft.id] = draft.timeRemaining;
      }
    });
    setTimers(initial);
  }, [activeDrafts]);

  // Countdown timers
  useEffect(() => {
    const interval = setInterval(() => {
      setTimers(prev => {
        const updated = { ...prev };
        Object.keys(updated).forEach(id => {
          if (updated[id] > 0) {
            updated[id] = updated[id] - 1;
          }
        });
        return updated;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Force re-render for smooth progress bar animation and live countdowns
  const [, setRenderTick] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => setRenderTick(t => t + 1), 100);
    return () => clearInterval(interval);
  }, []);

  // Tick effect: advance filling simulation + auto-transition phases
  // Writes to draftStore every tick so useActiveDrafts triggers re-renders
  useEffect(() => {
    const tick = () => {
      const now = Date.now();
      const allDrafts = draftStore.getActiveDrafts();

      for (const d of allDrafts) {
        // FILLING: derive count from timestamps, write to store
        // Check status OR phase (syncLiveDrafts may set phase='pre-spin' before timestamps are ready)
        if ((d.phase === 'filling' || d.status === 'filling') && !d.preSpinStartedAt && d.fillingStartedAt != null && d.fillingInitialPlayers != null) {
          const simulated = Math.min(10, d.fillingInitialPlayers + Math.floor((now - d.fillingStartedAt) / 800));
          // Use the higher of simulation vs current players (server may have updated players)
          const count = Math.max(simulated, d.players || 0);

          // Auto-advance: filling → randomizing → pre-spin when count reaches 10
          // (Check FIRST so we do a single atomic update with players:10 + randomizingStartedAt,
          //  avoiding a flash where "10/10 filling" shows before the randomizing bar)
          if (count >= 10 && !d.preSpinStartedAt) {
            // LIVE DRAFTS: start the randomizing bar, then force transition after 15s
            if (d.liveWalletAddress) {
              if (!d.randomizingStartedAt) {
                draftStore.updateDraft(d.id, { players: 10, randomizingStartedAt: now });
              } else {
                // Bar fills over 15s — once full, transition to pre-spin countdown
                const randomizingElapsed = now - d.randomizingStartedAt;
                if (randomizingElapsed >= 3000) {
                  draftStore.updateDraft(d.id, {
                    phase: 'pre-spin',
                    players: 10,
                    preSpinStartedAt: now,
                    randomizingStartedAt: undefined,
                  });
                }
              }
              continue;
            }

            // LOCAL DRAFTS: auto-transition locally
            if (!d.randomizingStartedAt) {
              draftStore.updateDraft(d.id, { players: 10, randomizingStartedAt: now });
              continue;
            }
            const randomizingElapsed = now - d.randomizingStartedAt;
            if (randomizingElapsed >= 3000) {
              const shuffled = [...DRAFT_PLAYERS].sort(() => Math.random() - 0.5);
              const userPos = shuffled.findIndex(p => p.isYou);
              draftStore.updateDraft(d.id, {
                phase: 'pre-spin', players: 10,
                preSpinStartedAt: now,
                randomizingStartedAt: undefined,
                draftOrder: shuffled, userDraftPosition: userPos,
                draftType: 'pro', type: 'pro',
              });
            }
          }

          // Only write player count if < 10 (the >= 10 case is handled above atomically)
          if (count < 10 && count !== d.players) {
            draftStore.updateDraft(d.id, { players: count });
          }
          continue;
        }

        // CATCH-ALL: Force transition for ANY draft stuck in randomizing > 15s
        // (regardless of phase/status/fillingStartedAt — covers all edge cases)
        if (d.randomizingStartedAt && !d.preSpinStartedAt && (now - d.randomizingStartedAt) >= 3000) {
          draftStore.updateDraft(d.id, {
            phase: 'pre-spin',
            preSpinStartedAt: now,
            randomizingStartedAt: undefined,
          });
          continue;
        }

        // REVEAL: 15s after pre-spin starts = slot machine reveal moment
        // Set type here so it shows on drafting page even if user isn't in draft room
        if (d.preSpinStartedAt && !d.type && !d.draftType) {
          const preSpinElapsed = (now - d.preSpinStartedAt) / 1000;
          if (preSpinElapsed >= 15) {
            // Determine type (same logic as draft room slot machine)
            const roll = Math.random() * 100;
            const revealedType = roll < 1 ? 'jackpot' : roll < 6 ? 'hof' : 'pro';
            draftStore.updateDraft(d.id, {
              type: revealedType,
              draftType: revealedType,
            });
          }
        }

        // PRE-SPIN / SPINNING / RESULT → DRAFTING when 60s expires
        if (['pre-spin', 'spinning', 'result'].includes(d.phase || '') && d.preSpinStartedAt) {
          if ((now - d.preSpinStartedAt) / 1000 >= 60) {
            draftStore.updateDraft(d.id, {
              phase: 'drafting', status: 'drafting',
              type: d.type || d.draftType || 'pro',
            });
          }
        }
      }
    };

    tick(); // immediate
    const interval = setInterval(tick, 800);
    return () => clearInterval(interval);
  }, []);

  // Derive live display state from timestamps (called fresh each render)
  type LiveState = {
    displayPhase: 'filling' | 'randomizing' | 'pre-spin-countdown' | 'draft-starting' | 'drafting';
    playerCount: number;
    countdown: number | null;
    randomizingProgress: number | null; // 0-1
    // Legacy compat
    isFilling: boolean;
  };
  const getLiveState = (draft: Draft): LiveState => {
    const now = Date.now();
    const timers = getBarTimers();

    // ── RANDOMIZE TIMER ──
    // Once a draft enters randomizing, the window-level timer locks in the start time.
    // Progress is derived purely from elapsed time — no state, no peaks, no effects.
    // The timer only clears when bar finishes (>=15s) or draft transitions to countdown.
    const timerStart = timers.get(draft.id);
    if (timerStart && !draft.preSpinStartedAt) {
      const elapsed = now - timerStart;
      if (elapsed < 3000) {
        const t = elapsed / 3000;
        const progress = 0.99 * Math.pow(t, 0.6);
        return { displayPhase: 'randomizing', playerCount: 10, countdown: null, randomizingProgress: progress, isFilling: false };
      }
      // 15s passed — done randomizing, clean up
      timers.delete(draft.id);
    }
    if (timerStart && draft.preSpinStartedAt) {
      timers.delete(draft.id);
    }

    // ── COUNTDOWN ──
    if (draft.preSpinStartedAt) {
      const elapsed = (now - draft.preSpinStartedAt) / 1000;
      if (elapsed < 15) {
        return { displayPhase: 'pre-spin-countdown', playerCount: 10, countdown: Math.max(0, Math.ceil(15 - elapsed)), randomizingProgress: null, isFilling: false };
      } else if (elapsed < 60) {
        const startIn = Math.max(0, Math.ceil(60 - elapsed));
        return { displayPhase: 'draft-starting', playerCount: 10, countdown: startIn > 0 ? startIn : null, randomizingProgress: null, isFilling: false };
      }
    }

    // ── DRAFTING ──
    if (draft.status === 'drafting' && draft.phase === 'drafting' && !draft.randomizingStartedAt) {
      return { displayPhase: 'drafting', playerCount: 10, countdown: null, randomizingProgress: null, isFilling: false };
    }

    // ── RANDOMIZING (from draftStore timestamp) ──
    if (draft.randomizingStartedAt && !draft.preSpinStartedAt) {
      const elapsed = now - draft.randomizingStartedAt;
      if (elapsed >= 3000) {
        // Bar done — show countdown from when bar ended
        timers.delete(draft.id);
        const effectivePreSpin = draft.randomizingStartedAt + 3000;
        const cdElapsed = (now - effectivePreSpin) / 1000;
        if (cdElapsed < 15) return { displayPhase: 'pre-spin-countdown', playerCount: 10, countdown: Math.max(0, Math.ceil(15 - cdElapsed)), randomizingProgress: null, isFilling: false };
        if (cdElapsed < 60) return { displayPhase: 'draft-starting', playerCount: 10, countdown: Math.max(0, Math.ceil(60 - cdElapsed)), randomizingProgress: null, isFilling: false };
        return { displayPhase: 'drafting', playerCount: 10, countdown: null, randomizingProgress: null, isFilling: false };
      }
      // Lock in timer if not set — use the draftStore timestamp
      if (!timers.has(draft.id)) timers.set(draft.id, draft.randomizingStartedAt);
      const t = elapsed / 3000;
      return { displayPhase: 'randomizing', playerCount: 10, countdown: null, randomizingProgress: 0.99 * Math.pow(t, 0.6), isFilling: false };
    }

    // ── FILLING ──
    if (!draft.preSpinStartedAt && !draft.randomizingStartedAt && (draft.status === 'filling' || draft.phase === 'filling')) {
      let count = draft.players || 1;
      if (draft.fillingStartedAt != null && draft.fillingInitialPlayers != null) {
        const simulated = Math.min(10, draft.fillingInitialPlayers + Math.floor((now - draft.fillingStartedAt) / 800));
        count = Math.max(count, simulated);
      }
      count = Math.min(10, count);
      if (count >= 10) {
        // Start randomizing immediately (tick will set the real timestamp next frame)
        if (!timers.has(draft.id)) timers.set(draft.id, now);
        const tStart = timers.get(draft.id)!;
        const t = Math.min(1, (now - tStart) / 3000);
        return { displayPhase: 'randomizing', playerCount: 10, countdown: null, randomizingProgress: 0.99 * Math.pow(t, 0.6), isFilling: false };
      }
      return { displayPhase: 'filling', playerCount: count, countdown: null, randomizingProgress: null, isFilling: true };
    }

    // ── DEFAULT ──
    if (draft.status === 'filling') {
      return { displayPhase: 'filling', playerCount: draft.players || 1, countdown: null, randomizingProgress: null, isFilling: true };
    }
    return { displayPhase: 'drafting', playerCount: draft.players, countdown: null, randomizingProgress: null, isFilling: false };
  };

  // Auto-rotate promos carousel
  useEffect(() => {
    if (!promoAutoRotate || promoCount === 0) return;
    const interval = setInterval(() => {
      setPromoIndex(prev => (prev + 1) % promoCount);
    }, 5000);
    return () => clearInterval(interval);
  }, [promoAutoRotate, promoCount]);

  useEffect(() => {
    if (promoCount === 0) {
      setPromoIndex(0);
      return;
    }
    if (promoIndex >= promoCount) {
      setPromoIndex(0);
    }
  }, [promoCount, promoIndex]);


  const confirmExitDraft = async () => {
    if (!exitingDraft || !user?.walletAddress) return;
    try {
      await leaveDraft(exitingDraft.id, user.walletAddress);
      draftStore.removeDraft(exitingDraft.id);
      setLiveDrafts(prev => prev.filter(d => d.id !== exitingDraft.id));
    } catch (err) {
      console.error('Failed to leave draft:', err);
    } finally {
      setExitingDraft(null);
    }
  };

  // Separate drafts by status
  const _yourTurnDrafts = activeDrafts.filter(d => d.status === 'drafting' && d.isYourTurn);
  const _inProgressDrafts = activeDrafts.filter(d => d.status === 'drafting' && !d.isYourTurn);

  // Show minimal UI while loading to prevent flash
  if (isLoading) {
    return (
      <div className="w-full px-4 sm:px-8 lg:px-12 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold text-white">My Drafts</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full px-4 sm:px-8 lg:px-12 py-8">
      {/* Claim Success Popup */}
      {claimSuccess.show && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 bg-banana text-black px-6 py-3 rounded-xl font-semibold shadow-lg animate-bounce">
          +{claimSuccess.count} Spin{claimSuccess.count > 1 ? 's' : ''} Claimed!
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold text-white">My Drafts</h1>
          <button
            onClick={async () => {
              // Collect ALL possible IDs to hide (draftStore IDs, API leagueIds, cardIds)
              const allIds = activeDrafts.map(d => d.id);
              const storeIds = draftStore.getActiveDrafts().map(d => d.id);
              // Also get raw API token IDs (leagueId + cardId) to cover ID mismatches
              const liveTokenIds: string[] = [];
              try {
                const { getOwnerDraftTokens } = await import('@/lib/api/owner');
                if (user?.walletAddress) {
                  const tokens = await getOwnerDraftTokens(user.walletAddress);
                  for (const t of tokens) {
                    if (t.leagueId) liveTokenIds.push(t.leagueId);
                    if (t.cardId) liveTokenIds.push(t.cardId);
                  }
                }
              } catch {}
              const combinedIds = [...new Set([...allIds, ...storeIds, ...liveTokenIds])];

              const newHidden = new Set([...Array.from(hiddenDraftIds), ...combinedIds]);
              localStorage.setItem('banana-hidden-drafts', JSON.stringify(Array.from(newHidden)));
              setHiddenDraftIds(newHidden);
              setLiveDrafts([]);
              // Nuke draftStore entirely
              localStorage.removeItem('banana-active-drafts');
              localStorage.removeItem('banana-completed-drafts');
              // Also try leaving server-side (best effort)
              const wallet = user?.walletAddress;
              if (wallet && allIds.length > 0) {
                Promise.allSettled(allIds.map(id => leaveDraft(id, wallet)));
              }
            }}
            className="text-xs text-white/40 hover:text-white/70 transition-colors"
          >
            Clear All
          </button>
        </div>
        <div className="flex items-center gap-2">
          {activeDrafts.length > 0 && (
            <>
              <button
                onClick={handleEnterDraft}
                className="w-28 py-2 text-sm font-semibold border-2 border-banana text-banana rounded-lg hover:bg-banana hover:text-black hover:scale-105 transition-all"
              >
                New Draft
              </button>
              <button
                onClick={() => router.push('/buy-drafts')}
                className="w-28 py-2 text-sm font-semibold bg-banana text-black border-2 border-banana rounded-lg hover:scale-105 transition-all"
              >
                Buy Drafts
              </button>
            </>
          )}
        </div>
      </div>

      {/* Main content: Drafts left, Promos right */}
      <div className="flex gap-6">
        {/* Left: Drafts */}
        <div className="flex-1 min-w-0">

      {/* Special Drafts (Jackpot/HOF from wheel) */}
      <SpecialDraftsSection userId={user?.id} walletAddress={user?.walletAddress} />

      {/* Active Drafts */}
      {sortedDrafts.length > 0 && (
        <div className="space-y-1.5">
          {sortedDrafts.map((draft) => {
            const live = getLiveState(draft);
            const resolvedType = draft.type || draft.draftType || null;
            const isRevealed = resolvedType !== null;

            const accentColor = isRevealed ? getDraftTypeColor(resolvedType!) : '#888';
            const isYourTurn = draft.isYourTurn;

            return (
              <div
                key={draft.id}
                onClick={() => router.push(buildDraftRoomUrl(draft))}
                className={`group cursor-pointer transition-all overflow-hidden rounded-lg hover:bg-white/[0.03] border-2 ${
                  isYourTurn ? 'border-banana bg-banana/10' : 'border-transparent'
                }`}
              >
                {/* Main content row - Flexbox with justify-between */}
                <div className="flex items-center justify-between px-5 py-3">
                  {/* Name */}
                  <div className="w-20 flex-shrink-0 flex items-center gap-1">
                    {draft.joinedAt ? (
                      <Tooltip content={`Joined ${formatRelativeTime(draft.joinedAt)}`}>
                        <span className="text-white/80 font-medium cursor-default">{draft.contestName}</span>
                      </Tooltip>
                    ) : (
                      <span className="text-white/80 font-medium">{draft.contestName}</span>
                    )}
                    {draft.airplaneMode && (
                      <Tooltip content="Auto-pick enabled">
                        <span className="text-sm">✈️</span>
                      </Tooltip>
                    )}
                  </div>

                  {/* Speed — hidden on small screens */}
                  <div className="w-16 flex-shrink-0 text-center hidden sm:block">
                    <span className="text-white/50 text-sm">{draft.draftSpeed === 'fast' ? '30 sec' : '8 hour'}</span>
                  </div>

                  {/* Type — hidden on small screens */}
                  <div className="w-28 flex-shrink-0 hidden sm:flex items-center justify-center gap-1.5">
                    {(live.displayPhase === 'pre-spin-countdown' || (live.displayPhase === 'draft-starting' && live.countdown != null && live.countdown > 37)) ? (
                      <span className="text-banana text-sm font-semibold animate-pulse">Revealing...</span>
                    ) : isRevealed ? (
                      <>
                        <span className="text-sm font-semibold" style={{ color: accentColor }}>
                          {resolvedType === 'jackpot' ? 'JACKPOT' : resolvedType === 'hof' ? 'HALL OF FAME' : 'PRO'}
                        </span>
                        <VerifiedBadge type="draft-type" draftType={resolvedType!} size="sm" />
                      </>
                    ) : (
                      <span className="text-white/30 text-sm italic">Unrevealed</span>
                    )}
                  </div>

                  {/* Status */}
                  <div className="w-28 flex-shrink-0 flex items-center justify-center">
                    {live.displayPhase === 'filling' ? (
                      <div key="filling" className="flex flex-col items-center gap-1">
                        <div className="w-20 h-1.5 bg-white/10 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-700"
                            style={{
                              width: `${(live.playerCount / 10) * 100}%`,
                              backgroundColor: accentColor
                            }}
                          />
                        </div>
                        <span className="text-xs tabular-nums"><span className="text-white font-semibold">{live.playerCount}</span><span className="text-white/40">/10</span></span>
                      </div>
                    ) : live.displayPhase === 'randomizing' ? (
                      <div key="randomizing" className="flex flex-col items-center gap-1">
                        <div className="w-20 h-1.5 bg-white/10 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${Math.round((live.randomizingProgress ?? 0) * 100)}%`,
                              background: (live.randomizingProgress ?? 0) >= 0.99
                                ? '#4ade80'
                                : 'linear-gradient(90deg, #fbbf24, #f59e0b)',
                            }}
                          />
                        </div>
                        <span className="text-white/40 text-[10px]">Randomizing...</span>
                      </div>
                    ) : live.displayPhase === 'pre-spin-countdown' ? (
                      <span className="text-white/50 text-sm">Reveal in {live.countdown}s</span>
                    ) : live.displayPhase === 'draft-starting' ? (
                      <span className="text-white/50 text-sm">
                        {live.countdown != null ? `Starts in ${live.countdown}s` : 'Starting...'}
                      </span>
                    ) : isYourTurn ? (
                      <span className="text-banana font-bold">
                        {draft.pickEndTimestamp
                          ? Math.max(0, Math.ceil(draft.pickEndTimestamp - Date.now() / 1000))
                          : (draft.timeRemaining ?? 30)}s
                      </span>
                    ) : draft.currentPick != null ? (
                      <span className="text-white/50 text-sm">
                        {draft.currentPick === 0 ? 'Next up' : `${draft.currentPick} pick${draft.currentPick !== 1 ? 's' : ''} away`}
                      </span>
                    ) : (
                      <span className="text-white/50 text-sm">In progress</span>
                    )}
                  </div>

                  {/* Button */}
                  <div className="w-28 flex-shrink-0 flex items-center justify-end gap-2">
                    {['filling', 'randomizing', 'pre-spin-countdown', 'draft-starting'].includes(live.displayPhase) ? (
                      <>
                        <Tooltip content="Enter draft room">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(buildDraftRoomUrl(draft));
                            }}
                            className="w-20 py-2 rounded-lg font-semibold text-sm transition-all hover:scale-105 bg-white text-black hover:bg-white/90 flex items-center justify-center"
                          >
                            Enter
                          </button>
                        </Tooltip>
                        {live.displayPhase === 'filling' && (
                          <Tooltip content="Leave draft">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setExitingDraft(draft);
                              }}
                              className="w-7 h-7 rounded-lg flex items-center justify-center text-white/30 hover:text-red-400 hover:bg-red-400/10 transition-all"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                                <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                              </svg>
                            </button>
                          </Tooltip>
                        )}
                      </>
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(buildDraftRoomUrl(draft));
                        }}
                        className="w-20 py-2 rounded-lg font-semibold text-sm transition-all hover:scale-105 flex items-center justify-center"
                        style={{
                          backgroundColor: isYourTurn ? '#fbbf24' : accentColor,
                          color: isYourTurn ? '#000' : '#fff'
                        }}
                      >
                        {isYourTurn ? 'Pick Now' : 'Enter'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Empty State - Full experience */}
      {activeDrafts.length === 0 && (
        <div className="space-y-4">
          {/* Hero — no card, just typography */}
          <div className="text-center pt-10 pb-4">
            <div className="flex items-center justify-center gap-2.5">
              <h2 className="text-3xl font-bold text-white tracking-tight">Banana Best Ball IV</h2>
              <Tooltip content="Contest Details">
                <button
                  onClick={() => setShowContestDetails(true)}
                  className="text-white/25 hover:text-white/50 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="16" x2="12" y2="12" />
                    <line x1="12" y1="8" x2="12.01" y2="8" />
                  </svg>
                </button>
              </Tooltip>
            </div>
            <p className="text-[15px] mt-3">
              <span className="font-bold text-banana">$100K</span>
              <span className="text-white/30 font-medium"> Prize Pool</span>
              <span className="text-white/15 mx-1.5">&middot;</span>
              <span className="font-semibold text-white/70">$25K</span>
              <span className="text-white/30 font-medium"> 1st Place</span>
            </p>
            <div className="mt-6">
              <button
                onClick={handleEnterDraft}
                className="px-10 py-3.5 bg-banana text-black font-bold text-[15px] rounded-full hover:brightness-110 active:scale-[0.98] transition-all"
              >
                Enter Draft
              </button>
            </div>
          </div>

          {/* How It Works — 2x2 grid */}
          <div>
            <h3 className="text-[13px] font-semibold text-white/40 uppercase tracking-[0.12em] mb-3 px-1">How it works</h3>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => setInfoTopic('10-players')} className="rounded-2xl p-4 bg-white/[0.03] hover:bg-white/[0.05] transition-colors text-left cursor-pointer">
                <h4 className="text-white text-[14px] font-semibold tracking-tight">10 Players</h4>
                <p className="text-white/50 text-[12px] mt-1 leading-[1.6]">Join a lobby, draft starts instantly when full</p>
              </button>
              <button onClick={() => setInfoTopic('snake-draft')} className="rounded-2xl p-4 bg-white/[0.03] hover:bg-white/[0.05] transition-colors text-left cursor-pointer">
                <h4 className="text-white text-[14px] font-semibold tracking-tight">Snake Draft</h4>
                <p className="text-white/50 text-[12px] mt-1 leading-[1.6]">Fast (30s) or slow (8hr) picks — your choice</p>
              </button>
              <button onClick={() => setInfoTopic('team-positions')} className="rounded-2xl p-4 bg-white/[0.03] hover:bg-white/[0.05] transition-colors text-left cursor-pointer">
                <h4 className="text-white text-[14px] font-semibold tracking-tight">Team Positions</h4>
                <p className="text-white/50 text-[12px] mt-1 leading-[1.6]">Draft <span className="text-white/50 font-medium">KC QB</span> or <span className="text-white/50 font-medium">DAL WR1</span> — not individual players. You get the top scorer at that position each week.</p>
              </button>
              <button onClick={() => setInfoTopic('best-ball')} className="rounded-2xl p-4 bg-white/[0.03] hover:bg-white/[0.05] transition-colors text-left cursor-pointer">
                <h4 className="text-white text-[14px] font-semibold tracking-tight">Best Ball</h4>
                <p className="text-white/50 text-[12px] mt-1 leading-[1.6]">No managing needed. Draft once, best scorers auto-selected weekly. No lineups, waivers, or trades.</p>
              </button>
            </div>
          </div>

          {/* Draft Types — 3 cards */}
          <div>
            <h3 className="text-[13px] font-semibold text-white/40 uppercase tracking-[0.12em] mb-3 px-1">Draft Types</h3>
            <div className="grid grid-cols-3 gap-3">
              {/* Pro */}
              <button
                onClick={() => setInfoTopic('pro')}
                className="rounded-2xl p-4 hover:bg-white/[0.02] transition-colors text-left cursor-pointer"
                style={{ background: 'linear-gradient(160deg, rgba(168,85,247,0.06) 0%, transparent 60%)' }}
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <h4 className="text-white text-[14px] font-semibold tracking-tight">Pro</h4>
                  <span className="text-white/15">&middot;</span>
                  <span className="text-[15px] font-bold tracking-tight text-pro">94%</span>
                </div>
                <p className="text-white/50 text-[12px] leading-[1.6]">Standard draft. Compete for your share of the prize pool.</p>
              </button>
              {/* Hall of Fame */}
              <button
                onClick={() => setInfoTopic('hof')}
                className="rounded-2xl p-4 hover:bg-white/[0.02] transition-colors text-left cursor-pointer"
                style={{ background: 'linear-gradient(160deg, rgba(212,175,55,0.06) 0%, transparent 60%)' }}
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <h4 className="text-white text-[14px] font-semibold tracking-tight">Hall of Fame</h4>
                  <span className="text-white/15">&middot;</span>
                  <span className="text-[15px] font-bold tracking-tight text-hof">5%</span>
                </div>
                <p className="text-white/50 text-[12px] leading-[1.6]">Bonus prize pool on top of standard rewards.</p>
              </button>
              {/* Jackpot */}
              <button
                onClick={() => setInfoTopic('jackpot')}
                className="rounded-2xl p-4 hover:bg-white/[0.02] transition-colors text-left cursor-pointer"
                style={{ background: 'linear-gradient(160deg, rgba(239,68,68,0.06) 0%, transparent 60%)' }}
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <h4 className="text-white text-[14px] font-semibold tracking-tight">Jackpot</h4>
                  <span className="text-white/15">&middot;</span>
                  <span className="text-[15px] font-bold tracking-tight text-jackpot">1%</span>
                </div>
                <p className="text-white/50 text-[12px] leading-[1.6]">Win your league and skip straight to the finals. The rarest draft type.</p>
              </button>
            </div>
          </div>
        </div>
      )}
        </div>

        {/* Right: Promos Sidebar - Single Card Carousel */}
        <div className="w-56 shrink-0 hidden lg:block">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-semibold text-white/50 uppercase tracking-wider">Promos</h3>
            <span className="text-xs text-white/30">
              {promoCount === 0 ? '0/0' : `${promoIndex + 1}/${promoCount}`}
            </span>
          </div>

          {/* Carousel Card */}
          {promoCount === 0 ? (
            <div className="rounded-[20px] p-5 h-44 bg-[#fbfbfd] border border-[#d2d2d7] flex items-center justify-center text-sm text-[#4a4a4a]">
              No promos available
            </div>
          ) : (
            (() => {
              const promo = promos[promoIndex];
              const hasProgress = promo.progressMax !== undefined && promo.progressMax > 0;
              const progressPercent = hasProgress ? ((promo.progressCurrent || 0) / promo.progressMax!) * 100 : 0;
              return (
                <div
                  onClick={() => setSelectedPromo(promo)}
                  className="rounded-[20px] p-5 h-44 bg-[#fbfbfd] border border-[#d2d2d7] hover:border-banana hover:shadow-[0_0_15px_rgba(251,191,36,0.3)] cursor-pointer transition-all flex flex-col"
                >
                  <h4 className="font-semibold text-[#1d1d1f] text-lg leading-snug tracking-tight text-center">
                    {promo.title.includes('→') ? (
                      <>
                        <span>{promo.title.split('→')[0].trim()}</span>
                        <br />
                        <span className="text-[#4a4a4a] text-sm font-semibold">
                          → {promo.title.split('→')[1].trim()}
                        </span>
                      </>
                    ) : (
                      <span>{promo.title}</span>
                    )}
                  </h4>
                  <div className="mt-auto">
                    {hasProgress && (
                      <div className="mb-2">
                        <div className="flex justify-center text-xs text-[#4a4a4a] mb-1">
                          <span className="font-semibold">{promo.progressCurrent}/{promo.progressMax}</span>
                        </div>
                        <div className="h-1.5 bg-[#e8e8ed] rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[#1d1d1f] rounded-full transition-all"
                            style={{ width: `${progressPercent}%` }}
                          />
                        </div>
                      </div>
                    )}
                    {promo.claimable && !claimedPromos.has(promo.id) && (
                      <button
                        onClick={(e) => handleClaim(promo, e)}
                        className="w-full py-2 bg-banana text-[#1d1d1f] text-xs font-bold rounded-full hover:scale-105 transition-all"
                      >
                        {promo.claimCount && promo.claimCount > 1 ? `CLAIM (${promo.claimCount})` : 'CLAIM'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })()
          )}

          {/* Navigation Dots */}
          <div className="flex justify-center gap-1.5 mt-3">
            {promos.map((_, idx) => (
              <button
                key={idx}
                onClick={() => { setPromoIndex(idx); setPromoAutoRotate(false); }}
                className={`w-2 h-2 rounded-full transition-all ${
                  idx === promoIndex ? 'bg-banana w-4' : 'bg-white/20 hover:bg-white/40'
                }`}
              />
            ))}
          </div>

          {/* Arrow Navigation */}
          <div className="flex justify-between mt-3">
            <button
              onClick={() => {
                if (promoCount === 0) return;
                setPromoIndex((promoIndex - 1 + promoCount) % promoCount);
                setPromoAutoRotate(false);
              }}
              className="px-3 py-1.5 text-white/40 hover:text-white/70 transition-colors text-sm"
            >
              ← Prev
            </button>
            <button
              onClick={() => {
                if (promoCount === 0) return;
                setPromoIndex((promoIndex + 1) % promoCount);
                setPromoAutoRotate(false);
              }}
              className="px-3 py-1.5 text-white/40 hover:text-white/70 transition-colors text-sm"
            >
              Next →
            </button>
          </div>
        </div>
      </div>

      {/* No Passes Modal */}
      {showNoPasses && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setShowNoPasses(false)}
        >
          <div
            className="bg-bg-secondary rounded-2xl border border-bg-elevated p-8 max-w-sm w-full text-center"
            onClick={e => e.stopPropagation()}
          >
            <div className="text-5xl mb-4">🎟️</div>
            <h3 className="text-2xl font-bold text-white mb-3">No Draft Passes</h3>
            <p className="text-text-secondary mb-6">
              You have 0 draft passes. Purchase to enter a draft.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowNoPasses(false)}
                className="flex-1 px-4 py-3 bg-transparent border border-white/30 text-white font-medium rounded-xl hover:bg-white/10 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowNoPasses(false);
                  router.push('/buy-drafts');
                }}
                className="flex-1 px-4 py-3 bg-banana text-black font-semibold rounded-xl hover:brightness-110 transition-all"
              >
                Buy Passes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Exit Draft Confirmation Modal */}
      {exitingDraft && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 cursor-pointer"
          onClick={() => setExitingDraft(null)}
        >
          <div
            className="bg-[#1a1a1a] rounded-2xl border border-white/10 p-6 max-w-sm w-full cursor-default"
            onClick={e => e.stopPropagation()}
          >
            <h3 className="text-xl font-bold text-white mb-2">Leave Draft?</h3>
            <p className="text-white/60 mb-6">
              Are you sure you want to leave <span className="text-white font-medium">{exitingDraft.contestName}</span>? Your draft pass will be returned.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setExitingDraft(null)}
                className="flex-1 px-4 py-3 bg-transparent border border-white/50 text-white font-medium rounded-xl hover:bg-white/10 hover:scale-105 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={confirmExitDraft}
                className="flex-1 px-4 py-3 bg-red-500 text-white font-medium rounded-xl hover:bg-red-400 transition-colors"
              >
                Leave Draft
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Entry Flow Modal (Pass Type + Speed in one) */}
      <EntryFlowModal
        isOpen={showEntryFlow}
        onClose={() => setShowEntryFlow(false)}
        onComplete={handleEntryComplete}
        paidPasses={user?.draftPasses || 0}
        freePasses={user?.freeDrafts || 0}
      />

      {/* Info Topic Modal */}
      {infoTopic && (() => {
        const topics: Record<string, { title: string; items: { q: string; a: string }[] }> = {
          '10-players': {
            title: '10 Players',
            items: [
              { q: 'Is this like a traditional league?', a: 'No — this is a tournament contest. You draft against 9 other players and top finishers advance through playoffs for the grand prize pool. Enter as many drafts as you want — more teams, more paths to the playoffs.' },
              { q: 'How does a draft lobby work?', a: 'You join a draft room that fills up to 10 players. Once full, the draft starts immediately — no scheduled times, no waiting.' },
              { q: 'What happens when 10 players join?', a: 'A 60-second countdown starts and your draft type is revealed slot machine style — Jackpot (1%), HOF (5%), or Pro (94%). Then you draft!' },
            ],
          },
          'snake-draft': {
            title: 'Snake Draft',
            items: [
              { q: 'What is a snake draft?', a: 'Pick order reverses each round. If you pick 1st in round 1, you pick 10th in round 2, then 1st again in round 3. This keeps things fair for everyone.' },
              { q: 'Fast or slow — what\'s the difference?', a: 'You choose your speed before each draft. Fast drafts give you 30 seconds per pick — the whole draft takes about 15-20 minutes. Slow drafts give you 8 hours per pick, perfect if you want to draft over a few days.' },
              { q: 'How many rounds?', a: '15 rounds. You draft a full roster: 1 QB, 2 RB, 3 WR, 1 TE, 2 FLEX, 1 K, 1 DEF, plus bench spots.' },
            ],
          },
          'team-positions': {
            title: 'Team Positions',
            items: [
              { q: 'What are Team Positions?', a: 'Instead of drafting individual players like Patrick Mahomes, you draft Team Positions like "KC QB". Each week, you automatically get the points from the highest-scoring player at that position for that team.' },
              { q: 'How does this protect against injuries?', a: 'In traditional fantasy, one injury can destroy your season. With Team Positions, if a starter gets hurt, you automatically get points from whoever replaces them. Your team stays competitive all season regardless of injuries.' },
            ],
          },
          'best-ball': {
            title: 'Best Ball',
            items: [
              { q: 'What is Best Ball?', a: 'Best Ball is a set-it-and-forget-it format. After you draft your team, the platform automatically starts your highest-scoring players each week. No lineup management, no waivers, no trades — just draft and watch.' },
              { q: 'How does scoring work?', a: 'Each week, your best players at each position are automatically selected based on their actual performance. Your weekly score is the sum of your best performers according to your roster requirements.' },
              { q: 'Can I trade or drop players?', a: 'No trades or waivers in Best Ball — that\'s the beauty of it! However, you can sell your entire team on our marketplace at any time if you want out.' },
            ],
          },
          'pro': {
            title: 'Pro Draft',
            items: [
              { q: 'What is a Pro Draft?', a: 'Pro is the standard draft type, making up 94% of all drafts. Compete against 9 other players for your share of the prize pool.' },
              { q: 'How do I win?', a: 'Top 2 in your 10-person league make it to the playoffs to compete for the grand prize pool. The better you finish, the further you go.' },
              { q: 'How is the distribution guaranteed?', a: 'Every 100 drafts contains exactly 94 Pro, 5 HOF, and 1 Jackpot. The order is randomized but the distribution is guaranteed — it\'s not random odds.' },
            ],
          },
          'hof': {
            title: 'Hall of Fame',
            items: [
              { q: 'What is a Hall of Fame Draft?', a: 'HOF Drafts are premium draft rooms making up 5% of all drafts. Your team competes for a separate bonus prize pool on top of the regular tournament prizes.' },
              { q: 'How do I get into a HOF Draft?', a: 'Every draft has a chance to become a HOF. When your draft room fills to 10 players, the slot machine reveals your draft type. You can also win guaranteed HOF entries on the Banana Wheel.' },
            ],
          },
          'jackpot': {
            title: 'Jackpot',
            items: [
              { q: 'What is a Jackpot Draft?', a: 'Jackpot Drafts are the rarest and most valuable draft type — only 1% of all drafts. If you win your league in a Jackpot draft, you skip straight to the finals, bypassing two weeks of playoffs.' },
              { q: 'How do I get into a Jackpot Draft?', a: 'Every draft has a chance to become a Jackpot. When your draft room fills to 10 players, the slot machine reveals your draft type. You can also win guaranteed Jackpot entries on the Banana Wheel.' },
              { q: 'What exactly happens if I win?', a: 'Win your 10-person Jackpot league during the regular season (Weeks 1-14) and you advance directly to the Week 17 finals, skipping the Week 15 and Week 16 playoff rounds entirely.' },
            ],
          },
        };
        const topic = topics[infoTopic];
        if (!topic) return null;
        return (
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setInfoTopic(null)}
          >
            <div
              className="bg-[#1a1a1a] rounded-2xl border border-white/10 p-6 max-w-lg w-full max-h-[80vh] overflow-y-auto cursor-default"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-xl font-bold text-white">{topic.title}</h3>
                <button onClick={() => setInfoTopic(null)} className="text-white/30 hover:text-white/60 transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                    <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                  </svg>
                </button>
              </div>
              <div className="space-y-4">
                {topic.items.map((item, i) => (
                  <div key={i}>
                    <h4 className="text-white text-[14px] font-semibold">{item.q}</h4>
                    <p className="text-white/50 text-[13px] mt-1.5 leading-[1.7]">{item.a}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      })()}

      {/* Contest Details Modal */}
      {contest && (
        <ContestDetailsModal
          isOpen={showContestDetails}
          onClose={() => setShowContestDetails(false)}
          contest={contest}
          onEnter={() => {
            setShowContestDetails(false);
            handleEnterDraft();
          }}
        />
      )}

      {/* Promo Detail Modal */}
      <PromoModal
        isOpen={!!selectedPromo}
        onClose={() => setSelectedPromo(null)}
        promo={selectedPromo}
        onClaim={(promoId) => {
          console.log('Claiming promo:', promoId);
          setSelectedPromo(null);
        }}
        onVerifyTweet={promosQuery.verifyTweetEngagement}
        onGenerateReferralCode={promosQuery.generateReferralCode}
      />
    </div>
  );
}
