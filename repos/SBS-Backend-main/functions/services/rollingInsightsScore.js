const db = require('./db');
const axios = require('axios');
const utils = require('./utils')

const internals = {};

const hardcoded_boosts = {
    1: {
        "BAL-DST": {
            fumblesForced: 1
        },
        "KC-DST": {
            fumblesForced: 1
        },
        "LV-DST": {
            fumblesForced: 1
        },
        "NYJ-DST": {
            fumblesForced: 1
        },
        "WAS-DST": {
            fumblesForced: 1
        },
        "BUF-DST": {
            fumblesForced: 2
        },
    },
    2: {
        "BUF-DST": {
            fumblesForced: 3
        },
        "SF-DST": {
            fumblesForced: 2
        },
        "PHI-DST": {
            fumblesForced: 1
        },
        "HOU-DST": {
            fumblesForced: 1
        },
        "NYJ-DST": {
            fumblesForced: 1
        },
        "CLE-DST": {
            fumblesForced: 1
        },
    },
    3: {
        "MIN-DST": {
            fumblesForced: 5
        },
        "DEN-DST": {
            fumblesForced: 1
        },
        "NE-DST": {
            fumblesForced: 1
        },
        "SF-DST": {
            fumblesForced: 1
        },
        "CLE-DST": {
            fumblesForced: 1
        },
        "CIN-DST": {
            fumblesForced: 1
        },
        "NYG-DST": {
            fumblesForced: 2
        },
        "NYJ-DST": {
            fumblesForced: 1,
            specialTeamsTds: 1
        },
        "PHI-DST": {
            specialTeamsTds: 1
        },
        "ARI-DST": {
            safeties: 1
        },
        "DET-DST": {
            fumblesForced: 2
        }
    },
    4: {
        "JAX-DST": {
            fumblesForced: 3
        },
        "PHI-DST": {
            fumblesForced: 2
        },
        "PIT-DST": {
            fumblesForced: 2
        },
        "ATL-DST": {
            fumblesForced: 2
        },
        "NE-DST": {
            fumblesForced: 1
        },
        "LAR-DST": {
            fumblesForced: 1
        },
        "MIN-DST": {
            fumblesForced: 1
        },
        "WAS-DST": {
            fumblesForced: 1
        },
        "LAC-DST": {
            fumblesForced: 1
        },
        "TB-DST": {
            fumblesForced: 1
        },
        "SF-DST": {
            fumblesForced: 1
        },
        "BUF-DST": {
            fumblesForced: 1
        },
        "LV-DST": {
            fumblesForced: 1
        },
        "NYJ-DST": {
            fumblesForced: 1
        },
    },
    5: {
        "DET-DST": {
            fumblesForced: 2
        }
    },
    6: {
        "DAL-DST": {
            fumblesForced: 2
        },
        "NYJ-DST": {
            fumblesForced: 2
        },
        "MIA-DST": {
            fumblesForced: 2
        },
        "TB-DST": {
            fumblesForced: 1
        },
        "DET-DST": {
            fumblesForced: 1
        },
        "KC-DST": {
            fumblesForced: 1
        },
        "NO-DST": {
            fumblesForced: 1
        },
        "CLE-DST": {
            fumblesForced: 1
        },
        "ATL-DST": {
            fumblesForced: 1
        }
    },
    7: {
        "CLE-DST": {
            fumblesForced: 1,
        },
        "LAR-DST": {
            fumblesForced: 1,
        },
        "ARI-DST": {
            fumblesForced: 1,
        },
        "LV-DST": {
            fumblesForced: 1,
        },
        "DET-DST": {
            fumblesForced: 1,
        },
    },
    8: {
        "LAC-DST": {
            fumblesForced: 1,
        },
        "DEN-DST": {
            fumblesForced: 1,
        },
        "CHI-DST": {
            fumblesForced: 1,
        },
        "PIT-DST": {
            fumblesForced: 1,
        },
        "NO-DST": {
            fumblesForced: 2,
        },
        "CLE-DST": {
            fumblesForced: 2,
        },
        "WAS-DST": {
            fumblesForced: 2,
        },
        "KC-DST": {
            fumblesForced: 1,
        }
    }
}

