import React, { useEffect, useState } from "react"
import { useAppDispatch, useAppSelector } from "@/redux/hooks/reduxHooks"
import { truncate } from "@/utils/helpers"
import Dropdown from "react-dropdown"
import "react-dropdown/style.css"
import ReactLoading from "react-loading"
import ManageRosterItemComponent from "./ManageRosterItemComponent"
import { Draft, Leagues, Owner } from "@/utils/api"
import { LeagueDataProps, activeLeagueDataProps } from "@/utils/types/types"
import { setManageDraftRosters, setManageDraftSummary, setManageLeagueId } from "@/redux/manageSlice"

type Props = {
    leagueId: string
}

enum TRANSFERSTATE {
    IDLE,
    PENDING,
    SUCCESS,
    ERROR,
}

const ManageRosterComponent: React.FC<Props> = (props) => {
    const walletAddress = useAppSelector((state) => state.auth.walletAddress)
    const roster = useAppSelector((state) => state.manage.draftRosters)
    const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null)
    const manageRosters = useAppSelector((state) => state.manage.draftRosters)
    const selectedCard = useAppSelector((state) => state.manage.selectedCard)
    const [players, setPlayers] = useState<string[]>()
    const [card, setCard] = useState<string>("")
    const dispatch = useAppDispatch()
    const { leagueId } = props
    const [winnings, setWinnings] = useState<number>(0)
    const [startTransfer, setStartTransfer] = useState<boolean>(false)
    const [cardId, setCardId] = useState<string>("")
    const [transferState, setTransferState] = useState<TRANSFERSTATE>(TRANSFERSTATE.IDLE)
    const [allCards, setAllCards] = useState<activeLeagueDataProps[]>([])
    const [cardIdx, setCardIdx] = useState<string>("")

    useEffect(() => {
        walletAddress &&
            Leagues.getLeagues(walletAddress).then((response: LeagueDataProps) => {
                const _allCards = response.active.filter((league) => league._leagueId === leagueId)
                setAllCards(_allCards)
                if (_allCards.length) {
                    setCardIdx(_allCards[0]._cardId)
                }
            })
    }, [walletAddress])

    // set the card
    useEffect(() => {
        if (cardIdx) {
            const _c = allCards.find(c => c._cardId === cardIdx)
            if (_c) {
                setCard(_c!._imageUrl)
                setWinnings(_c!.prizes.ETH)
                setCardId(_c!._cardId)
            }            
        }
    }, [cardIdx])

    useEffect(() => {
        setSelectedPlayer(selectedCard)
    }, [selectedCard])

    useEffect(() => {
        if (manageRosters) {
            setPlayers(Object.keys(manageRosters))
        }
    }, [manageRosters])

    useEffect(() => {
        if (walletAddress || selectedCard) {
            setSelectedPlayer(selectedCard ?? walletAddress)
        }
    }, [walletAddress, selectedCard])

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

    const transferWinnings = async () => {
        try {
            setTransferState(TRANSFERSTATE.PENDING)
            const payload = {
                draftId: leagueId,
                amount: winnings,
            }
            await Owner.transferWinningsFromCard(walletAddress!, cardId, payload)
        } catch (error) {
            console.error(error)
            setTransferState(TRANSFERSTATE.ERROR)
        }
        setTransferState(TRANSFERSTATE.SUCCESS)
        Leagues.getLeagues(walletAddress!).then((response: LeagueDataProps) => {
            const currentLeague = response.active.find((league) => league._leagueId === leagueId)
            setWinnings(currentLeague!.prizes.ETH)
        })
    }

    return (
        <div className="px-3 pt-5 w-full lg:w-[900px] mx-auto">
            {card && (
                <>
                    <div className="pt-5 text-center font-bold uppercase italic">
                        Your Card 
                        <Dropdown
                            options={allCards.map(c => c._cardId)}
                            onChange={(e) => setCardIdx(e.value)}
                            // @ts-ignore
                            value={allCards[cardIdx]?._cardId}
                            placeholder={"Select Card..."}
                            className="font-primary font-bold"
                        />
                    </div>
                    <p className="text-center text-[14px]">Card Winnings: {winnings}</p>
                    {winnings > 0 && (
                        <div
                            onClick={() => setStartTransfer(true)}
                            className="text-center mx-auto text-black block w-[150px] rounded py-1 my-2 text-[13px] cursor-pointer font-bold bg-primary"
                        >
                            Transfer winnings
                        </div>
                    )}
                    {startTransfer && transferState !== TRANSFERSTATE.SUCCESS && (
                        <div className="border border-gray-600 w-[490px] mx-auto text-center p-4 my-3">
                            <p className="text-[14px]">
                                This will transfer all of your winnings on this card to your account.
                            </p>
                            <div className="text-center mx-auto flex items-center justify-center gap-3 text-[13px] pt-3">
                                <div className="underline cursor-pointer" onClick={() => setStartTransfer(false)}>
                                    Nevermind
                                </div>
                                <div
                                    className="p-1 bg-primary rounded cursor-pointer text-black px-2 font-bold"
                                    onClick={() => transferWinnings()}
                                >
                                    Yes, transfer
                                </div>
                            </div>
                        </div>
                    )}
                    {transferState === TRANSFERSTATE.PENDING && (
                        <p className="text-center text-white text-[13px] py-2">Processing your transfer...</p>
                    )}
                    {transferState === TRANSFERSTATE.SUCCESS && (
                        <p className="text-center text-green-500 text-[13px] py-2">Your transfer was successful.</p>
                    )}
                    {transferState === TRANSFERSTATE.ERROR && (
                        <p className="text-center text-red-500 text-[13px] py-2">
                            There was an error, please try again.
                        </p>
                    )}
                    {/* <div className="mx-auto p-3 text-center rounded border-slate-500 border w-[350px] my-2">
                        <p className="text-[14px] pb-3">How much would you like to transfer?</p>
                        <div className="flex items-center justify-center gap-3">
                            <input
                                type="number"
                                value={transferBalance}
                                className="text-black px-2"
                                step="0.01"
                                onChange={(e) => setTransferBalance(parseFloat(e.target.value))}
                            />
                            <input
                                type="submit"
                                value="Transfer"
                                className="bg-primary px-3 text-black text-[13px] min-h-[25px] font-bold disabled:bg-gray-500 disabled:text-gray-800 disabled:cursor-not-allowed"
                                disabled={transferBalance > winnings || transferBalance <= 0}
                            />
                        </div>
                    </div> */}
                    <img
                        src={card}
                        alt="Banana Best Ball Card"
                        className="block mx-auto py-2 w-[280px] md:w-[350px] pb-10"
                    />
                </>
            )}
            {leagueId.indexOf("round") > -1 ? (
                ""
            ) : (
                <>
                    {players && walletAddress ? (
                        <Dropdown
                            options={players}
                            onChange={(e) => setSelectedPlayer(e.value)}
                            // @ts-ignore
                            value={truncate(selectedPlayer) || truncate(walletAddress!)}
                            placeholder="Select a player"
                            className="font-primary font-bold"
                        />
                    ) : (
                        <div>
                            <p className="text-center font-primary font-bold">Please wait...</p>
                        </div>
                    )}
                </>
            )}
            <div>
                {selectedPlayer && roster ? (
                    <ManageRosterItemComponent selectedPlayer={selectedPlayer} roster={roster} />
                ) : (
                    <div className="h-full flex items-center justify-center">
                        <ReactLoading type={"bubbles"} color={"#fff"} height={100} width={100} />
                    </div>
                )}
            </div>
        </div>
    )
}

export default ManageRosterComponent
