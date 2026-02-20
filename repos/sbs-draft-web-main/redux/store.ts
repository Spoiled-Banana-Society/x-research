import { configureStore } from "@reduxjs/toolkit"
import { authSlice } from "./authSlice"
import { Socket } from "../utils/webSocket"
import { leagueSlice } from "./leagueSlice"
import { draftSlice } from "./draftSlice"
import { manageSlice } from "./manageSlice"
import { socketMiddleware } from "./middleware/wsMiddleware"
import { mintSlice } from "./mintSlice"

const socket = new Socket()

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch

export const store = configureStore({
    reducer: {
        auth: authSlice.reducer,
        league: leagueSlice.reducer,
        draft: draftSlice.reducer,
        manage: manageSlice.reducer,
        mint: mintSlice.reducer,
    },
    middleware: [socketMiddleware(socket)],
})
