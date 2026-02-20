import { motion } from "framer-motion"
import { useAppSelector } from "@/redux/hooks/reduxHooks"

export const LeaveModal = ({
    leaveDraft,
    leavingLeague,
    setShowLeaveModal,
                           }: {
                            leaveDraft: any,
                            leavingLeague: any,
                            setShowLeaveModal: any
                           }) => {
    const walletAddress = useAppSelector((state) => state.auth.walletAddress)

    return (
        <motion.div
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
            className="absolute z-10 w-screen h-screen flex items-center justify-center  text-white font-primary px-2 py-1 rounded"
        >
            <div className="bg-gray-800 p-5 text-center">
                <h1>Are you sure you want to leave this league?</h1>
                <h2 className="py-5 font-bold">{leavingLeague!._leagueDisplayName}</h2>
                <div className="flex items-center justify-center gap-10">
                    <div>
                        <button className="border border-white py-1 px-2" onClick={() => setShowLeaveModal(false)}>
                            Go Back
                        </button>
                    </div>
                    <div>
                        <button
                            onClick={() => {
                                leaveDraft(
                                    walletAddress!,
                                    leavingLeague!._cardId,
                                    leavingLeague!._leagueId,
                                    leavingLeague!._leagueDisplayName,
                                )
                                setShowLeaveModal(false)
                            }}
                            className="bg-red-600 py-1 px-2 text-black font-bold"
                        >
                            Leave
                        </button>
                    </div>
                </div>
            </div>
        </motion.div>
    )
}