const getStatEdits = (stats, k, week) => {
    if (hardcoded_boosts[week] && hardcoded_boosts[week][k]) {

        return {
            ...stats,
            ...hardcoded_boosts[week][k]
        }
    }

    return stats
}

const scoreOffensivePlayer = async (stats, team, debug=false, week) => {
    stats = getStatEdits(stats, `${team}-${stats.position}`, week)

    let obj = {
        name: stats.player,
        position: stats.position,
        team: team,
        totalYards: 0,
        fantasySportsScore: 0,
        passing: {
            yards: stats.passing_yards || 0,
            touchdowns: stats.passing_touchdowns || 0,
            twoPtConverstions: stats.two_point_conversion_pass_succeeded || 0,
            interceptions: stats.passing_interceptions || 0,
        },
        receiving: {
            yards: stats.receiving_yards || 0,
            touchdowns: stats.receiving_touchdowns || 0,
            twoPtConverstions: stats.two_point_conversion_reception_succeeded || 0,
            receptions: stats.receptions || 0
        },
        rushing: {
            yards: stats.rushing_yards || 0,
            touchdowns: stats.rushing_touchdowns || 0,
            twoPtConverstions: stats.two_point_conversion_rush_succeeded || 0,
        }
    }
    if (debug && stats.position == "QB") {
        console.log(obj)
    }

    let score = 0;
    score = score + (obj.passing.touchdowns * 4);
    score = score + parseFloat((obj.passing.yards * 0.04).toFixed(2));
    if (obj.passing.yards >= 300) {
        score = score + 3;
    }
    score = score - (obj.passing.interceptions)

    score = score + (obj.rushing.touchdowns * 6);
    score = score + parseFloat((obj.rushing.yards * 0.1).toFixed(2));
    if (obj.rushing.yards >= 100) {
        score = score + 3;
    }

    score = score + (obj.receiving.touchdowns * 6);
    score = score + parseFloat((obj.receiving.yards * 0.1).toFixed(2));
    if (obj.receiving.yards >= 100) {
        score = score + 3;
    }
    score = score + obj.receiving.receptions;
    score = score - (stats.fumbles_lost || 0);
    // don't have?
    score = score + obj.passing.twoPtConverstions * 2
    score = score + obj.rushing.twoPtConverstions * 2
    score = score + obj.receiving.twoPtConverstions * 2
    // score = score + (stats.FumbleReturnTouchdowns * 6)
    // score = score + ((stats.TwoPointConversionPasses + stats.TwoPointConversionRuns + stats.TwoPointConversionReceptions) * 2);

    if (debug && stats.position == "QB") {
        console.log(score)
    }

    obj.fantasySportsScore = score;
    obj.totalYards = obj.passing.yards + obj.rushing.yards + obj.receiving.yards;

    return obj
}

const scoreTeamsDefense = async (currentDSTScore, statsObj, pointsAllowed, debug) => {
    currentDSTScore = currentDSTScore + ((statsObj.interceptions || 0) * 2);
    currentDSTScore = currentDSTScore + (statsObj.fumbleRecoveries || 0)
    currentDSTScore = currentDSTScore + (statsObj.sacks || 0)
    currentDSTScore = currentDSTScore + (statsObj.fumblesForced || 0)
    currentDSTScore = currentDSTScore + ((statsObj.safeties || 0) * 2);
    currentDSTScore = currentDSTScore + (((statsObj.specialTeamsTds || 0) + (statsObj.defensiveTouchDowns || 0)) * 6);
    currentDSTScore = currentDSTScore + (statsObj.blockedKicks * 2);

    if (debug) {
        console.log(statsObj)
        console.log(currentDSTScore)
        console.log(pointsAllowed)
    }

    if (pointsAllowed == 0) {
        currentDSTScore = currentDSTScore + 10;
    } else if (pointsAllowed >= 1 && pointsAllowed <= 6) {
        currentDSTScore = currentDSTScore + 7;
    } else if (pointsAllowed >= 7 && pointsAllowed <= 13) {
        currentDSTScore = currentDSTScore + 4;
    } else if (pointsAllowed >= 14 && pointsAllowed <= 20) {
        currentDSTScore = currentDSTScore + 1;
        if (debug) {
            console.log("in the correct spot")
        }
    } else if (pointsAllowed >= 1 && pointsAllowed <= 6) {
        currentDSTScore = currentDSTScore + 7;
    } else if (pointsAllowed >= 28 && pointsAllowed <= 34) {
        currentDSTScore = currentDSTScore - 1;
    } else if (pointsAllowed >= 35) {
        currentDSTScore = currentDSTScore - 4;
    } 

    if (debug) {
        console.log(currentDSTScore)
    }
    return currentDSTScore
}

