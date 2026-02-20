import { useEffect, useState } from "react"
import { BiPlusCircle } from "react-icons/bi"
import { LiaEthereum } from "react-icons/lia"
import { useRouter } from "next/navigation"
import { useAppSelector } from "@/redux/hooks/reduxHooks"
import { useActiveAccount } from "thirdweb/react";

const DISABLE_BUTTON_DATE = 1757028060000

export const JoinAndMintSection = ({
                                       joiningDraft,
                                       joinDraft,
                                   }: {
                                    joiningDraft: any,
                                    joinDraft: any
                                   }) => {

    const tokensAvailable = useAppSelector((state) => state.auth.tokensAvailable)
    const router = useRouter()
    const walletAddress = useAppSelector((state) => state.auth.walletAddress)

    const now = new Date()
    const closeDate = new Date(DISABLE_BUTTON_DATE)

    return (
        <div className="flex items-center justify-center gap-10 mb-10">
            <div className="mb-3 sm:mb-0">
                <button
                    disabled={tokensAvailable === 0 || joiningDraft || true}
                    onClick={() => joinDraft(walletAddress!)}
                    className="disabled:cursor-not-allowed group bg-primary font-primary font-bold text-black rounded px-3 py-1 flex mx-auto text-[19px] sm:text-md w-[150px] sm:w-[235px] items-center justify-center hover:border-slate-200 transition-all disabled:hover:border-slate-500 disabled:text-gray-600 disabled:bg-gray-300"
                >
                    <BiPlusCircle className="mr-1 text-black text-[22px] group-disabled:text-gray-600" />
                    {joiningDraft ? "Joining" : "Join Draft"}
                </button>
            </div>
            {process.env.NEXT_PUBLIC_MINT_ENABLED === "true" && (
                <div className="mb-3 sm:mb-0">
                    <button
                        disabled={!walletAddress || true}
                        onClick={() => router.push("/authenticated/mint")}
                        className="disabled:cursor-not-allowed group bg-primary font-primary font-bold text-black rounded px-3 py-1 flex mx-auto text-[19px] sm:text-md w-[150px] sm:w-[235px] items-center justify-center hover:border-slate-200 transition-all disabled:hover:border-slate-500 disabled:text-gray-600 disabled:bg-gray-500"
                    >
                        <LiaEthereum className="mr-1 text-black text-[22px] group-disabled:text-gray-600" />
                        Buy Drafts
                    </button>
                </div>
            )}
        </div>
    )
}