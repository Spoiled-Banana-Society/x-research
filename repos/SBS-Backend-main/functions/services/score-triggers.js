const jwt = require('jsonwebtoken');
const web3 = require('web3');
require("firebase-functions/lib/logger/compat");
const functions = require("firebase-functions");

// Services
const db = require("./db");
const cardContract = require("./cardContract");
const cardActionContract = require("./cardActionContract");
const dstScoring = require("./dst-scoring");
const txUtils = require("./tx");
const api = require("./api");
const env = require("./env");
const sbs = require("./sbs");
const utils = require("./utils");
const score = require('./score');
const stat = require('./stat');

const internals = {};

const getQBPoints = (scores, lineup, position) => {
    const team = lineup.starting.QB[0];
    const points = utils.getPointsFromScore(scores, team, position);
    const total = points;
    return total;
}

const getRBPoints = (scores, lineup, position) => {
    const team1 = lineup.starting.RB[0];
    const team2 = lineup.starting.RB[1];
    const points1 = utils.getPointsFromScore(scores, team1, position);
    const points2 = utils.getPointsFromScore(scores, team2, position);
    const total = points1 + points2;
    return total;
}

const getWRPoints = (scores, lineup, position) => {
    const team1 = lineup.starting.WR[0];
    const team2 = lineup.starting.WR[1];
    const team3 = lineup.starting.WR[2];
    const points1 = utils.getPointsFromScore(scores, team1, position);
    const points2 = utils.getPointsFromScore(scores, team2, position);
    const points3 = utils.getPointsFromScore(scores, team3, position);
    const total = points1 + points2 + points3;
    return total;
}

const getTEPoints = (scores, lineup, position) => {
    const team = lineup.starting.TE[0];
    const points = utils.getPointsFromScore(scores, team, position);
    const total = points;
    return total;
}

const getDSTPoints = (scores, lineup, position) => {
    const team = lineup.starting.DST[0];
    const points = utils.getPointsFromScore(scores, team, position);
    const total = points;
    return total;
};

const sum = (arr) => arr.reduce((accumulator, value) => {
    return accumulator + value;
}, 0);

internals.onScoreUpdate = async (change, context) => {
    console.log(`START: onScoreUpdate to find all scoring changes`)
    const gameweek = context.params.gameweek;
    console.log(`START score.onUpdate in ${gameweek}`)
    const results = [];
    
    const before = change.before.data();
    const after = change.after.data();
    const beforeScores = before.FantasyPoints;
    const afterScores = after.FantasyPoints;

    // if any scores in a team is different add a changed object to the results array
    for (let i = 0; i < beforeScores.length; i++) {
        let newTeamScores = afterScores.find(obj => obj.Team == beforeScores[i].Team)
        let teamScoreChanged = false;
        if (beforeScores[i].QB != newTeamScores.QB) {        
            teamScoreChanged = true;
            console.log(`Found scoring change for ${newTeamScores.Team} for their QB`)
        } else if (beforeScores[i].RB != newTeamScores.RB) {
            teamScoreChanged = true;
            console.log(`Found scoring change for ${afterScores[i].Team} for their RB`)
        } else if (beforeScores[i].WR != newTeamScores.WR) {
            teamScoreChanged = true;
            console.log(`Found scoring change for ${newTeamScores.Team} for their WR`)
        } else if (beforeScores[i].TE != newTeamScores.TE) {
            teamScoreChanged = true;
            console.log(`Found scoring change for ${newTeamScores.Team} for their TE`)
        } else if (beforeScores[i].DST != newTeamScores.DST) {
            teamScoreChanged = true;
            console.log(`Found scoring change for ${newTeamScores.Team} for their DST`)
        }
        if(teamScoreChanged) {
            let team = newTeamScores.Team;
            if(team === 'LA') team = 'LAR';
            if(team === 'JAC') team = 'JAX';
            results.push(team)
        }
    }
    //update staging table with the changes in score so that we can update the leagues
    if (results.length != 0) {
        const res = {
            updatedAt: db._getTimeStamp(),
            changes: results
        }
        await db.createOrUpdateDocument(`scoringChangeStaging`, gameweek, res, false)
    }
    console.log(`FINISHED running onScoreUpdate... we found a total of ${results.length} scoring changes and added them to the staging table`)
    return 0;
}

