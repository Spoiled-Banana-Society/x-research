const db = require('../../services/db');
const utils = require('../../services/utils');
const sbs = require('../../services/sbs');
const scoreTriggers = require('../../services/score-triggers');
const weekTransition = require('../../services/weekTransition');
const { v4: uuidv4 } = require('uuid');
const { FieldValue } = require('firebase-admin/firestore');


const validateGenesisLeagueWeekAndSeasonScoreInParts = async (gameweek, min, max) => {
  console.log(`Validating week and season score for cards ${min} to ${max}`)
    const scores = await db.readDocument('scores', gameweek);
    const leagueId = 'genesis';
    for(let i = min; i < max; i++) {
        const cardId = `${i}`;
        console.log(cardId)
        let madeCorrection = false;
        const lineup = await db.readDocument(`leagues/genesis/cards/${cardId}/lineups`, gameweek);
        if(!lineup) {
            console.log(`No lineup found at leagues/genesis/cards/${i}/lineups/${gameweek}`)
        }
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

        const splitArr = gameweek.split('-');
        const nextWeek = Number(splitArr[2]) - 1;
        const prevGameweek = `2022-REG-${nextWeek}`
        const prevLineup = await db.readDocument(`leagues/${leagueId}/cards/${cardId}/lineups`, prevGameweek);
        if( parseFloat((Number(prevLineup.scoreSeason) + totalPoints).toFixed(2)) != parseFloat(lineup.scoreSeason.toFixed(2))) {
            console.log(`PrevLineupSeasonScore: ${prevLineup.scoreSeason}, CurrentLineupPrevWeek: ${lineup.prevWeekSeasonScore}`)
            lineup.scoreSeason = parseFloat((Number(prevLineup.scoreSeason) + totalPoints).toFixed(2));
            console.log(`lineup.SeasonScore: ${lineup.scoreSeason}, calculatedSeasonScore: ${parseFloat((Number(prevLineup.scoreSeason) + totalPoints).toFixed(2))}`)
            madeCorrection = true;
        }
        if(madeCorrection) {
          if(cardId != lineup._cardId) {
            console.log('TRIED TO SAVE A LINEUP WITH THE WRONG CARD NUMBER')
            await utils.sleep(40000);
            throw('Tried to set a card with the wrong card id within the lineup')
          } else {
            console.log(`Needed to update lineup object for card ${cardId} in ${gameweek}`)
            await db.createOrUpdateDocument(`leagues/genesis/cards/${cardId}/lineups`, gameweek, lineup, false)
          }
        }
    }
}

const validateGenesisLeagueScorePropagationInParts = async (gameweek, min, max) => {
    console.log(`Starting validateGenesisLeagueScorePropagationInParts for ${min} to ${max}`)
    const scores = await db.readDocument('scores', gameweek);
    for(let i = min; i < max; i++) {
      const cardId = `${i}`;
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
          if(cardId != lineup._cardId) {
            console.log('TRIED TO SAVE A LINEUP WITH THE WRONG CARD NUMBER')
            await utils.sleep(40000);
            throw('Tried to set a card with the wrong card id within the lineup')
          } else {
            console.log(`Needed to update leaderboard object for card ${i}`)
            await db.createOrUpdateDocument(leaderboardPath, `${i}`, leaderboardObject, false)
          }
        }
    }
    console.log(`END validateGenesisLeagueScorePropagationInParts for ${min} to ${max}`)
}

const payoutWeeklyGenesis = async () => {
    const gameWeek = '2022-REG-17';
    const weekAllPrizeWinners = await db.getGenesisPrizeWinners(gameWeek, 'weekAll');
    const weekHofPrizeWinners = await db.getGenesisPrizeWinners(gameWeek, 'weekHof')
    const weekSpoiledPrizeWinners = await db.getGenesisPrizeWinners(gameWeek, 'weekSpoiled');
    const allGenesisPrizeWinners = [...weekAllPrizeWinners, ...weekHofPrizeWinners, ...weekSpoiledPrizeWinners]; 
    console.log(allGenesisPrizeWinners.length)
    for(let i = 0; i < allGenesisPrizeWinners.length; i++){
        const winner = allGenesisPrizeWinners[i];
        const cardId = winner.cardId;
        const prizeAmount = winner.prize.prize;
        const txId = uuidv4();
        const transactionObject = {
            winner,
            txId: txId,
            leagueId: 'genesis',
            gameWeek: gameWeek,
            createdAt: db._getTimeStamp()
        }
        await db.createOrUpdateDocument('transactions', txId, transactionObject, true);//change the id to be something that can't be accidently run twice
        await db.createOrUpdateDocument(`cards/${cardId}/transactions`, txId, transactionObject, true);
        await db.createOrUpdateDocument('cards', cardId, {prizes:{ eth: FieldValue.increment(prizeAmount) } }, true);
        console.log(`...💰   gameWeek:${gameWeek} leagueId:genesis cardId:${cardId} wins eth:${prizeAmount}`);
    }
}

