"use client"
import { setDraftInfo, setDraftRankings, setDraftRosters, setDraftSummary, setDraftSort } from "@/redux/draftSlice"
import { useAppDispatch, useAppSelector } from "@/redux/hooks/reduxHooks"
import {
    setAudio,
    setAutoDraft,
    setCanDraft,
    setCurrentRound,
    setIdleCount,
    setLeagueId,
    setPickNumber,
    setQueue,
    removeQueue,
} from "@/redux/leagueSlice"
import { Draft, Queue } from "@/utils/api"
import { classNames } from "@/utils/helpers"
import { Switch } from "@headlessui/react"
import React, { useCallback, useEffect, useState } from "react"
import PlayerCardComponent from "./PlayerCardComponent"
import styled from "styled-components"
import ReactLoading from "react-loading"
import { MdAudiotrack } from "react-icons/md"
import { useAudioYourTurn } from "@/hooks/useAudioYourTurn"
import { PlayerDataProps, PlayerStateInfo, SortState } from "@/utils/types/types"
import { useToast } from "@/hooks/useToast"
import useTimer from "@/app/components/useTimer"
import { useRealTimeDraftInfo } from "@/hooks/useRealTimeDraftInfo"
import { useTimeRemaining } from "@/hooks/useTimeRemaining"

type PlayerComponentProps = {
    leagueName: string
    availablePlayers: PlayerDataProps[]
    setAvailablePlayers: Function
}

const StyledContainer = styled.div`
    &::-webkit-scrollbar {
        display: none;
    }

    margin-top: 15px;
`

const getStyleForLeagueLevel = (leagueLevel: string) => {
    switch (leagueLevel) {
        case 'Hall of Fame':
            return "bg-primary-dark fixed top-0 z-20 w-full overflow-hidden text-black"
        case 'Jackpot':
            return "bg-red-500 fixed top-0 z-20 w-full overflow-hidden text-black"
        default:
            return "fixed top-0 bg-black z-20 w-full overflow-hidden text-white"
    }
}

