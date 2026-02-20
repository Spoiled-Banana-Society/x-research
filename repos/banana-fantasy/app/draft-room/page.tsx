"use client"

import React, { Suspense, useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useDraftAudio } from '@/hooks/useDraftAudio';
import { useDraftEngine } from '@/hooks/useDraftEngine';
import type { DraftMode } from '@/hooks/useDraftEngine';
import { useDraftWebSocket } from '@/hooks/useDraftWebSocket';
import * as draftApi from '@/lib/draftApi';

import { DraftRoomChat } from '@/components/drafting/DraftRoomChat';
import { SlotMachineOverlay } from '@/components/drafting/SlotMachineOverlay';
import { DraftTabs } from '@/components/drafting/DraftTabs';
import type { DraftTab } from '@/components/drafting/DraftTabs';
import { DraftPlayerList } from '@/components/drafting/DraftPlayerList';
import { DraftQueue } from '@/components/drafting/DraftQueue';
import { DraftBoardGrid } from '@/components/drafting/DraftBoardGrid';
import { DraftRoster } from '@/components/drafting/DraftRoster';
import { DraftComplete } from '@/components/drafting/DraftComplete';
import { VerifiedBadge } from '@/components/ui/VerifiedBadge';
import {
  DRAFT_PLAYERS,
  TOTAL_PICKS,
  getPositionColorHex,
  POSITION_COLORS,
  generateReelItemsForReel,
} from '@/lib/draftRoomConstants';
import type { DraftType, RoomPhase } from '@/lib/draftRoomConstants';
import { useNotifOptIn } from '@/app/providers';
import * as draftStore from '@/lib/draftStore';