const setLineupsInCustomSeasons = async (gameWeek) => {
    let leagueIds = await db.readAllDocumentIds('leagues');
    const res = [];
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
        const prevWeek = Number(splitArr[2]) - 1;
        const prevGameweek = `2022-REG-${prevWeek}`;
        console.log(`Prev week: ${prevGameweek}`)
        const usersPreviousLineup = await db.readDocument(`leagues/${leagueId}/cards/${cardId}/lineups`, prevGameweek);
  
        let lineup;
        if(usersPreviousLineup){
          lineup = usersPreviousLineup;
          console.log(`...🔙   league:${leagueId} card:${cardId} gameWeek:${gameWeek} User previous lineup set`);
        } else {
          lineup = utils.getDefaultLineup(card); ;
          console.log(`...🤖   league:${leagueId} card:${cardId} gameWeek:${gameWeek} system default lineup set`);
        }
        lineup.scoreSeason = (usersPreviousLineup) ? usersPreviousLineup.scoreSeason : 0
        lineup.scoreWeek = 0;
        lineup.gameWeek = gameWeek;
        lineup.prevWeekSeasonScore = (usersPreviousLineup) ? usersPreviousLineup.scoreSeason : 0;
        lineup.startingTeamArr = weekTransition.createTeamStartingArrayForLineup(lineup);
        //console.log(lineup)
        if(lineup._cardId != cardId) {
            console.log('Found one with a lineup not matching cardId');
            res.push(cardId);
        } else {
          await utils.setLineupInLeague(lineup, league, gameWeek, ownerId, false);
        }
      }
    } 
    console.log(res)
    console.log('End of setLineupsForNewWeekInSeasonCustomLeagues')
}

const setLineupsForGenesis = async (min, max) => {
    const gameWeek = '2022-REG-17';
    const prevGameweek = '2022-REG-16';
    const leagueId = 'genesis';
    const res = [];
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
        //await db.deleteDocument(`leagues/${leagueId}/cards/${cardId}/lineups`, gameWeek)
        console.log(`...✅   league:${leagueId} card:${cardId} lineup already set`);
        continue;
      }
      
    
      const usersPreviousLineup = await db.readDocument(`leagues/${leagueId}/cards/${cardId}/lineups`, prevGameweek);
      let lineup;
      if(usersPreviousLineup){
        lineup = usersPreviousLineup;
        console.log(`...🔙   league:${leagueId} card:${cardId} gameWeek:${gameWeek} User previous lineup set`);
      } else {
        lineup = utils.getDefaultLineup(card);
        console.log(`...🤖   league:${leagueId} card:${cardId} gameWeek:${gameWeek} system default lineup set`);
      }
      lineup.scoreSeason = (usersPreviousLineup) ? usersPreviousLineup.scoreSeason : 0;
      lineup.prevWeekSeasonScore = (usersPreviousLineup) ? usersPreviousLineup.scoreSeason : 0;
      lineup.startingTeamArr = weekTransition.createTeamStartingArrayForLineup(lineup);
      lineup.scoreWeek = 0;
      lineup.gameWeek = gameWeek;
      const ownerId = card._ownerId;
      const league = await db.readDocument('leagues', leagueId)
      if(lineup._cardId != cardId) {
          console.log('Found one with a lineup not matching cardId');
          res.push(cardId);
      } else {
        await utils.setLineupInLeague(lineup, league, gameWeek, ownerId, false);
      }
    }
    console.log(res)
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

const runForTopPaidWeekly = async (gameweek) => {
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
    const result = await weekTransition.setWeeklyLeagueResultsCollectionForGameWeek(leagueId, league, 'Top-1-Paid', gameweek);
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

  console.log(`...📝   END:RunForWeeklyTopPaidLeagues for ${gameweek}`);
}

const runForTop3PaidWeekly = async (gameweek) => {
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
      const result = await weekTransition.setWeeklyLeagueResultsCollectionForGameWeek(leagueId, league, 'Top-3-Paid', gameweek);
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
  
    console.log(`...📝   END:RunForWeeklyTopThreePaidLeagues for ${gameweek}`);
}

const runForTop5PaidLeagues = async (gameweek) => {
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
      const result = await weekTransition.setWeeklyLeagueResultsCollectionForGameWeek(leagueId, league, 'Top-5-Paid', gameweek);
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
  
    console.log(`...📝   END:RunForWeeklyTopFivePaidLeagues for ${gameweek}`);
}