internals.lineupScoreMachine = async (leagueId, cardId, gameWeek, changes) => {
    const lineupDocumentPath = `leagues/${leagueId}/cards/${cardId}/lineups`;
    const genesisLeaderboardDocumentPath = `genesisLeaderboard/${gameWeek}/cards`;
    const lineup = await db.readDocument(lineupDocumentPath, gameWeek);
    if(!lineup) {
        console.log(lineupDocumentPath)
        console.log("This lineup object is empty for some reason")
    }
    console.log('lineup cardId: ' + lineup._cardId)
    let needsToUpdate = false;
    for(let i = 0; i < lineup.startingTeamArr.length; i++) {
        if(changes.includes(lineup.startingTeamArr[i])) {
            needsToUpdate = true;
            break;
        }
    }
    if(!needsToUpdate) {
        console.log('This lineup does not contain any teams that had score changes so we are returning')
        return 0;
    }
    const scores = await db.readDocument('scores', gameWeek); 
    //console.log(scores)
    const QBPoints = getQBPoints(scores, lineup, 'QB');
    const RBPoints = getRBPoints(scores, lineup, 'RB');
    const WRPoints = getWRPoints(scores, lineup, 'WR');
    const TEPoints = getTEPoints(scores, lineup, 'TE');
    const DSTPoints = getDSTPoints(scores, lineup, 'DST');
    const totalPoints = parseFloat(sum([QBPoints, RBPoints, WRPoints, TEPoints, DSTPoints]).toFixed(2));
    lineup.gameWeek = gameWeek;
    lineup.scoreWeek = totalPoints;
    if ((leagueId.split('('))[0] == "Weekly") {
        console.log("Caught weekly league setting scoreSeason to scoreWeek")
        lineup.scoreSeason = totalPoints;
    } else {
        lineup.scoreSeason = parseFloat((lineup.prevWeekSeasonScore + totalPoints).toFixed(2));
    }
    if(lineup._cardId != cardId) {
        console.error(`Tried to update a lineup to a wrong card number`)
        await utils.sleep(5000)
        return;
    }
    await db.createOrUpdateDocument(lineupDocumentPath, gameWeek, lineup, false);
    console.log(`...🏈   score:${totalPoints} gameWeek:${gameWeek} documentPath:${lineupDocumentPath}`);
    if (leagueId == 'genesis') {
        const card = await db.readDocument('cards', cardId)
        const dbLeaderboardObj = await db.readDocument(`genesisLeaderboard/${gameWeek}/cards`, cardId)
        const leaderboardObject = {
          card,
          cardId,
          scoreWeek: lineup.scoreWeek,
          scoreSeason: lineup.scoreSeason,
          ownerId: card._ownerId,
          level: card._level,
          lineup, 
          PFP: dbLeaderboardObj.PFP
        }
        await db.createOrUpdateDocument(genesisLeaderboardDocumentPath, cardId, leaderboardObject, false);
        console.log(`Updated genesisLeaderboard for card: ${cardId} to a scoreWeek of ${leaderboardObject.scoreWeek} and a scoreSeason of ${leaderboardObject.scoreSeason}`)
    } else if (leagueId == 'minted-playoffs-2022-2023') {
        const card = await db.readDocument('playoffCards', cardId)
        const leaderboardObject = {
          card,
          cardId,
          scoreWeek: lineup.scoreWeek,
          scoreSeason: lineup.scoreSeason,
          ownerId: card._ownerId,
          level: card._level,
          lineup, 
        }
        await db.createOrUpdateDocument(`mintedPlayoffs2022Leaderboard/${gameWeek}/cards`, cardId, leaderboardObject, true);
        console.log(`Updated genesisLeaderboard for card: ${cardId} to a scoreWeek of ${leaderboardObject.scoreWeek} and a scoreSeason of ${leaderboardObject.scoreSeason}`)
    } else if (leagueId == 'genesis-playoff-league') {
        const card = await db.readDocument('playoffCards', cardId)
        const leaderboardObject = {
          card,
          cardId,
          scoreWeek: lineup.scoreWeek,
          scoreSeason: lineup.scoreSeason,
          ownerId: card._ownerId,
          level: card._level,
          lineup, 
        }
        await db.createOrUpdateDocument(`genesisPlayoffsLeaderboard/${gameWeek}/cards`, cardId, leaderboardObject, true);
        console.log(`Updated genesisLeaderboard for card: ${cardId} to a scoreWeek of ${leaderboardObject.scoreWeek} and a scoreSeason of ${leaderboardObject.scoreSeason}`)
    }

    return lineup;
}

