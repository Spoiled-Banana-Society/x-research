import { createSlice } from "@reduxjs/toolkit"
import { authProps } from "../utils/types/types"
import { week, SEASON, weekOptions } from "../utils/getNFLWeek"

const padSingleDigitNum = (n : number) => {
    return String(n).padStart(2, "0")
}

const getAllGameWeeks = () : any[] => {
    const gameWeeks : any[] = [] 
    // start at last week and go to first
    weekOptions.reverse().forEach(week => {
        gameWeeks.push({
            gameWeek: `${SEASON}REG-${padSingleDigitNum(week)}`,
            title: `Week ${week}`
        })
    })

    return gameWeeks
}

const initialState: authProps = {
    isUserSignedIn: false,
    walletAddress: null,
    email: null,
    name: null,
    typeOfLogin: null,
    profileImage: undefined,
    tokensAvailable: 0,
    ethBalance: null,
    lastGameWeek: `${SEASON}REG-${padSingleDigitNum(week)}`,
    // list all game weeks here
    gameWeek: getAllGameWeeks()
}

export const authSlice = createSlice({
    name: "auth",
    initialState,
    reducers: {
        setEthBalance: (state, action) => {
            state.ethBalance = action.payload
        },
        signInWeb3Auth: (state, action) => {
            state.isUserSignedIn = true
            state.walletAddress = action.payload.walletAddress
            state.email = action.payload.email
            state.name = action.payload.name
            state.typeOfLogin = action.payload.typeOfLogin
            state.profileImage = action.payload.profileImage
        },
        signIn: (state, action) => {
            state.isUserSignedIn = true
            state.walletAddress = action.payload
            state.typeOfLogin = "thirdweb"
        },
        signOut: (state) => {
            state.isUserSignedIn = false
            state.walletAddress = null
            state.email = null
            state.name = null
            state.typeOfLogin = null
            state.profileImage = undefined
            state.ethBalance = null
        },
        setTokensAvailable: (state, action) => {
            state.tokensAvailable = action.payload
        },
    },
})

export const { signIn, signInWeb3Auth, setEthBalance, signOut, setTokensAvailable } = authSlice.actions
