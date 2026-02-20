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
const { defaultDatabase } = require("firebase-functions/v1/firestore");
const { JsonRpcBatchProvider } = require("@ethersproject/providers");

const internals = {};

// trigger on all genesis lineups for when scoreWeek or scoreSeason change
// at leagues/genesis/cards/{cardId}/lineups/
internals.scoreLineupsChampionshipRounds = async (change, context) => {
    const gameweek = context.params.gameweek;
    const newDocument = change.after.data();
    const changes = newDocument.changes;
    //let leagueIds = await db.readAllDocumentIds(`leagues`);
    //leagueIds = leagueIds.filter(x => x.indexOf('Season') == -1 && x.indexOf('Weekly') == -1 && x.indexOf('PROMO') == -1 && x.indexOf('genesis') == -1);
    let leagueIds = ['2023-Bottom-Round-3', '2023-HOF-Round-3', '2023-Pro-Round-3', '2023-Spoiled-Round-3']
    for(let i = 0; i < leagueIds.length; i++) {
        const leagueId = leagueIds[i];
        //const splitArray = leagueId.split('-');

        console.log(`Scoring lineups in playoff league: ${leagueId}`);
        const cardIds = await db.readAllDocumentIds(`leagues/${leagueId}/cards`);
        for(let j = 0; j < cardIds.length; j++) {
            const cardId = cardIds[j];
            console.log(cardId);
            const lineup = await db.readDocument(`leagues/${leagueId}/cards/${cardId}/lineups`, gameweek);
            if(!lineup) {
                console.log('no lineup found for card in league');
                continue;
            }
            const genesisLineup = await db.readDocument(`leagues/genesis/cards/${cardId}/lineups`, gameweek);
            if(!genesisLineup) {
                console.log('no genesis lineup found for card ' + cardId);
                continue;
            }
            lineup.starting = genesisLineup.starting;
            lineup.bench = genesisLineup.bench;
            lineup.startingTeamArr = genesisLineup.startingTeamArr;
            lineup.scoreWeek = genesisLineup.scoreWeek;
            lineup.scoreSeason = parseFloat((lineup.prevWeekSeasonScore + lineup.scoreWeek).toFixed(4));
            console.log('score season: ' + lineup.scoreSeason);
            await db.createOrUpdateDocument(`leagues/${leagueId}/cards/${cardId}/lineups`, gameweek, lineup, true)
            console.log(`Updated card ${cardId} in ${leagueId}`)
            await utils.sleep(100);
            try {
                await scoreTriggers.lineupScoreMachine(leagueId, cardId, gameweek, changes);
            } catch (err) {
                console.error(`...💩   league:${leagueId} card:${cardId}, gameWeek:${gameweek} ${err}`);
                console.error(err)
            }
            const splitArr = leagueId.split('-');
            const level = splitArr[1];
            if(level.toLowerCase() == 'pro') {
                const obj = await db.readDocument(`proChampionshipRoundLeaderboard/${gameweek}/cards`, cardId);
                const lineup = await db.readDocument(`leagues/${leagueId}/cards/${cardId}/lineups`, gameweek);
                if(!lineup) {
                    continue;
                }
                obj.scoreWeek = lineup.scoreWeek;
                obj.scoreSeason = lineup.scoreSeason;
                obj.lineup = lineup;
                await db.createOrUpdateDocument(`proChampionshipRoundLeaderboard/${gameweek}/cards`, cardId, obj, false);
                console.log('Updated Pro championship round leaderboard for card ' + cardId)

            } else if (level.toLowerCase() == 'hof') {
                const obj = await db.readDocument(`hofChampionshipRoundLeaderboard/${gameweek}/cards`, cardId);
                const lineup = await db.readDocument(`leagues/${leagueId}/cards/${cardId}/lineups`, gameweek);
                if(!lineup) {
                    continue;
                }
                obj.scoreWeek = lineup.scoreWeek;
                obj.scoreSeason = lineup.scoreSeason;
                obj.lineup = lineup;
                await db.createOrUpdateDocument(`hofChampionshipRoundLeaderboard/${gameweek}/cards`, cardId, obj, false);
                console.log('Updated hof championship round leaderboard for card ' + cardId)

            } else if (level.toLowerCase() == 'spoiled') {
                const obj = await db.readDocument(`spoiledChampionshipRoundLeaderboard/${gameweek}/cards`, cardId);
                const lineup = await db.readDocument(`leagues/${leagueId}/cards/${cardId}/lineups`, gameweek);
                if(!lineup) {
                    continue;
                }
                obj.scoreWeek = lineup.scoreWeek;
                obj.scoreSeason = lineup.scoreSeason;
                obj.lineup = lineup;
                await db.createOrUpdateDocument(`spoiledChampionshipRoundLeaderboard/${gameweek}/cards`, cardId, obj, false);
                console.log('Updated spoiled championship round leaderboard for card ' + cardId)

            } else if (level.toLowerCase() == 'bottom') {
                const obj = await db.readDocument(`bottomChampionshipRoundLeaderboard/${gameweek}/cards`, cardId);
                const lineup = await db.readDocument(`leagues/${leagueId}/cards/${cardId}/lineups`, gameweek);
                if(!lineup) {
                    continue;
                }
                obj.scoreWeek = lineup.scoreWeek;
                obj.scoreSeason = lineup.scoreSeason;
                obj.lineup = lineup;
                await db.createOrUpdateDocument(`bottomChampionshipRoundLeaderboard/${gameweek}/cards`, cardId, obj, false);
                console.log('Updated bottom championship round leaderboard for card ' + cardId)
            }
        }
    }
}

