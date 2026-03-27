import { configureStore } from "@reduxjs/toolkit"
import { authSlice } from "./authSlice"
import { leagueSlice } from "./leagueSlice"
import { draftSlice } from "./draftSlice"
import { manageSlice } from "./manageSlice"
import { mintSlice } from "./mintSlice"

export const store = configureStore({
    reducer: {
        auth: authSlice.reducer,
        league: leagueSlice.reducer,
        draft: draftSlice.reducer,
        manage: manageSlice.reducer,
        mint: mintSlice.reducer,
    },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
