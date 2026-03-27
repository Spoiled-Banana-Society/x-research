"use client"
import { useAppSelector } from "@/redux/hooks/reduxHooks"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

declare let window: any

const Wrapper = ({ children }: any) => {
    const router = useRouter()
    const walletAddress = useAppSelector((state) => state.auth.walletAddress)

    useEffect(() => {
        if (walletAddress) {
            router.push("/authenticated/leagues")
        }
    }, [walletAddress])

    return <div>{children}</div>
}

export default Wrapper
