//PACKAGES
require("firebase-functions/lib/logger/compat");
const { FieldValue } = require('firebase-admin/firestore');
const { v4: uuidv4 } = require('uuid');

//SERVICES
const db = require('./db');
const sbs = require('./sbs');
const utils = require('./utils');
const env = require('./env');

const internals = {};


// Internal helper functions that aren't exported 
const _rankResults = (results, sortType, leagueId) => {
    //sort 
    results = (sortType === 'week') ? results.sort((a, b) => b.scoreWeek - a.scoreWeek) : results.sort((a, b) => b.scoreSeason - a.scoreSeason);
    
    //rank
    for (let i = 0; i < results.length; i++) {
      results[i].rank = i + 1;
    }
  
    console.log(`...🥇   league:'${leagueId}' results sorted/rank by:${sortType}`);
    return results;
}

const addPrizesToLeaderboard = (leaderboard, prizes) => {
    const leaderboardWithPrizes = [];
    for(let i = 0; i < leaderboard.length; i++){
      const player = leaderboard[i];
      player.rank = i + 1;
      player.prize = (player.prize != null) ? player.prize : prizes.places.find(p => p.place === player.rank);
      leaderboardWithPrizes.push(player);
    }
    return leaderboardWithPrizes;
}

const getWeeklyTopPaidLeaguesForGameWeek = async (gameweek) => {
    console.log(`Finding weekly Top Paid league Ids for ${gameweek}`)
    const allLeagueIds = await db.readAllDocumentIds('leagues');
    const gameweekStrings = utils.getStringsForCurrentWeek2022(gameweek)
    const weekString = gameweekStrings[1];
    const weekLeagues = allLeagueIds.filter( leagueId => leagueId.includes(weekString) && leagueId.includes('Top-1-Paid'))
    return weekLeagues
}
  
const getWeeklyTopThreePaidLeaguesForGameWeek = async (gameweek) => {
    console.log(`Finding weekly Top Paid league Ids for ${gameweek}`)
    const allLeagueIds = await db.readAllDocumentIds('leagues');
    const gameweekStrings = utils.getStringsForCurrentWeek2022(gameweek)
    const weekString = gameweekStrings[1];
    const weekLeagues = allLeagueIds.filter( leagueId => leagueId.includes(weekString) && leagueId.includes('Top-3-Paid'))
    return weekLeagues
}
  
const getWeeklyTopFivePaidLeaguesForGameWeek = async (gameweek) => {
    console.log(`Finding weekly Top Paid league Ids for ${gameweek}`)
    const allLeagueIds = await db.readAllDocumentIds('leagues');
    const gameweekStrings = utils.getStringsForCurrentWeek2022(gameweek)
    const weekString = gameweekStrings[1];
    const weekLeagues = allLeagueIds.filter( leagueId => leagueId.includes(weekString) && leagueId.includes('Top-5-Paid'))
    return weekLeagues
}
  
const getCustomSeasonTopPaidLeagueIds = async () => {
    const allLeagueIds = await db.readAllDocumentIds('leagues');
    const seasonLeagueIds = allLeagueIds.filter( leagueId => (leagueId.includes('Season') || leagueId.includes('PROMO')) && leagueId.includes('Top-1-Paid'))
    return seasonLeagueIds;
}
  
const getCustomSeasonTopThreePaidLeagueIds = async () => {
    const allLeagueIds = await db.readAllDocumentIds('leagues');
    const seasonLeagueIds = allLeagueIds.filter( leagueId => leagueId.includes('Season') && leagueId.includes('Top-3-Paid'))
    return seasonLeagueIds;
}
  
const getCustomSeasonTopFivePaidLeagueIds = async () => {
    const allLeagueIds = await db.readAllDocumentIds('leagues');
    const seasonLeagueIds = allLeagueIds.filter( leagueId => leagueId.includes('Season') && leagueId.includes('Top-5-Paid'))
    return seasonLeagueIds;
}

const awardPrizesToWeeklyLeagues = async (league, payType, results) => {
    const leagueId = league.id;
    if(!league) {
      console.log("No league object was found");
      return
    }
    let isApePrize;
    if(league.entry.coin == "$APE") {
      isApePrize = true;
    }
    const isCoinPrize = league.prize.coin.isCoinPrize;
    const coin = league.id != 'genesis' ?  '$APE' : 'eth';
    if(isCoinPrize && isApePrize) {
      const pot = Number(results.week.length) * Number(league.entry.fee);
      const potAfterSbsCut = pot * 0.9;
      let numPaidOut = 0;
      if(payType == 'Top-1-Paid') {
        if (results.week.length < 1) {
          const numPlacesExceedsCardsErrorMessage = `...❓ issue: leagueId:${leagueId} numberOfPlacesPaid:1 exceeds cards:${results.week.length}`;
          console.log(numPlacesExceedsCardsErrorMessage);
          results = numPlacesExceedsCardsErrorMessage;
          return results;
        }
        const numPlacesPaid = league.prize.coin.placesPaid;
        for (let i = 0; i < numPlacesPaid.length; i++) {
          results.week[i].paid = parseFloat(potAfterSbsCut.toFixed(5));
          results.week[i].isWinner = true;
          results.week[i].coin = coin;
          numPaidOut = numPaidOut + Number(results.week[i].paid);
        }
      } else if (payType == 'Top-3-Paid' || payType == 'Top-5-Paid') {
        if (results.week.length < 3) {
          const numPlacesExceedsCardsErrorMessage = `...❓ issue: leagueId:${leagueId} numberOfPlacesPaid:3 exceeds cards:${results.week.length}`;
          console.log(numPlacesExceedsCardsErrorMessage);
          results = numPlacesExceedsCardsErrorMessage;
          return results;
        }
        const placesPaid = league.prize.coin.placesPaid;
        for(let i = 0; i < placesPaid.length; i++) {
          // divide potPercentage by 100 because it returns 70 for 70% not 0.70
          results.week[i].paid = parseFloat((potAfterSbsCut * Number(placesPaid[i].potPercentage) / 100).toFixed(5));
          results.week[i].isWinner = true;
          results.week[i].coin = coin;
        }
      } 
    }
    return results;
}

