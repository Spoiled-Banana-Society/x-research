import { env } from "@/environment"
import axios, { AxiosResponse } from "axios"
import {
    LeagueDataProps,
    OwnerProps,
    PlayerStateInfo,
    RankingsProps,
    ReferralProps,
    SortState,
    UpdatedRankings,
    generatedCardProps,
} from "./types/types"
import { HTTP_DRAFT_API_URL } from "@/constants/api"
axios.defaults.headers.post["Content-Type"] = "application/json"

const getEnv = () => {
    return HTTP_DRAFT_API_URL
    switch (env) {
        case "dev":
            return 'http://localhost:7070'
        case "prod":
            return "https://sbs-drafts-api-w5wydprnbq-uc.a.run.app"
    }
}

const api = axios.create({
    baseURL: getEnv(),
})

export const Owner = {
    getOwnerById: async (walletAddress: string) => {
        try {
            const response: AxiosResponse = await api.get<OwnerProps>(`/owner/${walletAddress}`)
            return response.data
        } catch (error) {
            console.error(error)
            return error
        }
    },
    setDisplayName: async (walletAddress: string, payload: { displayName: string }) => {
        try {
            const response: AxiosResponse = await api.post(`/owner/${walletAddress}/update/displayName`, payload)
            return response.data
        } catch (error) {
            console.error(error)
            return error
        }
    },
    setPFPImage: async (walletAddress: string, payload: { imageUrl: string; nftContract: string }) => {
        try {
            if (!walletAddress) {
                throw Error("Must be logged in")
            }
            const response: AxiosResponse = await api.post(`/owner/${walletAddress}/update/pfpImage`, payload)
            return response.data
        } catch (error) {
            console.error(error)
            return error
        }
    },
    transferWinningsFromCard: async (ownerId: string, cardId: string, payload: { draftId: string; amount: number }) => {
        try {
            const response: AxiosResponse = await api.post(
                `/owner/${ownerId}/card/${cardId}/actions/prizeTransfer`,
                payload
            )
            return response.data
        } catch (error) {
            console.error(error)
            return error
        }
    }
}

export const Leagues = {
    getLeagues: async (walletAddress: string) => {
        try {
            const response: AxiosResponse = await api.get<LeagueDataProps>(`/owner/${walletAddress}/draftToken/all`)
            return response.data
        } catch (error) {
            console.error(error)
            return error
        }
    },
    getLeague: async (walletAddress: string, leagueId: string) => {
        try {
            const response: AxiosResponse = await api.get<generatedCardProps>(
                `/owner/${walletAddress}/drafts/${leagueId}`
            )
            return response.data
        } catch (error) {
            console.error(error)
            return error
        }
    },
    joinLeague: async (walletAddress: string, payload: { numLeaguesToJoin: number }) => {
        try {
            const response: AxiosResponse = await api.post(`/owner/${walletAddress}/draftToken`, payload)
            return response.data
        } catch (error) {
            console.error(error)
            return error
        }
    },
    joinDraft: async (walletAddress: string) => {
        try {

            // TODO update this to /league/live/owner/{walletAddress} once the slow start is fixed
            const response: AxiosResponse = await api.post(`/league/fast/owner/${walletAddress}`, {
                numLeaguesToJoin: 1,
            })
            return response.data
        } catch (error) {
            console.error(error)
            return error
        }
    },
    leaveDraft: async (walletAddress: string, tokenId: string, draftId: string) => {
        try {
            const response: AxiosResponse = await api.post(`/league/${draftId}/actions/leave`, {
                ownerId: walletAddress,
                tokenId,
            })
            return response.data
        } catch (error) {
            console.error(error)
            return error
        }
    },
    allLeaderboard: async (walletAddress: string, gameWeek: string, orderBy: string, level: string) => {
        try {
            const response: AxiosResponse = await api.get(
                `/league/all/${walletAddress || null}/draftTokenLeaderboard/gameweek/${gameWeek}/orderBy/${orderBy}/level/${level}`
            )
            return response.data
        } catch (error) {
            console.error(error)
            return error
        }
    },
    leagueLeaderboard: async (walletAddress: string, draftId: string, orderBy: string, gameweek: string) => {
        try {
            const response: AxiosResponse = await api.get(
                `/league/${walletAddress || null}/drafts/${draftId}/leaderboard/${orderBy}/gameweek/${gameweek}`
            )
            return response.data
        } catch (error) {
            console.error(error)
            return error
        }
    },
    hofLeaderboard: async (walletAddress: string, orderBy: string, gameweek: string) => {
        try {
            const response: AxiosResponse = await api.get(
                `/league/${walletAddress || null}/hall-of-fame/leaderboard/${orderBy}/gameweek/${gameweek}`
            )
            return response.data
        } catch (error) {
            console.error(error)
            return error
        }
    },
}

