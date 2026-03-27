import { useEffect, useState } from "react";
import { useAppSelector } from "@/redux/hooks/reduxHooks";

/**
 * Custom hook to calculate remaining time from timestamps
 * 
 * Calculates time remaining based on:
 * - Draft start countdown: if draft hasn't started yet
 * - Turn timer: if turn is active (endOfTurnTimestamp is set)
 * 
 * Updates every 100ms for smooth display and accurate logic checks
 * 
 * @returns {number | null} Time remaining in seconds, or null if no timestamps available
 */
export const useTimeRemaining = (): number | null => {
    const endOfTurnTimestamp = useAppSelector(state => state.league.endOfTurnTimestamp);
    const draftStartTimeFromRedux = useAppSelector(state => state.league.draftStartTime);
    const draftInfo = useAppSelector(state => state.draft.draftInfo);
    const draftStartTime = draftStartTimeFromRedux ?? draftInfo?.draftStartTime;
    
    const [timeRemaining, setTimeRemaining] = useState<number | null>(null);

    useEffect(() => {
        let timer: NodeJS.Timeout | undefined;

        const updateTimer = () => {
            const now = Date.now();

            // Check if the draft has started
            if (draftStartTime && now < draftStartTime * 1000) {
                // Countdown to draft start
                const remaining = draftStartTime * 1000 - now;
                setTimeRemaining(Math.max(0, Math.floor(remaining / 1000))); // Convert milliseconds to seconds
            } else if (endOfTurnTimestamp) {
                // Countdown for turn timer
                // endOfTurnTimestamp is in seconds (Unix timestamp), convert to milliseconds
                const timestampMs = endOfTurnTimestamp * 1000;
                const remaining = timestampMs - now;
                setTimeRemaining(Math.max(0, Math.floor(remaining / 1000))); // Convert milliseconds to seconds
            } else {
                // No timestamps available
                setTimeRemaining(null);
            }
        };

        // Update every 100ms for smooth display and accurate logic checks
        timer = setInterval(updateTimer, 100);
        updateTimer(); // Initial call to set the timer immediately

        return () => {
            if (timer) {
                clearInterval(timer);
            }
        };
    }, [endOfTurnTimestamp, draftStartTime]);

    return timeRemaining;
};
