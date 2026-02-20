import { MAINNET_ADDRESS } from "@/constants/contracts"
import { useAppSelector } from "@/redux/hooks/reduxHooks"
import { Leagues } from "@/utils/api"
import { truncate, truncateDisplayName } from "@/utils/helpers"
import { LeaderboardItemProps, LeaderboardProps, activeLeagueDataProps } from "@/utils/types/types"
import { AnimatePresence, motion } from "framer-motion"
import Link from "next/link"
import React, { useEffect, useState } from "react"
import { AiFillCloseCircle } from "react-icons/ai"
import styled from "styled-components"
import { useRouter } from "next/navigation"

type Props = {
    homepage?: boolean
}

const StyledModal = styled(motion.div)`
    .modal {
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        box-shadow: 3px 3px 3px rgba(0, 0, 0, 0.5);
        background-color: rgba(23, 23, 23, 0.97);
        overflow-y: auto;
        padding: 2rem;
        border-radius: 1rem;
        min-width: 600px;
        max-height: 90%;
        z-index: 20;
        .close {
            position: absolute;
            top: 10px;
            right: 10px;
            font-size: 27px;
            z-index: 30;
            transform: scale(1);
            transition: all 0.1s ease-in-out;
            &:hover {
                cursor: pointer;
                transform: scale(1.2);
            }
        }
        @media screen and (max-width: 620px) {
            min-width: 90%;
        }
    }
`

const LinkButton = styled.a`
    font-family: "Montserrat", sans-serif;
    font-weight: 700;
    font-style: italic;
    text-transform: uppercase;
    font-size: 1.6rem;
    text-decoration: none;
    background: #eee;
    color: #111;
    padding: 1rem 3.5rem;
    border-radius: 3rem;
    transition: all 0.25s ease-in-out;
    border: 0.1rem solid #eee;
    box-shadow: 0rem 0.7rem 0rem #555;
    position: relative;
    display: inline-block;
    cursor: pointer;
    bottom: 0rem;
    span {
        font-size: 2.6rem;
        color: #111;
    }
    &.medium {
        font-size: 2.2rem;
        padding: 1rem 3rem;
    }
    &:hover {
        color: #111;
        background: #f1c752;
        border: 0.1rem solid #f1c752;
        bottom: 0.5rem;
        box-shadow: 0rem 1rem 0rem #8d7020;
    }
    svg {
        position: relative;
        bottom: 0.3rem;
    }
    @media screen and (max-width: 400px) {
        padding: 0.5rem 1.5rem;
        font-size: 2rem;
    }
`

const YellowLinkButton = styled(LinkButton)`
    font-size: 2.8rem;
    background: #f1c752;
    border-color: #f1c752;
    box-shadow: 0rem 0.7rem 0rem #8d7020;

    span {
        font-size: 3.5rem;
    }

    &:hover {
        box-shadow: 0rem 1rem 0rem #8d7020;
    }
        
`

enum ORDERBY {
    SCOREWEEK = "ScoreWeek",
    SCORESEASON = "ScoreSeason",
}

enum VIEW {
    ALL,
    LEAGUE,
}

enum LEVEL {
    PRO = "Pro",
    HOF = "HOF",
    JACKPOT = "Jackpot"
}

