"use client"

import { useEffect, useRef } from 'react'
import { ref, onValue, DataSnapshot } from 'firebase/database'
import { db } from '@/utils/db'
import { useAppDispatch, useAppSelector } from '@/redux/hooks/reduxHooks'
import {
    setCurrentDrafter,
    setCurrentRound,
    setPickNumber,
    setMostRecentPlayerDrafted,
    setLeagueStatus,
    setEndOfTurnTimestamp,
    setStartOfTurnTimestamp,
    setDraftStartTime,
    setGeneratedCard,
} from '@/redux/leagueSlice'
import { RealTimeDraftInfo, PlayerStateInfo } from '@/utils/types/types'
import { Leagues } from '@/utils/api'

/**
 * Hook to listen to Firebase Realtime Database changes for RealTimeDraftInfo
 * 
 * Best Practices:
 * - Automatically cleans up listener on unmount or when dependencies change
 * - Only sets up listener when leagueId and isActive are both true
 * - Uses refs to track state and avoid unnecessary dispatches
 * - Handles errors gracefully with console logging
 * - Detects new picks by comparing pickNumber
 * - Updates timer timestamps from pickEndTime and pickLength
 * - Detects draft closure (isDraftClosed transition) and fetches generated card
 * 
 * @param leagueId - The draft/league ID to listen to
 * @param isActive - Whether the draft is currently active
 */
export const useRealTimeDraftInfo = (leagueId: string | null, isActive: boolean) => {
    const dispatch = useAppDispatch()
    const walletAddress = useAppSelector((state) => state.auth.walletAddress)
    const lastPickNumberRef = useRef<number | null>(null)
    const unsubscribeRef = useRef<(() => void) | null>(null)
    const previousIsDraftClosedRef = useRef<boolean | null>(null)
    const cardFetchedRef = useRef<boolean>(false)

    useEffect(() => {
        // Clean up existing listener if leagueId or isActive changes
        if (unsubscribeRef.current) {
            unsubscribeRef.current()
            unsubscribeRef.current = null
        }

        // Don't set up listener if leagueId is missing or draft is not active
        if (!leagueId || !isActive) {
            lastPickNumberRef.current = null
            previousIsDraftClosedRef.current = null
            cardFetchedRef.current = false
            return
        }

        // Create database reference
        const realTimeInfoRef = ref(db, `drafts/${leagueId}/realTimeDraftInfo`)

        // Set up Firebase listener
        // onValue returns an unsubscribe function that we store for cleanup
        const unsubscribe = onValue(
            realTimeInfoRef,
            (snapshot: DataSnapshot) => {
                const realTimeInfo: RealTimeDraftInfo | null = snapshot.val()

                // Handle null/undefined data gracefully
                if (!realTimeInfo) {
                    console.warn(`RealTimeDraftInfo is null for draft ${leagueId}`)
                    return
                }

                // Update draft state - these are always dispatched when data changes
                dispatch(setCurrentDrafter(realTimeInfo.currentDrafter))
                dispatch(setPickNumber(realTimeInfo.pickNumber))
                dispatch(setCurrentRound(realTimeInfo.roundNum))

                // Set timer timestamps
                // pickEndTime is in seconds (Unix timestamp)
                // pickLength is duration in seconds
                dispatch(setEndOfTurnTimestamp(realTimeInfo.pickEndTime))
                dispatch(setStartOfTurnTimestamp(realTimeInfo.pickEndTime - realTimeInfo.pickLength))
                
                // Set draft start time if available
                if (realTimeInfo.draftStartTime) {
                    dispatch(setDraftStartTime(realTimeInfo.draftStartTime))
                }

                // Check for new pick by comparing pickNumber
                // Only dispatch new pick if pickNumber has increased
                if (realTimeInfo.pickNumber > 1 && realTimeInfo.lastPick) {
                    const currentPickNum = realTimeInfo.pickNumber
                    
                    // Check if this is a new pick (pickNumber increased)
                    if (lastPickNumberRef.current === null || currentPickNum > lastPickNumberRef.current) {
                        const lastPick: PlayerStateInfo = realTimeInfo.lastPick
                        
                        // Dispatch the new pick to Redux
                        dispatch(setMostRecentPlayerDrafted({
                            playerId: lastPick.playerId,
                            displayName: lastPick.displayName,
                            team: lastPick.team,
                            position: lastPick.position,
                            ownerAddress: lastPick.ownerAddress,
                            pickNum: lastPick.pickNum,
                            round: lastPick.round,
                        }))
                        
                        // Update ref to track the latest pick number
                        lastPickNumberRef.current = currentPickNum
                    }
                } else {
                    // Initialize or reset the pick number tracking
                    lastPickNumberRef.current = realTimeInfo.pickNumber
                }

                // Check draft completion status
                if (realTimeInfo.isDraftComplete) {
                    dispatch(setLeagueStatus("completed"))
                } else {
                    dispatch(setLeagueStatus("ongoing"))
                }

                // Check for draft closure transition (when card generation is complete)
                // Detect when isDraftClosed changes from false to true
                const previousIsDraftClosed = previousIsDraftClosedRef.current
                const currentIsDraftClosed = realTimeInfo.isDraftClosed

                if (
                    currentIsDraftClosed &&
                    previousIsDraftClosed !== null &&
                    previousIsDraftClosed === false &&
                    !cardFetchedRef.current &&
                    walletAddress &&
                    leagueId
                ) {
                    // Draft was just closed and card should be available
                    // Fetch the generated card image URL
                    cardFetchedRef.current = true
                    Leagues.getLeague(walletAddress, leagueId)
                        .then((response) => {
                            if (response?.card?._imageUrl) {
                                dispatch(setGeneratedCard(response.card._imageUrl))
                                console.log('Generated card fetched and set:', response.card._imageUrl)
                            } else {
                                console.warn('Card response missing image URL:', response)
                            }
                        })
                        .catch((error) => {
                            console.error('Error fetching generated card:', error)
                            // Reset flag to allow retry
                            cardFetchedRef.current = false
                        })
                }

                // Update ref to track previous isDraftClosed state
                previousIsDraftClosedRef.current = currentIsDraftClosed
            },
            (error) => {
                // Error callback - Firebase will automatically retry, but we log for debugging
                console.error('Error listening to real-time draft info:', error)
            }
        )

        // Store unsubscribe function for cleanup
        unsubscribeRef.current = unsubscribe

        // Cleanup function - called when component unmounts or dependencies change
        return () => {
            if (unsubscribeRef.current) {
                unsubscribeRef.current()
                unsubscribeRef.current = null
            }
            // Reset pick number tracking on cleanup
            lastPickNumberRef.current = null
            previousIsDraftClosedRef.current = null
            cardFetchedRef.current = false
        }
    }, [leagueId, isActive, dispatch, walletAddress])
}