internals.playoffLineupScoreMachine = async (cardId, gameWeek, changes) => {
    const lineupDocumentPath = `leagues/genesis-playoff-league/cards/${cardId}/lineups`;
    const genesisLeaderboardDocumentPath = `genesisPlayoffsLeaderboard/${gameWeek}/cards`;
    const lineup = await db.readDocument(lineupDocumentPath, gameWeek);
    if(!lineup) {
        console.log(lineupDocumentPath)
        console.log("This lineup object is empty for some reason")
        return 0;
    }
    console.log('lineup cardId: ' + lineup._cardId)
    // let needsToUpdate = false;
    // for(let i = 0; i < lineup.startingTeamArr.length; i++) {
    //     if(changes.includes(lineup.startingTeamArr[i])) {
    //         needsToUpdate = true;
    //         break;
    //     }
    // }
    // if(!needsToUpdate) {
    //     console.log('This lineup does not contain any teams that had score changes so we are returning')
    //     return 0;
    // }
    const scores = await db.readDocument('scores', gameWeek); 
    const QBPoints = getQBPoints(scores, lineup, 'QB');
    const RBPoints = getRBPoints(scores, lineup, 'RB');
    const WRPoints = getWRPoints(scores, lineup, 'WR');
    const TEPoints = getTEPoints(scores, lineup, 'TE');
    const DSTPoints = getDSTPoints(scores, lineup, 'DST');
    const totalPoints = parseFloat(sum([QBPoints, RBPoints, WRPoints, TEPoints, DSTPoints]).toFixed(2));
    lineup.gameWeek = gameWeek;
    lineup.scoreWeek = totalPoints;
    lineup.scoreSeason = parseFloat((lineup.prevWeekSeasonScore + totalPoints).toFixed(2));
    if(lineup._cardId != cardId) {
        throw(`Tried to update a lineup to a wrong card number`)
        // await utils.sleep(5000)
        // return 0;
    }
    await db.createOrUpdateDocument(lineupDocumentPath, gameWeek, lineup, false);
    console.log(`...🏈   score:${totalPoints} gameWeek:${gameWeek} documentPath:${lineupDocumentPath}`);
    const card = await db.readDocument('playoffCards', cardId);
    const leaderboardObject = {
        card,
        cardId,
        scoreWeek: lineup.scoreWeek,
        scoreSeason: lineup.scoreSeason,
        ownerId: card._ownerId,
        level: card._level,
        lineup, 
      }
    await db.createOrUpdateDocument(`genesisPlayoffsLeaderboard/${gameWeek}/cards`, cardId, leaderboardObject, true);
    console.log(`Updated genesisLeaderboard for card: ${cardId} to a scoreWeek of ${leaderboardObject.scoreWeek} and a scoreSeason of ${leaderboardObject.scoreSeason}`);

    if (Number(cardId) >= 10000) {
        await db.createOrUpdateDocument(`leagues/minted-playoffs-2022-2023/cards/${cardId}/lineups`, gameWeek, lineup, false)
        await db.createOrUpdateDocument(`mintedPlayoffs2022Leaderboard/${gameWeek}/cards`, cardId, leaderboardObject, true);
        console.log(`Updated genesisLeaderboard and lineup in minted for card: ${cardId} to a scoreWeek of ${leaderboardObject.scoreWeek} and a scoreSeason of ${leaderboardObject.scoreSeason}`)
    } 

    return lineup;
}

