const db = require('./db');
const axios = require('axios');
const utils = require('./utils')

const internals = {};


const scoreOffensivePlayer = async (stats, gameStatus) => {
    let obj = {
        id: stats.PlayerID,
        name: stats.Name,
        position: stats.FantasyPosition,
        team: stats.Team,
        totalYards: 0,
        fantasySportsScore: 0,
        gameStatus: gameStatus,
        passing: {
            yards: stats.PassingYards,
            touchdowns: stats.PassingTouchdowns,
            twoPtConverstions: stats.TwoPointConversionPasses,
            interceptions: stats.PassingInterceptions,
        },
        receiving: {
            yards: stats.ReceivingYards,
            touchdowns: stats.ReceivingTouchdowns,
            twoPtConverstions: stats.TwoPointConversionReceptions,
        },
        rushing: {
            yards: stats.RushingYards,
            touchdowns: stats.RushingTouchdowns,
            twoPtConverstions: stats.TwoPointConversionRuns,
        }
    }
    let score = 0;
    score = score + (stats.PassingTouchdowns * 4);
    score = score + parseFloat((stats.PassingYards * 0.04).toFixed(2));
    if (stats.PassingYards >= 300) {
        score = score + 3;
    }
    score = score - (stats.PassingInterceptions)

    score = score + (stats.RushingTouchdowns * 6);
    score = score + parseFloat((stats.RushingYards * 0.1).toFixed(2));
    if (stats.RushingYards >= 100) {
        score = score + 3;
    }

    score = score + (stats.ReceivingTouchdowns * 6);
    score = score + parseFloat((stats.ReceivingYards * 0.1).toFixed(2));
    if (stats.ReceivingYards >= 100) {
        score = score + 3;
    }
    score = score + stats.Receptions;
    score = score - (stats.FumblesLost);
    score = score + (stats.FumbleReturnTouchdowns * 6)
    score = score + ((stats.TwoPointConversionPasses + stats.TwoPointConversionRuns + stats.TwoPointConversionReceptions) * 2);

    obj.fantasySportsScore = score;
    obj.totalYards = obj.passing.yards + obj.rushing.yards + obj.receiving.yards;

    return obj
}

const scoreTeamsDefensePlayer = async (stats, currentDSTScore, statsObj) => {
    currentDSTScore = currentDSTScore + (stats.Interceptions * 2);
    statsObj.interceptions += stats.Interceptions;
    currentDSTScore = currentDSTScore + (stats.FumblesRecovered)
    statsObj.fumbleRecoveries += stats.FumblesRecovered;
    currentDSTScore = currentDSTScore + (stats.Sacks)
    statsObj.sacks += stats.Sacks;
    currentDSTScore = currentDSTScore + (stats.FumblesForced)
    statsObj.forcedFumbles += stats.FumblesForced
    currentDSTScore = currentDSTScore + (stats.Safeties * 2);
    statsObj.safeties += stats.Safeties;
    return currentDSTScore
}

const getTeamAndPlayerStatsByTeamForWeek = async (year, week, team) => {
    const dataEndpoint = `https://api.sportsdata.io/v3/nfl/stats/json/BoxScoreByTeamFinal/${year}/${week}/${team}?key=460a86cede2748ee802fd8142325f32e`;
    let stats;

    await fetch(dataEndpoint)
        .then((response) => response.json())
        .then((async (data) => {
            stats = data
        }))
    .catch((err) => console.error(err));

    return stats
}

const getGamesForWeekFinalScore = async (year, week) => {
    const dataEndpoint = `https://api.sportsdata.io/v3/nfl/scores/json/ScoresBasicFinal/${year}/${week}?key=460a86cede2748ee802fd8142325f32e`;
    let games;

    await fetch(dataEndpoint)
        .then((response) => response.json())
        .then((async (data) => {
            games = data
        }))
    .catch((err) => console.error(err));

    return games
}

const getPlayerStatsByTeamForWeek = async (year, week, team) => {
    const dataEndpoint = `https://api.sportsdata.io/v3/nfl/stats/json/PlayerGameStatsByTeam/${year}/${week}/${team}?key=cc1e7d75df054c6c82c4ff2f02ded616`;
    let stats;

    await fetch(dataEndpoint)
        .then((response) => response.json())
        .then(async (data) => {
            stats = data
        })
    .catch((err) => console.error(err));
    

    return stats
}