const setSeasonLeagueResultsCollectionForGameWeekWithoutAddingWinnings = async (leagueId, league, gameWeek) => {
    let weekResults = [];
    let seasonResults = [];
    const cardIds = await db.readAllDocumentIds(`leagues/${leagueId}/cards`);
  
    //return an empty result object for an empty league with no cards
    if(cardIds.length < 1) {
        console.log(`...🗑️   leagueId:'${leagueId}' gameWeek:${gameWeek} went empty`);
        return { gameWeek, week: [],season: []};
    }
    if (league.game.minPlayers) {
      if (cardIds.length < league.game.minPlayers) {
        console.log(`...🗑️   leagueId:'${leagueId}' gameWeek:${gameWeek} did not meet the required minimum players so they will not get results`);
        return { gameWeek, week: [], season: [] };
      }
    } else {
      if (cardIds.length < 2) {
        console.log(`...🗑️   leagueId:'${leagueId}' gameWeek:${gameWeek} did not meet the required minimum players so they will not get results`);
        return { gameWeek, week: [], season: [] };
      }
    }
  
    for(let i = 0; i < cardIds.length; i++){
      const cardId = cardIds[i];
      const documentPath = `leagues/${leagueId}/cards/${cardId}/lineups`;
      const card = await db.readDocument('cards', cardId);
      const lineup = await db.readDocument(documentPath, gameWeek); 
      if(!lineup) { 
        console.error(`...💩   ERROR: Missing lineup for:${documentPath}`);
        continue;
      }
      const result = {
        cardId: cardId,
        level: card._level,
        scoreSeason: lineup.scoreSeason,
        scoreWeek: lineup.scoreWeek,
        owner: card._ownerId
      }
      weekResults.push(result);
      seasonResults.push(result);
    }
  
    let rankedResults = {
      gameWeek: gameWeek,
      week: _rankResults(weekResults, 'week', leagueId),
      season: _rankResults(seasonResults, 'season', leagueId)
    }
    console.log(rankedResults)
    await db.createOrUpdateDocument(`leagues/${leagueId}/results`, gameWeek, rankedResults, true);
    console.log(`...✅   leagueId:'${leagueId}'  gameWeek:${gameWeek} successfully recorded`);
    return 0;
}

internals.createTeamStartingArrayForLineup = (lineup) => {
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
  return startingArr;
}

internals.setLineupsForNewWeekInSeasonCustomLeagues = async (gameWeek) => {
    console.log('Start of setLineupsForNewWeekInSeasonCustomLeagues for ' + gameWeek)
    const scores = await db.readDocument('scores', gameWeek);
    if(scores.FantasyPoints[0].GameStatus) {
      console.log('looks like we are already in an active week we are going to recall the function for the next game week')
      const splitArr = gameWeek.split('-');
      const nextWeek = Number(splitArr[2]) + 1;
      gameWeek = `2022-REG-${nextWeek}`
      return await internals.setLineupsForNewWeekInSeasonCustomLeagues(gameWeek);
    }
  
    //grab all leagueIds that are not genesis
    let leagueIds = await db.readAllDocumentIds('leagues');
    leagueIds = leagueIds.filter(x => (x != 'genesis' && x.indexOf('Season') != -1) || x == "PROMO-2022-REG-01"); 
    //iterate through each leagues cards.
    for (let i = 0; i < leagueIds.length; i++) {
      const leagueId = leagueIds[i];
      if(!leagueId) continue;
      const league = await db.readDocument('leagues', leagueId);
      if(league.game.currentPlayers < league.game.minPlayers) {
        console.log(`${leagueId} does not reach the minimum number of players`)
        continue;
      }
      const cardIds = await db.readAllDocumentIds(`leagues/${leagueId}/cards`);
      for(let j = 0; j < cardIds.length; j++){
        const cardId = cardIds[j];
        if(!cardId) continue;
        const card = await db.readDocument('cards', cardId)
        const ownerId = card._ownerId;

        const splitArr = gameWeek.split('-');
        const nextWeek = Number(splitArr[2]) - 1;
        const prevGameweek = `2022-REG-${nextWeek}`
        const usersPreviousLineup = await db.readDocument(`leagues/${leagueId}/cards/${cardId}/lineups`, prevGameweek);
  
        let lineup;
        if(usersPreviousLineup){
          lineup = usersPreviousLineup;
          console.log(`...🔙   league:${leagueId} card:${cardId} gameWeek:${gameWeek} User previous lineup set`);
        } else {
          lineup = utils.getDefaultLineup(currentCard); ;
          console.log(`...🤖   league:${leagueId} card:${cardId} gameWeek:${gameWeek} system default lineup set`);
        }
        lineup.scoreSeason = (usersPreviousLineup) ? usersPreviousLineup.scoreSeason : 0
        lineup.scoreWeek = 0;
        lineup.gameWeek = gameWeek;
        lineup.prevWeekSeasonScore = (usersPreviousLineup) ? usersPreviousLineup.scoreSeason : 0;
        lineup.startingTeamArr = internals.createTeamStartingArrayForLineup(lineup);
        //console.log(lineup)
        await utils.setLineupInLeague(lineup, league, gameWeek, ownerId, false);
      }
    } 
    console.log('End of setLineupsForNewWeekInSeasonCustomLeagues')
}