internals.scoreLineupsInGenesis = async (change, context, start, end) => {
    const gameweek = context.params.gameweek;
    const newDocument = change.after.data();
    const changes = newDocument.changes;
    console.log(`...🔢 START scoreLineupsInGenesis: ${start} thru ${end}`);
    const leagueId = 'genesis';
    for (let i = start; i < end; i++) {
      const cardId = `${i}`;
      try {
        await internals.lineupScoreMachine(leagueId, cardId, gameweek, changes);
      } catch (err) {
        console.error(`...💩   league:${leagueId} card:${cardId}, gameWeek:${gameweek} ${err}`);
        continue;
      }
    }
    console.log(`...🔢 END scoreLineupsInGenesis: ${start} thru ${end}`);
}

internals.scoreWeeklyLeagues = async (change, context) => {
    const gameweek = context.params.gameweek;
    const newDocument = change.after.data();
    const changes = newDocument.changes;
    let leagueIds = await db.readAllDocumentIds('leagues');
    const currentWeekStrings = utils.getStringsForCurrentWeek2022(gameweek)
    leagueIds = leagueIds.filter(item => item.includes(currentWeekStrings[1]));
    for(let i = 0; i < leagueIds.length; i++) {
        const leagueId = leagueIds[i];
        const league = await db.readDocument('leagues', leagueId);
        if(league.game.currentPlayers < league.game.minPlayers) {
            console.log(`league: ${leagueId} has only ${league.game.currentPlayers} of the minimum players which is ${league.game.minPlayers} so we are skipping it`)
            continue;
        }
        const cardIds = await db.readAllDocumentIds(`leagues/${leagueId}/cards`);
        for(let j = 0; j < cardIds.length; j++) {
            const cardId = cardIds[j];
            try {
                await internals.lineupScoreMachine(leagueId, cardId, gameweek, changes)
            } catch (err) {
                console.error(`...💩   league:${leagueId} card:${cardId}, gameWeek:${gameweek} ${err}`)
                continue;
            }
        }
    }
}

internals.scoreSeasonLeaguesPart1 = async (change, context) => {
    const gameweek = context.params.gameweek;
    const newDocument = change.after.data();
    const changes = newDocument.changes;
    let leagueIds = await db.readAllDocumentIds('leagues');
    leagueIds = leagueIds.filter(item => item.includes('Season') || item.includes('PROMO'));
    const length = leagueIds.length;
    const divBy3 = Math.floor(length / 3);
    const leagueIdsPart1 = leagueIds.slice(0, divBy3)
    for(let i = 0; i < leagueIdsPart1.length; i++) {
        const leagueId = leagueIdsPart1[i];
        const league = await db.readDocument('leagues', leagueId);
        if(league.game.currentPlayers < league.game.minPlayers) {
            console.log(`league: ${leagueId} has only ${league.game.currentPlayers} of the minimum players which is ${league.game.minPlayers} so we are skipping it`)
            continue;
        }
        const cardIds = await db.readAllDocumentIds(`leagues/${leagueId}/cards`);
        for(let j = 0; j < cardIds.length; j++) {
            const cardId = cardIds[j];
            try {
                await internals.lineupScoreMachine(leagueId, cardId, gameweek, changes)
            } catch (err) {
                console.error(`...💩   league:${leagueId} card:${cardId}, gameWeek:${gameweek} ${err}`)
                continue;
            }
        }
    }
}

internals.scoreSeasonLeaguesPart2 = async (change, context) => {
    const gameweek = context.params.gameweek;
    const newDocument = change.after.data();
    const changes = newDocument.changes;
    let leagueIds = await db.readAllDocumentIds('leagues');
    leagueIds = leagueIds.filter(item => item.includes('Season') || item.includes('PROMO'));
    const length = leagueIds.length;
    const divBy3 = Math.floor(length / 3);
    const leagueIdsPart2 = leagueIds.slice(divBy3, divBy3*2)
    for(let i = 0; i < leagueIdsPart2.length; i++) {
        const leagueId = leagueIdsPart2[i];
        const league = await db.readDocument('leagues', leagueId);
        if(league.game.currentPlayers < league.game.minPlayers) {
            console.log(`league: ${leagueId} has only ${league.game.currentPlayers} of the minimum players which is ${league.game.minPlayers} so we are skipping it`)
            continue;
        }
        const cardIds = await db.readAllDocumentIds(`leagues/${leagueId}/cards`);
        for(let j = 0; j < cardIds.length; j++) {
            const cardId = cardIds[j];
            try {
                await internals.lineupScoreMachine(leagueId, cardId, gameweek, changes)
            } catch (err) {
                console.error(`...💩   league:${leagueId} card:${cardId}, gameWeek:${gameweek} ${err}`)
                continue;
            }
        }
    }
}