const getTeamGameStats = async (year, week) => {
    const dataEndpoint = `https://api.sportsdata.io/v3/nfl/scores/json/TeamGameStats/${year}/${week}?key=cc1e7d75df054c6c82c4ff2f02ded616`;
    let teamStats;

    await fetch(dataEndpoint)
        .then((response) => response.json())
        .then(async (data) => {
            teamStats = data
        })
    .catch((err) => console.error(err));
    

    return teamStats
}

const getGamesForWeek = async (year, week) => {
    const dataEndpoint = `https://api.sportsdata.io/v3/nfl/scores/json/ScoresByWeek/${year}/${week}?key=460a86cede2748ee802fd8142325f32e`;
    let games;

    const res = await axios.get(dataEndpoint)
    //console.log(res)
    games = res
    

    return games.data
}

const scoreTeamForWeek = async (team, week, year, gameStatus) => {
    const data = await getTeamAndPlayerStatsByTeamForWeek(year, week, team);

    let dstScore = 0;

    if (!data.Score) {
        let teamScore = {
            DST: 0,
            QB: 0,
            RB: 0,
            RB2: 0,
            TE: 0,
            WR: 0,
            WR2: 0,
            GameStatus: gameStatus,
            Team: team,
        }

        let teamStats = {
            offense: {
                qb: [],
                rb: [],
                te: [],
                wr: []
            },
            defense: {
                team: team,
                fantasySportsScore: 0,
                defensiveTouchDowns: 0,
                PointsAllowed: 0,
                sacks: 0,
                interceptions: 0,
                fumbleRecoveries: 0,
                safeties: 0,
                forcedFumbles: 0,
                blockedKicks: 0,
                gameStatus: gameStatus
            }
        }
        return { teamScore: teamScore, teamStats: teamStats }
    }

    let dstStats = {
        team: team,
        fantasySportsScore: 0,
        defensiveTouchDowns: 0,
        PointsAllowed: (data.Score.HomeTeam == team) ? data.Score.AwayScore : data.Score.HomeScore,
        sacks: 0,
        interceptions: 0,
        fumbleRecoveries: 0,
        safeties: 0,
        forcedFumbles: 0,
        blockedKicks: 0,
        gameStatus: gameStatus
    };
    const QBs = [];
    const RBs = [];
    const TEs = [];
    const WRs = [];

    const stats = data.PlayerGames;

    for (let i = 0; i < stats.length; i++) {
        const playerStats = stats[i];
        if (playerStats.Team != team) {
            console.log("found player from wrong team: ", playerStats.Team)
            continue;
        }
        if (playerStats.PositionCategory == "OFF") {
            let score = await scoreOffensivePlayer(playerStats, gameStatus)
            if (playerStats.FantasyPosition == "QB") {
                QBs.push(score);
            } else if (playerStats.FantasyPosition == "RB") {
                RBs.push(score);
            } else if (playerStats.FantasyPosition == "TE") {
                TEs.push(score);
            } else if (playerStats.FantasyPosition == "WR") {
                WRs.push(score)
            }
        } else {
            dstScore = await scoreTeamsDefensePlayer(playerStats, dstScore, dstStats)
        }
    }
    
    // If game is not complete, we can skip the scoring
    if (data.FantasyDefenseGames.length === 2) {
        let index = 0;
        
        if (team == data.FantasyDefenseGames[0].Team) {
            index = 0;
        } else {
            index = 1;
        }

        dstScore = dstScore + ((data.FantasyDefenseGames[index].SpecialTeamsTouchdowns + data.FantasyDefenseGames[index].DefensiveTouchdowns) * 6);
        dstStats.defensiveTouchDowns += (data.FantasyDefenseGames[index].SpecialTeamsTouchdowns + data.FantasyDefenseGames[index].DefensiveTouchdowns);
        dstScore = dstScore + (data.FantasyDefenseGames[index].BlockedKicks * 2);
        dstStats.blockedKicks += data.FantasyDefenseGames[index].BlockedKicks;
    }

    if (dstStats.PointsAllowed == 0) {
        dstScore = dstScore + 10;
    } else if (dstStats.PointsAllowed >= 1 && dstStats.PointsAllowed <= 6) {
        dstScore = dstScore + 7;
    } else if (dstStats.PointsAllowed >= 7 && dstStats.PointsAllowed <= 13) {
        dstScore = dstScore + 4;
    } else if (dstStats.PointsAllowed >= 14 && dstStats.PointsAllowed <= 20) {
        dstScore = dstScore + 1;
    } else if (dstStats.PointsAllowed >= 1 && dstStats.PointsAllowed <= 6) {
        dstScore = dstScore + 7;
    } else if (dstStats.PointsAllowed >= 28 && dstStats.PointsAllowed <= 34) {
        dstScore = dstScore - 1;
    } else if (dstStats.PointsAllowed >= 35) {
        dstScore = dstScore - 4;
    } 

    dstStats.fantasySportsScore = dstScore;

    const sortedQBArray = QBs.sort(function (a, b) {
        return b.fantasySportsScore - a.fantasySportsScore;
    });
    //console.log(sortedQBArray)

    const sortedRBArray = RBs.sort(function (a, b) {
        return b.fantasySportsScore - a.fantasySportsScore;
    });

    const sortedTEArray = TEs.sort(function (a, b) {
        return b.fantasySportsScore - a.fantasySportsScore;
    });

    const sortedWRArray = WRs.sort(function (a, b) {
        return b.fantasySportsScore - a.fantasySportsScore;
    });

    let teamScore;
    if (sortedQBArray.length != 0) {
        teamScore = {
            DST: parseFloat((dstStats.fantasySportsScore).toFixed(2)),
            QB: parseFloat((sortedQBArray[0].fantasySportsScore).toFixed(2)),
            RB: parseFloat((sortedRBArray[0].fantasySportsScore).toFixed(2)),
            RB2: parseFloat((sortedRBArray[1].fantasySportsScore).toFixed(2)),
            TE: parseFloat((sortedTEArray[0].fantasySportsScore).toFixed(2)),
            WR: parseFloat((sortedWRArray[0].fantasySportsScore).toFixed(2)),
            WR2: parseFloat((sortedWRArray[1].fantasySportsScore).toFixed(2)),
            GameStatus: gameStatus,
            Team: team,
        }
    } else {
        teamScore = {
            DST: 0,
            QB: 0,
            RB: 0,
            RB2: 0,
            TE: 0,
            WR: 0,
            WR2: 0,
            GameStatus: gameStatus,
            Team: team,
        }
    }

    let teamStats = {
        offense: {
            qb: sortedQBArray,
            rb: sortedRBArray,
            te: sortedTEArray,
            wr: sortedWRArray
        },
        defense: dstStats
    }

    return { teamScore: teamScore, teamStats: teamStats }
}


