import { BsTrophyFill } from "react-icons/bs"
import { PiTrophyFill } from "react-icons/pi"
import { activeLeagueDataProps } from "@/utils/types/types"
import { setLeagueId, setLeagueLevel, setLeagueName, setTokenId } from "@/redux/leagueSlice"
import { useAppDispatch } from "@/redux/hooks/reduxHooks"
import { useRouter } from "next/navigation"

const getLeagueDisplayName = (league: activeLeagueDataProps) => {
    switch(league._level) {
        case 'Pro':
            if (league._cardId == "2650") {
                console.log(league.prizes.ETH)
                console.log(league.prizes)
            }
            return (
                <div>
                    <span className="inline-block">{league._leagueDisplayName}</span>
                    {
                        league.prizes.ETH > 0 ? (
                            <img src="/eth.png" alt="Prizes" className="inline-block w-[11px] ml-2 h-auto" />
                        ) : ''
                    }
                </div>
            )
        case 'Hall of Fame':
            return (
                <div>
                    <span className="inline-block">{league._leagueDisplayName}</span>
                    <img src="/hof.png" alt="Hall of Fame" className="inline-block w-[30px] ml-2 h-auto" />
                    {
                        league.prizes.ETH > 0 ? (
                            <img src="/eth.png" alt="Prizes" className="inline-block w-[11px] ml-2 h-auto" />
                        ) : ''
                    }   
                </div>
            )
        case 'Jackpot':
            return (
                <div>
                    <span className="inline-block">{league._leagueDisplayName}</span>
                    <img src="/jackpot.png" alt="Jackpot" className="inline-block w-[35px] ml-2 h-auto" />
                    {
                        league.prizes.ETH > 0 ? (
                            <img src="/eth.png" alt="Prizes" className="inline-block w-[11px] ml-2 h-auto" />
                        ) : ''
                    }
                </div>
            )
        default:
            return (
                <div>
                    <span className="inline-block">{league._leagueDisplayName}</span>
                    {
                            league.prizes.ETH > 0 ? (
                                <img src="/eth.png" alt="Prizes" className="inline-block w-[11px] ml-2 h-auto" />
                            ) : ''
                        }
                </div>
            )
    }
}

export const DraftFinishedLeagues = ({ draftFinishedLeagues }: {draftFinishedLeagues: any}) => {
    const dispatch = useAppDispatch()
    const router = useRouter()

    const enterManageRoom = (league: activeLeagueDataProps) => {
        dispatch(setLeagueId(league._leagueId))
        dispatch(setTokenId(league._cardId))
        dispatch(setLeagueLevel(league._level))
        dispatch(setLeagueName(league._leagueDisplayName))
        router.push(`/authenticated/manage/${league._leagueId}`)
    }


    return(
     <>
         {draftFinishedLeagues?.map((league: activeLeagueDataProps, index: Number) => {
             return (
                 <tr key={`${league._leagueId}-${index}`}>
                     <td
                         onClick={() =>
                             enterManageRoom(league)
                         }
                         className="cursor-pointer py-4 pl-4 pr-3 w-[200px] text-sm dark:text-white text-black sm:pl-0 font-primary font-bold"
                     >
                         <p className="hover:text-primary">
                             {getLeagueDisplayName(league)}
                         </p>
                     </td>
                     <td
                         onClick={() =>
                             enterManageRoom(league)
                         }
                         className="cursor-pointer py-4 pl-4 pr-3 w-[200px] text-sm dark:text-white text-black sm:pl-0 font-primary font-bold"
                     >
                         <div
                             className={`hover:text-primary flex items-center justify-start ${
                                 league._leagueRank ===
                                 "1" && "text-primary"
                             } ${
                                 league._leagueRank ===
                                 "2" &&
                                 "text-green-500"
                             }`}
                         >
                             <div>
                                 {league._leagueRank !== ""
                                     ? league._leagueRank
                                     : "TBD"}
                             </div>
                             {league._leagueRank ===
                                 "1" && (
                                     <div>
                                         <BsTrophyFill
                                             className="ml-2 text-[12px]" />
                                     </div>
                                 )}
                             {league._leagueRank ===
                                 "2" && (
                                     <div>
                                         <PiTrophyFill
                                             className="ml-2 text-[12px]" />
                                     </div>
                                 )}
                         </div>
                     </td>
                     <td
                         onClick={() =>
                             enterManageRoom(league)
                         }
                         className="cursor-pointer py-4 pl-4 pr-3 w-[200px] text-sm dark:text-white text-black sm:pl-0 font-primary font-bold"
                     >
                         <div
                             className={`hover:text-primary flex items-center justify-start ${
                                 league._rank === "1" &&
                                 "text-primary"
                             } ${
                                 league._rank === "2" &&
                                 "text-green-500"
                             }`}
                         >
                             <div>
                                 {league._rank !== ""
                                     ? league._rank
                                     : "TBD"}
                             </div>
                             {league._rank === "1" && (
                                 <div>
                                     <BsTrophyFill
                                         className="ml-2 text-[12px]" />
                                 </div>
                             )}
                             {league._rank === "2" && (
                                 <div>
                                     <PiTrophyFill
                                         className="ml-2 text-[12px]" />
                                 </div>
                             )}
                         </div>
                     </td>
                     <td
                         onClick={() =>
                             enterManageRoom(league)
                         }
                         className="cursor-pointer py-4 pl-4 pr-3 w-[200px] text-sm dark:text-white text-black sm:pl-0 font-primary font-bold"
                     >
                         <p className="hover:text-primary">
                             {league._weekScore}
                         </p>
                     </td>
                     <td
                         onClick={() =>
                             enterManageRoom(league)
                         }
                         className="cursor-pointer py-4 pl-4 pr-3 w-[200px] text-sm dark:text-white text-black sm:pl-0 font-primary font-bold"
                     >
                         <p className="hover:text-primary">
                             {league._seasonScore}
                         </p>
                     </td>
                 </tr>
             )
         })}
     </>
    )
}