const db = require('../../services/db');
const utils = require("../../services/utils");
const sbs = require("../../services/sbs");


const gameweekArr = ["2022-REG-01", "2022-REG-02", "2022-REG-03", "2022-REG-04", "2022-REG-05", "2022-REG-06", "2022-REG-07", "2022-REG-08", "2022-REG-09", "2022-REG-10", "2022-REG-11", "2022-REG-12", "2022-REG-13", "2022-REG-14", "2022-REG-15", "2022-REG-16", "2022-REG-17" ];

const createWeeklyScoringMapByTeam = (scores) => {
    const scoresMap = new Map()
    
    for (let i = 0; i < scores.length; i++) {
        const obj = scores[i];
        if (obj.team == 'JAC') {
            obj.team = 'JAX';
        } else if (obj.team == 'LA') {
            obj.team = 'LAR';
        }
        scoresMap.set(obj.team, obj)
    }

    return scoresMap
}

const createScoreMapByGameweek = async () => {
    
    const mapOfMaps = new Map();

    for (let i = 0; i < gameweekArr.length; i++) {
        const gameweek = gameweekArr[i];
        const scores = await db.readDocument('scores', gameweek)
        let weekMap = createWeeklyScoringMapByTeam(scores.FantasyPoints);

        mapOfMaps.set(gameweek, weekMap);
    }
    return mapOfMaps
}


const calculateAverageScoreByTeam = (team, scoresMap) => {
    console.log(team)
    let sums = {
        QB: 0,
        RB: 0,
        TE: 0,
        WR: 0,
        DST: 0,
    }

    let highestScores = {
        QB: { score: 0, week: "" },
        RB: { score: 0, week: "" },
        TE: { score: 0, week: "" },
        WR: { score: 0, week: "" },
        DST: { score: 0, week: "" },
    }

    for (let i = 0; i < gameweekArr.length; i++) {
        const gameweek = gameweekArr[i];
        const scores = scoresMap.get(gameweek);
        const obj = scores.get(team)
        sums.DST += obj.DST;
        if (obj.DST > highestScores.DST.score) {
            highestScores.DST.score = obj.DST;
            highestScores.DST.week = gameweek;
        }
        sums.QB += obj.QB;
        if (obj.QB > highestScores.QB.score) {
            highestScores.QB.score = obj.QB;
            highestScores.QB.week = gameweek;
        }
        sums.RB += obj.RB;
        if (obj.RB > highestScores.RB.score) {
            highestScores.RB.score = obj.RB;
            highestScores.RB.week = gameweek;
        }
        sums.TE += obj.TE;
        if (obj.TE > highestScores.TE.score) {
            highestScores.TE.score = obj.TE;
            highestScores.TE.week = gameweek;
        }
        sums.WR += obj.WR;
        if (obj.WR > highestScores.WR.score) {
            highestScores.WR.score = obj.WR;
            highestScores.WR.week = gameweek;
        }
    }

    const averageScores = {
        QB: parseFloat((sums.QB / 17).toFixed(3)),
        RB: parseFloat((sums.RB / 17).toFixed(3)),
        TE: parseFloat((sums.TE / 17).toFixed(3)),
        WR: parseFloat((sums.WR / 17).toFixed(3)),
        DST: parseFloat((sums.DST / 17).toFixed(3)),
    }

    return { average: averageScores, highest: highestScores }
}

//const sportsRadarTeams = ["ARI", "ATL", "BAL", "BUF", "CAR", "CHI", "CIN", "CLE", "DAL", "DEN", "DET", "GB", "HOU", "IND", "JAX", "KC", "LAC", "LA", "MIA", "MIN", "NE", "NO", "NYG", "NYJ", "LV", "PHI", "PIT", "SEA", "SF", "TB", "TEN", "WAS"];

