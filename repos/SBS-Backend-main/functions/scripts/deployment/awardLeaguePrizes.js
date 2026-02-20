//✍️ STEP: 1  FILL OUT THE SCRIPT TEMPLATE BELOW

/* DESCRIPTION START:
========================

    📝 General Description:

    At the end of each game week, prizes shoudl be awarded to the cards that win.  This process should invlove publishing the standing of every league and awarding the prizes. 

    👣 Deployment Steps: node awardLeaguePrizes.js

    🔗 TaskLink: Trello Link Here

    📅 Date Run in sbs-fantasy-dev:

    📅 Date Run in sbs-fantasy-prod:

========================
DESCRIPTION END */

//🗃️ STEP 2: Add needed Dependencies

const SCRIPT_NAME = 'Award League Prizes'; //required

//PACKAGES

//SERVICES
const db = require('../../services/db');
const sbs = require('../../services/sbs');


//🚀 STEP 3: Write the script.  Include tests for validation where possible

//CONSTANTS
const gameWeek = '2022-REG-03';


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

const addWeeklyLeaugeWinnings = async (league, results) => {

  const leagueId = league.id;
  const coin = league.id != 'genesis' ?  '$APE' : 'eth';
  const isCoinPrize = league.prize.coin.isCoinPrize;
  if(isCoinPrize){
    const pot = league.prize.coin.pot;
    const numPlacesPaid = league.prize.coin.placesPaid;
    for(let i = 0; i < numPlacesPaid.length; i++){
      if(results.week.length < numPlacesPaid.length){
        const numPlacesExceedsCardsErrorMessage = `...❓ issue: leagueId:${leagueId} numberOfPlacesPaid:${numPlacesPaid.length} exceeds cards:${results.week.length}`;
        console.log(numPlacesExceedsCardsErrorMessage);
        results = numPlacesExceedsCardsErrorMessage;
        return results;
      }
      const placeObject = numPlacesPaid[i];
      const potPercentage = placeObject.potPercentage / 100;
      results.week[i].paid = pot * potPercentage;
      results.week[i].isWinner = true;
      results.week[i].coin = coin;
    }
  }

  return results;
}


//getLeagueResult
const setLeagueResult = async (leagueId, league) => {
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
  const rankedResultWithWinnings = await addWeeklyLeaugeWinnings(league, rankedResults);

  if(typeof(rankedResultWithWinnings) == 'string') return rankedResultWithWinnings;

  await db.createOrUpdateDocument(`leagues/${leagueId}/results`, gameWeek, rankedResultWithWinnings, true);
  console.log(`...✅   leagueId:'${leagueId}'  gameWeek:${gameWeek} successfully recorded`);
  return 0;
}


(async () => {
    console.log(`...📝   START:${SCRIPT_NAME}`);

    let leagueIds = await db.readAllDocumentIds('leagues');
    leagueIds = leagueIds.filter(league => league != 'genesis'); 
    //leagueIds = leagueIds.filter(league => league.includes('Sep 08') || league.includes(gameWeek))
    
    let countCoinPrize = 0;
    let countNonCoinPrize = 0;
    let emptyLeagues = 0;
    let goodLeagues = 0;
    let issues = 0;
    for(let i = 0; i < leagueIds.length; i++){
      const leagueId = leagueIds[i];
      const league = await db.readDocument('leagues', leagueId);
      const result = await setLeagueResult(leagueId, league);
      if(typeof(result) != 'string'){
        emptyLeagues = (result != 0) ? emptyLeagues++ : goodLeagues++;
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

    console.log(`...📝   END:${SCRIPT_NAME}`);
    process.exit(0);
})();
