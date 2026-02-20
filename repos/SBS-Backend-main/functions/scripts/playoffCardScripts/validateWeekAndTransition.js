const db = require('../../services/db');
const scoreTriggers = require('../../services/score-triggers');
const sbs = require('../../services/sbs'); 
const utils = require('../../services/utils');

/*
    DO NOT RUN THIS SCRIPT PAST MONDAY AS IT WILL CREATE NEW LINEUPS FOR THE WRONG WEEK
*/

const createNewWeekLineup = async (cardId) => {
    const currentGameWeek = '2022-PST-03';
    const nextGameWeek = `2022-PST-04`;
    
    const lineup = await db.readDocument(`leagues/genesis-playoff-league/cards/${cardId}/lineups`, currentGameWeek);
    const week3Score = lineup.scoreWeek;
    lineup.prevWeekSeasonScore = lineup.scoreSeason;
    lineup.scoreWeek = 0;
    lineup.gameWeek = nextGameWeek;

    if(lineup._cardId != cardId) {
        throw('lineup card id does not match up with the card id passed in as a param');
    }
    await db.createOrUpdateDocument(`leagues/genesis-playoff-league/cards/${cardId}/lineups`, nextGameWeek, lineup, true)

    const card = await db.readDocument('playoffCards', cardId);
    let leaderboardObj = await db.readDocument(`genesisPlayoffsLeaderboard/${currentGameWeek}/cards`, cardId);
    if(leaderboardObj) {
        leaderboardObj.card = card;
        leaderboardObj.lineup = lineup;
        leaderboardObj.week3Score = week3Score;
        leaderboardObj.scoreSeason = lineup.scoreSeason;
        leaderboardObj.scoreWeek = 0;
    } else {
        throw('Did not have a leaderboard object for this card');
    }
    await db.createOrUpdateDocument(`genesisPlayoffsLeaderboard/${nextGameWeek}/cards`, cardId, leaderboardObj, false);
    console.log(`Updated genesis playoffs leaderboard for card ${cardId} in ${nextGameWeek}`);
    if(Number(cardId) >= 10000) {
        await db.createOrUpdateDocument(`mintedPlayoffs2022Leaderboard/${nextGameWeek}/cards`, cardId, leaderboardObj, false);
        console.log(`Updated minted playoffs leaderboard for card ${cardId} in ${nextGameWeek}`);
    }
    return 0;
}

const transitionToNewWeekInParts = async (min, max) => {
    const errorCardIds = [];
    for(let i = min; i < max; i++) {
        const cardId = `${i}`;
        console.log(cardId)
        try {
            await createNewWeekLineup(cardId);
        } catch (err) {
            console.log(err);
            errorCardIds.push(cardId)
            await utils.sleep(10000);
        }
    }
    console.log(errorCardIds)
    console.log(errorCardIds.length)
}

// const updateSeasonScore = async (min, max) => {
//     const currentGameWeek = '2022-PST-01';
//     const nextGameWeek = `2022-PST-02`;
//     const errorCardIds = [];
//     for(let i = min; i < max; i++) {
//         const cardId = `${i}`;
//         const oldLineup = await db.readDocument(`leagues/genesis-playoff-league/cards/${cardId}/lineups`, currentGameWeek);
//         const newLineup = await db.readDocument(`leagues/genesis-playoff-league/cards/${cardId}/lineups`, nextGameWeek);;
//         newLineup.scoreSeason = oldLineup.scoreSeason;
//         newLineup.prevWeekSeasonScore = oldLineup.scoreSeason;
//         await db.createOrUpdateDocument(`leagues/genesis-playoff-league/cards/${cardId}/lineups`, nextGameWeek, newLineup, true)

//         const card = await db.readDocument('playoffCards', cardId);
//         const leaderboardObj = {
//             cardId: cardId,
//             card: card,
//             lineup: newLineup,
//             level: card._level,
//             ownerId: card._ownerId,
//             scoreWeek: 0,
//             scoreSeason: newLineup.scoreSeason,
//         }
//         await db.createOrUpdateDocument(`genesisPlayoffsLeaderboard/${nextGameWeek}/cards`, cardId, leaderboardObj, true);
//         console.log(`Updated genesis playoffs leaderboard for card ${cardId} in ${nextGameWeek}`);
//         if(Number(cardId) >= 10000) {
//             await db.createOrUpdateDocument(`mintedPlayoffs2022Leaderboard/${nextGameWeek}/cards`, cardId, leaderboardObj, true);
//             console.log(`Updated minted playoffs leaderboard for card ${cardId} in ${nextGameWeek}`);
//         }
//     }
//     console.log(errorCardIds)
//     console.log(errorCardIds.length)
// }

(async () => {
    //await transitionToNewWeekInParts(0, 1000);
    //await transitionToNewWeekInParts(1000, 2000);
    //await transitionToNewWeekInParts(2000, 3000);
    //await transitionToNewWeekInParts(3000, 4000);
    //await transitionToNewWeekInParts(4000, 5000);
    //await transitionToNewWeekInParts(5000, 6000);
    //await transitionToNewWeekInParts(6000, 7000);
    //await transitionToNewWeekInParts(7000, 8000);
    //await transitionToNewWeekInParts(8000, 9000);
    //await transitionToNewWeekInParts(9000, 10000);
    //await transitionToNewWeekInParts(10000, 11000);
    await transitionToNewWeekInParts(11000, 12393);
    

})()



