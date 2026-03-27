'use client';

import { useEffect, useState } from 'react';

/**
 * Custom hook to calculate remaining time from timestamps.
 *
 * Calculates time remaining based on:
 * - Draft start countdown: if draft hasn't started yet (now < draftStartTime)
 * - Turn timer: if turn is active (endOfTurnTimestamp is set and draft has started)
 *
 * Updates every 100ms for smooth display and accurate logic checks.
 *
 * @param endOfTurnTimestamp - Unix timestamp in SECONDS when the current turn ends
 * @param draftStartTime - Unix timestamp in SECONDS when the draft starts (optional)
 * @returns Time remaining in seconds, or null if no timestamps available
 */
export function useTimeRemaining(
  endOfTurnTimestamp: number | null | undefined,
  draftStartTime: number | null | undefined,
): number | null {
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);

  useEffect(() => {
    const updateTimer = () => {
      const now = Date.now();

      // Check if the draft has started
      if (draftStartTime && now < draftStartTime * 1000) {
        // Countdown to draft start
        const remaining = draftStartTime * 1000 - now;
        setTimeRemaining(Math.max(0, Math.floor(remaining / 1000)));
      } else if (endOfTurnTimestamp) {
        // Countdown for turn timer
        // endOfTurnTimestamp is in seconds (Unix timestamp), convert to milliseconds
        const timestampMs = endOfTurnTimestamp * 1000;
        const remaining = timestampMs - now;
        setTimeRemaining(Math.max(0, Math.floor(remaining / 1000)));
      } else {
        // No timestamps available
        setTimeRemaining(null);
      }
    };

    // Update every 100ms for smooth display
    const timer = setInterval(updateTimer, 100);
    updateTimer(); // Initial call

    return () => {
      clearInterval(timer);
    };
  }, [endOfTurnTimestamp, draftStartTime]);

  return timeRemaining;
}