// const scoreTeamForWeek = async (team, week, year, gameStatus, opponentScore) => {
//     const stats = await getPlayerStatsByTeamForWeek(year, week, team);

//     let dstScore = 0;

//     let dstStats = {
//         team: team,
//         fantasySportsScore: 0,
//         defensiveTouchDowns: 0,
//         PointsAllowed: opponentScore,
//         sacks: 0,
//         interceptions: 0,
//         fumbleRecoveries: 0,
//         safeties: 0,
//         forcedFumbles: 0,
//         blockedKicks: 0,
//         gameStatus: gameStatus
//     };
//     const QBs = [];
//     const RBs = [];
//     const TEs = [];
//     const WRs = [];

//     for (let i = 0; i < stats.length; i++) {
//         const playerStats = stats[i];
//         if (playerStats.PositionCategory == "OFF") {
//             let score = await scoreOffensivePlayer(playerStats, gameStatus)
//             if (playerStats.FantasyPosition == "QB") {
//                 QBs.push(score);
//             } else if (playerStats.FantasyPosition == "RB") {
//                 RBs.push(score);
//             } else if (playerStats.FantasyPosition == "TE") {
//                 TEs.push(score);
//             } else if (playerStats.FantasyPosition == "WR") {
//                 WRs.push(score)
//             }
//         } else {
//             dstScore = await scoreTeamsDefensePlayer(playerStats, dstScore, dstStats)
//         }