internals.setDefaultLineupForPartOfGenesis = async (gameWeek, min, max) => {
    console.log(`Start of setDefaultLineupForPartOfGenesis for cards ${min} - ${max}`)
    const scores = await db.readDocument('scores', gameWeek);
    if(scores.FantasyPoints[0].GameStatus) {
      console.log('looks like we are already in an active week we are going to recall the function for the next game week')
      const splitArr = gameWeek.split('-');
      const nextWeek = Number(splitArr[2]) + 1;
      gameWeek = `2022-REG-${nextWeek}`
      return await internals.setDefaultLineupForPartOfGenesis(gameWeek, min, max);
    }
    const leagueId = 'genesis';
  
    for (let i = min; i < max; i++) {
      const cardId = `${i}`;
      if(!cardId) continue;
      // const prevCard = await db.readDocument(`leagues/${leagueId}/cards`, cardId);
      // const currentCard = await db.readDocument('cards', cardId);
      const card = await db.readDocument('cards', cardId);
      // currentCard.joinedAt = prevCard.joinedAt || db._getTimeStamp();
      // await db.createOrUpdateDocument(`leagues/${leagueId}/cards`, cardId, currentCard, true);
      console.log(`...🃏 card:${cardId} for league:${leagueId}`);
            
      const isSetAlready = await db.readDocument(`leagues/${leagueId}/cards/${cardId}/lineups`, gameWeek);
      if(isSetAlready) {
        console.log(`...✅   league:${leagueId} card:${cardId} lineup already set`);
        continue;
      }
      
      const splitArr = gameWeek.split('-');
      const nextWeek = Number(splitArr[2]) - 1;
      const prevGameweek = `2022-REG-${nextWeek}`
      const usersPreviousLineup = await db.readDocument(`leagues/${leagueId}/cards/${cardId}/lineups`, prevGameweek);
      let lineup;
      if(usersPreviousLineup){
        lineup = usersPreviousLineup;
        console.log(`...🔙   league:${leagueId} card:${cardId} gameWeek:${gameWeek} User previous lineup set`);
      } else {
        console.log(card)
        lineup = utils.getDefaultLineup(card);
        console.log(`...🤖   league:${leagueId} card:${cardId} gameWeek:${gameWeek} system default lineup set`);
      }
      lineup.scoreSeason = (usersPreviousLineup) ? usersPreviousLineup.scoreSeason : 0;
      lineup.prevWeekSeasonScore = (usersPreviousLineup) ? usersPreviousLineup.scoreSeason : 0;
      lineup.startingTeamArr = internals.createTeamStartingArrayForLineup(lineup);
      lineup.scoreWeek = 0;
      lineup.gameWeek = gameWeek;
      console.log(lineup)
      const ownerId = card._ownerId;
      const league = await db.readDocument('leagues', leagueId)
      await utils.setLineupInLeague(lineup, league, gameWeek, ownerId, false);
    }
}

// Functions from awardGenesisPrizes script
    
internals.generateSeasonLeaderboardForGameweek = async (gameWeek) => {
    let seasonLeaderboard = await db.getLeaderboardV2(gameWeek, 'season', 'Pro');
    for(let i = 0; i < seasonLeaderboard.length; i++){
      seasonLeaderboard[i].rank = i + 1
      const player = seasonLeaderboard[i];
      const cardId = seasonLeaderboard[i].cardId;
      const boardType = 'seasonAll'
      await db.createOrUpdateDocument(`genesisWinnings/${gameWeek}/${boardType}`, cardId, player, true);
      console.log(`...${boardType}:${i}`)
    }
}
  
internals.generateSeasonHofLeaderboardForGameweek = async (gameWeek) => {
    const seasonHofScores = await db.getLeaderboardV2(gameWeek, 'season', 'Hall of Fame');
    const seasonSpoiledHofScores = await db.getLeaderboardV2(gameWeek, 'season', 'Spoiled Hall of Fame');
    let seasonHofLeaderboard;
    if(seasonHofScores && seasonSpoiledHofScores) {
      seasonHofLeaderboard = [...seasonHofScores, ...seasonSpoiledHofScores].sort((a, b) => b.scoreSeason - a.scoreSeason);
    } else if (seasonHofScores && !seasonSpoiledHofScores) {
      seasonHofLeaderboard = seasonHofScores;
    } else if (!seasonHofScores && seasonSpoiledHofScores) {
      seasonHofLeaderboard = seasonSpoiledHofScores;
    } else {
      console.log(seasonHofScores)
    }
    
    for(let i = 0; i < seasonHofLeaderboard.length; i++){
      seasonHofLeaderboard[i].rank = i + 1;
      const player = seasonHofLeaderboard[i];
      const cardId = seasonHofLeaderboard[i].cardId;
      const boardType = 'seasonHof'
      await db.createOrUpdateDocument(`genesisWinnings/${gameWeek}/${boardType}`, cardId, player);
      console.log(`...${boardType}:${i}`)
    }
}
  
internals.generateSeasonSpoiledLeaderboardForGameweek = async (gameWeek) => {
    const seasonSpoiledHofScores = await db.getLeaderboardV2(gameWeek, 'season', 'Spoiled Hall of Fame');
    const seasonSpoiledProScores = await db.getLeaderboardV2(gameWeek, 'season', 'Spoiled Pro');
    let seasonSpoiledLeaderboard = [...seasonSpoiledHofScores, ...seasonSpoiledProScores].sort((a, b) => b.scoreSeason - a.scoreSeason);
    for(let i = 0; i < seasonSpoiledLeaderboard.length; i++){
      seasonSpoiledLeaderboard[i].rank = i + 1;
      const player = seasonSpoiledLeaderboard[i];
      const cardId = seasonSpoiledLeaderboard[i].cardId;
      const boardType = 'seasonSpoiled'
      await db.createOrUpdateDocument(`genesisWinnings/${gameWeek}/${boardType}`, cardId, player);
      console.log(`...${boardType}:${i}`)
    }
}
  
