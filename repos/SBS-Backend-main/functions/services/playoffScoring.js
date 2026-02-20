const db = require("./db");
require("firebase-functions/lib/logger/compat");
const ENV = require('./env');
const api = require('./api');
const web3Utils = require('./cardContract');
const dstScoring = require('./dst-scoring');
const sbs = require('./sbs');
const weekTransition = require('./weekTransition');
const utils = require('./utils');
const scoreTriggers = require('./score-triggers');

const internals = {};

// const getQBPoints = (scores, lineup, position) => {
//     const team = lineup.starting.QB[0];
//     const points = utils.getPointsFromScore(scores, team, position);
//     const total = points;
//     return total;
// }

// const getRBPoints = (scores, lineup, position) => {
//     const team1 = lineup.starting.RB[0];
//     const team2 = lineup.starting.RB[1];
//     const points1 = utils.getPointsFromScore(scores, team1, position);
//     const points2 = utils.getPointsFromScore(scores, team2, position);
//     const total = points1 + points2;
//     return total;
// }

// const getWRPoints = (scores, lineup, position) => {
//     const team1 = lineup.starting.WR[0];
//     const team2 = lineup.starting.WR[1];
//     const team3 = lineup.starting.WR[2];
//     const points1 = utils.getPointsFromScore(scores, team1, position);
//     const points2 = utils.getPointsFromScore(scores, team2, position);
//     const points3 = utils.getPointsFromScore(scores, team3, position);
//     const total = points1 + points2 + points3;
//     return total;
// }

// const getTEPoints = (scores, lineup, position) => {
//     const team = lineup.starting.TE[0];
//     const points = utils.getPointsFromScore(scores, team, position);
//     const total = points;
//     return total;
// }

// const getDSTPoints = (scores, lineup, position) => {
//     const team = lineup.starting.DST[0];
//     const points = utils.getPointsFromScore(scores, team, position);
//     const total = points;
//     return total;
// };

// const sum = (arr) => arr.reduce((accumulator, value) => {
//     return accumulator + value;
// }, 0);

// // trigger at scoreChangeStaging/{gameweek}
// internals.scoreLineupsInMintedPlayoffLeague = async (change, context) => {
//     console.log(`Start of scoring the minted playoff leagues`)
//     const gameweek = context.params.gameweek;
//     const data = change.after.data();
//     const changes = data.changes;
//     const leagueId = 'minted-playoffs-2022-2023';
//     const cardIds = await db.readAllDocumentIds(`leagues/${leagueId}/cards`);
//     for(let i = 0; i < cardIds.length; i++) {
//         const cardId = cardIds[i];
//         try {
//             const lineupDocumentPath = `leagues/${leagueId}/cards/${cardId}/lineups`;
//             const lineup = await db.readDocument(lineupDocumentPath, gameWeek);
//             if(!lineup) {
//                 console.log(lineupDocumentPath)
//                 console.log("This lineup object is empty for some reason")
//             }
//             console.log('lineup cardId: ' + lineup._cardId)
//             let needsToUpdate = false;
//             for(let i = 0; i < lineup.startingTeamArr.length; i++) {
//                 if(changes.includes(lineup.startingTeamArr[i])) {
//                     needsToUpdate = true;
//                     break;
//                 }
//             }
//             if(!needsToUpdate) {
//                 console.log('This lineup does not contain any teams that had score changes so we are returning')
//                 return 0;
//             }
//             const scores = await db.readDocument('scores', gameWeek); 
//             const QBPoints = getQBPoints(scores, lineup, 'QB');
//             const RBPoints = getRBPoints(scores, lineup, 'RB');
//             const WRPoints = getWRPoints(scores, lineup, 'WR');
//             const TEPoints = getTEPoints(scores, lineup, 'TE');
//             const DSTPoints = getDSTPoints(scores, lineup, 'DST');
//             const totalPoints = parseFloat(sum([QBPoints, RBPoints, WRPoints, TEPoints, DSTPoints]).toFixed(2));
//             lineup.gameWeek = gameWeek;
//             lineup.scoreWeek = totalPoints;
//             lineup.scoreSeason = parseFloat((lineup.prevWeekSeasonScore + totalPoints).toFixed(2));
//             if(lineup._cardId != cardId) {
//                 console.error(`Tried to update a lineup to a wrong card number`)
//                 await utils.sleep(5000)
//                 return;
//             }
//             await db.createOrUpdateDocument(lineupDocumentPath, gameWeek, lineup, false);
//             console.log(`...🏈   score:${totalPoints} gameWeek:${gameWeek} documentPath:${lineupDocumentPath}`);
//             if (leagueId == 'minted-playoffs-2022-2023') {
//                 const card = await db.readDocument('playoffCards', cardId)
//                 const leaderboardObject = {
//                 card,
//                 cardId,
//                 scoreWeek: lineup.scoreWeek,
//                 scoreSeason: lineup.scoreSeason,
//                 ownerId: card._ownerId,
//                 level: card._level,
//                 lineup, 
//                 }
//                 await db.createOrUpdateDocument(`mintedPlayoffs2022Leaderboard/${gameWeek}/cards`, cardId, leaderboardObject, true);
//                 console.log(`Updated genesisLeaderboard for card: ${cardId} to a scoreWeek of ${leaderboardObject.scoreWeek} and a scoreSeason of ${leaderboardObject.scoreSeason}`)
//             } else if (leagueId == 'genesis-playoff-league') {
//                 const card = await db.readDocument('playoffCards', cardId)
//                 const leaderboardObject = {
//                 card,
//                 cardId,
//                 scoreWeek: lineup.scoreWeek,
//                 scoreSeason: lineup.scoreSeason,
//                 ownerId: card._ownerId,
//                 level: card._level,
//                 lineup, 
//                 }
//                 await db.createOrUpdateDocument(`genesisPlayoffsLeaderboard/${gameWeek}/cards`, cardId, leaderboardObject, true);
//                 console.log(`Updated genesisLeaderboard for card: ${cardId} to a scoreWeek of ${leaderboardObject.scoreWeek} and a scoreSeason of ${leaderboardObject.scoreSeason}`)
//             }
//         } catch (err) {
//             console.error(`...💩   league:${leagueId} card:${cardId}, gameWeek:${gameweek} ${err}`);
//         }
//     }
//     console.log(`End of scoring the minted playoff leagues`)
// }

// trigger at scoreChangeStaging/{gameweek}
internals.scoreLineupsInGenesisPlayoffLeagueInParts = async (change, context, min, max) => {
    console.log(`start of scoring genesis playoff leagues from ${min} to ${max}`);
    const gameweek = context.params.gameweek;
    const data = change.after.data();
    const changes = data.changes;
    const leagueId = 'genesis-playoff-league';
    for(let i = min; i < max; i++) {
        const cardId = `${i}`;
        try {
            await scoreTriggers.playoffLineupScoreMachine(cardId, gameweek, changes);
        } catch (err) {
            console.error(`...💩   league:${leagueId} card:${cardId}, gameWeek:${gameweek} ${err}`);
        }
    }
    console.log(`End of scoring genesis playoff leagues from ${min} to ${max}`);
}

module.exports = internals;

