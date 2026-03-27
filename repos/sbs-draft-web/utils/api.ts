import { env } from "@/environment"
import axios, { AxiosResponse } from "axios"
import {
    DraftInfoProps,
    DraftRosterProps,
    LeagueDataProps,
    OwnerProps,
    PlayerDataProps,
    PlayerStateInfo,
    RankingsProps,
    ReferralProps,
    SortState,
    SummaryProps,
    UpdatedRankings,
    generatedCardProps,
} from "./types/types"
import { HTTP_DRAFT_API_URL } from "@/constants/api"
axios.defaults.headers.post["Content-Type"] = "application/json"

const api = axios.create({
    baseURL: HTTP_DRAFT_API_URL,
})

export const Owner = {
    getOwnerById: async (walletAddress: string): Promise<OwnerProps> => {
        try {
            const response: AxiosResponse<OwnerProps> = await api.get<OwnerProps>(`/owner/${walletAddress}`)
            return response.data
        } catch (error) {
            console.error(error)
            throw error
        }
    },
    setDisplayName: async (walletAddress: string, payload: { displayName: string }): Promise<unknown> => {
        try {
            const response: AxiosResponse = await api.post(`/owner/${walletAddress}/update/displayName`, payload)
            return response.data
        } catch (error) {
            console.error(error)
            throw error
        }
    },
    setPFPImage: async (walletAddress: string, payload: { imageUrl: string; nftContract: string }): Promise<unknown> => {
        try {
            if (!walletAddress) {
                throw Error("Must be logged in")
            }
            const response: AxiosResponse = await api.post(`/owner/${walletAddress}/update/pfpImage`, payload)
            return response.data
        } catch (error) {
            console.error(error)
            throw error
        }
    },
    transferWinningsFromCard: async (ownerId: string, cardId: string, payload: { draftId: string; amount: number }): Promise<unknown> => {
        try {
            const response: AxiosResponse = await api.post(
                `/owner/${ownerId}/card/${cardId}/actions/prizeTransfer`,
                payload
            )
            return response.data
        } catch (error) {
            console.error(error)
            throw error
        }
    }
}

export const Leagues = {
    getLeagues: async (walletAddress: string): Promise<LeagueDataProps> => {
        try {
            const response: AxiosResponse<LeagueDataProps> = await api.get<LeagueDataProps>(`/owner/${walletAddress}/draftToken/all`)
            return response.data
        } catch (error) {
            console.error(error)
            throw error
        }
    },
    getLeague: async (walletAddress: string, leagueId: string): Promise<generatedCardProps> => {
        try {
            const response: AxiosResponse<generatedCardProps> = await api.get<generatedCardProps>(
                `/owner/${walletAddress}/drafts/${leagueId}`
            )
            return response.data
        } catch (error) {
            console.error(error)
            throw error
        }
    },
    joinLeague: async (walletAddress: string, payload: { numLeaguesToJoin: number }): Promise<unknown> => {
        try {
            const response: AxiosResponse = await api.post(`/owner/${walletAddress}/draftToken`, payload)
            return response.data
        } catch (error) {
            console.error(error)
            throw error
        }
    },
    joinDraft: async (walletAddress: string): Promise<unknown> => {
        try {

            // TODO update this to /league/live/owner/{walletAddress} once the slow start is fixed
            const response: AxiosResponse = await api.post(`/league/fast/owner/${walletAddress}`, {
                numLeaguesToJoin: 1,
            })
            return response.data
        } catch (error) {
            console.error(error)
            throw error
        }
    },
    leaveDraft: async (walletAddress: string, tokenId: string, draftId: string): Promise<unknown> => {
        try {
            const response: AxiosResponse = await api.post(`/league/${draftId}/actions/leave`, {
                ownerId: walletAddress,
                tokenId,
            })
            return response.data
        } catch (error) {
            console.error(error)
            throw error
        }
    },
    allLeaderboard: async (walletAddress: string, gameWeek: string, orderBy: string, level: string): Promise<unknown> => {
        try {
            const response: AxiosResponse = await api.get(
                `/league/all/${walletAddress || null}/draftTokenLeaderboard/gameweek/${gameWeek}/orderBy/${orderBy}/level/${level}`
            )
            return response.data
        } catch (error) {
            console.error(error)
            throw error
        }
    },
    leagueLeaderboard: async (walletAddress: string, draftId: string, orderBy: string, gameweek: string): Promise<unknown> => {
        try {
            const response: AxiosResponse = await api.get(
                `/league/${walletAddress || null}/drafts/${draftId}/leaderboard/${orderBy}/gameweek/${gameweek}`
            )
            return response.data
        } catch (error) {
            console.error(error)
            throw error
        }
    },
    hofLeaderboard: async (walletAddress: string, orderBy: string, gameweek: string): Promise<unknown> => {
        try {
            const response: AxiosResponse = await api.get(
                `/league/${walletAddress || null}/hall-of-fame/leaderboard/${orderBy}/gameweek/${gameweek}`
            )
            return response.data
        } catch (error) {
            console.error(error)
            throw error
        }
    },
}

export const Rankings = {
    getRankings: async (walletAddress: string): Promise<RankingsProps[]> => {
        try {
            const response: AxiosResponse<RankingsProps[]> = await api.get<RankingsProps[]>(`/owner/${walletAddress}/rankings/get`)
            return response.data
        } catch (error) {
            console.error(error)
            throw error
        }
    },
    updateRankings: async (walletAddress: string, payload: UpdatedRankings): Promise<unknown> => {
        try {
            const response: AxiosResponse = await api.post(
                `/owner/${walletAddress}/drafts/state/rankings`,
                JSON.stringify(payload)
            )
            return response.data
        } catch (error) {
            console.error(error)
            throw error
        }
    },
}

