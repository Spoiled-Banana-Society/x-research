'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLobbyStatus } from '@/hooks/useLobbyStatus';

type DraftType = 'jackpot' | 'hof' | 'pro';

interface LobbyPlayer {
  id: string;
  username: string;
  joinedAt: number;
}

interface DraftLobbyProps {
  draftId: string;
  contestName: string;
  draftSpeed: 'fast' | 'slow';
  onDraftStart: (type: DraftType) => void;
}

const MOCK_USERNAMES = [
  'BananaKing99', 'TouchdownTitan', 'DiamondHands', 'MoonBoi', 'BlitzMaster',
  'EndZoneKing', 'BananaHolder', 'GridironGuru', 'FantasyBeast', 'DraftKing420'
];

const DRAFT_TYPES = {
  jackpot: {
    id: 'jackpot' as DraftType,
    label: 'JACKPOT',
    shortLabel: '🔥 JACKPOT',
    logo: '/jackpot-logo.png',
    color: '#ef4444',
    bgColor: 'linear-gradient(135deg, #7f1d1d 0%, #dc2626 50%, #7f1d1d 100%)',
    odds: '1%',
  },
  hof: {
    id: 'hof' as DraftType,
    label: 'HALL OF FAME',
    shortLabel: '⭐ HOF',
    logo: '/hof-logo.jpg',
    color: '#D4AF37',
    bgColor: 'linear-gradient(135deg, #422006 0%, #854d0e 100%)',
    odds: '5%',
  },
  pro: {
    id: 'pro' as DraftType,
    label: 'PRO',
    shortLabel: '🍌 PRO',
    logo: null,
    color: '#a855f7',
    bgColor: 'linear-gradient(135deg, #1e1b4b 0%, #4c1d95 100%)',
    odds: '94%',
  },
};

// Generate reel items - weighted so rare items appear less but still visible
function generateReelItems(resultType: DraftType, totalItems: number = 50): DraftType[] {
  const items: DraftType[] = [];

  // Fill with mostly pro, some hof, few jackpot
  for (let i = 0; i < totalItems; i++) {
    const rand = Math.random();
    if (rand < 0.05) items.push('jackpot');      // 5% jackpot visible
    else if (rand < 0.15) items.push('hof');     // 10% hof visible
    else items.push('pro');                       // 85% pro
  }

  // Place the actual result near the end (where it will land)
  // We want some items after it for the "near miss" effect
  const landingIndex = totalItems - 8; // Result lands here
  items[landingIndex] = resultType;

  // For dramatic effect, put a jackpot right before the landing spot if result is pro
  if (resultType === 'pro') {
    items[landingIndex - 1] = 'jackpot'; // Near miss!
  } else if (resultType === 'hof') {
    items[landingIndex - 1] = 'jackpot'; // Almost got jackpot
  }

  return items;
}

// Generate reel items for a specific reel with its own result
function generateReelItemsForReel(resultType: DraftType, reelIndex: number, totalItems: number = 50): DraftType[] {
  const items: DraftType[] = [];

  for (let i = 0; i < totalItems; i++) {
    const rand = Math.random();
    if (rand < 0.15) items.push('jackpot');
    else if (rand < 0.35) items.push('hof');
    else items.push('pro');
  }

  const landingIndex = totalItems - 8;
  items[landingIndex] = resultType;

  // For reel 3 (index 2): put jackpot right above the landing spot for near-miss effect
  if (reelIndex === 2 && resultType === 'pro') {
    items[landingIndex - 1] = 'jackpot'; // Jackpot right above banana
  }

  return items;
}

type Phase = 'waiting' | 'full' | 'spinning' | 'result';

