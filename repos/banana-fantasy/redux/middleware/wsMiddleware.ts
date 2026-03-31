import { Socket } from "@/utils/webSocket"
import { getDraftServerUrl } from "@/lib/staging"
import type { Middleware } from "@reduxjs/toolkit"
import { logger } from '@/lib/logger';
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
} from "../leagueSlice"

type SocketAction = {
    type: string
    payload?: unknown
}

export const socketMiddleware =
    (socket: Socket): Middleware =>
    (params) =>
    (next) =>
    (action: unknown) => {
        const typedAction = action as SocketAction
        const { type, payload } = typedAction
        const { dispatch } = params

        switch (type) {
            case "socket/connect":
                const connectPayload = payload as { walletAddress: string; leagueName: string }
                socket.disconnect()
                socket.connect(
                    `${getDraftServerUrl()}/ws?address=${connectPayload.walletAddress}&draftName=${connectPayload.leagueName}`
                )
                socket.on("open", () => {
                    logger.debug("Websocket connected successfully!")
                    dispatch(setLeagueStatus("ongoing"))
                })
                socket.on("message", (event: Event) => {
                    const message = event as MessageEvent
                    let data: { type?: string; payload?: any }
                    try {
                        data = JSON.parse(message.data)
                    } catch (error) {
                        console.error("Failed to parse websocket message", error, message.data)
                        return
                    }
                    if (data.type === "countdown_update") {
                        logger.debug("countdown_update", data)
                        dispatch(setPreTimer(data.payload.timeRemaining))
                        dispatch(setCurrentDrafter(data.payload.currentDrafter))
                    }
                    if (data.type === "timer_update") {
                        logger.debug("timer_update", data)
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
                        logger.debug("final card", data.payload)
                        dispatch(setGeneratedCard(data.payload._imageUrl))
                        socket.disconnect()
                        dispatch(setLeagueStatus("completed"))
                    }
                    if (data.type === "draft_complete") {
                        // init close experience
                        logger.debug("draft complete", data.payload)
                        socket.disconnect()
                        dispatch(setLeagueStatus("completed"))
                    }
                })
                socket.on("close", (message) => {
                    logger.debug("Websocket disconnected: ", message)
                    dispatch(setConnection(false))
                })
                socket.on("error", (error) => {
                    logger.debug("Websocket error: ", error)
                })
                break
            case "socket/send":
                logger.debug(payload)
                socket.send(payload as JSON)
                break
            case "socket/disconnect":
                socket.disconnect()
                break
            default:
                break
        }
        return next(action)
    }