export const Rankings = {
    getRankings: async (walletAddress: string) => {
        try {
            const response: AxiosResponse = await api.get<RankingsProps[]>(`/owner/${walletAddress}/rankings/get`)
            return response.data
        } catch (error) {
            console.error(error)
            return error
        }
    },
    updateRankings: async (walletAddress: string, payload: UpdatedRankings) => {
        try {
            const response: AxiosResponse = await api.post(
                `/owner/${walletAddress}/drafts/state/rankings`,
                JSON.stringify(payload)
            )
            return response.data
        } catch (error) {
            console.error(error)
            return error
        }
    },
}

export const MintBBB = {
    token: async (walletAddress: string, payload: { minId: number; maxId: number; promoCode: string }) => {
        try {
            const response: AxiosResponse = await api.post(`/owner/${walletAddress}/draftToken/mint`, payload)
            return response.data
        } catch (error) {
            console.error(error)
            return error
        }
    },
}

export const Draft = {
    getDraftInfo: async (leagueId: string) => {
        try {
            const response: AxiosResponse = await api.get(`/draft/${leagueId}/state/info`)
            return response.data
        } catch (error) {
            console.error(error)
            return error
        }
    },
    getDraftSummary: async (leagueId: string) => {
        try {
            const response: AxiosResponse = await api.get(`/draft/${leagueId}/state/summary`)
            return response.data
        } catch (error) {
            console.error(error)
            return error
        }
    },
    getDraftRosters: async (leagueId: string) => {
        try {
            const response: AxiosResponse = await api.get(`/draft/${leagueId}/state/rosters`)
            return response.data
        } catch (error) {
            console.error(error)
            return error
        }
    },
    getPlayerRankings: async (leagueId: string, walletAddress: string) => {
        try {
            const response: AxiosResponse = await api.get(`/draft/${leagueId}/playerState/${walletAddress}`)
            return response.data
        } catch (error) {
            console.error(error)
            return error
        }
    },
    getDraftSortOrder: async (leagueId: string, walletAddress: string) => {
        try {
            const response: AxiosResponse = await api.get(`/owner/${walletAddress}/drafts/${leagueId}/state/sort`)
            return response.data
        } catch (error) {
            console.error(error)
            return error
        }
    },
    updateDraftSortOrder: async (leagueId: string, walletAddress: string, sortBy: string) => {
        try {
            const response: AxiosResponse = await api.put(`/owner/${walletAddress}/drafts/${leagueId}/state/sort/${sortBy}`)
            return response.data
        } catch (error) {
            console.error(error)
            return error
        }
    }
}

export const Referral = {
    getCode: async (walletAddress: string) => {
        try {
            const response: AxiosResponse = await api.get(`/owner/${walletAddress}/promoCode/get`)
            return response.data
        } catch (error) {
            console.error(error)
            return error
        }
    },
    updateCode: async (walletAddress: string, payload: ReferralProps) => {
        try {
            const response: AxiosResponse = await api.post(`/owner/${walletAddress}/promoCode/update`, payload)
            return response.data
        } catch (error) {
            console.error(error)
            return error
        }
    },
}

export const Settings = {
    getNFTs: async (walletAddress: string) => {
        try {
            const response: AxiosResponse = await api.get(
                `https://api.opensea.io/v2/chain/ethereum/account/${walletAddress}/nfts`,
                {
                    headers: {
                        Accept: "application/json",
                        "X-API-KEY": process.env.NEXT_PUBLIC_OPENSEA_API_KEY,
                    },
                }
            )
            return response.data
        } catch (error) {
            console.error(error)
            return error
        }
    },
    setPFP: async (url: string) => {
        try {
            const response: AxiosResponse = await api.post(`/owner/${url}/pfp/set`)
            return response.data
        } catch (error) {
            console.error(error)
            return error
        }
    },
    setDisplayName: async (name: string) => {
        try {
            const response: AxiosResponse = await api.post(`/owner/${name}/displayName/set`)
            return response.data
        } catch (error) {
            console.error(error)
            return error
        }
    },
}

export const Queue = {
    getQueue: async (walletAddress: string, draftId: string) => {
        try {
            const response: AxiosResponse = await api.get(
                `/owner/${walletAddress}/drafts/${draftId}/state/queue`,
                {
                    headers: {
                        Accept: "application/json"
                    },
                }
            )
            return response.data
        } catch (error) {
            console.error(error)
            return error
        }
    },
    setQueue: async (walletAddress: string, draftId: string, queue: PlayerStateInfo[]) => {
        try {
            const response: AxiosResponse = await api.post(`/owner/${walletAddress}/drafts/${draftId}/state/queue`, queue)
            return response.data
        } catch (error) {
            console.error(error)
            return error
        }
    }
}
