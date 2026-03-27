import { PayloadAction, createSlice } from "@reduxjs/toolkit"
import { PlayerDataProps, PlayerStateInfo, ViewState, leagueProps, mostRecentPlayerProps } from "../utils/types/types"

const initialState: leagueProps = {
    leagueId: null,
    leagueName: null,
    leagueLevel: "Pro",
    currentRound: null,
    currentPickNumber: null,
    currentDrafter: null,
    queuedPlayers: [],
    endOfTurnTimestamp: null,
    startOfTurnTimestamp: null,
    draftStartTime: null,
    mostRecentPlayerDrafted: null,
    leagueStatus: null,
    autopick: false,
    idleCount: 0,
    canDraft: false,
    tokenId: null,
    lobbyRefresh: false,
    selectedCard: null,
    viewState: ViewState.DRAFT,
    audioOn: true,
    generatedCard: null,
    autoDraft: false,
}

export const leagueSlice = createSlice({
    name: "league",
    initialState,
    reducers: {
        setGeneratedCard: (state, action) => {
            state.generatedCard = action.payload
        },
        setAudio: (state, action: PayloadAction<boolean>) => {
            state.audioOn = action.payload
        },
        setLeagueLevel: (state, action: PayloadAction<string>) => {
            state.leagueLevel = action.payload
        },
        setLeagueId: (state, action: PayloadAction<string>) => {
            const leagueId = action.payload
            state.leagueId = leagueId
        },
        setLeagueName: (state, action: PayloadAction<string>) => {
            const leagueName = action.payload
            state.leagueName = leagueName
        },
        setPickNumber: (state, action: PayloadAction<number>) => {
            state.currentPickNumber = action.payload
        },
        setCurrentRound: (state, action: PayloadAction<number>) => {
            state.currentRound = action.payload
        },
        setCurrentDrafter: (state, action: PayloadAction<string>) => {
            state.currentDrafter = action.payload
        },
        setQueue: (state, action: PayloadAction<PlayerStateInfo[]>) => {
            state.queuedPlayers = action.payload
        },
        removeQueue: (state, action: PayloadAction<string>) => {
            state.queuedPlayers = state.queuedPlayers.filter((player) => player.playerId !== action.payload)
        },
        setEndOfTurnTimestamp: (state, action: PayloadAction<number>) => {
            state.endOfTurnTimestamp = action.payload
            console.log(`setEndOfTurnTimestamp ${action.payload}`)
        },
        setStartOfTurnTimestamp: (state, action: PayloadAction<number>) => {
            state.startOfTurnTimestamp = action.payload
            console.log(`setStartOfTurnTimestamp ${action.payload}`)
        },
        setDraftStartTime: (state, action: PayloadAction<number>) => {
            state.draftStartTime = action.payload
        },
        setMostRecentPlayerDrafted: (state, action: PayloadAction<mostRecentPlayerProps>) => {
            state.mostRecentPlayerDrafted = action.payload
        },
        setLeagueStatus: (state, action: PayloadAction<string>) => {
            state.leagueStatus = action.payload
        },
        setAutopick: (state, action: PayloadAction<boolean>) => {
            state.autopick = action.payload
        },
        setIdleCount: (state, action: PayloadAction<number>) => {
            state.idleCount = action.payload
        },
        setCanDraft: (state, action: PayloadAction<boolean>) => {
            state.canDraft = action.payload
        },
        setAutoDraft: (state, action: PayloadAction<boolean>) => {
            state.autoDraft = action.payload
        },
        setTokenId: (state, action: PayloadAction<string>) => {
            state.tokenId = action.payload
        },
        setLobbyRefresh: (state, action: PayloadAction<boolean>) => {
            state.lobbyRefresh = action.payload
        },
        setSelectedCard: (state, action: PayloadAction<string>) => {
            state.selectedCard = action.payload
        },
        setViewState: (state, action: PayloadAction<ViewState>) => {
            state.viewState = action.payload
        },
        clearLeague: (state) => {
            state.leagueId = null
            state.leagueName = null
            state.currentRound = null
            state.currentPickNumber = null
            state.currentDrafter = null
            state.queuedPlayers = []
            state.mostRecentPlayerDrafted = null
            state.leagueStatus = null
            state.autopick = false
            state.idleCount = 0
            state.canDraft = false
            state.tokenId = null
            state.lobbyRefresh = false
            state.selectedCard = null
            state.audioOn = true
            state.viewState = ViewState.DRAFT
            state.generatedCard = null
            state.draftStartTime = null
            state.endOfTurnTimestamp = null
            state.startOfTurnTimestamp = null
            state.autoDraft = false
        },
    },
})

export const {
    setQueue,
    setGeneratedCard,
    setCanDraft,
    setLobbyRefresh,
    setIdleCount,
    setLeagueId,
    setEndOfTurnTimestamp,
    setStartOfTurnTimestamp,
    setDraftStartTime,
    setLeagueName,
    setPickNumber,
    setCurrentDrafter,
    setCurrentRound,
    setLeagueStatus,
    setAutopick,
    setAudio,
    setTokenId,
    clearLeague,
    removeQueue,
    setSelectedCard,
    setViewState,
    setLeagueLevel,
    setMostRecentPlayerDrafted,
    setAutoDraft,
} = leagueSlice.actions