const PlayerComponent: React.FC<PlayerComponentProps> = (props) => {
    const { leagueName, availablePlayers, setAvailablePlayers } = props
    const walletAddress = useAppSelector((state) => state.auth.walletAddress)
    const leagueId = useAppSelector((state) => state.league.leagueId)
    const draftSummary = useAppSelector((state) => state.draft.draftSummary)
    const roster = useAppSelector((state) => state.draft.draftRosters)
    const draftInfo = useAppSelector((state) => state.draft.draftInfo)
    const currentPickNumber = useAppSelector((state) => state.league.currentPickNumber)
    const currentDrafter = useAppSelector((state) => state.league.currentDrafter)
    const queuedPlayers = useAppSelector((state) => state.league.queuedPlayers)
    const currentRound = useAppSelector((state) => state.league.currentRound)
    const canDraft = useAppSelector((state) => state.league.canDraft)
    const autoDraft = useAppSelector((state) => state.league.autoDraft)
    const [autoPick, setAutoPick] = useState<boolean>(false)
    const [autoDraftToggleLoading, setAutoDraftToggleLoading] = useState(false)
    const { toast } = useToast()
    const audioOn = useAppSelector((state) => state.league.audioOn)
    const leagueStatus = useAppSelector((state) => state.league.leagueStatus)
    const rankings = useAppSelector((state) => state.draft.draftPlayerRankings)
    const idleCount = useAppSelector((state) => state.league.idleCount)
    const recentlyDraftedPlayer = useAppSelector((state) => state.league.mostRecentPlayerDrafted)
    const [bestADPPlayers, setBestADPPlayers] = useState<PlayerDataProps[]>([])
    const timeRemaining = useTimeRemaining()

    const dispatch = useAppDispatch()
    
    // Set league ID on mount and fetch queue
    useEffect(() => {
        if (walletAddress) {
            dispatch(setLeagueId(leagueName))
            // Fetch queue when leagueId is set
            Queue.getQueue(walletAddress, leagueName).then((res) => {
                dispatch(setQueue(res as PlayerStateInfo[]))
            }).catch((error) => {
                console.error("Error fetching queue:", error)
            })
        }
    }, [walletAddress, leagueName, dispatch])

    // Use Firebase Realtime Database listener for draft updates
    const isDraftActive = leagueStatus === "ongoing" || leagueStatus === null
    useRealTimeDraftInfo(leagueId, isDraftActive)

    /** Draft id for API paths (e.g. 2024-fast-draft-1000) */
    const draftIdForApi = leagueName

    const applyDraftPreferences = useCallback(
        (p: { sortBy: string; autoDraft: boolean }) => {
            const order = String(p.sortBy || "ADP").toUpperCase()
            dispatch(setDraftSort(order === "RANK" ? SortState.RANK : SortState.ADP))
            dispatch(setAutoDraft(!!p.autoDraft))
        },
        [dispatch]
    )

    // Load sortBy + autoDraft on join and after every pick (manual or timer auto-pick)
    useEffect(() => {
        if (!walletAddress || !draftIdForApi) return
        let cancelled = false
        Draft.getDraftPreferences(draftIdForApi, walletAddress)
            .then((p) => {
                if (!cancelled) applyDraftPreferences(p)
            })
            .catch((e) => {
                if (!cancelled) console.error("Error fetching draft preferences:", e)
            })
        return () => {
            cancelled = true
        }
    }, [walletAddress, draftIdForApi, currentPickNumber, applyDraftPreferences])

    const onAutoDraftToggle = async (enabled: boolean) => {
        if (!walletAddress || !draftIdForApi || autoDraftToggleLoading) return
        setAutoDraftToggleLoading(true)
        try {
            const p = await Draft.patchDraftPreferences(draftIdForApi, walletAddress, {
                autoDraft: enabled,
            })
            applyDraftPreferences(p)
        } catch (e) {
            console.error(e)
            toast("Could not update auto-draft. Try again.")
        } finally {
            setAutoDraftToggleLoading(false)
        }
    }

    useEffect(() => {
        const bestPlayers = availablePlayers
            .filter((data) => data.stats.adp !== 0)
            .sort((a, b) => {
                if (a.stats.adp === 0 && b.stats.adp !== 0) {
                    return 1
                } else if (a.stats.adp !== 0 && b.stats.adp === 0) {
                    return -1
                } else {
                    return a.stats.adp - b.stats.adp
                }
            })
        setBestADPPlayers(bestPlayers)
    }, [availablePlayers])

    // set available players on component mount, however data is stale after new pick
    useEffect(() => {
        if (rankings) {
            try {
                const players = rankings.filter((data) => data.playerStateInfo.ownerAddress === "")
                setAvailablePlayers(players)
            } catch (e) {
                console.error(e)
                // pass
            }
            
        }
    }, [rankings])

    useEffect(() => {
        if (recentlyDraftedPlayer && rankings && leagueId && walletAddress) {
            Draft.getPlayerRankings(leagueId, walletAddress).then((res) => {
                dispatch(setDraftRankings(res))
            }).catch((error) => {
                console.error("Error fetching player rankings:", error)
            })
            // grab players that are still available
            const updatedAvailablePlayers = rankings.filter((data) => data.playerStateInfo.ownerAddress === "")
            setAvailablePlayers(updatedAvailablePlayers)
        }
    }, [recentlyDraftedPlayer])

    // Remove drafted player from queue when lastPick is updated via real-time draft info
    // This uses the lastPick data from Firebase Realtime Database to directly update the queue
    useEffect(() => {
        if (recentlyDraftedPlayer && queuedPlayers.length > 0) {
            // Check if the recently drafted player is in the queue
            const playerInQueue = queuedPlayers.some(
                (player) => player.playerId === recentlyDraftedPlayer.playerId
            )
            
            if (playerInQueue) {
                // Remove the drafted player from the queue
                dispatch(removeQueue(recentlyDraftedPlayer.playerId))
            }
        }
    }, [recentlyDraftedPlayer, queuedPlayers, dispatch])

    // update queue with available players
    useEffect(() => {
        if (availablePlayers) {
            const updatedPlayers = queuedPlayers.filter((player) =>
                availablePlayers.some((data) => data.playerStateInfo.playerId === player.playerId)
            )
            dispatch(setQueue(updatedPlayers))
        }
    }, [availablePlayers])

    // API calls
    useEffect(() => {
        if (leagueId && walletAddress) {
            Draft.getDraftInfo(leagueId).then((response) => {
                dispatch(setDraftInfo(response))
                dispatch(setPickNumber(response.pickNumber))
                dispatch(setCurrentRound(response.roundNum))
            }).catch((error) => {
                console.error("Error fetching draft info:", error)
            })
            Draft.getDraftSummary(leagueId).then((response) => {
                dispatch(setDraftSummary(response.summary))
            }).catch((error) => {
                console.error("Error fetching draft summary:", error)
            })
            Draft.getDraftRosters(leagueId).then((response) => {
                dispatch(setDraftRosters(response))
            }).catch((error) => {
                console.error("Error fetching draft rosters:", error)
            })
            Draft.getPlayerRankings(leagueId, walletAddress).then((res) => {
                dispatch(setDraftRankings(res))
            }).catch((error) => {
                console.error("Error fetching player rankings:", error)
            })
        }
    }, [leagueId, walletAddress, currentPickNumber])
    const { playYourTurn } = useAudioYourTurn("/your-turn.wav")

    useEffect(() => {
        if (currentDrafter === walletAddress) {
            dispatch(setCanDraft(true))
            audioOn && playYourTurn()
        } else {
            dispatch(setCanDraft(false))
        }
    }, [currentDrafter, walletAddress])

    useEffect(() => {
        if (idleCount >= 2) {
            // setAutoPick(true)
        }
    }, [idleCount])

    useEffect(() => {
        if (autoPick) {
            dispatch(setIdleCount(2))
        } else {
            dispatch(setIdleCount(0))
        }
    }, [autoPick])

    useEffect(() => {
        // Requested to freeze canDraft at 0
        if (timeRemaining === 0 && canDraft) {
            dispatch(setCanDraft(false))
            dispatch(setIdleCount(idleCount + 1))
        }
    }, [timeRemaining])


    // calculate turn
    const [turn, setTurn] = useState<number>(0)

    useEffect(() => {
        if (!leagueId) return
        Draft.getDraftRosters(leagueId).then((response) => {
            dispatch(setDraftRosters(response))
        }).catch((error) => {
            console.error("Error fetching draft rosters:", error)
        })
        if (currentPickNumber && draftSummary) {
            // index the current pick
            const index = draftSummary.findIndex((item) => item.playerInfo.pickNum === currentPickNumber)
            const currentList = draftSummary.slice(index)
            const nextIndex = currentList.findIndex((item) => item.playerInfo.ownerAddress === walletAddress)
            // const nextList = currentList.slice(0, nextIndex + 1)
            const nextPick = currentList.filter((item, index) => index < nextIndex).length
            setTurn(nextPick)
        }
    }, [currentPickNumber, draftSummary])
    const leagueLevel = useAppSelector((state) => state.league.leagueLevel)

    return (
        <div
            className={getStyleForLeagueLevel(leagueLevel)}
        >
            <StyledContainer className="w-full flex gap-2 lg:gap-5 overflow-x-auto">
                {draftSummary && roster && currentPickNumber !== null ? (
                    draftSummary.map((item) => {
                        return (
                            <PlayerCardComponent
                                item={item}
                                key={item.playerInfo.pickNum}
                                draftedPlayer={item.playerInfo.playerId}
                                // @ts-ignore
                                roster={roster[item.playerInfo.ownerAddress]}
                            />
                        )
                    })
                ) : (
                    <ReactLoading type={"bubbles"} color={"#fff"} height={100} width={100} />
                )}
            </StyledContainer>
            <div className="flex items-center justify-between px-3 pt-2 mt-3 bg-slate-80">
                <div className="grow text-center uppercase text-sm font-bold">
                    {timeRemaining === null
                        ? "Draft will start soon"
                        : currentPickNumber && turn > 0
                        ? `${turn} turn(s) until your pick!`
                        : turn === 0 && currentDrafter === walletAddress
                        ? "Your turn to draft!"
                        : ""}
                </div>
            </div>
            <div className="flex items-center justify-center py-2 border-b border-slate-700">
                {leagueLevel === "Hall of Fame" && (
                    <div>
                        <img src="/hof.png" alt="Hall of Fame" className=" w-[50px] mr-2 h-auto" />
                    </div>
                )}
                {leagueLevel === "Jackpot" && (
                    <div style={{marginRight: '5px'}}>
                        <img src="/jackpot.png" alt="Jackpot" className=" w-[100px] mr-2 h-auto" />
                    </div>
                )}
                <div className="flex items-center gap-2 flex-wrap justify-center">
                    <button
                        onClick={() => (audioOn ? dispatch(setAudio(false)) : dispatch(setAudio(true)))}
                        className="text-[12px] text-right cursor-pointer flex items-center justify-end border border-gray-500 px-1"
                    >
                        {audioOn ? "MUTE" : "UNMUTE"} <MdAudiotrack />
                    </button>
                    {walletAddress ? (
                        <div className="flex items-center gap-1.5 border border-gray-500 px-2 py-0.5">
                            <span className="text-[11px] uppercase font-bold whitespace-nowrap">
                                Auto-draft
                            </span>
                            <Switch
                                checked={autoDraft}
                                disabled={autoDraftToggleLoading}
                                onChange={() => onAutoDraftToggle(!autoDraft)}
                                className={classNames(
                                    autoDraft ? "bg-emerald-600" : "bg-slate-500",
                                    autoDraftToggleLoading ? "opacity-50 cursor-wait" : "",
                                    "relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-slate-600 focus:ring-offset-2 focus:ring-offset-black"
                                )}
                            >
                                <span className="sr-only">Toggle auto-draft</span>
                                <span
                                    aria-hidden="true"
                                    className={classNames(
                                        autoDraft ? "translate-x-4" : "translate-x-0",
                                        "pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white transition duration-200 ease-in-out"
                                    )}
                                />
                            </Switch>
                        </div>
                    ) : null}
                </div>
                
            </div>
        </div>
    )
}

export default PlayerComponent