const sum = (arr) => arr.reduce((accumulator, value) => {
    return accumulator + value;
}, 0);

internals.checkScoreInLineups = async (leagueId, gameweek) => {
    console.log(`Scoring lineups in ${leagueId}`);
    const results = [];
    const cardIds = await db.readAllDocumentIds(`leagues/${leagueId}/cards`);
    for(let i = 0; i < cardIds.length; i++) {
        const cardId = cardIds[i];
        const lineup = await db.readDocument(`leagues/${leagueId}/cards/${cardId}/lineups`, gameweek);
        if(!lineup.prevWeekSeasonScore) {
            console.log(`Did not have prevWeekSeasonScore for card ${cardId} in ${leagueId}`)
            results.push({ cardId: cardId, error: "did not have prevWeekSeasonScore"})
        }
        if(!lineup.startingTeamArr) {
            console.log(`Did not have startingTeamArr for card ${cardId} in ${leagueId}`)
            results.push({ cardId: cardId, error: "did not have startingTeamArr"})
        }

        const scores = await db.readDocument('scores', gameweek);
        const qbPoints = utils.getPointsFromScore(scores, lineup.starting.QB[0], 'QB');
        const rbPoints = utils.getPointsFromScore(scores, lineup.starting.RB[0], 'RB');
        const rb2Points = utils.getPointsFromScore(scores, lineup.starting.RB[1], 'RB');
        const wrPoints = utils.getPointsFromScore(scores, lineup.starting.WR[0], 'WR');
        const wwr2Points = utils.getPointsFromScore(scores, lineup.starting.WR[1], 'WR');
        const wr3Points = utils.getPointsFromScore(scores, lineup.starting.WR[2], 'WR');
        const tePoints = utils.getPointsFromScore(scores, lineup.starting.TE[0], 'TE');
        const dstPoints = utils.getPointsFromScore(scores, lineup.starting.DST[0], 'DST');
        const totalPoints = parseFloat(sum([qbPoints, rbPoints, rb2Points, wrPoints, wwr2Points, wr3Points, tePoints, dstPoints]).toFixed(2));

        if(totalPoints != lineup.scoreWeek) {
            results.push({ cardId: cardId, error: `leagueId: ${leagueId} ...weekly score mismatch`})
        }


    }
}

// trigger for leagues/genesis/cards/{cardId}/lineups/{gameweek}
internals.updateLineupsInChampionships = async (change, context) => {
    const cardId = context.params.cardId;
    const gameweek = context.params.gameweek;
    const before = change.before.data();
    const after = change.after.data();
    if(JSON.stringify(before.starting) == JSON.stringify(after.starting)) {
        console.log('No lineups change found so returning')
        return 0;
    }
    const proLineup = await db.readDocument(`leagues/2023-Pro-Round-1/cards/${cardId}/lineups`, gameweek);
    if(proLineup) {
        await db.createOrUpdateDocument(`leagues/2023-Pro-Round-1/cards/${cardId}/lineups`, gameweek, { starting: after.starting, bench: after.bench, startingTeamArr: after.startingTeamArr }, true);
        console.log(`Updated lineup for card ${cardId} in Pro championships`)
    }
    const hofLineup = await db.readDocument(`leagues/2023-HOF-Round-1/cards/${cardId}/lineups`, gameweek);
    if(hofLineup) {
        await db.createOrUpdateDocument(`leagues/2023-HOF-Round-1/cards/${cardId}/lineups`, gameweek, { starting: after.starting, bench: after.bench, startingTeamArr: after.startingTeamArr }, true);
        console.log(`Updated lineup for card ${cardId} in HOF championships`)
    }
    const spoiledLineup = await db.readDocument(`leagues/2023-HOF-Round-1/cards/${cardId}/lineups`, gameweek);
    if(spoiledLineup) {
        await db.createOrUpdateDocument(`leagues/2023-Spoiled-Round-1/cards/${cardId}/lineups`, gameweek, { starting: after.starting, bench: after.bench, startingTeamArr: after.startingTeamArr }, true);
        console.log(`Updated lineup for card ${cardId} in Spoiled championships`)
    }
    const bottomLineup = await db.readDocument(`leagues/2023-Bottom-Round-1/cards/${cardId}/lineups`, gameweek)
    if(bottomLineup) {
        await db.createOrUpdateDocument(`leagues/2022-Bottom-Round-1/cards/${cardId}/lineups`, gameweek, { starting: after.starting, bench: after.bench, startingTeamArr: after.startingTeamArr }, true);
        console.log(`Updated lineup for card ${cardId} in Bottom championships`)
    }
    console.log('Either the lineup was updated or this card didnt make the championship rounds')
    return 0;
}

module.exports = internals;