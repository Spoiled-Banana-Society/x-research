"use client"
import Header from "@/app/components/Header"
import Link from "next/link"

const Welcome = () => {
    return (
        <main className="flex flex-col h-screen">
            <Header title="Welcome" />
            <div className="grow flex items-center justify-center px-5">
                <div>
                    <img
                        src="/bestball.webp"
                        alt="Banana Best Ball by SBS"
                        className="rounded border-gray-700 border w-[800px] h-auto mx-auto my-5"
                    />
                    <p className="font-primary text-center max-w-[850px]">
                        Draft your team! Best ball requires no in-season management—no waiver wire, no trades, no
                        setting lineups. Instead, your highest-scoring players are optimized to form your starting
                        lineup.
                    </p>
                    <div className="flex items-center justify-center">
                        <Link
                            href="/authenticated/leagues"
                            className="py-3 px-8 bg-primary font-primary mt-5 font-black uppercase italic text-black rounded-full hover:bg-primary-light hover:scale-105 transition-all"
                        >
                            Play Best Ball
                        </Link>
                    </div>
                </div>
            </div>
        </main>
    )
}

export default Welcome
