import React, { useState, useCallback, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"

type Toast = {
    id: number
    message: string
}

let toastId = 0
const toastListeners = new Set<(toasts: Toast[]) => void>()
let toasts: Toast[] = []

const notify = (message: string) => {
    const id = toastId++
    toasts = [...toasts, { id, message }]
    toastListeners.forEach(listener => listener([...toasts]))
    setTimeout(() => {
        toasts = toasts.filter(t => t.id !== id)
        toastListeners.forEach(listener => listener([...toasts]))
    }, 3000)
}

export const useToast = () => {
    const [toastList, setToastList] = useState<Toast[]>([])

    useEffect(() => {
        toastListeners.add(setToastList)
        setToastList([...toasts])
        return () => {
            toastListeners.delete(setToastList)
        }
    }, [])

    return {
        toast: useCallback((message: string) => notify(message), []),
        toasts: toastList,
    }
}

export const ToastContainer: React.FC = () => {
    const { toasts } = useToast()
    
    return (
        <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2">
            <AnimatePresence>
                {toasts.map((toast) => (
                    <motion.div
                        key={toast.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="bg-red-600 text-white px-4 py-2 rounded shadow-lg font-primary text-sm"
                    >
                        {toast.message}
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    )
}
