import { positionColor } from "@/utils/helpers"
import React, { useState } from "react"
import styled from "styled-components"
import { PlayerDataProps, PlayerStateInfo } from "@/utils/types/types"
import { useAppDispatch, useAppSelector } from "@/redux/hooks/reduxHooks"
import { removeQueue, setIdleCount, setQueue } from "@/redux/leagueSlice"
import { Queue, Draft } from "@/utils/api"
import { useToast } from "@/hooks/useToast"

type RankingItemProps = {
    item: PlayerDataProps
}

const StyledWrapper = styled.div`
    border-width: 2px;
    border-top: 1px solid #222;
    cursor: pointer;
    border-bottom: 1px solid #222;
    background: #000;
    margin: 5px auto;
    width: 900px;
    padding: 5px 0px;
    @media screen and (max-width: 900px) {
        width: 100vw;
    }
    .first-row {
        gap: 20px;
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: space-between;
        .icon {
            position: relative;
            font-size: 24px;
            bottom: 3px;
            left: 7px;
        }
        text-align: left;
    }
    .second-row {
        gap: 10px;
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: center;
        text-align: center;
        h2 {
            font-size: 12px;
            color: #888;
            text-transform: uppercase;
        }
    }
    .flex-row {
        display: flex;
        flex-grow: 1;
        flex-direction: row;
        justify-content: flex-end;
        padding-right: 15px;
        gap: 15px;
        .info {
            min-width: 40px;
            h2 {
                font-size: 13px;
                color: #888;
            }
            div {
                font-weight: bold;
                font-size: 13px;
            }
        }
    }
    .players {
        text-align: center;
        font-size: 12px;
        color: #888;
        margin: 10px 0px 3px 0px;
        text-transform: uppercase;
    }
    .players-from-team {
        text-align: center;
        font-size: 14px;
    }
    .yellow-image-filter,
    .banana-queue-button:hover {
        filter: brightness(50%) sepia(1) hue-rotate(21deg) saturate(2000%) brightness(100%);
    }
`