export const MintBBB = {
    token: async (walletAddress: string, payload: { minId: number; maxId: number; promoCode: string }): Promise<unknown> => {
        try {
            const response: AxiosResponse = await api.post(`/owner/${walletAddress}/draftToken/mint`, payload)
            return response.data
        } catch (error) {
            console.error(error)
            throw error
        }
    },
}

export const Draft = {
    getDraftInfo: async (leagueId: string): Promise<DraftInfoProps> => {
        try {
            const response: AxiosResponse<DraftInfoProps> = await api.get<DraftInfoProps>(`/draft/${leagueId}/state/info`)
            return response.data
        } catch (error) {
            console.error(error)
            throw error
        }
    },
    getDraftSummary: async (leagueId: string): Promise<{ summary: SummaryProps[] }> => {
        try {
            const response: AxiosResponse<{ summary: SummaryProps[] }> = await api.get<{ summary: SummaryProps[] }>(`/draft/${leagueId}/state/summary`)
            return response.data
        } catch (error) {
            console.error(error)
            throw error
        }
    },
    getDraftRosters: async (leagueId: string): Promise<DraftRosterProps> => {
        try {
            const response: AxiosResponse<DraftRosterProps> = await api.get<DraftRosterProps>(`/draft/${leagueId}/state/rosters`)
            return response.data
        } catch (error) {
            console.error(error)
            throw error
        }
    },
    getPlayerRankings: async (leagueId: string, walletAddress: string): Promise<PlayerDataProps[]> => {
        try {
            const response: AxiosResponse<PlayerDataProps[]> = await api.get<PlayerDataProps[]>(`/draft/${leagueId}/playerState/${walletAddress}`)
            return response.data
        } catch (error) {
            console.error(error)
            throw error
        }
    },
    getDraftSortOrder: async (leagueId: string, walletAddress: string): Promise<SortState> => {
        try {
            const response: AxiosResponse<SortState> = await api.get<SortState>(`/owner/${walletAddress}/drafts/${leagueId}/state/sort`)
            return response.data
        } catch (error) {
            console.error(error)
            throw error
        }
    },
    updateDraftSortOrder: async (leagueId: string, walletAddress: string, sortBy: string): Promise<unknown> => {
        try {
            const response: AxiosResponse = await api.put(`/owner/${walletAddress}/drafts/${leagueId}/state/sort/${sortBy}`)
            return response.data
        } catch (error) {
            console.error(error)
            throw error
        }
    },
    submitPick: async (draftId: string, walletAddress: string, payload: {
        playerId: string
        displayName: string
        team: string
        position: string
    }): Promise<unknown> => {
        try {
            const response: AxiosResponse = await api.post(
                `/draft-actions/${draftId}/owner/${walletAddress}/actions/pick`,
                payload
            )
            return response.data
        } catch (error) {
            console.error(error)
            throw error
        }
    },
    getDraftPreferences: async (
        draftId: string,
        walletAddress: string
    ): Promise<{ sortBy: string; autoDraft: boolean; numPicksMissedConsecutive: number }> => {
        const response: AxiosResponse = await api.get(
            `/draft-actions/${draftId}/owner/${walletAddress}/preferences`
        )
        return response.data
    },
    patchDraftPreferences: async (
        draftId: string,
        walletAddress: string,
        body: { autoDraft: boolean }
    ): Promise<{ sortBy: string; autoDraft: boolean; numPicksMissedConsecutive: number }> => {
        const response: AxiosResponse = await api.patch(
            `/draft-actions/${draftId}/owner/${walletAddress}/preferences`,
            body
        )
        return response.data
    },
}

export const Referral = {
    getCode: async (walletAddress: string): Promise<ReferralProps> => {
        try {
            const response: AxiosResponse<ReferralProps> = await api.get<ReferralProps>(`/owner/${walletAddress}/promoCode/get`)
            return response.data
        } catch (error) {
            console.error(error)
            throw error
        }
    },
    updateCode: async (walletAddress: string, payload: ReferralProps): Promise<unknown> => {
        try {
            const response: AxiosResponse = await api.post(`/owner/${walletAddress}/promoCode/update`, payload)
            return response.data
        } catch (error) {
            console.error(error)
            throw error
        }
    },
}

export const Settings = {
    getNFTs: async (walletAddress: string): Promise<unknown> => {
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
            throw error
        }
    },
    setPFP: async (url: string): Promise<unknown> => {
        try {
            const response: AxiosResponse = await api.post(`/owner/${url}/pfp/set`)
            return response.data
        } catch (error) {
            console.error(error)
            throw error
        }
    },
    setDisplayName: async (name: string): Promise<unknown> => {
        try {
            const response: AxiosResponse = await api.post(`/owner/${name}/displayName/set`)
            return response.data
        } catch (error) {
            console.error(error)
            throw error
        }
    },
}

export const Queue = {
    getQueue: async (walletAddress: string, draftId: string): Promise<PlayerStateInfo[]> => {
        try {
            const response: AxiosResponse<PlayerStateInfo[]> = await api.get<PlayerStateInfo[]>(
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
            throw error
        }
    },
    setQueue: async (walletAddress: string, draftId: string, queue: PlayerStateInfo[]): Promise<unknown> => {
        try {
            const response: AxiosResponse = await api.post(`/owner/${walletAddress}/drafts/${draftId}/state/queue`, queue)
            return response.data
        } catch (error) {
            console.error(error)
            throw error
        }
    }
}
