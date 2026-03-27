import { useAppSelector } from "@/redux/hooks/reduxHooks";
import styled from "styled-components";
import { useTimeRemaining } from "@/hooks/useTimeRemaining";

const StyledTimer = styled.div<{ $time: number; $leagueLevel: string }>`
    color: ${(props) =>
        props.$time > 10 ? "white" : props.$leagueLevel === "Jackpot" ? "yellow" : "red"};
    font-weight: bold;
    font-size: 18px;
    margin: 5px auto 0px auto;
    text-align: center;
`;

const TimerComponent = () => {
    const timeRemaining = useTimeRemaining();
    const leagueLevel = useAppSelector((state) => state.league.leagueLevel);
    
    // Use 30 as default display value if timeRemaining is null
    const displayTime = timeRemaining ?? 30;

    // Function to format time remaining in MM:SS format
    const formatTime = (time: number) => {
        const minutes = Math.floor(time / 60);
        const seconds = time % 60;
        return `${minutes < 10 ? `0${minutes}` : minutes}:${seconds < 10 ? `0${seconds}` : seconds}`;
    };

    return (
        <div>
            <StyledTimer $time={displayTime} $leagueLevel={leagueLevel}>
                {formatTime(displayTime)}
            </StyledTimer>
        </div>
    );
};

export default TimerComponent;