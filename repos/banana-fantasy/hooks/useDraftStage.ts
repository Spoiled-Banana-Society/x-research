import { useState, useEffect } from 'react';
import { DraftType, getDraftTypeColor } from '@/lib/draftTypes';

interface UseDraftStageOptions {
  forcedType: DraftType;
  cycleDuration?: number; // ms per stage, default 10000
}

interface DraftStageState {
  stage: number; // 0=filling, 1=revealing, 2=waiting, 3=your turn
  timer: number;
  players: number;
  picksAway: number;
  revealedType: DraftType | null;
  accentColor: string;
}

export function useDraftStage({ forcedType, cycleDuration = 10000 }: UseDraftStageOptions): DraftStageState {
  const [stage, setStage] = useState(0);
  const [timer, setTimer] = useState(30);
  const [players, setPlayers] = useState(4);
  const [picksAway, setPicksAway] = useState(6);
  const [revealedType, setRevealedType] = useState<DraftType | null>(null);

  const accentColor = revealedType ? getDraftTypeColor(revealedType) : '#22c55e';

  // Cycle through stages
  useEffect(() => {
    const interval = setInterval(() => {
      setStage(prev => (prev + 1) % 4);
    }, cycleDuration);
    return () => clearInterval(interval);
  }, [cycleDuration]);

  // Animate values based on stage
  useEffect(() => {
    if (stage === 0) {
      setPlayers(4);
      setRevealedType(null);
      const fillInterval = setInterval(() => {
        setPlayers(p => Math.min(p + 1, 10));
      }, 500);
      return () => clearInterval(fillInterval);
    } else if (stage === 1) {
      setPlayers(10);
      setRevealedType(null);
      const timeout = setTimeout(() => {
        setRevealedType(forcedType);
      }, 2000);
      return () => clearTimeout(timeout);
    } else if (stage === 2) {
      setPicksAway(6);
      const picksInterval = setInterval(() => {
        setPicksAway(p => Math.max(p - 1, 1));
      }, 800);
      return () => clearInterval(picksInterval);
    } else if (stage === 3) {
      setTimer(30);
      const timerInterval = setInterval(() => {
        setTimer(t => Math.max(t - 1, 15));
      }, 300);
      return () => clearInterval(timerInterval);
    }
  }, [stage, forcedType]);

  return { stage, timer, players, picksAway, revealedType, accentColor };
}
