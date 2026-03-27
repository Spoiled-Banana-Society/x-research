import React from "react"
import DraftComponent from "./DraftComponent"
import QueueComponent from "./QueueComponent"
import BoardComponent from "./BoardComponent"
import RosterComponent from "./RosterComponent"
import { useAppDispatch, useAppSelector } from "@/redux/hooks/reduxHooks"
import { ViewState } from "@/utils/types/types"
import { setViewState } from "@/redux/leagueSlice"
import CompletedComponent from "./CompletedComponent"
import { PlayerDataProps } from "@/utils/types/types"
import { AiFillInfoCircle } from "react-icons/ai";
import styled from "styled-components"
import { Tooltip } from 'react-tooltip'

type MainDraftComponentProps = {
    availablePlayers: PlayerDataProps[]
    setAvailablePlayers: Function
}

const StyledDraftHoverCard = styled.div`
    position: absolute;
    left: 0;
    top: 458px;
    background: white;
    padding: 20px;
    color: black;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    width: 134px;
    font-size: 10px;
    border-bottom-right-radius: 20px;
    border-top-right-radius: 20px;


    @media (max-width: 1424px) {
        display: none;
    }
`

const MainComponent: React.FC<MainDraftComponentProps> = (props) => {
    const { availablePlayers, setAvailablePlayers } = props

    const viewState = useAppSelector((state) => state.league.viewState)
    const leagueStatus = useAppSelector((state) => state.league.leagueStatus)
    const queuedPlayers = useAppSelector((state) => state.league.queuedPlayers)
    const leagueLevel = useAppSelector((state) => state.league.leagueLevel)

    const dispatch = useAppDispatch()
    return (
        <main>
            {
                // leagueLevel !== "Hall of Fame" && leagueLevel !== "Jackpot" ? (
                //     <div>
                //         <StyledDraftHoverCard>
                //             <Tooltip style={{width: '500px', marginLeft: '20px'}} id="hof-tooltip" />
                //             <span>Not HOF Draft</span>
                //                 <AiFillInfoCircle 
                //                     style={{fontSize: '20px', marginLeft: '5px'}} 
                //                     data-tooltip-id="hof-tooltip"
                //                     data-tooltip-content="1.2 ETH (~$4,000) Guaranteed Prize for 1st Place of Hall Of Fame Leagues. 5% of leagues will become HOF leagues. Hall of Fame Leagues compete for even more prizes in addition to the Weekly and Seasonal prizes available."
                //                     data-tooltip-place="right"
                //                 />
                //         </StyledDraftHoverCard>
                //         <StyledDraftHoverCard style={{top: '555px'}}>
                //             <Tooltip style={{width: '500px', marginLeft: '20px'}} id="jackpot-tooltip" />
                //             <span>Not Jackpot Draft</span>
                //                 <AiFillInfoCircle 
                //                     style={{fontSize: '22px', marginLeft: '5px'}}
                //                     data-tooltip-id="jackpot-tooltip"
                //                     data-tooltip-content="Jackpot leagues will automatically advance the winner of the league to the finals skipping the first two weeks of the playoffs. 1% percent of leagues will become Jackpot leagues."
                //                     data-tooltip-place="right"
                //                 />
                //         </StyledDraftHoverCard>
                //     </div>
                // ) : ''
            }
            {leagueStatus === "ongoing" ? (
                <>
                    <div className="mx-auto flex items-center justify-center mt-[290px]">
                        <nav className="flex items-center justify-center gap-4 md:gap-10 font-primary uppercase cursor-pointer font-bold">
                            <div
                                onClick={() => dispatch(setViewState(ViewState.DRAFT))}
                                className={`${
                                    viewState === ViewState.DRAFT
                                        ? "text-primary border border-primary px-2 rounded"
                                        : ""
                                }`}
                            >
                                Draft
                            </div>
                            <div
                                onClick={() => dispatch(setViewState(ViewState.QUEUE))}
                                className={`${
                                    viewState === ViewState.QUEUE
                                        ? "text-primary border border-primary px-2 rounded"
                                        : ""
                                }`}
                            >
                                Queue {queuedPlayers.length ? `(${queuedPlayers.length})` : ""}
                            </div>
                            <div
                                onClick={() => dispatch(setViewState(ViewState.BOARD))}
                                className={`${
                                    viewState === ViewState.BOARD
                                        ? "text-primary border border-primary px-2 rounded"
                                        : ""
                                }`}
                            >
                                Board
                            </div>
                            <div
                                onClick={() => dispatch(setViewState(ViewState.ROSTER))}
                                className={`${
                                    viewState === ViewState.ROSTER
                                        ? "text-primary border border-primary px-2 rounded"
                                        : ""
                                }`}
                            >
                                Roster
                            </div>
                        </nav>
                    </div>
                    {viewState === ViewState.DRAFT && (
                        <DraftComponent availablePlayers={availablePlayers} setAvailablePlayers={setAvailablePlayers} />
                    )}
                    {viewState === ViewState.QUEUE && (
                        <QueueComponent availablePlayers={availablePlayers} setAvailablePlayers={setAvailablePlayers} />
                    )}
                    {viewState === ViewState.BOARD && <BoardComponent />}
                    {viewState === ViewState.ROSTER && <RosterComponent />}
                </>
            ) : (
                <CompletedComponent />
            )}
        </main>
    )
}

export default MainComponent
