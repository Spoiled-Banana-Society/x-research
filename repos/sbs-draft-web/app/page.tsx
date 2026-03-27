"use client"
import { signIn } from "@/redux/authSlice"
import { useAppDispatch } from "@/redux/hooks/reduxHooks"
import useWeb3Auth from "@/utils/auth/web3Auth"
import LeaderBoardComponent from "./components/LeaderBoardComponent"
import HomeMessage from "./components/HomeMessage"

export default function Home() {
    return (
        <main className="flex items-center sm:justify-center" style={{minHeight: '85vh'}}>
            <div>
                {/*<button onClick={() => dispatch(signIn("0xd95921dd61d4e65b2df3e4bd572e953022add564"))}>
                    signin
    </button>*/}
                        {/* what if we have a title, subtitle and button? */}
                <LeaderBoardComponent homepage={true} />
            </div>
        </main>
    )
}