const dateStr = '2025-09-02T12:00:00'
const NFL_START_DATE = new Date(dateStr)

const formatDate = (dEpoch) => {
    const d = new Date(dEpoch)
    return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`
}

const oneDayMS = 86400000
const getPotentialGameDatesForWeek = async (week) => {
    let tuesOfWeekEpoch = new Date(dateStr).setDate(new Date(dateStr).getDate() + (7*(week - 1)))

    return [
        // formatDate(Number(tuesOfWeekEpoch) + (oneDayMS * 1)),
        formatDate(Number(tuesOfWeekEpoch) + (oneDayMS * 2)),
        formatDate(Number(tuesOfWeekEpoch) + (oneDayMS * 3)),
        formatDate(Number(tuesOfWeekEpoch) + (oneDayMS * 4)),
        formatDate(Number(tuesOfWeekEpoch) + (oneDayMS * 5)),
        formatDate(Number(tuesOfWeekEpoch) + (oneDayMS * 6)),
    ]

}

const getGamesForDate = async (date) => {
    const dataEndpoint = `https://rest.datafeeds.rolling-insights.com/api/v1/schedule-week/${date}/NFL?RSC_token=44b29fbc16ba1b201e5b25a0bd26877abee8ad009bd13b9efd8ee892661f44fc`;
    console.log(dataEndpoint)
    let games;
    let data;
    try {
        const res = await axios.get(dataEndpoint)
        //console.log(res)
        games = res

        data = games.data.data.NFL
    } catch (e) {

    }
    
    return data
}

const getLiveStatsForGame = async (date, gameId) => {
    const uri = `http://rest.datafeeds.rolling-insights.com/api/v1/live/${date}/NFL?RSC_token=44b29fbc16ba1b201e5b25a0bd26877abee8ad009bd13b9efd8ee892661f44fc&game_id=${gameId}`
    console.log(uri)
    let stats;
    let data;
    
    try {
        const res = await axios.get(uri)
        //console.log(res)
        stats = res
        data = stats.data.data.NFL
    } catch (e) {}
    
    return data && data[0]
}