//         dstScore = dstScore + ((playerStats.SpecialTeamsTouchdowns + playerStats.DefensiveTouchdowns + playerStats.PuntReturnTouchdowns + playerStats.KickReturnTouchdowns + playerStats.BlockedKickReturnTouchdowns + playerStats.FieldGoalReturnTouchdowns) * 6);
//         dstStats.defensiveTouchDowns += (playerStats.SpecialTeamsTouchdowns + playerStats.DefensiveTouchdowns + playerStats.PuntReturnTouchdowns + playerStats.KickReturnTouchdowns + playerStats.BlockedKickReturnTouchdowns + playerStats.FieldGoalReturnTouchdowns);
//         dstScore = dstScore + (playerStats.BlockedKicks * 2);
//         dstStats.blockedKicks += playerStats.BlockedKicks;
//     }

//     if (opponentScore == 0) {
//         dstScore = dstScore + 10;
//     } else if (opponentScore >= 1 && opponentScore <= 6) {
//         dstScore = dstScore + 7;
//     } else if (opponentScore >= 7 && opponentScore <= 13) {
//         dstScore = dstScore + 4;
//     } else if (opponentScore >= 14 && opponentScore <= 20) {
//         dstScore = dstScore + 1;
//     } else if (opponentScore >= 1 && opponentScore <= 6) {
//         dstScore = dstScore + 7;
//     } else if (opponentScore >= 28 && opponentScore <= 34) {
//         dstScore = dstScore - 1;
//     } else if (opponentScore >= 35) {
//         dstScore = dstScore - 4;
//     } 

//     dstStats.fantasySportsScore = dstScore;

//     const sortedQBArray = QBs.sort(function (a, b) {
//         return b.fantasySportsScore - a.fantasySportsScore;
//     });
//     //console.log(sortedQBArray)

//     const sortedRBArray = RBs.sort(function (a, b) {
//         return b.fantasySportsScore - a.fantasySportsScore;
//     });

//     const sortedTEArray = TEs.sort(function (a, b) {
//         return b.fantasySportsScore - a.fantasySportsScore;
//     });

//     const sortedWRArray = WRs.sort(function (a, b) {
//         return b.fantasySportsScore - a.fantasySportsScore;
//     });

//     let teamScore
//     if (sortedQBArray.length != 0) {
//         teamScore = {
//             DST: parseFloat((dstStats.fantasySportsScore).toFixed(2)),
//             QB: parseFloat((sortedQBArray[0].fantasySportsScore).toFixed(2)),
//             RB: parseFloat((sortedRBArray[0].fantasySportsScore).toFixed(2)),
//             RB2: parseFloat((sortedRBArray[1].fantasySportsScore).toFixed(2)),
//             TE: parseFloat((sortedTEArray[0].fantasySportsScore).toFixed(2)),
//             WR: parseFloat((sortedWRArray[0].fantasySportsScore).toFixed(2)),
//             WR2: parseFloat((sortedWRArray[1].fantasySportsScore).toFixed(2)),
//             GameStatus: gameStatus,
//             Team: team,
//         }
//     } else {
//         teamScore = {
//             DST: 0,
//             QB: 0,
//             RB: 0,
//             RB2: 0,
//             TE: 0,
//             WR: 0,
//             WR2: 0,
//             GameStatus: gameStatus,
//             Team: team,
//         }
//     }

//     let teamStats = {
//         offense: {
//             qb: sortedQBArray,
//             rb: sortedRBArray,
//             te: sortedTEArray,
//             wr: sortedWRArray
//         },
//         defense: dstStats
//     }

//     return { teamScore: teamScore, teamStats: teamStats }
// }