const payoutResults = async (gameWeek, leagueId, results) => {

  const weeklyWinners = results.week;
  for(let i = 0; i < weeklyWinners.length; i++){
    const winner = weeklyWinners[i];
    const cardId = winner.cardId;
    const prizeAmount = winner.paid;
    if(prizeAmount){
      const txId = uuidv4();
      const transactionObject = {
        winner,
        txId: txId,
        leagueId: leagueId,
        gameWeek: gameWeek,
        createdAt: db._getTimeStamp()
      }
      await db.createOrUpdateDocument('transactions', txId, transactionObject, true);
      await db.createOrUpdateDocument(`cards/${cardId}/transactions`, txId, transactionObject, true);
      await db.createOrUpdateDocument('cards', cardId, { prizes:{ ape: FieldValue.increment(prizeAmount) } }, true);
      console.log(`...💰   gameWeek:${gameWeek} leagueId:${leagueId} cardId:${cardId} apePrize:${prizeAmount}`);
    }
  }
} 

const payoutWeeklyCustom = async () => {
  const gameWeek = '2022-REG-17';
  console.log(`...🐒   START gameWeek:${gameWeek} leagues payout`);
  let leagueIds = await db.readAllDocumentIds('leagues');
  const weekString = (utils.getStringsForCurrentWeek2022(gameWeek))[1];
  leagueIds = leagueIds.filter(leagueId => leagueId.includes(weekString))

  for(let i = 0; i < leagueIds.length; i++){
    const leagueId = leagueIds[i];
    const league = await db.readDocument(`leagues`, leagueId);  
    const isWeeklyPayout = utils.isWeeklyPayout(league);
    if(!isWeeklyPayout) continue;
    const results = await db.readDocument(`leagues/${leagueId}/results`, gameWeek);
    if(!results){
      console.log(`...⏩   gameWeek:${gameWeek} league:${leagueId} no results`);
      continue;
    }

    await payoutResults(gameWeek, leagueId, results);
    console.log(`Paid out results for ${leagueId} in ${gameWeek}`)
  }
  console.log(`...🐒   END gameWeek:${gameWeek} leagues payout`);
}

const validateCustomLeagues = async (gameweek) => {
  let results = [];
  const weekStrings = utils.getStringsForCurrentWeek2022(gameweek)
  console.log(weekStrings[1])
  let leagueIds = await db.readAllDocumentIds('leagues');
  leagueIds = leagueIds.filter(x => x.indexOf('Season') != -1 || x.indexOf('PROMO') != -1 || x.indexOf(weekStrings[1]) != -1);
  //await weekTransition.verifyLineupScoresInCustomLeagues(gameweek, leagueIds)
  const scores = await db.readDocument('scores', gameweek)
  for(let i = 0; i < leagueIds.length; i++) {
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

      if(cardId != lineup._cardId) {
        results.push({ cardId: cardId, leagueId: leagueIds[i] })
      }

      // const QBPoints = utils.getPointsFromScore(scores, lineup.starting.QB[0], 'QB');
      // const RB0Points = utils.getPointsFromScore(scores, lineup.starting.RB[0], 'RB');
      // const RB1Points = utils.getPointsFromScore(scores, lineup.starting.RB[1], 'RB');
      // const WR0Points = utils.getPointsFromScore(scores, lineup.starting.WR[0], 'WR');
      // const WR1Points = utils.getPointsFromScore(scores, lineup.starting.WR[1], 'WR');
      // const WR2Points = utils.getPointsFromScore(scores, lineup.starting.WR[2], 'WR');
      // const TEPoints = utils.getPointsFromScore(scores, lineup.starting.TE[0], 'TE');
      // const DSTPoints = utils.getPointsFromScore(scores, lineup.starting.DST[0], 'DST');

      // let madeCorrection = false;
      // const totalPoints = parseFloat((QBPoints + RB0Points + RB1Points + WR0Points + WR1Points + WR2Points + TEPoints + DSTPoints).toFixed(2));
      // if(totalPoints != lineup.scoreWeek) {
      //   lineup.scoreWeek = totalPoints;
      //   console.log(`lineup.WeekScore: ${lineup.scoreWeek}, calculatedWeekScore: ${totalPoints}`)
      //   madeCorrection = true;
      // }

      // const prevLineup = await db.readDocument(leaguePath, sbs.getPreviousNFLWeek(gameweek))
      // if(prevLineup) {
      //   if((Number(prevLineup.scoreSeason) + totalPoints).toFixed(2) != lineup.scoreSeason.toFixed(2)) {
      //     console.log(`lineup.scoreSeason: ${lineup.scoreSeason}, calculatedSeasonScore: ${parseFloat((Number(prevLineup.scoreSeason) + totalPoints).toFixed(2))}`)
      //     lineup.scoreSeason = parseFloat((Number(prevLineup.scoreSeason) + totalPoints).toFixed(2));
      //     madeCorrection = true;
      //   }
      // } else {
      //   if(leagueIds[i].indexOf('Weekly') != -1 && lineup.scoreSeason != totalPoints) {
      //     console.log(`lineup.scoreSeason: ${lineup.scoreSeason}, calculatedSeasonScore: ${totalPoints}`)
      //     lineup.scoreSeason = totalPoints;
      //     madeCorrection = true;
      //   }
      // }
      
      // if(madeCorrection) {
      //   if(cardId != lineup._cardId) {
      //     console.log(`... ERROR WE ARE TRYING TO SET A LINEUP WITH A WRONG CARD ID IN CARD #${cardId}`);
      //     continue;
      //   }
      //   console.log(`Needed to update lineup object for card ${i} in ${leagueIds[i]} for ${gameweek}}`)
      //   await db.createOrUpdateDocument(`leagues/genesis/cards/${i}/lineups`, gameweek, lineup, false)
      // }
    }
  }

  console.log(results)
}