const scoreTeamForWeek = async (teamStats, playerStats, team, pointsAllowed, week) => {
    let dstScore = 0;

    if (!teamStats) {
        let teamScore = {
            DST: 0,
            QB: 0,
            RB: 0,
            RB2: 0,
            TE: 0,
            WR: 0,
            WR2: 0,
            Team: team,
        }

        let _teamStats = {
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
                blockedKicks: 0,
            }
        }
        return { teamScore: teamScore, teamStats: _teamStats }
    }

    let dstStats = {
        team: team,
        fantasySportsScore: 0,
        defensiveTouchDowns: teamStats.defense_touchdowns,
        PointsAllowed: pointsAllowed,
        sacks: teamStats.sacks,
        interceptions: teamStats.defense_interceptions,
        fumbleRecoveries: teamStats.defense_fumble_recoveries,
        safeties: teamStats.safeties,
        blockedKicks: teamStats.blocked_kicks,
        specialTeamsTds: (teamStats.punt_return_touchdowns || 0) + (teamStats.kick_return_touchdowns || 0) + (teamStats.blocked_kick_touchdowns || 0) + (teamStats.blocked_punt_touchdowns || 0)
    };

    // figure out fumbles forced
    if (hardcoded_boosts[week] && hardcoded_boosts[week][`${team}-DST`]) {
        dstStats = {
            ...dstStats,
            ...hardcoded_boosts[week][`${team}-DST`]
        }
    } else {
        dstStats.fumblesForced = dstStats.fumbleRecoveries || 0
    }

    const QBs = [];
    const RBs = [];
    const TEs = [];
    const WRs = [];

    const stats = playerStats;

    const playerKeys = Object.keys(stats)
    for (let i = 0; i < playerKeys.length; i++) {
        const playerStats = stats[playerKeys[i]];
        if (['QB', 'RB', 'TE', 'WR'].indexOf(playerStats.position) >= 0) {
            if (playerStats.player === "Juwan Johnson" && playerStats.position === "WR") {
                playerStats.position = "TE"
            }
            let score = await scoreOffensivePlayer(playerStats, team, debug=false, week)

            if (playerStats.position == "QB") {
                QBs.push(score);
            } else if (playerStats.position == "RB") {
                RBs.push(score);
            } else if (playerStats.position == "TE") {
                TEs.push(score);
            } else if (playerStats.position == "WR") {
                WRs.push(score)
            }
        }
    }

    // 
    dstScore = await scoreTeamsDefense(dstScore, dstStats, pointsAllowed, debug=false)

    dstStats.fantasySportsScore = dstScore;

    const sortedQBArray = QBs.sort(function (a, b) {
        return b.fantasySportsScore - a.fantasySportsScore;
    });

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
            DST: parseFloat((dstStats?.fantasySportsScore || 0).toFixed(2)),
            QB: parseFloat((sortedQBArray[0]?.fantasySportsScore || 0).toFixed(2)),
            RB: parseFloat((sortedRBArray[0]?.fantasySportsScore || 0).toFixed(2)),
            RB2: parseFloat((sortedRBArray[1]?.fantasySportsScore || 0).toFixed(2)),
            TE: parseFloat((sortedTEArray[0]?.fantasySportsScore || 0).toFixed(2)),
            WR: parseFloat((sortedWRArray[0]?.fantasySportsScore || 0).toFixed(2)),
            WR2: parseFloat((sortedWRArray[1]?.fantasySportsScore || 0).toFixed(2)),
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
            Team: team,
        }
    }

    let _teamStats = {
        offense: {
            qb: sortedQBArray,
            rb: sortedRBArray,
            te: sortedTEArray,
            wr: sortedWRArray
        },
        defense: dstStats
    }

    return { teamScore: teamScore, teamStats: _teamStats }
}

