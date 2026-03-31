'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { usePromos } from '@/hooks/usePromos';
import { isDraftingOpen } from '@/lib/draftTypes';
import { isStagingMode, getDraftServerUrl } from '@/lib/staging';
import { useActiveDrafts } from '@/hooks/useActiveDrafts';
import * as draftStore from '@/lib/draftStore';
import type { DraftState } from '@/lib/draftStore';
import type { ApiDraftToken } from '@/lib/api/owner';
import { DRAFT_PLAYERS } from '@/lib/draftRoomConstants';
import * as draftApi from '@/lib/draftApi';
import { leaveDraft } from '@/lib/api/leagues';
import { useContests } from '@/hooks/useContests';
import { fetchJson } from '@/lib/appApiClient';
import type { DraftQueue, Promo } from '@/types';
import { logger } from '@/lib/logger';
import type { Draft, LiveState } from '@/components/drafting/DraftRow';

function getSnakeDrafterIndex(pickNumber: number): number {
  const round = Math.ceil(pickNumber / 10);
  const posInRound = (pickNumber - 1) % 10;
  return round % 2 === 1 ? posInRound : 9 - posInRound;
}

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

  return {
    turnsUntilUserPick,
    isUserTurn,
    pickEndTimestamp: info.currentPickEndTime || undefined,
  };
}

function getBarTimers(): Map<string, number> {
  if (typeof window === 'undefined') return new Map();
  const win = window as Window & { __draftBarTimers?: Map<string, number> };
  if (!win.__draftBarTimers) {
    win.__draftBarTimers = new Map<string, number>();
  }
  return win.__draftBarTimers;
}