internals.setScoresAndStats = async (week, year) => {
    const sportsDataNFLTeams = ["ARI", "ATL", "BAL", "BUF", "CAR", "CHI", "CIN", "CLE", "DAL", "DEN", "DET", "GB", "HOU", "IND", "JAX", "KC", "LAC", "LAR", "MIA", "MIN", "NE", "NO", "NYG", "NYJ", "LV", "PHI", "PIT", "SEA", "SF", "TB", "TEN", "WAS"];
    //console.log(games)

    const gameStatusData = {}
    console.log("setting scores and stats")

    const games = await getGamesForWeekFinalScore(year, week);
    for (let i = 0; i < games.length; i++) {
        const game = games[i];
        gameStatusData[game.HomeTeam] = game.Status;
        gameStatusData[game.AwayTeam] = game.Status;
    }

    let stats = {
        offense: {
            qb: [],
            rb: [],
            te: [],
            wr: [],
        },
        defense: [],
    }

    let scores = {
        FantasyPoints: []
    }

    for (let i = 0; i < sportsDataNFLTeams.length; i++) {
        const team = sportsDataNFLTeams[i];
        if (!gameStatusData[team]) {
            console.log("team not found in status map: ", team)
            continue
        }

        // get stats and score home team
        const homeRes = await scoreTeamForWeek(team, week, year, gameStatusData[team]);
        //console.log("home scores: ", homeRes)
        scores.FantasyPoints.push(homeRes.teamScore);
        stats.defense.push(homeRes.teamStats.defense);
        for(let i = 0; i < homeRes.teamStats.offense.qb.length; i++) {
            stats.offense.qb.push(homeRes.teamStats.offense.qb[i])
        }
        for(let i = 0; i < homeRes.teamStats.offense.rb.length; i++) {
            stats.offense.rb.push(homeRes.teamStats.offense.rb[i])
        }
        for(let i = 0; i < homeRes.teamStats.offense.te.length; i++) {
            stats.offense.te.push(homeRes.teamStats.offense.te[i])
        }
        for(let i = 0; i < homeRes.teamStats.offense.wr.length; i++) {
            stats.offense.wr.push(homeRes.teamStats.offense.wr[i])
        }
        console.log(`got stats and scores for ${team}`)
    }

    console.log("Finished creating stats and scores objects for all teams")

    let newScores = {
        FantasyPoints: []
    }
    const prevWeek = `${year}-${Number(week) - 1}`
    const prevScores = await db.readDocument('scores', `2023REG-01`);
    //console.log(prevScores)
    for(let i = 0; i < prevScores.FantasyPoints.length; i++) {
        let prevScoresTeam = prevScores.FantasyPoints[i].Team;
        let newScoresObj = scores.FantasyPoints.filter(x => x.Team == prevScoresTeam);
        if (newScoresObj.length != 1) {
            //console.log("adding 0 score object")
            const teamScore = {
                DST: 0,
                QB: 0,
                RB: 0,
                RB2: 0,
                TE: 0,
                WR: 0,
                WR2: 0,
                GameStatus: (!gameStatusData[prevScoresTeam]) ? "Bye" : "Scheduled",
                Team: prevScoresTeam,
            }
            newScores.FantasyPoints.push(teamScore)
        } else {
            //console.log("added new score object")
            newScores.FantasyPoints.push(newScoresObj[0])
        }
    }
    console.log("fetched scores -- pushing to db")

    //console.log(stats)
    //console.log(newScores)
    await db.createOrUpdateDocument('scores', `${year}-${week}`, newScores, false)
    console.log("updated scores document")

    await db.createOrUpdateDocument('stats', `${year}-${week}`, stats, false)
    console.log("updated stats")
}

// internals.setScoresAndStats = async (week, year) => {
//     const games = await getGamesForWeek(year, week);
//     //console.log(games)

//     let stats = {
//         offense: {
//             qb: [],
//             rb: [],
//             te: [],
//             wr: [],
//         },
//         defense: [],
//     }

//     let scores = {
//         FantasyPoints: []
//     }

//     for (let i = 0; i < games.length; i++) {
//         const game = games[i];
//         let gameStatus = game.Status;
//         if (game.IsClosed) {
//             gameStatus = "closed"
//         }
//         const awayTeam = game.AwayTeam;
//         const homeTeam = game.HomeTeam;
//         const awayScore = game.AwayScore;
//         const homeScore = game.HomeScore;