//const sportsRadarTeams = ['ARI', 'ATL', 'BAL', 'BUF', 'CAR', 'CHI', 'CIN', 'CLE', 'DAL', 'DEN', 'DET', 'GB',  'HOU', 'IND', 'JAX', 'KC',  'LAC', 'LAR', 'LV',  'MIA', 'MIN', 'NE',  'NO',  'NYG', 'NYJ', 'PHI', 'PIT', 'SEA', 'SF',  'TB',  'TEN', 'WAS'];

const getTop5 = async (gameweek) => {
    const data = await db.readDocument('scores', gameweek)
    const oldScores = data.FantasyPoints;
    const scores = [];
    for (let i = 0; i < oldScores.length; i++) {
        const obj = oldScores[i];
        if (obj.team == 'JAC') {
            obj.team = 'JAX'
        } else if (obj.team == 'LA') {
            obj.team = 'LAR';
        } 

        scores.push(obj)
    }
    console.log(scores)

    let top5QB = [];
    const sortByQB = scores.sort((a, b) => a.QB - b.QB).reverse();
    //console.log(sortByQB)
    for(let i = 0; i < 5; i++) {
        console.log('inQB: ', sortByQB[i]);
        top5QB.push(sortByQB[i].team)
    }

    let top5RB = [];
    const sortByRB = scores.sort((a, b) => a.RB - b.RB).reverse();
    for(let i = 0; i < 5; i++) {
        console.log('inRB: ', sortByRB[i]);
        top5RB.push(sortByRB[i].team)
    }

    let top5TE = [];
    const sortByTE = scores.sort((a, b) => a.TE - b.TE).reverse();
    for(let i = 0; i < 5; i++) {
        console.log('inTE: ', sortByTE[i]);
        top5TE.push(sortByTE[i].team)
    }

    let top5WR = [];
    const sortByWR = scores.sort((a, b) => a.WR - b.WR).reverse();
    for(let i = 0; i < 5; i++) {
        console.log('inWR: ', sortByWR[i]);
        top5WR.push(sortByWR[i].team)
        
    }

    let top5DST = [];
    const sortByDST = scores.sort((a, b) => a.DST - b.DST).reverse();
    for(let i = 0; i < 5; i++) {
        console.log('inDST: ', sortByDST[i]);
        top5DST.push(sortByDST[i].team)
    }

    const top5Res = {
        DST: top5DST,
        QB: top5QB,
        RB: top5RB,
        TE: top5TE,
        WR: top5WR,
    }

    return top5Res

}

//const teams =            ['ARI', 'ATL', 'BAL', 'BUF', 'CAR', 'CHI', 'CIN', 'CLE', 'DAL', 'DEN', 'DET', 'GB',  'HOU', 'IND', 'JAX', 'KC',  'LAC', 'LAR', 'LV',  'MIA', 'MIN', 'NE',  'NO',  'NYG', 'NYJ', 'PHI', 'PIT', 'SEA', 'SF',  'TB',  'TEN', 'WAS'];

// const sportsRadarTeams = ["ARI", "ATL", "BAL", "BUF", "CAR", "CHI", "CIN", "CLE", "DAL", "DEN", "DET", "GB", "HOU", "IND", "JAX", "KC", "LAC", "LA", "MIA", "MIN", "NE", "NO", "NYG", "NYJ", "LV", "PHI", "PIT", "SEA", "SF", "TB", "TEN", "WAS"];

const sportsRadarTeams = ['ARI', 'ATL', 'BAL', 'BUF', 'CAR', 'CHI', 'CIN', 'CLE', 'DAL', 'DEN', 'DET', 'GB',  'HOU', 'IND', 'JAX', 'KC',  'LAC', 'LAR', 'LV',  'MIA', 'MIN', 'NE',  'NO',  'NYG', 'NYJ', 'PHI', 'PIT', 'SEA', 'SF',  'TB',  'TEN', 'WAS'];


const createTeamMapToTop5Finishes = () => {
    const res = new Map();

    for (let i = 0; i < sportsRadarTeams.length; i++) {
        console.log(sportsRadarTeams[i])
        res.set(sportsRadarTeams[i], {
            DST: 0,
            QB: 0,
            RB: 0,
            TE: 0,
            WR: 0,
        });
    }

    return res
}