internals.setScoresAndStats = async (week, year) => {
    const weekNum = Number(week)
    //console.log(games)
    const gameDatesForWeek = await getPotentialGameDatesForWeek(weekNum)
    const teamScores = {}

    let stats = {
        offense: {
            qb: [],
            rb: [],
            te: [],
            wr: [],
        },
        defense: [],
    }

    for (let i =0; i<gameDatesForWeek.length; i++) {
        const d = gameDatesForWeek[i]
        const gameResults = await getGamesForDate(d)

        if (gameResults) {
            for (let j = 0; j < gameResults.length; j++) {
                const game = gameResults[j]
                if (game.status === "completed" || game.status === "inprogress" || game.status === "final") {
                    const gameStats = await getLiveStatsForGame(d, game.game_ID)
                    if (gameStats) {
                        // 
                        let homeTeamStats = gameStats.full_box.home_team.team_stats
                        let homeTeamPLayerStats = gameStats.player_box.home_team
                        let homeTeamAbbrev = gameStats.full_box.home_team.abbrv
                        let awayTeamScore = gameStats.full_box.away_team.score

                        let awayTeamStats = gameStats.full_box.away_team.team_stats
                        let awayTeamPLayerStats = gameStats.player_box.away_team
                        let awayTeamAbbrev = gameStats.full_box.away_team.abbrv
                        let homeTeamScore = gameStats.full_box.home_team.score
                        if (weekNum === 1 && homeTeamAbbrev === "KC") {
                            // swap players (provider bug)
                            console.log("swapping cause guh")
                            homeTeamStats = gameStats.full_box.away_team.team_stats
                            homeTeamPLayerStats = gameStats.player_box.away_team
                            awayTeamScore = gameStats.full_box.home_team.score

                            awayTeamStats = gameStats.full_box.home_team.team_stats
                            awayTeamPLayerStats = gameStats.player_box.home_team
                            homeTeamScore = gameStats.full_box.away_team.score
                        }

                        // home team
                        if (!teamScores[homeTeamAbbrev]) {
                            const homeTeamScores = await scoreTeamForWeek(
                                homeTeamStats, 
                                homeTeamPLayerStats,
                                homeTeamAbbrev,
                                awayTeamScore,
                                weekNum
                            )
                            teamScores[homeTeamAbbrev] = homeTeamScores

                            stats.defense.push(homeTeamScores.teamStats.defense);
                            for(let i = 0; i < homeTeamScores.teamStats.offense.qb.length; i++) {
                                stats.offense.qb.push(homeTeamScores.teamStats.offense.qb[i])
                            }
                            for(let i = 0; i < homeTeamScores.teamStats.offense.rb.length; i++) {
                                stats.offense.rb.push(homeTeamScores.teamStats.offense.rb[i])
                            }
                            for(let i = 0; i < homeTeamScores.teamStats.offense.te.length; i++) {
                                stats.offense.te.push(homeTeamScores.teamStats.offense.te[i])
                            }
                            for(let i = 0; i < homeTeamScores.teamStats.offense.wr.length; i++) {
                                stats.offense.wr.push(homeTeamScores.teamStats.offense.wr[i])
                            }
                        }

                        // away team
                        if (!teamScores[awayTeamAbbrev]) {
                            const awayTeamScores = await scoreTeamForWeek(
                                awayTeamStats, 
                                awayTeamPLayerStats, 
                                awayTeamAbbrev,
                                homeTeamScore,
                                weekNum
                            )
                            teamScores[awayTeamAbbrev] = awayTeamScores

                            stats.defense.push(awayTeamScores.teamStats.defense);
                            for(let i = 0; i < awayTeamScores.teamStats.offense.qb.length; i++) {
                                stats.offense.qb.push(awayTeamScores.teamStats.offense.qb[i])
                            }
                            for(let i = 0; i < awayTeamScores.teamStats.offense.rb.length; i++) {
                                stats.offense.rb.push(awayTeamScores.teamStats.offense.rb[i])
                            }
                            for(let i = 0; i < awayTeamScores.teamStats.offense.te.length; i++) {
                                stats.offense.te.push(awayTeamScores.teamStats.offense.te[i])
                            }
                            for(let i = 0; i < awayTeamScores.teamStats.offense.wr.length; i++) {
                                stats.offense.wr.push(awayTeamScores.teamStats.offense.wr[i])
                            }
                        }
                    }
                }
            }
        }
    }

    let newScores = {
        FantasyPoints: []
    }

    const prevScores = await db.readDocument('scores', `2023REG-01`);
    for(let i = 0; i < prevScores.FantasyPoints.length; i++) {
        let prevScoresTeam = prevScores.FantasyPoints[i].Team;
        let newScoresObj = teamScores[prevScoresTeam]
        if (!newScoresObj) {
            const teamScore = {
                DST: 0,
                QB: 0,
                RB: 0,
                RB2: 0,
                TE: 0,
                WR: 0,
                WR2: 0,
                Team: prevScoresTeam,
            }
            newScores.FantasyPoints.push(teamScore)
        } else {
            //console.log("added new score object")
            newScores.FantasyPoints.push(newScoresObj.teamScore)
        }
    }
    console.log("fetched scores -- pushing to db")

    console.log(`${year}-${week}`)
    await db.createOrUpdateDocument('scores', `${year}-${week}`, newScores, false)
    console.log("updated scores document")

    // console.log(stats)
    await db.createOrUpdateDocument('stats', `${year}-${week}`, stats, false)
    console.log("updated stats")
}

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