'use client'

import { useAppSelector, useAppDispatch } from "@/redux/hooks/reduxHooks"
import { BsFillClipboardFill, BsFillInfoCircleFill } from "react-icons/bs"
import React, { use, useEffect, useState } from "react"
import { truncate, truncateDisplayName } from "@/utils/helpers"
import useWeb3Auth from "@/utils/auth/web3Auth"
import Link from "next/link"
import { NFTProps, OwnerProps } from "@/utils/types/types"
import { Owner, Settings } from "@/utils/api"
import { AnimatePresence, motion } from "framer-motion"
import styled from "styled-components"
import { ConnectButton, useActiveAccount } from "thirdweb/react";
import { inAppWallet, createWallet } from "thirdweb/wallets";
import { client } from "@/utils/client";
import { useRouter } from "next/navigation"
import { signIn, signOut } from "@/redux/authSlice"
import { getProfiles } from "thirdweb/wallets";
import { HTTP_DRAFT_API_URL, SBS_API } from "@/constants/api"

const StyledButton = styled('button')`
    min-width: 165px;
    height: 50px;
    font-size: 16px;
    background: #eeeef0;
    color: hsl(230 11.63% 8.43%);
    border-radius: 10px;
    margin-left: 20px;
`


type HeaderProps = {
    title: string
}

type ModalProps = {
    fetchOwnerInfo: () => void
    changeName: boolean
    setChangeName: React.Dispatch<React.SetStateAction<boolean>>
}

const StyledMenuItem = styled('div')`
    cursor: pointer;
    margin-right: 10px;

    &:hover {
        color: #D3D3D3;
    }
`

const Header: React.FC<HeaderProps> = (props) => {
    const typeOfLogin = useAppSelector((state) => state.auth.typeOfLogin)
    const [tooltip, setTooltip] = React.useState<boolean>(false)
    const [modal, setModal] = useState<boolean>(false)
    const { title } = props
    const router = useRouter()

    const [changeName, setChangeName] = useState<boolean>(false)
    const [owner, setOwner] = useState<OwnerProps>()
    const [name, setName] = useState<string>("")
    const [submitting, setSubmitting] = useState<boolean>(false)
    const walletAddress = useAppSelector((state) => state.auth.walletAddress)
    const activeAccount = useActiveAccount();
    const dispatch = useAppDispatch();

    useEffect(() => {
        const setAddress = async () => {
            if (activeAccount?.address) {
                dispatch(signIn(activeAccount?.address.toLowerCase()))
                // get users profile if social wallet
                const profiles = await getProfiles({
                    client
                });

                // if this is a social wallet, save information about it
                if (profiles[0] && ["x", "email", "google"].indexOf(profiles[0].type) >= 0) {
                    fetch(`${SBS_API}/logging/social-users`, {
                        method: 'POST',
                        body: JSON.stringify({
                            ethAddress: activeAccount?.address.toLowerCase(),
                            profile: profiles[0]
                        })
                    })
                }
            } else {
                dispatch(signOut())
            }
        }

        setAddress()
        
        
    }, [activeAccount?.address])

    useEffect(() => {
        if (process.env.NEXT_PUBLIC_TEST_MODE === 'true') {
            dispatch(signIn(process.env.NEXT_PUBLIC_TEST_MODE_ADDRESS))
        }
    }, [])

    const fetchOwnerInfo = async () => {
        const response = await Owner.getOwnerById(walletAddress!)
        setOwner(response)
    }

    useEffect(() => {
        fetchOwnerInfo()
    }, [])

    const Modal = () => {
        return (
            <div className="absolute top-5 left-5 z-10 w-[200px] h-screen text-white font-primary px-2 py-1 rounded">
                <div className="bg-gray-800 pt-1 pb-6 px-3 text-left">
                    <div
                        className="w-full flex items-center justify-end cursor-pointer"
                        onClick={() => setModal(false)}
                    >
                        X
                    </div>
                    <p className="text-[12px] py-2">
                        MetaMask handles logout sessions differently. Click{" "}
                        <Link
                            href="https://support.metamask.io/hc/en-us/articles/360059535551-Disconnect-wallet-from-a-dapp"
                            className="underline"
                            target="_blank"
                        >
                            here
                        </Link>{" "}
                        for instructions.
                    </p>
                </div>
            </div>
        )
    }

    return (
        <>
            {/* <AnimatePresence>
                {changeName && (
                    <NameModal fetchOwnerInfo={fetchOwnerInfo} setChangeName={setChangeName} changeName={changeName} />
                )}
            </AnimatePresence> */}
            {modal && <Modal />}
            {owner && (
                <>
                    <header className="w-full block sm:flex items-center justify-center py-3 px-5">
                        {/* LOGO */}
                        <div className="grow flex items-left justify-left gap-2">
                            <img
                                src="/sbs-banana-logo.png"
                                alt="Spoiled Banana Society Logo"
                                className="w-[60px] h-[60px] object-fit"
                                onClick={() => {router.push("/")}}
                                style={{cursor: 'pointer'}}
                            />
                            <StyledMenuItem 
                                className="text-sm sm:text-5l font-black uppercase text-center font-primary italic py-5"
                                onClick={() => {
                                    router.push("/authenticated/leagues")
                                }}
                            >
                                Banana Best Ball III
                            </StyledMenuItem>
                            {/* <StyledMenuItem 
                                className="text-sm sm:text-5l font-black uppercase text-center font-primary italic py-5"
                                onClick={() => {
                                    router.push("/")
                                }}
                            >
                                Leaderboard
                            </StyledMenuItem> */}
                        </div>
                        {/* MIDDLE SECTION */}
                        <div className="grow flex items-center justify-center gap-2">
                            
                        </div>
                        {/* ACCOUNT */}
                        <div className="flex-1 flex items-center pt-2 sm:pt-0 justify-center sm:justify-end text-xs">
                            <ConnectButton 
                                client={client} 
                                connectButton={{
                                    label: "Sign In",
                                }}
                                wallets={[
                                    inAppWallet({
                                        auth: {
                                        options: [
                                            "x",
                                            "email",
                                            "google",
                                        ],
                                        },
                                    }),
                                    createWallet("io.metamask"),
                                    createWallet("com.coinbase.wallet"),
                                    createWallet("me.rainbow"),
                                    createWallet("io.rabby"),
                                    createWallet("io.zerion.wallet"),
                                ]}
                                connectModal={{
                                    title: "Connect or Create Wallet",
                                    titleIcon: "/sbs-banana-logo.png"
                                }}
                            />
                            {/* <StyledButton>
                                <Link href="https://sbsfantasy.com/about" target="_blank" style={{marginLeft: '10px'}}>
                                    Contest Details
                                </Link>
                            </StyledButton> */}
                        </div>
                    </header>
                </>
            )}
        </>
    )
}

export default Header
