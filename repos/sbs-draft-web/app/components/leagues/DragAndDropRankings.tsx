import { DragDropContext, Draggable, Droppable } from "react-beautiful-dnd"
import RankingItemComponent from "@/app/components/RankingItemComponent"
import RankingHeadingComponent from "../RankingHeadingComponent"

export const DragAndDropRankings = ({ handleDrop, rankings }: { handleDrop: any; rankings: any }) => {
    return (
        <>
            <p className="bg-slate-800 max-w-max mx-5 lg:w-[700px] p-5 rounded-md text-gray-300 mt-5 lg:mx-auto">
                Click and drag a player in the order you want to set your rankings. This order will be displayed during
                your draft. Click on a player to view more details.
            </p>
            <DragDropContext onDragEnd={handleDrop}>
                <Droppable droppableId="list-container">
                    {(provided: any) => (
                        <div className="list-container" {...provided.droppableProps} ref={provided.innerRef}>
                            <RankingHeadingComponent />
                            {rankings &&
                                rankings.map((item: any, index: number) => (
                                    <Draggable key={item.playerId} draggableId={item.playerId} index={index}>
                                        {(provided) => (
                                            <div
                                                className="item-container"
                                                ref={provided.innerRef}
                                                {...provided.dragHandleProps}
                                                {...provided.draggableProps}
                                            >
                                                <RankingItemComponent item={item} />
                                            </div>
                                        )}
                                    </Draggable>
                                ))}
                        </div>
                    )}
                </Droppable>
            </DragDropContext>
        </>
    )
}
