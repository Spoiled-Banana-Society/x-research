"use client"

import React, { Suspense, useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useDraftAudio } from '@/hooks/useDraftAudio';
import { useDraftEngine } from '@/hooks/useDraftEngine';
import type { DraftMode } from '@/hooks/useDraftEngine';
import { useDraftWebSocket } from '@/hooks/useDraftWebSocket';
import { useRealTimeDraftInfo } from '@/hooks/useRealTimeDraftInfo';
import { useTimeRemaining } from '@/hooks/useTimeRemaining';
import * as draftApi from '@/lib/draftApi';
import { leaveDraft } from '@/lib/api/leagues';

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
import { isStagingMode, getStagingApiUrl } from '@/lib/staging';
import { getDraftTokenLevel } from '@/lib/api/leagues';
import { isFirebaseAvailable } from '@/lib/api/firebase';

function DraftRoomContent() {
  const searchParams = useSearchParams();
  const contestName = searchParams.get('name') || 'Draft Room';
  const initialPlayers = parseInt(searchParams.get('players') || '1', 10);
  const urlDraftId = searchParams.get('draftId') || searchParams.get('id') || '';
  const walletParam = searchParams.get('wallet') || '';
  const modeParam = searchParams.get('mode') as DraftMode | null;
  const speedParam = searchParams.get('speed') as 'fast' | 'slow' | null;
  const passTypeParam = searchParams.get('passType') as 'paid' | 'free' | null;
  const isPaidDraft = passTypeParam !== 'free'; // Default to paid if not specified
  const specialTypeParam = searchParams.get('specialType') as 'jackpot' | 'hof' | null; // Forces slot machine result for special drafts

  // draftId is stateful — starts empty when navigating before joinDraft completes
  const [draftId, setDraftId] = useState(urlDraftId);
  const draftIdRef = useRef(draftId);
  draftIdRef.current = draftId;
  const isLiveMode = modeParam === 'live' && !!walletParam;

  const { user } = useAuth();
  const { playSpinningSound, playReelStop, playCountdownTick, playWinSound, playYourTurnSound, playNewPickSound, cleanup: cleanupAudio } = useDraftAudio();
  const { triggerOptIn } = useNotifOptIn();

  // Cleanup audio on unmount — stops all scheduled sounds when leaving the page
  useEffect(() => {
    return () => cleanupAudio();
  }, [cleanupAudio]);

  // Fallback: when server APIs can't provide player data, switch to local mode
  // so bots auto-play, local timer ticks, and ALL_POSITIONS provides 224 NFL players
  const [fallbackLocal, setFallbackLocal] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [leaving, setLeaving] = useState(false);

  // Draft engine — live mode uses 'live' for server state; fallbackLocal overrides to 'local'
  const engine = useDraftEngine(isLiveMode && !fallbackLocal ? 'live' : 'local');

  // ==================== LIVE MODE STATE ====================
  const [liveLoading, setLiveLoading] = useState(false);
  const [liveError, setLiveError] = useState<string | null>(null);
  const liveInitializedRef = useRef(false);
  const storedForInit = draftId ? draftStore.getDraft(draftId) : undefined;
  // liveDataReady gates the loadLiveData effect — set true when filling→drafting transition completes
  const [liveDataReady, setLiveDataReady] = useState(false);
  const [engineReady, setEngineReady] = useState(false);
  const liveRetryCountRef = useRef(0);
  // Track whether we're waiting for server to create draft documents after filling
  // Initialize from stored state so re-entry renders correctly on first frame (no flash)
  const _isResumingRandomize = !!(storedForInit?.randomizingStartedAt && !storedForInit?.preSpinStartedAt);
  const _resumeProgressDuration = 3000;
  const _resumeProgress = _isResumingRandomize
    ? (() => { const e = Date.now() - storedForInit!.randomizingStartedAt!; const t = Math.min(1, e / _resumeProgressDuration); return 0.99 * Math.pow(t, 0.6); })()
    : 0;
  const [waitingForServer, setWaitingForServer] = useState(_isResumingRandomize);
  const [serverWaitProgress, setServerWaitProgress] = useState(_resumeProgress);
  const serverWaitProgressRef = useRef(_resumeProgress);
  // State-driven approach: when poll succeeds, store result here; a separate effect transitions
  const [serverPollResult, setServerPollResult] = useState<{
    order: typeof DRAFT_PLAYERS;
    countdownStart: number;
  } | null>(null);
  const serverPollStartedRef = useRef(false);
  // Queue WS messages that arrive before engine initialization (instead of dropping them)
  // Messages are replayed after initializeFromServer completes — matches production behavior
  const pendingWsMessagesRef = useRef<Array<{type: string, payload: any}>>([]);

  // ==================== FIREBASE RTDB: Real-time draft state ====================
  // Replaces WebSocket for receiving timer updates, new picks, and draft state changes.
  // Enabled when the engine has been initialized and we're in live mode.
  const firebaseActive = isLiveMode && engineReady && !!draftId;
  const firebaseRtdb = useRealTimeDraftInfo(draftId || null, firebaseActive);

  // Wire Firebase RTDB data into the engine whenever it updates
  useEffect(() => {
    if (!firebaseActive || !firebaseRtdb.data) return;

    const rtdb = firebaseRtdb.data;

    // Apply slow-draft pickLength fix (same workaround as for WS timer_update)
    let correctedPickEndTime = rtdb.pickEndTime;
    if (speedParam === 'slow' && rtdb.pickLength > 0 && rtdb.pickLength < 3600) {
      // Backend bug: pickLength is 480s instead of 28800s.
      // pickEndTime = startOfTurn + pickLength, so we recalculate it.
      const startOfTurn = rtdb.pickEndTime - rtdb.pickLength;
      correctedPickEndTime = startOfTurn + 28800;
    }

    // Update engine state from Firebase
    engine.setFirebaseState({
      ...rtdb,
      pickEndTime: correctedPickEndTime,
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [firebaseActive, firebaseRtdb.data]);

  // Process new picks detected by Firebase RTDB
  useEffect(() => {
    if (!firebaseActive || !firebaseRtdb.newPickDetected || !firebaseRtdb.detectedPick) return;

    console.log('[Firebase] New pick detected:', firebaseRtdb.detectedPick.playerId, 'pick#', firebaseRtdb.detectedPick.pickNum);
    engine.handleFirebaseNewPick(firebaseRtdb.detectedPick);
    firebaseRtdb.clearNewPick();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [firebaseActive, firebaseRtdb.newPickDetected, firebaseRtdb.detectedPick]);

  // Firebase-based timer: use useTimeRemaining with timestamps from RTDB
  const firebaseEndOfTurn = firebaseRtdb.data?.pickEndTime ?? null;
  const firebaseDraftStart = firebaseRtdb.data?.draftStartTime ?? null;
  // Apply slow-draft correction to the timer input too
  const correctedFirebaseEndOfTurn = (() => {
    if (!firebaseRtdb.data || !firebaseEndOfTurn) return firebaseEndOfTurn;
    if (speedParam === 'slow' && firebaseRtdb.data.pickLength > 0 && firebaseRtdb.data.pickLength < 3600) {
      const startOfTurn = firebaseEndOfTurn - firebaseRtdb.data.pickLength;
      return startOfTurn + 28800;
    }
    return firebaseEndOfTurn;
  })();
  const firebaseTimeRemaining = useTimeRemaining(
    firebaseActive ? correctedFirebaseEndOfTurn : null,
    firebaseActive ? firebaseDraftStart : null,
  );

  // Track last Firebase update for watchdog (replaces lastWsUpdateRef for Firebase mode)
  const lastFirebaseUpdateRef = useRef<number>(Date.now());
  useEffect(() => {
    if (firebaseRtdb.data) {
      lastFirebaseUpdateRef.current = Date.now();
    }
  }, [firebaseRtdb.data]);

  // ==================== LIVE MODE: Join draft if no draftId yet ====================
  const joinCalledRef = useRef(false);
  useEffect(() => {
    if (!isLiveMode || draftId || !walletParam || joinCalledRef.current) return;
    joinCalledRef.current = true;

    // Write a preliminary entry to draftStore immediately so the drafting page
    // can show it while the joinDraft API call is in progress
    const pendingId = `pending-${Date.now()}`;
    const joinStartedAt = Date.now();
    draftStore.addDraft({
      id: pendingId,
      contestName: 'Joining...',
      status: 'filling',
      type: null,
      draftSpeed: speedParam || 'fast',
      players: 1,
      maxPlayers: 10,
      joinedAt: joinStartedAt,
      phase: 'filling',
      fillingStartedAt: joinStartedAt,
      fillingInitialPlayers: 1,
      liveWalletAddress: walletParam,
      passType: passTypeParam || 'paid',
    });

    async function joinAndFill() {
      const MAX_JOIN_RETRIES = 3;
      let lastErr: unknown = null;

      for (let attempt = 1; attempt <= MAX_JOIN_RETRIES; attempt++) {
        try {
          const { joinDraft } = await import('@/lib/api/leagues');
          const promoType = searchParams?.get('promoType') as 'jackpot' | 'hof' | 'pro' | null;
          const draftRoom = await joinDraft(walletParam, speedParam || 'fast', 1, promoType ?? undefined, passTypeParam || 'paid');
          if (!draftRoom?.id) throw new Error('Join failed: no draft ID');

          const newId = draftRoom.id;
          setDraftId(newId);

          // Un-hide this specific draft if it was previously hidden by "Clear All"
          try {
            const hidden = JSON.parse(localStorage.getItem('banana-hidden-drafts') || '[]');
            if (hidden.includes(newId)) {
              localStorage.setItem('banana-hidden-drafts', JSON.stringify(hidden.filter((id: string) => id !== newId)));
            }
          } catch { /* ignore */ }

          // Remove the pending entry and add the real one
          draftStore.removeDraft(pendingId);
          draftStore.addDraft({
            id: newId,
            contestName: draftRoom.contestName || `BBB #${newId}`,
            status: 'filling',
            type: null,
            draftSpeed: speedParam || 'fast',
            players: draftRoom.players || 1,
            maxPlayers: 10,
            joinedAt: joinStartedAt,
            phase: 'filling',
            fillingStartedAt: joinStartedAt,
            fillingInitialPlayers: draftRoom.players || 1,
            liveWalletAddress: walletParam,
            passType: passTypeParam || 'paid',
          });

          // Fire off bot fill in background (staging only)
          if (isStagingMode()) {
            const stagingBase = getStagingApiUrl();
            if (stagingBase) {
              fetch(`${stagingBase}/staging/fill-bots/${speedParam || 'fast'}?count=9&leagueId=${newId}`, { method: 'POST' })
                .catch(() => console.warn('Bot fill failed'));
            }
          }
          return; // Success — exit retry loop
        } catch (err) {
          lastErr = err;
          console.warn(`[Draft Room] Join attempt ${attempt}/${MAX_JOIN_RETRIES} failed:`, err instanceof Error ? err.message : err);
          if (attempt < MAX_JOIN_RETRIES) {
            await new Promise(r => setTimeout(r, 2000 * attempt)); // Backoff: 2s, 4s
          }
        }
      }

      // All retries exhausted — show error
      console.error('[Draft Room] Failed to join draft after retries:', lastErr);
      draftStore.removeDraft(pendingId);
      setLiveError(lastErr instanceof Error ? lastErr.message : 'Failed to join draft');
    }

    joinAndFill();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLiveMode, draftId, walletParam, speedParam]);

  // ==================== RESTORE FROM STORE ====================
  // Check store in both modes — needed to skip animations when re-entering mid-draft
  const stored = draftId ? draftStore.getDraft(draftId) : undefined;

  // ==================== PHASE STATE ====================
  const [phase, setPhase] = useState<RoomPhase>(() => {
    // In live mode, if stored state shows draft is past filling, start in 'loading'
    if (isLiveMode && stored && (
      (stored.phase && stored.phase !== 'filling') ||
      stored.preSpinStartedAt ||
      (stored.randomizingStartedAt && (Date.now() - stored.randomizingStartedAt) > 3000)
    )) return 'loading';
    if (!isLiveMode && stored?.phase) return stored.phase;
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
    // Special drafts: URL param is source of truth for type (localStorage may be stale)
    if (specialTypeParam) return specialTypeParam;
    if (stored?.draftType) return stored.draftType;
    return null;
  });

  // ==================== SLOT MACHINE STATE ====================
  const [allReelItems, setAllReelItems] = useState<DraftType[][]>([[], [], []]);
  const [reelOffsets, setReelOffsets] = useState([0, 0, 0]);
  const [showSlotMachine, setShowSlotMachine] = useState(false);
  const slotActiveRef = useRef(false); // Ref for animation callbacks to check
  const [slotAnimationDone, setSlotAnimationDone] = useState(false);
  // Helper: only show slot if it wasn't already dismissed in this draft
  const showSlotIfNotDismissed = (dId?: string) => {
    const id = dId || draftIdRef.current;
    const s = id ? draftStore.getDraft(id) : undefined;
    if (s?.slotDismissed) return;
    setShowSlotMachine(true);
    slotActiveRef.current = true;
  };
  const [showFlash, setShowFlash] = useState(false);
  const [screenShake, setScreenShake] = useState(false);
  const [confetti, setConfetti] = useState<Array<{ id: number; x: number; color: string; delay: number }>>([]);
  const [jackpotRain, setJackpotRain] = useState<Array<{ id: number; x: number; delay: number; size: number }>>([]);
  const [particleBurst, setParticleBurst] = useState<Array<{ id: number; x: number; y: number; angle: number; color: string }>>([]);
  const [pulseGlow, setPulseGlow] = useState(false);

  // ==================== DRAFT ORDER STATE (pre-engine) ====================
  const [draftOrder, setDraftOrder] = useState<typeof DRAFT_PLAYERS>(() => {
    if (stored?.draftOrder) return stored.draftOrder;
    // In live mode, pre-populate with user as first entry so box #1 shows "You"
    if (isLiveMode && walletParam) {
      return [{
        id: '1',
        name: walletParam,
        displayName: 'You',
        isYou: true,
        avatar: '🍌',
      }];
    }
    return [];
  });
  const [userDraftPosition, setUserDraftPosition] = useState<number>(() => {
    if (stored?.userDraftPosition !== undefined) return stored.userDraftPosition;
    return 0;
  });

  // ==================== AUTO-DRAFT & SORT PREFERENCES (REST-synced) ====================
  const [autoDraft, setAutoDraft] = useState(false);
  const [autoDraftLoading, setAutoDraftLoading] = useState(false);
  const [sortPreference, setSortPreference] = useState<'adp' | 'rank'>('adp');
  const [missedPicksCount, setMissedPicksCount] = useState(0);
  const [showAutoDraftNotification, setShowAutoDraftNotification] = useState(false);
  const [generatedCardUrl, setGeneratedCardUrl] = useState<string | null>(null);
  // Track previous currentDrafter for "your turn" sound
  const prevDrafterRef = useRef<string>('');

  // ==================== DRAFTING UI STATE ====================
  const [activeTab, setActiveTab] = useState<DraftTab>('draft');
  // Mute — restore from localStorage immediately
  const muteKey = `mute:${urlDraftId || ''}`;
  const [isMuted, setIsMuted] = useState(() => {
    if (typeof window === 'undefined' || !urlDraftId) return false;
    return localStorage.getItem(muteKey) === '1';
  });
  const bannerRef = useRef<HTMLDivElement>(null);

  // ==================== TIMESTAMP REFS ====================
  const fillingStartedAtRef = useRef<number | null>(stored?.fillingStartedAt ?? null);
  const preSpinStartedAtRef = useRef<number | null>(stored?.preSpinStartedAt ?? null);
  const animationOffsetRef = useRef(0); // ms offset for resuming slot animation mid-way
  const lastWsUpdateRef = useRef<number>(Date.now());

  // ==================== LOADING PHASE: Check server state before showing any UI ====================
  // When re-entering a live draft, we start in 'loading' phase to avoid replaying animations.
  // This effect fetches server state and jumps to the exact correct phase.
  const loadingHandledRef = useRef(false);
  useEffect(() => {
    if (phase !== 'loading' || loadingHandledRef.current) return;
    // If not in live mode, fall back to filling immediately
    if (!isLiveMode) {
      setPhase('filling');
      return;
    }
    // No draftId means fall back to filling
    if (!draftId) {
      setPhase('filling');
      return;
    }
    loadingHandledRef.current = true;

    let cancelled = false;

    async function checkServerState() {
      try {
        console.log('[Draft Room] Loading phase — checking server state for', draftId);

        // Special drafts: Cloud Function auto-fills the draft when user joins.
        // Go straight to Go API check — if draft is ready, start immediately.

        const info = await draftApi.getDraftInfo(draftId);
        if (cancelled) return;

        const playerCount = info.draftOrder?.length || 0;
        const draftAlreadyStarted = info.pickNumber > 1 ||
          (info.draftStartTime && info.draftStartTime * 1000 < Date.now());

        if (draftAlreadyStarted) {
          // Draft is actively picking — jump straight to drafting
          console.log(`[Draft Room] Server shows draft at pick ${info.pickNumber} — jumping to drafting`);

          // Build draft order from server data
          const realOrder = info.draftOrder.map((u: { ownerId: string }, idx: number) => ({
            id: String(idx + 1),
            name: u.ownerId,
            displayName: u.ownerId.toLowerCase() === walletParam.toLowerCase()
              ? 'You'
              : u.ownerId.slice(0, 6) + '...' + u.ownerId.slice(-4),
            isYou: u.ownerId.toLowerCase() === walletParam.toLowerCase(),
            avatar: '🍌',
          }));
          setDraftOrder(realOrder);
          const userPos = realOrder.findIndex((p: { isYou: boolean }) => p.isYou);
          if (userPos >= 0) setUserDraftPosition(userPos);

          setPlayerCount(10);
          setPhase('drafting');
          setMainCountdown(0);
          setShowSlotMachine(false);
          setLiveDataReady(true);

          if (specialTypeParam) setDraftType(specialTypeParam);
          else if (stored?.draftType) setDraftType(stored.draftType);

          draftStore.updateDraft(draftId, {
            phase: 'drafting', status: 'drafting', players: 10,
          });
        } else if (playerCount >= 10 && info.draftStartTime) {
          // Draft is full but not started yet — in pre-spin/countdown phase
          console.log('[Draft Room] Server shows draft full, starting countdown');

          const realOrder = info.draftOrder.map((u: { ownerId: string }, idx: number) => ({
            id: String(idx + 1),
            name: u.ownerId,
            displayName: u.ownerId.toLowerCase() === walletParam.toLowerCase()
              ? 'You'
              : u.ownerId.slice(0, 6) + '...' + u.ownerId.slice(-4),
            isYou: u.ownerId.toLowerCase() === walletParam.toLowerCase(),
            avatar: '🍌',
          }));
          setDraftOrder(realOrder);
          const userPos = realOrder.findIndex((p: { isYou: boolean }) => p.isYou);
          if (userPos >= 0) setUserDraftPosition(userPos);

          setPlayerCount(10);

          // Calculate remaining time
          const countdownStart = stored?.preSpinStartedAt || (info.draftStartTime * 1000 - 60000);
          preSpinStartedAtRef.current = countdownStart;
          const elapsed = (Date.now() - countdownStart) / 1000;

          if (elapsed >= 60) {
            // Countdown already expired — jump to drafting
            setPhase('drafting');
            setMainCountdown(0);
            setLiveDataReady(true);
            if (specialTypeParam) setDraftType(specialTypeParam);
            else if (stored?.draftType) setDraftType(stored.draftType);
            draftStore.updateDraft(draftId, { phase: 'drafting', status: 'drafting', players: 10 });
          } else if (specialTypeParam) {
            // Special draft: skip slot machine, resume countdown
            setDraftType(specialTypeParam);
            setPhase('countdown');
            setMainCountdown(Math.max(0, Math.floor(60 - elapsed)));
            setLiveDataReady(true);
            draftStore.updateDraft(draftId, { phase: 'countdown', preSpinStartedAt: countdownStart, type: specialTypeParam, draftType: specialTypeParam });
          } else if (elapsed >= 15) {
            // Past slot machine start — play animation (or show result if animation done)
            const selectedResult = (stored?.draftType || 'pro') as DraftType;
            const reelResults: DraftType[] = [selectedResult, selectedResult, selectedResult];
            setDraftType(selectedResult);
            const generatedReels = [
              generateReelItemsForReel(reelResults[0], 0),
              generateReelItemsForReel(reelResults[1], 1),
              generateReelItemsForReel(reelResults[2], 2),
            ];
            setAllReelItems(generatedReels);
            const animOffset = (elapsed - 15) * 1000; // ms into animation
            if (animOffset < 6000) {
              // Animation still in progress — resume from exact position
              const itemHeight = 130;
              const landingIndex = (generatedReels[0]?.length || 50) - 8;
              const targetOffset = landingIndex * itemHeight;
              const reelDurations = [2000, 4000, 6000];
              const easeOutQuint = (t: number): number => 1 - Math.pow(1 - t, 5);
              // Pre-set reel positions so there's no flash of [0,0,0] on remount
              const initOffsets: number[] = [0, 0, 0];
              for (let i = 0; i < 3; i++) {
                const p = Math.min(animOffset / reelDurations[i], 1);
                initOffsets[i] = easeOutQuint(p) * targetOffset;
              }
              setReelOffsets(initOffsets);
              animationOffsetRef.current = animOffset;
              showSlotIfNotDismissed();
              setSlotAnimationDone(false);
              setPhase('spinning');
            } else {
              // Animation done — show result with reels at final position
              const itemHeight = 130;
              const landingIndex = (generatedReels[0]?.length || 50) - 8;
              const finalOffset = landingIndex * itemHeight;
              setReelOffsets([finalOffset, finalOffset, finalOffset]);
              showSlotIfNotDismissed();
              setSlotAnimationDone(true);
              setPhase('result');
            }
            setMainCountdown(Math.max(0, Math.floor(60 - elapsed)));
            setLiveDataReady(true);
            draftStore.updateDraft(draftId, { phase: animOffset < 6000 ? 'spinning' : 'result', preSpinStartedAt: countdownStart });
          } else {
            // Still in pre-spin countdown — resume with remaining time
            setPhase('pre-spin');
            setPreSpinCountdown(Math.max(0, Math.floor(15 - elapsed)));
            setMainCountdown(Math.max(0, Math.floor(60 - elapsed)));
            setLiveDataReady(true);
            draftStore.updateDraft(draftId, { phase: 'pre-spin', preSpinStartedAt: countdownStart, draftOrder: realOrder, userDraftPosition: userPos });
          }
        } else if (playerCount >= 10) {
          // Draft is full but no draftStartTime yet — resume from stored state
          console.log('[Draft Room] Server shows 10/10 but no draftStartTime — resuming stored phase');
          setPlayerCount(10);
          if (stored?.preSpinStartedAt) {
            // Already in countdown — resume
            const countdownStart = stored.preSpinStartedAt;
            preSpinStartedAtRef.current = countdownStart;
            const elapsed = (Date.now() - countdownStart) / 1000;
            if (elapsed >= 15) {
              const selectedResult = (stored.draftType || 'pro') as DraftType;
              const reelResults: DraftType[] = [selectedResult, selectedResult, selectedResult];
              setDraftType(selectedResult);
              const generatedReels2 = [
                generateReelItemsForReel(reelResults[0], 0),
                generateReelItemsForReel(reelResults[1], 1),
                generateReelItemsForReel(reelResults[2], 2),
              ];
              setAllReelItems(generatedReels2);
              const animOffset2 = (elapsed - 15) * 1000;
              if (animOffset2 < 6000) {
                const itemHeight = 130;
                const landingIndex = (generatedReels2[0]?.length || 50) - 8;
                const targetOffset = landingIndex * itemHeight;
                const reelDurations = [2000, 4000, 6000];
                const easeOutQuint = (t: number): number => 1 - Math.pow(1 - t, 5);
                const initOffsets: number[] = [0, 0, 0];
                for (let i = 0; i < 3; i++) {
                  const p = Math.min(animOffset2 / reelDurations[i], 1);
                  initOffsets[i] = easeOutQuint(p) * targetOffset;
                }
                setReelOffsets(initOffsets);
                animationOffsetRef.current = animOffset2;
                showSlotIfNotDismissed();
                setSlotAnimationDone(false);
                setPhase('spinning');
              } else {
                // Animation done — set reels to final position
                const itemHeight2 = 130;
                const landingIndex2 = (generatedReels2[0]?.length || 50) - 8;
                const finalOffset2 = landingIndex2 * itemHeight2;
                setReelOffsets([finalOffset2, finalOffset2, finalOffset2]);
                showSlotIfNotDismissed();
                setSlotAnimationDone(true);
                setPhase('result');
              }
              setMainCountdown(Math.max(0, Math.floor(60 - elapsed)));
            } else {
              setPhase('pre-spin');
              setPreSpinCountdown(Math.max(0, Math.floor(15 - elapsed)));
              setMainCountdown(Math.max(0, Math.floor(60 - elapsed)));
            }
            setLiveDataReady(true);
          } else {
            // Still randomizing or just reached 10/10 — let "at 10" effect handle it
            setPlayerCount(10);
            setPhase('filling');
          }
        } else {
          // Still filling — go back to filling phase (normal flow)
          setPlayerCount(Math.max(playerCount, 1));
          setPhase('filling');
        }
      } catch (err) {
        console.warn('[Draft Room] Loading phase server check failed:', err);

        // Fall back to stored phase or filling
        if (stored?.status === 'drafting') {
          setPhase('drafting');
          setLiveDataReady(true);
          if (stored.draftOrder) setDraftOrder(stored.draftOrder);
          if (stored.userDraftPosition !== undefined) setUserDraftPosition(stored.userDraftPosition);
          if (stored.draftType) setDraftType(stored.draftType);
        } else {
          setPhase('filling');
        }
      }
    }

    checkServerState();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, isLiveMode, draftId]);

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

    // Resume spinning/result: play animation (or show result if animation done)
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
      // Play the slot machine animation instead of skipping it
      const selectedResult = (stored.draftType || draftType || 'pro') as DraftType;
      const reelResults: DraftType[] = [selectedResult, selectedResult, selectedResult];
      setDraftType(selectedResult);
      const generatedReels3 = [
        generateReelItemsForReel(reelResults[0], 0),
        generateReelItemsForReel(reelResults[1], 1),
        generateReelItemsForReel(reelResults[2], 2),
      ];
      setAllReelItems(generatedReels3);
      const animOffset = stored.preSpinStartedAt
        ? Math.max(0, Date.now() - stored.preSpinStartedAt - 3000)
        : 0;
      if (animOffset < 6000) {
        // Resume from exact position — pre-set reel offsets to avoid flash
        const itemHeight = 130;
        const landingIndex = (generatedReels3[0]?.length || 50) - 8;
        const targetOffset = landingIndex * itemHeight;
        const reelDurations = [2000, 4000, 6000];
        const easeOutQuint = (t: number): number => 1 - Math.pow(1 - t, 5);
        const initOffsets: number[] = [0, 0, 0];
        for (let i = 0; i < 3; i++) {
          const p = Math.min(animOffset / reelDurations[i], 1);
          initOffsets[i] = easeOutQuint(p) * targetOffset;
        }
        setReelOffsets(initOffsets);
        animationOffsetRef.current = animOffset;
        showSlotIfNotDismissed();
        setSlotAnimationDone(false);
        setPhase('spinning');
      } else {
        // Animation done — set reels to final position
        const itemHeight3 = 130;
        const landingIndex3 = (generatedReels3[0]?.length || 50) - 8;
        const finalOffset3 = landingIndex3 * itemHeight3;
        setReelOffsets([finalOffset3, finalOffset3, finalOffset3]);
        showSlotIfNotDismissed();
        setSlotAnimationDone(true);
        setPhase('result');
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
    // Mark as manual pick (resets consecutive timeout counter for airplane mode)
    engine.markManualPick();
    if (!isLiveMode) {
      engine.draftPlayer(playerId);
      return;
    }
    // In live mode, build payload and submit via REST API (replaces WebSocket pick_received)
    const pickPayload = engine.draftPlayer(playerId);
    if (pickPayload && draftId) {
      draftApi.submitPickREST(draftId, walletParam, {
        playerId: pickPayload.playerId,
        displayName: pickPayload.displayName,
        team: pickPayload.team,
        position: pickPayload.position,
      }).then(() => {
        console.log('[REST] Pick submitted successfully:', pickPayload.playerId);
      }).catch((err) => {
        console.error('[REST] Pick submission failed:', err);
        // If in airplane mode, handle stale player (same as old WS invalid_pick)
        if (engine.airplaneMode && engine.isUserTurn) {
          const msg = err?.message || '';
          const match = msg.match(/already picked (\S+)/);
          if (match) {
            const staleId = match[1];
            console.log('[Airplane] Removing stale player and retrying:', staleId);
            engine.removeFromAvailable(staleId);
            setTimeout(() => {
              const nextPick = engine.getAutoPickPlayer();
              if (nextPick && draftId) {
                console.log('[Airplane] Retrying auto-pick with:', nextPick);
                const retryPayload = engine.draftPlayer(nextPick);
                if (retryPayload) {
                  draftApi.submitPickREST(draftId, walletParam, {
                    playerId: retryPayload.playerId,
                    displayName: retryPayload.displayName,
                    team: retryPayload.team,
                    position: retryPayload.position,
                  }).catch(e => console.error('[Airplane] Retry failed:', e));
                }
              }
            }, 300);
          }
        }
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLiveMode, draftId, walletParam, engine.draftPlayer, engine.markManualPick]);

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
  // WebSocket — normally DISABLED because Firebase RTDB handles real-time updates.
  // Auto-enables as fallback if:
  //   1. Firebase is not available (missing env vars)
  //   2. Firebase had a connection/permission error
  //   3. ?useWs=true URL param is set
  const useWsParam = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('useWs') === 'true';
  const firebaseConfigured = typeof window !== 'undefined' && isFirebaseAvailable();
  const firebaseFailed = firebaseRtdb.hasError;
  const wsEnabled = isLiveMode && (useWsParam || !firebaseConfigured || firebaseFailed);
  const ws = useDraftWebSocket({
    walletAddress: walletParam,
    draftName: draftId,
    enabled: wsEnabled,
    onCountdownUpdate: (payload) => {
      engine.handleCountdownUpdate(payload);
    },
    onTimerUpdate: (payload) => {
      if (!liveInitializedRef.current) {
        pendingWsMessagesRef.current.push({ type: 'timer_update', payload });
        return;
      }
      // Backend bug: slow draft pickLength is 480s (8 min) instead of 28800s (8 hr).
      // Adjust endOfTurnTimestamp so the countdown shows the correct 8-hour window.
      if (speedParam === 'slow' && payload.startOfTurnTimestamp && payload.endOfTurnTimestamp) {
        const serverPickLen = payload.endOfTurnTimestamp - payload.startOfTurnTimestamp;
        if (serverPickLen < 3600) {
          payload = { ...payload, endOfTurnTimestamp: payload.startOfTurnTimestamp + 28800 };
        }
      }
      engine.handleTimerUpdate(payload);
      lastWsUpdateRef.current = Date.now();
    },
    onNewPick: (payload) => {
      console.log('[WS] new_pick received:', payload?.playerId, 'pick#', payload?.pickNum, 'initialized:', liveInitializedRef.current);
      if (!liveInitializedRef.current) {
        pendingWsMessagesRef.current.push({ type: 'new_pick', payload });
        console.log('[WS] Queued new_pick (engine not ready). Queue size:', pendingWsMessagesRef.current.length);
        return;
      }
      engine.handleNewPick(payload);
      lastWsUpdateRef.current = Date.now();
    },
    onDraftInfoUpdate: (payload) => {
      if (!liveInitializedRef.current) {
        pendingWsMessagesRef.current.push({ type: 'draft_info_update', payload });
        return;
      }
      // Cast: handler only uses pickNumber + currentDrafter, adp shape differs between WS and engine types
      engine.handleDraftInfoUpdate(payload as unknown as Parameters<typeof engine.handleDraftInfoUpdate>[0]);
      lastWsUpdateRef.current = Date.now();
      // Also update draftOrder from WS payload so boxes show wallet addresses
      if (payload.draftOrder && payload.draftOrder.length > 0) {
        const mapped = payload.draftOrder.map((entry: { ownerId: string }, idx: number) => {
          const isUser = entry.ownerId.toLowerCase() === walletParam.toLowerCase();
          return {
            id: String(idx + 1),
            name: entry.ownerId,
            displayName: isUser ? 'You' : entry.ownerId.slice(0, 6) + '...' + entry.ownerId.slice(-4),
            isYou: isUser,
            avatar: '🍌',
          };
        });
        setDraftOrder(mapped);
      }
    },
    onDraftComplete: () => {
      engine.handleDraftComplete();
    },
    onFinalCard: (payload) => {
      engine.handleFinalCard(payload);
    },
    onInvalidPick: (payload) => {
      console.warn('[WS] Invalid pick rejected by server:', payload);
      // If in airplane mode, the rejected player is stale — remove it and retry
      if (engine.airplaneMode && engine.isUserTurn) {
        const msg = (payload as { errorMessage?: string })?.errorMessage || '';
        // Extract player ID from error message like "This player was already picked LAC-WR1"
        const match = msg.match(/already picked (\S+)/);
        if (match) {
          const staleId = match[1];
          console.log('[Airplane] Removing stale player and retrying:', staleId);
          engine.removeFromAvailable(staleId);
          // Retry with next best player after short delay
          setTimeout(() => {
            const nextPick = engine.getAutoPickPlayer();
            if (nextPick) {
              console.log('[Airplane] Retrying auto-pick with:', nextPick);
              const retryPayload = engine.draftPlayer(nextPick);
              if (retryPayload) ws.sendPick(retryPayload);
            }
          }, 300);
        }
      }
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
      lastWsUpdateRef.current = Date.now();
      // Minimal reconnect sync (matches production): only fetch summary to catch
      // picks missed during disconnect. WS messages handle ongoing state sync.
      if (liveInitializedRef.current && draftId) {
        draftApi.getDraftSummary(draftId).then(summary => {
          const summaryArr = Array.isArray(summary) ? summary : (summary as any).summary || [];
          if (summaryArr.length > 0) {
            engine.refreshSummaryPicks(summaryArr);
            console.log(`[WS Reconnect] Synced ${summaryArr.filter((s: any) => s.playerInfo?.playerId).length} picks from summary`);
          }
        }).catch(() => {});
      }
    },
    onClose: () => {
      console.log('[WS] Disconnected from draft server');
    },
  });

  // ==================== AIRPLANE MODE: Instant auto-pick when enabled ====================
  useEffect(() => {
    if (!engine.airplaneMode || !engine.isUserTurn || phase !== 'drafting' || engine.draftStatus !== 'active') return;

    // Small delay to let state settle after turn change
    const timeoutId = setTimeout(() => {
      const pickId = engine.getAutoPickPlayer();
      if (!pickId) return;
      console.log('[Airplane] Auto-picking immediately:', pickId);
      if (isLiveMode && draftId) {
        const payload = engine.draftPlayer(pickId);
        if (payload) {
          draftApi.submitPickREST(draftId, walletParam, {
            playerId: payload.playerId,
            displayName: payload.displayName,
            team: payload.team,
            position: payload.position,
          }).catch(e => console.error('[Airplane] Auto-pick REST failed:', e));
        }
      } else {
        engine.draftPlayer(pickId);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [engine.airplaneMode, engine.isUserTurn, phase, engine.draftStatus, engine.currentPickNumber]);

  // ==================== Cross-tab heartbeat: signal to other tabs that draft-room ====================
  // has an active Firebase RTDB listener for this draft. The drafting page checks this
  // to avoid opening a duplicate connection or running redundant REST polling.
  useEffect(() => {
    if (!isLiveMode || !draftId) return;
    const key = `draft-room-ws:${draftId}`;
    // Write heartbeat immediately and every 3s
    localStorage.setItem(key, String(Date.now()));
    const interval = setInterval(() => {
      localStorage.setItem(key, String(Date.now()));
    }, 3_000);
    return () => {
      clearInterval(interval);
      localStorage.removeItem(key);
    };
  }, [isLiveMode, draftId]);

  // ==================== LIVE MODE: Load initial state from REST API ====================
  // Gated by liveDataReady — runs when entering pre-spin (60s before draft starts)
  useEffect(() => {
    if (!isLiveMode || liveInitializedRef.current || !liveDataReady || !draftId) return;

    // Retry helper
    async function retryAsync<T,>(fn: () => Promise<T>, maxRetries = 3, delayMs = 2000): Promise<T> {
      let lastError: Error | null = null;
      for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
          return await fn();
        } catch (err) {
          lastError = err instanceof Error ? err : new Error(String(err));
          console.warn(`[loadLiveData] Attempt ${attempt + 1}/${maxRetries} failed:`, lastError.message);
          if (attempt < maxRetries - 1) {
            await new Promise(resolve => setTimeout(resolve, delayMs));
          }
        }
      }
      throw lastError!;
    }

    async function loadLiveData() {
      try {
        setLiveLoading(true);
        setLiveError(null);
        console.log('[Draft Room] Loading draft data for', draftId);

        // Match production pattern: Promise.allSettled tolerates partial failures.
        // DraftInfo and playerRankings are required — if either fails, throw to retry.
        // Rosters, queue, and summary gracefully degrade to empty.
        const [rankingsResult, infoResult, rostersResult, queueResult, summaryResult] =
          await Promise.allSettled([
            retryAsync(() => draftApi.getPlayerRankings(draftId, walletParam)),
            retryAsync(() => draftApi.getDraftInfo(draftId)),
            draftApi.getDraftRosters(draftId),
            draftApi.getQueue(walletParam, draftId),
            draftApi.getDraftSummary(draftId),
          ]);

        const playerRankings = rankingsResult.status === 'fulfilled' ? rankingsResult.value : [];
        const draftInfo = infoResult.status === 'fulfilled' ? infoResult.value : null;
        const serverRosters = rostersResult.status === 'fulfilled'
          ? rostersResult.value
          : ({} as Record<string, { QB: unknown[]; RB: unknown[]; WR: unknown[]; TE: unknown[]; DST: unknown[] }>);
        const queue = queueResult.status === 'fulfilled' ? queueResult.value : ([] as draftApi.PlayerStateInfo[]);
        const summary = summaryResult.status === 'fulfilled' ? summaryResult.value : ([] as draftApi.DraftSummaryItem[]);

        // Both required — if either failed or empty, throw to retry
        if (!draftInfo || (playerRankings as draftApi.PlayerDataResponse[]).length === 0) {
          throw new Error('Required draft data not available yet');
        }

        // Server has real player data — initialize engine in live mode
        // Backend bug: Go API sets pickLength = 60*8 = 480 (8 min) for slow drafts,
        // but slow drafts should be 8 hours (3600*8 = 28800). Override on frontend.
        const correctedPickLength = speedParam === 'slow' && draftInfo.pickLength < 3600
          ? 28800
          : draftInfo.pickLength;

        const serverDraftInfo = {
          draftId: draftInfo.draftId,
          displayName: draftInfo.displayName,
          draftStartTime: draftInfo.draftStartTime,
          pickLength: correctedPickLength,
          currentDrafter: draftInfo.currentDrafter,
          pickNumber: draftInfo.pickNumber,
          roundNum: draftInfo.roundNum,
          pickInRound: draftInfo.pickInRound,
          draftOrder: draftInfo.draftOrder,
          adp: (draftInfo.adp || []).map(a => ({
            adp: a.adp,
            byeWeek: String(a.bye ?? a.byeWeek ?? ''),
            playerId: a.playerId,
          })),
        };

        // Convert queue to ServerPickPayload format
        const queuePayload = (queue as draftApi.PlayerStateInfo[]).map(q => ({
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

        // Preserve any queue the user built during filling/pre-spin
        const localQueue = engine.queuedPlayers;

        engine.initializeFromServer(
          serverDraftInfo,
          playerRankings,
          summary,
          rostersForEngine,
          queuePayload,
          walletParam,
        );

        // Restore local queue if server had nothing (user queued during filling)
        if (queuePayload.length === 0 && localQueue.length > 0) {
          engine.reorderQueue(localQueue);
        }

        liveInitializedRef.current = true;
        setEngineReady(true);
        // Airplane mode restored by dedicated effect (covers all phases)

        console.log('[Draft Room] Engine ready — draft data loaded successfully');

        // Replay any WS messages that arrived during REST loading.
        // The lastPickRef dedup in handleNewPick rejects picks already covered by REST data.
        if (pendingWsMessagesRef.current.length > 0) {
          console.log(`[Draft Room] Replaying ${pendingWsMessagesRef.current.length} queued WS messages`);
          for (const msg of pendingWsMessagesRef.current) {
            switch (msg.type) {
              case 'new_pick': engine.handleNewPick(msg.payload); break;
              case 'timer_update': {
                // Match production: let timer_update through. Display logic uses
                // mainCountdown during pre-draft phases regardless of engine state.
                engine.handleTimerUpdate(msg.payload);
                break;
              }
              case 'draft_info_update':
                engine.handleDraftInfoUpdate(msg.payload as unknown as Parameters<typeof engine.handleDraftInfoUpdate>[0]);
                break;
            }
          }
          pendingWsMessagesRef.current = [];
        }
        lastWsUpdateRef.current = Date.now();

        setLiveLoading(false);

        // If draft is already in progress (picks happening or start time passed),
        // skip the slot machine countdown and jump straight to drafting
        const draftAlreadyStarted = draftInfo.pickNumber > 1 ||
          (draftInfo.draftStartTime && draftInfo.draftStartTime * 1000 < Date.now());
        if (draftAlreadyStarted) {
          console.log(`[Draft Room] Draft already at pick ${draftInfo.pickNumber} — skipping countdown, jumping to drafting`);
          setPhase('drafting');
          setMainCountdown(0);
          setShowSlotMachine(false);
          if (draftId) {
            draftStore.updateDraft(draftId, { phase: 'drafting', status: 'drafting', players: 10, isYourTurn: false });
          }
        }
      } catch (err) {
        const MAX_OUTER_RETRIES = 8;
        liveRetryCountRef.current += 1;
        console.error(`[Live Mode] loadLiveData attempt ${liveRetryCountRef.current}/${MAX_OUTER_RETRIES} failed:`, err);
        setLiveLoading(false);

        if (liveRetryCountRef.current >= MAX_OUTER_RETRIES) {
          // Exhausted all retries — fall back to local mode (bots + ALL_POSITIONS)
          // instead of showing an error overlay that blocks the draft
          console.log('[Draft Room] All retries exhausted — falling back to local mode');
          setFallbackLocal(true);
          liveInitializedRef.current = true;
        } else {
          // Auto-retry: toggle liveDataReady after delay to re-trigger the effect
          console.log(`[Live Mode] Auto-retrying in 5s...`);
          setTimeout(() => {
            liveInitializedRef.current = false;
            setLiveDataReady(false);
            setTimeout(() => setLiveDataReady(true), 100);
          }, 5000);
        }
      }
    }

    loadLiveData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLiveMode, draftId, walletParam, liveDataReady]);

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
      liveWalletAddress: walletParam,
      ...(specialTypeParam ? { specialType: specialTypeParam } : {}),
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draftId]);

  // Syncs pick progress, turn status, and engine state to localStorage
  useEffect(() => {
    if (!draftId || phase !== 'drafting') return;
    if (engine.draftStatus === 'completed') return;
    draftStore.updateDraft(draftId, {
      status: 'drafting',
      type: draftType,
      draftType: draftType,
      phase: 'drafting',
      players: 10,
      currentPick: engine.turnsUntilUserPick,
      totalPicks: engine.picks.length,
      isYourTurn: engine.isUserTurn,
      timeRemaining: engine.isUserTurn ? engine.timeRemaining : undefined,
      pickEndTimestamp: engine.isUserTurn ? Math.ceil(Date.now() / 1000) + (engine.timeRemaining || 0) : undefined,
      // Save engine state so draft can resume after leaving
      enginePicks: engine.picks,
      enginePickNumber: engine.currentPickNumber,
      engineQueue: engine.queuedPlayers,
    });
  }, [draftId, phase, draftType, engine.currentPickNumber, engine.isUserTurn, engine.timeRemaining, engine.turnsUntilUserPick, engine.draftStatus, engine.picks.length, engine.picks, engine.queuedPlayers]);

  // ==================== DIRECT LOCALSTORAGE PERSISTENCE ====================
  // No effects for save — effects race with React Strict Mode and async state.
  // Save: directly in event handlers (synchronous, no race conditions).
  // Restore: from useState initializers or a single mount effect for engine state.

  // Helper: get the draft localStorage key prefix
  const getPersistId = () => draftId || urlDraftId;

  // Restore airplane mode on mount — engine state can only be set via setter
  useEffect(() => {
    const id = getPersistId();
    if (!id) return;
    if (localStorage.getItem(`airplane:${id}`) === '1') {
      engine.setAirplaneMode(true);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draftId]);

  // Restore queue on mount
  useEffect(() => {
    const id = getPersistId();
    if (!id) return;
    try {
      const raw = localStorage.getItem(`queue:${id}`);
      if (raw) {
        const saved = JSON.parse(raw);
        if (Array.isArray(saved) && saved.length > 0 && engine.queuedPlayers.length === 0) {
          engine.reorderQueue(saved);
        }
      }
    } catch {}
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draftId]);

  // Wrapper: toggle airplane and save to localStorage in one shot
  const handleToggleAirplane = useCallback(() => {
    engine.toggleAirplaneMode();
    const id = getPersistId();
    if (!id) return;
    // toggleAirplaneMode flips the current value, so save the OPPOSITE of current
    const newValue = !engine.airplaneMode;
    localStorage.setItem(`airplane:${id}`, newValue ? '1' : '0');
    draftStore.updateDraft(id, { airplaneMode: newValue });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [engine.airplaneMode, engine.toggleAirplaneMode, draftId, urlDraftId]);

  // Wrapper: toggle mute and save to localStorage in one shot
  const handleToggleMute = useCallback(() => {
    const newValue = !isMuted;
    setIsMuted(newValue);
    const id = getPersistId();
    if (id) localStorage.setItem(`mute:${id}`, newValue ? '1' : '0');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMuted, draftId, urlDraftId]);

  // Save queue whenever it changes (no race condition — queue starts empty, restore adds items)
  useEffect(() => {
    const id = getPersistId();
    if (!id) return;
    if (engine.queuedPlayers.length > 0) {
      localStorage.setItem(`queue:${id}`, JSON.stringify(engine.queuedPlayers));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [engine.queuedPlayers, draftId]);

  // Also save airplane when auto-enabled (2 consecutive timeouts)
  // This watches engine.airplaneMode but only saves when it turns ON (not off)
  useEffect(() => {
    if (!engine.airplaneMode) return;
    const id = getPersistId();
    if (!id) return;
    localStorage.setItem(`airplane:${id}`, '1');
    draftStore.updateDraft(id, { airplaneMode: true });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [engine.airplaneMode, draftId]);

  // Write 6: Draft completes — remove from active drafts + cleanup direct localStorage keys
  useEffect(() => {
    if (engine.draftStatus === 'completed' && draftId) {
      draftStore.removeDraft(draftId);
      localStorage.removeItem(`airplane:${draftId}`);
      localStorage.removeItem(`mute:${draftId}`);
      localStorage.removeItem(`queue:${draftId}`);

      // Promo tracking now fires at draft start (pre-spin transition), not completion
    }
  }, [engine.draftStatus, draftId, user?.id, isLiveMode]);

  // Trigger notification opt-in when draft completes
  useEffect(() => {
    if (engine.draftStatus === 'completed') {
      triggerOptIn('post-draft');
    }
  }, [engine.draftStatus, triggerOptIn]);

  // ==================== DRAFT PREFERENCES: Load + sync from REST API ====================
  // Load auto-draft, sort preference, and missed picks count on init and after each pick
  useEffect(() => {
    if (!isLiveMode || !draftId || !walletParam || phase !== 'drafting') return;
    let cancelled = false;

    draftApi.getDraftPreferences(draftId, walletParam)
      .then((prefs) => {
        if (cancelled) return;
        setAutoDraft(prefs.autoDraft);
        const sortOrder = (prefs.sortBy || 'ADP').toUpperCase();
        const newSort = sortOrder === 'RANK' ? 'rank' as const : 'adp' as const;
        setSortPreference(newSort);
        engine.setAutoPickSortPreference(newSort);
        setMissedPicksCount(prefs.numPicksMissedConsecutive || 0);

        // If server says auto-draft is on, sync to local airplane mode
        if (prefs.autoDraft && !engine.airplaneMode) {
          engine.setAirplaneMode(true);
        }
        // Don't override local airplane mode from server — localStorage is the
        // user's explicit choice. The old airplane toggle doesn't call the server
        // API, so server will say autoDraft=false even when user enabled it locally.
      })
      .catch((e) => {
        console.warn('[Preferences] Failed to load draft preferences:', e);
      });

    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLiveMode, draftId, walletParam, phase, engine.currentPickNumber]);

  // Auto-draft toggle handler
  const handleToggleAutoDraft = useCallback(async () => {
    if (!isLiveMode || !draftId || !walletParam || autoDraftLoading) return;
    const newValue = !autoDraft;
    setAutoDraftLoading(true);
    try {
      const prefs = await draftApi.patchDraftPreferences(draftId, walletParam, newValue);
      setAutoDraft(prefs.autoDraft);
      // Sync airplane mode with auto-draft
      engine.setAirplaneMode(prefs.autoDraft);
      if (prefs.autoDraft) {
        const id = getPersistId();
        if (id) localStorage.setItem(`airplane:${id}`, '1');
      } else {
        const id = getPersistId();
        if (id) localStorage.setItem(`airplane:${id}`, '0');
      }
    } catch (e) {
      console.error('[AutoDraft] Toggle failed:', e);
    } finally {
      setAutoDraftLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLiveMode, draftId, walletParam, autoDraft, autoDraftLoading]);

  // Sort preference persistence via REST API
  const handleSortChange = useCallback((sort: 'adp' | 'rank') => {
    setSortPreference(sort);
    engine.setAutoPickSortPreference(sort);
    // Persist to server in background
    if (isLiveMode && draftId && walletParam) {
      draftApi.updateSortPreference(walletParam, draftId, sort.toUpperCase())
        .catch(e => console.warn('[Sort] Failed to persist sort preference:', e));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLiveMode, draftId, walletParam]);

  // ==================== SOUND EFFECTS: Wire to Firebase events ====================
  // Play "your turn" sound when currentDrafter changes to user's wallet
  useEffect(() => {
    if (!isLiveMode || isMuted || phase !== 'drafting' || engine.draftStatus !== 'active') return;
    const currentDrafter = engine.currentDrafterAddress;
    const prevDrafter = prevDrafterRef.current;
    prevDrafterRef.current = currentDrafter;

    if (!prevDrafter || !currentDrafter) return;
    if (prevDrafter === currentDrafter) return;

    if (currentDrafter.toLowerCase() === walletParam.toLowerCase()) {
      playYourTurnSound();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [engine.currentDrafterAddress, isMuted, phase, engine.draftStatus]);

  // Play "new pick" sound when a new pick is detected
  useEffect(() => {
    if (!isLiveMode || isMuted || phase !== 'drafting') return;
    if (!engine.mostRecentPick) return;
    // Only play if the pick is not from the user (to avoid double sound with "your turn")
    if (engine.mostRecentPick.ownerName.toLowerCase() !== walletParam.toLowerCase()) {
      playNewPickSound();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [engine.mostRecentPick?.pickNumber]);

  // ==================== PLAYER RANKINGS: Refresh after new picks ====================
  // Re-fetch player rankings after every pick to get updated available players list.
  // This matches the dev's PlayerComponent.tsx behavior (lines 171-182).
  useEffect(() => {
    if (!isLiveMode || !draftId || !walletParam || phase !== 'drafting') return;
    if (!engine.mostRecentPick) return;

    draftApi.getPlayerRankings(draftId, walletParam)
      .then((rankings) => {
        // Update available players from fresh rankings
        const available = rankings
          .filter((p: draftApi.PlayerDataResponse) => p.playerStateInfo.ownerAddress === '')
          .map((p: draftApi.PlayerDataResponse) => ({
            playerId: p.playerStateInfo.playerId,
            team: p.playerStateInfo.team,
            position: p.playerStateInfo.position,
            adp: p.stats.adp,
            rank: p.ranking.rank,
            byeWeek: p.stats.byeWeek,
            playersFromTeam: p.stats.playersFromTeam || [],
          }));
        engine.refreshAvailablePlayers(available);
      })
      .catch((err) => {
        console.warn('[Rankings] Failed to refresh player rankings:', err);
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLiveMode, draftId, walletParam, phase, engine.mostRecentPick?.pickNumber]);

  // ==================== isDraftClosed: Fetch generated card ====================
  useEffect(() => {
    if (!firebaseActive || !firebaseRtdb.data) return;
    if (!firebaseRtdb.data.isDraftClosed) return;
    if (generatedCardUrl) return; // Already fetched

    // Draft is closed — card should be generated, fetch it
    if (walletParam && draftId) {
      console.log('[DraftComplete] isDraftClosed=true, fetching generated card...');
      const fetchUrl = async () => {
        const { getDraftsApiUrl } = await import('@/lib/staging');
        const FALLBACK_URL = process.env.NEXT_PUBLIC_DRAFTS_API_URL || 'https://sbs-drafts-api-w5wydprnbq-uc.a.run.app';
        const baseUrl = getDraftsApiUrl() || FALLBACK_URL;
        try {
          const res = await fetch(`${baseUrl}/owner/${walletParam}/drafts/${draftId}`);
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const data = await res.json();
          const imageUrl = data?.card?._imageUrl || data?.card?.imageUrl || data?.imageUrl;
          if (imageUrl) {
            setGeneratedCardUrl(imageUrl);
            console.log('[DraftComplete] Generated card URL:', imageUrl);
          }
        } catch (err) {
          console.error('[DraftComplete] Failed to fetch card:', err);
        }
      };
      fetchUrl();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [firebaseActive, firebaseRtdb.data?.isDraftClosed, draftId, walletParam, generatedCardUrl]);

  // ==================== FILLING PHASE ====================
  // Client-side visual animation for filling phase (all modes).
  // In live mode, server polling also updates draftOrder + playerCount via Math.max.
  useEffect(() => {
    if (phase !== 'filling') return;

    // Record filling start timestamp (only if not already set by addDraft)
    if (!fillingStartedAtRef.current) {
      fillingStartedAtRef.current = Date.now();
      if (!isLiveMode && draftId) {
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
        // Only sync to draftStore in local mode (server is source of truth in live mode)
        if (!isLiveMode && draftId) {
          draftStore.updateDraft(draftId, { players: count, status: 'filling' });
        }
        return count;
      });
    }, fillingInterval);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  // ==================== LIVE MODE: Poll server for draft order + player count ====================
  // Runs during filling AND pre-spin/spinning/result — server may create state/info
  // document after bots join, so we keep polling to pick up wallet addresses.
  useEffect(() => {
    if (!isLiveMode || !draftId) return;
    if (phase === 'drafting' || phase === 'loading') return; // Stop polling during loading (loading effect handles it) and drafting (engine handles state)

    let cancelled = false;

    const poll = async () => {
      try {
        console.log('[Draft Room] Polling getDraftInfo for', draftId);
        const info = await draftApi.getDraftInfo(draftId);
        if (cancelled) return;

        console.log('[Draft Room] Poll result:', info.draftOrder?.length ?? 0, 'players');

        if (info.draftOrder && info.draftOrder.length > 0) {
          if (phase === 'filling') {
            if (info.draftOrder.length >= 10) {
              console.log('[Draft Room] Poll detected 10/10 — letting at-10 effect handle transition');
            }
          } else {
            // After filling (pre-spin/spinning/result), update draftOrder normally
            const mappedOrder = info.draftOrder.map((entry: { ownerId: string }, idx: number) => {
              const isUser = entry.ownerId.toLowerCase() === walletParam.toLowerCase();
              return {
                id: String(idx + 1),
                name: entry.ownerId,
                displayName: isUser ? 'You' : entry.ownerId.slice(0, 6) + '...' + entry.ownerId.slice(-4),
                isYou: isUser,
                avatar: '🍌',
              };
            });
            setDraftOrder(mappedOrder);
            const userPos = mappedOrder.findIndex((p: { isYou: boolean }) => p.isYou);
            if (userPos >= 0) setUserDraftPosition(userPos);
            setPlayerCount(prev => Math.max(prev, info.draftOrder.length));
          }
        }
      } catch (err) {
        console.warn('[Draft Room] Poll failed:', err);
        // Draft not ready yet — keep polling
      }
    };

    poll(); // Immediate first check
    const interval = setInterval(poll, 2500);
    return () => { cancelled = true; clearInterval(interval); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLiveMode, phase, draftId, walletParam]);

  // ---- "At 10" effect: triggers server poll (live) or immediate transition (local) ----
  useEffect(() => {
    if (phase !== 'filling' || playerCount < 10) return;
    if (isLiveMode && !draftId) return;

    // If pre-spin already started (e.g., syncLiveDrafts set it while user was on drafting page),
    // don't restart the randomizing bar — loading phase will handle the transition
    const currentState = draftId ? draftStore.getDraft(draftId) : null;
    if (currentState?.preSpinStartedAt) return;

    if (!isLiveMode) {
      // LOCAL MODE: transition immediately
      const shuffled = [...DRAFT_PLAYERS].sort(() => Math.random() - 0.5);
      setServerPollResult({ order: shuffled, countdownStart: Date.now() });
      return;
    }

    // LIVE MODE: poll server for draft order
    if (serverPollStartedRef.current) return; // Already polling
    serverPollStartedRef.current = true;
    setWaitingForServer(true);

    // Reuse existing timestamp if resuming (e.g., re-entering from drafting page)
    // so the progress bar continues from where it was, not restarting
    const existingTimestamp = draftId ? draftStore.getDraft(draftId)?.randomizingStartedAt : undefined;
    const randomizingStartedAt = existingTimestamp || Date.now();

    // Compute initial progress from elapsed time so the bar doesn't flash to 0%
    const progressDuration = 3000;
    const initialElapsed = Date.now() - randomizingStartedAt;
    const initialT = Math.min(1, initialElapsed / progressDuration);
    const initialProgress = 0.99 * (1 - Math.pow(1 - initialT, 3));
    setServerWaitProgress(initialProgress);
    serverWaitProgressRef.current = initialProgress;

    // Sync to draftStore so drafting page can show progress bar
    if (draftId) {
      draftStore.updateDraft(draftId, { randomizingStartedAt, players: 10 });
    }
    const MIN_RANDOMIZING_MS = 2000;
    const pollDraftId = draftId; // Capture for async closure

    const PROGRESS_DURATION_MS = 3000;
    const RETRY_DELAY_MS = 2000;
    const MAX_RETRIES = 30;

    // Smooth progress animation — ticks every 50ms, reaches ~99% over PROGRESS_DURATION_MS
    // Independent of API attempts so the bar moves smoothly
    let pollDone = false;
    const progressInterval = setInterval(() => {
      if (pollDone) { clearInterval(progressInterval); return; }
      const elapsed = Date.now() - randomizingStartedAt;
      // Cubic ease-out: fills quickly then decelerates near end
      const t = Math.min(1, elapsed / PROGRESS_DURATION_MS);
      const progress = 0.99 * (1 - Math.pow(1 - t, 3)); // cubic ease-out, cap 99%
      serverWaitProgressRef.current = progress;
      setServerWaitProgress(progress);
    }, 50);

    (async () => {
      let attempts = 0;
      while (attempts < MAX_RETRIES) {
        attempts++;
        try {
          console.log(`[Draft Room] Waiting for server (attempt ${attempts})...`);

          const info = await draftApi.getDraftInfo(pollDraftId);

          if (!info.draftOrder || info.draftOrder.length < 10) {
            throw new Error(`Draft order incomplete: ${info.draftOrder?.length || 0}/10`);
          }

          const realOrder = info.draftOrder.map((u: { ownerId: string }, idx: number) => ({
            id: String(idx + 1),
            name: u.ownerId,
            displayName: u.ownerId.length > 10
              ? u.ownerId.slice(0, 6) + '...' + u.ownerId.slice(-4)
              : u.ownerId,
            isYou: u.ownerId.toLowerCase() === walletParam.toLowerCase(),
            avatar: '🍌',
          }));

          pollDone = true;
          clearInterval(progressInterval);
          // Don't setDraftOrder here — wait for bar to finish + transition effect to handle it.
          // Setting it early causes wallets to appear in the header before the bar reaches 100%.
          console.log('[Draft Room] Wallets loaded:', realOrder.map((p: { displayName: string }) => p.displayName));

          // Ensure minimum total display time — animate progress smoothly over remaining time
          const elapsed = Date.now() - randomizingStartedAt;
          const remainingMs = Math.max(300, MIN_RANDOMIZING_MS - elapsed);
          const currentProgress = serverWaitProgressRef.current;
          await new Promise<void>(resolve => {
            const steps = Math.max(10, Math.floor(remainingMs / 50));
            const stepTime = remainingMs / steps;
            let step = 0;
            const finishInterval = setInterval(() => {
              step++;
              const t = step / steps;
              // Smooth ease-out from current progress to 100%
              const smoothed = currentProgress + (1 - currentProgress) * (1 - Math.pow(1 - t, 2));
              serverWaitProgressRef.current = smoothed;
              setServerWaitProgress(smoothed);
              if (step >= steps) {
                clearInterval(finishInterval);
                setServerWaitProgress(1);
                resolve();
              }
            }, stepTime);
          });

          // Store result in state — the transition effect below will pick it up
          console.log('[Draft Room] Setting serverPollResult to trigger transition');
          setServerPollResult({ order: realOrder, countdownStart: Date.now() });
          return;
        } catch (err) {
          console.warn(`[Draft Room] Server not ready (attempt ${attempts}):`, err instanceof Error ? err.message : err);
          await new Promise(r => setTimeout(r, RETRY_DELAY_MS));
        }
      }
      // Exhausted — fall back to local
      pollDone = true;
      clearInterval(progressInterval);
      console.log('[Draft Room] Server poll exhausted — falling back to local');
      const shuffled = [...DRAFT_PLAYERS].sort(() => Math.random() - 0.5);
      setServerPollResult({ order: shuffled, countdownStart: Date.now() });
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, playerCount, draftId]);

  // ---- Transition effect: when serverPollResult is set, move to pre-spin ----
  useEffect(() => {
    if (!serverPollResult) return;
    // Only transition if we're still in filling phase
    if (phase !== 'filling') {
      setServerPollResult(null);
      return;
    }

    const { order, countdownStart } = serverPollResult;
    setServerPollResult(null); // Consume the result

    const userPos = order.findIndex((p: { isYou: boolean }) => p.isYou);
    setDraftOrder(order);
    setUserDraftPosition(userPos);
    setWaitingForServer(false);

    preSpinStartedAtRef.current = countdownStart;
    if (isLiveMode) setLiveDataReady(true);

    if (specialTypeParam) {
      // Special drafts: skip slot machine, go straight to 1-minute countdown
      setDraftType(specialTypeParam);
      setPhase('countdown');
      const remaining = Math.max(0, Math.floor(60 - (Date.now() - countdownStart) / 1000));
      setMainCountdown(remaining);
      if (draftId) {
        draftStore.updateDraft(draftId, {
          phase: 'countdown', preSpinStartedAt: countdownStart,
          randomizingStartedAt: undefined, draftOrder: order, userDraftPosition: userPos,
          type: specialTypeParam, draftType: specialTypeParam,
        });
      }
    } else {
      // Regular drafts: pre-spin → slot machine → drafting
      setPhase('pre-spin');
      setPreSpinCountdown(15);
      const remaining = Math.max(0, Math.floor(60 - (Date.now() - countdownStart) / 1000));
      setMainCountdown(remaining);
    }

    // Track promos — only paid drafts count (free drafts don't earn promo progress)
    const id = draftId || urlDraftId;
    const promoUserId = user?.id || walletParam?.toLowerCase();
    if (id && promoUserId && isPaidDraft) {
      const trackedKey = `promo-tracked:${id}`;
      if (!localStorage.getItem(trackedKey)) {
        localStorage.setItem(trackedKey, '1');
        console.log('[Promo] Tracking draft start for daily-drafts:', { userId: promoUserId, draftId: id });
        fetch('/api/promos/draft-complete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: promoUserId, draftId: id }),
        }).then(r => r.json()).then(data => {
          console.log('[Promo] Draft tracked:', data?.promo?.progressCurrent, '/', data?.promo?.progressMax);
        }).catch(err => {
          console.error('[Promo] Failed to track draft:', err);
        });
      }
    }

    // Track Pick 10 promo — if user got the 10th pick position (index 9)
    // userPos comes from order.findIndex(p => p.isYou) — 0-indexed, so pick #10 = index 9
    console.log('[Promo] Pick position check:', { userPos, pickNumber: userPos + 1, id, promoUserId: !!promoUserId });
    if (id && promoUserId && isPaidDraft && userPos === 9) {
      const pick10Key = `promo-pick10:${id}`;
      if (!localStorage.getItem(pick10Key)) {
        localStorage.setItem(pick10Key, '1');
        console.log('[Promo] User got Pick 10! Firing API...');
        fetch('/api/promos/pick10', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: promoUserId, draftId: id, draftName: contestName }),
        }).then(r => r.json()).then(data => {
          console.log('[Promo] Pick 10 recorded:', data?.promo?.claimCount, 'spins claimable');
        }).catch(err => {
          console.error('[Promo] Pick 10 tracking failed:', err);
        });
      } else {
        console.log('[Promo] Pick 10 already tracked for this draft');
      }
    }

    // Draft type is assigned by the backend when draft fills (league.Level).
    // Fetch it now; fall back to stored type or 'pro' if unavailable.
    // Skip for special drafts — specialTypeParam is the source of truth.
    if (id && walletParam && !specialTypeParam) {
      getDraftTokenLevel(walletParam, id).then(level => {
        if (!level) return;
        const typeMap: Record<string, DraftType> = { 'Jackpot': 'jackpot', 'Hall of Fame': 'hof', 'Pro': 'pro' };
        const mapped = typeMap[level] || 'pro';
        setDraftType(mapped);
        if (draftId) draftStore.updateDraft(draftId, { type: mapped, draftType: mapped });
      }).catch(() => {});
    }

    if (draftId) {
      draftStore.updateDraft(draftId, {
        phase: 'pre-spin',
        preSpinStartedAt: countdownStart,
        randomizingStartedAt: undefined,
        draftOrder: order,
        userDraftPosition: userPos,
        type: specialTypeParam || draftType,
        draftType: specialTypeParam || draftType,
      });
    }
    console.log('[Draft Room] Transitioned to pre-spin phase');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serverPollResult]);

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
    if (draftId) {
      draftStore.updateDraft(draftId, {
        phase: 'spinning',
        draftType: selectedResult,
        type: selectedResult,
        yourPosition: userDraftPosition >= 0 ? userDraftPosition + 1 : undefined,
      });
    }
    setAllReelItems([
      generateReelItemsForReel(reelResults[0], 0),
      generateReelItemsForReel(reelResults[1], 1),
      generateReelItemsForReel(reelResults[2], 2),
    ]);
    setShowSlotMachine(true);
    slotActiveRef.current = true;
    setSlotAnimationDone(false);
    setPhase('spinning');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, preSpinCountdown]);

  // Main countdown (timestamp-based, for spinning/result/countdown phases)
  useEffect(() => {
    if (phase !== 'spinning' && phase !== 'result' && phase !== 'countdown') return;
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
  // ==================== COUNTDOWN END: Transition to active drafting ====================
  useEffect(() => {
    if (phase !== 'pre-spin' && phase !== 'spinning' && phase !== 'result' && phase !== 'countdown') return;
    if (mainCountdown > 0) return;

    // Clean up visual effects
    setShowSlotMachine(false);
    setScreenShake(false);
    setJackpotRain([]);
    setConfetti([]);
    setPulseGlow(false);
    setParticleBurst([]);

    if (isLiveMode) {
      if (engineReady) {
        // loadLiveData already initialized the engine from real server data — just transition phase.
        // The countdown was synced to the server's draftStartTime, so when it hits 0 the server
        // is ready and WS timer_update will start the 30-second pick timer naturally.
        console.log('[Draft Room] Engine ready from server — starting real multiplayer draft');
        setPhase('drafting');
        if (draftId) {
          draftStore.updateDraft(draftId, { phase: 'drafting', status: 'drafting', players: 10, isYourTurn: false });
        }
      } else {
        // Server data not loaded yet — fall back to local mode immediately so bots
        // start picking right away instead of waiting for server retries to exhaust.
        console.log('[Draft Room] Countdown finished, engine not ready — falling back to local mode');
        setFallbackLocal(true);
        setPhase('drafting');
        if (draftOrder.length > 0) {
          engine.initializeDraft(draftOrder);
        }
        setEngineReady(true);
        if (draftId) {
          draftStore.updateDraft(draftId, { phase: 'drafting', status: 'drafting', players: 10, isYourTurn: false });
        }
      }
    } else {
      // Local mode: initialize engine directly
      setPhase('drafting');
      if (draftOrder.length > 0) {
        engine.initializeDraft(draftOrder);
      }
      setEngineReady(true);
      if (draftId) {
        draftStore.updateDraft(draftId, { status: 'drafting', phase: 'drafting', players: 10, isYourTurn: false });
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, mainCountdown, draftOrder, isLiveMode, engineReady, fallbackLocal]);

  // Note: No safety fallback needed — engine is always initialized immediately when countdown ends.
  // In live mode, loadLiveData continues retrying in the background and initializeFromServer()
  // overwrites the local engine state with real server data when it succeeds.

  useEffect(() => {
    if (mainCountdown <= 15 && showSlotMachine && slotAnimationDone) {
      setShowSlotMachine(false);
      if (draftId) draftStore.updateDraft(draftId, { slotDismissed: true });
    }
  }, [mainCountdown, showSlotMachine, slotAnimationDone, draftId]);

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

  // Trigger celebration effects when entering 'result' phase with HOF/Jackpot
  // This handles both live animation completion AND late re-entry
  useEffect(() => {
    if (phase !== 'result') return;
    if (draftType !== 'jackpot' && draftType !== 'hof') return;
    // If screenShake is already on, the live animation already triggered these
    if (screenShake) return;

    // Start celebration effects (same as spinning animation completion)
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
    setTimeout(() => setConfetti([]), 6000);

    setJackpotRain(Array.from({ length: 35 }, (_, i) => ({
      id: i, x: Math.random() * 100,
      delay: Math.random() * 2.5,
      size: 16 + Math.random() * 24,
    })));
  }, [phase, draftType, screenShake]);

  // ==================== SPINNING ANIMATION ====================
  useEffect(() => {
    if (phase !== 'spinning') return;
    if (allReelItems[0]?.length === 0) return;

    const itemHeight = 130;
    const landingIndex = (allReelItems[0]?.length || 50) - 8;
    const targetOffset = landingIndex * itemHeight;
    const reelDurations = [2000, 4000, 6000];
    const offset = animationOffsetRef.current;
    animationOffsetRef.current = 0; // Reset after use
    const startTime = performance.now() - offset;
    let animationId: number;
    const stoppedReels = [false, false, false];
    // Mark reels that are already stopped from the offset (don't play sound for them)
    for (let i = 0; i < 3; i++) {
      if (offset >= reelDurations[i]) stoppedReels[i] = true;
    }
    const easeOutQuint = (t: number): number => 1 - Math.pow(1 - t, 5);

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const newOffsets = [0, 0, 0];
      let allStopped = true;

      for (let i = 0; i < 3; i++) {
        const progress = Math.min(elapsed / reelDurations[i], 1);
        newOffsets[i] = easeOutQuint(progress) * targetOffset;
        if (progress >= 1 && !stoppedReels[i]) { stoppedReels[i] = true; if (slotActiveRef.current) playReelStop(); }
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
          if (slotActiveRef.current) playWinSound(draftType === 'jackpot' || draftType === 'hof');
          setSlotAnimationDone(true);
          setPhase('result');
          const currentDraftId = draftIdRef.current;
          if (currentDraftId) {
            // NOW reveal the type to draftStore — slot machine animation is done
            draftStore.updateDraft(currentDraftId, { phase: 'result', type: draftType, draftType: draftType });
          }
        }, 400);
      }
    };

    const isResuming = offset > 0;
    const startTimeout = setTimeout(() => {
      if (!isResuming && slotActiveRef.current) playSpinningSound();
      animationId = requestAnimationFrame(animate);
    }, isResuming ? 0 : 200); // No delay on resume — start immediately

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

  // ==================== FIREBASE WATCHDOG: Detect stale RTDB connections & recover ====================
  // Runs every 10 seconds during live drafting phase.
  // If no Firebase RTDB update in 30s, re-fetch draft state via REST to catch missed picks.
  // Firebase automatically handles reconnection, so we only need to supplement with REST re-syncs.
  useEffect(() => {
    if (!isLiveMode || !draftId || engine.draftStatus === 'completed') return;

    const STALE_THRESHOLD = 30_000; // 30 seconds without Firebase update = stale
    const CHECK_INTERVAL = 10_000;  // Check every 10 seconds

    const interval = setInterval(() => {
      const elapsed = Date.now() - lastFirebaseUpdateRef.current;

      if (elapsed > STALE_THRESHOLD) {
        console.warn(`[Watchdog] No Firebase RTDB update in ${Math.round(elapsed / 1000)}s — re-syncing from REST`);

        // Re-fetch draft state via REST to catch any missed picks
        if (liveInitializedRef.current) {
          draftApi.getDraftSummary(draftId).then(summary => {
            const summaryArr = Array.isArray(summary) ? summary : (summary as any).summary || [];
            if (summaryArr.length > 0) {
              engine.refreshSummaryPicks(summaryArr);
              console.log(`[Watchdog] Re-synced ${summaryArr.filter((s: any) => s.playerInfo?.playerId).length} picks from REST`);
            }
          }).catch(() => {});

          // Also re-fetch draft info for current drafter/pick state
          draftApi.getDraftInfo(draftId).then(info => {
            engine.handleDraftInfoUpdate({
              draftId: info.draftId,
              displayName: info.displayName,
              draftStartTime: info.draftStartTime,
              pickLength: info.pickLength,
              currentDrafter: info.currentDrafter,
              pickNumber: info.pickNumber,
              roundNum: info.roundNum,
              pickInRound: info.pickInRound,
              draftOrder: info.draftOrder,
              adp: info.adp.map(a => ({
                adp: a.adp,
                byeWeek: String(a.bye ?? a.byeWeek ?? ''),
                playerId: a.playerId,
              })),
            });
            console.log(`[Watchdog] Re-synced draft info: pick ${info.pickNumber}, drafter ${info.currentDrafter.slice(0, 8)}...`);
          }).catch(() => {});
        }

        // Reset the timer so we don't spam REST calls
        lastFirebaseUpdateRef.current = Date.now();
      }
    }, CHECK_INTERVAL);

    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLiveMode, draftId, engine.draftStatus]);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}:${m < 10 ? `0${m}` : m}:${s < 10 ? `0${s}` : s}`;
    return `${m < 10 ? `0${m}` : m}:${s < 10 ? `0${s}` : s}`;
  };

  // Best available time remaining — prefer Firebase RTDB timestamp for accuracy,
  // fall back to engine time (which may come from WS or be slightly stale)
  const bestTimeRemaining = (firebaseActive && firebaseTimeRemaining !== null)
    ? firebaseTimeRemaining
    : engine.timeRemaining;

  // All phases share the same layout — no separate filling page

  // ==================== TIMESTAMP-DERIVED RANDOMIZING STATE ====================
  // Derive "randomizing" display from draftStore timestamp — works identically on
  // first entry AND re-entry with zero dependency on effects firing correctly.
  // This is the same approach the drafting page uses (getLiveState).
  const storedNow = draftId ? draftStore.getDraft(draftId) : null;
  const isRandomizingFromStore = !!(storedNow?.randomizingStartedAt && !storedNow?.preSpinStartedAt);
  const randomizingProgressFromStore = isRandomizingFromStore
    ? (() => {
        const elapsed = Date.now() - storedNow!.randomizingStartedAt!;
        const t = Math.min(1, elapsed / 3000);
        return 0.99 * Math.pow(t, 0.6);
      })()
    : 0;

  // Force re-renders for smooth animation when using the timestamp fallback
  // (before the at-10 effect kicks in and starts its own progress interval)
  const [, forceRender] = useState(0);
  useEffect(() => {
    if (!isRandomizingFromStore || waitingForServer) return;
    const ticker = setInterval(() => forceRender(v => v + 1), 50);
    return () => clearInterval(ticker);
  }, [isRandomizingFromStore, waitingForServer]);

  // Draft type that's only visible AFTER slot animation finishes — prevents spoiling the result
  const visibleDraftType = specialTypeParam || slotAnimationDone || phase === 'drafting' || phase === 'filling' || phase === 'countdown' || !showSlotMachine ? draftType : null;

  const getBgColor = () => {
    return 'bg-black';
  };

  // Helper to get position counts for banner cards
  const getPositionCountsForPlayer = (playerName: string) => {
    const roster = engine.rosters[playerName];
    if (!roster) return { QB: 0, RB: 0, WR: 0, TE: 0, DST: 0 };
    return {
      QB: roster.QB?.length ?? 0,
      RB: roster.RB?.length ?? 0,
      WR: roster.WR?.length ?? 0,
      TE: roster.TE?.length ?? 0,
      DST: roster.DST?.length ?? 0,
    };
  };

  // Roster view switch — clicking a player card shows their roster
  const [rosterViewPlayer, setRosterViewPlayer] = useState<string | undefined>(undefined);
  const handleViewRoster = (playerName: string) => {
    setRosterViewPlayer(playerName);
    setActiveTab('roster');
  };

  // ==================== RENDER ====================

  return (
    <div className={`min-h-screen text-white overflow-hidden flex flex-col transition-colors duration-1000 ${getBgColor()} ${screenShake ? 'animate-shake' : ''}`}>
      {/* Auto-draft notification — shown when auto-draft is enabled due to inactivity */}
      {showAutoDraftNotification && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-xl bg-emerald-900/95 border border-emerald-500/50 shadow-2xl backdrop-blur-sm animate-fade-in-down">
          <div className="flex items-center gap-3">
            <span className="text-emerald-400 font-bold text-sm">Auto-draft enabled</span>
            <span className="text-white/60 text-xs">You missed {missedPicksCount}+ picks in a row</span>
          </div>
        </div>
      )}

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
      {pulseGlow && visibleDraftType && (visibleDraftType === 'jackpot' || visibleDraftType === 'hof') && (
        <div
          className="fixed inset-0 z-30 pointer-events-none animate-pulse-glow"
          style={{
            background: visibleDraftType === 'jackpot'
              ? 'radial-gradient(circle at center, rgba(239, 68, 68, 0.3) 0%, transparent 70%)'
              : 'radial-gradient(circle at center, rgba(255, 215, 0, 0.3) 0%, transparent 70%)',
          }}
        />
      )}

      {/* Text Rain */}
      {jackpotRain.length > 0 && visibleDraftType && (
        <div className="fixed inset-0 z-[60] pointer-events-none overflow-hidden">
          {jackpotRain.map((item) => (
            <div
              key={item.id}
              className={`absolute animate-jackpot-rain font-black italic ${visibleDraftType === 'jackpot' ? 'text-red-500' : 'text-yellow-400'}`}
              style={{
                left: `${item.x}%`, fontSize: `${item.size}px`,
                animationDelay: `${item.delay}s`,
                textShadow: visibleDraftType === 'jackpot'
                  ? '0 0 10px rgba(239, 68, 68, 0.8)'
                  : '0 0 10px rgba(250, 204, 21, 0.8)',
              }}
            >
              {visibleDraftType === 'jackpot' ? 'JACKPOT' : 'HOF'}
            </div>
          ))}
        </div>
      )}

      {/* Top Bar — during filling, loading, or when draft completed */}
      {(phase === 'filling' || phase === 'countdown' || phase === 'loading' || engine.draftStatus === 'completed') && (
        <div className="h-14 bg-black/30 border-b border-white/10 flex items-center justify-between px-4 flex-shrink-0">
          <div className="flex items-center gap-4">
            <span className="font-bold">{contestName}</span>
            {visibleDraftType && (phase !== 'filling' || specialTypeParam) && (
              <>
                <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                  visibleDraftType === 'jackpot' ? 'bg-red-500/30 text-red-400' :
                  visibleDraftType === 'hof' ? 'bg-yellow-500/30 text-yellow-400' :
                  'bg-purple-500/30 text-purple-400'
                }`}>{visibleDraftType.toUpperCase()}</span>
                <VerifiedBadge type="draft-type" draftType={visibleDraftType} />
              </>
            )}
            {phase === 'filling' && !specialTypeParam && (
              <span className="px-2 py-0.5 rounded text-xs font-bold bg-white/10 text-white/50">UNREVEALED</span>
            )}
          </div>
          <div className="flex items-center gap-4">
            {phase === 'filling' && isLiveMode && (
              <button
                onClick={() => setShowLeaveConfirm(true)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-white/40 hover:text-red-400 hover:bg-red-400/10 border border-white/10 hover:border-red-400/30 transition-all"
              >
                Leave
              </button>
            )}
            {phase === 'drafting' && engine.draftStatus === 'active' && (
              <>
                {engine.isUserTurn && (
                  <div className={`px-3 py-1 rounded-full text-sm font-bold ${
                    bestTimeRemaining <= 10 ? 'bg-red-500 animate-pulse' : 'bg-yellow-500 text-black'
                  }`}>
                    {formatTime(bestTimeRemaining)}
                  </div>
                )}
                <span className="text-white/50 text-sm">Pick {engine.currentPickNumber}/{TOTAL_PICKS}</span>
              </>
            )}
          </div>
        </div>
      )}

      {/* Live mode loading is handled by the loading skeleton in the player list area */}

      {/* Live mode error — floating card (non-blocking) */}
      {isLiveMode && liveError && !fallbackLocal && (
        <div className="fixed top-[200px] left-1/2 -translate-x-1/2 z-30 w-full max-w-lg px-4">
          <div className="bg-red-950/95 border border-red-500/50 rounded-xl p-4 shadow-2xl backdrop-blur-sm">
            <div className="flex items-start gap-3">
              <span className="text-2xl flex-shrink-0">⚠️</span>
              <div className="flex-1 min-w-0">
                <p className="text-red-400 font-bold text-sm">Draft connection error</p>
                <p className="text-white/50 text-xs mt-1 break-words">{liveError}</p>
              </div>
              <button onClick={() => setLiveError(null)} className="text-white/40 hover:text-white flex-shrink-0 text-lg leading-none">&times;</button>
            </div>
            <div className="flex gap-2 mt-3">
              <button
                onClick={() => {
                  liveRetryCountRef.current = 0;
                  liveInitializedRef.current = false;
                  setLiveError(null);
                  setLiveDataReady(false);
                  setTimeout(() => setLiveDataReady(true), 100);
                }}
                className="px-4 py-1.5 bg-banana text-black font-bold rounded-lg text-sm hover:bg-banana-light transition-all"
              >
                Retry
              </button>
              <button
                onClick={() => window.history.back()}
                className="px-4 py-1.5 bg-white/10 text-white font-bold rounded-lg text-sm hover:bg-white/20 transition-all"
              >
                Go Back
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Live mode connection indicator — shows Firebase RTDB listener status (or WS if fallback) */}
      {isLiveMode && (phase === 'drafting' || phase === 'loading' || phase === 'filling') && (
        <div className="absolute top-16 right-4 z-20 flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${firebaseRtdb.isListening || ws.isConnected ? 'bg-green-500' : 'bg-red-500 animate-pulse'}`} />
          <span className="text-xs text-white/40">{firebaseRtdb.isListening ? 'Live' : ws.isConnected ? 'WS' : 'Connecting...'}</span>
        </div>
      )}

      {/* Loading phase — brief spinner while checking server state on re-entry */}
      {phase === 'loading' && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-10 h-10 border-2 border-banana border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-white/60 text-sm">Reconnecting to draft...</p>
          </div>
        </div>
      )}

      {/* Filling/pre-drafting overlays removed — all status shown inline in unified banner */}

      {/* ==================== UNIFIED BANNER (ALL phases including loading) ==================== */}
      {engine.draftStatus !== 'completed' && (
        <>
          {/* Pick Cards Banner */}
          <div className="fixed top-0 left-0 z-[55] w-full overflow-hidden font-primary" style={{ backgroundColor: '#000' }}>
            <div
              ref={bannerRef}
              className="w-full flex gap-2 lg:gap-5 overflow-x-auto banner-no-scrollbar"
              style={{ marginTop: '15px' }}
            >
              {/* Engine-powered banner (after data loads) OR pre-engine 10-box banner */}
              {engineReady && engine.draftSummary.length > 0 ? engine.draftSummary.map((slot) => {
                const isPicked = slot.playerId !== '';
                const isCurrent = slot.pickNum === engine.currentPickNumber;
                const isUpcoming = slot.pickNum > engine.currentPickNumber;
                const isUserCard = slot.ownerIndex === engine.userDraftPosition;
                const posHex = isPicked ? getPositionColorHex(slot.position) : '';
                const counts = getPositionCountsForPlayer(slot.ownerName);

                // Border color: user = banana yellow, current = white, others = #444
                const borderColor = isUserCard ? '#F3E216' : isCurrent ? '#fff' : '#444';
                // Text color based on league level
                const textColor = visibleDraftType === 'hof' && isUserCard ? '#111'
                  : visibleDraftType === 'jackpot' && isUserCard ? '#222'
                  : '#fff';

                const playerData = engine.draftOrder[slot.ownerIndex];
                let displayName = '';
                if (playerData) {
                  if (playerData.isYou) {
                    displayName = (user?.username && !user.username.startsWith('0x')) ? user.username : 'You';
                  } else {
                    const raw = playerData.name || playerData.displayName || '';
                    displayName = raw.length > 14 ? `${raw.slice(0, 6)}...${raw.slice(-4)}` : raw;
                  }
                } else {
                  displayName = slot.ownerName || '';
                }
                const truncatedName = (displayName || '').length > 14 ? (displayName || '').substring(0, 12) + '...' : (displayName || '');

                return (
                  <div
                    key={slot.pickNum}
                    data-pick={slot.pickNum}
                    className="flex-shrink-0 text-center overflow-hidden cursor-pointer"
                    style={{
                      minWidth: 'clamp(100px, 12vw, 140px)',
                      flex: 1,
                      padding: '10px 0 0 0',
                      borderRadius: '5px',
                      borderWidth: 1,
                      borderStyle: 'solid',
                      borderColor: borderColor,
                      transition: 'all 0.25s ease-in-out',
                      background: isUserCard
                        ? (visibleDraftType === 'hof' ? '#F3E216' : visibleDraftType === 'jackpot' ? '#FF474C' : '#222')
                        : '#222',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = '#333'; e.currentTarget.style.borderColor = '#fff'; }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = isUserCard
                        ? (visibleDraftType === 'hof' ? '#F3E216' : visibleDraftType === 'jackpot' ? '#FF474C' : '#222')
                        : '#222';
                      e.currentTarget.style.borderColor = borderColor;
                    }}
                    onClick={() => handleViewRoster(slot.ownerName)}
                  >
                    <div>
                      {/* Profile image — always shown */}
                      {isUserCard && user?.profilePicture ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={user.profilePicture} alt="You" className="rounded-full w-[30px] h-[30px] mx-auto border border-gray-500 object-cover" />
                      ) : (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src="/banana-profile.png" alt="Banana" className="rounded-full w-[30px] mx-auto h-[30px] border border-gray-500" />
                      )}

                      {/* Timer (current pick) OR R/P labels (all other picks) — matches old layout */}
                      {isCurrent && engine.draftStatus !== 'completed' ? (
                        <div style={{
                          fontWeight: 'bold',
                          fontSize: '18px',
                          margin: '5px auto 0px auto',
                          textAlign: 'center',
                          color: (phase === 'drafting' || (phase === 'loading' && stored?.phase === 'drafting') ? bestTimeRemaining : mainCountdown) > 10 ? '#fff' : (visibleDraftType === 'jackpot' ? 'yellow' : 'red'),
                        }}>
                          {formatTime(phase === 'drafting' || (phase === 'loading' && stored?.phase === 'drafting') ? bestTimeRemaining : mainCountdown)}
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 15, marginTop: 5, paddingBottom: 3 }}>
                          <span style={{ fontSize: '15px', fontWeight: 800, color: textColor }}>R{slot.round}</span>
                          <span style={{ fontSize: '15px', fontWeight: 800, color: textColor }}>P{slot.pickNum}</span>
                        </div>
                      )}

                      {/* Display name — always shown */}
                      <div className="lg:mt-1 font-bold text-[11px] lg:text-[14px] font-primary" style={{ color: textColor }}>
                        {truncatedName}
                      </div>

                      {/* Bottom section: position counts (upcoming), status text (current), or player ID (completed) */}
                      {isUpcoming && (
                        <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', minHeight: '54px', color: textColor }}>
                          {(['QB', 'RB', 'WR', 'TE', 'DST'] as const).map(pos => (
                            <div
                              key={pos}
                              style={{ flex: 1, borderTopWidth: '2px', borderTopStyle: 'solid', borderTopColor: POSITION_COLORS[pos], textAlign: 'center' }}
                            >
                              <p style={{ fontSize: '10px' }}>{pos}</p>
                              <p className="text-xs">{counts[pos]}</p>
                            </div>
                          ))}
                        </div>
                      )}
                      {isCurrent && (
                        <div style={{ borderBottomWidth: 5, borderBottomStyle: 'solid', borderBottomColor: '#fff', width: '100%', minHeight: '54px' }}>
                          <p className="font-primary text-[15px] font-bold italic text-center pt-2" style={{ color: textColor }}>
                            {phase === 'drafting' || (phase === 'loading' && stored?.phase === 'drafting') ? 'Picking...' : 'Starting soon!'}
                          </p>
                        </div>
                      )}
                      {isPicked && (
                        <div style={{ borderBottomWidth: 5, borderBottomStyle: 'solid', borderBottomColor: posHex, width: '100%', height: '55px' }}>
                          <p className="font-primary" style={{ fontWeight: 800, fontSize: 15, textAlign: 'center', paddingTop: 5, color: textColor }}>
                            {slot.playerId}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              }) : /* Pre-engine: unified 10-box banner for filling + pre-spin + spinning + result */
              Array.from({ length: 10 }, (_, i) => {
                const player = draftOrder[i];
                const isFilling = phase === 'filling';
                const isRandomizing = isFilling && (waitingForServer || isRandomizingFromStore);
                const isUser = player?.isYou ?? false;
                // User's card is always "filled" even if playerCount hasn't caught up yet
                const isFilled = isRandomizing ? true : isFilling ? (isUser || i < playerCount) : true;
                // Match drafting card style: user = yellow border, filled = #444, unfilled = #333
                const borderColor = isUser
                  ? '#F3E216'
                  : isFilled ? '#444' : '#333';
                // Show wallet addresses when available, placeholder names otherwise
                const hasWalletData = player && !player.isYou && player.name && player.name.length > 10;
                const myName = (user?.username && !user.username.startsWith('0x')) ? user.username : 'You';
                let displayName = '';
                if (isRandomizing) {
                  displayName = isUser ? myName : (hasWalletData ? `${player!.name.slice(0, 6)}...${player!.name.slice(-4)}` : `Player ${i + 1}`);
                } else if (isFilling) {
                  displayName = isUser ? myName : (isFilled ? `Player ${i + 1}` : '---');
                } else if (player) {
                  if (player.isYou) {
                    displayName = myName;
                  } else {
                    const raw = player.name || player.displayName || '';
                    displayName = raw.length > 14 ? `${raw.slice(0, 6)}...${raw.slice(-4)}` : raw;
                  }
                } else {
                  displayName = '???';
                }
                const truncatedName = (displayName || '').length > 14 ? (displayName || '').substring(0, 12) + '...' : (displayName || '');

                // During pre-spin+, first box shows countdown timer
                const showCountdown = !isFilling && i === 0;
                // User background matches drafting cards (draft-type color when known)
                const bgColor = isUser && isFilled
                  ? (visibleDraftType === 'hof' ? '#F3E216' : visibleDraftType === 'jackpot' ? '#FF474C' : '#222')
                  : '#222';
                const textColor = isUser && visibleDraftType === 'hof' ? '#111'
                  : isUser && visibleDraftType === 'jackpot' ? '#222'
                  : '#fff';

                return (
                  <div
                    key={i}
                    className="flex-shrink-0 text-center overflow-hidden cursor-pointer"
                    style={{
                      minWidth: 'clamp(100px, 12vw, 140px)',
                      flex: 1,
                      padding: '10px 0 0 0',
                      borderRadius: '5px',
                      borderWidth: 1,
                      borderStyle: 'solid',
                      borderColor,
                      transition: 'all 0.4s ease-in-out',
                      background: isFilled ? bgColor : '#1a1a1a',
                    }}
                  >
                    <div>
                      {/* Avatar — same as drafting cards */}
                      {isUser && user?.profilePicture ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={user.profilePicture} alt="You" className="rounded-full w-[30px] h-[30px] mx-auto border border-gray-500 object-cover" />
                      ) : (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src="/banana-profile.png"
                          alt="Banana"
                          className={`rounded-full w-[30px] mx-auto h-[30px] border border-gray-500 ${!isFilled ? 'animate-pulse' : ''}`}
                          style={{ opacity: isFilled ? 1 : 0.4 }}
                        />
                      )}

                      {/* Countdown timer (pre-spin+, first box) or slot number — same layout as drafting R/P labels */}
                      {showCountdown ? (
                        <div style={{ fontWeight: 'bold', fontSize: '18px', margin: '5px auto 0px auto', textAlign: 'center', color: textColor }}>
                          {formatTime(mainCountdown)}
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 15, marginTop: 5, paddingBottom: 3 }}>
                          <span style={{ fontSize: '15px', fontWeight: 800, color: isFilled ? textColor : '#444' }}>#{i + 1}</span>
                        </div>
                      )}

                      {/* Display name — same font/size as drafting cards */}
                      <div className={`lg:mt-1 font-bold text-[11px] lg:text-[14px] font-primary ${isRandomizing && !isUser ? 'animate-pulse' : ''}`} style={{ color: isFilled ? (isUser ? (visibleDraftType ? textColor : '#F3E216') : textColor) : '#444' }}>
                        {truncatedName}
                      </div>

                      {/* Bottom section — matches drafting card layout */}
                      {!isFilled ? (
                        // Unfilled: subtle waiting indicator with same height as position counts
                        <div style={{ minHeight: '54px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <span className="animate-pulse" style={{ fontSize: '12px', color: '#444' }}>Waiting...</span>
                        </div>
                      ) : showCountdown ? (
                        // Countdown box: "Starting soon!" with white bottom border (matches "Picking..." style)
                        <div style={{ borderBottomWidth: 5, borderBottomStyle: 'solid', borderBottomColor: '#fff', width: '100%', minHeight: '54px' }}>
                          <p className="font-primary text-[15px] font-bold italic text-center pt-2" style={{ color: '#4ade80' }}>
                            Starting soon!
                          </p>
                        </div>
                      ) : (
                        // Filled: position count columns (all zeros) — matches drafting "upcoming" cards
                        <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', minHeight: '54px', color: textColor }}>
                          {(['QB', 'RB', 'WR', 'TE', 'DST'] as const).map(pos => (
                            <div
                              key={pos}
                              style={{ flex: 1, borderTopWidth: '2px', borderTopStyle: 'solid', borderTopColor: POSITION_COLORS[pos], textAlign: 'center', opacity: 0.5 }}
                            >
                              <p style={{ fontSize: '10px' }}>{pos}</p>
                              <p className="text-xs">0</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Status text below banner — all phases */}
            <div className="grow text-center uppercase text-sm font-bold px-3 pt-2 mt-3 font-primary">
              {phase === 'filling' && (waitingForServer || isRandomizingFromStore) ? (
                <div className="flex flex-col items-center gap-2 w-full max-w-xs mx-auto">
                  <span className="text-white/70 text-xs tracking-widest uppercase">Randomizing Draft Order</span>
                  <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden backdrop-blur-sm">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${Math.round(Math.max(serverWaitProgress, randomizingProgressFromStore) * 100)}%`,
                        background: Math.max(serverWaitProgress, randomizingProgressFromStore) >= 1
                          ? '#4ade80'
                          : 'linear-gradient(90deg, #fbbf24, #f59e0b)',
                      }}
                    />
                  </div>
                  <span className="text-white/40 text-[10px]">{Math.round(Math.max(serverWaitProgress, randomizingProgressFromStore) * 100)}%</span>
                </div>
              ) : phase === 'filling' ? (
                <span className="text-yellow-400">
                  <span className="text-2xl font-black tabular-nums">{playerCount}/10</span>
                  <span className="text-white/60 ml-2 text-sm">Waiting for players...</span>
                </span>
              ) : phase === 'pre-spin' ? (
                <span className="text-yellow-400 flex items-center justify-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
                  {<>Draft type reveal in {preSpinCountdown}s<span className="text-white/50 ml-2">· Starting in {formatTime(mainCountdown)}</span></>
                  }
                </span>
              ) : phase === 'countdown' ? (
                <span className="text-white/70">Draft starting in {formatTime(mainCountdown)}</span>
              ) : (phase === 'spinning' || phase === 'result') ? (
                <span className="text-white/70">Draft starting in {formatTime(mainCountdown)}</span>
              ) : phase === 'drafting' && engine.isUserTurn && (engine.airplaneMode || autoDraft) ? (
                <span className="flex items-center justify-center gap-2 text-emerald-400">
                  Auto-drafting...
                </span>
              ) : phase === 'drafting' && engine.isUserTurn ? (
                'Your turn to draft!'
              ) : phase === 'drafting' && (engine.airplaneMode || autoDraft) && engine.turnsUntilUserPick > 0 ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="text-emerald-400">Auto-draft ON</span>
                  <span className="text-white/60">· {engine.turnsUntilUserPick} turn(s) away</span>
                </span>
              ) : phase === 'drafting' && engine.turnsUntilUserPick > 0 ? (
                `${engine.turnsUntilUserPick} turn(s) until your pick!`
              ) : null}
            </div>

            {/* Mute button + airplane mode + league logo row */}
            <div className="flex items-center justify-center gap-2 py-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.15)' }}>
              {visibleDraftType === 'hof' && (
                <div>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/hof-logo.jpg" alt="Hall of Fame" className="w-[50px] mr-2 h-auto" style={{ filter: 'sepia(100%) saturate(400%) brightness(110%) hue-rotate(10deg)' }} />
                </div>
              )}
              {visibleDraftType === 'jackpot' && (
                <div style={{ marginRight: '5px' }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/jackpot-logo.png" alt="Jackpot" className="w-[100px] mr-2 h-auto" />
                </div>
              )}
              <div>
                <button
                  onClick={handleToggleMute}
                  className="text-[12px] text-right cursor-pointer flex items-center justify-end border border-gray-500 px-1 font-primary"
                >
                  {isMuted ? 'UNMUTE' : 'MUTE'} <span className="ml-1">🎵</span>
                </button>
              </div>
              {/* Airplane mode toggle */}
              <button
                onClick={isLiveMode ? handleToggleAutoDraft : handleToggleAirplane}
                disabled={isLiveMode && autoDraftLoading}
                title={(isLiveMode ? autoDraft : engine.airplaneMode) ? 'Auto-draft ON — click to disable' : 'Auto-draft OFF — click to enable'}
                className={`cursor-pointer text-[12px] flex items-center justify-center border px-1 font-primary transition-all ${
                  (isLiveMode ? autoDraft : engine.airplaneMode)
                    ? 'border-emerald-500 text-emerald-400'
                    : 'border-gray-500 text-white/60'
                } ${isLiveMode && autoDraftLoading ? 'opacity-50 cursor-wait' : ''}`}
              >
                ✈️ {(isLiveMode ? autoDraft : engine.airplaneMode) ? 'ON' : 'OFF'}
              </button>
            </div>
          </div>

          {/* Spacer after fixed banner */}
          <div style={{ height: '290px', flexShrink: 0, backgroundColor: '#000' }} />

        </>
      )}

      {/* Main Content — single column, no sidebar (hidden during loading) */}
      <div className={`flex-1 flex flex-col overflow-hidden ${phase === 'loading' ? 'hidden' : ''}`}>
        {/* Tab navigation — inside content so it centers on the same width */}
        <DraftTabs activeTab={activeTab} onTabChange={setActiveTab} queueCount={engine.queuedPlayers.length} />

        {/* Tab content area */}
        {phase === 'drafting' && engine.draftStatus === 'completed' ? (
          <DraftComplete
            draftId={draftId || urlDraftId}
            generatedCardUrl={generatedCardUrl}
            walletAddress={walletParam}
          />
        ) : (
          <>
            {activeTab === 'draft' && (
              <DraftPlayerList
                availablePlayers={engine.availablePlayers}
                isUserTurn={phase === 'drafting' && engine.isUserTurn}
                onDraft={(playerId) => {
                  if (phase !== 'drafting') return;
                  handleLiveDraft(playerId);
                }}
                onAddToQueue={(player) => {
                  engine.addToQueue(player);
                  if (isLiveMode && phase === 'drafting') {
                    const newQueue = [...engine.queuedPlayers, player];
                    handleLiveQueueSync(newQueue);
                  }
                }}
                onRemoveFromQueue={(playerId) => {
                  engine.removeFromQueue(playerId);
                  if (isLiveMode && phase === 'drafting') {
                    const newQueue = engine.queuedPlayers.filter(p => p.playerId !== playerId);
                    handleLiveQueueSync(newQueue);
                  }
                }}
                isInQueue={(playerId) => engine.isInQueue(playerId)}
                onSortChange={handleSortChange}
              />
            )}
            {activeTab === 'queue' && (
              <DraftQueue
                queuedPlayers={engine.queuedPlayers}
                availablePlayers={engine.availablePlayers}
                isUserTurn={phase === 'drafting' && engine.isUserTurn}
                onDraft={(playerId) => {
                  if (phase !== 'drafting') return;
                  handleLiveDraft(playerId);
                }}
                onRemoveFromQueue={(playerId) => {
                  engine.removeFromQueue(playerId);
                  if (isLiveMode && phase === 'drafting') {
                    const newQueue = engine.queuedPlayers.filter(p => p.playerId !== playerId);
                    handleLiveQueueSync(newQueue);
                  }
                }}
                onReorderQueue={(newOrder) => {
                  engine.reorderQueue(newOrder);
                  if (isLiveMode && phase === 'drafting') handleLiveQueueSync(newOrder);
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
                initialPlayer={rosterViewPlayer}
              />
            )}
            {activeTab === 'chat' && (
              <DraftRoomChat
                playerCount={playerCount}
                phase={phase}
                username={user?.username}
              />
            )}
          </>
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
          onClose={() => {
            setShowSlotMachine(false);
            slotActiveRef.current = false;
            cleanupAudio();
            if (draftId) draftStore.updateDraft(draftId, { slotDismissed: true });
          }}
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
        @keyframes fade-in-down {
          0% { transform: translate(-50%, -20px); opacity: 0; }
          100% { transform: translate(-50%, 0); opacity: 1; }
        }
        .animate-fade-in-down { animation: fade-in-down 0.3s ease-out forwards; }
        .banner-no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .banner-no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>

      {/* Leave Draft Confirmation Modal */}
      {showLeaveConfirm && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 cursor-pointer"
          onClick={() => setShowLeaveConfirm(false)}
        >
          <div
            className="bg-[#1a1a1a] rounded-2xl border border-white/10 p-6 max-w-sm w-full cursor-default"
            onClick={e => e.stopPropagation()}
          >
            <h3 className="text-xl font-bold text-white mb-2">Leave Draft?</h3>
            <p className="text-white/60 mb-6">
              Are you sure you want to leave <span className="text-white font-medium">{contestName}</span>? Your draft pass will be returned.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowLeaveConfirm(false)}
                className="flex-1 px-4 py-3 bg-transparent border border-white/50 text-white font-medium rounded-xl hover:bg-white/10 hover:scale-105 transition-all"
              >
                Cancel
              </button>
              <button
                disabled={leaving}
                onClick={async () => {
                  if (!draftId || !walletParam) return;
                  setLeaving(true);
                  try {
                    await leaveDraft(draftId, walletParam);
                    draftStore.removeDraft(draftId);
                    window.location.href = '/drafting';
                  } catch (err) {
                    console.error('Failed to leave draft:', err);
                    setLeaving(false);
                    setShowLeaveConfirm(false);
                  }
                }}
                className="flex-1 px-4 py-3 bg-red-500 text-white font-medium rounded-xl hover:bg-red-400 transition-colors disabled:opacity-50"
              >
                {leaving ? 'Leaving...' : 'Leave Draft'}
              </button>
            </div>
          </div>
        </div>
      )}
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
// force deploy 1772096171
