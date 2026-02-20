//PACKAGES

//SERVICES
const db = require('./db');
const sbs = require('./sbs');
const utils = require('./utils');
const env = require('./env');

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

// lineupDocumentPath, lineup.scoreWeek, gameWeek
internals.calcSeasonScore = async (lineupDocumentPath, currentScore, currentGameWeek) => {
  const seasonScores = [currentScore];
  let currentSeasonGameWeeks = sbs.getCurrentSeasonGameWeeks(currentGameWeek);
  // console.log(`Return from getCurrentSeasonGameWeeks: ${currentSeasonGameWeeks}`);
  // console.log(`current weeks score: ${currentSeasonGameWeeks[0]}`);
  // console.log(`length of result array: ${currentSeasonGameWeeks.length}`)
  currentSeasonGameWeeks = currentSeasonGameWeeks.filter(gameWeek => gameWeek != currentGameWeek);
  //console.log(`Length of result array after filtering out current week: ${currentSeasonGameWeeks.length}`)
  for(let i = 0; i < currentSeasonGameWeeks.length; i++){
    const gameWeek = currentSeasonGameWeeks[i];
    const lineup = await db.readDocument(lineupDocumentPath, gameWeek);
    if(!lineup) {
      continue;
    }
    if(!lineup.scoreWeek) {
      console.log(`There was a lineup but no scoreWeek for document at ${lineupDocumentPath}/${gameWeek}`)
    }
    if(lineup) lineup.scoreWeek && seasonScores.push(lineup.scoreWeek);
  }
  if (seasonScores.length == 1) {
    console.log("ONLY HAVE A SCORE ARRAY LENGTH OF 1 SO NO OTHER WEEKS WERE INCLUDED IN SEASON SCORE")
  }
  // if array has more than one entry, it means this is a multi week league and must be summed.
  // if not, then just return the currentScore itself, as it indicates the first week of this specific league
  return seasonScores.length > 1 ? parseFloat(sum(seasonScores).toFixed(2)) : currentScore
}


internals.lineup = async (leagueId, cardId, gameWeek) => {
  const lineupDocumentPath = `leagues/${leagueId}/cards/${cardId}/lineups`;
  const genesisLeaderboardDocumentPath = `genesisLeaderboard/${gameWeek}/cards`;
  const lineup = await db.readDocument(lineupDocumentPath, gameWeek);
  if(!lineup) {
    console.log(lineupDocumentPath)
    console.log("This lineup object is empty for some reason")
  }
  const scores = await db.readDocument('scores', gameWeek); 
  const card = await db.readDocument('cards', cardId);
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
    lineup.scoreSeason = await internals.calcSeasonScore(lineupDocumentPath, lineup.scoreWeek, gameWeek)
  }
  await db.createOrUpdateDocument(lineupDocumentPath, gameWeek, lineup, false);
  console.log(`...🏈   score:${totalPoints} gameWeek:${gameWeek} documentPath:${lineupDocumentPath}`);
  // TODO: ownerId is stale compared to ownerId returned by cardId. Most likely due to no refresh after a card transfer
  // Needs to refresh and make sure to update the ownerId
  if (leagueId == 'genesis') {
    const leaderboardObject = {
      card,
      cardId,
      scoreWeek: lineup.scoreWeek,
      scoreSeason: lineup.scoreSeason,
      ownerId: card._ownerId,
      level: card._level,
      lineup, 
    }
    await db.createOrUpdateDocument(genesisLeaderboardDocumentPath, cardId, leaderboardObject, false);
  }
  return 0;
}

internals.scoreLineupsInGenesis = async (gameWeek, start, end) => {
  console.log(`...🔢 START scoreLineupsInGenesis: ${start} thru ${end}`);
  const leagueId = 'genesis';
  for (let i = start; i < end; i++) {
    const cardId = `${i}`;
    try {
      await internals.lineup(leagueId, cardId, gameWeek);
    } catch (err) {
      console.error(`...💩   league:${leagueId} card:${cardId}, gameWeek:${gameWeek} ${err}`);
      continue;
    }
  }
  console.log(`...🔢 END scoreLineupsInGenesis: ${start} thru ${end}`);
}

internals.scoreLeagues = async (gameWeek) => {
  let leagueIds = await db.readAllDocumentIds('leagues');
  leagueIds = leagueIds.filter(league => league != 'genesis'); //do all leagues expect genesis
  for (let i = 0; i < leagueIds.length; i++) {
    const leagueId = leagueIds[i];
    const cardIds = await db.readAllDocumentIds(`leagues/${leagueId}/cards`);
    for(let j = 0; j < cardIds.length; j++){
      const cardId = cardIds[j];
      try{
        await internals.lineup(leagueId, cardId, gameWeek)
      } catch(err){
        console.error(`...💩   league:${leagueId} card:${cardId}, gameWeek:${gameWeek} ${err}`);
        continue;
      }
    }
    
  }
} 

module.exports = internals;