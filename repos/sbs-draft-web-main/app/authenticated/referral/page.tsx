"use client"
import { Referral } from "@/utils/api"
import React, { useEffect, useState } from "react"
import { useAppSelector } from "@/redux/hooks/reduxHooks"
import { ReferralProps } from "@/utils/types/types"
import ReactLoading from "react-loading"
import Link from "next/link"

const ReferralComponent = () => {
    const walletAddress = useAppSelector((state) => state.auth.walletAddress)
    const [code, setCode] = useState<ReferralProps>()
    const [update, setUpdate] = useState<boolean>(false)
    const [error, setError] = useState<boolean>(false)
    const [newCode, setNewCode] = useState<string>("")
    const [errorMessage, setErrorMessage] = useState<string>("")
    const [success, setSuccess] = useState<boolean>(false)

    const fetchCode = () => {
        Referral.getCode(walletAddress!).then((response) => {
            setCode(response)
        })
    }

    useEffect(() => {
        if (walletAddress) fetchCode()
    }, [walletAddress])

    const submitNewCode = async (walletAddress: string) => {
        if (!newCode) {
            setError(true)
            setErrorMessage("Promo code cannot be blank")
            return
        }
        const payload: ReferralProps = {
            ownerId: walletAddress,
            promoCode: newCode,
            numberOfUses: code!.numberOfUses,
            timesMintedWithCode: code!.timesMintedWithCode,
        }

        const response = await Referral.updateCode(walletAddress, payload)
        if (response.response && response.response.data.includes("not unique")) {
            setError(true)
            return setErrorMessage("This code is already in use")
        }
        setUpdate(false)
        setSuccess(true)
        fetchCode()
        setError(false)

        setTimeout(() => {
            setSuccess(false)
        }, 3000)
    }

    return (
        <div className="h-screen w-screen flex items-center justify-center">
            <div>
                <h1 className="font-primary text-lg text-center font-bold italic uppercase">Invite Friends</h1>
                <Link
                    className="text-center w-[200px] mx-auto flex items-center justify-center rounded-full my-5 px-3 py-1 cursor-pointer bg-primary text-black font-primary font-bold italic uppercase text-[14px]"
                    href="/authenticated/leagues"
                >
                    Return to Lobby
                </Link>
                {code ? (
                    <div className="items-center justify-center flex md:w-[500px] mx-auto">
                        <div>
                            <div className="block sm:flex items-center justify-between gap-10">
                                <div className="text-center sm:mb-0 sm:text-left uppercase font-primary font-bold italic">
                                    Promo code:
                                </div>
                                <div className="text-center mb-5 sm:mb-0 sm:text-right">{code.promoCode}</div>
                            </div>
                            <div className="block sm:flex items-center justify-between gap-10">
                                <div className="text-center sm:mb-0 sm:text-left uppercase font-primary font-bold italic">
                                    Number of uses:
                                </div>
                                <div className="text-center mb-5 sm:mb-0 sm:text-right">{code.numberOfUses}</div>
                            </div>
                            <div className="block sm:flex items-center justify-between gap-10">
                                <div className="text-center sm:mb-0 sm:text-left uppercase font-primary font-bold italic">
                                    Times minted with code:
                                </div>
                                <div className="text-center mb-5 sm:mb-0 sm:text-right">{code.timesMintedWithCode}</div>
                            </div>
                            {update ? (
                                <>
                                    <div className="flex items-center justify-center mt-5 mb-2">
                                        <input
                                            type="text"
                                            className="grow h-8 font-primary px-2 text-black"
                                            placeholder="RIP_Harambe"
                                            value={newCode}
                                            onChange={(e) => setNewCode(e.target.value)}
                                        />
                                        <button
                                            onClick={() => submitNewCode(walletAddress!)}
                                            className="ml-2 bg-primary font-primary text-[15px] font-bold uppercase text-black p-1"
                                        >
                                            Submit
                                        </button>
                                    </div>
                                    {error && (
                                        <p className="text-center text-red-500 text-[14px] font-primary">
                                            {errorMessage}
                                        </p>
                                    )}
                                </>
                            ) : (
                                <div>
                                    <button
                                        onClick={() => setUpdate(true)}
                                        className="mt-5 text-black font-primary italic py-1 px-3 font-bold text-[13px] uppercase rounded-full block mx-auto bg-primary hover:brightness-105"
                                    >
                                        Update promo code
                                    </button>
                                </div>
                            )}
                            {success && (
                                <p className="text-center text-green-500 mt-2 text-[14px] font-primary">
                                    Your promo code was successfully updated.
                                </p>
                            )}
                        </div>
                    </div>
                ) : (
                    <ReactLoading type={"bubbles"} color={"#fff"} height={100} width={100} className="mx-auto" />
                )}
            </div>
        </div>
    )
}

export default ReferralComponent
