"use client"
import { useEffect, useState } from "react"
import { useAppDispatch, useAppSelector } from "@/redux/hooks/reduxHooks"
import { ref, onValue } from "firebase/database"
import { IoRefreshCircleOutline, IoListCircleOutline } from "react-icons/io5"
import { AnimatePresence, motion } from "framer-motion"
import { LuBanana } from "react-icons/lu"
import {
    LivePlayersProps,
    LeagueDataProps,
    activeLeagueDataProps,
    RankingsProps,
    UpdatedRankings,
    OwnerProps,
    NFTProps
} from "@/utils/types/types"
import ReactLoading from "react-loading"
import { Leagues, Rankings, Owner, Settings } from "@/utils/api"
import { db } from "@/utils/db"
import Link from "next/link"
import { setTokensAvailable } from "@/redux/authSlice"
import { useRouter } from "next/navigation"
import { JoinAndMintSection } from "@/app/components/leagues/JoinAndMintSection"
import { LeagueSwitches } from "@/app/components/leagues/LeagueSwitches"
import { truncate, truncateDisplayName } from "@/utils/helpers"
import { BBBModal } from "@/app/components/leagues/BBBModal"
import { Notice } from "@/app/components/Notice"
import { DragAndDropRankings } from "@/app/components/leagues/DragAndDropRankings"
import { DraftFinishedLeagues } from "@/app/components/leagues/DraftFinishedLeagues"
import { DraftActiveLeagues } from "@/app/components/leagues/DraftActiveLeagues"
import { LeaveModal } from "@/app/components/leagues/LeaveModal"
import { LeagueTable } from "@/app/components/leagues/LeagueTable"
import { useActiveAccount } from "thirdweb/react";
import styled from "styled-components"
import { Carousel } from "flowbite-react";

const genericTimer = 3000

const StyledNameModal = styled(motion.div)`
    width: 100%;
    height: auto;
    position: relative;
    z-index: 30;
    .modal {
        left: 50%;
        position: absolute;
        transform: translate(-50%, 15%);
        background: #222;
        padding: 25px 10px;
        width: 600px;
        overflow: scroll;
        box-shadow: 5px 5px 5px rgba(0, 0, 0, 0.5);
        @media screen and (max-width: 620px) {
            width: 100%;
            min-width: 400px;
        }
    }
`

const StyledWelcomeModal = styled(motion.div)`
    width: 100%;
    height: auto;
    position: relative;
    z-index: 30;
    .modal {
        left: 50%;
        position: absolute;
        transform: translate(-50%, 15%);
        background: #222;
        padding: 25px 10px;
        width: 600px;
        box-shadow: 5px 5px 5px rgba(0, 0, 0, 0.5);
        @media screen and (max-width: 620px) {
            width: 100%;
            min-width: 400px;
        }
    }
`

type ModalProps = {
    fetchOwnerInfo: () => void
    changeName: boolean
    setChangeName: React.Dispatch<React.SetStateAction<boolean>>
}

type WelcomeModelProps = {}

const welcomePopupKey = "2025-welcome-popup"