const DraftItemComponent: React.FC<RankingItemProps> = (props) => {
    const [show, setShow] = useState<boolean>(false)
    const { item } = props

    const endOfTurnTimestamp = useAppSelector(state => state.league.endOfTurnTimestamp);
    const leagueId = useAppSelector((state) => state.league.leagueId)
    const walletAddress = useAppSelector((state) => state.auth.walletAddress)
    const queuedPlayers = useAppSelector((state) => state.league.queuedPlayers)
    const currentDrafter = useAppSelector((state) => state.league.currentDrafter)
    const currentRound = useAppSelector((state) => state.league.currentRound)
    const currentPickNumber = useAppSelector((state) => state.league.currentPickNumber)
    const dispatch = useAppDispatch()
    const canDraft = useAppSelector((state) => state.league.canDraft)
    const [isDrafting, setIsDrafting] = useState<boolean>(false)
    const { toast } = useToast()

    const draftPlayer = async () => {
        if (!canDraft || !leagueId || !walletAddress) return
        setIsDrafting(true)
        
        // Client-side validation: prevent API call if time has expired
        // This provides immediate feedback and prevents unnecessary requests
        if (endOfTurnTimestamp && ((endOfTurnTimestamp * 1000) - Date.now() > 250)) {
            try {
                await Draft.submitPick(
                    leagueId,
                    walletAddress,
                    {
                        playerId: item.playerStateInfo.playerId,
                        displayName: item.playerStateInfo.displayName,
                        team: item.playerStateInfo.team,
                        position: item.playerStateInfo.position,
                    }
                )
                // Remove player from queue after successful draft
                // Only remove if player is actually in the queue
                if (queuedPlayers.some((queue: PlayerStateInfo) => queue && queue.playerId === item.playerStateInfo.playerId)) {
                    dispatch(removeQueue(item.playerStateInfo.playerId))
                }
                dispatch(setIdleCount(0))
                setIsDrafting(false)
            } catch (error: any) {
                // Handle draft failure - ensure queue state is not modified
                console.error("Error submitting pick:", error)
                
                // Extract error message for better debugging
                const errorMessage = error?.response?.data?.message || 
                                   error?.message || 
                                   error?.toString() || 
                                   "Failed to submit pick. Please try again."
                
                console.error("Draft error details:", {
                    playerId: item.playerStateInfo.playerId,
                    error: errorMessage,
                    leagueId,
                    walletAddress
                })
                
                // Note: We don't need to restore the player to the queue because
                // we only remove it after successful draft, so it's still in the queue
                setIsDrafting(false)
                
                // Show user-facing error message
                toast(errorMessage)
            }
        } else {
            console.log("missed pick - time expired")
            setIsDrafting(false)
        }
    }

    // send queue request via ws
    const queuePlayer = async () => {
        if (!walletAddress || !leagueId) return
        const previousQueue = [...queuedPlayers]
        const newQueue = [...queuedPlayers, item.playerStateInfo]

        // Optimistic update
        dispatch(setQueue(newQueue))
        
        try {
            const res = await Queue.setQueue(walletAddress, leagueId, newQueue)
            dispatch(setQueue(res as PlayerStateInfo[]))
        } catch (error) {
            // Rollback optimistic update
            dispatch(setQueue(previousQueue))
            console.error("Error updating queue:", error)
            toast("Failed to add player to queue. Please try again.")
        }
    }

    const deQueuePlayer = async () => {
        if (!walletAddress || !leagueId) return
        const previousQueue = [...queuedPlayers]
        const newQueue = queuedPlayers.filter((i) => item.playerId !== i.playerId)

        // Optimistic update
        dispatch(setQueue(newQueue))
        
        try {
            const res = await Queue.setQueue(walletAddress, leagueId, newQueue)
            dispatch(setQueue(res as PlayerStateInfo[]))
        } catch (error) {
            // Rollback optimistic update
            dispatch(setQueue(previousQueue))
            console.error("Error updating queue:", error)
            toast("Failed to remove player from queue. Please try again.")
        }
    }

    return (
        <StyledWrapper
            onClick={() => setShow((prev) => !prev)}
            style={{
                borderLeft: `2px solid ${positionColor(item.playerId)}`,
                borderRight: `2px solid ${positionColor(item.playerId)}`,
            }}
        >
            <div>
                <div className="first-row group">
                    <div className="w-[24px] h-[24px]">
                        <button
                            onClick={(e) => {
                                e.stopPropagation()
                                queuedPlayers.some((queue: PlayerStateInfo) => queue.playerId === item.ranking.playerId)
                                    ? deQueuePlayer()
                                    : queuePlayer()
                            }}
                            className="bg-none border-none banana-queue-button"
                        >
                            {queuedPlayers.some(
                                (queue: PlayerStateInfo) => queue && queue.playerId === item.ranking.playerId
                            ) ? (
                                <img
                                    src="/banana-filled.webp"
                                    alt="banana"
                                    className="relative left-3 yellow-image-filter"
                                />
                            ) : (
                                <img src="/banana.webp" alt="banana" className="relative left-3" />
                            )}
                        </button>
                    </div>
                    <div>
                        <div
                            className="text-[18px] font-primary font-bold text-black px-1 rounded text-xs sm:text-base md:text-sm lg:text-sm xl:text-sm"
                            style={{ background: positionColor(item.playerId) }}
                        >
                            {item.playerId}
                        </div>
                        <div className="text-[12px] font-bold">BYE {item.stats.byeWeek}</div>
                    </div>
                    <div className="flex-row">
                        <div className="info">
                            <div>{item.stats.adp === 0 ? "N/A" : item.stats.adp}</div>
                        </div>
                        <div className="info">
                            <div>{item.ranking.rank}</div>
                        </div>
                    </div>
                </div>
            </div>
            {show && (
                <div>
                    <div className="second-row">
                        
                    </div>
                    {item.stats.playersFromTeam && (
                        <div>
                            <div className="players">Players from team</div>
                            <div className="players-from-team">
                                {item.stats.playersFromTeam.map((player) => {
                                    return (
                                        <span key={player} className="pr-2">
                                            {player}
                                        </span>
                                    )
                                })}
                            </div>
                        </div>
                    )}
                    <div className="flex mx-auto text-center items-center justify-center gap-4 py-5">
                        <button
                            className="bg-primary font-primary text-black font-bold uppercase py-1 px-2 rounded cursor-pointer disabled:cursor-not-allowed disabled:bg-gray-500 disabled:text-gray-400"
                            disabled={isDrafting || !canDraft}
                            onClick={draftPlayer}
                        >
                            Draft
                        </button>
                        <button
                            onClick={() => {
                                queuedPlayers.some((queue: PlayerStateInfo) => queue.playerId === item.ranking.playerId)
                                    ? deQueuePlayer()
                                    : queuePlayer()
                            }}
                            className="bg-primary font-primary text-black font-bold uppercase py-1 px-2 rounded cursor-pointer"
                        >
                            {queuedPlayers.some(
                                (queue: PlayerStateInfo) => queue && queue.playerId === item.ranking.playerId
                            )
                                ? "Unqueue"
                                : "Queue"}
                        </button>
                    </div>
                </div>
            )}
        </StyledWrapper>
    )
}

export default React.memo(DraftItemComponent)
