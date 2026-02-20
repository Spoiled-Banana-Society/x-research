import { PayloadAction, createSlice } from "@reduxjs/toolkit"
import { mintProps } from "../utils/types/types"
import { env } from "@/environment"

// TODO: Replace price in production
const initialState: mintProps = {
    count: 1,
    price: env === 'dev' ? 0.0001 : 0.01,
}

export const mintSlice = createSlice({
    name: "mint",
    initialState,
    reducers: {
        incrementCount: (state) => {
            state.count = state.count + 1
        },
        decrementCount: (state) => {
            state.count = state.count - 1
        },
    },
})

export const { incrementCount, decrementCount } = mintSlice.actions