const LeaguesComponent = () => {
    const [viewManageLeagues, setViewManageLeagues] = useState<boolean>(true)
    const [recentlyRefreshed, setRecentlyRefreshed] = useState<boolean>(false)
    const [numOfPlayers, setNumOfPlayers] = useState<LivePlayersProps[]>()
    const [leagueData, setLeagueData] = useState<LeagueDataProps>()
    const [mergedData, setMergedData] = useState<activeLeagueDataProps[]>()
    const [leagues, setLeagues] = useState<activeLeagueDataProps[]>()
    const [draftFinishedLeagues, setDraftFinishedLeagues] = useState<activeLeagueDataProps[]>()
    const [showRankings, setShowRankings] = useState<boolean>(false)
    const [rankings, setRankings] = useState<RankingsProps[]>([])
    const tokensAvailable = useAppSelector((state) => state.auth.tokensAvailable)
    const [leavingLeague, setLeavingLeague] = useState<activeLeagueDataProps>()
    const [showLeaveModal, setShowLeaveModal] = useState<boolean>(false)
    const [owner, setOwner] = useState<OwnerProps>()
    const walletAddress = useAppSelector((state) => state.auth.walletAddress)
    const [submitting, setSubmitting] = useState<boolean>(false)
    const [changeName, setChangeName] = useState<boolean>(false)

    const [showWelcomePopup, setShowWelcomePopup] = useState<boolean>(false)

    useEffect(() => {
        const hasSeenPopup = window.localStorage.getItem(welcomePopupKey) || false

        if (!hasSeenPopup) {
            setShowWelcomePopup(true)
        }
    }, [])

    const dispatch = useAppDispatch()
    const router = useRouter()

    // refresh list for leagues
    const refreshLeagues = () => {
        setRecentlyRefreshed(true)

        Leagues.getLeagues(walletAddress!).then((res) => {
            setLeagueData(res)
            dispatch(setTokensAvailable(res.available.length))
        })
        setTimeout(() => {
            setRecentlyRefreshed(false)
        }, genericTimer)
    }

    // the live participants returned by the realtime db in firebase
    const getLivePlayers = () => {
        const numPlayersRef = ref(db, "drafts/")
        onValue(numPlayersRef, (snapshot) => {
            const data = snapshot.val()
            const liveDrafts = Object.keys(data).map((key) => ({
                id: key,
                numPlayers: data[key].numPlayers,
            }))
            setNumOfPlayers(liveDrafts)
        })
    }

    const fetchOwnerInfo = async () => {
        if (walletAddress) {
            const response = await Owner.getOwnerById(walletAddress!)
            setOwner(response)
        }
    }

    useEffect(() => {
        fetchOwnerInfo()
    }, [walletAddress])

    // fetch leagues on page load
    useEffect(() => {
        if (walletAddress) {
            Leagues.getLeagues(walletAddress).then((res) => setLeagueData(res))
            getLivePlayers()
        }
    }, [walletAddress])

    // merge the data from the leagues and the live participants
    useEffect(() => {
        if (leagueData) {
            leagueData.available &&
                leagueData.available.length &&
                dispatch(setTokensAvailable(leagueData!.available.length))
        }
        if (leagueData && numOfPlayers) {
            console.log('here')
            const data =
                leagueData.active &&
                leagueData.active.map((item) => {
                    const found = numOfPlayers.find((draft) => draft.id === item._leagueId)
                    return {
                        ...item,
                        numPlayers: found ? found!.numPlayers : 0
                    }
                })
            setMergedData(data)
        }
        
        if (!walletAddress) {
            setMergedData([])
        }
    }, [leagueData, numOfPlayers])

    // filter the leagues into finished and unfinished
    useEffect(() => {
        if (mergedData) {
            const unFinishedLeagues = mergedData.filter((league) => league.roster.RB === null)
            const finishedLeagues = mergedData.filter((league) => league.roster.RB !== null)
            console.log("unFinishedLeagues: ", unFinishedLeagues)

            setLeagues(unFinishedLeagues)
            const sortedFinishedLeagues = finishedLeagues.sort((a, b) => {
                let aValue = a._leagueRank !== "" ? parseFloat(a._leagueRank) : 0
                // make sure active playoff teams stay at the top of the list
                if (a._leagueId.includes("playoffs-finals")) {
                    aValue -= 100
                }
                // make sure active playoff teams stay at the top of the list
                let bValue = b._leagueRank !== "" ? parseFloat(b._leagueRank) : 0
                if (b._leagueId.includes("playoffs-finals")) {
                    bValue -= 100
                }
                return aValue - bValue
            })
            console.log("sortedFinishedLeagues: ", sortedFinishedLeagues)
            setDraftFinishedLeagues(sortedFinishedLeagues)
        }
    }, [mergedData])

    useEffect(() => {
        if (showRankings) Rankings.getRankings(walletAddress!).then((res) => setRankings(res))
    }, [showRankings])

    const handleDrop = (droppedItem: any) => {
        if (!droppedItem.destination) return
        if (!walletAddress) return
        const updatedList = [...rankings]
        const [reorderedItem] = updatedList.splice(droppedItem.source.index, 1)
        updatedList.splice(droppedItem.destination.index, 0, reorderedItem)
        setRankings(updatedList)
        const payload: UpdatedRankings = {
            ranking: updatedList.map((object) => ({
                playerId: object.playerId,
                rank: object.rank,
                score: object.score,
            })),
        }
        Rankings.updateRankings(walletAddress!, payload)
    }

    const [joiningDraft, setJoiningDraft] = useState<boolean>(false)

    const joinDraft = async (walletAddress: string) => {
        setJoiningDraft(true)
        const response = await Leagues.joinDraft(walletAddress)
        console.log("response: ", response)
        setShowNotice(true)
        setNotice(`Joining a draft...`)
        setTimeout(() => {
            setJoiningDraft(false)
            refreshLeagues()
            setShowNotice(false)
        }, genericTimer)
    }

    const [showNotice, setShowNotice] = useState<boolean>(false)
    const [notice, setNotice] = useState<string>("")

    const leaveDraft = async (walletAddress: string, tokenId: string, draftId: string, leagueName: string) => {
        const response = await Leagues.leaveDraft(walletAddress, tokenId, draftId)
        console.log("response: ", response)
        setShowNotice(true)
        refreshLeagues()
        setNotice(`You have left draft ${leagueName}`)
        setTimeout(() => {
            setShowNotice(false)
        }, genericTimer)
    }

    const WelcomeModal: React.FC<WelcomeModelProps> = (props) => {
        return (
            <StyledWelcomeModal animate={{ y: 0, opacity: 1 }} exit={{ y: -20, opacity: 0 }} className="h-full w-full">
                <div className="modal">
                    <div style={{height: '750px'}}>
                        <Carousel slide={false}>
                            {   
                                [1,2,3,4,5,6,7].map(num => (
                                    <img src={`/welcome-images/${num}.png`} style={{height: '100%', width: 'auto'}} key={`img-${num}`}/>
                                ))
                            }
                        </Carousel>
                    </div>
                    
                    <div>
                        {/* <div>
                            Back
                        </div>
                        <div>
                            <div className="flex items-start justify-center">
                                <img src={`/welcome-images/${tabNum}.png`} style={{width: '100%'}}></img>
                            </div>
                        </div>
                        <div>Next</div> */}
                    </div>
                    <div className="flex items-center justify-center gap-5 py-3">
                        <div
                            onClick={() => {
                                window.localStorage.setItem(welcomePopupKey, JSON.stringify({seen: true}))
                                setShowWelcomePopup(false)
                            }}
                            className="border-gray-400 border cursor-pointer px-2 py-1 bg-[#222] hover:brightness-125"
                        >
                            Close
                        </div>
                    </div>
                </div>
            </StyledWelcomeModal>
        )
    }

    const NameModal: React.FC<ModalProps> = (props) => {
        const { setChangeName, changeName } = props
        const [name, setName] = useState<string>("")

        const submitName = async () => {
            setSubmitting(true)
            const payload = {
                displayName: name,
            }
            try {
                const response = await Owner.setDisplayName(walletAddress!, payload)
                console.log(response)
                setSubmitting(false)
                setChangeName(false)
            } catch (error) {
                console.error(error)
                setSubmitting(false)
            } finally {
                fetchOwnerInfo()
            }
        }

        const [nfts, setNFTs] = useState<NFTProps[]>()
        useEffect(() => {
            if (walletAddress) {
                const fetchNFTs = async () => {
                    try {
                        const response = await Settings.getNFTs(walletAddress)
                        setNFTs(response.nfts)
                    } catch (error) {
                        console.error(error)
                        setTimeout(() => {
                            // Commonly times out so implement a timeout retry function
                            fetchNFTs()
                        }, 2000)
                    }
                }
                fetchNFTs()
            }
        }, [walletAddress])

        const setPFP = async (imageUrl: string, nftContract: string) => {
            const payload = {
                imageUrl,
                nftContract,
            }
            try {
                const response = await Owner.setPFPImage(walletAddress!, payload)
                console.log(response)
                props.fetchOwnerInfo()
                setChangeName(false)
            } catch (error) {
                console.error(error)
            } finally {
                fetchOwnerInfo()
            }
        }

        return (
            <StyledNameModal animate={{ y: 0, opacity: 1 }} exit={{ y: -20, opacity: 0 }} className="h-full w-full">
                <div className="modal">
                    <div className="flex items-start justify-center">
                        <div className="text-center">
                            <h1 className="font-primary font-bold italic">Change your display name or PFP</h1>
                            <p className="text-center text-xs pb-5 w-full sm:w-[400px] mx-auto">
                                Display name cannot be more than 15 characters. If you do not see your available NFTs
                                below, please close and try reopening this window.
                            </p>
                            <div className="flex items-center justify-center mt-3">
                                <input
                                    type="text"
                                    className="bg-[#222] border-b border-gray-600 outline-0"
                                    value={name}
                                    placeholder="Enter name"
                                    onChange={(e) => setName(e.target.value)}
                                />
                                <button
                                    className="px-3 py-1 mx-4 border rounded text-[13px] bg-primary text-black font-bold border-primary cursor-pointer disabled:bg-gray-500 disabled:border-gray-500 disabled:text-gray-400 disabled:cursor-not-allowed"
                                    disabled={name === "" || name.length > 15 || submitting}
                                    onClick={() => submitName()}
                                >
                                    Submit
                                </button>
                            </div>
                            {nfts && (
                                <div className="grid grid-cols-3 md:grid-cols-4 gap-3 py-10">
                                    {nfts.map((nft) => {
                                        return (
                                            <div key={nft.name} onClick={() => setPFP(nft.image_url, nft.contract)}>
                                                <img
                                                    src={nft.image_url}
                                                    alt={nft.name}
                                                    className="w-[35px] h-[35px] group rounded-full border border-gray-700 object-fit mx-auto transition-all hover:brightness-125 opacity-80 hover:opacity-100 cursor-pointer hover:scale-105"
                                                />
                                                <p className="text-white text-[13px] pt-2">
                                                    {nft.name ?? nft.collection}
                                                </p>
                                            </div>
                                        )
                                    })}
                                    <div onClick={() => setPFP("/banana-profile.png", "")}>
                                        <img
                                            src="/banana-profile.png"
                                            alt={walletAddress!}
                                            className="w-[35px] h-[35px] group rounded-full border border-gray-700 object-fit mx-auto transition-all hover:brightness-125 opacity-80 hover:opacity-100 cursor-pointer hover:scale-105"
                                        />
                                        <p className="text-white text-[13px] pt-2">Default</p>
                                    </div>
                                </div>
                            )}
                            <div className="flex items-center justify-center gap-5 py-3">
                                <div
                                    onClick={() => setChangeName(!changeName)}
                                    className="border-gray-400 border cursor-pointer px-2 py-1 bg-[#222] hover:brightness-125"
                                >
                                    Nevermind
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </StyledNameModal>
        )
    }

    return (
        <>
            <AnimatePresence>{showNotice && <Notice notice={notice} />}</AnimatePresence>
            <AnimatePresence>
                {showLeaveModal && (
                    <LeaveModal
                        leaveDraft={leaveDraft}
                        setShowLeaveModal={setShowLeaveModal}
                        leavingLeague={leavingLeague}
                    />
                )}
            </AnimatePresence>
            <AnimatePresence>{<BBBModal />}</AnimatePresence>
            <AnimatePresence>
                {changeName && (
                    <NameModal fetchOwnerInfo={fetchOwnerInfo} setChangeName={setChangeName} changeName={changeName} />
                )}
            </AnimatePresence>
            <AnimatePresence>
                {showWelcomePopup && (
                    <WelcomeModal />
                )}
            </AnimatePresence>
            <main className="flex flex-col" style={{minHeight: '85vh'}}>
                <div className="pt-16 text-center px-3 font-primary" style={{marginBottom: '20px'}}>
                    <div className="grow flex items-center justify-center gap-2">
                        <div className="w-[35px] h-auto">
                            {
                                owner && owner.pfp && owner.pfp.imageUrl !== "" ? "" : (
                                    <img
                                        src={"/edit-pencil.png"}
                                        className=""
                                        onClick={() => setChangeName(!changeName)}
                                        style={{position: 'absolute', height: '12px'}}
                                    />
                                )
                            }
                            <img
                                src={owner && owner.pfp && owner.pfp.imageUrl !== "" ? owner.pfp.imageUrl : "/banana-profile.png"}
                                alt={`${owner && owner.pfp && owner.pfp.displayName || walletAddress}'s PFP`}
                                className="border rounded-full border-gray-700 w-[35px] h-[35px] object-fit"
                                onClick={() => setChangeName(!changeName)}
                            />
                        </div>
                        <p>
                            {owner && owner.pfp && owner.pfp.displayName !== ""
                                ? truncateDisplayName(owner.pfp.displayName)
                                : truncate(walletAddress!)}
                        </p>
                    </div>
                    <div className="text-sm sm:text-5l font-black uppercase text-center font-primary italic py-5" style={{color: 'rgb(241, 199, 82)', marginRight: '20px'}}>
                        <div>Available Draft Passes:&nbsp; {tokensAvailable}</div>
                    </div>
                </div>
                <div className="grow flex items-start justify-center mx-auto">
                    
                    <div>
                        <JoinAndMintSection joiningDraft={joiningDraft} joinDraft={joinDraft} />
                        <nav className="block grid lg:grid-cols-5 sm:grid-cols-1 text-center mx-auto w-[550px] sm:w-[750px] relative">
                            <div className="mb-3 sm:mb-1 pr-1 md:place-self-start">
                                <button
                                    className="rounded border px-3 py-1 flex mx-auto w-[140px] items-center justify-center border-slate-500 hover:border-slate-200 transition-all"
                                >   
                                    <a href="https://sbsfantasy.com/about" target="_blank" rel="noreferrer">
                                        Contest Details
                                    </a>
                                </button>
                            </div>
                            <div className="mb-3 sm:mb-0 pr-1 md:place-self-start">
                                <button
                                    onClick={() => (router.push("/authenticated/promotions"))}
                                    className="rounded border px-3 py-1 flex mx-auto w-[140px] items-center justify-center border-slate-500 hover:border-slate-200 transition-all"
                                >
                                    Promotions
                                </button>
                            </div>
                            <div className="mb-3 sm:mb-0 pl-1 md:place-self-start">
                                <button
                                    className="rounded group mx-auto border w-[140px] py-1 flex items-center justify-center border-slate-500 hover:border-slate-200 transition-all disabled:cursor-not-allowed disabled:text-gray-500"
                                    onClick={() => (router.push("/authenticated/perks"))}
                                >
                                    Features
                                </button>
                            </div>
                            <div className="mb-3 sm:mb-0 pr-1 md:place-self-start">
                                <button
                                    onClick={() => (showRankings ? setShowRankings(false) : setShowRankings(true))}
                                    className="rounded border px-3 py-1 flex mx-auto w-[140px] items-center justify-center border-slate-500 hover:border-slate-200 transition-all"
                                >
                                    <IoListCircleOutline className="mr-1 text-gray-400" />{" "}
                                    {showRankings ? "Leagues" : "Rankings"}
                                </button>
                            </div>
                            <div className="mb-3 sm:mb-0 pl-1 md:place-self-start">
                                <button
                                    className="rounded group mx-auto border w-[140px] py-1 flex items-center justify-center border-slate-500 hover:border-slate-200 transition-all disabled:cursor-not-allowed disabled:text-gray-500"
                                    onClick={() => refreshLeagues()}
                                    disabled={recentlyRefreshed}
                                >
                                    <IoRefreshCircleOutline className="mr-1 text-gray-400 transition-all duration-200 group-hover:rotate-180" />{" "}
                                    {recentlyRefreshed ? "Refreshed" : "Refresh"}
                                </button>
                            </div>
                            {/* <div className="mb-3 sm:mb-0">
                                <button
                                    className="rounded group mx-auto border w-[140px] py-1 flex items-center justify-center border-slate-500 hover:border-slate-200 transition-all disabled:cursor-not-allowed disabled:text-gray-500"
                                    onClick={() => router.push(`/authenticated/referral`)}
                                    disabled={recentlyRefreshed}
                                >
                                    <LuBanana className="mr-1 text-gray-400 transition-all duration-200" /> Invite
                                    Friends
                                </button>
                            </div> */}
                            {/* <div className="mb-3 sm:mb-0">
                                <button
                                    className="rounded group mx-auto border w-[140px] py-1 flex items-center justify-center border-slate-500 hover:border-slate-200 transition-all disabled:cursor-not-allowed disabled:text-gray-500"
                                    onClick={() => router.push(`/authenticated/settings`)}
                                    disabled={recentlyRefreshed}
                                >
                                    <BsGearWide className="mr-1 text-gray-400 transition-all duration-200" /> Settings
                                </button>
                            </div> */}
                        </nav>
                        {showRankings ? (
                            <DragAndDropRankings handleDrop={handleDrop} rankings={rankings} />
                        ) : (
                            <div className="px-5">
                                <div className="my-5 flex items-center justify-center">
                                    
                                </div>
                                {!viewManageLeagues && tokensAvailable === 0 && (
                                    <p className="text-center pb-6 text-[14px]">
                                        You have no draft passes. You can buy a draft pass by selecting the{" "}
                                        <Link href="/authenticated/mint" className="underline">
                                            Buy Drafts
                                        </Link>{" "}
                                        button.
                                    </p>
                                )}
                                {/**
                                 <DownloadTheApp />
                                 */}
                                <LeagueSwitches
                                    viewManageLeagues={viewManageLeagues}
                                    setViewManageLeagues={setViewManageLeagues}
                                />
                                {/* <p className="pt-5">
                                    Sorry, Banana Best Ball is currently down for maintenance. Please visit our{" "}
                                    <Link
                                        href="https://discord.gg/JQ9K4VTe9B"
                                        target="_blank"
                                        className="underline"
                                    >
                                        Discord
                                    </Link>{" "}
                                    page for the latest updates.
                                </p> */}
                                {mergedData ? (
                                    <LeagueTable viewManageLeagues={viewManageLeagues}>
                                        {viewManageLeagues ? (
                                            <DraftFinishedLeagues draftFinishedLeagues={draftFinishedLeagues} />
                                        ) : (
                                            <DraftActiveLeagues
                                                leagues={leagues}
                                                setLeavingLeague={setLeavingLeague}
                                                setShowLeaveModal={setShowLeaveModal}
                                            />
                                        )}
                                    </LeagueTable>
                                ) : (
                                    <div className="flex items-center justify-center">
                                        <ReactLoading type={"bubbles"} color={"#fff"} height={100} width={100} />
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </>
    )
}

export default LeaguesComponent
