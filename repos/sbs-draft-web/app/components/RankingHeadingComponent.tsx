import React from "react"
import styled from "styled-components"

const StyledWrapper = styled.div`
    background: #000;
    margin: 20px auto 0 auto;
    width: 900px;
    padding: 10px 0 0 0;
    @media screen and (max-width: 900px) {
        width: 100vw;
    }
    .first-row {
        gap: 20px;
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: space-between;
        text-align: left;
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
                font-weight: bold;
                color: #888;
            }
        }
    }
`

const RankingHeadingComponent: React.FC = () => {
    return (
        <StyledWrapper>
            <div>
                <div className="first-row group">
                    <div className="w-[20px] h-[20px]"></div>
                    <div></div>
                    <div className="flex-row">
                        <div className="info">
                            <h2>BYE</h2>
                        </div>
                        <div className="info">
                            <h2>ADP</h2>
                        </div>
                        <div className="info">
                            <h2>RANK</h2>
                        </div>
                    </div>
                </div>
            </div>
        </StyledWrapper>
    )
}

export default RankingHeadingComponent
