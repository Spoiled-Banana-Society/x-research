import { IoMdExit } from "react-icons/io"
import { activeLeagueDataProps } from "@/utils/types/types"
import { setLeagueId, setLeagueLevel, setLeagueName, setTokenId } from "@/redux/leagueSlice"
import { useAppDispatch, useAppSelector } from "@/redux/hooks/reduxHooks"
import { useRouter } from "next/navigation"
import { Leagues } from "@/utils/api"

const HIDDEN_DRAFTS = "2024-fast-draft-130"

export const DraftActiveLeagues = ({
                                       leagues,
                                       setLeavingLeague,
                                       setShowLeaveModal
                                   }: {
                                    leagues: any,
                                    setLeavingLeague: any,
                                    setShowLeaveModal: any
                                   }) => {
    const dispatch = useAppDispatch()
    const router = useRouter()
    const walletAddress = useAppSelector((state) => state.auth.walletAddress)

    const enterDraftRoom = (league: activeLeagueDataProps) => {
        Leagues.getLeague(walletAddress!, league._leagueId).then((res) => {
            dispatch(setLeagueId(res.card._leagueId))
            dispatch(setTokenId(res.card._cardId))
            dispatch(setLeagueName(res.card._leagueDisplayName))
            dispatch(setLeagueLevel(res.card._level))
            router.push(`/authenticated/draft/${league._leagueId}`)
        }) 
    }

    return (
        <>
            {
                leagues?.map((league: activeLeagueDataProps) => {
                    if (HIDDEN_DRAFTS.indexOf(league._leagueId) >= 0) {
                        return ''
                    }

                    return (
                        <tr key={league._leagueId}>
                            <td className="whitespace-nowrap w-[500px] py-4 pl-4 pr-3 text-sm dark:text-white text-black sm:pl-0 font-primary font-bold">
                                {league._leagueDisplayName}
                            </td>
                            <td className="whitespace-nowrap px-3 py-4 text-sm dark:text-white text-black">
                                {league.numPlayers}/10
                            </td>
                            <td className="whitespace-nowrap w-[150px] pl-3 text-right py-4 text-sm text-white">
                                <button
                                    onClick={() =>
                                        league.numPlayers ===
                                        10 &&
                                        enterDraftRoom(league)
                                    }
                                    disabled={
                                        league.numPlayers !== 10
                                    }
                                    className="disabled:bg-gray-400 disabled:hover:scale-100 disabled:cursor-not-allowed py-1 px-4 bg-primary font-primary font-black uppercase italic text-black rounded-full hover:bg-primary-light hover:scale-105 transition-all"
                                >
                                    {league.numPlayers !== 10
                                        ? "Filling..."
                                        : "Join"}
                                </button>
                                {league.numPlayers !== 10 && (
                                    <button
                                        onClick={() => {
                                            setLeavingLeague(
                                                league,
                                            )
                                            setShowLeaveModal(
                                                true,
                                            )
                                        }}
                                    >
                                        <IoMdExit
                                            className="text-[20px] relative top-1 ml-2 transition-all hover:scale-110 text-gray-400 hover:text-white" />
                                    </button>
                                )}
                            </td>
                        </tr>
                    )
                })
            }
        </>
    )
}