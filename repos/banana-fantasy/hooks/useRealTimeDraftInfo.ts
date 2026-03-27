'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { subscribeValue } from '@/lib/api/firebase';

// ==================== TYPES ====================

export interface RealTimeDraftInfo {
  currentDrafter: string;
  pickNumber: number;
  roundNum: number;
  pickInRound: number;
  pickEndTime: number;       // Unix timestamp in seconds
  pickLength: number;        // Duration in seconds
  draftStartTime: number;    // Unix timestamp in seconds when draft starts
  lastPick: LastPickInfo | null;
  isDraftComplete: boolean;
  isDraftClosed: boolean;
}

export interface LastPickInfo {
  playerId: string;
  displayName: string;
  team: string;
  position: string;
  ownerAddress: string;
  pickNum: number;
  round: number;
}

export interface UseRealTimeDraftInfoReturn {
  /** The latest snapshot from Firebase RTDB, or null if not yet received */
  data: RealTimeDraftInfo | null;
  /** Whether a new pick was detected (pickNumber increased) — resets after consumption */
  newPickDetected: boolean;
  /** The last pick info when a new pick is detected */
  detectedPick: LastPickInfo | null;
  /** Clear the newPickDetected flag after consuming it */
  clearNewPick: () => void;
  /** Whether the listener is active */
  isListening: boolean;
}

/**
 * Hook to listen to Firebase Realtime Database for draft state.
 *
 * Listens to `drafts/{draftId}/realTimeDraftInfo` and returns the latest snapshot.
 * Detects new picks by comparing pickNumber across snapshots.
 *
 * @param draftId - The draft/league ID to listen to
 * @param isActive - Whether the draft is currently active (enables/disables listener)
 */
export function useRealTimeDraftInfo(
  draftId: string | null,
  isActive: boolean,
): UseRealTimeDraftInfoReturn {
  const [data, setData] = useState<RealTimeDraftInfo | null>(null);
  const [newPickDetected, setNewPickDetected] = useState(false);
  const [detectedPick, setDetectedPick] = useState<LastPickInfo | null>(null);
  const [isListening, setIsListening] = useState(false);

  const lastPickNumberRef = useRef<number | null>(null);

  const clearNewPick = useCallback(() => {
    setNewPickDetected(false);
    setDetectedPick(null);
  }, []);

  useEffect(() => {
    if (!draftId || !isActive) {
      setIsListening(false);
      lastPickNumberRef.current = null;
      return;
    }

    const path = `drafts/${draftId}/realTimeDraftInfo`;
    console.log('[Firebase RTDB] Subscribing to', path);
    setIsListening(true);

    const unsub = subscribeValue<RealTimeDraftInfo>(path, (value) => {
      if (!value) {
        console.warn(`[Firebase RTDB] No data at ${path}`);
        return;
      }

      setData(value);

      // Detect new picks by comparing pickNumber
      if (value.pickNumber > 1 && value.lastPick) {
        const currentPickNum = value.pickNumber;
        if (
          lastPickNumberRef.current === null ||
          currentPickNum > lastPickNumberRef.current
        ) {
          console.log(
            '[Firebase RTDB] New pick detected: pickNumber',
            currentPickNum,
            'player',
            value.lastPick.playerId,
          );
          setNewPickDetected(true);
          setDetectedPick(value.lastPick);
          lastPickNumberRef.current = currentPickNum;
        }
      } else {
        // Initialize tracking
        lastPickNumberRef.current = value.pickNumber;
      }
    });

    return () => {
      console.log('[Firebase RTDB] Unsubscribing from', path);
      unsub();
      setIsListening(false);
      lastPickNumberRef.current = null;
    };
  }, [draftId, isActive]);

  return {
    data,
    newPickDetected,
    detectedPick,
    clearNewPick,
    isListening,
  };
}