const calculateTotalTop5Finishes = async () => {
    const teamsMap = createTeamMapToTop5Finishes();

    for (let i = 0; i < gameweekArr.length; i++) {
        const gameweek = gameweekArr[i];
        const top5 = await getTop5(gameweek);
        //console.log(top5)

        //await utils.sleep(40000)
        for(let j = 0; j < top5.QB.length; j++) {
            //console.log(top5.QB[j])
            let obj = teamsMap.get(top5.QB[j]);
            obj.QB++;
            teamsMap.set(top5.QB[j], obj)
        }
        for(let j = 0; j < top5.RB.length; j++) {
            let obj = teamsMap.get(top5.RB[j]);
            obj.RB++;
            teamsMap.set(top5.RB[j], obj)
        }
        for(let j = 0; j < top5.TE.length; j++) {
            let obj = teamsMap.get(top5.TE[j]);
            obj.TE++;
            teamsMap.set(top5.TE[j], obj)
        }
        for(let j = 0; j < top5.WR.length; j++) {
            let obj = teamsMap.get(top5.WR[j]);
            obj.WR++;
            teamsMap.set(top5.WR[j], obj)
        }
        for(let j = 0; j < top5.DST.length; j++) {
            let obj = teamsMap.get(top5.DST[j]);
            obj.DST++;
            teamsMap.set(top5.DST[j], obj)
        }
    }

    return teamsMap;

}



