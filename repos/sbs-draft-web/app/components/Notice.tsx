import { motion } from "framer-motion"

export const Notice = ({notice}: {notice: any}) => {
    return (
        <motion.div
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -20, opacity: 0 }}
            className="absolute z-10 bottom-5 left-5 bg-gray-800 text-white text-xs font-primary px-2 py-1 rounded"
        >
            <h1>{notice}</h1>
        </motion.div>
    )
}