const formatUSDVal = (v : number) => {
    return v.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

const LeaderBoardComponent: React.FC<Props> = (props) => {
    const { homepage } = props
    const walletAddress = useAppSelector((state) => state.auth.walletAddress)
    const gameWeeks = useAppSelector((state) => state.auth.gameWeek)
    const [leaderboard, setLeaderboard] = useState<LeaderboardProps>()
    const [selection, setSelection] = useState<LeaderboardItemProps | null>(null)
    const leagueId = useAppSelector((state) => state.league.leagueId)
    const [leagues, setLeagues] = useState<activeLeagueDataProps[]>()
    const [orderBy, setOrderBy] = useState<ORDERBY>(homepage ? ORDERBY.SCOREWEEK : ORDERBY.SCOREWEEK)
    const [showAll, setShowAll] = useState(false)
    const [view, setView] = useState<VIEW>(VIEW.LEAGUE)
    const [week, setWeek] = useState<string>(gameWeeks[0].gameWeek)
    const [level, setLevel] = useState<LEVEL>(homepage ? LEVEL.PRO : LEVEL.PRO)
    const router = useRouter()

    const [ethPrice, setEthPrice] = useState<number>()

    useEffect(() => {
        const getPrice = async () => {
            const price = await fetch("https://cryptoprices.cc/ETH").then(r => r.text())
            
            if (Number(price)) {
                setEthPrice(Number(price))
            }
        }

        getPrice()
    }, [])

    const fetchAll = async (walletAddress: string, gameWeek: string, orderBy: string, level: string) => {
        const response = await Leagues.allLeaderboard(walletAddress, gameWeek, orderBy, level)
        setView(VIEW.ALL)
        setLeaderboard(response)
    }

    const fetchLeague = async (walletAddress: string, draftId: string, orderBy: string, level: string) => {
        const response = await Leagues.leagueLeaderboard(walletAddress, draftId, orderBy, level)
        setView(VIEW.LEAGUE)
        setLeaderboard(response)
    }

    const fetchLeagueInfo = async (walletAddress: string) => {
        const response = await Leagues.getLeagues(walletAddress)
        setLeagues(response.active)
    }

    const fetchHofLeaderboard = async (walletAddress: string, orderBy: string, gameWeek: string) => {
        const response = await Leagues.allLeaderboard(walletAddress, gameWeek, orderBy, LEVEL.HOF)
        setView(VIEW.ALL)
        setLeaderboard(response)
        // const response = await Leagues.hofLeaderboard(walletAddress, ORDERBY.SCORESEASON, gameWeek)
        // setView(VIEW.LEAGUE)
        // setLeaderboard(response)
    }

    useEffect(() => {
        // fetching the defaults for the leaderboard
        // homepage ? fetchAll(walletAddress!, week, orderBy, 'Pro') : fetchLeague(walletAddress!, leagueId!, orderBy, week)
        // PLAYOFFS
        // homepage ? fetchAll(walletAddress!, week, orderBy, "Hall of Fame") : fetchLeague(walletAddress!, leagueId!, orderBy, week)
        // FINALS
        homepage ? fetchLeague(walletAddress!, (leagueId ? leagueId : '2025-playoffs-finals'), orderBy, week) : fetchLeague(walletAddress!, leagueId!, orderBy, week)
        
        fetchLeagueInfo(walletAddress!)
    }, [])

    const Modal = () => {
        return (
            <StyledModal initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div className="modal">
                    <AiFillCloseCircle className="close" onClick={() => setSelection(null)} />
                    <img
                        src={selection?.pfp.imageUrl ? selection?.pfp.imageUrl : "/banana-profile.png"}
                        alt={selection?.pfp.displayName}
                        className="w-[100px] h-[100px] border border-gray-600 rounded-full"
                    />
                    <h2 className="text-[32px] font-bold italic">{selection?._cardId}</h2>
                    {selection?.pfp.displayName !== "" && <p className="font-bold">{selection?.pfp.displayName}</p>}
                    <p className="text-xs font-bold">{selection?.ownerId!}</p>
                    <Link
                        href={`https://opensea.io/assets/ethereum/${MAINNET_ADDRESS}/${selection?._cardId}`}
                        className="underline text-xs gap-3 uppercase w-[175px]"
                        target="_blank"
                    >
                        View on OpenSea
                    </Link>
                    <section className="grid grid-cols-2 border-b pt-5 pb-2 border-gray-700 gap-3">
                        <div className="flex-1">
                            <div className="flex items-center justify- text-xs gap-3 uppercase">
                                <div className="grow text-gray-400">Score Week</div>
                                <div className="text-right">{selection?.scoreWeek.toFixed(2)}</div>
                            </div>
                            <div className="flex items-center justify- text-xs gap-3 uppercase">
                                <div className="grow text-gray-400">Score Season</div>
                                <div className="text-right">{selection?.scoreSeason.toFixed(2)}</div>
                            </div>
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center justify- text-xs gap-3 uppercase">
                                <div className="grow text-gray-400">Card Level</div>
                                <div className="text-right">{selection?.level}</div>
                            </div>
                            <div className="flex items-center justify- text-xs gap-3 uppercase">
                                <div className="grow text-gray-400">Owner</div>
                                <div className="text-right">{truncate(selection?.ownerId!)}</div>
                            </div>
                        </div>
                    </section>
                    <section className="block md:flex items-center justify-center pt-3 gap-3">
                        <div className="flex-1 flex items-center justify-center">
                            <img
                                src={selection?.card._imageUrl}
                                alt={`Card ${selection?._cardId}`}
                                className="w-[275px] h-auto"
                            />
                        </div>
                        {selection && (
                            <div className="grid grid-cols-2 mt-3 md:mt-0 md:block md:w-[150px]">
                                <section className="py-2 border-b border-gray-600">
                                    <h3 className="font-bold italic">QB</h3>
                                    {selection.roster.QB.map((player) => {
                                        return (
                                            <div
                                                key={player.playerId}
                                                className="flex items-center justify-start text-xs"
                                            >
                                                <div className="w-[90px]">{player.playerId}</div>
                                                <div className="flex-1">
                                                    <span
                                                        className={
                                                            player.isUsedInCardScore
                                                                ? "text-green-400 font-bold"
                                                                : "text-white"
                                                        }
                                                    >
                                                        {player.scoreWeek}
                                                    </span>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </section>
                                <section className="py-2 border-b border-gray-600">
                                    <h3 className="font-bold italic">RB</h3>
                                    {selection.roster.RB.map((player) => {
                                        return (
                                            <div
                                                key={player.playerId}
                                                className="flex items-center justify-start text-xs"
                                            >
                                                <div className="w-[90px]">{player.playerId}</div>
                                                <div className="flex-1">
                                                    <span
                                                        className={
                                                            player.isUsedInCardScore
                                                                ? "text-green-400 font-bold"
                                                                : "text-white"
                                                        }
                                                    >
                                                        {player.scoreWeek}
                                                    </span>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </section>
                                <section className="py-2 border-b border-gray-600">
                                    <h3 className="font-bold italic">WR</h3>
                                    {selection.roster.WR.map((player) => {
                                        return (
                                            <div
                                                key={player.playerId}
                                                className="flex items-center justify-start text-xs"
                                            >
                                                <div className="w-[90px]">{player.playerId}</div>
                                                <div className="flex-1">
                                                    <span
                                                        className={
                                                            player.isUsedInCardScore
                                                                ? "text-green-400 font-bold"
                                                                : "text-white"
                                                        }
                                                    >
                                                        {player.scoreWeek}
                                                    </span>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </section>
                                <section className="py-2 border-b border-gray-600">
                                    <h3 className="font-bold italic">TE</h3>
                                    {selection.roster.TE.map((player) => {
                                        return (
                                            <div
                                                key={player.playerId}
                                                className="flex items-center justify-start text-xs"
                                            >
                                                <div className="w-[90px]">{player.playerId}</div>
                                                <div className="flex-1">
                                                    <span
                                                        className={
                                                            player.isUsedInCardScore
                                                                ? "text-green-400 font-bold"
                                                                : "text-white"
                                                        }
                                                    >
                                                        {player.scoreWeek}
                                                    </span>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </section>
                                <section className="py-2 border-b border-gray-600">
                                    <h3 className="font-bold italic">DST</h3>
                                    {selection.roster.DST.map((player) => {
                                        return (
                                            <div
                                                key={player.playerId}
                                                className="flex items-center justify-start text-xs"
                                            >
                                                <div className="w-[90px]">{player.playerId}</div>
                                                <div className="flex-1">
                                                    <span
                                                        className={
                                                            player.isUsedInCardScore
                                                                ? "text-green-400 font-bold"
                                                                : "text-white"
                                                        }
                                                    >
                                                        {player.scoreWeek}
                                                    </span>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </section>
                            </div>
                        )}
                    </section>
                </div>
            </StyledModal>
        )
    }

    const selector = (value: string) => {
        switch (value) {
            case "Pro":
                console.log("fetch pro")
                setLevel(LEVEL.PRO)
                fetchAll(walletAddress!, week, orderBy, "Pro")
                break
            case "HOF":
                console.log("fetch HOF")
                setLevel(LEVEL.HOF)
                setOrderBy(ORDERBY.SCORESEASON)
                fetchAll(walletAddress!, week, ORDERBY.SCORESEASON, "Hall of Fame")
                break
            case "Jackpot":
                setLevel(LEVEL.JACKPOT)
                fetchAll(walletAddress!, week, orderBy, "Jackpot")
                break
            case "N/A":
                break
            default:
                console.log("fetching default")
                setOrderBy(ORDERBY.SCOREWEEK)
                fetchLeague(walletAddress!, value, orderBy, week)
                break
        }
    }

    const orderBySelector = (orderBy: string) => {
        if (orderBy === "N/A") return
        switch (orderBy) {
            case "ScoreWeek":
                setOrderBy(ORDERBY.SCOREWEEK)
                break
            case "ScoreSeason":
                setOrderBy(ORDERBY.SCORESEASON)
                break
        }
        if (view === VIEW.ALL) {
            fetchAll(walletAddress!, week, orderBy, level)
        } else {
            if (level == LEVEL.HOF) {
                fetchHofLeaderboard(walletAddress!, orderBy, week)
            } else {
                fetchLeague(walletAddress!, (leagueId ? leagueId : '2024-live-draft-finals'), orderBy, week)
            }
        }
    }

    const weekSelector = (week: string) => {
        setWeek(week)
        if (view === VIEW.ALL) {
            fetchAll(walletAddress!, week, orderBy, level)
        } else {
            if (level == LEVEL.HOF) {
                fetchHofLeaderboard(walletAddress!, orderBy, week)
            } else {
                fetchLeague(walletAddress!, (leagueId ? leagueId : '2024-live-draft-finals'), orderBy, week)
            }
        }
    }

    // return (
    //     <>
    //         <AnimatePresence>{selection && <Modal />}</AnimatePresence>
    //         <div className="pt-16 text-center px-3 font-primary">
    //             <div>
    //                 <h1 className="text-[40px] font-bold font-primary italic uppercase">Banana Best Ball III</h1>
    //                 <p className="font-primary font-bold text-lg lg:text-lg uppercase pb-12">
    //                         Live Now
    //                 </p>
    //                 <h4 className="font-primary font-bold text-md lg:text-lg pb-12">
    //                     32.5 ETH {ethPrice ? `($${formatUSDVal(ethPrice * 32.5)})` : ''} Guaranteed Prize Pool <br />
    //                     8 ETH {ethPrice ? `($${formatUSDVal(ethPrice * 8)})` : ''} Guaranteed 1st Place
    //                 </h4>
    //             </div>
    //             <YellowLinkButton onClick={() => {router.push("/authenticated/leagues")}}>Draft</YellowLinkButton>
    //             <img src="/screen.png"></img>
    //         </div>
    //     </>
    // )
    
    return (
        <>
            <AnimatePresence>{selection && <Modal />}</AnimatePresence>
            <div className="pt-16 text-center px-3 font-primary">
                <div>
                    <h1 className="text-[32px] font-bold font-primary italic uppercase">Leaderboard</h1>
                    {leagues && (
                        <div className="block sm:flex items-center justify-center gap-3">
                            <div className="pb-3 sm:pb-0">
                                <select className="text-black" onChange={(e) => selector(e.target.value)} defaultValue={leagueId || level}>
                                    <option value="N/A">Choose a league</option>
                                    <option value="Pro">Top Scores</option>
                                    <option value="HOF">Top Hall of Fame</option>
                                    {leagues.map((league, i) => {
                                        return (
                                            <option key={`${league._leagueId}-${i}`} value={league._leagueId}>
                                                {league._leagueDisplayName}
                                            </option>
                                        )
                                    })}
                                </select>
                            </div>
                            <div className="pb-3 sm:pb-0">
                                <select className="text-black" onChange={(e) => orderBySelector(e.target.value)}>
                                    <option value="N/A">Sort By</option>
                                    <option value="ScoreWeek">Week</option>
                                    <option value="ScoreSeason">Season</option>
                                </select>
                            </div>
                            <div className="pb-3 sm:pb-0">
                                <select className="text-black" onChange={(e) => weekSelector(e.target.value)}>
                                    {gameWeeks.map((week) => {
                                        return (
                                            <option key={week.title} value={week.gameWeek}>
                                                {week.title}
                                            </option>
                                        )
                                    })}
                                </select>
                            </div>
                        </div>
                    )}
                    <section className="max-w-[600px] mx-auto overflow-x-scroll">
                        <div className="w-[600px] mx-auto">
                            <section className="flex text-left items-center justify-center gap-2 border-b border-gray-600 pb-2 my-5">
                                <div className="w-[270px] sm:grow px-3">Player</div>
                                <div className="w-[100px]">Card</div>
                                <div className="w-[120px]">
                                    {orderBy === ORDERBY.SCOREWEEK ? "Weekly Score" : "Season Score"}
                                </div>
                            </section>
                        </div>
                        {leaderboard && leaderboard.leaderboard && leaderboard.leaderboard.length > 0 ? (
                            <div className="w-[600px] mx-auto">
                                {leaderboard &&
                                    leaderboard.leaderboard.slice(0, 30).map((player, index) => {
                                        return (
                                            <section
                                                className="text-left flex items-center justify-center gap-2 hover:bg-[#111] transition-all"
                                                key={`${player._cardId}-${index}`}
                                                onClick={() => setSelection(player)}
                                            >
                                                <div className="w-[270px] sm:grow flex items-center justify-start px-3 py-2">
                                                    <div className="mr-2 text-xs w-[50px]">{index + 1}</div>
                                                    <div className="mr-2">
                                                        <img
                                                            src={
                                                                player.pfp.imageUrl !== ""
                                                                    ? player.pfp.imageUrl
                                                                    : "/banana-profile.webp"
                                                            }
                                                            alt={player.pfp.displayName}
                                                            className="w-[25px] h-[25px] group rounded-full border border-gray-700 object-fit mx-auto transition-all opacity-80 hover:opacity-100 hover:brightness-125 hover:scale-105 cursor-pointer"
                                                        />
                                                    </div>
                                                    <div>
                                                        {player.pfp.displayName !== ""
                                                            ? truncateDisplayName(player.pfp.displayName)
                                                            : truncate(player.ownerId)}
                                                    </div>
                                                    <div>
                                                        {
                                                            player.card.prizes.ETH > 0 &&
                                                            <img src="/eth.png" alt="Prizes" className="inline-block w-[11px] ml-2 h-auto" />
                                                        }
                                                    </div>
                                                </div>
                                                <div
                                                    className={`underline cursor-pointer w-[100px] ${
                                                        player.level === "Hall of Fame" && "text-yellow-300"
                                                    }${
                                                        player.level === "Jackpot" && "text-red-300"
                                                    }`}
                                                >
                                                    {player._cardId}
                                                </div>
                                                <div className="w-[120px]">
                                                    <p>
                                                        {orderBy === ORDERBY.SCOREWEEK
                                                            ? player.scoreWeek.toFixed(2)
                                                            : player.scoreSeason.toFixed(2)}
                                                    </p>
                                                </div>
                                            </section>
                                        )
                                    })}
                                {showAll &&
                                    leaderboard &&
                                    leaderboard.leaderboard
                                        .slice(30, leaderboard.leaderboard.length)
                                        .map((player, index) => {
                                            return (
                                                <section
                                                    className="text-left flex items-center justify-center gap-2 hover:bg-[#111] transition-all"
                                                    key={`${player._cardId}-${index}`}
                                                >
                                                    <div className="w-[270px] sm:grow flex items-center justify-start px-3 py-2">
                                                        <div className="mr-2 text-xs w-[50px]">{index + 31}</div>
                                                        <div className="mr-2">
                                                            <img
                                                                src={
                                                                    player.pfp.imageUrl !== ""
                                                                        ? player.pfp.imageUrl
                                                                        : "/banana-profile.webp"
                                                                }
                                                                alt={player.pfp.displayName}
                                                                onClick={() => setSelection(player)}
                                                                className="w-[25px] h-[25px] group rounded-full border border-gray-700 object-fit mx-auto transition-all opacity-80 hover:opacity-100 hover:brightness-125 hover:scale-105 cursor-pointer"
                                                            />
                                                        </div>
                                                        <div>
                                                            {player.pfp.displayName !== ""
                                                                ? truncateDisplayName(player.pfp.displayName)
                                                                : truncate(player.ownerId)}
                                                        </div>
                                                    </div>
                                                    <div
                                                        className={
                                                            `underline cursor-pointer w-[100px] ${
                                                                player.level === "Hall of Fame" && "text-yellow-300"
                                                            }
                                                            ${
                                                                player.level === "Jackpot" && "text-red-300"
                                                            }
                                                            `
                                                        }
                                                        onClick={() => setSelection(player)}
                                                    >
                                                        {player._cardId}
                                                    </div>
                                                    <div className="w-[120px]">
                                                        <p>
                                                            {orderBy === ORDERBY.SCOREWEEK
                                                                ? player.scoreWeek.toFixed(2)
                                                                : player.scoreSeason.toFixed(2)}
                                                        </p>
                                                    </div>
                                                </section>
                                            )
                                        })}
                                {leaderboard && leaderboard.leaderboard.length > 30 && !showAll && (
                                    <div
                                        onClick={() => setShowAll(true)}
                                        className="w-full border border-gray-600 p-2 my-3 hover:border-gray-300 transition-all cursor-pointer"
                                    >
                                        Show me the entire leaderboard
                                    </div>
                                )}
                            </div>
                        ) : (
                            <p>
                                Loading Leaderboard. Can take up to 10 seconds. If nothing appears that means there is no scores for the current selection.
                            </p>
                        )}
                    </section>
                </div>
            </div>
        </>
    )
}

export default LeaderBoardComponent
