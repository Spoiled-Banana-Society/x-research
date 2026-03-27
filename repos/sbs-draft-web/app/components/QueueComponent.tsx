import { useAppDispatch, useAppSelector } from "@/redux/hooks/reduxHooks"
import { setQueue, removeQueue } from "@/redux/leagueSlice"
import React, { useEffect } from "react"
import { DragDropContext, Draggable, Droppable } from "react-beautiful-dnd"
import QueueItemComponent from "./QueueItemComponent"
import { PlayerDataProps, PlayerStateInfo } from "@/utils/types/types"
import { Queue } from "@/utils/api"
import { useToast } from "@/hooks/useToast"

type DraftQueueComponentProps = {
    availablePlayers: PlayerDataProps[],
    setAvailablePlayers: Function
}

const QueueComponent: React.FC<DraftQueueComponentProps> = (props) => {
    const { availablePlayers, setAvailablePlayers } = props
    const leagueId = useAppSelector((state) => state.league.leagueId)
    const walletAddress = useAppSelector((state) => state.auth.walletAddress)
    const queuedPlayers = useAppSelector((state) => state.league.queuedPlayers)
    const mostRecentPlayerDrafted = useAppSelector((state) => state.league.mostRecentPlayerDrafted)
    const dispatch = useAppDispatch()
    const { toast } = useToast()

    const handleDrop = async (droppedItem: any) => {
        if (!droppedItem.destination) return
        const previousQueue = [...queuedPlayers]
        const updatedList = [...queuedPlayers]
        const [reorderedItem] = updatedList.splice(droppedItem.source.index, 1)
        updatedList.splice(droppedItem.destination.index, 0, reorderedItem)

        // Optimistic update
        dispatch(setQueue(updatedList))
        
        try {
            const res = await Queue.setQueue(walletAddress!, leagueId!, updatedList)
            dispatch(setQueue(res as PlayerStateInfo[]))
        } catch (error) {
            // Rollback optimistic update
            dispatch(setQueue(previousQueue))
            console.error("Error updating queue:", error)
            toast("Failed to reorder queue. Please try again.")
        }
    }

    const getAvailablePlayer = (id: string) : PlayerDataProps | undefined => {
        const p = availablePlayers.filter(p => p.playerId === id)
        if (p.length === 1) {
            return p[0]
        }

        return undefined
    }

    // Remove drafted player from queue when lastPick is updated via real-time draft info
    // This uses the lastPick data from Firebase Realtime Database to directly update the queue
    useEffect(() => {
        if (mostRecentPlayerDrafted && queuedPlayers.length > 0) {
            // Check if the recently drafted player is in the queue
            const playerInQueue = queuedPlayers.some(
                (player) => player.playerId === mostRecentPlayerDrafted.playerId
            )
            
            if (playerInQueue) {
                // Remove the drafted player from the queue
                dispatch(removeQueue(mostRecentPlayerDrafted.playerId))
            }
        }
    }, [mostRecentPlayerDrafted, queuedPlayers, dispatch])

    // Filter out already-drafted players from queue
    // This handles cases where a player in the queue has been drafted by someone else
    // or was auto-picked, ensuring the queue only contains available players
    // This is a fallback mechanism in addition to the direct removal above
    useEffect(() => {
        if (availablePlayers && queuedPlayers.length > 0) {
            const availablePlayerIds = new Set(availablePlayers.map(p => p.playerStateInfo.playerId))
            const filteredQueue = queuedPlayers.filter((queuedPlayer) => 
                availablePlayerIds.has(queuedPlayer.playerId)
            )
            
            // Only update if queue actually changed (to avoid infinite loops)
            if (filteredQueue.length !== queuedPlayers.length) {
                dispatch(setQueue(filteredQueue))
            }
        }
    }, [availablePlayers, queuedPlayers, dispatch])

    console.log("queuedPlayers", queuedPlayers)

    return (
        <div>
            {queuedPlayers.length > 0 ? (
                <DragDropContext onDragEnd={handleDrop}>
                    <Droppable droppableId="list-container">
                        {(provided) => (
                            <div className="list-container" {...provided.droppableProps} ref={provided.innerRef}>
                                {queuedPlayers &&
                                    queuedPlayers.map((player, index) => {
                                        const fullPlayer = getAvailablePlayer(player.playerId)
                                        if (!fullPlayer) return ''

                                        return (
                                            <Draggable key={player.playerId} draggableId={player.playerId} index={index}>
                                                {(provided) => (
                                                    <div
                                                        className="item-container"
                                                        ref={provided.innerRef}
                                                        {...provided.dragHandleProps}
                                                        {...provided.draggableProps}
                                                    >
                                                        <QueueItemComponent player={fullPlayer} />
                                                    </div>
                                                )}
                                            </Draggable>
                                        )
                                    })}
                            </div>
                        )}
                    </Droppable>
                </DragDropContext>
            ) : (
                <h1 className="font-primary text-center italic mt-16 text-gray-300">
                    Nothing here but us apes! 🦍 <br /> Queue players from the Draft section.
                </h1>
            )}
        </div>
    )
}

export default QueueComponent
