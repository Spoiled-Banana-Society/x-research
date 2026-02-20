// @ts-nocheck
"use client"
import React, { useEffect, useState } from "react"
import MainComponent from "@/app/components/MainComponent"
import PlayerComponent from "@/app/components/PlayerComponent"
import { useAppSelector } from "@/redux/hooks/reduxHooks"
import { PlayerDataProps } from "@/utils/types/types"
import { setLeagueLevel } from "@/redux/leagueSlice"
import { Leagues } from "@/utils/api"

import styled from "styled-components"
import { json } from "stream/consumers"

const StyledGifPlayer = styled("div")`
    width: 40%;
    padding: 10px;
    background: black;
    border-radius: 5px;
    margin: auto;
    z-index: 100;
    img {
        width: 100%;
        height: auto;
    }

    @media (max-width: 700px) {
        width: 80%;
        left: 10%;
    }
`

const Draft = ({ params }: { params: { id: string } }) => {
    // const mostRecentDraftedPlayer = useAppSelector((state) => state.league.mostRecentPlayerDrafted)
    // Share available players across components
    const [availablePlayers, setAvailablePlayers] = useState<PlayerDataProps[]>([])
    const leagueLevel = useAppSelector((state) => state.league.leagueLevel)
    const [loading, setLoading] = useState(true)
    const [showWheel, setShowWheel] = useState(false)

    useEffect(() => {
        let slotsSeen = {}
        slotsSeen = localStorage.getItem("SLOTS_SEEN_2025")
        if (!slotsSeen) {
            slotsSeen = "{}"
        }

        slotsSeen = JSON.parse(slotsSeen)
        if (!slotsSeen[String(params.id)]) {
            slotsSeen[params.id] = true

            localStorage.setItem("SLOTS_SEEN_2025", JSON.stringify(slotsSeen))
            setShowWheel(true)
        }

        setLoading(false)
    }, [])



    // useEffect(() => {
    //     if (mostRecentDraftedPlayer) {
    //         const updatedRankings = availablePlayers.filter(
    //             (data) => data.stats.playerId !== mostRecentDraftedPlayer.playerId
    //         )
    //         setAvailablePlayers(updatedRankings)
    //     }
    // }, [mostRecentDraftedPlayer])

    // useEffect(() => {
    //     if (timeRemaining === null) {
    //         setShowWheel(true)
    //     } else {
    //         if (showWheel) {
    //             setShowWheel(false)
    //         }
    //     }
    // }, [timeRemaining])

    const getFileName = () => {
        switch(leagueLevel) {
            case 'Hall of Fame':
                return 'hof'
            case 'Jackpot':
                return 'jackpot'
            default:
                const id_str_parts = params.id.split("-")
                return `reg_${(Number(id_str_parts[id_str_parts.length - 1]) % 9) + 1}`
        }
    }

    if (loading) {
        return (
            <div />
        )
    }

    return (
        <div>
            {
                showWheel ? (
                    <div style={{height: "80vh"}}>
                        <div className="text-sm sm:text-3l font-black uppercase text-center font-primary italic py-5">
                            Jackpot Leagues - advances the winner of the league to the finals. 1% of Drafts become Jackpot.
                            <br></br>
                            <br></br>
                            Hall of Fame Leagues - compete for More Prizes. 5% of Drafts become HOF.
                        </div>
                        <StyledGifPlayer>
                            <video autoPlay>
                                <source src={`/slots/${getFileName()}.mp4`} type="video/mp4" />
                            </video>
                        </StyledGifPlayer>
                        <div className="mb-3 sm:mb-0" style={{marginTop: '40px'}}>
                            <button
                                onClick={() => {setShowWheel(false)}}
                                className="disabled:cursor-not-allowed group bg-primary font-primary font-bold text-black rounded px-3 py-1 flex mx-auto text-[19px] sm:text-md w-[300px] sm:w-[300px] items-center justify-center hover:border-slate-200 transition-all disabled:hover:border-slate-500 disabled:text-gray-600 disabled:bg-gray-500"
                            >
                                Go To Draft Room
                            </button>
                        </div>
                    </div>
                ) : (
                    <div>
                        <PlayerComponent 
                            leagueName={params.id} 
                            availablePlayers={availablePlayers} 
                            setAvailablePlayers={setAvailablePlayers} 
                        />
                        <MainComponent 
                            availablePlayers={availablePlayers} 
                            setAvailablePlayers={setAvailablePlayers}
                        />
                    </div>
                )
            }
        </div>
    )
}

export default Draft
