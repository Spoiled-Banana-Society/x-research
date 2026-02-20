// use-page-visibility.ts
"use client"

import { useState, useEffect } from "react"

type Hidden = keyof Pick<Document, "hidden" | "msHidden" | "webkitHidden">
type VisibilityChange = keyof Pick<
    DocumentEventMap,
    "visibilitychange" | "msvisibilitychange" | "webkitvisibilitychange"
>
let hidden: Hidden | undefined
let visibilityChange: VisibilityChange | undefined

export default function usePageVisibility() {
    if (typeof document?.hidden !== "undefined") {
        hidden = "hidden"
        visibilityChange = "visibilitychange"
    } else if (typeof document?.msHidden !== "undefined") {
        hidden = "msHidden"
        visibilityChange = "msvisibilitychange"
    } else if (typeof document?.webkitHidden !== "undefined") {
        hidden = "webkitHidden"
        visibilityChange = "webkitvisibilitychange"
    }
    const initialHidden = hidden ? document[hidden] : false
    const [visibilityStatus, setVisibilityStatus] = useState<boolean>(initialHidden)

    useEffect(() => {
        const handleVisibilityChange = () => {
            if (hidden) setVisibilityStatus(document[hidden])
        }
        if (visibilityChange) document.addEventListener(visibilityChange, handleVisibilityChange, false)
        return () => {
            if (visibilityChange) document.removeEventListener(visibilityChange, handleVisibilityChange)
        }
    }, [])

    return visibilityStatus
}
