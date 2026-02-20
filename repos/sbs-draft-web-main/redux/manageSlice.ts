import { PayloadAction, createSlice } from "@reduxjs/toolkit"
import { ViewState, manageProps } from "../utils/types/types"

const initialState: manageProps = {
    manageState: ViewState.LEADERBOARD,
    draftPlayerRankings: null,
    draftSummary: null,
    draftRosters: null,
    leagueId: null,
    selectedCard: null,
}

export const manageSlice = createSlice({
    name: "manage",
    initialState,
    reducers: {
        setManageView: (state, action: PayloadAction<ViewState>) => {
            state.manageState = action.payload
        },
        setManageDraftSummary: (state, action) => {
            state.draftSummary = action.payload
        },
        setManageDraftRosters: (state, action) => {
            state.draftRosters = action.payload
        },
        setManageDraftRankings: (state, action) => {
            state.draftPlayerRankings = action.payload
        },
        setManageLeagueId: (state, action) => {
            state.leagueId = action.payload
        },
        clearManage: (state) => {
            state.manageState = ViewState.DRAFT
        },
        setManageSelectedCard: (state, action) => {
            state.selectedCard = action.payload
        },
    },
})

export const {
    setManageView,
    clearManage,
    setManageLeagueId,
    setManageDraftSummary,
    setManageDraftRosters,
    setManageDraftRankings,
    setManageSelectedCard,
} = manageSlice.actions
