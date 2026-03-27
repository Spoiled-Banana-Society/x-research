import { useAppSelector } from "@/redux/hooks/reduxHooks"
import { SummaryProps } from "@/utils/types/types"
import React, { useEffect, useState } from "react"
import styled from "styled-components"
import ManageBoardItemComponent from "./ManageBoardItemComponent"
import BoardItemHeading from "./BoardItemHeading"

const StyledGrid = styled.div`
    display: grid;
    grid-template-columns: repeat(10, 1fr);
    max-width: 1200px;
    margin: 0 auto;
    padding: 10px;
    overflow: scroll;
`

const ManageBoardComponent = () => {
    const draftSummary = useAppSelector((state) => state.manage.draftSummary)
    const [curatedSummary, setCuratedSummary] = useState<SummaryProps[]>([])

    // Reorder the arrangement of the array in order to generate the snake layout view

    // Function to chunk the original array into smaller arrays
    const chunkArray = (arr: SummaryProps[], size: number) => {
        const chunkedArrays = []
        for (let i = 0; i < arr.length; i += size) {
            chunkedArrays.push(arr.slice(i, i + size))
        }
        return chunkedArrays
    }

    // Function to reverse the order of the even-numbered arrays
    const reverseOddArrays = (chunkedArrays: SummaryProps[][]) => {
        return chunkedArrays.map((arr, index) => (index % 2 === 0 ? arr : arr.slice().reverse()))
    }

    useEffect(() => {
        if (draftSummary) {
            const chunkedArrays = chunkArray(draftSummary, 10)
            const reversedArrays = reverseOddArrays(chunkedArrays).flat()
            setCuratedSummary(reversedArrays)
        }
    }, [draftSummary])

    return (
        <div className="h-full">
            <StyledGrid>
                {curatedSummary!.slice(0, 10).map((item) => (
                    <BoardItemHeading item={item} key={item.playerInfo.ownerAddress} />
                ))}
                {curatedSummary!.map((item) => {
                    return <ManageBoardItemComponent item={item} key={item.playerInfo.pickNum} />
                })}
            </StyledGrid>
        </div>
    )
}

export default ManageBoardComponent