internals.generateWeeklyTopLeaderboardForGameWeek = async (gameWeek) => {
    const weeklyTopPrizes = await db.readDocument('prizes', 'weekly-top' );
    let weeklyTopLeaderboard = await db.getLeaderboardV2(gameWeek, 'week', 'Pro');
    // for (let i = 0; i < weeklyTopLeaderboard.length; i++){
    //   weeklyTopLeaderboard[i].rank = i + 1;
    // }
    weeklyTopLeaderboard = addPrizesToLeaderboard(weeklyTopLeaderboard, weeklyTopPrizes);
    for(let i = 0; i < weeklyTopLeaderboard.length; i++){
      const player = weeklyTopLeaderboard[i];
      const cardId = weeklyTopLeaderboard[i].cardId;
      const boardType = 'weekAll'
      await db.createOrUpdateDocument(`genesisWinnings/${gameWeek}/${boardType}`, cardId, player);
      console.log(`...${boardType}:${i}`)
    }
}
  
internals.generateWeeklyHofLeaderboardForGameWeek = async (gameWeek) => {
    const weeklyHofPrizes = await db.readDocument('prizes', 'weekly-hof');
    const weeklySpoiledHofScores = await db.getLeaderboardV2(gameWeek, 'week', 'Spoiled Hall of Fame');
    const weeklyHofScores = await db.getLeaderboardV2(gameWeek, 'week', 'Hall of Fame');
    let weeklyHofLeadboard = [...weeklyHofScores, ...weeklySpoiledHofScores].sort((a, b) => b.scoreWeek - a.scoreWeek);
    // for(let i = 0; i < weeklyHofLeadboard.length; i++) weeklyHofLeadboard[i].rank = i + 1;
    weeklyHofLeadboard = addPrizesToLeaderboard(weeklyHofLeadboard, weeklyHofPrizes)
  
    for(let i = 0; i < weeklyHofLeadboard.length; i++){
      const player = weeklyHofLeadboard[i];
      const cardId = weeklyHofLeadboard[i].cardId;
      const boardType = 'weekHof'
      await db.createOrUpdateDocument(`genesisWinnings/${gameWeek}/${boardType}`, cardId, player);
      console.log(`...${boardType}:${i}`)
    }
}

  
internals.generateWeeklySpoiledLeaderboardForGameweek = async (gameWeek) => {
    const weeklySpoiledPrizes = await db.readDocument('prizes', 'weekly-spoiled');
    const weeklySpoiledHofScores = await db.getLeaderboardV2(gameWeek, 'week', 'Spoiled Hall of Fame');
    const weeklySpoiledProScores = await db.getLeaderboardV2(gameWeek, 'week', 'Spoiled Pro');
    let weeklySpoiledLeaderboard = [...weeklySpoiledHofScores, ...weeklySpoiledProScores].sort((a, b) => b.scoreWeek - a.scoreWeek);
    // for(let i = 0; i < weeklySpoiledLeaderboard.length; i++)weeklySpoiledLeaderboard[i].rank = i + 1;
    weeklySpoiledLeaderboard = addPrizesToLeaderboard(weeklySpoiledLeaderboard, weeklySpoiledPrizes);
  
    for(let i = 0; i < weeklySpoiledLeaderboard.length; i++){
      const player = weeklySpoiledLeaderboard[i];
      const cardId = weeklySpoiledLeaderboard[i].cardId;
      const boardType = 'weekSpoiled'
      await db.createOrUpdateDocument(`genesisWinnings/${gameWeek}/${boardType}`, cardId, player);
      console.log(`...${boardType}:${i}`)
    }
}


internals.setWeeklyLeagueResultsCollectionForGameWeek = async (leagueId, league, payType, gameWeek) => {
    let weekResults = [];
    let seasonResults = [];
    const cardIds = await db.readAllDocumentIds(`leagues/${leagueId}/cards`);
  
    //return an empty result object for an empty league with no cards
    if(cardIds.length < 1) {
        console.log(`...🗑️   leagueId:'${leagueId}' gameWeek:${gameWeek} went empty`);
        return { gameWeek, week: [],season: []};
    }
    if (league.game.minPlayers) {
      if (cardIds.length < league.game.minPlayers) {
        console.log(`...🗑️   leagueId:'${leagueId}' gameWeek:${gameWeek} did not meet the required minimum players so they will not get results`);
        return { gameWeek, week: [], season: [] };
      }
    } else {
      if (cardIds.length < 2) {
        console.log(`...🗑️   leagueId:'${leagueId}' gameWeek:${gameWeek} did not meet the required minimum players so they will not get results`);
        return { gameWeek, week: [], season: [] };
      }
    }
  
    for(let i = 0; i < cardIds.length; i++){
      const cardId = cardIds[i];
      const documentPath = `leagues/${leagueId}/cards/${cardId}/lineups`;
      const card = await db.readDocument('cards', cardId);
      const lineup = await db.readDocument(documentPath, gameWeek); 
      if(!lineup) { 
        console.error(`...💩   ERROR: Missing lineup for:${documentPath}`);
        continue;
      }
      const result = {
        cardId: cardId,
        level: card._level,
        scoreSeason: lineup.scoreSeason,
        scoreWeek: lineup.scoreWeek,
        owner: card._ownerId
      }
      weekResults.push(result);
      seasonResults.push(result);
    }
  
    let rankedResults = {
      gameWeek: gameWeek,
      week: _rankResults(weekResults, 'week', leagueId),
      season: _rankResults(seasonResults, 'season', leagueId)
    }
    
    //find leagueWinners
    const rankedResultWithWinnings = await awardPrizesToWeeklyLeagues(league, payType, rankedResults);
  
    if(typeof(rankedResultWithWinnings) == 'string') return rankedResultWithWinnings;
    console.log(rankedResultWithWinnings)
    await db.createOrUpdateDocument(`leagues/${leagueId}/results`, gameWeek, rankedResultWithWinnings, true);
    console.log(`...✅   leagueId:'${leagueId}'  gameWeek:${gameWeek} successfully recorded`);
    return 0;
}



