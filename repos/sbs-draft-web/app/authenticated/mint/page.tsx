"use client"

import { useAppDispatch, useAppSelector } from "@/redux/hooks/reduxHooks"
import { AiFillMinusCircle, AiFillPlusCircle } from "react-icons/ai"
import { decrementCount, incrementCount } from "@/redux/mintSlice"
import styled from "styled-components"
import { useEffect, useState } from "react"
import JSConfetti from "js-confetti"
import Link from "next/link"
import { MintBBB } from "@/utils/api"
import ReactLoading from "react-loading"
import useWeb3Auth from "@/utils/auth/web3Auth"
import Web3 from "web3"
import prodABI from "@/utils/auth/prodABI"
import { getContract, prepareContractCall, waitForReceipt, toWei } from 'thirdweb'
import { sepolia, mainnet } from "thirdweb/chains";
import { env } from "@/environment"
import { MAINNET_ADDRESS, TESTNET_ADDRESS } from "@/constants/contracts"
import { TransactionWidget, TransactionButton, useActiveAccount, useContractEvents } from "thirdweb/react"
import { simulateTransaction, prepareEvent } from "thirdweb";
import { client } from "@/utils/client"
import { useRouter } from "next/navigation"


declare let window: any


const StyledContainer = styled.div`
    width: 100%;
    background: #000;
    padding: 3rem;
    margin: 0px auto 50px auto;
    form {
        .flex {
            display: flex;
            margin: 0 auto;
            align-items: center;
            justify-content: center;
            padding-top: 3rem;
            gap: 2rem;
            & > div {
                font-size: 2rem;
                input {
                    width: 5rem;
                    background: #fff;
                    border: none;
                    color: #000;
                    text-align: center;
                    padding-left: 1rem;
                }
            }
        }
    }
`

enum MintState {
    DEFAULT,
    LOADING,
    SUCCESS,
    ERROR,
}