function DraftRoomContent() {
  const searchParams = useSearchParams();
  const contestName = searchParams.get('name') || 'Draft Room';
  const initialPlayers = parseInt(searchParams.get('players') || '1', 10);
  const draftId = searchParams.get('draftId') || searchParams.get('id') || '';
  const walletParam = searchParams.get('wallet') || '';
  const modeParam = searchParams.get('mode') as DraftMode | null;
  const isLiveMode = modeParam === 'live' && !!draftId && !!walletParam;

  const { user } = useAuth();
  const { playSpinningSound, playReelStop, playCountdownTick, playWinSound } = useDraftAudio();
  const { triggerOptIn } = useNotifOptIn();

  // Draft engine — live mode (including staging) uses 'live' for server-based state
  const engine = useDraftEngine(isLiveMode ? 'live' : 'local');

  // ==================== LIVE MODE STATE ====================
  const [liveLoading, setLiveLoading] = useState(isLiveMode);
  const [liveError, setLiveError] = useState<string | null>(null);
  const liveInitializedRef = useRef(false);

  // ==================== RESTORE FROM STORE ====================
  // Never read store in live mode — server is single source of truth
  const stored = (draftId && !isLiveMode) ? draftStore.getDraft(draftId) : undefined;

  // ==================== PHASE STATE ====================
  const [phase, setPhase] = useState<RoomPhase>(() => {
    if (isLiveMode) return 'loading';
    if (stored?.phase) return stored.phase;
    return 'filling';
  });
  const [playerCount, setPlayerCount] = useState(() => {
    if (stored?.phase === 'filling' && stored.fillingStartedAt) {
      const initPlayers = stored.fillingInitialPlayers ?? Math.max(initialPlayers, 1);
      const elapsed = (Date.now() - stored.fillingStartedAt) / 800;
      return Math.min(10, initPlayers + Math.floor(elapsed));
    }
    if (stored?.phase && stored.phase !== 'filling') return 10;
    return Math.min(Math.max(initialPlayers, 1), 10);
  });
  const [preSpinCountdown, setPreSpinCountdown] = useState(() => {
    if (stored?.preSpinStartedAt) return Math.max(0, Math.floor(15 - (Date.now() - stored.preSpinStartedAt) / 1000));
    return 15;
  });
  const [mainCountdown, setMainCountdown] = useState(() => {
    if (stored?.preSpinStartedAt) return Math.max(0, Math.floor(60 - (Date.now() - stored.preSpinStartedAt) / 1000));
    return 60;
  });
  const [draftType, setDraftType] = useState<DraftType | null>(() => {
    if (stored?.draftType) return stored.draftType;
    return 'pro'; // TESTING: force pro
  });

  // ==================== SLOT MACHINE STATE ====================
  const [allReelItems, setAllReelItems] = useState<DraftType[][]>([[], [], []]);
  const [reelOffsets, setReelOffsets] = useState([0, 0, 0]);
  const [showSlotMachine, setShowSlotMachine] = useState(false);
  const [slotAnimationDone, setSlotAnimationDone] = useState(false);
  const [showFlash, setShowFlash] = useState(false);
  const [screenShake, setScreenShake] = useState(false);
  const [confetti, setConfetti] = useState<Array<{ id: number; x: number; color: string; delay: number }>>([]);
  const [jackpotRain, setJackpotRain] = useState<Array<{ id: number; x: number; delay: number; size: number }>>([]);
  const [particleBurst, setParticleBurst] = useState<Array<{ id: number; x: number; y: number; angle: number; color: string }>>([]);
  const [pulseGlow, setPulseGlow] = useState(false);

  // ==================== DRAFT ORDER STATE (pre-engine) ====================
  const [draftOrder, setDraftOrder] = useState<typeof DRAFT_PLAYERS>(() => {
    if (stored?.draftOrder) return stored.draftOrder;
    return [];
  });
  const [userDraftPosition, setUserDraftPosition] = useState<number>(() => {
    if (stored?.userDraftPosition !== undefined) return stored.userDraftPosition;
    return 0;
  });

  // ==================== DRAFTING UI STATE ====================
  const [activeTab, setActiveTab] = useState<DraftTab>('draft');
  const [isMuted, setIsMuted] = useState(false);
  const bannerRef = useRef<HTMLDivElement>(null);

  // ==================== TIMESTAMP REFS ====================
  const fillingStartedAtRef = useRef<number | null>(stored?.fillingStartedAt ?? null);
  const preSpinStartedAtRef = useRef<number | null>(stored?.preSpinStartedAt ?? null);
  const lastWsUpdateRef = useRef<number>(Date.now());

  // ==================== RESUME: Handle re-mount into mid-phase ====================
  const resumeHandledRef = useRef(false);
  useEffect(() => {
    if (isLiveMode || resumeHandledRef.current || !stored?.phase) return;
    resumeHandledRef.current = true;

    const restoredPhase = stored.phase;

    // If we resumed into pre-spin with countdown already expired, auto-advance
    if (restoredPhase === 'pre-spin' && stored.preSpinStartedAt) {
      const elapsed = (Date.now() - stored.preSpinStartedAt) / 1000;
      if (elapsed >= 60) {
        // Main countdown already expired — jump to drafting
        setPhase('drafting');
        setMainCountdown(0);
        if (draftOrder.length > 0) engine.initializeDraft(draftOrder);
        if (draftId) {
          draftStore.updateDraft(draftId, { status: 'drafting', phase: 'drafting', players: 10, isYourTurn: false });
        }
        return;
      }
    }

    // Resume spinning/result: skip slot animation, show result directly
    if (restoredPhase === 'spinning' || restoredPhase === 'result') {
      if (stored.preSpinStartedAt) {
        const elapsed = (Date.now() - stored.preSpinStartedAt) / 1000;
        if (elapsed >= 60) {
          // Main countdown expired — jump to drafting
          setPhase('drafting');
          setMainCountdown(0);
          if (draftOrder.length > 0) engine.initializeDraft(draftOrder);
          if (draftId) {
            draftStore.updateDraft(draftId, { status: 'drafting', phase: 'drafting', players: 10, isYourTurn: false });
          }
          return;
        }
      }
      // Skip slot animation on resume — go straight to result phase
      setPhase('result');
      setSlotAnimationDone(true);
      setShowSlotMachine(false);
      if (draftId && restoredPhase === 'spinning') {
        draftStore.updateDraft(draftId, { phase: 'result' });
      }
    }

    // Resume drafting: restore full engine state if we have saved picks
    if (restoredPhase === 'drafting') {
      if (draftOrder.length > 0) {
        if (stored.enginePicks && stored.enginePicks.length > 0 && stored.enginePickNumber) {
          engine.restoreDraft(draftOrder, stored.enginePicks, stored.enginePickNumber, stored.engineQueue);
        } else {
          engine.initializeDraft(draftOrder);
        }
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ==================== LIVE MODE: WebSocket + pick handler ====================
  const handleLiveDraft = useCallback((playerId: string) => {
    if (!isLiveMode) {
      engine.draftPlayer(playerId);
      return;
    }
    // In live mode, build payload and send via WebSocket
    const pickPayload = engine.draftPlayer(playerId);
    if (pickPayload) {
      ws.sendPick(pickPayload);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLiveMode, engine.draftPlayer]);

  const handleLiveQueueSync = useCallback((queue: typeof engine.queuedPlayers) => {
    if (!isLiveMode || !draftId || !walletParam) return;
    const payload = queue.map(p => ({
      playerId: p.playerId,
      displayName: p.playerId,
      team: p.team,
      position: p.position,
      ownerAddress: walletParam,
      pickNum: 0,
      round: 0,
    }));
    draftApi.updateQueue(walletParam, draftId, payload).catch(err => {
      console.error('[Queue] REST sync failed:', err);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLiveMode, draftId, walletParam]);

  // WebSocket connection (only in live mode)
  const ws = useDraftWebSocket({
    walletAddress: walletParam,
    draftName: draftId,
    enabled: isLiveMode,  // Connect immediately — don't wait for REST fetch
    onCountdownUpdate: (payload) => {
      engine.handleCountdownUpdate(payload);
    },
    onTimerUpdate: (payload) => {
      engine.handleTimerUpdate(payload);
      lastWsUpdateRef.current = Date.now();
    },
    onNewPick: (payload) => {
      engine.handleNewPick(payload);
      // Re-fetch available players from REST (matches old system)
      if (draftId && walletParam) {
        draftApi.getPlayerRankings(draftId, walletParam).then(fresh => {
          const available = fresh
            .filter(p => p.playerStateInfo.ownerAddress === '')
            .map(p => ({ playerId: p.playerStateInfo.playerId, team: p.playerStateInfo.team, position: p.playerStateInfo.position, adp: p.stats.adp, rank: p.ranking.rank, byeWeek: p.stats.byeWeek, playersFromTeam: p.stats.playersFromTeam || [] }));
          engine.refreshAvailablePlayers(available);
        }).catch(() => {});
      }
    },
    onDraftInfoUpdate: (payload) => {
      // Cast: handler only uses pickNumber + currentDrafter, adp shape differs between WS and engine types
      engine.handleDraftInfoUpdate(payload as unknown as Parameters<typeof engine.handleDraftInfoUpdate>[0]);
    },
    onDraftComplete: () => {
      engine.handleDraftComplete();
    },
    onFinalCard: (payload) => {
      engine.handleFinalCard(payload);
    },
    onNewQueue: (payload) => {
      // Server sent updated queue — sync local state
      const available = engine.availablePlayers;
      const queuePlayers = payload
        .map(q => available.find(a => a.playerId === q.playerId))
        .filter((p): p is NonNullable<typeof p> => p !== undefined);
      engine.reorderQueue(queuePlayers);
    },
    onOpen: () => {
      console.log('[WS] Connected to draft server');
      // Re-sync available players on reconnect (matches old system)
      if (liveInitializedRef.current && draftId && walletParam) {
        draftApi.getPlayerRankings(draftId, walletParam).then(fresh => {
          const available = fresh
            .filter(p => p.playerStateInfo.ownerAddress === '')
            .map(p => ({ playerId: p.playerStateInfo.playerId, team: p.playerStateInfo.team, position: p.playerStateInfo.position, adp: p.stats.adp, rank: p.ranking.rank, byeWeek: p.stats.byeWeek, playersFromTeam: p.stats.playersFromTeam || [] }));
          engine.refreshAvailablePlayers(available);
        }).catch(() => {});
      }
    },
    onClose: () => {
      console.log('[WS] Disconnected from draft server');
    },
  });

  // ==================== LIVE MODE: Load initial state from REST API ====================
  useEffect(() => {
    if (!isLiveMode || liveInitializedRef.current) return;

    async function loadLiveData() {
      try {
        setLiveLoading(true);
        setLiveError(null);

        // Fetch all initial data in parallel
        const [draftInfo, playerRankings, summary, serverRosters, queue] = await Promise.all([
          draftApi.getDraftInfo(draftId),
          draftApi.getPlayerRankings(draftId, walletParam),
          draftApi.getDraftSummary(draftId),
          draftApi.getDraftRosters(draftId),
          draftApi.getQueue(walletParam, draftId),
        ]);

        // Convert types for engine
        const serverDraftInfo = {
          draftId: draftInfo.draftId,
          displayName: draftInfo.displayName,
          draftStartTime: draftInfo.draftStartTime,
          pickLength: draftInfo.pickLength,
          currentDrafter: draftInfo.currentDrafter,
          pickNumber: draftInfo.currentPickNumber,
          roundNum: draftInfo.currentRound,
          pickInRound: draftInfo.pickInRound,
          draftOrder: draftInfo.draftOrder,
          adp: draftInfo.adp.map(a => ({
            adp: a.adp,
            byeWeek: String(a.byeWeek),
            playerId: a.playerId,
          })),
        };

        // Convert queue to ServerPickPayload format
        const queuePayload = queue.map(q => ({
          playerId: q.playerId,
          displayName: q.displayName,
          team: q.team,
          position: q.position,
          ownerAddress: q.ownerAddress,
          pickNum: q.pickNum,
          round: q.round,
        }));

        // Convert rosters
        const rostersForEngine: Record<string, { QB: unknown[]; RB: unknown[]; WR: unknown[]; TE: unknown[]; DST: unknown[] }> = {};
        for (const [addr, roster] of Object.entries(serverRosters)) {
          rostersForEngine[addr] = roster;
        }

        engine.initializeFromServer(
          serverDraftInfo,
          playerRankings,
          summary,
          rostersForEngine,
          queuePayload,
          walletParam,
        );

        // Skip filling/spinning phases in live mode — go straight to drafting
        setPhase('drafting');
        liveInitializedRef.current = true; // Only after success — allows retry on failure
        if (draftId) {
          draftStore.updateDraft(draftId, { phase: 'drafting', status: 'drafting' });
        }
        setLiveLoading(false);
      } catch (err) {
        console.error('[Live Mode] Failed to load draft data:', err);
        setLiveError(err instanceof Error ? err.message : 'Failed to load draft data');
        setLiveLoading(false);
      }
    }

    loadLiveData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLiveMode, draftId, walletParam]);

  // ==================== SYNC DRAFT STATE TO STORE ====================
  // Ensure draft exists in the store on mount (defensive — covers edge cases
  // where addDraft was missed before navigation, e.g. local fallback)
  useEffect(() => {
    if (!draftId) return;
    if (draftStore.getDraft(draftId)) return; // already exists
    const speedParam = searchParams.get('speed') as 'fast' | 'slow' | null;
    draftStore.addDraft({
      id: draftId,
      contestName,
      status: 'filling',
      type: null,
      draftSpeed: speedParam || 'fast',
      players: initialPlayers,
      maxPlayers: 10,
      joinedAt: Date.now(),
      phase: 'filling',
      fillingStartedAt: Date.now(),
      fillingInitialPlayers: Math.max(initialPlayers, 1),
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draftId]);

  // Syncs pick progress, turn status, and engine state to localStorage
  useEffect(() => {
    if (!draftId || phase !== 'drafting') return;
    if (engine.draftStatus === 'completed') return;
    draftStore.updateDraft(draftId, {
      currentPick: engine.turnsUntilUserPick,
      totalPicks: engine.picks.length,
      isYourTurn: engine.isUserTurn,
      timeRemaining: engine.isUserTurn ? engine.timeRemaining : undefined,
      // Save engine state so draft can resume after leaving
      enginePicks: engine.picks,
      enginePickNumber: engine.currentPickNumber,
      engineQueue: engine.queuedPlayers,
    });
  }, [draftId, phase, engine.currentPickNumber, engine.isUserTurn, engine.timeRemaining, engine.turnsUntilUserPick, engine.draftStatus, engine.picks.length, engine.picks, engine.queuedPlayers]);

  // Write 6: Draft completes — remove from active drafts
  useEffect(() => {
    if (engine.draftStatus === 'completed' && draftId) {
      draftStore.removeDraft(draftId);
    }
  }, [engine.draftStatus, draftId]);

  // Trigger notification opt-in when draft completes
  useEffect(() => {
    if (engine.draftStatus === 'completed') {
      triggerOptIn('post-draft');
    }
  }, [engine.draftStatus, triggerOptIn]);

  // ==================== FILLING PHASE ====================
  useEffect(() => {
    if (isLiveMode) return; // Skip filling in all live modes — REST fetch handles initialization
    if (phase !== 'filling') return;

    // Record filling start timestamp (only if not already set by addDraft)
    if (!fillingStartedAtRef.current) {
      fillingStartedAtRef.current = Date.now();
      if (draftId) {
        draftStore.updateDraft(draftId, { phase: 'filling', fillingStartedAt: fillingStartedAtRef.current, fillingInitialPlayers: Math.max(initialPlayers, 1) });
      }
    }

    // If already at 10, skip directly
    if (playerCount >= 10) return;

    const fillingInterval = 800;
    const startedAt = fillingStartedAtRef.current;
    const initPlayers = stored?.fillingInitialPlayers ?? Math.max(initialPlayers, 1);
    const interval = setInterval(() => {
      const elapsed = (Date.now() - startedAt) / fillingInterval;
      const count = Math.min(10, initPlayers + Math.floor(elapsed));
      setPlayerCount(prev => {
        if (prev >= 10) { clearInterval(interval); return 10; }
        if (count <= prev) return prev;
        // Sync filling progress to drafting page
        if (draftId) {
          draftStore.updateDraft(draftId, { players: count, status: 'filling' });
        }
        return count;
      });
    }, fillingInterval);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  useEffect(() => {
    if (phase === 'filling' && playerCount >= 10) {
      // Use stored draft order if resuming, else shuffle fresh
      let shuffled = draftOrder;
      let userPos = userDraftPosition;
      if (shuffled.length === 0) {
        shuffled = [...DRAFT_PLAYERS].sort(() => Math.random() - 0.5);
        userPos = shuffled.findIndex(p => p.isYou);
        setDraftOrder(shuffled);
        setUserDraftPosition(userPos);
      }

      const now = Date.now();
      preSpinStartedAtRef.current = now;
      setPhase('pre-spin');
      setPreSpinCountdown(15);
      setMainCountdown(60);

      if (draftId) {
        draftStore.updateDraft(draftId, {
          phase: 'pre-spin',
          preSpinStartedAt: now,
          draftOrder: shuffled,
          userDraftPosition: userPos,
        });
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, playerCount]);

  // ==================== PRE-SPIN COUNTDOWN (timestamp-based) ====================
  useEffect(() => {
    if (phase !== 'pre-spin') return;
    const startedAt = preSpinStartedAtRef.current;
    if (!startedAt) return;

    const tick = () => {
      const elapsed = (Date.now() - startedAt) / 1000;
      const preSpin = Math.max(0, Math.floor(15 - elapsed));
      const main = Math.max(0, Math.floor(60 - elapsed));
      setPreSpinCountdown(preSpin);
      setMainCountdown(main);
    };
    tick(); // immediate

    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [phase]);

  // Transition from pre-spin to spinning when preSpinCountdown hits 0
  useEffect(() => {
    if (phase !== 'pre-spin') return;
    if (preSpinCountdown > 0) return;

    const selectedResult: DraftType = draftType || 'pro';
    const reelResults: DraftType[] = [selectedResult, selectedResult, selectedResult];
    setDraftType(selectedResult);
    // Sync revealed type + draft position to drafting page
    if (draftId) {
      draftStore.updateDraft(draftId, {
        type: selectedResult,
        phase: 'spinning',
        draftType: selectedResult,
        yourPosition: userDraftPosition >= 0 ? userDraftPosition + 1 : undefined,
      });
    }
    setAllReelItems([
      generateReelItemsForReel(reelResults[0], 0),
      generateReelItemsForReel(reelResults[1], 1),
      generateReelItemsForReel(reelResults[2], 2),
    ]);
    setShowSlotMachine(true);
    setSlotAnimationDone(false);
    setPhase('spinning');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, preSpinCountdown]);

  // Main countdown (timestamp-based, for spinning/result phases)
  useEffect(() => {
    if (phase !== 'spinning' && phase !== 'result') return;
    const startedAt = preSpinStartedAtRef.current;
    if (!startedAt) return;

    const tick = () => {
      const elapsed = (Date.now() - startedAt) / 1000;
      const main = Math.max(0, Math.floor(60 - elapsed));
      setMainCountdown(prev => {
        if (main < prev && main <= 10 && main > 0) playCountdownTick();
        return main;
      });
    };
    tick(); // immediate

    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [phase, playCountdownTick]);

  // ==================== DRAFT START ====================
  useEffect(() => {
    if (phase !== 'pre-spin' && phase !== 'spinning' && phase !== 'result') return;
    if (mainCountdown <= 0) {
      setPhase('drafting');
      setShowSlotMachine(false);
      setScreenShake(false);
      setJackpotRain([]);
      setConfetti([]);
      setPulseGlow(false);
      setParticleBurst([]);
      // Initialize the draft engine with the shuffled order
      if (draftOrder.length > 0) {
        engine.initializeDraft(draftOrder);
      }
      // Sync draft start to drafting page
      if (draftId) {
        draftStore.updateDraft(draftId, {
          status: 'drafting',
          phase: 'drafting',
          players: 10,
          isYourTurn: false,
        });
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, mainCountdown, draftOrder]);

  useEffect(() => {
    if (mainCountdown <= 15 && showSlotMachine && slotAnimationDone) setShowSlotMachine(false);
  }, [mainCountdown, showSlotMachine, slotAnimationDone]);

  useEffect(() => {
    if (mainCountdown <= 15 && screenShake) setScreenShake(false);
  }, [mainCountdown, screenShake]);

  // Continuous rain while shaking
  useEffect(() => {
    if (!screenShake) { setJackpotRain([]); return; }
    const interval = setInterval(() => {
      setJackpotRain(Array.from({ length: 25 }, (_, i) => ({
        id: Date.now() + i,
        x: Math.random() * 100,
        delay: Math.random() * 2,
        size: 20 + Math.random() * 20,
      })));
    }, 3000);
    return () => clearInterval(interval);
  }, [screenShake]);

  // ==================== SPINNING ANIMATION ====================
  useEffect(() => {
    if (phase !== 'spinning') return;
    if (allReelItems[0]?.length === 0) return;

    const itemHeight = 130;
    const landingIndex = (allReelItems[0]?.length || 50) - 8;
    const targetOffset = landingIndex * itemHeight;
    const reelDurations = [2000, 4000, 6000];
    const startTime = performance.now();
    let animationId: number;
    const stoppedReels = [false, false, false];
    const easeOutQuint = (t: number): number => 1 - Math.pow(1 - t, 5);

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const newOffsets = [0, 0, 0];
      let allStopped = true;

      for (let i = 0; i < 3; i++) {
        const progress = Math.min(elapsed / reelDurations[i], 1);
        newOffsets[i] = easeOutQuint(progress) * targetOffset;
        if (progress >= 1 && !stoppedReels[i]) { stoppedReels[i] = true; playReelStop(); }
        if (progress < 1) allStopped = false;
      }

      setReelOffsets(newOffsets);

      if (!allStopped) {
        animationId = requestAnimationFrame(animate);
      } else {
        setReelOffsets([targetOffset, targetOffset, targetOffset]);
        setShowFlash(true);
        setTimeout(() => setShowFlash(false), 150);

        if (draftType === 'jackpot' || draftType === 'hof') {
          setScreenShake(true);
          setPulseGlow(true);

          const colors = draftType === 'jackpot'
            ? ['#ef4444', '#f97316', '#fbbf24', '#ffffff', '#ff6b6b', '#ffd93d']
            : ['#FFD700', '#FFA500', '#ffffff', '#fbbf24', '#ffe066', '#ffb347'];

          setConfetti(Array.from({ length: 150 }, (_, i) => ({
            id: i, x: Math.random() * 100,
            color: colors[Math.floor(Math.random() * colors.length)],
            delay: Math.random() * 0.3,
          })));
          setTimeout(() => {
            setConfetti(prev => [...prev, ...Array.from({ length: 100 }, (_, i) => ({
              id: 200 + i, x: Math.random() * 100,
              color: colors[Math.floor(Math.random() * colors.length)],
              delay: Math.random() * 0.3,
            }))]);
          }, 1000);
          setTimeout(() => setConfetti([]), 6000);

          setParticleBurst(Array.from({ length: 40 }, (_, i) => ({
            id: i, x: 50, y: 40, angle: (i / 40) * 360,
            color: colors[Math.floor(Math.random() * colors.length)],
          })));
          setTimeout(() => setParticleBurst([]), 1500);

          setJackpotRain(Array.from({ length: 35 }, (_, i) => ({
            id: i, x: Math.random() * 100,
            delay: Math.random() * 2.5,
            size: 16 + Math.random() * 24,
          })));
        }

        setTimeout(() => {
          playWinSound(draftType === 'jackpot' || draftType === 'hof');
          setSlotAnimationDone(true);
          setPhase('result');
          if (draftId) {
            draftStore.updateDraft(draftId, { phase: 'result' });
          }
        }, 400);
      }
    };

    const startTimeout = setTimeout(() => {
      playSpinningSound();
      animationId = requestAnimationFrame(animate);
    }, 200);

    return () => {
      clearTimeout(startTimeout);
      if (animationId) cancelAnimationFrame(animationId);
    };
  }, [phase, allReelItems, draftType, playReelStop, playWinSound, playSpinningSound]);

  // ==================== AUTO-SCROLL BANNER TO CURRENT PICK ====================
  useEffect(() => {
    if (phase !== 'drafting' || !bannerRef.current) return;
    const currentCard = bannerRef.current.querySelector(`[data-pick="${engine.currentPickNumber}"]`);
    if (currentCard) {
      currentCard.scrollIntoView({ behavior: 'smooth', inline: 'start', block: 'nearest' });
    }
  }, [phase, engine.currentPickNumber]);

  // ==================== FREEZE DETECTION (matches old system) ====================
  useEffect(() => {
    if (!isLiveMode || phase !== 'drafting' || engine.draftStatus === 'completed') return;
    const check = setTimeout(() => {
      if (Date.now() - lastWsUpdateRef.current > 10_000) {
        console.log('[Freeze] No timer update in 10s, forcing reconnect');
        ws.forceReconnect();
      }
    }, 3000);
    return () => clearTimeout(check);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLiveMode, phase, engine.draftStatus, engine.timeRemaining]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m < 10 ? `0${m}` : m}:${s < 10 ? `0${s}` : s}`;
  };

  const getBgColor = () => {
    if ((phase === 'result' || phase === 'drafting') && draftType) {
      if (draftType === 'jackpot') return 'bg-gradient-to-b from-red-950 to-red-950/50';
      if (draftType === 'hof') return 'bg-gradient-to-b from-yellow-950 to-yellow-950/50';
    }
    return 'bg-black';
  };

  // Helper to get position counts for banner cards
  const getPositionCountsForPlayer = (playerName: string) => {
    const roster = engine.rosters[playerName];
    if (!roster) return { QB: 0, RB: 0, WR: 0, TE: 0, DST: 0 };
    return {
      QB: roster.QB.length,
      RB: roster.RB.length,
      WR: roster.WR.length,
      TE: roster.TE.length,
      DST: roster.DST.length,
    };
  };

  // Roster view switch
  const handleViewRoster = (_playerName: string) => {
    setActiveTab('roster');
  };

  // ==================== RENDER ====================
  return (
    <div className={`min-h-screen text-white overflow-hidden flex flex-col transition-colors duration-1000 ${getBgColor()} ${screenShake ? 'animate-shake' : ''}`}>
      {/* Flash overlay */}
      {showFlash && <div className="fixed inset-0 z-50 bg-white/30 pointer-events-none animate-flash" />}

      {/* Confetti */}
      {confetti.length > 0 && (
        <div className="fixed inset-0 z-40 pointer-events-none overflow-hidden">
          {confetti.map((particle) => (
            <div
              key={particle.id}
              className="absolute animate-confetti"
              style={{
                left: `${particle.x}%`,
                backgroundColor: particle.color,
                animationDelay: `${particle.delay}s`,
                borderRadius: Math.random() > 0.5 ? '50%' : '0',
                width: `${8 + Math.random() * 8}px`,
                height: `${8 + Math.random() * 8}px`,
              }}
            />
          ))}
        </div>
      )}

      {/* Particle Burst */}
      {particleBurst.length > 0 && (
        <div className="fixed inset-0 z-45 pointer-events-none overflow-hidden">
          {particleBurst.map((particle) => {
            const rad = (particle.angle * Math.PI) / 180;
            return (
              <div
                key={particle.id}
                className="absolute w-4 h-4 rounded-full animate-burst"
                style={{
                  left: `${particle.x}%`, top: `${particle.y}%`,
                  backgroundColor: particle.color,
                  '--end-x': `${Math.cos(rad) * 400}px`,
                  '--end-y': `${Math.sin(rad) * 400}px`,
                  boxShadow: `0 0 10px ${particle.color}`,
                } as React.CSSProperties}
              />
            );
          })}
        </div>
      )}

      {/* Pulsing glow */}
      {pulseGlow && draftType && (draftType === 'jackpot' || draftType === 'hof') && (
        <div
          className="fixed inset-0 z-30 pointer-events-none animate-pulse-glow"
          style={{
            background: draftType === 'jackpot'
              ? 'radial-gradient(circle at center, rgba(239, 68, 68, 0.3) 0%, transparent 70%)'
              : 'radial-gradient(circle at center, rgba(255, 215, 0, 0.3) 0%, transparent 70%)',
          }}
        />
      )}

      {/* Text Rain */}
      {jackpotRain.length > 0 && draftType && (
        <div className="fixed inset-0 z-[60] pointer-events-none overflow-hidden">
          {jackpotRain.map((item) => (
            <div
              key={item.id}
              className={`absolute animate-jackpot-rain font-black italic ${draftType === 'jackpot' ? 'text-red-500' : 'text-yellow-400'}`}
              style={{
                left: `${item.x}%`, fontSize: `${item.size}px`,
                animationDelay: `${item.delay}s`,
                textShadow: draftType === 'jackpot'
                  ? '0 0 10px rgba(239, 68, 68, 0.8)'
                  : '0 0 10px rgba(250, 204, 21, 0.8)',
              }}
            >
              {draftType === 'jackpot' ? 'JACKPOT' : 'HOF'}
            </div>
          ))}
        </div>
      )}

      {/* Top Bar */}
      {!(phase === 'drafting' && engine.draftStatus !== 'completed') && (
        <div className="h-14 bg-black/30 border-b border-white/10 flex items-center justify-between px-4 flex-shrink-0">
          <div className="flex items-center gap-4">
            <span className="font-bold">{contestName}</span>
            {draftType && phase !== 'filling' && (
              <>
                <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                  draftType === 'jackpot' ? 'bg-red-500/30 text-red-400' :
                  draftType === 'hof' ? 'bg-yellow-500/30 text-yellow-400' :
                  'bg-purple-500/30 text-purple-400'
                }`}>{draftType.toUpperCase()}</span>
                <VerifiedBadge type="draft-type" draftType={draftType} />
              </>
            )}
            {phase === 'filling' && (
              <span className="px-2 py-0.5 rounded text-xs font-bold bg-white/10 text-white/50">UNREVEALED</span>
            )}
          </div>
          <div className="flex items-center gap-4">
            {phase === 'drafting' && engine.draftStatus === 'active' && (
              <>
                {engine.isUserTurn && (
                  <div className={`px-3 py-1 rounded-full text-sm font-bold ${
                    engine.timeRemaining <= 10 ? 'bg-red-500 animate-pulse' : 'bg-yellow-500 text-black'
                  }`}>
                    {formatTime(engine.timeRemaining)}
                  </div>
                )}
                <span className="text-white/50 text-sm">Pick {engine.currentPickNumber}/{TOTAL_PICKS}</span>
              </>
            )}
          </div>
        </div>
      )}

      {/* Live mode loading overlay */}
      {isLiveMode && liveLoading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center">
          <div className="text-center">
            <div className="text-5xl mb-4">🍌</div>
            <p className="text-xl text-white font-bold mb-2">Connecting to draft...</p>
            <div className="flex items-center justify-center gap-2">
              <div className="w-2 h-2 rounded-full bg-banana animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-2 h-2 rounded-full bg-banana animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-2 h-2 rounded-full bg-banana animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        </div>
      )}

      {/* Live mode error overlay */}
      {isLiveMode && liveError && (
        <div className="absolute inset-0 z-10 flex items-center justify-center">
          <div className="text-center max-w-md">
            <div className="text-5xl mb-4">⚠️</div>
            <p className="text-xl text-red-400 font-bold mb-2">Failed to connect</p>
            <p className="text-white/50 text-sm mb-4">{liveError}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2 bg-banana text-black font-bold rounded-lg hover:bg-banana-light transition-all"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Live mode connection indicator */}
      {isLiveMode && (phase === 'drafting' || phase === 'loading') && (
        <div className="absolute top-16 right-4 z-20 flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${ws.isConnected ? 'bg-green-500' : 'bg-red-500 animate-pulse'}`} />
          <span className="text-xs text-white/40">{ws.isConnected ? 'Connected' : 'Reconnecting...'}</span>
        </div>
      )}

      {/* Centered status overlays (pre-drafting phases) */}
      {phase === 'filling' && !isLiveMode && (
        <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
          <div className="text-center">
            <div className="text-8xl font-black text-yellow-400 tabular-nums mb-4" style={{ textShadow: '0 0 60px rgba(250, 204, 21, 0.4)' }}>
              {playerCount}/10
            </div>
            <p className="text-2xl text-white/60 font-medium">Waiting for players...</p>
            <div className="mt-8 flex items-center justify-center gap-3 text-sm text-white/40">
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
                Room fills
              </span>
              <span>→</span>
              <span>Draft type revealed — <span className="text-red-400">Jackpot</span>, <span className="text-yellow-400">HOF</span>, or <span className="text-purple-400">Pro</span></span>
              <span>→</span>
              <span>Draft begins</span>
            </div>
          </div>
        </div>
      )}

      {phase === 'pre-spin' && (
        <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
          <div className="text-center">
            <p className="text-sm text-white/40 uppercase tracking-widest mb-1">Draft starts in</p>
            <div className="text-8xl font-black text-white tabular-nums mb-8" style={{ textShadow: '0 0 60px rgba(255, 255, 255, 0.3)' }}>
              {formatTime(mainCountdown)}
            </div>
            <p className="text-lg text-yellow-400/70 uppercase tracking-widest mb-1">Reveal in</p>
            <div className="text-5xl font-bold text-yellow-400 tabular-nums" style={{ textShadow: '0 0 30px rgba(250, 204, 21, 0.4)' }}>
              {preSpinCountdown}
            </div>
            {userDraftPosition >= 0 && (
              <p className="mt-8 text-xl text-white/60">
                Your pick position: <span className="font-bold text-yellow-400">#{userDraftPosition + 1}</span>
              </p>
            )}
          </div>
        </div>
      )}

      {(phase === 'spinning' || phase === 'result') && !showSlotMachine && (
        <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
          <div className="text-center">
            <p className="text-xl text-white/50 uppercase tracking-widest mb-2">Draft starting in</p>
            <div className="text-8xl font-black text-white tabular-nums" style={{ textShadow: '0 0 60px rgba(255, 255, 255, 0.3)' }}>
              {formatTime(mainCountdown)}
            </div>
            {userDraftPosition >= 0 && (
              <p className="mt-6 text-xl text-yellow-400">
                Your pick position: <span className="font-bold">#{userDraftPosition + 1}</span>
              </p>
            )}
          </div>
        </div>
      )}

      {/* ==================== DRAFTING PHASE ==================== */}
      {phase === 'drafting' && engine.draftStatus !== 'completed' && (
        <>
          {/* Pick Cards Banner */}
          <div className="fixed top-0 left-0 z-20 w-full overflow-hidden font-primary" style={{ backgroundColor: draftType === 'jackpot' ? '#ef4444' : draftType === 'hof' ? '#B8960C' : '#000' }}>
            <div
              ref={bannerRef}
              className="w-full flex gap-2 lg:gap-5 overflow-x-auto banner-no-scrollbar"
              style={{ marginTop: '15px' }}
            >
              {engine.draftSummary.map((slot) => {
                const isPicked = slot.playerId !== '';
                const isCurrent = slot.pickNum === engine.currentPickNumber;
                const isUpcoming = slot.pickNum > engine.currentPickNumber;
                const isUserCard = slot.ownerIndex === engine.userDraftPosition;
                const posHex = isPicked ? getPositionColorHex(slot.position) : '';
                const counts = getPositionCountsForPlayer(slot.ownerName);

                // Border color: user = banana yellow, current = white, others = #444
                const borderColor = isUserCard ? '#F3E216' : isCurrent ? '#fff' : '#444';
                // Text color based on league level
                const textColor = draftType === 'hof' && isUserCard ? '#111'
                  : draftType === 'jackpot' && isUserCard ? '#222'
                  : '#fff';

                const playerData = engine.draftOrder[slot.ownerIndex];
                const displayName = playerData
                  ? (playerData.isYou ? (playerData.displayName || 'You') : (playerData.displayName || playerData.name))
                  : slot.ownerName;
                const truncatedName = displayName.length > 12 ? displayName.substring(0, 10) + '...' : displayName;

                // Position label color: use textColor for user cards in HOF/Jackpot
                const posLabelColor = (isUserCard && (draftType === 'hof' || draftType === 'jackpot'));

                return (
                  <div
                    key={slot.pickNum}
                    data-pick={slot.pickNum}
                    className="flex-shrink-0 text-center overflow-hidden cursor-pointer hover:bg-[#333] hover:border-white"
                    style={{
                      minWidth: '140px',
                      flex: 1,
                      padding: '10px 0 0 0',
                      borderRadius: '5px',
                      borderWidth: isCurrent ? 2 : 1,
                      borderStyle: 'solid',
                      borderColor: borderColor,
                      position: 'relative',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: isUserCard
                        ? (draftType === 'hof' ? '#F3E216' : draftType === 'jackpot' ? '#FF474C' : '#222')
                        : '#222',
                    }}
                    onClick={() => handleViewRoster(slot.ownerName)}
                  >
                    {/* Profile image */}
                    <div className="mb-1">
                      {isUserCard && user?.profilePicture ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={user.profilePicture} alt="You" className="rounded-full w-[30px] h-[30px] mx-auto border border-gray-500 object-cover" />
                      ) : (
                        <span className="inline-block w-[30px] h-[30px] leading-[30px] text-center">🍌</span>
                      )}
                    </div>

                    {isPicked ? (
                      /* COMPLETED pick: display name then playerId with position-colored bottom border */
                      <div>
                        {/* Display name */}
                        <div className="lg:mt-1 font-bold text-[11px] lg:text-[14px] font-primary" style={{ color: textColor }}>
                          {truncatedName}
                        </div>
                        <div style={{ width: '100%', height: '55px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <p className="font-primary" style={{ fontWeight: 800, fontSize: 15, textAlign: 'center', color: textColor }}>{slot.playerId}</p>
                        </div>
                        <div style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: 5, backgroundColor: posHex, borderRadius: '0 0 4px 4px' }} />
                      </div>
                    ) : isCurrent ? (
                      /* CURRENT pick: Timer countdown + display name + "Picking..." with white bottom border */
                      <div>
                        {/* Actual countdown timer — bold 18px, centered, color changes at 10s */}
                        <div style={{
                          fontWeight: 'bold',
                          fontSize: '18px',
                          margin: '5px auto 0px auto',
                          textAlign: 'center',
                          color: engine.timeRemaining > 10
                            ? (isUserCard && (draftType === 'hof' || draftType === 'jackpot') ? textColor : '#fff')
                            : (draftType === 'jackpot' ? 'yellow' : 'red'),
                        }}>
                          {formatTime(engine.timeRemaining)}
                        </div>
                        {/* Display name */}
                        <div className="lg:mt-1 font-bold text-[11px] lg:text-[14px] font-primary" style={{ color: textColor }}>
                          {truncatedName}
                        </div>
                        {/* "Picking..." section */}
                        <div style={{ width: '100%', minHeight: '54px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <p className="font-bold italic text-center pt-2 font-primary" style={{ fontSize: '15px', color: textColor }}>
                            {engine.timeRemaining === 0 ? 'Starting soon!' : 'Picking...'}
                          </p>
                        </div>
                        <div style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: 5, backgroundColor: '#fff', borderRadius: '0 0 4px 4px' }} />
                      </div>
                    ) : isUpcoming ? (
                      /* UPCOMING pick: R/P label (separated) + display name + position counts */
                      <div>
                        {/* R and P labels first */}
                        <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 15, marginTop: 5, paddingBottom: 3 }}>
                          <span style={{ fontSize: '15px', fontWeight: 800, color: textColor }}>R{slot.round}</span>
                          <span style={{ fontSize: '15px', fontWeight: 800, color: textColor }}>P{slot.pickNum}</span>
                        </div>
                        {/* Display name */}
                        <div className="lg:mt-1 font-bold text-[11px] lg:text-[14px] font-primary" style={{ color: textColor }}>
                          {truncatedName}
                        </div>
                        <div className="flex" style={{ marginTop: '4px' }}>
                          {(['QB', 'RB', 'WR', 'TE', 'DST'] as const).map(pos => (
                            <div
                              key={pos}
                              style={{ flex: 1, borderTopWidth: '2px', borderTopStyle: 'solid', borderTopColor: posLabelColor ? textColor : POSITION_COLORS[pos], textAlign: 'center', padding: '2px 0' }}
                            >
                              <div style={{ fontSize: '10px', color: posLabelColor ? textColor : POSITION_COLORS[pos] }}>{pos}</div>
                              <div className="text-xs" style={{ color: textColor }}>{counts[pos]}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      /* Fallback for past picks without data */
                      <div style={{ fontSize: '15px', fontWeight: 800, color: textColor }}>
                        R{slot.round} P{slot.pickNum}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Status text below banner — inherits color from parent (white for pro, black for HOF/Jackpot) */}
            <div className="grow text-center uppercase text-sm font-bold px-3 pt-2 mt-3 font-primary">
              {engine.isUserTurn
                ? 'Your turn to draft!'
                : engine.turnsUntilUserPick > 0
                  ? `${engine.turnsUntilUserPick} turn(s) until your pick!`
                  : 'Draft will start soon'}
            </div>

            {/* Mute button + league logo row */}
            <div className="flex items-center justify-center py-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.15)' }}>
              {draftType === 'hof' && (
                <div>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/hof-logo.jpg" alt="Hall of Fame" className="w-[50px] mr-2 h-auto" style={{ filter: 'sepia(100%) saturate(400%) brightness(110%) hue-rotate(10deg)' }} />
                </div>
              )}
              {draftType === 'jackpot' && (
                <div style={{ marginRight: '5px' }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/jackpot-logo.png" alt="Jackpot" className="w-[100px] mr-2 h-auto" />
                </div>
              )}
              <div>
                <button
                  onClick={() => setIsMuted(!isMuted)}
                  className="text-[12px] text-right cursor-pointer flex items-center justify-end border border-gray-500 px-1 mr-2 font-primary"
                >
                  {isMuted ? 'UNMUTE' : 'MUTE'} <span className="ml-1">🎵</span>
                </button>
              </div>
            </div>
          </div>

          {/* Spacer after fixed banner */}
          <div style={{ height: '290px', flexShrink: 0, backgroundColor: '#000' }} />

          {/* Tab navigation */}
          <DraftTabs activeTab={activeTab} onTabChange={setActiveTab} queueCount={engine.queuedPlayers.length} />
        </>
      )}

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Tab content area */}
        {phase === 'drafting' && engine.draftStatus === 'completed' ? (
          <DraftComplete />
        ) : phase === 'drafting' ? (
          <div className="flex-1 flex flex-col overflow-hidden">
            {activeTab === 'draft' && (
              <DraftPlayerList
                availablePlayers={engine.availablePlayers}
                isUserTurn={engine.isUserTurn}
                onDraft={handleLiveDraft}
                onAddToQueue={(player) => {
                  engine.addToQueue(player);
                  // In live mode, sync queue after add
                  if (isLiveMode) {
                    const newQueue = [...engine.queuedPlayers, player];
                    handleLiveQueueSync(newQueue);
                  }
                }}
                onRemoveFromQueue={(playerId) => {
                  engine.removeFromQueue(playerId);
                  // In live mode, sync queue after remove
                  if (isLiveMode) {
                    const newQueue = engine.queuedPlayers.filter(p => p.playerId !== playerId);
                    handleLiveQueueSync(newQueue);
                  }
                }}
                isInQueue={(playerId) => engine.isInQueue(playerId)}
              />
            )}
            {activeTab === 'queue' && (
              <DraftQueue
                queuedPlayers={engine.queuedPlayers}
                availablePlayers={engine.availablePlayers}
                isUserTurn={engine.isUserTurn}
                onDraft={handleLiveDraft}
                onRemoveFromQueue={(playerId) => {
                  engine.removeFromQueue(playerId);
                  if (isLiveMode) {
                    const newQueue = engine.queuedPlayers.filter(p => p.playerId !== playerId);
                    handleLiveQueueSync(newQueue);
                  }
                }}
                onReorderQueue={(newOrder) => {
                  engine.reorderQueue(newOrder);
                  if (isLiveMode) handleLiveQueueSync(newOrder);
                }}
              />
            )}
            {activeTab === 'board' && (
              <DraftBoardGrid
                draftOrder={engine.draftOrder}
                draftSummary={engine.draftSummary}
                currentPickNumber={engine.currentPickNumber}
                userDraftPosition={engine.userDraftPosition}
                onViewRoster={handleViewRoster}
              />
            )}
            {activeTab === 'roster' && (
              <DraftRoster
                draftOrder={engine.draftOrder}
                rosters={engine.rosters}
                picks={engine.picks}
                userDraftPosition={engine.userDraftPosition}
              />
            )}
          </div>
        ) : (
          // Pre-drafting phase: show empty content area (overlays handle the display)
          <div className="flex-1" />
        )}

        {/* Chat sidebar - hidden during active drafting */}
        {!(phase === 'drafting' && engine.draftStatus !== 'completed') && (
          <DraftRoomChat
            playerCount={playerCount}
            phase={phase}
            username={user?.username}
          />
        )}
      </div>

      {/* Slot Machine Overlay */}
      {showSlotMachine && (
        <SlotMachineOverlay
          allReelItems={allReelItems}
          reelOffsets={reelOffsets}
          draftType={draftType}
          phase={phase}
          mainCountdown={mainCountdown}
          slotAnimationDone={slotAnimationDone}
          formatTime={formatTime}
          onClose={() => slotAnimationDone && setShowSlotMachine(false)}
        />
      )}

      <style jsx>{`
        @keyframes shake {
          0%, 100% { transform: translate(0, 0); }
          10% { transform: translate(-5px, -3px); }
          20% { transform: translate(5px, 3px); }
          30% { transform: translate(-5px, 3px); }
          40% { transform: translate(5px, -3px); }
          50% { transform: translate(-3px, 5px); }
          60% { transform: translate(3px, -5px); }
          70% { transform: translate(-3px, -3px); }
          80% { transform: translate(3px, 3px); }
          90% { transform: translate(-2px, 2px); }
        }
        .animate-shake { animation: shake 0.15s ease-in-out infinite; }
        @keyframes flash { 0% { opacity: 0.5; } 100% { opacity: 0; } }
        .animate-flash { animation: flash 0.15s ease-out forwards; }
        @keyframes confetti {
          0% { transform: translateY(-10px) rotate(0deg); opacity: 1; }
          100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }
        .animate-confetti { animation: confetti 3s ease-out forwards; }
        @keyframes jackpot-rain {
          0% { transform: translateY(-50px) rotate(-5deg); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translateY(100vh) rotate(5deg); opacity: 0; }
        }
        .animate-jackpot-rain { animation: jackpot-rain 4s ease-in forwards; }
        @keyframes result-appear {
          0% { transform: translateY(20px); opacity: 0; }
          100% { transform: translateY(0); opacity: 1; }
        }
        .animate-result-appear { animation: result-appear 0.5s ease-out forwards; }
        @keyframes burst {
          0% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
          100% { transform: translate(calc(-50% + var(--end-x)), calc(-50% + var(--end-y))) scale(0); opacity: 0; }
        }
        .animate-burst { animation: burst 1.2s ease-out forwards; }
        @keyframes pulse-glow {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.6; }
        }
        .animate-pulse-glow { animation: pulse-glow 1s ease-in-out infinite; }
        .banner-no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .banner-no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}

export default function DraftRoomPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black" />}>
      <DraftRoomContent />
    </Suspense>
  );
}