internals.runForWeeklyTopPaidLeagues = async (gameweek) => {
  console.log(`...📝   START:RunForWeeklyTopPaidLeagues for ${gameweek}`);
  const leagueIds = await getWeeklyTopPaidLeaguesForGameWeek(gameweek)
  if(leagueIds.length == 0) {
    console.log("No leagues returned for weekly top paid")
    return;
  }
  let countCoinPrize = 0;
  let countNonCoinPrize = 0;
  let emptyLeagues = 0;
  let goodLeagues = 0;
  let issues = 0;

  for (let i = 0; i < leagueIds.length; i++) {
    const leagueId = leagueIds[i];
    const league = await db.readDocument('leagues', leagueId);
    if(league.game.currentPlayers < league.game.minPlayers) {
      emptyLeagues++;
      console.log(`...league:${leagueId} did not reach minimum number of players so there is no need to generate results`);
      continue;
    }
    const result = await internals.setWeeklyLeagueResultsCollectionForGameWeek(leagueId, league, 'Top-1-Paid', gameweek);
    if(typeof(result) != 'string'){
      (result != 0) ? emptyLeagues++ : goodLeagues++;
    } else {
      issues++;
    }
    countCoinPrize = league.prize.coin.isCoinPrize ? countCoinPrize++ : countNonCoinPrize++;
    console.log(`...league:${i} of ${leagueIds.length} set`);
  }
  console.log('===================================');
  console.log(`...✅   goodLeagues:${goodLeagues}`);
  console.log(`...🗑️   emptyLeagues:${emptyLeagues}`);
  console.log(`...❓   issues:${issues}`);
  console.log(`...🪙   countCoinPrize:${countCoinPrize}`);
  console.log(`...🧸   countNonCoinPrize:${countNonCoinPrize}`);
  console.log('===================================');

  console.log(`...📝   END:RunForWeeklyTopPaidLeagues for ${sbs.getNFLWeekV2()}`);
}

internals.runForWeeklyTopThreePaidLeagues = async (gameweek) => {
    console.log(`...📝   START:runForWeeklyTopThreePaidLeagues for ${gameweek}`);
    const leagueIds = await getWeeklyTopThreePaidLeaguesForGameWeek(gameweek)
    if(leagueIds.length == 0) {
      console.log("No leagues returned for weekly top paid")
      return;
    }
    let countCoinPrize = 0;
    let countNonCoinPrize = 0;
    let emptyLeagues = 0;
    let goodLeagues = 0;
    let issues = 0;
  
    for (let i = 0; i < leagueIds.length; i++) {
      const leagueId = leagueIds[i];
      const league = await db.readDocument('leagues', leagueId);
      if(league.game.currentPlayers < league.game.minPlayers) {
        emptyLeagues++;
        console.log(`...league:${leagueId} did not reach minimum number of players so there is no need to generate results`);
        continue;
      }
      const result = await internals.setWeeklyLeagueResultsCollectionForGameWeek(leagueId, league, 'Top-3-Paid', gameweek);
      if(typeof(result) != 'string'){
        (result != 0) ? emptyLeagues++ : goodLeagues++;
      } else {
        issues++;
      }
      countCoinPrize = league.prize.coin.isCoinPrize ? countCoinPrize++ : countNonCoinPrize++;
      console.log(`...league:${i} of ${leagueIds.length} set`);
    }
    console.log('===================================');
    console.log(`...✅   goodLeagues:${goodLeagues}`);
    console.log(`...🗑️   emptyLeagues:${emptyLeagues}`);
    console.log(`...❓   issues:${issues}`);
    console.log(`...🪙   countCoinPrize:${countCoinPrize}`);
    console.log(`...🧸   countNonCoinPrize:${countNonCoinPrize}`);
    console.log('===================================');
  
    console.log(`...📝   END:RunForWeeklyTopThreePaidLeagues for ${sbs.getNFLWeekV2()}`);
}

