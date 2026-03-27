import React, { useEffect } from "react"
import { useAppDispatch, useAppSelector } from "@/redux/hooks/reduxHooks"
import { ViewState } from "@/utils/types/types"
import LeaderBoardComponent from "./LeaderBoardComponent"
import { Draft } from "@/utils/api"
import { setManageDraftRosters, setManageDraftSummary, setManageLeagueId, setManageView } from "@/redux/manageSlice"
import ManageRosterComponent from "./ManageRosterComponent"
import ManageBoardComponent from "./ManageBoardComponent"
import Link from "next/link"

type ManageProps = {
    leagueId: string
}

const ManageComponent: React.FC<ManageProps> = (props) => {
    const manageState = useAppSelector((state) => state.manage.manageState)
    const dispatch = useAppDispatch()
    const { leagueId } = props

    useEffect(() => {
        if (leagueId) {
            dispatch(setManageLeagueId(leagueId))
            Draft.getDraftSummary(leagueId).then((res) => {
                dispatch(setManageDraftSummary(res.summary))
            })
            Draft.getDraftRosters(leagueId).then((res) => {
                dispatch(setManageDraftRosters(res))
            })
        }
    }, [leagueId])

    const leageLevel = useAppSelector((state) => state.league.leagueLevel)

    return (
        <main>
            <div>
                {leageLevel === "Hall of Fame" && (
                    <div>
                        <img
                            src="/hof.png"
                            alt="Hall of Fame - Banana Best Ball"
                            className="w-[100px] h-auto mx-auto py-3"
                        />
                        <p className="text-center font-primary font-bold text-primary">This is a Hall of Fame League</p>
                    </div>
                )}
                {leageLevel === "Jackpot" && (
                    <div>
                        <img
                            src="/jackpot.png"
                            alt="Jackpot - Banana Best Ball"
                            className="w-[200px] h-auto mx-auto py-3"
                        />
                        <p className="text-center font-primary font-bold text-primary">This is a Jackpot League</p>
                    </div>
                )}
                <Link
                    className="text-center w-[200px] mx-auto flex items-center justify-center mt-3 rounded-full px-3 py-1 cursor-pointer bg-primary text-black font-primary font-bold italic uppercase text-[14px]"
                    href="/authenticated/leagues"
                >
                    Return to Lobby
                </Link>
            </div>
            <div className="mx-auto flex items-center justify-center mt-10">
                <nav className="flex items-center justify-center gap-4 md:gap-10 font-primary uppercase cursor-pointer font-bold">
                    <div
                        onClick={() => dispatch(setManageView(ViewState.ROSTER))}
                        className={`${
                            manageState === ViewState.ROSTER ? "text-primary border border-primary px-2 rounded" : ""
                        }`}
                    >
                        Roster
                    </div>
                    {leagueId.indexOf("round") > -1 ? (
                        ""
                    ) : (
                        // <div
                        //     onClick={() => dispatch(setManageView(ViewState.BOARD))}
                        //     className={`${
                        //         manageState === ViewState.BOARD ? "text-primary border border-primary px-2 rounded" : ""
                        //     }`}
                        // >
                        //     Board
                        // </div>
                        ""
                    )}
                    <div
                        onClick={() => dispatch(setManageView(ViewState.LEADERBOARD))}
                        className={`${
                            manageState === ViewState.LEADERBOARD
                                ? "text-primary border border-primary px-2 rounded"
                                : ""
                        }`}
                    >
                        Leaderboard
                    </div>
                </nav>
            </div>
            {manageState === ViewState.ROSTER && <ManageRosterComponent leagueId={leagueId} />}
            {manageState === ViewState.BOARD && <ManageBoardComponent />}
            {manageState === ViewState.LEADERBOARD && <LeaderBoardComponent />}
        </main>
    )
}

export default ManageComponent
