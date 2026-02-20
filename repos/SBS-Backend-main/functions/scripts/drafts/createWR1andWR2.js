const db = require('../../services/db');
const utils = require("../../services/utils");
const sbs = require("../../services/sbs");

const AddByeWeekToStats = async () => {
    const res = await db.readDocument("playerStats2025", "playerMap")
    //console.log(res)
    const newStatsMap = {};
    const playerMap = res.players;
    console.log(playerMap)

    for (const [key, value] of Object.entries(playerMap)) {
        const playerId = key;
        const team = playerId.split('-')[0];
        const position = playerId.split('-')[1];
        console.log(team)
        const statsObj = value;
        statsObj.ADP = 0;
        newStatsMap[playerId] = statsObj

        console.log(statsObj)
        // if (position.toLowerCase() == 'wr') {
        //     let wr1Id = `${playerId}1`;
        //     newStatsMap[wr1Id] = statsObj
        //     let wr2Id = `${playerId}2`;
        //     newStatsMap[wr2Id] = statsObj
        // } else {
        //     newStatsMap[playerId] = statsObj
        // }
    }
    
    let count = 0;
    for (let [key, value] of Object.entries(newStatsMap)) {
        count++;
        console.log(`key: ${key}, Object: { avg: ${value.averageScore}, highestScore: ${value.highestScore}, playerId: ${value.playerId}, top5Finishes: ${value.top5Finishes}, byeWeek: ${value.byeWeek}, ADP: ${value.ADP} }`)
    }

    console.log("num of iterations: ", count)

    let result = {
        players: newStatsMap
    }

    await db.createOrUpdateDocument("playerStats2025", "playerMap", result, false)
}

const createNewDefaultPlayerState = async () => {
    const res = await db.readDocument("playerStats2025", "defaultPlayerDraftState");
    const newStateMap = {};

    for (let [key, player] of Object.entries(res)) {
        const oldPlayerId = key;
        if (player.position == 'RB') {
            const RB1 = player;
            RB1.playerId = `${player.team}-RB1`;
            newStateMap[RB1.playerId] = RB1;

            const RB2 = player;
            RB2.playerId = `${player.team}-RB2`;
            newStateMap[RB2.playerId] = RB2
        } else if (player.position == 'WR') {
            const WR1 = player;
            WR1.playerId = `${player.team}-WR1`;
            newStateMap[WR1.playerId] = WR1;

            const WR2 = player;
            WR2.playerId = `${player.team}-WR2`;
            newStateMap[WR2.playerId] = WR2
        } else {
            newStateMap[key] = player
        }
    }

    try {
        await db.createOrUpdateDocument("playerStats2025", "defaultPlayerDraftState", newStateMap, false)
        console.log("updated the default player state")
    } catch (err) {
        console.log(err)
    }
}

const updateRankingWithWR2 = async () => {
    const res = await db.readDocument("playerStats2025", "rankings")
    const rankings = res.ranking;
    let rank = 1;
    const newRankings = [];

    for (let i = 0; i < rankings.length; i++) {
        let obj = rankings[i];
        const splitId = obj.playerId.split('-');
        const team = splitId[0];
        const position = splitId[1];
        if (position == 'RB') {
            const rb1 = {
                playerId: `${team}-RB1`,
                rank: rank,
                score: obj.score
            };
            rank++;
            console.log("RB1: ", rb1);
            newRankings.push(rb1);

            const rb2 = {
                playerId: `${team}-RB2`,
                rank: rank,
                score: obj.score
            };
            rank++
            console.log("RB2: ", rb2);
            newRankings.push(rb2);
        } else if (position == 'WR') {
            const wr1 = {
                playerId: `${team}-WR1`,
                rank: rank,
                score: obj.score
            };
            rank++
            console.log("WR1: ", wr1);
            newRankings.push(wr1);

            const wr2 = {
                playerId: `${team}-WR2`,
                rank: rank,
                score: obj.score
            };
            rank++;
            console.log("WR2: ", wr2);
            newRankings.push(wr2)
        } else {
            let player = {
                playerId: obj.playerId,
                rank: rank,
                score: obj.score
            }
            rank++;
            newRankings.push(player)
        }
    }

    await db.createOrUpdateDocument("playerStats2025", "rankings", newRankings)
    console.log("updated the rankings")
}


const updateStatsMap = async () => {
    const res = await db.readDocument("playerStats2025", "playerMap")
    const statsMap = res.players;

    const newStatsMap = {};

    for (let [key, player] of Object.entries(statsMap)) {
        const splitId = player.playerId.split('-');
        const team = splitId[0];
        const position = splitId[1];
        if (position == 'RB') {
            const RB1 = player;
            RB1.playerId = `${team}-RB1`;
            newStatsMap[RB1.playerId] = RB1;

            const RB2 = player;
            RB2.playerId = `${team}-RB2`;
            newStatsMap[RB2.playerId] = RB2
        } else if (position == 'WR') {
            const WR1 = player;
            WR1.playerId = `${team}-WR1`;
            newStatsMap[WR1.playerId] = WR1;

            const WR2 = player;
            WR2.playerId = `${team}-WR2`;
            newStatsMap[WR2.playerId] = WR2
        } else {
            newStatsMap[key] = player
        }
    }

    await db.createOrUpdateDocument("playerStats2025", "playerMap", newStatsMap)
    console.log("Updated the stats map")

}
(async () => {
    await AddByeWeekToStats()
})()