internals.runForWeeklyTopFivePaidLeagues = async (gameweek) => {
    console.log(`...📝   START:runForWeeklyTopFivePaidLeagues for ${gameweek}`);
    const leagueIds = await getWeeklyTopFivePaidLeaguesForGameWeek(gameweek)
    if(leagueIds.length == 0) {
      console.log("No leagues returned for weekly top paid")
      return;
    }
    let countCoinPrize = 0;
    let countNonCoinPrize = 0;
    let emptyLeagues = 0;
    let goodLeagues = 0;
    let issues = 0;
  
    for (let i = 0; i < leagueIds.length; i++) {
      const leagueId = leagueIds[i];
      const league = await db.readDocument('leagues', leagueId);
      if(league.game.currentPlayers < league.game.minPlayers) {
        emptyLeagues++;
        console.log(`...league:${leagueId} did not reach minimum number of players so there is no need to generate results`);
        continue;
      }
      const result = await internals.setWeeklyLeagueResultsCollectionForGameWeek(leagueId, league, 'Top-5-Paid', gameweek);
      if(typeof(result) != 'string'){
        (result != 0) ? emptyLeagues++ : goodLeagues++;
      } else {
        issues++;
      }
      countCoinPrize = league.prize.coin.isCoinPrize ? countCoinPrize++ : countNonCoinPrize++;
      console.log(`...league:${i} of ${leagueIds.length} set`);
    }
    console.log('===================================');
    console.log(`...✅   goodLeagues:${goodLeagues}`);
    console.log(`...🗑️   emptyLeagues:${emptyLeagues}`);
    console.log(`...❓   issues:${issues}`);
    console.log(`...🪙   countCoinPrize:${countCoinPrize}`);
    console.log(`...🧸   countNonCoinPrize:${countNonCoinPrize}`);
    console.log('===================================');
  
    console.log(`...📝   END:RunForWeeklyTopFivePaidLeagues for ${sbs.getNFLWeekV2()}`);
}

internals.runForCustomSeasonLeaguesDuringSeason = async (gameweek) => {
    console.log(`...📝   START:run for custom season leagues for ${gameweek}`);
    let leagueIds = await db.readAllDocumentIds('leagues');
    leagueIds = leagueIds.filter(x => x.indexOf('Season') != -1 || x.indexOf('PROMO') != -1);
    if(leagueIds.length == 0) {
      console.log("No leagues returned for weekly top paid")
      return;
    }
    let countCoinPrize = 0;
    let countNonCoinPrize = 0;
    let emptyLeagues = 0;
    let goodLeagues = 0;
    let issues = 0;
  
    for (let i = 0; i < leagueIds.length; i++) {
      const leagueId = leagueIds[i];
      const league = await db.readDocument('leagues', leagueId);
      if(league.game.currentPlayers < league.game.minPlayers) {
        emptyLeagues++;
        console.log(`...league:${leagueId} did not reach minimum number of players so there is no need to generate results`);
        continue;
      }
      const result = await setSeasonLeagueResultsCollectionForGameWeekWithoutAddingWinnings(leagueId, league, gameweek);
      if(typeof(result) != 'string'){
        (result != 0) ? emptyLeagues++ : goodLeagues++;
      } else {
        issues++;
      }
      countCoinPrize = league.prize.coin.isCoinPrize ? countCoinPrize++ : countNonCoinPrize++;
      console.log(`...league:${i} of ${leagueIds.length} set`);
    }
    console.log('===================================');
    console.log(`...✅   goodLeagues:${goodLeagues}`);
    console.log(`...🗑️   emptyLeagues:${emptyLeagues}`);
    console.log(`...❓   issues:${issues}`);
    console.log(`...🪙   countCoinPrize:${countCoinPrize}`);
    console.log(`...🧸   countNonCoinPrize:${countNonCoinPrize}`);
    console.log('===================================');
  
    console.log(`...📝   END:RunForWeeklyTopFivePaidLeagues for ${sbs.getNFLWeekV2()}`);
}

// Validate Genesis league scores and genesisLeaderboard functions below

internals.validateGenesisLeagueWeekAndSeasonScoreInParts = async (gameweek, min, max ) => {
    const scores = await db.readDocument('scores', gameweek);
    const leagueId = 'genesis';
    if(!scores.FantasyPoints[0].GameStatus) {
      const splitArr = gameWeek.split('-');
      const nextWeek = Number(splitArr[2]) - 1;
      const prevGameweek = `2022-REG-${nextWeek}`
      console.log(`looks like we are in a new week (${gameweek}) with no games started so we are recalling the function for the previous week... ${prevGameweek}`);
      return await internals.validateGenesisLeagueWeekAndSeasonScoreInParts(prevGameweek, min, max);
    }
    for(let i = min; i < max; i++) {
      const cardId = `${i}`;
        let madeCorrection = false;
        const lineup = await db.readDocument(`leagues/genesis/cards/${cardId}/lineups`, gameweek);
        if(!lineup) {
            console.log(`No lineup found at leagues/genesis/cards/${cardId}/lineups/${gameweek}`)
        }
        //console.log(scores);
        console.log(`card #${cardId}`)
        console.log('lineup card id: ' + lineup._cardId);
        //await utils.sleep(400000)
        const QBPoints = utils.getPointsFromScore(scores, lineup.starting.QB[0], 'QB');
        const RB0Points = utils.getPointsFromScore(scores, lineup.starting.RB[0], 'RB');
        const RB1Points = utils.getPointsFromScore(scores, lineup.starting.RB[1], 'RB');
        const WR0Points = utils.getPointsFromScore(scores, lineup.starting.WR[0], 'WR');
        const WR1Points = utils.getPointsFromScore(scores, lineup.starting.WR[1], 'WR');
        const WR2Points = utils.getPointsFromScore(scores, lineup.starting.WR[2], 'WR');
        const TEPoints = utils.getPointsFromScore(scores, lineup.starting.TE[0], 'TE');
        const DSTPoints = utils.getPointsFromScore(scores, lineup.starting.DST[0], 'DST');

        const totalPoints = parseFloat((QBPoints + RB0Points + RB1Points + WR0Points + WR1Points + WR2Points + TEPoints + DSTPoints).toFixed(2));
        if(totalPoints != lineup.scoreWeek) {
            lineup.scoreWeek = totalPoints;
            console.log(`lineup.WeekScore: ${lineup.scoreSeason}, calculatedWeekScore: ${totalPoints}`)
            madeCorrection = true;
        }
        if( parseFloat((Number(lineup.prevWeekSeasonScore) + totalPoints).toFixed(2)) != parseFloat(lineup.scoreSeason.toFixed(2))) {
            lineup.scoreSeason = parseFloat((Number(lineup.prevWeekSeasonScore) + totalPoints).toFixed(2));
            console.log(`lineup.SeasonScore: ${lineup.scoreSeason}, calculatedSeasonScore: ${parseFloat((Number(lineup.prevWeekSeasonScore) + totalPoints).toFixed(2))}`)
            madeCorrection = true;
        }
        if(madeCorrection) {
          if(cardId != lineup._cardId) {
            console.log(`... ERROR WE ARE TRYING TO SET A LINEUP WITH A WRONG CARD ID IN CARD #${cardId}`);
            continue;
          }
          console.log(`Needed to update lineup object for card ${cardId} in ${gameweek}`)
          await db.createOrUpdateDocument(`leagues/genesis/cards/${cardId}/lineups`, gameweek, lineup, false)
        }
    }
}

