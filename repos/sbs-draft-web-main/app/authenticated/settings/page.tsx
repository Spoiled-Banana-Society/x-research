"use client"
import { useAppSelector } from "@/redux/hooks/reduxHooks"
import Link from "next/link"
import React, { useEffect, useState } from "react"
import { Owner, Settings } from "@/utils/api"
import { AnimatePresence, motion } from "framer-motion"
import { NFTProps, OwnerProps } from "@/utils/types/types"
import { useActiveAccount } from "thirdweb/react";

type ModalProps = {
    fetchOwnerInfo: () => void
}

const SettingsComponent = () => {
    const [showModal, setShowModal] = useState<boolean>(false)
    const [changeName, setChangeName] = useState<boolean>(false)
    const [owner, setOwner] = useState<OwnerProps>()
    const [name, setName] = useState<string>("")
    const [submitting, setSubmitting] = useState<boolean>(false)
    const walletAddress = useAppSelector((state) => state.auth.walletAddress)

    const Modal: React.FC<ModalProps> = (props) => {
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
        }, [])

        const setPFP = async (imageUrl: string, nftContract: string) => {
            const payload = {
                imageUrl,
                nftContract,
            }

            try {
                const response = await Owner.setPFPImage(walletAddress!, payload)
                console.log(response)
                props.fetchOwnerInfo()
                setShowModal(false)
            } catch (error) {
                console.error(error)
            } finally {
                fetchOwnerInfo()
            }
        }

        return (
            <motion.div
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -20, opacity: 0 }}
                className="absolute z-10 w-screen h-screen flex items-center justify-center  text-white font-primary px-2 py-1 rounded"
            >
                <div className="bg-[#111] border border-gray-600 p-5 text-center w-[800px] mx-auto">
                    <h1 className="font-bold pb-5 text-[21px] italic">Set your PFP</h1>
                    <p className="text-center text-gray-200">
                        Select a PFP you have in your wallet to use as your PFP in SBS Fantasy.
                    </p>
                    {nfts && (
                        <div className="grid grid-cols-4 gap-5 py-10">
                            {nfts.map((nft) => {
                                return (
                                    <div key={nft.name} onClick={() => setPFP(nft.image_url, nft.contract)}>
                                        <img
                                            src={nft.image_url}
                                            alt={nft.name}
                                            className="w-[80px] h-[80px] group rounded-full border border-gray-700 object-fit mx-auto transition-all hover:brightness-125 opacity-80 hover:opacity-100 cursor-pointer hover:scale-105"
                                        />
                                        <p className="text-white text-[13px] pt-2">{nft.name ?? nft.collection}</p>
                                    </div>
                                )
                            })}
                            <div>
                                <img
                                    src="/banana-profile.png"
                                    alt={walletAddress!}
                                    className="w-[80px] h-[80px] group rounded-full border border-gray-700 object-fit mx-auto transition-all hover:brightness-125 opacity-80 hover:opacity-100 cursor-pointer hover:scale-105"
                                />
                                <p className="text-white text-[13px] pt-2">Default</p>
                            </div>
                        </div>
                    )}
                    <div className="flex items-center justify-center gap-10">
                        <div>
                            <button
                                className="text-[13px] border border-white py-1 px-2 hover:brightness-125 hover:bg-black"
                                onClick={() => setShowModal(false)}
                            >
                                Nevermind
                            </button>
                        </div>
                    </div>
                </div>
            </motion.div>
        )
    }

    const fetchOwnerInfo = async () => {
        const response = await Owner.getOwnerById(walletAddress!)
        setOwner(response)
    }

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

    useEffect(() => {
        fetchOwnerInfo()
    }, [])

    console.log("owner: ", owner)

    return (
        <>
            <AnimatePresence>{showModal && <Modal fetchOwnerInfo={fetchOwnerInfo} />}</AnimatePresence>
            <div className="h-screen w-screen flex items-center justify-center">
                <div>
                    <h1 className="font-primary text-lg text-center font-bold italic uppercase">Settings</h1>
                    <Link
                        className="text-center w-[200px] mx-auto flex items-center justify-center rounded-full my-5 px-3 py-1 cursor-pointer bg-primary text-black font-primary font-bold italic uppercase text-[14px]"
                        href="/authenticated/leagues"
                    >
                        Return to Lobby
                    </Link>
                    <div>
                        <p className="text-center py-5">Customize your PFP image and your display name.</p>
                    </div>
                    {owner && (
                        <div className="w-[900px] mx-auto flex items-start justify-center gap-5 border rounded border-gray-700 py-3 px-4">
                            <div className="flex-1">
                                <h2 className="font-primary italic font-bold text-[21px]">Personal Information</h2>
                                <p className="pt-1 text-[14px] text-gray-400">Wallet Address</p>
                                <p>{walletAddress}</p>
                                <p className="pt-5 text-[14px] text-gray-400">
                                    Display Name{" "}
                                    <span
                                        onClick={() => setChangeName(!changeName)}
                                        className="border bg-primary cursor-pointer hover:brightness-125 text-black uppercase font-bold rounded px-2 text-[12px]"
                                    >
                                        {changeName ? "Cancel" : "Change"}
                                    </span>
                                </p>
                                <p>{owner.pfp.displayName !== "" ? owner.pfp.displayName : walletAddress}</p>
                                {changeName && (
                                    <div className="flex items-center justify-start mt-3">
                                        <input
                                            type="text"
                                            className="bg-black border-b border-gray-600"
                                            value={name}
                                            placeholder="Enter name"
                                            onChange={(e) => setName(e.target.value)}
                                        />
                                        <button
                                            className="px-3 py-1 mx-4 border rounded text-[13px] bg-primary text-black font-bold border-primary cursor-pointer disabled:bg-gray-500 disabled:border-gray-500 disabled:text-gray-400 disabled:cursor-not-allowed"
                                            disabled={name === "" || submitting}
                                            onClick={() => submitName()}
                                        >
                                            Submit
                                        </button>
                                    </div>
                                )}
                            </div>
                            <div className="flex-1 flex items-start justify-start gap-2">
                                <div>
                                    <img
                                        src={owner.pfp.imageUrl !== "" ? owner.pfp.imageUrl : "/banana-profile.png"}
                                        alt={`${name ?? walletAddress}'s PFP`}
                                        className="border rounded-full border-gray-700 m-3 w-[70px] h-[70px] object-fit"
                                    />
                                </div>
                                <div>
                                    <Link
                                        href={
                                            owner.pfp.nftContract
                                                ? `https://opensea.io/assets?search[query]=${owner.pfp.nftContract}`
                                                : "#"
                                        }
                                        className="text-[12px] text-gray-400 py-1 hover:text-white cursor-pointer"
                                        target="_blank"
                                    >
                                        PFP Contract: {owner.pfp.nftContract !== "" ? owner.pfp.nftContract : "N/A"}
                                    </Link>
                                    <div
                                        onClick={() => setShowModal(true)}
                                        className="bg-primary text-black font-primary block w-[130px] text-center py-1 mt-3 rounded font-bold hover:brightness-125 cursor-pointer"
                                    >
                                        Change PFP
                                    </div>
                                    <p className="text-[14px] text-gray-400 py-1">
                                        You can select any PFP on your wallet.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    )
}

export default SettingsComponent