const Mint = () => {
    const [mintState, setMintState] = useState<MintState>(MintState.DEFAULT)
    const typeOfLogin = useAppSelector((state) => state.auth.typeOfLogin)
    const price = useAppSelector((state) => state.mint.price)
    const count = useAppSelector((state) => state.mint.count)
    const [promoCode, setPromoCode] = useState<string>("")
    const dispatch = useAppDispatch()
    const { web3AuthMint } = useWeb3Auth()
    const balance = useAppSelector((state) => state.auth.ethBalance)
    const walletAddress = useAppSelector((state) => state.auth.walletAddress)
    const account = useActiveAccount()

    const router = useRouter()

    const contract = getContract({
        address: env === 'dev' ? TESTNET_ADDRESS : MAINNET_ADDRESS,
        chain: env === 'dev' ? sepolia : mainnet,
        client
    });

    const mintCard = async (walletAddress: string, tokenId: string) => {
        // const payload = {
        //     minId: parseInt(tokenId),
        //     maxId: parseInt(tokenId),
        //     promoCode,
        // }
        // try {
        //     const response = await MintBBB.token(walletAddress, payload)
        //     console.log("response: ", response)
        //     setMintState(MintState.SUCCESS)
        // } catch (error) {
        //     console.error(error)
        // }
        setMintState(MintState.SUCCESS)
    }

    const onMintPressed = async (e: React.MouseEvent<HTMLInputElement, MouseEvent>) => {
        e.preventDefault()

        // if (typeOfLogin === "metamask") {
        //     const total = price * count
        //     const weiValue = Web3.utils.toWei(total.toString(), "ether")
        //     // smart contract address needs to be passed in, do not remove
        //     // test: 0xd468DAF9252908d7B6eA9a99a915A902d77732F2
        //     // prod: 0x82194174d56b6df894460e7754a9cC69a0c1707D
        //     // const provider = new ethers.providers.Web3Provider(window.ethereum)
        //     window.web3 = new Web3(window.ethereum)
        //     // TODO: switch for prod
        //     const contract = new window.web3.eth.Contract(prodABI, env === 'dev' ? TESTNET_ADDRESS : MAINNET_ADDRESS)
 
        //     await contract.methods
        //         .mint(count)
        //         .send({
        //             from: walletAddress,
        //             value: parseFloat(weiValue),
        //         })
        //         .on("transactionHash", (hash: any) => {
        //             console.log("hash: ", hash)
        //             setMintState(MintState.LOADING)
        //         })
        //         .on("receipt", (receipt: any) => {
        //             console.log("receipt: ", receipt)
        //             if (count === 1) {
        //                 mintCard(walletAddress!, receipt.events.Transfer.returnValues.tokenId)
        //                     .then((res) => setMintState(MintState.SUCCESS))
        //                     .catch((error) => console.error(error))
        //             }
        //             if (count > 1) {
        //                 receipt.events.Transfer.forEach((mint: any) => {
        //                     mintCard(walletAddress!, mint.returnValues.tokenId)
        //                 })
        //                 setMintState(MintState.SUCCESS)
        //             }
        //         })
        //         .on("error", (error: any, receipt: any) => {
        //             console.error("error: ", error, receipt)
        //             setMintState(MintState.ERROR)
        //         })
        // } else {
        //     const total = price * count
        //     const weiValue = Web3.utils.toWei(total.toString(), "ether")
            
        // }

        // DO NOT DELETE
        // if (typeOfLogin === "metamask") {
        //     const total = price * count
        //     const weiValue = Web3.utils.toWei(total.toString(), "ether")
        //     // smart contract address needs to be passed in, do not remove
        //     // test: 0xd468DAF9252908d7B6eA9a99a915A902d77732F2
        //     // prod: 0x82194174d56b6df894460e7754a9cC69a0c1707D
        //     const provider = new ethers.providers.Web3Provider(window.ethereum)
        //     // TODO: switch for prod
        //     const contract = new ethers.Contract(
        //         "0x82194174d56b6df894460e7754a9cC69a0c1707D",
        //         prodABI,
        //         provider.getSigner()
        //     )
        //     const gasPrice = (await provider.getGasPrice()).toNumber()
        //     console.log("gasPrice: ", gasPrice)
        //     const tx = await contract.mint(count, {
        //         gasPrice,
        //         gasLimit: 1000000,
        //         value: weiValue,
        //     })
        //     // setMintState(MintState.LOADING)
        //     const receipt = await tx.wait()
        //     if (receipt) {
        //         if (count > 1) {
        //             receipt.events.forEach((mint: any) => {
        //                 mintCard(walletAddress!, mint.args[2].toString())
        //             })
        //         } else {
        //             const tokenId = receipt.events[0].args[2].toString()
        //             mintCard(walletAddress!, tokenId)
        //         }
        //         setMintState(MintState.SUCCESS)
        //     }
        // } else {
        //     const total = price * count
        //     const weiValue = Web3.utils.toWei(total.toString(), "ether")
        //     web3AuthMint(weiValue)
        // }
    }

    useEffect(() => {
        if (mintState === MintState.SUCCESS) {
            const jsConfetti = new JSConfetti()
            jsConfetti.addConfetti({
                emojis: ["🍌", "🦍"],
                confettiNumber: 50,
            })
        }
    }, [mintState])

    const transaction = prepareContractCall({
        contract,
        method: "function mint(uint256 numberOfTokens)",
        params: [BigInt(count)],
        value: toWei(String(price * count))
    })

    // const myEvent = prepareEvent({
    //     signature: "event Transfer(address from, address to, uint256 tokenId)",
    // });
       
    // const contractEvents = useContractEvents({
    //     contract,
    //     events: [myEvent],
    // });

    return (
        <StyledContainer className="flex flex-col bg-black">
            <div>
                <h1 className="font-primary text-center text-md font-bold italic uppercase text-white dark:text-white">
                    Mint <span className="whitespace-nowrap">Banana Best Ball III</span> Pass
                </h1>
                <p className="text-center text-sm text-white dark:text-white">
                    To join a Banana Best Ball III draft, you must mint a Banana Best Ball Pass.
                </p>
                    <div className="mb-3 sm:mb-0 pr-1" style={{marginTop: '20px'}}>
                        <button
                            onClick={() => (router.push("/authenticated/promotions"))}
                            className="rounded border px-3 py-1 flex mx-auto w-[140px] items-center justify-center border-slate-500 hover:border-slate-200 transition-all"
                        >
                            Promotions
                        </button>
                    </div>
                <form action="" className="pb-10">
                    <div className="flex">
                    <div>
                        <AiFillMinusCircle
                            className="transition-all hover:scale-110 cursor-pointer text-white dark:text-white"
                            onClick={() => count !== 1 && dispatch(decrementCount())}
                        />
                    </div>
                    <div>
                        <input type="number" value={count} disabled className="font-primary font-black" />
                    </div>
                    <div>
                        <AiFillPlusCircle
                            className="transition-all hover:scale-110 cursor-pointer text-white dark:text-white"
                            onClick={() => dispatch(incrementCount())}
                        />
                    </div>
                    </div>
                </form>
                <div className="place-items-center text-center">
                    {/* <TransactionButton
                        transaction={() => transaction}
                        onTransactionConfirmed={async (tx) => {
                            const web3 = new Web3()
                            const draftTokenId = web3.eth.abi.decodeParameter('uint256', String(tx.logs[0].topics[3]))

                            mintCard(walletAddress!, String(draftTokenId)).then(
                                (res) => setMintState(MintState.SUCCESS)
                            ).catch(
                                (error) => {
                                    console.error(error)

                                    // try again because 
                                    mintCard(walletAddress!, String(draftTokenId)).then(
                                        (res) => setMintState(MintState.SUCCESS)
                                    ).catch(
                                        (error) => {
                                            setMintState(MintState.ERROR)
                                            console.log("rip")
                                            console.error(error) 
                                        }
                                    )
                                }
                            )
                            // await contractEvents.refetch()
                            // console.log(contractEvents.data)
                            // console.log(contractEvents.error)
                            // console.log(contractEvents.dataUpdatedAt)
                        }}
                        onError={(err) => {console.log(err)}}
                    >
                        Buy Draft Pass
                    </TransactionButton> */}
                    <TransactionWidget
                        client={client}
                        transaction={transaction}
                        title="Buy Draft Pass"
                    />
                    <div className="flex items-center justify-center mx-auto" style={{marginTop: '20px'}}>
                        <div style={{maxWidth: '500px'}}>
                            <p className="text-center">After you submit your payment there might be a slight delay before your tokens arrive. Check your transaction status and allow for a few minutes after it succeeds for your tokens to be credited. Thank you!</p>
                            <Link
                                href="/authenticated/leagues"
                                className="text-center mt-5 bg-primary w-[230px] font-primary uppercase py-1 px-2 font-bold italic rounded-full mx-auto text-black flex items-center justify-center cursor-pointer"
                            >
                                Go back to leagues
                            </Link>
                        </div>
                    </div>
                </div>             
                {/* {mintState === MintState.DEFAULT && (
                    <form action="" className="pb-20"> */}
                        
                        {/* {typeOfLogin === "metamask" && (
                            
                        )}
                        {typeOfLogin !== "metamask" && (
                            <section className="mx-auto text-center pt-5 font-primary">
                                <section className="text-[18px]">Mint Price: {price} ETH</section>
                                <section className="text-[15px]">Your Balance: {balance ? balance : 0} ETH</section>
                                <section className="pt-3">
                                    <Link
                                        href="https://crypto.link.com/"
                                        target="_blank"
                                        className="text-green-300 underline"
                                    >
                                        Add ETH to your wallet
                                    </Link>
                                </section>
                            </section>
                        )}
                        <div className="mx-auto text-center">
                            <input
                                type="submit"
                                value="Mint now"
                                onClick={(e) => onMintPressed(e)}
                                className="text-center bg-primary w-[250px] hover:scale-105 transition-all py-2 mt-5 text-md font-primary uppercase font-bold italic rounded-full mx-auto text-black cursor-pointer"
                            />
                        </div>
                    </form>
                )}
                {mintState === MintState.LOADING && (
                    <div className="flex items-center justify-center mx-auto">
                        <div>
                            <ReactLoading
                                type={"bubbles"}
                                color={"#fff"}
                                height={100}
                                width={100}
                                className="mx-auto"
                            />
                            <p className="text-primary text-center">
                                Please do not close this window until the transaction is complete.
                            </p>
                        </div>
                    </div>
                )}
                {mintState === MintState.SUCCESS && (
                    <div className="flex items-center justify-center mx-auto">
                        <div>
                            <h1 className="font-primary text-lg text-center font-bold italic uppercase mt-5">
                                Success!
                            </h1>
                            <p className="text-center">You will now be able to join a Banana Best Ball III draft</p>
                            <Link
                                href="/authenticated/leagues"
                                className="text-center mt-5 bg-primary w-[230px] font-primary uppercase py-1 px-2 font-bold italic rounded-full mx-auto text-black flex items-center justify-center cursor-pointer"
                            >
                                Go back to leagues
                            </Link>
                        </div>
                    </div>
                )}
                {mintState === MintState.ERROR && (
                    <div className="flex items-center justify-center mx-auto pb-14">
                        <div>
                            <h1 className="font-primary text-lg text-center font-bold italic uppercase mt-5">
                                There was an error.
                            </h1>
                            <p className="text-center font-primary md:w-[700px]">
                                If you&apos;ve experience an issue minting, please reference your transaction hash from
                                MetaMask and open a support ticket within Discord.

                                <br /><br />
                                If your transaction was successful but you do not see a draft token creditted to your account, there is a delay. You should see your draft token show up in the next 15 minutes. If it does not arrive, contact support.
                            </p>
                            
                        </div>
                    </div>
                )} */}
            </div>
            {/* <div style={{textAlign: 'center', marginTop: '40px'}}>
                <p className="font-primary text-center text-md font-bold italic uppercase text-white dark:text-white">
                    New Users get a 50% deposit bonus on their purchase up to 10 free drafts
                </p>
                <ul>
                    <li>- Buy 20 get 10 Free</li>
                    <li>- Buy 20 and spin the Banana Wheel (see below for wheel details)</li>
                </ul>
                <div className="pb-10"></div>
                <p className="font-primary text-center text-md font-bold italic uppercase text-white dark:text-white">
                    Returning users get a 50% deposit bonus on their first purchase up to 25 Free drafts
                </p>
                <ul>
                    <li>- Ends June 11th 11:59 PST</li>
                    <li>- Buy 50 get 25 Free</li>
                    <li>- Buy 50 and spin the Banana Wheel (see below for wheel details)</li>

                </ul>
                <div className="pb-10"></div>
                
                <img src="/banana-wheel.png" alt="Banana Best Ball" className="rounded mx-auto w-[600px] py-2" />
            </div> */}
        </StyledContainer>
    )
}

export default Mint