( async () => {
    let gameweek = '2022-REG-17';
    //await utils.sleep(1000)

    //await validateCustomLeagues(gameweek);
    

    //await validateGenesisLeagueWeekAndSeasonScoreInParts(gameweek, 0, 1000);
    //await validateGenesisLeagueWeekAndSeasonScoreInParts(gameweek, 1000, 2000);
    //await validateGenesisLeagueWeekAndSeasonScoreInParts(gameweek, 2000, 3000);
    //await validateGenesisLeagueWeekAndSeasonScoreInParts(gameweek, 3000, 4000);
    //await validateGenesisLeagueWeekAndSeasonScoreInParts(gameweek, 4000, 5000);
    //await validateGenesisLeagueWeekAndSeasonScoreInParts(gameweek, 5000, 6000);
    //await validateGenesisLeagueWeekAndSeasonScoreInParts(gameweek, 6000, 7000);
    //await validateGenesisLeagueWeekAndSeasonScoreInParts(gameweek, 7000, 8000);
    //await validateGenesisLeagueWeekAndSeasonScoreInParts(gameweek, 8000, 9000);
    //await validateGenesisLeagueWeekAndSeasonScoreInParts(gameweek, 9000, 10000);

    //await validateGenesisLeagueScorePropagationInParts(gameweek, 0, 1000);
    //await validateGenesisLeagueScorePropagationInParts(gameweek, 1000, 2000);
    //await validateGenesisLeagueScorePropagationInParts(gameweek, 2000, 3000);
    //await validateGenesisLeagueScorePropagationInParts(gameweek, 3000, 4000);
    //await validateGenesisLeagueScorePropagationInParts(gameweek, 4000, 5000);
    //await validateGenesisLeagueScorePropagationInParts(gameweek, 5000, 6000);
    //await validateGenesisLeagueScorePropagationInParts(gameweek, 6000, 7000);
    //await validateGenesisLeagueScorePropagationInParts(gameweek, 7000, 8000);
    //await validateGenesisLeagueScorePropagationInParts(gameweek, 8000, 9000);
    //await validateGenesisLeagueScorePropagationInParts(gameweek, 9000, 10000);

    // await weekTransition.generateSeasonHofLeaderboardForGameweek(gameweek);
    // await weekTransition.generateSeasonLeaderboardForGameweek(gameweek);
    // await weekTransition.generateSeasonSpoiledLeaderboardForGameweek(gameweek);
    // await weekTransition.generateWeeklyHofLeaderboardForGameWeek(gameweek);
    // await weekTransition.generateWeeklySpoiledLeaderboardForGameweek(gameweek);
    // await weekTransition.generateWeeklyTopLeaderboardForGameWeek(gameweek);
    // await weekTransition.runForCustomSeasonLeaguesDuringSeason(gameweek);
    // await runForTopPaidWeekly(gameweek)
    // await runForTop3PaidWeekly(gameweek);
    // await runForTop5PaidLeagues(gameweek);

    await payoutWeeklyGenesis();
    await payoutWeeklyCustom();

    
    
    //await setLineupsForGenesis(0, 1000);
    //await setLineupsForGenesis(1000, 2000);
    //await setLineupsForGenesis(2000, 3000);
    //await setLineupsForGenesis(3000, 4000);
    //await setLineupsForGenesis(4000, 5000);
    //await setLineupsForGenesis(5000, 6000);
    //await setLineupsForGenesis(6000, 7000);
    //await setLineupsForGenesis(7000, 8000);
    //await setLineupsForGenesis(8000, 9000);
    //await setLineupsForGenesis(9000, 10000);
    //gameweek = '2022-REG-17';
    //await setLineupsInCustomSeasons(gameweek)
})()

