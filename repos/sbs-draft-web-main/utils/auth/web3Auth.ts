import { Web3AuthNoModal } from "@web3auth/no-modal"
import { EthereumPrivateKeyProvider } from "@web3auth/ethereum-provider"
import { CHAIN_NAMESPACES, WALLET_ADAPTERS } from "@web3auth/base"
import { OpenloginAdapter } from "@web3auth/openlogin-adapter"
import { MetamaskAdapter } from "@web3auth/metamask-adapter"
import { useAppDispatch, useAppSelector } from "@/redux/hooks/reduxHooks"
import { setEthBalance, signInWeb3Auth, signOut } from "@/redux/authSlice"
import { useRouter } from "next/navigation"
import { ethers } from "ethers"
import { useEffect, useState } from "react"
import prodABI from "./prodABI"
import { MAINNET_ADDRESS, TESTNET_ADDRESS } from "@/constants/contracts"
import { env } from "@/environment"
import { useSendTransaction } from "thirdweb/react";
import { getContract, prepareContractCall, waitForReceipt, toWei } from "thirdweb";
import { sepolia, mainnet } from "thirdweb/chains";
import { client } from "../client"

declare let window: any

// TODO: switch for prod
const chainNetwork = "cyan"
const chainId = "0x1"

const useWeb3Auth = () => {
    const dispatch = useAppDispatch()
    const router = useRouter()
    const [web3Auth, setWeb3Auth] = useState<Web3AuthNoModal>()
    const price = useAppSelector((state) => state.mint.price)
    const walletAddress = useAppSelector((state) => state.auth.walletAddress)
    const { mutate: sendTransaction, isPending } = useSendTransaction();

    useEffect(() => {
        const chainConfig = {
            chainNamespace: CHAIN_NAMESPACES.EIP155,
            chainId,
            rpcTarget: process.env.NEXT_PUBLIC_INFURA_KEY!,
            displayName: "Ethereum Mainnet",
            blockExplorer: "https://etherscan.io",
            ticker: "ETH",
            tickerName: "Ethereum",
        }

        const metamaskAdapter = new MetamaskAdapter({
            // TODO: Switch out for production
            clientId: process.env.NEXT_PUBLIC_WEB3AUTH_CLIENT_ID,
            sessionTime: 3600, // 1 hour in seconds
            web3AuthNetwork: chainNetwork,
            chainConfig: {
                chainNamespace: CHAIN_NAMESPACES.EIP155,
                chainId,
                rpcTarget: process.env.NEXT_PUBLIC_INFURA_KEY!,
            },
        })

        const auth = new Web3AuthNoModal({
            // TODO: Switch out for production
            clientId: process.env.NEXT_PUBLIC_WEB3AUTH_CLIENT_ID,
            chainConfig,
        })

        const privateKeyProvider = new EthereumPrivateKeyProvider({ config: { chainConfig } })
        const openloginProvider = new OpenloginAdapter({
            privateKeyProvider,
            adapterSettings: {
                uxMode: "redirect",
            },
            web3AuthNetwork: chainNetwork,
        })

        auth.configureAdapter(openloginProvider)
        if (window.ethereum) auth.configureAdapter(metamaskAdapter)

        metamaskAdapter.setAdapterSettings({
            sessionTime: 86400, // 1 day in seconds
            chainConfig: {
                chainNamespace: CHAIN_NAMESPACES.EIP155,
                chainId,
                rpcTarget: process.env.NEXT_PUBLIC_INFURA_KEY!,
            },
            web3AuthNetwork: chainNetwork,
        })
        setWeb3Auth(auth)

        auth.init()
    }, [])

    // const loginGoogle = async () => {
    //     if (!web3Auth) return
    //     if (web3Auth.connectedAdapterName === null) {
    //         try {
    //             await web3Auth.connectTo(WALLET_ADAPTERS.OPENLOGIN, {
    //                 loginProvider: "google",
    //             })
    //         } catch (error) {
    //             console.error(error)
    //         }
    //     } else {
    //         const info = await web3Auth.getUserInfo()
    //         if (info) {
    //             const provider = new ethers.providers.Web3Provider(web3Auth.provider!)
    //             console.log("provider: ", provider)
    //             const signer = await provider.getSigner()
    //             console.log("signer: ", signer)
    //             const address = await signer.getAddress()
    //             console.log("address: ", address)
    //             const balance = ethers.utils.formatEther(await provider.getBalance(address)) // Balance is in wei)
    //             console.log("balance: ", balance)
    //             const payload = {
    //                 email: info.email,
    //                 typeOfLogin: info.typeOfLogin,
    //                 profileImage: info.profileImage,
    //                 name: info.name,
    //                 walletAddress: address.toLowerCase(),
    //             }
    //             dispatch(signInWeb3Auth(payload))
    //             dispatch(setEthBalance(balance))
    //             router.push("/authenticated/leagues")
    //         }
    //     }
    // }

    // const loginApple = async () => {
    //     if (!web3Auth) return
    //     if (web3Auth.connectedAdapterName === null) {
    //         try {
    //             await web3Auth.connectTo(WALLET_ADAPTERS.OPENLOGIN, {
    //                 loginProvider: "apple",
    //             })
    //         } catch (error) {
    //             console.error(error)
    //         }
    //     } else {
    //         const info = await web3Auth.getUserInfo()
    //         if (info) {
    //             const provider = new ethers.providers.Web3Provider(web3Auth.provider!)
    //             console.log("provider: ", provider)
    //             const signer = await provider.getSigner()
    //             console.log("signer: ", signer)
    //             const address = await signer.getAddress()
    //             console.log("address: ", address)
    //             const balance = ethers.utils.formatEther(await provider.getBalance(address)) // Balance is in wei)
    //             console.log("balance: ", balance)
    //             const payload = {
    //                 email: info.email,
    //                 typeOfLogin: info.typeOfLogin,
    //                 profileImage: info.profileImage,
    //                 name: info.name,
    //                 walletAddress: address.toLowerCase(),
    //             }
    //             dispatch(signInWeb3Auth(payload))
    //             router.push("/authenticated/leagues")
    //         }
    //     }
    // }

    const loginMetaMask = async () => {
        try {
            if (window.ethereum) {
                const accounts = await window.ethereum.request({ method: "eth_requestAccounts" })
                const payload = {
                    email: undefined,
                    typeOfLogin: "metamask",
                    profileImage: undefined,
                    name: undefined,
                    walletAddress: accounts[0].toLowerCase(),
                }
                dispatch(signInWeb3Auth(payload))
                router.push("/authenticated/leagues")
            }
        } catch (error) {
            console.error(error)
        }
    }

    const web3AuthMint = async (numberOfTokens: number) => {
        const contract = getContract({
            address: env === 'dev' ? TESTNET_ADDRESS : MAINNET_ADDRESS,
            chain: env === 'dev' ? sepolia : mainnet,
            client
        });

        const transaction = prepareContractCall({
            contract,
            method: "function mint(uint256 numberOfTokens)",
            params: [BigInt(numberOfTokens)],
            value: toWei(String(price * numberOfTokens))
        });
        
        sendTransaction(transaction);
        
        return isPending
    }   

    const logout = async () => {
        if (!web3Auth) return
        await web3Auth.logout()
        dispatch(signOut())
        console.log("web3Auth logout initiated")
        router.push("/")
    }

    return {
        loginMetaMask,
        web3AuthMint,
        logout,
    }
}

export default useWeb3Auth