export function formatRelativeTime(timestamp: number): string {
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

export function formatCountdown(totalSeconds: number): string {
  const s = Math.max(0, Math.ceil(totalSeconds));
  if (s < 60) return `${s}s`;
  const hrs = Math.floor(s / 3600);
  const mins = Math.floor((s % 3600) / 60);
  const secs = s % 60;
  if (hrs > 0) return `${hrs}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  return `${mins}:${String(secs).padStart(2, '0')}`;
}

export function useDraftingPageState() {
  const router = useRouter();
  const { isLoggedIn, user, setShowLoginModal, updateUser } = useAuth();
  const contestsQuery = useContests();
  const contest = contestsQuery.data?.[0] ?? null;
  const promosQuery = usePromos({ userId: user?.id });
  const promos = promosQuery.promos ?? [];
  const promoCount = promos.length;
  const localDrafts = useActiveDrafts();
  const isLive = isStagingMode() && !!user?.walletAddress;

  const [showContestDetails, setShowContestDetails] = useState(false);
  const [infoTopic, setInfoTopic] = useState<string | null>(null);
  const [liveDrafts, setLiveDrafts] = useState<Draft[]>([]);
  const [isLoading] = useState(false);
  const [, setTimers] = useState<Record<string, number>>({});
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
      return stored ? new Set(JSON.parse(stored) as string[]) : new Set();
    } catch {
      return new Set();
    }
  });
  const [queueDrafts, setQueueDrafts] = useState<Draft[]>([]);
  const [creatingQueueDraft, setCreatingQueueDraft] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.id) {
      logger.debug('[Queue] No user.id, skipping queue poll');
      return;
    }

    const userId = user.id;
    const walletAddr = user.walletAddress;
    logger.debug('[Queue] Starting poll, userId:', userId, 'walletAddr:', walletAddr);

    const poll = () => {
      fetchJson<Record<string, DraftQueue>>('/api/queues')
        .then((queues) => {
          const drafts: Draft[] = [];
          let totalRounds = 0;

          for (const q of Object.values(queues)) {
            for (const r of q.rounds || []) {
              totalRounds++;
              if (r.status === 'completed') continue;

              const memberWallets = r.members?.map((m: { wallet?: string }) => m.wallet) || [];
              const isMember = r.members?.some((m: { wallet?: string }) =>
                m.wallet?.toLowerCase() === userId.toLowerCase() ||
                m.wallet?.toLowerCase() === walletAddr?.toLowerCase(),
              );

              logger.debug('[Queue]', q.type, 'round', r.roundId, ':', isMember ? 'MATCH' : 'no match', 'wallets:', memberWallets.join(','));
              if (!isMember) continue;

              drafts.push({
                id: `queue-${q.type}-${r.roundId}`,
                queueDraftId: r.draftId || undefined,
                contestName: `${q.type === 'jackpot' ? 'Jackpot' : 'HOF'} #${r.roundId}`,
                status: 'filling',
                type: q.type as 'jackpot' | 'hof',
                draftSpeed: 'slow',
                players: r.members?.length || 1,
                maxPlayers: 10,
                joinedAt: r.members?.find((m: { wallet?: string }) =>
                  m.wallet?.toLowerCase() === userId.toLowerCase() ||
                  m.wallet?.toLowerCase() === walletAddr?.toLowerCase(),
                )?.joinedAt || Date.now(),
                lastUpdated: Date.now(),
                specialType: q.type as 'jackpot' | 'hof',
              });
            }
          }

          logger.debug('[Queue] Found', drafts.length, 'matching queue drafts out of', totalRounds, 'total rounds');
          setQueueDrafts(drafts);
        })
        .catch((e) => {
          console.error('[Queue] Poll failed:', e);
        });
    };

    poll();
    const interval = setInterval(poll, 5000);
    return () => clearInterval(interval);
  }, [isLive, user?.id, user?.walletAddress]);

  const handleClaim = async (promo: Promo, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (claimedPromos.has(promo.id)) return;

    setClaimedPromos(prev => new Set([...Array.from(prev), promo.id]));
    const fallbackCount = promo.claimCount || 1;
    const claimResult = await promosQuery.claimPromo(promo.id);
    if (claimResult instanceof Error) {
      return;
    }
    if (!claimResult && user) {
      updateUser({ wheelSpins: (user.wheelSpins || 0) + fallbackCount });
    }
    setClaimSuccess({ show: true, count: claimResult?.spinsAdded ?? fallbackCount });
    setTimeout(() => setClaimSuccess({ show: false, count: 0 }), 2000);
  };

  const buildDraftRoomUrl = (draft: Draft) => {
    const params = new URLSearchParams({
      id: draft.queueDraftId || draft.id,
      name: draft.contestName,
      speed: draft.draftSpeed,
      players: String(draft.players),
    });
    if (isLive && user?.walletAddress) {
      params.set('mode', 'live');
      params.set('wallet', user.walletAddress);
    }
    if (draft.passType) params.set('passType', draft.passType);
    const st = draft.specialType || ((draft.type === 'jackpot' || draft.type === 'hof') && draft.draftSpeed === 'slow' ? draft.type : undefined);
    if (st) params.set('specialType', st);
    return `/draft-room?${params.toString()}`;
  };

  const handleDraftClick = async (draft: Draft) => {
    if (draft.specialType && draft.id.startsWith('queue-')) {
      if ((draft.players || 0) < 10) {
        router.push(buildDraftRoomUrl(draft));
        return;
      }

      setCreatingQueueDraft(draft.id);
      try {
        const parts = draft.id.split('-');
        const queueType = parts[1];
        const roundId = parseInt(parts[2] || '1', 10) || 1;
        const res = await fetchJson<{ draftId: string }>('/api/queues/create-draft', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user?.id || user?.walletAddress || '',
            queueType,
            roundId,
          }),
        });

        if (res.draftId) {
          let finalDraftId = res.draftId;
          try {
            const queues = await fetchJson<Record<string, { rounds?: Array<{ roundId: number; draftId?: string | null }> }>>('/api/queues');
            const round = queues[queueType]?.rounds?.find(r => r.roundId === roundId);
            if (round?.draftId) finalDraftId = round.draftId;
          } catch {}

          router.push(buildDraftRoomUrl({ ...draft, queueDraftId: finalDraftId }));
        }
      } catch (err) {
        console.error('Failed to create queue draft:', err);
      } finally {
        setCreatingQueueDraft(null);
      }
      return;
    }

    router.push(buildDraftRoomUrl(draft));
  };

  const enterDraftWithPassType = (passType: 'paid' | 'free', speed: 'fast' | 'slow' = 'fast') => {
    if (!user?.walletAddress) return;

    if (passType === 'paid') {
      updateUser({ draftPasses: Math.max(0, (user.draftPasses || 0) - 1) });
    } else {
      updateUser({ freeDrafts: Math.max(0, (user.freeDrafts || 0) - 1) });
    }

    const params = new URLSearchParams({
      speed,
      mode: 'live',
      wallet: user.walletAddress,
      passType,
    });
    router.push(`/draft-room?${params.toString()}`);
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
    if (paidPasses + freePasses <= 0) {
      setShowNoPasses(true);
      return;
    }

    setShowEntryFlow(true);
  };

  const handleEntryComplete = (passType: 'paid' | 'free', speed: 'fast' | 'slow') => {
    setShowEntryFlow(false);
    enterDraftWithPassType(passType, speed);
  };

  useEffect(() => {
    if (!isLive) return;

    let cancelled = false;
    const loadLiveDrafts = async () => {
      try {
        const { getOwnerDraftTokens } = await import('@/lib/api/owner');
        const raw = await getOwnerDraftTokens(user!.walletAddress!);
        if (cancelled) return;
        const tokens: ApiDraftToken[] = Array.isArray(raw) ? raw : [];

        const activeTokens = tokens.filter((t) => {
          if (!t.leagueId || hiddenDraftIds.has(t.leagueId) || hiddenDraftIds.has(t.cardId)) return false;
          if (t.roster) {
            const rosterCount = (t.roster.QB?.length || 0)
              + (t.roster.RB?.length || 0)
              + (t.roster.WR?.length || 0)
              + (t.roster.TE?.length || 0)
              + (t.roster.DST?.length || 0);
            if (rosterCount >= 15) return false;
          }
          return true;
        });

        const mapped: Draft[] = activeTokens.map((t) => ({
          id: t.leagueId || t.cardId,
          contestName: t.leagueDisplayName || `League #${t.leagueId || t.cardId}`,
          status: 'drafting',
          type: t.level === 'Jackpot' ? 'jackpot' : t.level === 'Hall of Fame' ? 'hof' : 'pro',
          draftSpeed: 'fast',
          players: 10,
          maxPlayers: 10,
          lastUpdated: Date.now(),
        }));

        for (const d of mapped) {
          if (!draftStore.getDraft(d.id) && !hiddenDraftIds.has(d.id)) {
            draftStore.addDraft({ ...d, liveWalletAddress: user!.walletAddress!, phase: 'drafting' });
          }
        }
        setLiveDrafts(mapped);
      } catch (err) {
        console.error('[Drafting] Failed to load live drafts:', err);
      }
    };

    void loadLiveDrafts();
    return () => {
      cancelled = true;
    };
  }, [hiddenDraftIds, isLive, user]);

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

        const heartbeat = localStorage.getItem(`draft-room-ws:${draft.id}`);
        if (heartbeat && Date.now() - Number(heartbeat) < 10_000) continue;

        try {
          const info = await draftApi.getDraftInfo(draft.id);
          if (cancelled) return;

          const fresh = draftStore.getDraft(draft.id) || draft;
          const playerCount = info.draftOrder?.length || 0;
          const hasDraftStarted = playerCount >= 10 && info.pickNumber >= 1;
          const isFull = playerCount >= 10;
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

            if (info.draftOrder && draft.liveWalletAddress) {
              const userIdx = info.draftOrder.findIndex(
                (e: { ownerId: string }) => e.ownerId.toLowerCase() === draft.liveWalletAddress!.toLowerCase(),
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
            const { turnsUntilUserPick, isUserTurn, pickEndTimestamp } =
              computeTurnsFromServer(info, draft.liveWalletAddress!);

            const totalPicks = (info.draftOrder?.length || 10) * 15;
            const isCompleted = info.pickNumber >= totalPicks;
            if (isCompleted) {
              draftStore.removeDraft(draft.id);
              continue;
            }

            const nowMs = Date.now();
            const effectivePickEnd = pickEndTimestamp || fresh.pickEndTimestamp;
            const animStillRunning = (() => {
              if (fresh.randomizingStartedAt && !fresh.preSpinStartedAt) {
                return (nowMs - fresh.randomizingStartedAt) < 63000;
              }
              if (fresh.preSpinStartedAt) {
                return ((nowMs - fresh.preSpinStartedAt) / 1000) < 60;
              }
              return false;
            })();

            const patch: Partial<DraftState> = {
              currentPick: turnsUntilUserPick,
              isYourTurn: isUserTurn,
              pickEndTimestamp: effectivePickEnd,
              timeRemaining: isUserTurn && effectivePickEnd
                ? Math.max(0, Math.ceil(effectivePickEnd - nowMs / 1000))
                : undefined,
            };

            if (animStillRunning) {
              draftStore.updateDraft(draft.id, patch);
            } else if (!fresh.randomizingStartedAt && !fresh.preSpinStartedAt) {
              draftStore.updateDraft(draft.id, { ...patch, players: 10, randomizingStartedAt: nowMs });
            } else {
              draftStore.updateDraft(draft.id, {
                ...patch,
                status: 'drafting',
                phase: 'drafting',
                players: 10,
                type: fresh.type || fresh.draftType || null,
                draftType: fresh.draftType || fresh.type || null,
                randomizingStartedAt: undefined,
              });
            }
          } else if (isFull) {
            const patch: Partial<DraftState> = { players: 10 };

            if (info.draftStartTime) {
              const serverPreSpin = info.draftStartTime * 1000 - 60000;
              if (!fresh.preSpinStartedAt) {
                if (fresh.randomizingStartedAt) {
                  const barStillRunning = (Date.now() - fresh.randomizingStartedAt) < 3000;
                  if (!barStillRunning) {
                    patch.preSpinStartedAt = serverPreSpin;
                    patch.randomizingStartedAt = undefined;
                    patch.phase = 'pre-spin';
                  }
                } else {
                  patch.randomizingStartedAt = Date.now();
                }
              } else if (Math.abs(fresh.preSpinStartedAt - serverPreSpin) > 2000) {
                patch.preSpinStartedAt = serverPreSpin;
              }
            }

            draftStore.updateDraft(draft.id, patch);
          } else if (playerCount > 0 && draft.status === 'filling') {
            draftStore.updateDraft(draft.id, { players: playerCount });
          }
        } catch (err) {
          console.warn(`[Drafting] Failed to sync draft ${draft.id}:`, err);
        }
      }
    };

    void syncLiveDrafts();

    let focusTimeout: ReturnType<typeof setTimeout> | null = null;
    const onFocus = () => {
      if (focusTimeout) clearTimeout(focusTimeout);
      focusTimeout = setTimeout(() => {
        void syncLiveDrafts();
      }, 500);
    };

    window.addEventListener('focus', onFocus);
    intervalId = setInterval(() => {
      void syncLiveDrafts();
    }, 3000);

    return () => {
      cancelled = true;
      window.removeEventListener('focus', onFocus);
      if (focusTimeout) clearTimeout(focusTimeout);
      if (intervalId) clearInterval(intervalId);
    };
  }, [isLive, user?.id, user?.walletAddress]);

  const wsConnectionsRef = useRef<Map<string, WebSocket>>(new Map());

  useEffect(() => {
    if (!isLive || !user?.walletAddress) return;

    const wallet = user.walletAddress.trim().toLowerCase();
    const serverUrl = getDraftServerUrl() || 'wss://sbs-drafts-server-staging-652484219017.us-central1.run.app';

    const syncConnections = () => {
      const allDrafts = draftStore.getActiveDrafts();
      const draftingDrafts = allDrafts.filter(
        d => d.liveWalletAddress && d.phase === 'drafting' && d.status === 'drafting',
      );

      const activeIds = new Set(draftingDrafts.map(d => d.id));
      const conns = wsConnectionsRef.current;

      conns.forEach((ws, id) => {
        const heartbeat = localStorage.getItem(`draft-room-ws:${id}`);
        const draftRoomActive = heartbeat && Date.now() - Number(heartbeat) < 10_000;
        if (!activeIds.has(id) || draftRoomActive) {
          ws.close();
          conns.delete(id);
        }
      });

      for (const draft of draftingDrafts) {
        if (conns.has(draft.id)) continue;

        const heartbeat = localStorage.getItem(`draft-room-ws:${draft.id}`);
        if (heartbeat && Date.now() - Number(heartbeat) < 10_000) continue;

        const url = `${serverUrl}/ws?address=${encodeURIComponent(wallet)}&draftName=${encodeURIComponent(draft.id)}`;
        const ws = new WebSocket(url);
        conns.set(draft.id, ws);

        let pingInterval: ReturnType<typeof setInterval> | null = null;
        ws.onopen = () => {
          logger.debug(`[Drafting WS] connected to ${draft.id}`);
          pingInterval = setInterval(() => {
            if (ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({ type: 'ping', payload: {} }));
            }
          }, 30_000);
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data) as { type?: string; payload?: any };
            const { type, payload } = data;
            const draftId = draft.id;

            if (type === 'timer_update' && payload) {
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
          } catch {}
        };

        ws.onclose = () => {
          if (pingInterval) clearInterval(pingInterval);
          conns.delete(draft.id);
        };

        ws.onerror = () => {};
      }
    };

    syncConnections();
    const interval = setInterval(syncConnections, 3000);

    return () => {
      clearInterval(interval);
      const conns = wsConnectionsRef.current;
      conns.forEach((ws) => ws.close());
      conns.clear();
    };
  }, [isLive, user?.walletAddress]);

  const activeDrafts = useMemo(() => {
    let base: Draft[];
    if (!isLive) {
      base = localDrafts;
    } else {
      const localIds = new Set(localDrafts.map(d => d.id));
      const apiOnly = liveDrafts.filter(d => !localIds.has(d.id));
      base = [...localDrafts, ...apiOnly];
    }

    const storeByDraftId = new Map(base.map(d => [d.id, d]));
    const mergedQueueDrafts = queueDrafts.map((qd) => {
      if (qd.queueDraftId) {
        const storeEntry = storeByDraftId.get(qd.queueDraftId);
        if (storeEntry) {
          storeByDraftId.delete(qd.queueDraftId);
          return {
            ...storeEntry,
            id: qd.id,
            queueDraftId: qd.queueDraftId,
            contestName: qd.contestName,
            specialType: qd.specialType,
            type: qd.type,
            draftSpeed: qd.draftSpeed,
            players: Math.max(storeEntry.players || 0, qd.players || 0),
            airplaneMode: undefined,
          };
        }
      }
      return qd;
    });

    const queueDraftIdSet = new Set(queueDrafts.map(qd => qd.queueDraftId).filter(Boolean));
    const remainingBase = base.filter((d) => {
      if (!storeByDraftId.has(d.id)) return false;
      if (d.specialType) return false;
      if (queueDraftIdSet.has(d.id)) return false;
      return true;
    });

    return [...remainingBase, ...mergedQueueDrafts].filter(
      d => (d.specialType || !hiddenDraftIds.has(d.id)) && d.status !== 'completed',
    );
  }, [hiddenDraftIds, isLive, liveDrafts, localDrafts, queueDrafts]);

  const sortedDrafts = [...activeDrafts].sort((a, b) => {
    if (a.isYourTurn && !b.isYourTurn) return -1;
    if (!a.isYourTurn && b.isYourTurn) return 1;

    const aIsDrafting = a.status === 'drafting';
    const bIsDrafting = b.status === 'drafting';
    if (aIsDrafting && !bIsDrafting) return -1;
    if (!aIsDrafting && bIsDrafting) return 1;
    if (aIsDrafting && bIsDrafting) {
      return (a.currentPick || 99) - (b.currentPick || 99);
    }

    return (a.joinedAt || 0) - (b.joinedAt || 0);
  });

  const specialDrafts = sortedDrafts.filter(d => d.id.startsWith('queue-'));
  const regularDrafts = sortedDrafts.filter(d => !d.id.startsWith('queue-'));

  useEffect(() => {
    const initial: Record<string, number> = {};
    activeDrafts.forEach((draft) => {
      if (draft.timeRemaining) initial[draft.id] = draft.timeRemaining;
    });
    setTimers(initial);
  }, [activeDrafts]);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimers((prev) => {
        const updated = { ...prev };
        Object.keys(updated).forEach((id) => {
          if (updated[id] > 0) updated[id] = updated[id] - 1;
        });
        return updated;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const [, setRenderTick] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => setRenderTick(t => t + 1), 100);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const tick = () => {
      const now = Date.now();
      const allDrafts = draftStore.getActiveDrafts();

      for (const d of allDrafts) {
        if ((d.phase === 'filling' || d.status === 'filling')
          && !d.preSpinStartedAt
          && d.fillingStartedAt != null
          && d.fillingInitialPlayers != null) {
          const simulated = Math.min(10, d.fillingInitialPlayers + Math.floor((now - d.fillingStartedAt) / 800));
          const count = Math.max(simulated, d.players || 0);

          if (count >= 10 && !d.preSpinStartedAt) {
            if (d.liveWalletAddress) {
              if (!d.randomizingStartedAt) {
                draftStore.updateDraft(d.id, { players: 10, randomizingStartedAt: now });
              } else if ((now - d.randomizingStartedAt) >= 3000) {
                draftStore.updateDraft(d.id, {
                  phase: 'pre-spin',
                  players: 10,
                  preSpinStartedAt: now,
                  randomizingStartedAt: undefined,
                });
              }
              continue;
            }

            if (!d.randomizingStartedAt) {
              draftStore.updateDraft(d.id, { players: 10, randomizingStartedAt: now });
              continue;
            }
            if ((now - d.randomizingStartedAt) >= 3000) {
              const shuffled = [...DRAFT_PLAYERS].sort(() => Math.random() - 0.5);
              const userPos = shuffled.findIndex(p => p.isYou);
              draftStore.updateDraft(d.id, {
                phase: 'pre-spin',
                players: 10,
                preSpinStartedAt: now,
                randomizingStartedAt: undefined,
                draftOrder: shuffled,
                userDraftPosition: userPos,
                draftType: 'pro',
                type: 'pro',
              });
            }
          }

          if (count < 10 && count !== d.players) {
            draftStore.updateDraft(d.id, { players: count });
          }
          continue;
        }

        if (d.randomizingStartedAt && !d.preSpinStartedAt && (now - d.randomizingStartedAt) >= 3000) {
          draftStore.updateDraft(d.id, {
            phase: 'pre-spin',
            preSpinStartedAt: now,
            randomizingStartedAt: undefined,
          });
          continue;
        }

        if (d.preSpinStartedAt && !d.type && !d.draftType && !d.specialType) {
          const preSpinElapsed = (now - d.preSpinStartedAt) / 1000;
          if (preSpinElapsed >= 15) {
            const roll = Math.random() * 100;
            const revealedType = roll < 1 ? 'jackpot' : roll < 6 ? 'hof' : 'pro';
            draftStore.updateDraft(d.id, { type: revealedType, draftType: revealedType });
          }
        }

        if (['pre-spin', 'spinning', 'result', 'countdown'].includes(d.phase || '') && d.preSpinStartedAt) {
          if ((now - d.preSpinStartedAt) / 1000 >= 60) {
            draftStore.updateDraft(d.id, {
              phase: 'drafting',
              status: 'drafting',
              type: d.type || d.draftType || 'pro',
            });
          }
        }
      }
    };

    tick();
    const interval = setInterval(tick, 800);
    return () => clearInterval(interval);
  }, []);

  const getLiveState = (draft: Draft): LiveState => {
    const now = Date.now();
    const timers = getBarTimers();
    const timerStart = timers.get(draft.id);

    if (timerStart && !draft.preSpinStartedAt) {
      const elapsed = now - timerStart;
      if (elapsed < 3000) {
        const t = elapsed / 3000;
        return {
          displayPhase: 'randomizing',
          playerCount: 10,
          countdown: null,
          randomizingProgress: 0.99 * Math.pow(t, 0.6),
          isFilling: false,
        };
      }
      timers.delete(draft.id);
    }
    if (timerStart && draft.preSpinStartedAt) {
      timers.delete(draft.id);
    }

    if (draft.preSpinStartedAt) {
      const elapsed = (now - draft.preSpinStartedAt) / 1000;
      if (draft.specialType || draft.phase === 'countdown') {
        if (elapsed < 60) {
          const startIn = Math.max(0, Math.ceil(60 - elapsed));
          return { displayPhase: 'draft-starting', playerCount: 10, countdown: startIn > 0 ? startIn : null, randomizingProgress: null, isFilling: false };
        }
      } else if (elapsed < 15) {
        return { displayPhase: 'pre-spin-countdown', playerCount: 10, countdown: Math.max(0, Math.ceil(15 - elapsed)), randomizingProgress: null, isFilling: false };
      } else if (elapsed < 60) {
        const startIn = Math.max(0, Math.ceil(60 - elapsed));
        return { displayPhase: 'draft-starting', playerCount: 10, countdown: startIn > 0 ? startIn : null, randomizingProgress: null, isFilling: false };
      }
    }

    if (draft.status === 'drafting' && draft.phase === 'drafting' && !draft.randomizingStartedAt) {
      return { displayPhase: 'drafting', playerCount: 10, countdown: null, randomizingProgress: null, isFilling: false };
    }

    if (draft.randomizingStartedAt && !draft.preSpinStartedAt) {
      const elapsed = now - draft.randomizingStartedAt;
      if (elapsed >= 3000) {
        timers.delete(draft.id);
        const effectivePreSpin = draft.randomizingStartedAt + 3000;
        const cdElapsed = (now - effectivePreSpin) / 1000;
        if (cdElapsed < 15) return { displayPhase: 'pre-spin-countdown', playerCount: 10, countdown: Math.max(0, Math.ceil(15 - cdElapsed)), randomizingProgress: null, isFilling: false };
        if (cdElapsed < 60) return { displayPhase: 'draft-starting', playerCount: 10, countdown: Math.max(0, Math.ceil(60 - cdElapsed)), randomizingProgress: null, isFilling: false };
        return { displayPhase: 'drafting', playerCount: 10, countdown: null, randomizingProgress: null, isFilling: false };
      }
      if (!timers.has(draft.id)) timers.set(draft.id, draft.randomizingStartedAt);
      const t = elapsed / 3000;
      return { displayPhase: 'randomizing', playerCount: 10, countdown: null, randomizingProgress: 0.99 * Math.pow(t, 0.6), isFilling: false };
    }

    if (!draft.preSpinStartedAt && !draft.randomizingStartedAt && (draft.status === 'filling' || draft.phase === 'filling')) {
      let count = draft.players || 1;
      if (draft.fillingStartedAt != null && draft.fillingInitialPlayers != null) {
        const simulated = Math.min(10, draft.fillingInitialPlayers + Math.floor((now - draft.fillingStartedAt) / 800));
        count = Math.max(count, simulated);
      }
      count = Math.min(10, count);
      if (count >= 10) {
        if (!timers.has(draft.id)) timers.set(draft.id, now);
        const tStart = timers.get(draft.id)!;
        const t = Math.min(1, (now - tStart) / 3000);
        return { displayPhase: 'randomizing', playerCount: 10, countdown: null, randomizingProgress: 0.99 * Math.pow(t, 0.6), isFilling: false };
      }
      return { displayPhase: 'filling', playerCount: count, countdown: null, randomizingProgress: null, isFilling: true };
    }

    if (draft.status === 'filling') {
      return { displayPhase: 'filling', playerCount: draft.players || 1, countdown: null, randomizingProgress: null, isFilling: true };
    }
    return { displayPhase: 'drafting', playerCount: draft.players, countdown: null, randomizingProgress: null, isFilling: false };
  };

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

  const clearAllDrafts = async () => {
    const allIds = activeDrafts.map(d => d.id);
    const storeIds = draftStore.getActiveDrafts().map(d => d.id);
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
    localStorage.removeItem('banana-active-drafts');
    localStorage.removeItem('banana-completed-drafts');
    setQueueDrafts([]);
    fetch('/api/admin/set-entries', { method: 'DELETE' }).catch(() => {});

    const wallet = user?.walletAddress;
    if (wallet && allIds.length > 0) {
      void Promise.allSettled(allIds.map(id => leaveDraft(id, wallet)));
    }
  };

  return {
    contest,
    promosQuery,
    promos,
    promoCount,
    isLoading,
    user,
    activeDrafts,
    regularDrafts,
    specialDrafts,
    creatingQueueDraft,
    exitingDraft,
    showNoPasses,
    selectedPromo,
    claimedPromos,
    claimSuccess,
    promoIndex,
    showEntryFlow,
    showContestDetails,
    infoTopic,
    handleEnterDraft,
    handleEntryComplete,
    handleDraftClick,
    handleClaim,
    confirmExitDraft,
    clearAllDrafts,
    getLiveState,
    setExitingDraft,
    setShowNoPasses,
    setSelectedPromo,
    setPromoIndex,
    setPromoAutoRotate,
    setShowEntryFlow,
    setShowContestDetails,
    setInfoTopic,
  };
}