export function DraftLobby({ draftId, contestName, draftSpeed, onDraftStart }: DraftLobbyProps) {
  // Real-time lobby polling (5s interval, stops when draft starts)
  const { status: lobbyStatus } = useLobbyStatus(draftId || null, { pollInterval: 5000 });
  const [players, setPlayers] = useState<LobbyPlayer[]>([]);
  const [phase, setPhase] = useState<Phase>('waiting');
  const [result, setResult] = useState<DraftType>('pro');
  const [_reelItems, setReelItems] = useState<DraftType[]>([]);
  const [allReelItems, setAllReelItems] = useState<DraftType[][]>([[], [], []]);
  const [reelOffsets, setReelOffsets] = useState([0, 0, 0]);
  const [_reelsStopped, setReelsStopped] = useState([false, false, false]);
  const [showFlash, setShowFlash] = useState(false);
  const [confetti, setConfetti] = useState<Array<{ id: number; x: number; color: string; delay: number }>>([]);
  const [jackpotRain, setJackpotRain] = useState<Array<{ id: number; x: number; delay: number; size: number }>>([]);
  const [hofRain, setHofRain] = useState<Array<{ id: number; x: number; delay: number; size: number }>>([]);
  const [screenShake, setScreenShake] = useState(false);
  const [redFlash, setRedFlash] = useState(false);
  const [goldFlash, setGoldFlash] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const _tickIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Determine result on mount - generate random valid combination (never 3 bananas)
  useEffect(() => {
    // Generate reel results - never allow all 3 to be 'pro' (banana)
    const generateReelResults = (): DraftType[] => {
      const _types: DraftType[] = ['jackpot', 'hof', 'pro'];
      const results: DraftType[] = [];

      // Generate 3 random results
      for (let i = 0; i < 3; i++) {
        const rand = Math.random();
        if (rand < 0.01) results.push('jackpot');      // 1% jackpot
        else if (rand < 0.06) results.push('hof');     // 5% hof
        else results.push('pro');                       // 94% pro/banana
      }

      // If all 3 are 'pro', force at least one to be jackpot or hof
      if (results.every(r => r === 'pro')) {
        const randomIndex = Math.floor(Math.random() * 3);
        (results as DraftType[])[randomIndex] = Math.random() < 0.33 ? 'jackpot' : 'hof';
      }

      return results;
    };

    const reelResults = generateReelResults();

    // Only count as jackpot/hof win if ALL 3 reels match
    let selectedResult: DraftType = 'pro';
    if (reelResults.every(r => r === 'jackpot')) {
      selectedResult = 'jackpot'; // 3 jackpots = JACKPOT win
    } else if (reelResults.every(r => r === 'hof')) {
      selectedResult = 'hof'; // 3 HOFs = HOF win
    }

    setResult(selectedResult);
    setReelItems(generateReelItems(selectedResult));
    setAllReelItems([
      generateReelItemsForReel(reelResults[0], 0),
      generateReelItemsForReel(reelResults[1], 1),
      generateReelItemsForReel(reelResults[2], 2),
    ]);
  }, []);

  // Audio functions
  const initAudio = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    }
    return audioContextRef.current;
  }, []);

  const playTick = useCallback((progress: number = 0) => {
    try {
      const ctx = initAudio();
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      // Rising pitch as we get closer to the end - creates tension
      const basePitch = 600 + progress * 600; // 600Hz -> 1200Hz
      oscillator.frequency.value = basePitch + Math.random() * 200;
      oscillator.type = 'sine';

      // Louder ticks near the end
      const volume = 0.08 + progress * 0.12;
      gainNode.gain.setValueAtTime(volume, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.06);

      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.06);
    } catch {
      // Audio not supported
    }
  }, [initAudio]);

  const playReelStop = useCallback(() => {
    try {
      const ctx = initAudio();
      // Chunky stop sound
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      oscillator.frequency.value = 150;
      oscillator.type = 'square';
      gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.15);
    } catch {
      // Audio not supported
    }
  }, [initAudio]);

  const playSpinMusic = useCallback(() => {
    try {
      const ctx = initAudio();
      // Casino-style ascending arpeggio
      const notes = [262, 330, 392, 523, 392, 330, 262, 330, 392, 523, 659, 784];
      notes.forEach((freq, i) => {
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);
        oscillator.frequency.value = freq;
        oscillator.type = 'sine';
        const startTime = ctx.currentTime + i * 0.15;
        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(0.15, startTime + 0.02);
        gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.14);
        oscillator.start(startTime);
        oscillator.stop(startTime + 0.15);
      });
    } catch {
      // Audio not supported
    }
  }, [initAudio]);

  const playWinSound = useCallback((isRare: boolean) => {
    try {
      const ctx = initAudio();
      const frequencies = isRare
        ? [523, 659, 784, 880, 1047, 1175, 1319, 1568] // Big win fanfare
        : [440, 554, 659, 880]; // Normal win

      frequencies.forEach((freq, i) => {
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);

        oscillator.frequency.value = freq;
        oscillator.type = isRare ? 'sine' : 'triangle';

        const startTime = ctx.currentTime + i * (isRare ? 0.08 : 0.1);
        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(isRare ? 0.25 : 0.2, startTime + 0.03);
        gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + (isRare ? 0.5 : 0.4));

        oscillator.start(startTime);
        oscillator.stop(startTime + (isRare ? 0.5 : 0.4));
      });

      // Add a bass drum hit for wins
      if (isRare) {
        const kick = ctx.createOscillator();
        const kickGain = ctx.createGain();
        kick.connect(kickGain);
        kickGain.connect(ctx.destination);
        kick.frequency.setValueAtTime(150, ctx.currentTime);
        kick.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 0.1);
        kick.type = 'sine';
        kickGain.gain.setValueAtTime(0.4, ctx.currentTime);
        kickGain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
        kick.start(ctx.currentTime);
        kick.stop(ctx.currentTime + 0.2);
      }
    } catch {
      // Audio not supported
    }
  }, [initAudio]);

  // Simulate players joining - You join as the 6th player
  useEffect(() => {
    // 5 players already in lobby when you arrive
    const shuffledNames = [...MOCK_USERNAMES].sort(() => Math.random() - 0.5);
    const initialPlayers: LobbyPlayer[] = shuffledNames.slice(0, 5).map((name, i) => ({
      id: `player-${i}`,
      username: name,
      joinedAt: Date.now() - (5 - i) * 1000,
    }));
    setPlayers(initialPlayers);

    // You join after a moment as the 6th player
    const youJoinTimeout = setTimeout(() => {
      setPlayers(prev => [...prev, { id: 'current-user', username: 'You', joinedAt: Date.now() }]);
    }, 500);

    return () => clearTimeout(youJoinTimeout);
  }, []);

  useEffect(() => {
    if (phase !== 'waiting') return;
    // Only start adding more players after You have joined (6 players)
    if (players.length < 6) return;

    const interval = setInterval(() => {
      setPlayers(prev => {
        if (prev.length >= 10) return prev;
        const availableNames = MOCK_USERNAMES.filter(
          name => !prev.some(p => p.username === name) && name !== 'You'
        );
        if (availableNames.length === 0) return prev;
        return [...prev, {
          id: `player-${prev.length}`,
          username: availableNames[Math.floor(Math.random() * availableNames.length)],
          joinedAt: Date.now(),
        }];
      });
    }, 900);
    return () => clearInterval(interval);
  }, [phase, players.length]);

  // Sync real lobby data when available — override mock player count
  useEffect(() => {
    if (!lobbyStatus || phase !== 'waiting') return;

    // If backend says draft is already filling/starting, fast-forward
    if (lobbyStatus.phase === 'drafting' || lobbyStatus.phase === 'countdown') {
      // Draft already started — skip slot machine, go directly
      const level = String(lobbyStatus.level).toLowerCase();
      const draftType: DraftType = level.includes('jackpot') ? 'jackpot' : level.includes('hof') || level.includes('hall') ? 'hof' : 'pro';
      onDraftStart(draftType);
      return;
    }

    // Sync player count from real data if we have it
    if (lobbyStatus.currentUsers > 0 && lobbyStatus.currentUsers >= lobbyStatus.maxUsers && phase === 'waiting') {
      // Fill up mock players to match real count
      const needed = lobbyStatus.maxUsers - players.length;
      if (needed > 0) {
        const shuffledNames = [...MOCK_USERNAMES].sort(() => Math.random() - 0.5);
        const newPlayers: LobbyPlayer[] = [];
        for (let i = 0; i < needed; i++) {
          newPlayers.push({
            id: `real-${i}`,
            username: shuffledNames[i % shuffledNames.length],
            joinedAt: Date.now(),
          });
        }
        setPlayers(prev => [...prev, ...newPlayers].slice(0, lobbyStatus.maxUsers));
      }
    }
  }, [lobbyStatus, phase, players.length, onDraftStart]);

  // Check if full
  useEffect(() => {
    if (players.length === 10 && phase === 'waiting') {
      setPhase('full');
      // Smooth transition to spinning after brief pause
      setTimeout(() => setPhase('spinning'), 800);
    }
  }, [players.length, phase]);

  // Spinning animation - 3 reels with staggered stops
  useEffect(() => {
    if (phase !== 'spinning') return;
    if (allReelItems[0]?.length === 0) return;

    // Play casino music when spinning starts
    playSpinMusic();

    const itemHeight = 140; // Height of each item
    const landingIndex = (allReelItems[0]?.length || 50) - 8;
    const targetOffset = landingIndex * itemHeight;

    // Equal time between each reel stop (2 seconds apart for more anticipation)
    const reelDurations = [2000, 4000, 6000]; // Reel 1, 2, 3 stop times
    const startTime = performance.now();
    let animationId: number;
    const lastTickIndex = [-1, -1, -1];
    const stoppedReels = [false, false, false];

    // Smooth easing - same for all reels
    const easeOutQuint = (t: number): number => 1 - Math.pow(1 - t, 5);

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const newOffsets = [0, 0, 0];
      let allStopped = true;

      for (let i = 0; i < 3; i++) {
        const progress = Math.min(elapsed / reelDurations[i], 1);

        // Same easing for all reels
        const easedProgress = easeOutQuint(progress);
        const offset = easedProgress * targetOffset;
        newOffsets[i] = offset;

        // Check if reel just stopped
        if (progress >= 1 && !stoppedReels[i]) {
          stoppedReels[i] = true;
          setReelsStopped([...stoppedReels]);
          playReelStop(); // Play chunky stop sound
        }

        if (progress < 1) allStopped = false;

        // Play tick sounds
        const currentTickIndex = Math.floor(offset / itemHeight);
        if (currentTickIndex !== lastTickIndex[i] && progress < 1) {
          playTick(progress * 0.7 + (i * 0.1)); // Slightly different pitch per reel
          lastTickIndex[i] = currentTickIndex;
        }
      }

      setReelOffsets(newOffsets);

      if (!allStopped) {
        animationId = requestAnimationFrame(animate);
      } else {
        // All reels stopped - snap to final
        setReelOffsets([targetOffset, targetOffset, targetOffset]);

        // Flash effect
        setShowFlash(true);
        setTimeout(() => setShowFlash(false), 150);

        // Confetti for rare wins
        if (result === 'jackpot' || result === 'hof') {
          const colors = result === 'jackpot'
            ? ['#ef4444', '#f97316', '#fbbf24', '#ffffff']
            : ['#FFD700', '#FFA500', '#ffffff', '#fbbf24'];
          const newConfetti = Array.from({ length: 50 }, (_, i) => ({
            id: i,
            x: Math.random() * 100,
            color: colors[Math.floor(Math.random() * colors.length)],
            delay: Math.random() * 0.5,
          }));
          setConfetti(newConfetti);
          setTimeout(() => setConfetti([]), 3000);
        }

        // JACKPOT special effects - rain, shake, red flash
        if (result === 'jackpot') {
          // Screen shake - lasts until entering draft (3.5s)
          setScreenShake(true);
          setTimeout(() => setScreenShake(false), 3500);

          // Red flash - lasts until entering draft (3.5s)
          setRedFlash(true);
          setTimeout(() => setRedFlash(false), 3500);

          // Raining jackpots
          const rainDrops = Array.from({ length: 30 }, (_, i) => ({
            id: i,
            x: Math.random() * 100,
            delay: Math.random() * 2,
            size: 20 + Math.random() * 20,
          }));
          setJackpotRain(rainDrops);
          setTimeout(() => setJackpotRain([]), 4000);
        }

        // HOF special effects - rain, shake, gold flash
        if (result === 'hof') {
          // Screen shake - lasts until entering draft (3.5s)
          setScreenShake(true);
          setTimeout(() => setScreenShake(false), 3500);

          // Gold flash - lasts until entering draft (3.5s)
          setGoldFlash(true);
          setTimeout(() => setGoldFlash(false), 3500);

          // Raining HOFs
          const rainDrops = Array.from({ length: 30 }, (_, i) => ({
            id: i,
            x: Math.random() * 100,
            delay: Math.random() * 2,
            size: 24 + Math.random() * 24,
          }));
          setHofRain(rainDrops);
          setTimeout(() => setHofRain([]), 4000);
        }

        // Show result
        setTimeout(() => {
          playWinSound(result === 'jackpot' || result === 'hof');
          setPhase('result');
        }, 400);
      }
    };

    // Reset stopped state
    setReelsStopped([false, false, false]);

    const startTimeout = setTimeout(() => {
      animationId = requestAnimationFrame(animate);
    }, 200);

    return () => {
      clearTimeout(startTimeout);
      if (animationId) cancelAnimationFrame(animationId);
    };
  }, [phase, allReelItems, result, playTick, playWinSound, playReelStop, playSpinMusic]);

  // Auto-start draft after result
  useEffect(() => {
    if (phase !== 'result') return;
    const timer = setTimeout(() => {
      onDraftStart(result);
    }, 3000);
    return () => clearTimeout(timer);
  }, [phase, result, onDraftStart]);

  const resultData = DRAFT_TYPES[result];
  const isSpinning = phase === 'spinning' || phase === 'result';

  // Calculate target offset for determining if reel is stopped
  const itemHeight = 140;
  const landingIndex = (allReelItems[0]?.length || 50) - 8;
  const targetOffset = landingIndex * itemHeight;

  // Reel is considered stopped if it's within 1px of target
  const isReelStopped = (reelIndex: number) => {
    return reelOffsets[reelIndex] >= targetOffset - 1;
  };

  return (
    <div className={`fixed inset-0 z-50 bg-[#0a0a0c] flex flex-col overflow-hidden ${screenShake ? 'animate-shake' : ''}`}>

      {/* Flash overlay on landing */}
      {showFlash && (
        <div className="absolute inset-0 z-50 bg-white/30 pointer-events-none animate-flash" />
      )}

      {/* Red flash overlay for jackpot */}
      {redFlash && (
        <div className="absolute inset-0 z-60 pointer-events-none animate-red-flash"
          style={{
            background: 'radial-gradient(circle at center, rgba(239,68,68,0.6) 0%, rgba(185,28,28,0.8) 50%, rgba(127,29,29,0.9) 100%)',
          }}
        />
      )}

      {/* Gold flash overlay for HOF */}
      {goldFlash && (
        <div className="absolute inset-0 z-60 pointer-events-none animate-gold-flash"
          style={{
            background: 'radial-gradient(circle at center, rgba(255,215,0,0.5) 0%, rgba(218,165,32,0.7) 50%, rgba(184,134,11,0.8) 100%)',
          }}
        />
      )}

      {/* Raining Jackpots */}
      {jackpotRain.length > 0 && (
        <div className="absolute inset-0 z-50 pointer-events-none overflow-hidden">
          {jackpotRain.map((drop) => (
            <div
              key={drop.id}
              className="absolute animate-jackpot-rain font-black italic"
              style={{
                left: `${drop.x}%`,
                fontSize: `${drop.size}px`,
                color: '#e62222',
                textShadow: '2px 2px 0 #1a1a1a, 0 0 20px rgba(239,68,68,0.8)',
                animationDelay: `${drop.delay}s`,
              }}
            >
              JACKPOT
            </div>
          ))}
        </div>
      )}

      {/* Raining HOFs */}
      {hofRain.length > 0 && (
        <div className="absolute inset-0 z-50 pointer-events-none overflow-hidden">
          {hofRain.map((drop) => (
            <div
              key={drop.id}
              className="absolute animate-hof-rain font-black"
              style={{
                left: `${drop.x}%`,
                fontSize: `${drop.size}px`,
                color: '#f5c400',
                textShadow: '2px 2px 0 #705a00, 0 0 20px rgba(255,215,0,0.8)',
                animationDelay: `${drop.delay}s`,
              }}
            >
              HOF
            </div>
          ))}
        </div>
      )}

      {/* Confetti */}
      {confetti.length > 0 && (
        <div className="absolute inset-0 z-40 pointer-events-none overflow-hidden">
          {confetti.map((particle) => (
            <div
              key={particle.id}
              className="absolute w-3 h-3 animate-confetti"
              style={{
                left: `${particle.x}%`,
                backgroundColor: particle.color,
                animationDelay: `${particle.delay}s`,
                borderRadius: Math.random() > 0.5 ? '50%' : '0',
              }}
            />
          ))}
        </div>
      )}

      {/* Header */}
      <div className="flex-shrink-0 px-8 py-6 border-b border-white/10">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-white text-3xl font-bold tracking-tight">{contestName}</h1>
            <p className="text-white/70 text-base mt-1">
              {draftSpeed === 'fast' ? '30s picks' : '8hr picks'}
            </p>
          </div>
          {phase === 'waiting' && (
            <button
              onClick={() => window.location.href = '/drafting'}
              className="px-5 py-2.5 text-white/70 hover:text-white text-base font-medium transition-colors"
            >
              Leave
            </button>
          )}
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 py-12">

        {/* Waiting / Countdown state */}
        {!isSpinning && (
          <div className="w-full max-w-5xl flex flex-col items-center">
            {/* Steps indicator */}
            <div className="flex items-center justify-center gap-4 mb-16">
              <div className={`flex items-center gap-3 px-5 py-3 rounded-full text-base transition-all ${
                phase === 'waiting' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-white/5 text-white/40'
              }`}>
                <span className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold ${
                  phase === 'waiting' ? 'bg-yellow-500 text-black' : 'bg-white/20'
                }`}>1</span>
                <span className="font-medium">Wait for players</span>
              </div>
              <div className="text-white/30 text-xl">→</div>
              <div className={`flex items-center gap-3 px-5 py-3 rounded-full text-base transition-all ${
                phase === 'full' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-white/5 text-white/40'
              }`}>
                <span className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold ${
                  phase === 'full' ? 'bg-yellow-500 text-black' : 'bg-white/20'
                }`}>2</span>
                <span className="font-medium">Reveal draft type</span>
              </div>
              <div className="text-white/30 text-xl">→</div>
              <div className="flex items-center gap-3 px-5 py-3 rounded-full text-base bg-white/5 text-white/40">
                <span className="w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold bg-white/20">3</span>
                <span className="font-medium">Draft</span>
              </div>
            </div>

            {/* Player count */}
            <div className="text-center mb-14">
              <div className="text-[120px] leading-none font-bold text-white mb-4">
                <span>
                  <span className={players.length === 10 ? 'text-green-400' : 'text-white'}>{players.length}</span>
                  <span className="text-white/30">/10</span>
                </span>
              </div>
              <p className="text-white/60 text-xl font-medium">
                Players in lobby
              </p>
            </div>

            {/* Player grid - larger avatars */}
            <div className="flex justify-center gap-5 mb-16">
              {Array.from({ length: 10 }).map((_, i) => {
                const player = players[i];
                const isYou = player?.username === 'You';
                return (
                  <div
                    key={i}
                    className={`w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 ${
                      player
                        ? isYou
                          ? 'bg-[#1a1a2e] shadow-xl shadow-black/50 border-2 border-yellow-500/50'
                          : 'bg-[#1a1a2e] shadow-lg shadow-black/50 border border-white/10'
                        : 'bg-white/5 border-2 border-dashed border-white/20'
                    }`}
                    style={player ? {
                      boxShadow: 'inset 0 -20px 30px rgba(0,0,0,0.4), 0 4px 15px rgba(0,0,0,0.5)'
                    } : undefined}
                  >
                    {player && (
                      <span className="text-4xl" style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))' }}>🍌</span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Bottom text */}
            <p className={`text-white/50 text-center text-lg transition-opacity duration-300 ${phase === 'waiting' ? 'opacity-100' : 'opacity-0'}`}>
              Once filled, the draft will start.
            </p>
          </div>
        )}

        {/* SBS Slot Machine - Apple Style */}
        {isSpinning && (
          <div className="w-full flex flex-col items-center">

            {/* === SLOT MACHINE === */}
            <div
              className="relative rounded-[32px] overflow-hidden"
              style={{
                background: '#000',
                padding: '2px',
                boxShadow: '0 50px 100px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.1)',
              }}
            >
              {/* Inner container */}
              <div
                className="relative rounded-[30px] overflow-hidden"
                style={{
                  background: 'linear-gradient(180deg, #1c1c1e 0%, #0a0a0a 100%)',
                  padding: '24px',
                }}
              >
                {/* Subtle top highlight */}
                <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent" />

                {/* Reel container */}
                <div
                  className="relative rounded-2xl overflow-hidden"
                  style={{
                    background: '#000',
                    padding: '16px',
                    boxShadow: 'inset 0 2px 20px rgba(0,0,0,0.8)',
                  }}
                >
                  {/* Three Reels */}
                  <div className="flex gap-3">
                    {[0, 1, 2].map((reelIndex) => (
                      <div
                        key={reelIndex}
                        className="relative rounded-2xl overflow-hidden"
                        style={{
                          width: '170px',
                          height: '420px',
                          background: 'linear-gradient(180deg, #a78bfa 0%, #8b5cf6 50%, #7c3aed 100%)',
                          boxShadow: 'inset 0 0 30px rgba(255,255,255,0.2), 0 0 15px rgba(139,92,246,0.3)',
                        }}
                      >
                        {/* Reel strip */}
                        <div
                          className="absolute inset-0 flex flex-col"
                          style={{
                            transform: `translateY(${210 - 70 - reelOffsets[reelIndex]}px)`,
                          }}
                        >
                          {(allReelItems[reelIndex] || []).map((type, i) => (
                            <div
                              key={i}
                              className="w-full h-[140px] flex flex-col items-center justify-center flex-shrink-0 relative px-2"
                            >
                              {/* Top line */}
                              <div className="absolute top-0 inset-x-2 h-[2px] bg-white/50 rounded-full" />

                              {/* Content */}
                              {type === 'jackpot' ? (
                                <span
                                  className="text-[26px] font-black italic uppercase"
                                  style={{
                                    color: '#e62222',
                                    textShadow: '2px 2px 0 #1a1a1a, -1px -1px 0 #1a1a1a, 1px -1px 0 #1a1a1a, -1px 1px 0 #1a1a1a, 0 2px 0 #1a1a1a',
                                    fontFamily: 'system-ui, sans-serif',
                                  }}
                                >
                                  JACKPOT
                                </span>
                              ) : type === 'hof' ? (
                                <span
                                  className="text-[38px] font-black"
                                  style={{
                                    color: '#f5c400',
                                    textShadow: '2px 2px 0 #705a00, -1px -1px 0 #705a00, 1px -1px 0 #705a00, -1px 1px 0 #705a00, 0 2px 0 #705a00',
                                    fontFamily: 'system-ui, sans-serif',
                                  }}
                                >
                                  HOF
                                </span>
                              ) : (
                                <span className="text-5xl">🍌</span>
                              )}

                              {/* Bottom line */}
                              <div className="absolute bottom-0 inset-x-2 h-[2px] bg-black/40 rounded-full" />
                            </div>
                          ))}
                        </div>

                        {/* Center highlight when stopped */}
                        {isReelStopped(reelIndex) && (
                          <div
                            className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-[140px] pointer-events-none z-20"
                            style={{
                              background: 'rgba(255,255,255,0.15)',
                              boxShadow: 'inset 0 0 30px rgba(255,255,255,0.3), 0 0 20px rgba(255,255,255,0.2)',
                              borderTop: '2px solid rgba(255,255,255,0.5)',
                              borderBottom: '2px solid rgba(255,255,255,0.5)',
                            }}
                          />
                        )}

                        {/* Top fade */}
                        <div
                          className="absolute inset-x-0 top-0 h-14 pointer-events-none z-10"
                          style={{ background: 'linear-gradient(180deg, #a78bfa 0%, transparent 100%)' }}
                        />
                        {/* Bottom fade */}
                        <div
                          className="absolute inset-x-0 bottom-0 h-10 pointer-events-none z-10"
                          style={{ background: 'linear-gradient(0deg, #7c3aed 0%, transparent 100%)' }}
                        />
                      </div>
                    ))}
                  </div>

                  {/* Payline indicators */}
                  <div
                    className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-12 rounded-r-full z-20"
                    style={{ background: 'rgba(255,255,255,0.8)', boxShadow: '0 0 10px rgba(255,255,255,0.5)' }}
                  />
                  <div
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-12 rounded-l-full z-20"
                    style={{ background: 'rgba(255,255,255,0.8)', boxShadow: '0 0 10px rgba(255,255,255,0.5)' }}
                  />
                </div>

                {/* Status indicator */}
                <div className="mt-6 flex justify-center">
                  <div
                    className="px-8 py-3 rounded-full"
                    style={{
                      background: phase === 'result' && result !== 'pro'
                        ? 'linear-gradient(180deg, rgba(255,215,0,0.15) 0%, rgba(255,215,0,0.05) 100%)'
                        : 'rgba(255,255,255,0.05)',
                      border: phase === 'result' && result !== 'pro' ? '1px solid rgba(255,215,0,0.3)' : '1px solid rgba(255,255,255,0.1)',
                    }}
                  >
                    <span
                      className="text-sm font-semibold tracking-widest"
                      style={{
                        color: phase === 'result' && result !== 'pro' ? '#ffd700' : 'rgba(255,255,255,0.5)',
                      }}
                    >
                      {phase === 'result' ? (result !== 'pro' ? 'WINNER' : 'ENTERING DRAFT') : 'REVEALING'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Result display */}
            {phase === 'result' && (
              <div className="text-center mt-2 animate-result-appear">
                {result !== 'pro' ? (
                  <>
                    <p className="text-white/50 text-sm tracking-widest mb-2">CONGRATS! YOU HIT</p>
                    <div
                      className="text-5xl font-bold tracking-tight"
                      style={{ color: resultData.color }}
                    >
                      {resultData.label}
                    </div>
                    <p className="text-white/30 text-sm mt-4">Entering draft room...</p>
                  </>
                ) : (
                  <div>
                    <p className="text-white/70 text-xl font-medium mb-2">Regular Draft</p>
                    <p className="text-white/40 text-sm">Entering the draft...</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes result-appear {
          0% { transform: translateY(20px); opacity: 0; }
          100% { transform: translateY(0); opacity: 1; }
        }
        .animate-result-appear {
          animation: result-appear 0.5s ease-out forwards;
        }

        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        .animate-bounce-slow {
          animation: bounce-slow 1.5s ease-in-out infinite;
        }

        @keyframes flash {
          0% { opacity: 0.5; }
          100% { opacity: 0; }
        }
        .animate-flash {
          animation: flash 0.15s ease-out forwards;
        }

        @keyframes confetti {
          0% {
            transform: translateY(-10px) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
          }
        }
        .animate-confetti {
          animation: confetti 3s ease-out forwards;
        }

        @keyframes shake {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          10% { transform: translate(-8px, -4px) rotate(-1deg); }
          20% { transform: translate(8px, 4px) rotate(1deg); }
          30% { transform: translate(-8px, 4px) rotate(-1deg); }
          40% { transform: translate(8px, -4px) rotate(1deg); }
          50% { transform: translate(-4px, 8px) rotate(-0.5deg); }
          60% { transform: translate(4px, -8px) rotate(0.5deg); }
          70% { transform: translate(-4px, -4px) rotate(-0.5deg); }
          80% { transform: translate(4px, 4px) rotate(0.5deg); }
          90% { transform: translate(-2px, 2px) rotate(0deg); }
        }
        .animate-shake {
          animation: shake 0.15s ease-in-out infinite;
        }

        @keyframes red-flash {
          0% { opacity: 0; }
          10% { opacity: 1; }
          20% { opacity: 0.7; }
          30% { opacity: 1; }
          40% { opacity: 0.8; }
          50% { opacity: 1; }
          60% { opacity: 0.75; }
          70% { opacity: 1; }
          80% { opacity: 0.85; }
          90% { opacity: 1; }
          100% { opacity: 0.9; }
        }
        .animate-red-flash {
          animation: red-flash 0.5s ease-in-out infinite alternate;
        }

        @keyframes jackpot-rain {
          0% {
            transform: translateY(-100px) rotate(-15deg) scale(0.5);
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          90% {
            opacity: 1;
          }
          100% {
            transform: translateY(110vh) rotate(15deg) scale(1.2);
            opacity: 0;
          }
        }
        .animate-jackpot-rain {
          animation: jackpot-rain 3s ease-in forwards;
        }

        @keyframes gold-flash {
          0% { opacity: 0; }
          10% { opacity: 1; }
          20% { opacity: 0.7; }
          30% { opacity: 1; }
          40% { opacity: 0.8; }
          50% { opacity: 1; }
          60% { opacity: 0.75; }
          70% { opacity: 1; }
          80% { opacity: 0.85; }
          90% { opacity: 1; }
          100% { opacity: 0.9; }
        }
        .animate-gold-flash {
          animation: gold-flash 0.5s ease-in-out infinite alternate;
        }

        @keyframes hof-rain {
          0% {
            transform: translateY(-100px) rotate(-15deg) scale(0.5);
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          90% {
            opacity: 1;
          }
          100% {
            transform: translateY(110vh) rotate(15deg) scale(1.2);
            opacity: 0;
          }
        }
        .animate-hof-rain {
          animation: hof-rain 3s ease-in forwards;
        }
      `}</style>
    </div>
  );
}