internals.validateGenesisLeagueScorePropagationInParts = async (gameweek, min, max) => {
    console.log(`Starting validateGenesisLeagueScorePropagationInParts for ${min} to ${max}`)
    const scores = await db.readDocument('scores', gameweek);
    if(!scores.FantasyPoints[0].GameStatus) {
      console.log(`looks like we are in a new week (${gameweek}) with no games started so we are recalling the function for the previous week... ${sbs.getPreviousNFLWeek(gameweek)}`);
      gameweek = sbs.getPreviousNFLWeek(gameweek)
      return await internals.validateGenesisLeagueScorePropagationInParts(gameweek, min, max);
    }
    for(let i = min; i < max; i++) {
        const cardId = `${i}`;
        console.log(cardId)
        let madeCorrection = false;
        const leaderboardPath = `genesisLeaderboard/${gameweek}/cards`;
        const lineupPath = `leagues/genesis/cards/${cardId}/lineups`;
        const leaderboardObject = await db.readDocument(leaderboardPath, cardId);
        const lineup = await db.readDocument(lineupPath, gameweek);

        if (lineup.scoreSeason != leaderboardObject.scoreSeason || lineup.scoreWeek != leaderboardObject.scoreWeek) {
            console.log(`lineup seasonScore: ${lineup.scoreSeason}, leaderboard seasonScore: ${leaderboardObject.scoreSeason} || lineup scoreWeek: ${lineup.scoreWeek}, leaderboard scoreWeek: ${leaderboardObject.scoreWeek}`)
            leaderboardObject.scoreWeek = lineup.scoreWeek;
            leaderboardObject.scoreSeason = lineup.scoreSeason;
            leaderboardObject.lineup = lineup;
            madeCorrection = true;
        }
        if(madeCorrection) {
            console.log(`Needed to update leaderboard object for card ${cardId}`)
            await db.createOrUpdateDocument(leaderboardPath, cardId, leaderboardObject, false)
        }
    }
    console.log(`END validateGenesisLeagueScorePropagationInParts for ${min} to ${max}`)
}

internals.verifyLineupScoresInCustomLeagues = async (gameweek, leagueIds, minIndex="nothing", maxIndex="nothing") => {
    const scores = await db.readDocument('scores', gameweek)
    if(!scores.FantasyPoints[0].GameStatus) {
      console.log(`looks like we are in a new week (${gameweek}) with no games started so we are recalling the function for the previous week... ${sbs.getPreviousNFLWeek(gameweek)}`);
      gameweek = sbs.getPreviousNFLWeek(gameweek)
      return await internals.validateGenesisLeagueScorePropagationInParts(gameweek, leagueIds, minIndex, maxIndex);
    }
    if(leagueIds.length == 0) {
        console.log("Please enter a non empty leagueId array");
        return 0;
    }
    let max;
    let min;
    if(minIndex == "nothing") {
        max = leagueIds.length;
        min = 0;
    } else {
        max = maxIndex;
        min = minIndex;
    }
    for(let i = min; i < max; i++) {
        const league = await db.readDocument('leagues', leagueIds[i]);
        console.log(`validating ${leagueIds[i]}`)
        const cardIds = await db.readAllDocumentIds(`leagues/${leagueIds[i]}/cards`);
        if(cardIds.length < league.game.minPlayers) {
            console.log(`${leagueIds[i]} does not reach the minimum number of players and thus does not matter anymore and was already refunded`)
            continue;
        }
        for(let j = 0; j < cardIds.length; j++) {
          const cardId = cardIds[j];
            const leaguePath = `leagues/${leagueIds[i]}/cards/${cardIds[j]}/lineups`;
            const lineup = await db.readDocument(leaguePath, gameweek);
            if(!lineup) {
                continue;
            }

            const QBPoints = utils.getPointsFromScore(scores, lineup.starting.QB[0], 'QB');
            const RB0Points = utils.getPointsFromScore(scores, lineup.starting.RB[0], 'RB');
            const RB1Points = utils.getPointsFromScore(scores, lineup.starting.RB[1], 'RB');
            const WR0Points = utils.getPointsFromScore(scores, lineup.starting.WR[0], 'WR');
            const WR1Points = utils.getPointsFromScore(scores, lineup.starting.WR[1], 'WR');
            const WR2Points = utils.getPointsFromScore(scores, lineup.starting.WR[2], 'WR');
            const TEPoints = utils.getPointsFromScore(scores, lineup.starting.TE[0], 'TE');
            const DSTPoints = utils.getPointsFromScore(scores, lineup.starting.DST[0], 'DST');

            let madeCorrection = false;
            const totalPoints = parseFloat((QBPoints + RB0Points + RB1Points + WR0Points + WR1Points + WR2Points + TEPoints + DSTPoints).toFixed(2));
            if(totalPoints != lineup.scoreWeek) {
                lineup.scoreWeek = totalPoints;
                console.log(`lineup.WeekScore: ${lineup.scoreWeek}, calculatedWeekScore: ${totalPoints}`)
                madeCorrection = true;
            }

            const prevLineup = await db.readDocument(leaguePath, sbs.getPreviousNFLWeek(gameweek))
            if(prevLineup) {
                if((Number(prevLineup.scoreSeason) + totalPoints).toFixed(2) != lineup.scoreSeason.toFixed(2)) {
                    console.log(`lineup.scoreSeason: ${lineup.scoreSeason}, calculatedSeasonScore: ${parseFloat((Number(prevLineup.scoreSeason) + totalPoints).toFixed(2))}`)
                    lineup.scoreSeason = parseFloat((Number(prevLineup.scoreSeason) + totalPoints).toFixed(2));
                    madeCorrection = true;
                }
            } else {
                if(leagueIds[i].indexOf('Weekly') != -1 && lineup.scoreSeason != totalPoints) {
                    console.log(`lineup.scoreSeason: ${lineup.scoreSeason}, calculatedSeasonScore: ${totalPoints}`)
                    lineup.scoreSeason = totalPoints;
                    madeCorrection = true;
                }
            }
            
            if(madeCorrection) {
              if(cardId != lineup._cardId) {
                console.log(`... ERROR WE ARE TRYING TO SET A LINEUP WITH A WRONG CARD ID IN CARD #${cardId}`);
                continue;
              }
              console.log(`Needed to update lineup object for card ${i} in ${leagueIds[i]} for ${gameweek}}`)
              await db.createOrUpdateDocument(`leagues/genesis/cards/${i}/lineups`, gameweek, lineup, false)
            }
        }
    }
}