internals.scoreSeasonLeaguesPart3 = async (change, context) => {
    const gameweek = context.params.gameweek;
    const newDocument = change.after.data();
    const changes = newDocument.changes;
    let leagueIds = await db.readAllDocumentIds('leagues');
    leagueIds = leagueIds.filter(item => item.includes('Season') || item.includes('PROMO'));
    const length = leagueIds.length;
    const divBy3 = Math.floor(length / 3);
    const leagueIdsPart3 = leagueIds.slice(divBy3*2, leagueIds.length)
    for(let i = 0; i < leagueIdsPart3.length; i++) {
        const leagueId = leagueIdsPart3[i];
        const league = await db.readDocument('leagues', leagueId);
        if(league.game.currentPlayers < league.game.minPlayers) {
            console.log(`league: ${leagueId} has only ${league.game.currentPlayers} of the minimum players which is ${league.game.minPlayers} so we are skipping it`)
            continue;
        }
        const cardIds = await db.readAllDocumentIds(`leagues/${leagueId}/cards`);
        for(let j = 0; j < cardIds.length; j++) {
            const cardId = cardIds[j];
            try {
                await internals.lineupScoreMachine(leagueId, cardId, gameweek, changes)
            } catch (err) {
                console.error(`...💩   league:${leagueId} card:${cardId}, gameWeek:${gameweek} ${err}`)
                continue;
            }
        }
    }
}


internals.onLineupChange = async (change, context) => {
    const gameweek = context.params.gameweek;
    const leagueId = context.params.leagueId;
    const cardId = context.params.cardId;
    const before = change.before.data();
    const after = change.before.data();
    let needsToUpdate = false;
    if(before.starting.QB[0] != after.starting.QB[0]) {
        needsToUpdate = true;
    } else if (before.starting.RB[0] != after.starting.RB[0]) {
        needsToUpdate = true;
    } else if (before.starting.RB[1] != after.starting.RB[1]) {
        needsToUpdate = true;
    } else if (before.starting.WR[0] != after.starting.WR[0]) {
        needsToUpdate = true;
    } else if (before.starting.WR[1] != after.starting.WR[1]) {
        needsToUpdate = true;
    } else if (before.starting.WR[2] != after.starting.WR[2]) {
        needsToUpdate = true;
    } else if (before.starting.TE[0] != after.starting.TE[0]) {
        needsToUpdate = true;
    } else if (before.starting.DST[0] != after.starting.DST[0]) {
        needsToUpdate = true;
    }
    const lineup = after;
    if(needsToUpdate) {
        const startingArr = [];
        startingArr.push(lineup.starting.DST[0])
        if(!startingArr.includes(lineup.starting.QB[0])) {
            startingArr.push(lineup.starting.QB[0])
        }
        if(!startingArr.includes(lineup.starting.RB[0])) {
            startingArr.push(lineup.starting.RB[0])
        }
        if(!startingArr.includes(lineup.starting.RB[1])) {
            startingArr.push(lineup.starting.RB[1])
        }
        if(!startingArr.includes(lineup.starting.WR[0])) {
            startingArr.push(lineup.starting.WR[0])
        }
        if(!startingArr.includes(lineup.starting.WR[1])) {
            startingArr.push(lineup.starting.WR[1])
        }
        if(!startingArr.includes(lineup.starting.WR[2])) {
            startingArr.push(lineup.starting.WR[2])
        }
        if(!startingArr.includes(lineup.starting.TE[0])) {
            startingArr.push(lineup.starting.TE[0])
        }
        lineup.startingTeamArr = startingArr;
        await db.createOrUpdateDocument(`leagues/${leagueId}/cards/${cardId}/lineups`, gameweek, lineup, false)
    }
    console.log(`COMPLETED UPDATING: lineup for ${cardId} has been updated with up to date teams array`)
    return 0
}




module.exports = internals;