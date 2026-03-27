import { AiFillCloseCircle } from "react-icons/ai"
import styled from "styled-components"
import { motion } from "framer-motion"
import { useState } from "react"

const StyledBBBModal = styled(motion.div)`
    width: 100%;
    height: auto;
    position: relative;
    z-index: 30;

    .modal {
        left: 50%;
        position: absolute;
        transform: translate(-50%, 50%);
        background: #111;
        padding: 30px;
        height: 500px;
        overflow: scroll;

        .close {
            position: absolute;
            top: 5px;
            right: 5px;
            font-size: 21px;
        }

        h1 {
            font-weight: bold;
            font-size: 30px;
            padding-bottom: 5px;
        }

        h2 {
            font-weight: bold;
            font-size: 21px;
            padding: 15px 0px 5px 0px;
        }

        h3 {
            font-weight: bold;
            font-size: 19px;
            padding: 15px 0px 5px 0px;
        }
    }
`

export const BBBModal = () => {
    const [showBBBModal, setShowBBBModal] = useState<boolean>(false)

    if (!showBBBModal) return null

    return (
        <StyledBBBModal animate={{ y: 0, opacity: 1 }} exit={{ y: -20, opacity: 0 }}>
            <div className="modal">
                <AiFillCloseCircle className="close" onClick={() => setShowBBBModal(false)} />
                <h1>Banana Best Ball III Rules</h1>
                <h2>Current entrants: TBA</h2>
                <ul>
                    <li>Game Type: Best Ball</li>
                    <li>Tournament Rounds: 4</li>
                    <li>Draft Size: 10</li>
                    <li>Draft Rounds: 15</li>
                    <li>Pick Clock: 30 seconds</li>
                </ul>
                <h2>Roster Size</h2>
                <ul>
                    <li>QB: 1</li>
                    <li>RB: 2</li>
                    <li>WR: 2</li>
                    <li>TE: 1</li>
                    <li>Flex: 1</li>
                    <li>DST: 1</li>
                    <li>Bench: 7 players of any position</li>
                </ul>
                <h2>Tournament Prize Breakdown</h2>
                <h3>Seasonal/Weekly Prizes*</h3>
                <ul>
                    <li>*Prizes will vary based on number of entrants</li>
                    <li>*Guaranteed Mutant Ape for 1st place</li>
                    <li>*If 10,000 sold then Bored Ape for 1st place</li>
                </ul>
                <h2>Banana Best Ball III Example Prize Pool</h2>
                <div className="grid w-full md:w-[600px] grid-cols-2 gap-3">
                    <div>Entrants</div>
                    <div>2,000</div>
                    <div>Prize Pool</div>
                    <div>30</div>
                </div>
                <div className="grid w-full md:w-[600px] grid-cols-2 gap-3 mt-5">
                    <div className="font-bold">Breakdown</div>
                    <div>2,000 Entrants</div>
                    <div className="font-bold">Place</div>
                    <div>Prize</div>
                    <div className="font-bold">1st</div>
                    <div>6</div>
                    <div className="font-bold">2nd</div>
                    <div>3</div>
                    <div className="font-bold">3rd</div>
                    <div>1.500</div>
                    <div className="font-bold">4th</div>
                    <div>0.750</div>
                    <div className="font-bold">5th</div>
                    <div>0.400</div>
                    <div className="font-bold">6th</div>
                    <div>0.320</div>
                    <div className="font-bold">7th</div>
                    <div>0.240</div>
                    <div className="font-bold">8th</div>
                    <div>0.135</div>
                    <div className="font-bold">9th</div>
                    <div>0.090</div>
                    <div className="font-bold">10th</div>
                    <div>0.080</div>
                    <div className="font-bold">Elimination Round 3 11th - 50th</div>
                    <div>0.024</div>
                    <div className="font-bold">Elimination Round 2 51st - 400th</div>
                    <div>0.021</div>
                </div>
                <h3>Weekly Prizes</h3>
                <div className="grid w-full md:w-[600px] grid-cols-2 gap-3 mt-5">
                    <div className="font-bold">Place</div>
                    <div>Prize</div>
                    <div className="font-bold">1st</div>
                    <div>0.150</div>
                    <div className="font-bold">2nd</div>
                    <div>0.100</div>
                    <div className="font-bold">3rd</div>
                    <div>0.080</div>
                    <div className="font-bold">4th</div>
                    <div>0.060</div>
                    <div className="font-bold">5th</div>
                    <div>0.050</div>
                    <div className="font-bold">6th</div>
                    <div>0.045</div>
                    <div className="font-bold">7th</div>
                    <div>0.040</div>
                    <div className="font-bold">8th</div>
                    <div>0.030</div>
                    <div className="font-bold">9th</div>
                    <div>0.020</div>
                    <div className="font-bold">10th</div>
                    <div>0.010</div>
                </div>
                <h3>Hall of Fame</h3>
                <div className="grid w-full md:w-[600px] grid-cols-2 gap-3 mt-5">
                    <div className="font-bold">Place</div>
                    <div>Prize</div>
                    <div className="font-bold">1st</div>
                    <div>0.500</div>
                    <div className="font-bold">2nd</div>
                    <div>0.250</div>
                    <div className="font-bold">3rd</div>
                    <div>0.100</div>
                </div>
                <h2>Tournament Schedule</h2>
                <p>Round 1: Weeks 1-14</p>
                <p>Round 2: Week 15</p>
                <p>Round 2: Week 16</p>
                <p>Championship Round:: Week 17</p>

                <h2>Scoring</h2>
                <h3>Offense</h3>
                <ul>
                    <li>Passing TD = +4 Pts</li>
                    <li>Passing Yards = +0.04 Pts/ Yard</li>
                    <li>300+ Yard Passing Game = +3 Pts</li>
                    <li>Interception = -1 Pt</li>
                    <li>Rushing TD = +6 Pts</li>
                    <li>Rushing Yards = +0.1 Pts/Yard</li>
                    <li>100+ Yard Rushing Game = +3 Pts</li>
                    <li>Receiving TD =+6 Pts</li>
                    <li>Receiving Yards = +0.1 Pts/Yard</li>
                    <li>100+ Receiving Yard Game = +3 Pts</li>
                    <li>Reception =+1 Pt</li>
                    <li>Fumble Lost = -1 Pt</li>
                    <li>2 Pt Conversion (Pass, Run, or Catch) =+2 Pts</li>
                    <li>Offensive Fumble Recovery TD = +6 Pts</li>
                </ul>

                <h3>Defense/Special Teams</h3>
                <ul>
                    <li>Defense TD = 6</li>
                    <li>Points Allowed 0 = 10</li>
                    <li>Points Allowed 1-6 = 7</li>
                    <li>Points Allowed 7-13 = 4</li>
                    <li>Points Allowed 14-20 = 1</li>
                    <li>Points Allowed 28-34 = -1</li>
                    <li>Points Allowed 35+ = -4</li>
                    <li>Sacks = 1</li>
                    <li>Interceptions = 2</li>
                    <li>Fumble Recovery = 2</li>
                    <li>Safety = 2</li>
                    <li>Force Fumble = 1</li>
                    <li>Blocked Kick = 2</li>
                    <li>Punt/Kickoff/FG Return for TD = +6 Pts</li>
                </ul>

                <h2>Hall of Fame (HOF) Leagues</h2>
                <p>
                    In addition to the main prize pools, 1% of drafts will turn into Hall of Fame drafts after a
                    draft fills. All cards in the HOF draft will become HOF teams competing for even more prizes
                    alongside the main prize pools.
                </p>
                <h2>Contest Rules</h2>
                <p>
                    To ensure fair play, we have outlined the rules for the Banana Best Ball contest below, which
                    are governed by our Terms of Use and Privacy Policy. General Contest Information:
                </p>
                <ul className="list-disc">
                    <li className="pb-4">
                        To join a Banana Best Ball III draft, you must be a Spoiled Banana Society member by obtaining a
                        Banana Best Ball III Draft Pass.
                    </li>
                    <li className="pb-4">
                        The entry to the Tournament will be closed before the start of the 1st game of Week3 of the
                        2023 NFL season.
                    </li>
                    <li className="pb-4">
                        Entrants participate in a snake draft, where the pick order is reversed each round. This
                        means that the person with the first pick in round 1 will have the last pick in round 2 and
                        so on.
                    </li>
                    <li className="pb-4">
                        Entrants will draft a team of players who will earn points based on their statistical
                        performance during the contest period.
                    </li>
                    <li className="pb-4">
                        Once the draft is completed, the rosters are set, and there will be no waivers, lineup
                        setting, or trades allowed throughout the contest period.
                    </li>
                    <li className="pb-4">
                        At the end of each NFL week, the system will automatically select the entrant&apos;s
                        highest-scoring players at the designated positions to be &quot;starters,&quot; and only
                        their statistics for that week will count towards the entrant&apos;s total score. So,
                        entrants don&apos;t need to set their lineups manually.
                    </li>
                    <li className="pb-4">
                        For example, if you have as one of your properties, Seattle WR1, you will earn the points
                        associated with the Seattle WR that scores the most points for that given week. (If the
                        Seattle backup WR scores 18 points and the starting WR scores 15 points, you will get the
                        higher score of 18.)(Alternatively if you have Seattle WR2 you will get the 15 points scored
                        by the starter).
                    </li>
                    <li className="pb-4">
                        The top 10 scores for each week will be awarded prizes as described above. In the event of a
                        tie, prizes will be combined and split evenly among the entries that are tied.
                    </li>
                    <li className="pb-4">
                        Approximately, 1% of the leagues will be designated as a &quot;Hall of Fame&quot; league.
                        The designation is randomly assigned, and users will be notified at the beginning of their
                        draft that their league has achieved &quot;Hall of Fame&quot; status. Hall of Fame Leagues
                        have a separate Tournament Prize Pool allocation in addition to the Weekly and Tournament
                        prizes available to other Banana Best Ball entries.
                    </li>
                    <li className="pb-4">
                        The Tournament will be structured in four rounds, with each round containing specific player
                        groups. Size and structure of each group subject to change based on final # of entrants.
                    </li>
                    <li className="pb-4">Round 1 (Weeks 1-14): 10-person groups</li>
                    <li className="pb-4">
                        Round 2: (Week 15): Size of groups will be determined based on number of Round 1 groups
                    </li>
                    <li className="pb-4">
                        Round 3: (Week 16): 10 groups of equal size based on number of Round 2 groups
                    </li>
                    <li className="pb-4">Round 4: (Week 17): Winners of each Round 3 group</li>
                    <li className="pb-4">
                        At the end of Round 1, the top two performing entries in each group will advance to Round 2
                        and receive prizes as described above. In the event of a tie, the entry with the highest
                        scoring player for the entire Round 1 will advance to Round 2.
                    </li>
                    <li className="pb-4">
                        At the end of Round 2, the top-performing entry from each group will advance to Round 3. If
                        there are less than 50 Round 2 groups, then the highest scoring non-winners will advance
                        until there are 50 entrants advanced to Round 3. In the event of a tie, the entry with the
                        highest scoring player in Round 2 will advance to Round 3.
                    </li>
                    <li className="pb-4">
                        At the end of Round 3, the top-performing entry from each group will advance to Round 4 and
                        be awarded a prize as described below. Round 4 will consist of 10 entries in a single
                        10-person group. In the event of a tie, the entry with the highest scoring player in Round 3
                        will advance to Round 4.
                    </li>
                    <li className="pb-4">
                        At the end of Round 4, the top-performing entry from the group will be crowned the Grand
                        Prize winner, and prizes will be awarded to all entries in Round 4 as described above. In
                        the event of a tie, the entry with the highest scoring player in Round 4 will be placed in
                        the higher position.
                    </li>
                </ul>
                <h2>Multiple Accounts and Collusion</h2>
                <p>
                    Each user is allowed to maintain only one account. Engaging in &quot;Multi-accounting&quot; or
                    collaborating with other entrants is strictly forbidden. If it is determined, at Spoiled Banana
                    Society sole discretion, that a user has opened, maintained, used, colluded with, or controlled
                    multiple accounts, we reserve the right to terminate or suspend any or all of their accounts and
                    may also revoke or withhold any prizes they have won.
                </p>
                <h2>Canceling Entries</h2>
                <p>
                    Spoiled Banana Society allows entrants to cancel their entries, provided that the draft they are
                    trying to join has not yet been filled. In such cases, participants can remove themselves from
                    the draft before it reaches its capacity.
                </p>
            </div>
        </StyledBBBModal>
    )
}