internals.verifyLineupsForWeeklyCustomLeagues = async (gameWeek) => {
    console.log(`Started running verifyLineupsForWeeklyCustomLeagues for ${gameWeek}`)
    const Ids = await db.readAllDocumentIds('leagues');
    const currentWeekStrings = utils.getStringsForCurrentWeek2022(gameWeek);
    const weekLeagueIds = Ids.filter(id => id.indexOf(currentWeekStrings[1]) != -1);
    await internals.verifyLineupScoresInCustomLeagues(gameWeek, weekLeagueIds)
    console.log(`Finished running verifyLineupsForWeeklyCustomLeagues for ${gameWeek}`)
}


internals.verifyLineupScoresForFirstHalfOfSeasonLeagues = async (gameWeek) => {
    console.log(`Started running verifyLineupScoresForFirstHalfOfSeasonLeagues for ${gameWeek}`)
    const Ids = await db.readAllDocumentIds('leagues');
    const seasonLeagueIds = Ids.filter(id => id.indexOf('Season') != -1 || id.indexOf('PROMO') != -1);
    const maxIndex = Math.floor((seasonLeagueIds.length) / 2);
    await internals.verifyLineupScoresInCustomLeagues(gameWeek, seasonLeagueIds, 0, maxIndex)
    console.log(`Finished running verifyLineupScoresForFirstHalfOfSeasonLeagues for ${gameWeek}`)
}


internals.verifyLineupScoresForSecondHalfOfSeasonLeagues = async (gameWeek) => {
    console.log(`Started running verifyLineupScoresForSecondHalfOfSeasonLeagues for ${gameWeek}`)
    const Ids = await db.readAllDocumentIds('leagues');
    const seasonLeagueIds = Ids.filter(id => id.indexOf('Season') != -1 || id.indexOf('PROMO') != -1);
    const minIndex = Math.floor((seasonLeagueIds.length) / 2);
    await internals.verifyLineupScoresInCustomLeagues(gameWeek, seasonLeagueIds, minIndex, seasonLeagueIds.length)
    console.log(`Finished running verifyLineupScoresForSecondHalfOfSeasonLeagues for ${gameWeek}`)
}


// internals.verifyScorePropagationToResultsInCustomLeaguesSeasonResults = async (gameweek) => {
//     let leagueIds = await db.readAllDocumentIds('leagues');
//     leagueIds = leagueIds.filter(id => id != 'genesis');
//     for(let i = 0; i < leagueIds.length; i++) {
//         let leagueCorrection = false;
//         const league = await db.readDocument('leagues', leagueIds[i]);
//         const cardIds = await db.readAllDocumentIds(`leagues/${leagueIds[i]}/cards`);
//         const results = await db.readDocument(`leagues/${leagueIds[i]}/results`, gameweek);
//         if(!results) {
//             console.log(`no results were found in ${leagueIds[i]}`);
//             continue;
//         }
//         if(cardIds.length < league.game.minPlayers) {
//             console.log(`${leagueIds[i]} does not reach the minimum number of players and thus does not matter anymore and was already refunded`)
//             continue;
//         }

//         const seasonResults = results.season;
//         const weekResults = results.week;
//         for(let j = 0; j < seasonResults.length; j++) {
//             let madeCorrection = false;
//             const leaguePath = `leagues/${leagueIds[i]}/cards/${seasonResults[j].cardId}/lineups`;
//             const lineup = await db.readDocument(leaguePath, gameweek);
//             if(!lineup) {
//                 continue;
//             }
//             const cardSeasonResult = seasonResults[j];
//             if(lineup.scoreWeek != cardSeasonResult.scoreWeek || lineup.scoreSeason != cardSeasonResult.scoreSeason) {
//                 results.season[j].scoreWeek = lineup.scoreWeek;
//                 results.season[j].scoreSeason = lineup.scoreSeason;
//                 madeCorrection = true;
//             }
//         }
//     }
// }


module.exports = internals;