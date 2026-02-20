const db = require('../../services/db');
const utils = require('../../services/utils');
const lineups = require('../../services/lineup');

// (async () => {
//     const currentGameweek = '2024REG-01';
//     const nextGameweek = '2024REG-02';

//     for(let i = 0; i < 10000; i++) {
//         const cardId = `${i}`;
//         const lineup = await db.readDocument(`leagues/genesis/cards/${cardId}/lineups`, currentGameweek)
//         const week7Lineup = await db.readDocument(`leagues/genesis/cards/${cardId}/lineups`, nextGameweek);
//         if(week7Lineup) {
//             console.log(`Card ${cardId} already has a week 7 lineup`)
//             continue;
//         }
//         lineup.scoreWeek = 0;
//         lineup.prevWeekSeasonScore = lineup.scoreSeason;
//         lineup.gameWeek = nextGameweek;
//         await db.createOrUpdateDocument(`leagues/genesis/cards/${cardId}/lineups`, nextGameweek, lineup, false)

//         const leaderboardObj = await db.readDocument(`genesisLeaderboard/${currentGameweek}/cards`, cardId);
//         leaderboardObj.lineup = lineup;
//         leaderboardObj.scoreWeek = 0;
//         await db.createOrUpdateDocument(`genesisLeaderboard/${nextGameweek}/cards`, cardId, leaderboardObj, false)
//         console.log(`Created leaderboard object and lineup in for ${cardId} for ${nextGameweek}`);

//     }
// })()

// RUN THE BELOW FUNCTION TO UPDATE OPPONENT/GAME INFO FOR THE NEW WEEK

// (async () => {
//     lineups.updateOpponentInfo()
// })() 


// RUN THE BELOW FUNCTION TO CREATE A ZEROD OUT SCORE DOCUMENT FOR THE NEW WEEK

(async () => {
    const prevGameweek = '2025REG-08';
    const newGameweek = '2025REG-09';

    const scores = await db.readDocument('scores', prevGameweek)
    const data = scores.FantasyPoints;

    for(let i = 0; i < data.length; i++) {
        data[i].DST = 0;
        data[i].QB = 0;
        data[i].RB = 0;
        data[i].RB2 = 0;
        data[i].TE = 0;
        data[i].WR = 0;
        data[i].WR2 = 0;
        data[i].GameStatus = 'Scheduled';
    }

    scores.FantasyPoints = data;
    await db.createOrUpdateDocument('scores', newGameweek, scores, false)

})()