//         // get stats and score home team
//         const homeRes = await scoreTeamForWeek(homeTeam, week, year, gameStatus, awayScore);
//         console.log("home scores: ", homeRes)
//         scores.FantasyPoints.push(homeRes.teamScore);
//         stats.defense.push(homeRes.teamStats.defense);
//         for(let i = 0; i < homeRes.teamStats.offense.qb.length; i++) {
//             stats.offense.qb.push(homeRes.teamStats.offense.qb[i])
//         }
//         for(let i = 0; i < homeRes.teamStats.offense.rb.length; i++) {
//             stats.offense.rb.push(homeRes.teamStats.offense.rb[i])
//         }
//         for(let i = 0; i < homeRes.teamStats.offense.te.length; i++) {
//             stats.offense.te.push(homeRes.teamStats.offense.te[i])
//         }
//         for(let i = 0; i < homeRes.teamStats.offense.wr.length; i++) {
//             stats.offense.wr.push(homeRes.teamStats.offense.wr[i])
//         }
//         console.log(`got stats and scores for ${homeTeam}`)

//         // get stats and score away team
//         const awayRes = await scoreTeamForWeek(awayTeam, week, year, gameStatus, homeScore);
//         scores.FantasyPoints.push(awayRes.teamScore);
//         stats.defense.push(awayRes.teamStats.defense)
//         for(let i = 0; i < awayRes.teamStats.offense.qb.length; i++) {
//             stats.offense.qb.push(awayRes.teamStats.offense.qb[i])
//         }
//         for(let i = 0; i < awayRes.teamStats.offense.rb.length; i++) {
//             stats.offense.rb.push(awayRes.teamStats.offense.rb[i])
//         }
//         for(let i = 0; i < awayRes.teamStats.offense.te.length; i++) {
//             stats.offense.te.push(awayRes.teamStats.offense.te[i])
//         }
//         for(let i = 0; i < awayRes.teamStats.offense.wr.length; i++) {
//             stats.offense.wr.push(awayRes.teamStats.offense.wr[i])
//         }
//         console.log(`got stats and scores for ${awayTeam}`)
//     }

//     console.log("Finished creating stats and scores objects for all teams")

//     let newScores = {
//         FantasyPoints: []
//     }
//     const prevWeek = `${year}-${Number(week) - 1}`
//     const prevScores = await db.readDocument('scores', `2023REG-01`);
//     //console.log(prevScores)
//     for(let i = 0; i < prevScores.FantasyPoints.length; i++) {
//         let prevScoresTeam = prevScores.FantasyPoints[i].Team;
//         let newScoresObj = scores.FantasyPoints.filter(x => x.Team == prevScoresTeam);
//         if (newScoresObj.length != 1) {
//             console.log("adding 0 score object")
//             const teamScore = {
//                 DST: 0,
//                 QB: 0,
//                 RB: 0,
//                 RB2: 0,
//                 TE: 0,
//                 WR: 0,
//                 WR2: 0,
//                 GameStatus: "Scheduled",
//                 Team: prevScoresTeam,
//             }
//             newScores.FantasyPoints.push(teamScore)
//         } else {
//             console.log("added new score object")
//             newScores.FantasyPoints.push(newScoresObj[0])
//         }
//     }

//     //console.log(stats)
//     console.log(newScores)
//     await db.createOrUpdateDocument('scores', `${year}-${week}`, newScores, false)
//     console.log("updated scores document")

//    await db.createOrUpdateDocument('stats', `${year}-${week}`, stats, false)
//     console.log("updated stats")
// }


// Scoring function for draft tokens

internals.ScoreDraftTokens = async (change, context) => {
    const gameWeek = context.params.gameweek;
    const scores = change.after.data();
    const dataEndpoint = `https://sbs-cloud-functions-api-671861674743.us-central1.run.app/scoreDraftTokens`;
    let result;

    const body = {
        scores: scores.FantasyPoints,
        gameWeek: gameWeek,
    }

    let data = JSON.stringify(body);
    //data = JSON.parse(data)

    try {
        console.log("calling scoring endpoint now")
        let res = await axios.post(dataEndpoint, body)
        result = res.json()
    } catch (err) {
        console.log(err)
    }
    
        
    console.log(result)
}

module.exports = internals