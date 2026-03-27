import { PayloadAction, createSlice } from "@reduxjs/toolkit"
import { DraftInfoProps, draftSliceProps, SortState } from "@/utils/types/types"

const initialState: draftSliceProps = {
    draftInfo: null,
    draftSummary: null,
    draftRosters: null,
    draftPlayerRankings: null,
    sortBy: SortState.ADP
}

export const draftSlice = createSlice({
    name: "draft",
    initialState,
    reducers: {
        setDraftInfo: (state, action: PayloadAction<DraftInfoProps>) => {
            state.draftInfo = action.payload
        },
        setDraftSummary: (state, action) => {
            state.draftSummary = action.payload
        },
        setDraftRosters: (state, action) => {
            state.draftRosters = action.payload
        },
        setDraftRankings: (state, action) => {
            state.draftPlayerRankings = action.payload
        },
        clearDraft: (state) => {
            state.draftInfo = null
            state.draftSummary = null
            state.draftRosters = null
            state.draftPlayerRankings = null
        },
        setDraftSort: (state, action) => {
            state.sortBy = action.payload
        }
    },
})

export const { setDraftInfo, clearDraft, setDraftSummary, setDraftRosters, setDraftRankings, setDraftSort } = draftSlice.actions
