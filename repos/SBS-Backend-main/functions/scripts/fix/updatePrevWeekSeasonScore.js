const db = require('../../services/db');
const utils = require('../../services/utils');

(async () => {
    const gameweek = '2022-REG-13';
    const prevWeek = '2022-REG-12';
    for(let i = 3441; i < 10000; i++) {
        const cardId = `${i}`;
        const currentLineup = await db.readDocument(`leagues/genesis/cards/${cardId}/lineups`, gameweek)
        if(currentLineup.prevWeekSeasonScore) {
            console.log(`card:${cardId} has prevWeekSEasonScore defined.. which is ${currentLineup.prevWeekSeasonScore}`)
            continue;
        }
        const prevLineup = await db.readDocument(`leagues/genesis/cards/${cardId}/lineups`, prevWeek);
        currentLineup.prevWeekSeasonScore = prevLineup.scoreSeason;
        console.log(currentLineup.prevWeekSeasonScore);
        console.log(currentLineup.scoreWeek);
        console.log(parseFloat((Number(currentLineup.prevWeekSeasonScore) + Number(currentLineup.scoreWeek)).toFixed(2)))
        currentLineup.scoreSeason = parseFloat((Number(currentLineup.prevWeekSeasonScore) + Number(currentLineup.scoreWeek)).toFixed(2))
        await db.createOrUpdateDocument(`leagues/genesis/cards/${cardId}/lineups`, gameweek, currentLineup, false)
        console.log(`UPDATED: card ${cardId} has been updated`)
    }
})()