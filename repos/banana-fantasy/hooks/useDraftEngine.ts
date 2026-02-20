'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import {
  ALL_POSITIONS,
  DRAFT_PLAYERS,
  TOTAL_ROUNDS,
  TOTAL_PICKS,
  positionFromPlayerId,
} from '@/lib/draftRoomConstants';
import type { PlayerData, DraftPick, PositionRoster } from '@/lib/draftRoomConstants';

export type DraftPlayer = typeof DRAFT_PLAYERS[number];
export type DraftMode = 'local' | 'live';

export interface DraftEngineState {
  picks: DraftPick[];
  currentPickNumber: number;
  currentRound: number;
  currentDrafterIndex: number;
  draftOrder: DraftPlayer[];
  userDraftPosition: number;
  availablePlayers: PlayerData[];
  queuedPlayers: PlayerData[];
  rosters: Record<string, PositionRoster>;
  timeRemaining: number;
  isUserTurn: boolean;
  turnsUntilUserPick: number;
  draftStatus: 'waiting' | 'active' | 'completed';
  mostRecentPick: DraftPick | null;
  draftSummary: DraftSummarySlot[];
}

export interface DraftSummarySlot {
  pickNum: number;
  round: number;
  ownerName: string;
  ownerIndex: number;
  playerId: string;
  position: string;
  team: string;
}

// Types for LIVE mode server payloads
export interface ServerPickPayload {
  playerId: string;
  displayName: string;
  team: string;
  position: string;
  ownerAddress: string;
  pickNum: number;
  round: number;
}

export interface ServerTimerPayload {
  endOfTurnTimestamp: number;
  startOfTurnTimestamp: number;
  currentDrafter: string;
  timeRemaining?: number;
}

export interface ServerDraftInfoPayload {
  draftId: string;
  displayName: string;
  draftStartTime: number;
  pickLength: number;
  currentDrafter: string;
  pickNumber: number;
  roundNum: number;
  pickInRound: number;
  draftOrder: { ownerId: string; tokenId: string }[];
  adp: { adp: number; byeWeek: string; playerId: string }[];
}

export interface ServerNewPickPayload {
  newPick: ServerPickPayload;
  nextDrafter: string;
  currentPick: number;
}

export interface ServerFinalCardPayload {
  cardId: string;
  imageUrl: string;
  roster?: Record<string, unknown>;
}

// Server player data format (from REST API)
export interface ServerPlayerData {
  playerId: string;
  playerStateInfo: {
    playerId: string;
    displayName: string;
    team: string;
    position: string;
    ownerAddress: string;
    pickNum: number;
    round: number;
  };
  stats: {
    playerId: string;
    averageScore: number;
    highestScore: number;
    top5Finishes: number;
    adp: number;
    byeWeek: number;
    playersFromTeam: string[] | null;
  };
  ranking: {
    playerId: string;
    rank: number;
    score: number;
  };
}

export interface ServerDraftSummaryItem {
  playerInfo: {
    playerId: string;
    displayName: string;
    team: string;
    position: string;
    ownerAddress: string;
    pickNum: number;
    round: number;
  };
  pfpInfo: {
    imageUrl: string;
    nftContract: string;
    displayName: string;
  };
}

function createEmptyRoster(): PositionRoster {
  return { QB: [], RB: [], WR: [], TE: [], DST: [] };
}

/** Get drafter index for a given pick number in snake draft (10 players) */
function getSnakeDrafterIndex(pickNumber: number): number {
  const round = Math.ceil(pickNumber / 10);
  const posInRound = ((pickNumber - 1) % 10);
  return round % 2 === 1 ? posInRound : 9 - posInRound;
}

/** Count how many turns until a specific player index picks again */
function calculateTurnsUntilPick(currentPick: number, targetIndex: number): number {
  for (let i = 1; i <= TOTAL_PICKS - currentPick + 1; i++) {
    if (getSnakeDrafterIndex(currentPick + i) === targetIndex) {
      return i;
    }
  }
  return 0;
}

/** Generate pre-computed draft summary slots */
function generateDraftSummary(draftOrder: DraftPlayer[]): DraftSummarySlot[] {
  const slots: DraftSummarySlot[] = [];
  for (let pick = 1; pick <= TOTAL_PICKS; pick++) {
    const round = Math.ceil(pick / 10);
    const drafterIdx = getSnakeDrafterIndex(pick);
    const owner = draftOrder[drafterIdx];
    slots.push({
      pickNum: pick,
      round,
      ownerName: owner?.name || '',
      ownerIndex: drafterIdx,
      playerId: '',
      position: '',
      team: '',
    });
  }
  return slots;
}

