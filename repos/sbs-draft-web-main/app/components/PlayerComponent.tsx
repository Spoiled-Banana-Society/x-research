"use client"
import { setDraftInfo, setDraftRankings, setDraftRosters, setDraftSummary } from "@/redux/draftSlice"
import { useAppDispatch, useAppSelector } from "@/redux/hooks/reduxHooks"
import {
    setAudio,
    setCanDraft,
    setCurrentRound,
    setIdleCount,
    setLeagueId,
    setPickNumber,
    setQueue,
    setEndOfTurnTimestamp,
    setStartOfTurnTimestamp,
} from "@/redux/leagueSlice"
import { Draft } from "@/utils/api"
import { classNames } from "@/utils/helpers"
import { Switch } from "@headlessui/react"
import React, { useEffect, useState, useRef } from "react"
import PlayerCardComponent from "./PlayerCardComponent"
import styled from "styled-components"
import ReactLoading from "react-loading"
import { MdAudiotrack } from "react-icons/md"
import usePageVisibility from "@/hooks/usePageVisibility"
import { useAudioYourTurn } from "@/hooks/useAudioYourTurn"
import { PlayerDataProps } from "@/utils/types/types"
import useTimer from "@/app/components/useTimer"

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
    const init = useRef<boolean>(false)
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
    const [autoPick, setAutoPick] = useState<boolean>(false)
    const audioOn = useAppSelector((state) => state.league.audioOn)
    const [lastUpdate, setLastUpdate] = useState<number>(Date.now())
    const leagueStatus = useAppSelector((state) => state.league.leagueStatus)
    const rankings = useAppSelector((state) => state.draft.draftPlayerRankings)
    const idleCount = useAppSelector((state) => state.league.idleCount)
    const recentlyDraftedPlayer = useAppSelector((state) => state.league.mostRecentPlayerDrafted)
    const [bestADPPlayers, setBestADPPlayers] = useState<PlayerDataProps[]>([])
    const timeRemaining = useAppSelector((state) => state.league.timeRemaining)

    const dispatch = useAppDispatch()
    // const {timeRemaining} = useTimer(leagueId)
    // connect to websocket on load
    useEffect(() => {
        if (walletAddress) {
            dispatch(setLeagueId(leagueName))
            dispatch({ type: "socket/connect", payload: { walletAddress, leagueName } })

            return () => {
                console.log("hit the useEffect, disconnecting")
                dispatch({ type: "socket/disconnect" })
            }
        }
    }, [walletAddress])

    // reconnect to webssocket if on other tab for desktop
    const visibilityStatus = usePageVisibility()
    useEffect(() => {
        if (visibilityStatus) {
            console.log("Attempting to reconnect websocket")
            dispatch({ type: "socket/connect", payload: { walletAddress, leagueName } })
        }
    }, [visibilityStatus])

    useEffect(() => {
        if (!init.current && draftInfo !== null && draftInfo !== undefined) {
            init.current = true
            const { draftStartTime, pickLength, pickNumber } = draftInfo
            const startOfCurrentPick = draftStartTime + pickLength * pickNumber * 1000
            const endOfCurrentPick = startOfCurrentPick + pickLength * 1000
            console.log(`Init timers`, { pickLength, pickNumber, startOfCurrentPick, endOfCurrentPick })
            setEndOfTurnTimestamp(endOfCurrentPick)
            setStartOfTurnTimestamp(startOfCurrentPick)
        }
    }, [draftInfo])

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
        if (recentlyDraftedPlayer && rankings) {
            Draft.getPlayerRankings(leagueId!, walletAddress!).then((res) => {
                dispatch(setDraftRankings(res))
            })
            // grab players that are still available
            const updatedAvailablePlayers = rankings!.filter((data) => data.playerStateInfo.ownerAddress === "")
            setAvailablePlayers(updatedAvailablePlayers)
        }
    }, [recentlyDraftedPlayer])

    // update queue with available players
    useEffect(() => {
        if (availablePlayers) {
            const updatedPlayers = queuedPlayers.filter((player) =>
                availablePlayers.some((data) => data.playerStateInfo.playerId === player.playerId)
            )
            dispatch(setQueue(updatedPlayers))
        }
    }, [availablePlayers])

    // idle pick
    useEffect(() => {
        // TODO: Update 3 to 30 in prod
        if (idleCount >= 2 && canDraft && timeRemaining! < 27) {
            console.log("init auotpick")
            //@ts-ignore
            const myRoster = Object.entries(roster[walletAddress!]).map(([key, value]) => ({
                key,
                //@ts-ignore
                length: value.length,
            }))
            if (queuedPlayers.length > 0) {
                console.log("autopick: choosing from queued players")
                const payload = {
                    type: "pick_received",
                    payload: {
                        playerId: queuedPlayers[0].playerId,
                        displayName: queuedPlayers[0].displayName,
                        team: queuedPlayers[0].team,
                        position: queuedPlayers[0].position,
                        ownerAddress: currentDrafter,
                        pickNum: currentPickNumber,
                        round: currentRound,
                    },
                }
                try {
                    dispatch({ type: "socket/send", payload })
                } catch (error) {
                    console.error("Error sending payload")
                }
                // if within the first 12 rounds, then draft highest ADP players
            } else if (currentRound! < 12) {
                console.log("currentRound < 12")
                const payload = {
                    type: "pick_received",
                    payload: {
                        playerId: bestADPPlayers[0].playerStateInfo.playerId,
                        displayName: bestADPPlayers[0].playerStateInfo.displayName,
                        team: bestADPPlayers[0].playerStateInfo.team,
                        position: bestADPPlayers[0].playerStateInfo.position,
                        ownerAddress: currentDrafter,
                        pickNum: currentPickNumber,
                        round: currentRound,
                    },
                }
                try {
                    dispatch({ type: "socket/send", payload })
                } catch (error) {
                    console.error("Error sending payload")
                }
            } else {
                if (myRoster.some((item) => item.key === "RB" && item.length < 1)) {
                    console.log("choosing rb")
                    const bestAvailable = availablePlayers.find(
                        (position) => position.stats.playerId.indexOf("-RB") >= 1
                    )
                    const payload = {
                        type: "pick_received",
                        payload: {
                            playerId: bestAvailable!.playerStateInfo.playerId,
                            displayName: bestAvailable!.playerStateInfo.displayName,
                            team: bestAvailable!.playerStateInfo.team,
                            position: bestAvailable!.playerStateInfo.position,
                            ownerAddress: currentDrafter,
                            pickNum: currentPickNumber,
                            round: currentRound,
                        },
                    }
                    try {
                        dispatch({ type: "socket/send", payload })
                    } catch (error) {
                        console.error("Error sending payload")
                    }
                } else if (myRoster.some((item) => item.key === "WR" && item.length < 1)) {
                    console.log("choosing wr")
                    const bestAvailable = availablePlayers.find(
                        (position) => position.stats.playerId.indexOf("-WR") >= 1
                    )
                    const payload = {
                        type: "pick_received",
                        payload: {
                            playerId: bestAvailable!.playerStateInfo.playerId,
                            displayName: bestAvailable!.playerStateInfo.displayName,
                            team: bestAvailable!.playerStateInfo.team,
                            position: bestAvailable!.playerStateInfo.position,
                            ownerAddress: currentDrafter,
                            pickNum: currentPickNumber,
                            round: currentRound,
                        },
                    }
                    try {
                        dispatch({ type: "socket/send", payload })
                    } catch (error) {
                        console.error("Error sending payload")
                    }
                } else if (myRoster.some((item) => item.key === "QB" && item.length < 1)) {
                    console.log("choosing qb")
                    const bestAvailable = availablePlayers.find(
                        (position) => position.stats.playerId.indexOf("-QB") >= 1
                    )
                    const payload = {
                        type: "pick_received",
                        payload: {
                            playerId: bestAvailable!.playerStateInfo.playerId,
                            displayName: bestAvailable!.playerStateInfo.displayName,
                            team: bestAvailable!.playerStateInfo.team,
                            position: bestAvailable!.playerStateInfo.position,
                            ownerAddress: currentDrafter,
                            pickNum: currentPickNumber,
                            round: currentRound,
                        },
                    }
                    try {
                        dispatch({ type: "socket/send", payload })
                    } catch (error) {
                        console.error("Error sending payload")
                    }
                } else if (myRoster.some((item) => item.key === "TE" && item.length < 1)) {
                    console.log("choosing te")
                    const bestAvailable = availablePlayers.find(
                        (position) => position.stats.playerId.indexOf("-TE") >= 1
                    )
                    const payload = {
                        type: "pick_received",
                        payload: {
                            playerId: bestAvailable!.playerStateInfo.playerId,
                            displayName: bestAvailable!.playerStateInfo.displayName,
                            team: bestAvailable!.playerStateInfo.team,
                            position: bestAvailable!.playerStateInfo.position,
                            ownerAddress: currentDrafter,
                            pickNum: currentPickNumber,
                            round: currentRound,
                        },
                    }
                    try {
                        dispatch({ type: "socket/send", payload })
                    } catch (error) {
                        console.error("Error sending payload")
                    }
                } else if (myRoster.some((item) => item.key === "DST" && item.length < 1)) {
                    console.log("choosing dst")
                    const bestAvailable = availablePlayers.find(
                        (position) => position.stats.playerId.indexOf("-DST") >= 1
                    )
                    const payload = {
                        type: "pick_received",
                        payload: {
                            playerId: bestAvailable!.playerStateInfo.playerId,
                            displayName: bestAvailable!.playerStateInfo.displayName,
                            team: bestAvailable!.playerStateInfo.team,
                            position: bestAvailable!.playerStateInfo.position,
                            ownerAddress: currentDrafter,
                            pickNum: currentPickNumber,
                            round: currentRound,
                        },
                    }
                    try {
                        dispatch({ type: "socket/send", payload })
                    } catch (error) {
                        console.error("Error sending payload")
                    }
                    // if all min positions are filled, then go back to highest adp
                } else {
                    console.log("choosing whomever")
                    const payload = {
                        type: "pick_received",
                        payload: {
                            playerId: bestADPPlayers[0].playerStateInfo.playerId,
                            displayName: bestADPPlayers[0].playerStateInfo.displayName,
                            team: bestADPPlayers[0].playerStateInfo.team,
                            position: bestADPPlayers[0].playerStateInfo.position,
                            ownerAddress: currentDrafter,
                            pickNum: currentPickNumber,
                            round: currentRound,
                        },
                    }
                    try {
                        dispatch({ type: "socket/send", payload })
                    } catch (error) {
                        console.error("Error sending payload")
                    }
                }
            }
        }
    }, [canDraft, timeRemaining])

    // API calls
    useEffect(() => {
        if (leagueId && walletAddress) {
            Draft.getDraftInfo(leagueId).then((response) => {
                dispatch(setDraftInfo(response))
                dispatch(setPickNumber(response.pickNumber))
                dispatch(setCurrentRound(response.roundNum))
            })
            Draft.getDraftSummary(leagueId).then((response) => {
                dispatch(setDraftSummary(response.summary))
            })
            Draft.getDraftRosters(leagueId).then((response) => {
                dispatch(setDraftRosters(response))
            })
            Draft.getPlayerRankings(leagueId, walletAddress).then((res) => {
                dispatch(setDraftRankings(res))
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
        // autopick feature
        // if (timeRemaining! < 1 && canDraft && queuedPlayers.length > 0) {
        //     if (!canDraft) return
        //     const payload = {
        //         type: "pick_received",
        //         payload: {
        //             playerId: queuedPlayers[0].playerId,
        //             displayName: queuedPlayers[0].displayName,
        //             team: queuedPlayers[0].team,
        //             position: queuedPlayers[0].position,
        //             ownerAddress: currentDrafter,
        //             pickNum: currentPickNumber,
        //             round: currentRound,
        //         },
        //     }
        //     try {
        //         dispatch({ type: "socket/send", payload })
        //         dispatch(setIdleCount(idleCount + 1))
        //     } catch (error) {
        //         console.error("Error sending payload")
        //     }
        // }
    }, [timeRemaining])

    useEffect(() => {
        const freezeTimeout = setTimeout(() => {
            const currentTime = Date.now()
            if (currentTime - lastUpdate > 2 * 5000 && leagueStatus !== "completed") {
                console.log("Timer seems frozen, reconnecting to websocket")
                dispatch({ type: "socket/disconnect" })
                setTimeout(() => {
                    dispatch({ type: "socket/connect", payload: { walletAddress, leagueName } })
                }, 1000)
            }
        }, 3000)

        return () => clearTimeout(freezeTimeout)
    }, [timeRemaining, lastUpdate])

    // calculate turn
    const [turn, setTurn] = useState<number>(0)

    useEffect(() => {
        Draft.getDraftRosters(leagueId!).then((response) => {
            dispatch(setDraftRosters(response))
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
                <div>
                    <button
                        onClick={() => (audioOn ? dispatch(setAudio(false)) : dispatch(setAudio(true)))}
                        className="text-[12px] text-right cursor-pointer flex items-center justify-end border border-gray-500 px-1 mr-2"
                    >
                        {audioOn ? "MUTE" : "UNMUTE"} <MdAudiotrack />
                    </button>
                </div>
                {
                    /**
                    <div>
                        <span className="text-xs relative bottom-0.5 pr-1">AUTOPICK</span>
                        <Switch
                            checked={autoPick}
                            onChange={() => setAutoPick((prev) => !prev)}
                            className={classNames(
                                autoPick ? "bg-red-500" : "bg-slate-500",
                                "relative inline-flex h-4 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-slate-600 focus:ring-offset-2"
                            )}
                        >
                            <span className="sr-only">Toggle Autopick</span>
                            <span
                                aria-hidden="true"
                                className={classNames(
                                    autoPick ? "translate-x-5" : "translate-x-0",
                                    "pointer-events-none inline-block h-3 w-3 transform rounded-full bg-white transition duration-200 ease-in-out"
                                )}
                            />
                        </Switch>
                    </div>
                     */
                }
                
            </div>
        </div>
    )
}

export default PlayerComponent
