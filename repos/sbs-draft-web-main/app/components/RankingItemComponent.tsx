import { positionColor } from "@/utils/helpers"
import React, { useState } from "react"
import styled from "styled-components"
import { MdDragIndicator } from "react-icons/md"

type RankingItemProps = {
    item: {
        playerId: string
        rank: number
        score: number
        stats: {
            averageScore: number
            highestScore: number
            playerId: string
            top5Finishes: number
            adp: number
            byeWeek: string
            playersFromTeam: string[]
        }
    }
}

const StyledWrapper = styled.div<{ position: string }>`
    border-left: 2px solid ${(props) => positionColor(props.position)};
    border-right: 2px solid ${(props) => positionColor(props.position)};
    border-top: 1px solid #222;
    border-bottom: 1px solid #222;
    background: #000;
    margin: 20px auto 10px auto;
    width: 900px;
    padding: 10px 0px;
    @media screen and (max-width: 900px) {
        width: 100vw;
    }
    .first-row {
        gap: 20px;
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: space-between;
        .icon {
            position: relative;
            font-size: 24px;
            bottom: 3px;
            left: 7px;
        }
        text-align: left;
    }
    .second-row {
        gap: 10px;
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: center;
        text-align: center;
        h2 {
            font-size: 12px;
            color: #888;
            text-transform: uppercase;
        }
    }
    .flex-row {
        display: flex;
        flex-grow: 1;
        flex-direction: row;
        justify-content: flex-end;
        padding-right: 15px;
        gap: 15px;
        .info {
            min-width: 40px;
            h2 {
                font-size: 12px;
                color: #888;
            }
            div {
                font-weight: bold;
            }
        }
    }
    .players {
        text-align: center;
        font-size: 12px;
        color: #888;
        margin: 10px 0px 3px 0px;
        text-transform: uppercase;
    }
    .players-from-team {
        text-align: center;
        font-size: 14px;
    }
`

const RankingItemComponent: React.FC<RankingItemProps> = (props) => {
    const [show, setShow] = useState<boolean>(false)
    const { item } = props

    return (
        <StyledWrapper onClick={() => setShow((prev) => !prev)} position={item.playerId}>
            <div>
                <div className="first-row group">
                    <div className="w-[20px] h-[20px]">
                        <MdDragIndicator className="group-hover:block hidden icon" />
                    </div>
                    <div>
                        <div className="font-primary font-bold dark:text-white text-white text-[18px]">
                            {item.playerId}
                        </div>
                    </div>
                    <div className="flex-row">
                        <div className="info">
                            <div className="dark:text-white text-white">{item.stats.byeWeek}</div>
                        </div>
                        <div className="info">
                            <div className="dark:text-white text-white">
                                {item.stats.adp === 0 ? "N/A" : item.stats.adp}
                            </div>
                        </div>
                        <div className="info">
                            <div className="dark:text-white text-white">{item.rank}</div>
                        </div>
                    </div>
                </div>
            </div>
            {show && (
                <div>
                    <div className="second-row">
                        
                    </div>
                    {item.stats.playersFromTeam && (
                        <div>
                            <div className="players">Players from team</div>
                            <div className="players-from-team dark:text-white text-white">
                                {item.stats.playersFromTeam.map((player) => {
                                    return (
                                        <span key={player} className="pr-2">
                                            {player}
                                        </span>
                                    )
                                })}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </StyledWrapper>
    )
}

export default React.memo(RankingItemComponent)