export function useDraftEngine(mode: DraftMode = 'local') {
  const [draftOrder, setDraftOrder] = useState<DraftPlayer[]>([]);
  const [userDraftPosition, setUserDraftPosition] = useState(0);
  const [picks, setPicks] = useState<DraftPick[]>([]);
  const [currentPickNumber, setCurrentPickNumber] = useState(1);
  const [availablePlayers, setAvailablePlayers] = useState<PlayerData[]>(ALL_POSITIONS);
  const [queuedPlayers, setQueuedPlayers] = useState<PlayerData[]>([]);
  const [rosters, setRosters] = useState<Record<string, PositionRoster>>({});
  const [timeRemaining, setTimeRemaining] = useState(30);
  const [draftStatus, setDraftStatus] = useState<'waiting' | 'active' | 'completed'>('waiting');
  const [mostRecentPick, setMostRecentPick] = useState<DraftPick | null>(null);
  const [draftSummary, setDraftSummary] = useState<DraftSummarySlot[]>([]);

  // LIVE mode additional state
  const [preTimeRemaining, setPreTimeRemaining] = useState(0);
  const [currentDrafterAddress, setCurrentDrafterAddress] = useState('');
  const [walletAddress, setWalletAddress] = useState('');
  const [finalCard, setFinalCard] = useState<{ cardId: string; imageUrl: string } | null>(null);
  const [endOfTurnTimestamp, setEndOfTurnTimestamp] = useState(0);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const botTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isProcessingRef = useRef(false);

  // Computed values
  const currentRound = Math.ceil(currentPickNumber / 10);
  const currentDrafterIndex = getSnakeDrafterIndex(currentPickNumber);
  const currentDrafter = draftOrder[currentDrafterIndex];

  // isUserTurn: different logic for local vs live
  const isUserTurn = mode === 'live'
    ? draftStatus === 'active' && currentDrafterAddress.toLowerCase() === walletAddress.toLowerCase() && walletAddress !== ''
    : draftStatus === 'active' && currentDrafter?.isYou === true;

  const turnsUntilUserPick = draftStatus === 'active' && !isUserTurn
    ? (mode === 'live'
      ? calculateTurnsUntilPick(currentPickNumber, userDraftPosition)
      : calculateTurnsUntilPick(currentPickNumber, draftOrder.findIndex(p => p.isYou)))
    : 0;

  // ==================== LOCAL MODE: INITIALIZE DRAFT ====================
  const initializeDraft = useCallback((shuffledOrder: DraftPlayer[]) => {
    setDraftOrder(shuffledOrder);
    const userPos = shuffledOrder.findIndex(p => p.isYou);
    setUserDraftPosition(userPos);

    const initialRosters: Record<string, PositionRoster> = {};
    shuffledOrder.forEach(p => {
      initialRosters[p.name] = createEmptyRoster();
    });
    setRosters(initialRosters);

    setAvailablePlayers([...ALL_POSITIONS]);
    setPicks([]);
    setCurrentPickNumber(1);
    setTimeRemaining(30);
    setDraftStatus('active');
    setMostRecentPick(null);
    setQueuedPlayers([]);
    setDraftSummary(generateDraftSummary(shuffledOrder));
  }, []);

  // ==================== LOCAL MODE: RESTORE DRAFT FROM SAVED STATE ====================
  const restoreDraft = useCallback((
    shuffledOrder: DraftPlayer[],
    savedPicks: DraftPick[],
    savedPickNumber: number,
    savedQueue?: PlayerData[],
  ) => {
    setDraftOrder(shuffledOrder);
    const userPos = shuffledOrder.findIndex(p => p.isYou);
    setUserDraftPosition(userPos);

    // Rebuild rosters from picks
    const builtRosters: Record<string, PositionRoster> = {};
    shuffledOrder.forEach(p => {
      builtRosters[p.name] = createEmptyRoster();
    });
    for (const pick of savedPicks) {
      const basePos = positionFromPlayerId(pick.playerId) as keyof PositionRoster;
      if (builtRosters[pick.ownerName]?.[basePos]) {
        builtRosters[pick.ownerName][basePos] = [...builtRosters[pick.ownerName][basePos], pick.playerId];
      }
    }
    setRosters(builtRosters);

    // Remove picked players from available
    const pickedIds = new Set(savedPicks.map(p => p.playerId));
    setAvailablePlayers([...ALL_POSITIONS].filter(p => !pickedIds.has(p.playerId)));

    // Restore queue, filtering out any that were picked
    if (savedQueue) {
      setQueuedPlayers(savedQueue.filter(q => !pickedIds.has(q.playerId)));
    } else {
      setQueuedPlayers([]);
    }

    setPicks(savedPicks);
    setCurrentPickNumber(savedPickNumber);
    setTimeRemaining(30);
    setDraftStatus(savedPickNumber > TOTAL_PICKS ? 'completed' : 'active');
    setMostRecentPick(savedPicks[savedPicks.length - 1] || null);

    // Rebuild draft summary
    const summary = generateDraftSummary(shuffledOrder);
    for (const pick of savedPicks) {
      const idx = pick.pickNumber - 1;
      if (summary[idx]) {
        summary[idx] = { ...summary[idx], playerId: pick.playerId, position: pick.position, team: pick.team };
      }
    }
    setDraftSummary(summary);
  }, []);

  // ==================== LIVE MODE: INITIALIZE FROM SERVER ====================
  const initializeFromServer = useCallback((
    draftInfo: ServerDraftInfoPayload,
    playerRankings: ServerPlayerData[],
    summary: ServerDraftSummaryItem[],
    serverRosters: Record<string, { QB: unknown[]; RB: unknown[]; WR: unknown[]; TE: unknown[]; DST: unknown[] }>,
    queue: ServerPickPayload[],
    userWallet: string,
  ) => {
    setWalletAddress(userWallet.toLowerCase());

    // Build draft order from server draftOrder
    const order: DraftPlayer[] = draftInfo.draftOrder.map((u, idx) => ({
      id: String(idx + 1),
      name: u.ownerId, // In live mode, name is the wallet address
      displayName: u.ownerId.slice(0, 6) + '...' + u.ownerId.slice(-4),
      isYou: u.ownerId.toLowerCase() === userWallet.toLowerCase(),
      avatar: '🍌',
    }));
    setDraftOrder(order);

    const userPos = order.findIndex(p => p.isYou);
    setUserDraftPosition(userPos);

    // Build available players from rankings
    const available: PlayerData[] = playerRankings
      .filter(p => p.playerStateInfo.ownerAddress === '')
      .map(p => ({
        playerId: p.playerStateInfo.playerId,
        team: p.playerStateInfo.team,
        position: p.playerStateInfo.position,
        adp: p.stats.adp,
        rank: p.ranking.rank,
        byeWeek: p.stats.byeWeek,
        playersFromTeam: p.stats.playersFromTeam || [],
      }));
    setAvailablePlayers(available);

    // Build picks from summary
    const existingPicks: DraftPick[] = summary
      .filter(s => s.playerInfo.ownerAddress !== '')
      .map(s => ({
        pickNumber: s.playerInfo.pickNum,
        round: s.playerInfo.round || Math.ceil(s.playerInfo.pickNum / 10),
        pickInRound: ((s.playerInfo.pickNum - 1) % 10) + 1,
        ownerName: s.playerInfo.ownerAddress,
        ownerIndex: getSnakeDrafterIndex(s.playerInfo.pickNum),
        playerId: s.playerInfo.playerId,
        position: s.playerInfo.position,
        team: s.playerInfo.team,
      }));
    setPicks(existingPicks);

    // Build rosters
    const builtRosters: Record<string, PositionRoster> = {};
    for (const [addr, roster] of Object.entries(serverRosters)) {
      builtRosters[addr] = {
        QB: (roster.QB || []).map((p: any) => p.playerId || p),
        RB: (roster.RB || []).map((p: any) => p.playerId || p),
        WR: (roster.WR || []).map((p: any) => p.playerId || p),
        TE: (roster.TE || []).map((p: any) => p.playerId || p),
        DST: (roster.DST || []).map((p: any) => p.playerId || p),
      };
    }
    setRosters(builtRosters);

    // Build draft summary
    const draftSummarySlots = generateDraftSummary(order);
    for (const pick of existingPicks) {
      const idx = pick.pickNumber - 1;
      if (draftSummarySlots[idx]) {
        draftSummarySlots[idx] = {
          ...draftSummarySlots[idx],
          playerId: pick.playerId,
          position: pick.position,
          team: pick.team,
        };
      }
    }
    setDraftSummary(draftSummarySlots);

    // Build queue from server
    const queuePlayers: PlayerData[] = queue
      .map(q => available.find(a => a.playerId === q.playerId))
      .filter((p): p is PlayerData => p !== undefined);
    setQueuedPlayers(queuePlayers);

    // Set current state
    setCurrentPickNumber(draftInfo.pickNumber || 1);
    setCurrentDrafterAddress(draftInfo.currentDrafter || '');
    setDraftStatus(draftInfo.pickNumber > TOTAL_PICKS ? 'completed' : 'active');
    setMostRecentPick(existingPicks[existingPicks.length - 1] || null);

    // Calculate initial timer using old system's formula (all times in UNIX seconds)
    const endTime = draftInfo.draftStartTime + (draftInfo.pickLength * (draftInfo.pickNumber + 1));
    const remaining = Math.max(0, Math.ceil((endTime * 1000 - Date.now()) / 1000));
    setTimeRemaining(remaining);
    setEndOfTurnTimestamp(endTime); // Store in seconds (matching WS format)
  }, []);

  // ==================== LIVE MODE HANDLERS ====================

  const handleCountdownUpdate = useCallback((payload: { timeRemaining: number; currentDrafter: string }) => {
    setPreTimeRemaining(payload.timeRemaining);
    setCurrentDrafterAddress(payload.currentDrafter || '');
  }, []);

  const handleTimerUpdate = useCallback((payload: ServerTimerPayload) => {
    setCurrentDrafterAddress(payload.currentDrafter);
    setEndOfTurnTimestamp(payload.endOfTurnTimestamp);
    // Calculate remaining from server timestamps (server sends UNIX seconds, convert to ms)
    const remaining = Math.max(0, Math.ceil((payload.endOfTurnTimestamp * 1000 - Date.now()) / 1000));
    setTimeRemaining(remaining);
  }, []);

  const handleNewPick = useCallback((payload: ServerNewPickPayload) => {
    const { newPick, nextDrafter, currentPick } = payload;
    const basePos = positionFromPlayerId(newPick.playerId);

    const pick: DraftPick = {
      pickNumber: newPick.pickNum,
      round: newPick.round,
      pickInRound: ((newPick.pickNum - 1) % 10) + 1,
      ownerName: newPick.ownerAddress,
      ownerIndex: getSnakeDrafterIndex(newPick.pickNum),
      playerId: newPick.playerId,
      position: newPick.position,
      team: newPick.team,
    };

    setPicks(prev => [...prev, pick]);
    setAvailablePlayers(prev => prev.filter(p => p.playerId !== newPick.playerId));
    setMostRecentPick(pick);

    // Update roster
    setRosters(prev => {
      const updated = { ...prev };
      const ownerAddr = newPick.ownerAddress;
      const roster = { ...(updated[ownerAddr] || createEmptyRoster()) };
      const rosterKey = basePos as keyof PositionRoster;
      if (roster[rosterKey]) {
        roster[rosterKey] = [...roster[rosterKey], newPick.playerId];
      }
      updated[ownerAddr] = roster;
      return updated;
    });

    // Update draft summary
    setDraftSummary(prev => {
      const updated = [...prev];
      const idx = newPick.pickNum - 1;
      if (updated[idx]) {
        updated[idx] = { ...updated[idx], playerId: newPick.playerId, position: newPick.position, team: newPick.team };
      }
      return updated;
    });

    // Remove from queue if queued
    setQueuedPlayers(prev => prev.filter(p => p.playerId !== newPick.playerId));

    // Advance state
    if (currentPick) {
      setCurrentPickNumber(currentPick);
    } else {
      setCurrentPickNumber(prev => prev + 1);
    }

    if (nextDrafter) {
      setCurrentDrafterAddress(nextDrafter);
    }

    // Check completion
    if (newPick.pickNum >= TOTAL_PICKS) {
      setDraftStatus('completed');
    }
  }, []);

  const handleDraftInfoUpdate = useCallback((payload: ServerDraftInfoPayload) => {
    setCurrentPickNumber(payload.pickNumber);
    setCurrentDrafterAddress(payload.currentDrafter);
    // Round is derived from pickNumber, no need to set separately
  }, []);

  const handleDraftComplete = useCallback(() => {
    setDraftStatus('completed');
  }, []);

  const handleFinalCard = useCallback((payload: ServerFinalCardPayload) => {
    setFinalCard({ cardId: payload.cardId, imageUrl: payload.imageUrl });
    setDraftStatus('completed');
  }, []);

  // ==================== LOCAL MODE: DRAFT A PLAYER ====================
  const draftPlayer = useCallback((playerId: string): ServerPickPayload | null => {
    if (draftStatus !== 'active' || currentPickNumber > TOTAL_PICKS) return null;

    // In LIVE mode, just build the payload — don't update local state
    // (server will send new_pick back which triggers handleNewPick)
    if (mode === 'live') {
      // 500ms pick buffer — reject picks too close to deadline (matches old system)
      if (endOfTurnTimestamp > 0 && (endOfTurnTimestamp * 1000 - Date.now()) <= 500) {
        console.log('[Draft] Pick rejected — less than 500ms remaining');
        return null;
      }
      const player = availablePlayers.find(p => p.playerId === playerId);
      if (!player) return null;

      return {
        playerId: player.playerId,
        displayName: player.playerId, // Server uses playerId as displayName for team positions
        team: player.team,
        position: positionFromPlayerId(player.playerId),
        ownerAddress: walletAddress,
        pickNum: currentPickNumber,
        round: currentRound,
      };
    }

    // LOCAL mode: full local state update
    if (isProcessingRef.current) return null;
    isProcessingRef.current = true;

    const player = availablePlayers.find(p => p.playerId === playerId);
    if (!player) { isProcessingRef.current = false; return null; }

    const drafter = draftOrder[currentDrafterIndex];
    const basePos = positionFromPlayerId(playerId);

    const newPick: DraftPick = {
      pickNumber: currentPickNumber,
      round: currentRound,
      pickInRound: ((currentPickNumber - 1) % 10) + 1,
      ownerName: drafter.name,
      ownerIndex: currentDrafterIndex,
      playerId,
      position: player.position,
      team: player.team,
    };

    setPicks(prev => [...prev, newPick]);
    setAvailablePlayers(prev => prev.filter(p => p.playerId !== playerId));
    setMostRecentPick(newPick);

    setRosters(prev => {
      const updated = { ...prev };
      const roster = { ...updated[drafter.name] };
      const rosterKey = basePos as keyof PositionRoster;
      if (roster[rosterKey]) {
        roster[rosterKey] = [...roster[rosterKey], playerId];
      }
      updated[drafter.name] = roster;
      return updated;
    });

    setDraftSummary(prev => {
      const updated = [...prev];
      const idx = currentPickNumber - 1;
      if (updated[idx]) {
        updated[idx] = { ...updated[idx], playerId, position: player.position, team: player.team };
      }
      return updated;
    });

    setQueuedPlayers(prev => prev.filter(p => p.playerId !== playerId));

    const nextPick = currentPickNumber + 1;
    if (nextPick > TOTAL_PICKS) {
      setDraftStatus('completed');
      setCurrentPickNumber(nextPick);
    } else {
      setCurrentPickNumber(nextPick);
      setTimeRemaining(30);
    }

    isProcessingRef.current = false;
    return null;
  }, [mode, draftStatus, currentPickNumber, availablePlayers, draftOrder, currentDrafterIndex, currentRound, walletAddress, endOfTurnTimestamp]);

  // ==================== AUTO-PICK AI (LOCAL MODE ONLY) ====================
  const autoPickForPlayer = useCallback((playerRoster: PositionRoster, queue: PlayerData[], available: PlayerData[], round: number): string => {
    if (queue.length > 0) {
      const queuePick = queue.find(q => available.some(a => a.playerId === q.playerId));
      if (queuePick) return queuePick.playerId;
    }
    if (round < 12) {
      const sorted = [...available].sort((a, b) => a.adp - b.adp);
      if (sorted.length > 0) return sorted[0].playerId;
    }
    const needOrder: (keyof PositionRoster)[] = ['RB', 'WR', 'QB', 'TE', 'DST'];
    for (const pos of needOrder) {
      if (playerRoster[pos].length === 0) {
        const match = available.find(p => positionFromPlayerId(p.playerId) === pos);
        if (match) return match.playerId;
      }
    }
    const sorted = [...available].sort((a, b) => a.adp - b.adp);
    return sorted[0]?.playerId || '';
  }, []);

  // ==================== QUEUE MANAGEMENT ====================
  const addToQueue = useCallback((player: PlayerData) => {
    setQueuedPlayers(prev => {
      if (prev.some(p => p.playerId === player.playerId)) return prev;
      return [...prev, player];
    });
  }, []);

  const removeFromQueue = useCallback((playerId: string) => {
    setQueuedPlayers(prev => prev.filter(p => p.playerId !== playerId));
  }, []);

  const reorderQueue = useCallback((newOrder: PlayerData[]) => {
    setQueuedPlayers(newOrder);
  }, []);

  const refreshAvailablePlayers = useCallback((players: PlayerData[]) => {
    setAvailablePlayers(players);
  }, []);

  const isInQueue = useCallback((playerId: string) => {
    return queuedPlayers.some(p => p.playerId === playerId);
  }, [queuedPlayers]);

  // ==================== LOCAL MODE TIMER ====================
  useEffect(() => {
    if (mode === 'live') return; // Live mode timer handled below
    if (draftStatus !== 'active' || currentPickNumber > TOTAL_PICKS) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) return 0;
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [mode, draftStatus, currentPickNumber]);

  // ==================== LIVE MODE TIMER (display countdown from server timestamp) ====================
  useEffect(() => {
    if (mode !== 'live') return;
    if (draftStatus !== 'active' || endOfTurnTimestamp === 0) return;

    timerRef.current = setInterval(() => {
      const remaining = Math.max(0, Math.ceil((endOfTurnTimestamp * 1000 - Date.now()) / 1000));
      setTimeRemaining(remaining);
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [mode, draftStatus, endOfTurnTimestamp]);

  // ==================== LOCAL MODE AUTO-PICK ON TIMEOUT ====================
  useEffect(() => {
    if (mode === 'live') return; // Server handles auto-pick in live mode
    if (!isUserTurn || timeRemaining > 0 || draftStatus !== 'active') return;

    const roster = rosters[currentDrafter?.name || ''] || createEmptyRoster();
    const pickId = autoPickForPlayer(roster, queuedPlayers, availablePlayers, currentRound);
    if (pickId) {
      draftPlayer(pickId);
    }
  }, [mode, isUserTurn, timeRemaining, draftStatus, rosters, currentDrafter, queuedPlayers, availablePlayers, currentRound, autoPickForPlayer, draftPlayer]);

  // ==================== LOCAL MODE BOT AUTO-PICK ====================
  useEffect(() => {
    if (mode === 'live') return; // No bots in live mode
    if (draftStatus !== 'active' || currentPickNumber > TOTAL_PICKS) return;

    const drafter = draftOrder[getSnakeDrafterIndex(currentPickNumber)];
    if (!drafter || drafter.isYou) return;

    const delay = 1000 + Math.random() * 2000;
    botTimeoutRef.current = setTimeout(() => {
      const roster = rosters[drafter.name] || createEmptyRoster();
      const pickId = autoPickForPlayer(roster, [], availablePlayers, currentRound);
      if (pickId) {
        draftPlayer(pickId);
      }
    }, delay);

    return () => {
      if (botTimeoutRef.current) clearTimeout(botTimeoutRef.current);
    };
  }, [mode, draftStatus, currentPickNumber, draftOrder, rosters, availablePlayers, currentRound, autoPickForPlayer, draftPlayer]);

  return {
    // State
    picks,
    currentPickNumber,
    currentRound,
    currentDrafterIndex,
    draftOrder,
    userDraftPosition,
    availablePlayers,
    queuedPlayers,
    rosters,
    timeRemaining,
    isUserTurn,
    turnsUntilUserPick,
    draftStatus,
    mostRecentPick,
    draftSummary,
    mode,

    // LIVE mode state
    preTimeRemaining,
    currentDrafterAddress,
    walletAddress,
    finalCard,

    // LOCAL mode actions
    initializeDraft,
    restoreDraft,
    draftPlayer,

    // LIVE mode actions
    initializeFromServer,
    handleCountdownUpdate,
    handleTimerUpdate,
    handleNewPick,
    handleDraftInfoUpdate,
    handleDraftComplete,
    handleFinalCard,

    // Shared actions
    addToQueue,
    removeFromQueue,
    reorderQueue,
    refreshAvailablePlayers,
    isInQueue,
  };
}
