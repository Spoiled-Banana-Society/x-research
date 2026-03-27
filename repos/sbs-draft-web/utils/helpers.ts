import exp from "constants"
import { SummaryProps } from "@/utils/types/types"

export const COLORS = {
    primary: "#F3E216",
    secondary: "#444262",
    tertiary: "#FF7754",
    black: "#000000",
    offBlack: "#222",
    grey: "#83829A",
    darkGrey: "#222222",
    white: "#F3F4F8",
    lightWhite: "#FAFAFC",
    qb: "#FF474C",
    rb: "#3c9120",
    wr: "#cb6ce6",
    te: "#326cf8",
    dst: "#DF893E",
}

export function classNames(...classes: string[]) {
    return classes.filter(Boolean).join(" ")
}

export const truncate = (string: string, limiter = 11) => {
    if (!string) return
    if (string.length >= limiter) {
        const truncatedString = string.slice(0, 5) + "." + string.slice(-4)
        return truncatedString
    }
    return string
}

export const truncateDisplayName = (string: string, limiter = 15) => {
    if (!string) return
    if (string.length >= limiter) {
        const truncatedString = string.slice(0, 15) + "..."
        return truncatedString
    }
    return string
}

export const positionColor = (position: string) => {
    const withoutHyphenation = position.substring(position.indexOf("-") + 1)
    switch (withoutHyphenation) {
        case "QB":
            return COLORS.qb
        case "RB1":
        case "RB2":
        case "RB":
            return COLORS.rb
        case "WR1":
        case "WR2":
        case "WR":
            return COLORS.wr
        case "TE":
            return COLORS.te
        case "DST":
            return COLORS.dst
    }
}

export const isWalletAddress = (address: string) => {
    return new RegExp("^(0x)?[0-9a-fA-F]{40}$").test(address)
}

// Returns properly truncated displayName if set and is not a wallet address
export const getTruncatedAccountName = (displayName: string, walletAddress: string) => {
    let label = truncate(walletAddress)

    if (displayName && displayName !== "" && !isWalletAddress(displayName)) {
        label = truncateDisplayName(displayName)
    }

    return label
}