const createPlayerMap = async () => {
    const res = await createScoreMapByGameweek();

    const statsMap = new Map();

    for (let i = 0; i < sportsRadarTeams.length; i++) {
        const team = sportsRadarTeams[i];
        if (team == 'JAC') {
            console.log("JAC found")
        }
        statsMap.set(team, {
            team: team,
            averageScores: null,
            highestScores: null,
            topFinishes: null,
        });
    }
    

    const topFinishes = await calculateTotalTop5Finishes()
    //console.log(topFinishes.get('BUF'))



    for(let i = 0; i < sportsRadarTeams.length; i++) {
        const team = sportsRadarTeams[i];
        if (team == 'JAC') {
            console.log("JAC found")
        }
        let teamStats = statsMap.get(team);
        let result = calculateAverageScoreByTeam(team, res)
        teamStats.averageScores = result.average;
        teamStats.highestScores = result.highest;
        teamStats.topFinishes = topFinishes.get(team)
        statsMap.set(team, teamStats)
    }

    const bufStats = statsMap.get('BUF')

    const playerMap = new Map();
    
    statsMap.forEach( async (teamStats, team) => {
        const qbPlayerId = `${team}-QB`;
        const qbStats = {
            playerId: qbPlayerId,
            averageScore: teamStats.averageScores.QB,
            highestScore: teamStats.highestScores.QB.score,
            top5Finishes: teamStats.topFinishes.QB,
        }
        playerMap.set(qbPlayerId, qbStats);

        const rb1PlayerId = `${team}-RB1`;
        const rb1Stats = {
            playerId: rb1PlayerId,
            averageScore: teamStats.averageScores.RB,
            highestScore: teamStats.highestScores.RB.score,
            top5Finishes: teamStats.topFinishes.RB,
        }
        playerMap.set(rb1PlayerId, rb1Stats)

        const rb2PlayerId = `${team}-RB2`;
        const rb2Stats = {
            playerId: rb2PlayerId,
            averageScore: teamStats.averageScores.RB,
            highestScore: teamStats.highestScores.RB.score,
            top5Finishes: teamStats.topFinishes.RB,
        }
        playerMap.set(rb2PlayerId, rb2Stats)

        const tePlayerId = `${team}-TE`;
        const teStats = {
            playerId: tePlayerId,
            averageScore: teamStats.averageScores.TE,
            highestScore: teamStats.highestScores.TE.score,
            top5Finishes: teamStats.topFinishes.TE,
        }
        playerMap.set(tePlayerId, teStats)

        const wr1PlayerId = `${team}-WR1`;
        const wr1Stats = {
            playerId: wr1PlayerId,
            averageScore: teamStats.averageScores.WR,
            highestScore: teamStats.highestScores.WR.score,
            top5Finishes: teamStats.topFinishes.WR,
        }
        playerMap.set(wr1PlayerId, wr1Stats)

        const wr2PlayerId = `${team}-WR2`;
        const wr2Stats = {
            playerId: wr2PlayerId,
            averageScore: teamStats.averageScores.WR,
            highestScore: teamStats.highestScores.WR.score,
            top5Finishes: teamStats.topFinishes.WR,
        }
        playerMap.set(wr2PlayerId, wr2Stats)

        const dstPlayerId = `${team}-DST`;
        const dstStats = {
            playerId: dstPlayerId,
            averageScore: teamStats.averageScores.DST,
            highestScore: teamStats.highestScores.DST.score,
            top5Finishes: teamStats.topFinishes.DST,
        }
        playerMap.set(dstPlayerId, dstStats)
    })


    let playerScoreArr = [];

    let playerStatsObject = {}

    playerMap.forEach(async (playerStats, playerId) => {
        // try {
        //     await db.createOrUpdateDocument('playerStats2025', 'playerMap', { [`players.${playerId}`]: playerStats}, true )
        // } catch (err) {
        //     console.log(err)
        // }
        playerStatsObject[playerId] = playerStats
        //console.log('added ', playerId)
        //console.log(playerStats)
        await utils.sleep(2000)
        let score = Number(2 * playerStats.averageScore) + Number(playerStats.highestScore) + Number(2 * playerStats.top5Finishes);
       console.log(score)
        score = parseFloat(score.toFixed(3))
        playerScoreArr.push({
            playerId: playerId,
            score: score,
            rank: null
        })
    })


    await utils.sleep(14000)
    let response = {
        players: playerStatsObject
    }
    await db.createOrUpdateDocument('playerStats2025', 'playerMap', response, false)
    playerScoreArr = playerScoreArr.sort((a, b) => a.score - b.score).reverse();
    console.log("sorted players array by score")
    for(let i = 0; i < playerScoreArr.length; i++) {
        playerScoreArr[i].rank = i + 1;
    }

    let rankings = {
        ranking: playerScoreArr
    }

    await utils.sleep(19000)
    await db.createOrUpdateDocument('playerStats2025', 'rankings', rankings, false)
    console.log("saved rankings: ", rankings)
}

// const createPlayerRankings = async () => {
//     const playerMap = await db.readDocument('playerStats2025', 'playerMap');
//     let playerScoreArr = [];


//     console.log(playerMap)
//     const positions = ['QB', 'RB', 'TE', 'WR', 'DST'];


    
//     for (let i = 0; i < sportsRadarTeams.length; i++) {
//         for(let j = 0; j < positions.length; j++) {
//             const playerId = `${sportsRadarTeams[i]}-${positions[j]}`;
//             const stats = playerMap.get(sportsRadarTeams[i]);
//             const score = parseFloat(((2 * stats.averageScore) + stats.highestScore + (2 * top5Finishes)).toFixed(3))
//             playerScoreArr.push({
//                 playerId: playerId,
//                 score: score,
//                 rank: null
//             })
//         }
//     }

//     playerScoreArr = playerScoreArr.sort((a, b) => a.score - b.score).reverse();
//     console.log("sorted players array by score")
//     for(let i = 0; i < playerScoreArr.length; i++) {
//         console.log(playerScoreArr[i])
//     }

//     // for(let i = 0; i < playerScoreArr.length; i++) {
//     //     let obj = playerMap.get(playerScoreArr[i].playerId);
//     //     obj.rank = i + 1
//     //     obj.set(playerScoreArr[i].playerId, obj)
//     // }   

    
    
// }


(async () => {
    await createPlayerMap()
})()



