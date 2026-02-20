import { useAppDispatch, useAppSelector } from "@/redux/hooks/reduxHooks"
import { setQueue } from "@/redux/leagueSlice"
import React, { useEffect } from "react"
import { DragDropContext, Draggable, Droppable } from "react-beautiful-dnd"
import QueueItemComponent from "./QueueItemComponent"
import { PlayerDataProps } from "@/utils/types/types"
import { Queue } from "@/utils/api"

type DraftQueueComponentProps = {
    availablePlayers: PlayerDataProps[],
    setAvailablePlayers: Function
}

const QueueComponent: React.FC<DraftQueueComponentProps> = (props) => {
    const { availablePlayers, setAvailablePlayers } = props
    const leagueId = useAppSelector((state) => state.league.leagueId)
    const walletAddress = useAppSelector((state) => state.auth.walletAddress)
    const queuedPlayers = useAppSelector((state) => state.league.queuedPlayers)
    const dispatch = useAppDispatch()

    const handleDrop = (droppedItem: any) => {
        if (!droppedItem.destination) return
        const updatedList = [...queuedPlayers]
        const [reorderedItem] = updatedList.splice(droppedItem.source.index, 1)
        updatedList.splice(droppedItem.destination.index, 0, reorderedItem)

        const payload = {
            type: "queue_update",
            payload: updatedList,
        }

        try {
            Queue.setQueue(walletAddress!, leagueId!, updatedList).then((res) => {
                dispatch(setQueue(res))
            })
        } catch (error) {
            console.error("Error sending payload")
        }
    }

    const getAvailablePlayer = (id: string) : PlayerDataProps | undefined => {
        const p = availablePlayers.filter(p => p.playerId === id)
        if (p.length === 1) {
            return p[0]
        }

        return undefined
    }

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
