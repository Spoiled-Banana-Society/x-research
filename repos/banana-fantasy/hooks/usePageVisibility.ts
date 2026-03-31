// use-page-visibility.ts
"use client"

import { useState, useEffect } from "react"

/**
 * Mirrors `document.hidden` for the current tab only.
 * Cross-tab coordination is handled separately via the localStorage heartbeat in `draft-room/page.tsx`.
 */
export default function usePageVisibility() {
    const [isHidden, setIsHidden] = useState<boolean>(
        typeof document !== "undefined" ? document.hidden : false
    )

    useEffect(() => {
        const handleVisibilityChange = () => {
            setIsHidden(document.hidden)
        }
        document.addEventListener("visibilitychange", handleVisibilityChange, false)
        return () => {
            document.removeEventListener("visibilitychange", handleVisibilityChange)
        }
    }, [])

    return isHidden
}
