import { Socket } from "@/utils/webSocket"
import { env } from "@/environment"
import { DRAFT_SERVER_API_URL } from "@/constants/api"
import {
    setConnection,
    setCurrentDrafter,
    setCurrentRound,
    setGeneratedCard,
    setLeagueStatus,
    setMostRecentPlayerDrafted,
    setPickNumber,
    setPreTimer,
    setEndOfTurnTimestamp,
    setStartOfTurnTimestamp,
    setQueue,
} from "../leagueSlice"

export const socketMiddleware =
    (socket: Socket) => (params: any) => (next: any) => (action: { type: any; payload: any }) => {
        const { type, payload } = action
        const { dispatch } = params

        switch (type) {
            case "socket/connect":
                socket.connect(`${DRAFT_SERVER_API_URL}/ws?address=${payload.walletAddress}&draftName=${payload.leagueName}`)
                socket.on("open", () => {
                    console.log("Websocket connected successfully!")
                    dispatch(setLeagueStatus("ongoing"))
                })
                socket.on("message", (message: any) => {
                    const data = JSON.parse(message.data)
                    if (data.type === "countdown_update") {
                        console.log("countdown_update", data)
                        dispatch(setPreTimer(data.payload.timeRemaining))
                        dispatch(setCurrentDrafter(data.payload.currentDrafter))
                    }
                    if (data.type === "timer_update") {
                        console.log("timer_update", data)
                        dispatch(setEndOfTurnTimestamp(data.payload.endOfTurnTimestamp))
                        dispatch(setStartOfTurnTimestamp(data.payload.startOfTurnTimestamp))
                        dispatch(setCurrentDrafter(data.payload.currentDrafter))
                    }
                    if (data.type === "new_pick") {
                        dispatch(setMostRecentPlayerDrafted(data.payload))
                        if (data.payload.pickNum === 150) {
                            dispatch(setPickNumber(data.payload.pickNum))
                            dispatch(setCurrentRound(data.payload.round))
                        }
                    }
                    if (data.type === "draft_info_update") {
                        dispatch(setPickNumber(data.payload.pickNumber))
                        dispatch(setCurrentRound(data.payload.roundNum))
                    }
                    if (data.type === "final_card") {
                        console.log("final card", data.payload)
                        dispatch(setGeneratedCard(data.payload._imageUrl))
                        socket.disconnect()
                        dispatch(setLeagueStatus("completed"))
                    }
                    if (data.type === "draft_complete") {
                        // init close experience
                        console.log("draft complete", data.payload)
                        socket.disconnect()
                        dispatch(setLeagueStatus("completed"))
                    }
                })
                socket.on("close", (message) => {
                    console.log("Websocket disconnected: ", message)
                    dispatch(setConnection(true))
                })
                socket.on("error", (error) => {
                    console.log("Websocket error: ", error)
                })
                break
            case "socket/send":
                console.log(payload)
                socket.send(payload)
                break
            case "socket/disconnect":
                socket.disconnect()
                break
            default:
                break
        }
        return next(action)
    }
