//PACKAGES
require("firebase-functions/lib/logger/compat");
const express = require('express');
const leagueRouter = express.Router();
const { v4: uuidv4 } = require('uuid');

//SERVICES
const db = require('../services/db');
const utils = require('../services/utils');
const cardContract = require('../services/cardContract');
const api = require('../services/api');
const sbs = require('../services/sbs');
const weekTransition = require('../services/weekTransition');

//MIDDLEWARE
const checkLeague = require('../middleware/checkLeagueMiddleware');


leagueRouter.post('/:ownerId/templates', async (req, res) => {
  const template = req.body;
  const ownerId = req.params.ownerId;
  await db.createOrUpdateDocument(`leaugeTemplates/${ownerId}`, uuidv4(), template, true);
  res.send(db._sortObject(template));
});

leagueRouter.get('/:ownerId/templates', async (req, res) => {
  const ownerId = req.params.ownerId;
  const templates = await db.readAllDocuments('leaugeTemplates', ownerId);
  res.send(db._sortObject(templates));
})

/**
 * @param  {} req.body league , see validation in middleware
 * This routes creates a new league
 */
leagueRouter.post('/', checkLeague, async (req, res) => {
  let league = req.body;

  if(league.useCustomLeagueName && !league.leagueName) return res.status(400).send('...Must have leagueName if using custom league Name.');
  
  const DURATION = utils.getLeagueDurationText(league.duration.start, league.duration.end); //Daily
  
  const PRIZE = league.prize.coin.isCoinPrize ? `Prize-${league.prize.coin.pot}-$APE` : 'Special Prize'
  const PLACE = league.prize.coin.isCoinPrize ? `Top-${league.prize.coin.numPlacesPaid}-Paid` : 'See details'
  const LEAGUE_SLOT = await utils.getLeagueSlot(DURATION, PRIZE, PLACE);
  league.id = `${DURATION}|${PRIZE}|${PLACE}|${LEAGUE_SLOT}`;
  league._prettyId = league.useCustomLeagueName  ? league.leagueName : `${DURATION} | ${PRIZE} | ${PLACE} | ${LEAGUE_SLOT}`; 
  const duplicateLeauge = await db.readDocument('leagues', league.id);
  if(duplicateLeauge){
    let leagueSlotNumber = parseInt(duplicateLeauge._id.split('|')[3].trim());
    leagueSlotNumber = leagueSlotNumber + 1;
    league.id = `${DURATION}|${PRIZE}|${PLACE}|${leagueSlotNumber}`;
    league._prettyId = `${DURATION} | ${PRIZE} | ${PLACE} | ${leagueSlotNumber}`
  }
  
  league._isActive = true;
  league._status = 'published';
  league.metadata.creatorAddress = league.metadata.creatorAddress.toLowerCase();
  league.metadata.createdAt = db._getTimeStamp();
  league.metadata.updatedAt = league.metadata.createdAt;
  league.game.currentPlayers = 0;
  league = db._sortObject(league);
  await db.createOrUpdateDocument('leagues', league.id, league, true);
  res.send(league);
});


leagueRouter.get('/gameweek', async (req, res) => {
  const gameWeek = sbs.getNFLWeekV2();
  res.status(200).send(gameWeek)
})

// get all active leagues for the current week || queried week
leagueRouter.get('/', async (req, res) => {
  const week = req.query.gameWeek ?? sbs.getNFLWeekV2(); 
  const leagues = await db.readAllDocuments('leagues');
  const leaguesByGameWeek = leagues.filter((league) => league.gameWeek === week)

  return res.send(leaguesByGameWeek)
});

// get all leagues regardless of game week
leagueRouter.get('/all', async (req, res) => {
  const leagues = await db.readAllDocuments('leagues');
  return res.send(leagues)
});

leagueRouter.delete('/:leagueId', async(req, res) => {
  const leagueId = req.params.leagueId;
  const { ownerId } = req.body;

  if(!leagueId) return res.status(400).send('Please provide leagueId.');
  if (!ownerId) return res.status(400).send('Please provide ownerId.');

  const league = await db.readDocument('leagues', leagueId);
  if (!league) return res.status(400).send(`The league: ${leagueId} does not exists.`);

  if (new Date() > new Date(league.duration.start)) return res.status(400).send('The league has already started. Please contact admin.');

  const isAdminWallet = utils.checkIfAdminWallet(ownerId);
  if(!isAdminWallet) return res.status(400).send('You do not have the rights to delete this league.');

  const entryFee = league.entry.fee;
  const owners = [];

  const cards = await db.readAllDocuments(`leagues/${leagueId}/cards`);
  if (cards) {
    cards.forEach(card => owners.push(card._ownerId));
  
    for(let i = 0; i < owners.length; i++){
      const owner = owners[i];
      await db.incrementCredit(owner, entryFee);
      await db.updateOwnersLeagues(owner, leagueId);
    }
  }
  
  await db.recursiveDelete('leagues', leagueId);
  res.status(200).send(`The league: ${leagueId} has been deleted successfully!`);
})

// Cron to run this automatically each week - also possbile new route with match ups page
// leagueRouter.post('/opponents', async (req, res) => {
//   const year = new Date().getFullYear();
//   const season = utils.getNFLSeason(year);
//   const gameWeek = sbs.getNFLWeekV2(); 
  
//   const week = parseInt(gameWeek.split('-')[2])

//   const rawGames = await utils.getGames(year, season, week);

//   if (!rawGames) return res.status(404).send('Game not found');

//   const nflSbsMap = utils.getValidNFLTeams();

//   // weather condition is deprecated from sportsradar. We can possibly use the metadata to get the weather condition from weather api

//   const game = {};
//   rawGames.map(dailyGame => {
//     const home = nflSbsMap[dailyGame.home.alias];
//     const away = nflSbsMap[dailyGame.away.alias];

//     game[home] = {
//       home,
//       away,
//       start: new Date(dailyGame.scheduled).toLocaleString('en-us', { timeZone: 'America/New_York'}),
//       metadata: {
//         ...dailyGame.venue,
//         ...dailyGame.broadcast,
//       } 
//     };
//     game[away] = {
//       home,
//       away,
//       start: new Date(dailyGame.scheduled).toLocaleString('en-us', { timeZone: 'America/New_York'}),
//       metadata: {
//         ...dailyGame.venue,
//         ...dailyGame.broadcast,
//       } 
//     };
//   });

//   try { 
//     await db.createOrUpdateDocument('opponents', gameWeek, game, false);
//     return res.status(201).send(game);
//   } catch (e){
//     return res.status(502).send(game);
//   }
// });

leagueRouter.get('/opponents', async (req, res) => {
  const gameWeek = sbs.getNFLWeekV2(); 
  
  const opponenet = await db.readDocument('opponents', gameWeek);

  if (!opponenet) return res.status(404).send('...Failed to get opponent');

  res.status(200).send(opponenet);
});

leagueRouter.get('/tokenCommunities', async (req, res) => {
  const tokenCommunities = await db.readAllDocuments('tokenCommunities');
  res.send(tokenCommunities);
});

leagueRouter.get('/tokenCommunities/:contractId', async (req, res) => {
  const contractId = req.params.contractId.toLowerCase();
  if(!contractId) return res.status(400).send('...Missing contractId');
  const tokenCommunity = await db.readDocument('tokenCommunities', contractId);
  res.send(tokenCommunity);
});

leagueRouter.get('/:leagueId', async (req, res) => {
  const leagueId = req.params.leagueId;
  const leagues = await db.readDocument('leagues', leagueId);
  res.send(leagues);
});

leagueRouter.patch('/:leagueId/owner/:ownerId/card/:cardId/join', async (req, res) => {
  const gameWeek = sbs.getNFLWeekV2();
  const leagueId = req.params.leagueId;

  //check leagueId exists
  if(!leagueId) return res.status(400).send('...Missing leagueId');

  //check ownerId exists
  const ownerId = req.params.ownerId.toLowerCase();
  if(!ownerId) return res.status(400).send('...Missing ownerId');

  //check cardId exists
  const cardId = req.params.cardId;
  if(!cardId) return res.status(400).send('...Missing cardId');

  //check card is owned by cardId
  const validatedOwnerId = await cardContract.getOwnerByCardId(cardId);
  if(validatedOwnerId != ownerId) return res.status(401).send(`...OwnerWalletId:${ownerId} is not the current owner of cardId:${cardId}.`);

  const league = await db.readDocument('leagues', leagueId);

  //check league exists
  if(!league) return res.status(404).send(`...${leagueId} does not exist!`);
  
  //check league is currently active
  if(league._isActive === false) return res.status(403).send(`...${leagueId} in not active and cannot be joined.`);

  //check league is not full
  if(league.game.currentPlayers >= league.game.maxPlayers) return res.status(403).send(`...${leagueId} is full and cannot accept new players.`);

  //check card is not already in the league
  const cardIsAlreadyJoined = await db.readDocument(`leagues/${leagueId}/cards`, cardId);
  if(cardIsAlreadyJoined) return res.status(400).send(`...cardId:${cardId} has already joined league:${leagueId}`);

  //check league whitelisting
  if(league.game.isAllowList){
    const allowedWalletIds = league.game.allowList.map(wallet => wallet.toLowerCase());
    if(!allowedWalletIds.includes(ownerId)) return res.status(400).send('...You do not meet the wallet allow list requirements to enter this league');
  }
  
  //check and enforce token gating
  let isAllowedIntoLeague = true;
  if(league.game.isCommunityGated){
    const assetOwnerId = req.body.assetOwnerId ? req.body.assetOwnerId : ownerId;
    if(!assetOwnerId) return res.status(400).send('...Missing assetOwnerId for token gating');
    isAllowedIntoLeague = false;
    const approvedCommunityList = league.game.communityList;
    if(approvedCommunityList.length < 1) return res.status(500).send('...Something went wrong with token gating validation');
    isAllowedIntoLeague = await api.validateOwnershipOfComunityAsset(assetOwnerId, approvedCommunityList)
  }
  
  if(!isAllowedIntoLeague) return res.status(400).send('...You do not meet the community token requirements to enter this league');

  //check if only one card per owner
  if(league.game.isOneCardPerOwner){
    const isOwnerAlreadyInLeague = await utils.doesOwnerAlreadyHaveCardInLeague(ownerId, leagueId);
    if(isOwnerAlreadyInLeague) return res.status(400).send('...This league only allows one card per owner to play.');
  }

  //check if entry fee is required
  const owner = await db.readDocument('owners', ownerId);
  if(!owner) return res.status(400).send(`...Missing owner object for ${ownerId}`)
  const preAvailableCredit = owner.availableCredit ? parseFloat(owner.availableCredit) : 0;
  
  if(league.entry.isEntryFee){    
    //check owner has enough available credit to pay the entry fee
    if(preAvailableCredit < league.entry.fee) {
      return res.status(403).send(`...${preAvailableCredit} insufficent credit to enter leagueId"${leagueId}" entry fee of ${league.entry.fee}`);
    }
  }

  //END VALIDATION
    
  //START TRANSACTION HERE
  const now = db._getTimeStamp();

  //deduct the entry fee
  const newAvailableCredit =  parseFloat(parseFloat(preAvailableCredit - league.entry.fee).toFixed(2));
  await db.createOrUpdateDocument('owners', ownerId, {availableCredit: newAvailableCredit}, true);

  //add card to league
  let card = await db.readDocument(`cards`, cardId);
  card.isLocked = false;
  card.joinedAt = now;
  const defaultLineup = utils.getDefaultLineup(card);
  defaultLineup.gameWeek = gameWeek;
  defaultLineup.prevWeekSeasonScore = 0;
  defaultLineup.startingTeamArr = weekTransition.createTeamStartingArrayForLineup(defaultLineup)
  defaultLineup.scoreSeason = 0;
  defaultLineup.scoreWeek = 0;
  await db.createOrUpdateDocument(`leagues/${leagueId}/cards`, cardId, card, true)
  await utils.setLineupInLeague(defaultLineup, league, gameWeek, ownerId);

  //league to owner card object
  const currentOwnerLeagues = owner.Leagues ? owner.Leagues : [];
  currentOwnerLeagues.push({ cardId: cardId, leagueId: leagueId });
  await db.createOrUpdateDocument(`owners`, ownerId, {leagues: currentOwnerLeagues}, true);

  //increment number of currentPlayers in League
  const prevCurrentPlayers = league.game.currentPlayers;
  const newCurrentPalyers = prevCurrentPlayers + 1;
  const playerCountObject = {
    game: {
      currentPlayers: newCurrentPalyers
    }
  };
  await db.createOrUpdateDocument('leagues', leagueId, playerCountObject, true);

  //create the transaction
  const joinLeagueTx = {
    id: uuidv4(),
    cardId: cardId,
    ownerId: ownerId,
    type: 'joinLeague',
    timestamp: db._getTimeStamp(),
    txData: {
      leagueId: leagueId,
      entryFeePaid: league.entry.fee,
      entryFeeCoin: league.entry.coin,
      ownerPrevAvailableCredit: preAvailableCredit,
      ownerNewAvailableCredit: newAvailableCredit,
    }
  }
  await db.createOrUpdateDocument('transactions', joinLeagueTx.id, joinLeagueTx, true);
  await db.createOrUpdateDocument(`cards/${cardId}/transactions`, joinLeagueTx.id, joinLeagueTx, true)

  res.send(db._sortObject(joinLeagueTx));
});

// ad hoc button to set default lineup of current card
leagueRouter.post('/:leagueId/owner/:ownerId/card/:cardId/default-lineup', async (req, res) => {
  const gameWeek = sbs.getNFLWeekV2()
  const leagueId = req.params.leagueId
  if(!leagueId) return res.status(400).send('...Missing leagueId');
  const league = await db.readDocument('leagues', leagueId);
  if(!league) return res.status(404).send(`...league:${leagueId} cannot be found or does NOT exist`);

  const ownerId = req.params.ownerId.toLowerCase();
  if(!ownerId) return res.status(400).send('...Missing ownerId');

  const cardId = req.params.cardId;
  if(!cardId) return res.status(400).send('...Missing cardId');
  const card = await db.readDocument('cards', cardId);
  if(!card) return res.status(404).send(`...card:${cardId} cannot be found or does NOT exist`);

  const confirmedOwnerId = await cardContract.getOwnerByCardId(cardId);
  if(confirmedOwnerId != ownerId) return res.status(403).send(`...card:${cardId} is NOT owned by ownerId:${ownerId}`);

  const defaultLineup = req.body;

  const doesSubmittedLineupMatchCardInfo = await utils.checkLineups(defaultLineup, cardId)
  
  if(!doesSubmittedLineupMatchCardInfo){
    return res.status(400).send('Your submitted lineup does not match your card lineup.')
  }

  const oldLineup = await db.readDocument(`leagues/${leagueId}/cards/${cardId}/lineups`, gameWeek);
  const newLineupDocument = utils.setLineup(defaultLineup, card)
  newLineupDocument.scoreSeason = (oldLineup) ? oldLineup.scoreSeason : 0;
  newLineupDocument.prevWeekSeasonScore = (oldLineup) ? oldLineup.prevWeekSeasonScore : 0;
  newLineupDocument.scoreWeek = (oldLineup) ? oldLineup.scoreWeek : 0;
  newLineupDocument.startingTeamArr = weekTransition.createTeamStartingArrayForLineup(newLineupDocument)
  newLineupDocument.gameWeek = gameWeek;
  await db.createOrUpdateDocument(`leagues/${leagueId}/cards/${cardId}/lineups`, gameWeek, newLineupDocument, false);
  return res.status(200).send(defaultLineup);
})

leagueRouter.post('/:leagueId/owner/:ownerId/card/:cardId/lineup', async (req, res) => {
  //Validation
  const gameWeek = sbs.getNFLWeekV2();
  const leagueId = req.params.leagueId;
  if(!leagueId) return res.status(400).send('...Missing leagueId');
  const league = await db.readDocument('leagues', leagueId);
  if(!league) return res.status(404).send(`...league:${leagueId} cannot be found or does NOT exist`);

  const ownerId = req.params.ownerId.toLowerCase();
  if(!ownerId) return res.status(400).send('...Missing ownerId');
  
  const cardId = req.params.cardId;
  if(!cardId) return res.status(400).send('...Missing cardId');
  const card = await db.readDocument('cards', cardId);
  if(!card) return res.status(404).send(`...card:${cardId} cannot be found or does NOT exist`);
  
  const confirmedOwnerId = await cardContract.getOwnerByCardId(cardId);
  if(confirmedOwnerId != ownerId) return res.status(403).send(`...card:${cardId} is NOT owned by ownerId:${ownerId}`);

  //confirm card has already joined the leagued
  const isCardInLeague = await db.readDocument(`leagues/${leagueId}/cards`, cardId);
  if(!isCardInLeague) return res.status(401).send(`...card:${cardId} has not joined league:${leagueId}`);


  const currentLineup = req.body;
  const isDefault = currentLineup.isDefault ? currentLineup.isDefault : false;

  //check we have the right number for starting and benched positions
  if(currentLineup.starting.QB.length != 1) return res.status(400).send('...Play Invalid.  Number of Starting QB should be equal to 1');
  if(currentLineup.starting.RB.length != 2) return res.status(400).send('...Play Invalid.  Number of Starting RB should be equal to 2');
  if(currentLineup.starting.WR.length != 3) return res.status(400).send('...Play Invalid.  Number of Starting WR should be equal to 3');
  if(currentLineup.starting.TE.length != 1) return res.status(400).send('...Play Invalid.  Number of Starting TE should be equal to 1');
  if(currentLineup.starting.DST.length != 1) return res.status(400).send('...Play Invalid.  Number of Starting DST should be equal to 1');
  if(currentLineup.bench.QB.length != 1) return res.status(400).send('...Play Invalid.  Number of bench QB should be equal to 1');
  if(currentLineup.bench.RB.length != 2) return res.status(400).send('...Play Invalid.  Number of bench RB should be equal to 2');
  if(currentLineup.bench.WR.length != 2) return res.status(400).send('...Play Invalid.  Number of bench WR should be equal to 2');
  if(currentLineup.bench.TE.length != 1) return res.status(400).send('...Play Invalid.  Number of bench TE should be equal to 1');
  if(currentLineup.bench.DST.length != 1) return res.status(400).send('...Play Invalid.  Number of bench DST should be equal to 1');
  
  //check all roster positions are on the card. 
  if(!card.QB.includes(currentLineup.starting.QB[0])) return res.status(400).send(`...${currentLineup.starting.QB[0]} is not a valid starting QB for cardId:${cardId}`);
  if(!card.RB.includes(currentLineup.starting.RB[0])) return res.status(400).send(`...${currentLineup.starting.RB[0]} is not a valid starting RB for cardId:${cardId}`);
  if(!card.RB.includes(currentLineup.starting.RB[1])) return res.status(400).send(`...${currentLineup.starting.RB[1]} is not a valid starting RB for cardId:${cardId}`);
  if(!card.WR.includes(currentLineup.starting.WR[0])) return res.status(400).send(`...${currentLineup.starting.WR[0]} is not a valid starting WR for cardId:${cardId}`);
  if(!card.WR.includes(currentLineup.starting.WR[1])) return res.status(400).send(`...${currentLineup.starting.WR[1]} is not a valid starting WR for cardId:${cardId}`);
  if(!card.WR.includes(currentLineup.starting.WR[2])) return res.status(400).send(`...${currentLineup.starting.WR[2]} is not a valid starting WR for cardId:${cardId}`);
  if(!card.TE.includes(currentLineup.starting.TE[0])) return res.status(400).send(`...${currentLineup.starting.TE[0]} is not a valid starting TE for cardId:${cardId}`);
  if(!card.DST.includes(currentLineup.starting.DST[0])) return res.status(400).send(`...${currentLineup.starting.DST[0]} is not a valid starting DST for cardId:${cardId}`);

  if(!card.QB.includes(currentLineup.bench.QB[0])) return res.status(400).send(`...${currentLineup.bench.QB[0]} is not a valid bench QB for cardId:${cardId}`);
  if(!card.RB.includes(currentLineup.bench.RB[0])) return res.status(400).send(`...${currentLineup.bench.RB[0]} is not a valid bench RB for cardId:${cardId}`);
  if(!card.RB.includes(currentLineup.bench.RB[1])) return res.status(400).send(`...${currentLineup.bench.RB[1]} is not a valid bench RB for cardId:${cardId}`);
  if(!card.WR.includes(currentLineup.bench.WR[0])) return res.status(400).send(`...${currentLineup.bench.WR[0]} is not a valid bench WR for cardId:${cardId}`);
  if(!card.WR.includes(currentLineup.bench.WR[1])) return res.status(400).send(`...${currentLineup.bench.WR[1]} is not a valid bench WR for cardId:${cardId}`);
  if(!card.TE.includes(currentLineup.bench.TE[0])) return res.status(400).send(`...${currentLineup.bench.TE[0]} is not a valid bench TE for cardId:${cardId}`);
  if(!card.DST.includes(currentLineup.bench.DST[0])) return res.status(400).send(`...${currentLineup.bench.DST[0]} is not a valid bench DST for cardId:${cardId}`);

  //Check play can be made per current game status of team/position
  const prevLineup = await db.readDocument(`leagues/${leagueId}/cards/${cardId}/lineups`, gameWeek);

  const scores = await db.readDocument('scores', sbs.getNFLWeekV2());
  const isValidPlay = utils.checkLineupIsValid(prevLineup, currentLineup, scores);
  if(!isValidPlay) return res.status(400).send('...lineup set is invalid at this time');
  
  //set lineup
  const newLineupDocument = utils.setLineup(currentLineup, card);
  newLineupDocument.scoreWeek = (prevLineup) ? prevLineup.scoreWeek : 0;
  newLineupDocument.scoreSeason = (prevLineup) ? prevLineup.scoreSeason : 0;
  newLineupDocument.prevWeekSeasonScore = (prevLineup) ? prevLineup.prevWeekSeasonScore : 0;
  newLineupDocument.startingTeamArr = weekTransition.createTeamStartingArrayForLineup(newLineupDocument)
  newLineupDocument.gameWeek = prevLineup.gameWeek;
  newLineupDocument._updatedAt = db._getTimeStamp();
  if(currentLineup.isDefault){
    await db.createOrUpdateDocument(`owners/${ownerId}/cards/${cardId}/defaultLineup`, 'lineup', newLineupDocument, true);
  }

  await db.createOrUpdateDocument(`leagues/${leagueId}/cards/${cardId}/lineups`, gameWeek, newLineupDocument, true);

  const txId = `OwnerLineup-${uuidv4()}`;
  const transactionObject = {
    txId: txId,
    createdAt: db._getTimeStamp(),
    type: 'ownerLineupSet',
    prevLineup: prevLineup,
    newLineup: newLineupDocument
  }

  await db.createOrUpdateDocument(`transactions`, txId, transactionObject, false);
  await db.createOrUpdateDocument(`owners/${ownerId}/transactions`, txId, transactionObject, false);


  res.send(db._sortObject(newLineupDocument));
});

leagueRouter.get('/:leagueId/owner/:ownerId/card/:cardId/lineup', async(req, res) => {
  //TODO: Refactor to no use year, season week just game week
  const gameWeek = req.query.gameWeek ||sbs.getNFLWeekV2();
  
  //Validation
  const leagueId = req.params.leagueId;
  if(!leagueId) return res.status(400).send('...Missing leagueId');
  const league = await db.readDocument('leagues', leagueId);
  if(!league) return res.status(404).send(`...league:${leagueId} cannot be found or does NOT exist`);

  const ownerId = req.params.ownerId.toLowerCase();
  if(!ownerId) return res.status(400).send('...Missing ownerId');
  
  const cardId = req.params.cardId;
  if(!cardId) return res.status(400).send('...Missing cardId');
  const card = await db.readDocument('cards', cardId);
  if(!card) return res.status(404).send(`...card:${cardId} cannot be found or does NOT exist`);
  
  // const confirmedOwnerId = await cardContract.getOwnerByCardId(cardId);
  // if(confirmedOwnerId != ownerId) return res.status(403).send(`...card:${cardId} is NOT owned by ownerId:${ownerId}`);

  //confirm card has already joined the leagued
  const isCardInLeague = await db.readDocument(`leagues/${leagueId}/cards`, cardId);
  if(!isCardInLeague) return res.status(401).send(`...card:${cardId} has not joined league:${leagueId}`);

  const lineup = await db.readDocument(`leagues/${leagueId}/cards/${cardId}/lineups`, gameWeek);
  if(!lineup) return res.status(400).send('...lineup was not found')
  const scores = await db.readDocument('scores', gameWeek);
  let opponents = await db.readDocument('opponents', gameWeek);
  if (!gameWeek || !opponents) opponents = {};

  for (position in lineup.bench) {
    const lineupPosition = lineup.bench[position];
    const newLineup = [];
    lineupPosition.map(team => {
      let teams = {};
      const opponentData = opponents[team];
      if (!opponents || !opponentData) {
        teams = { team };
      } else {
        if (opponentData.away === team) {
          teams = {
            team,
            opponenet: opponentData.home,
            homeOrAway: "Away",
            score: utils.fetchPointsForPosition(position, team, scores),
            isPlayable: utils.checkLineupOnFetch(team, scores)
          }
        } else {
          teams = {
            team,
            opponenet: opponentData.away,
            homeOrAway: "Home",
            score: utils.fetchPointsForPosition(position, team, scores),
            isPlayable: utils.checkLineupOnFetch(team, scores)
          }
        };

        teams = {
          ...teams,
          metaData: opponentData.metaData,
          start: opponentData.start
        };
      } 
      newLineup.push(teams);
    })
    lineup.bench[position] = newLineup;
  }

  for (position in lineup.starting) {
    const lineupPosition = lineup.starting[position];
    const newLineup = [];
    lineupPosition.map(team => {
      let teams = {};
      const opponentData = opponents[team];
      if (!opponents || !opponentData) {
        teams = { team };
      } else {
        if (opponentData.away === team) {
          teams = {
            team,
            opponenet: opponentData.home,
            homeOrAway: "Away",
            score: utils.fetchPointsForPosition(position, team, scores),
            isPlayable: utils.checkLineupOnFetch(team, scores)
          }
        } else {
          teams = {
            team,
            opponenet: opponentData.away,
            homeOrAway: "Home",
            score: utils.fetchPointsForPosition(position, team, scores),
            isPlayable: utils.checkLineupOnFetch(team, scores)
          }
        };
  
        teams = {
          ...teams,
          metaData: opponentData.metaData,
          start: opponentData.start
        };
      }
      newLineup.push(teams);
    })
    lineup.starting[position] = newLineup;
  }

  res.send(lineup);
});


// hide selected league from public view
leagueRouter.patch(`/:leagueId/owner/:ownerId`, async (req, res) => {
  const leagueId = req.params.leagueId
  const ownerId = req.params.ownerId
  const isAdminWallet = utils.checkIfAdminWallet(ownerId);

  if(!leagueId) return res.status(400).send('...Missing leagueId')
  if(!ownerId) return res.status(400).send('...Missing ownerId')
  if(!isAdminWallet) return res.status(400).send('You do not have the rights to delete this league.');

  const league = await db.readDocument('leagues', leagueId)
  if(!league) return res.status(404).send(`...league:${leagueId} cannot be found or does NOT exist`);
  league._isActive = !league._isActive

  try { 
    await db.createOrUpdateDocument('leagues', leagueId, league, true)
    return res.status(200).send('The visibility for the league was updated successfully.')
  } catch (e) {
    res.send(400).send('Failed to update.')
  }
})

// leagueRouter.post(`/:leagueId/owner/:ownerId/prevCard/:prevCardId/newCard/:newCardId/swap`, async (req, res) => {
  
//   const leagueId = req.params.leagueId;
//   if(!leagueId) return res.status(400).send('...Missing leagueId');
//   const league = await db.readDocument('leagues', leagueId);
//   if(!league) return res.status(404).send(`...league:${leagueId} cannot be found or does NOT exist`);
//   if(!league._isActive) return res.status(400).send(`...league:${leagueId} is NOT active`);

//   const ownerId = req.params.ownerId.toLowerCase();
//   if(!ownerId) return res.status(400).send('...Missing ownerId');

//   const prevCardId = req.params.prevCardId;
//   if(!prevCardId) return res.status(400).send('...Missing cardId');
//   const prevCard = await db.readDocument('cards', prevCardId);
//   if(!prevCard) return res.status(404).send(`...card:${prevCardId} cannot be found or does NOT exist`);
//   const prevCardOwnerId = await cardContract.getOwnerByCardId(prevCardId);
//   if(prevCardOwnerId != ownerId) return res.status(400).send(`...prevCard:${prevCardId} is NOT owned by owner:${ownerId}`);

//   const newCardId = req.params.newCardId;
//   if(!newCardId) return res.status(400).send('...Missing cardId');
//   const newCard = await db.readDocument('cards', newCardId);
//   if(!newCard) return res.status(404).send(`...card:${newCardId} cannot be found or does NOT exist`);
//   const newCardOwnerId = await cardContract.getOwnerByCardId(newCardId);
//   if(newCardOwnerId != ownerId) return res.status(400).send(`...prevCard:${newCardId} is NOT owned by owner:${ownerId}`);


//   //TODO: Check swap can be performed at the time of execution


//   newCard.joinedAt = prevCard.joinedAt;
//   newCard.isLocked = prevCard.isLocked;
//   newCard.updatedAt = db._getTimeStamp();

//   const gameWeek = sbs.getNFLWeekV2();

//   //remove the old CardId
//   await db.deleteDocument(`leagues/${leagueId}/cards/${prevCardId}/lineups`, gameWeek);
//   await db.deleteDocument(`leagues/${leagueId}/cards`, prevCardId);

//   //Add the new cardId 
//   const defaultLineupDocument = utils.getDefaultLineup(newCard);
//   await db.createOrUpdateDocument(`leagues/${leagueId}/cards`, newCardId, newCard, true);
//   await db.createOrUpdateDocument(`leagues/${leagueId}/cards/${newCardId}/lineups`, gameWeek, defaultLineupDocument, true);

//   res.send({
//     prevCard,
//     newCard,
//     newCardLineup: defaultLineupDocument
//   })

// });

leagueRouter.patch('/:leagueId/owner/:ownerId/card/:cardId/leave', async (req, res) => {
  const leagueId = req.params.leagueId;

  //check leagueId exists
  if(!leagueId) return res.status(400).send('...Missing leagueId');

  //check ownerId exists
  const ownerId = req.params.ownerId.toLowerCase();
  if(!ownerId) return res.status(400).send('...Missing ownerId');
  const owner = await db. readDocument('owners', ownerId);
  if(!owner) return res.status(404).send(`...owner${ownerId} not found.`)

  //check cardId exists
  const cardId = req.params.cardId;
  if(!cardId) return res.status(400).send('...Missing cardId');

  //check card is owned by cardId
  const validatedOwnerId = await cardContract.getOwnerByCardId(cardId);
  if(validatedOwnerId != ownerId) return res.status(401).send(`...OwnerWalletId:${ownerId} is not the current owner of cardId:${cardId}.`);

  const league = await db.readDocument('leagues', leagueId);
  const leagueStatus = league._status;

  //check league exisits
  if(!league) return res.status(404).send(`...${leagueId} does not exist!`);
  
  //check league has not reach min playser
  if(league.game.currentPlayers >= league.game.minPlayers) return res.status(403).send(`...${leagueId} has reached minPlayers and is set.  You can no longer leave this league.`);

  //check card is already in the league
  const cardIsAlreadyJoined = await db.readDocument(`leagues/${leagueId}/cards`, cardId);
  if(!cardIsAlreadyJoined) return res.status(400).send(`...cardId:${cardId} is NOT currently in league:${leagueId}`);

  if(leagueStatus !=  'published') return res.status(401).send(`...league:${leagueId} is currenting in status:${leagueStatus} where players can no longer leave.`);

  //TODO: ensure this type of delete is really doing what you want in all cases
  await db.recursiveDelete(`leagues/${leagueId}/cards`, cardId);
  
  const currentPlayerCount = (await db.readAllDocumentIds(`leagues/${leagueId}/cards`)).length;
  await db.createOrUpdateDocument('leagues', leagueId, {game: {currentPlayers: currentPlayerCount}}, true);
  
  const prevAvailableCredit = owner.availableCredit ? parseFloat(owner.availableCredit) : 0;
  const entryFee = league.entry.fee ? league.entry.fee : 0 ;
  const newAvailableCredit = parseFloat(parseFloat(prevAvailableCredit + entryFee).toFixed(2));
  
  if(league.entry.isEntryFee){
    await db.createOrUpdateDocument(`owners`, ownerId, {availableCredit: newAvailableCredit}, true);
  }

  //remove league from owner object
  const ownerLeagues = owner.Leagues.filter(l => l.cardId !== cardId && l.leagueId !== leagueId);
  await db.createOrUpdateDocument('owners', ownerId, {leagues: ownerLeagues }, true);

  const leaveLeagueTx = {
    id: uuidv4(),
    cardId: cardId,
    ownerId: ownerId,
    type: 'leaveLeague',
    timestamp: db._getTimeStamp(),
    txData: {
      leagueId: leagueId,
      entryFeeRefunded: league.entry.fee,
      entryFeeCoin: league.entry.coin,
      prevAvailableCredit: prevAvailableCredit,
      newAvailableCredit: newAvailableCredit
    }
  }

  await db.createOrUpdateDocument('transactions', leaveLeagueTx.id, leaveLeagueTx, true);
  res.send(db._sortObject(leaveLeagueTx));
});

leagueRouter.get('/:leagueId/leaderboard', async(req, res) => {
  const leagueId = req.params.leagueId;
  if(!leagueId) return res.status(400).send('...Missing leagueId');
  const gameWeek = req.query.gameWeek || sbs.getNFLWeekV2();
  const ownerId = req.query.ownerId.toLowerCase();
  const orderBy = req.query.orderBy || 'season';
  const level = req.query.level || 'Pro';

  let scores = [];
  let ownerCards = [];

  const cardIds = await db.readAllDocumentIds(`leagues/${leagueId}/cards`);

  // if(cardIds.length < 40){
 
  // }

  for(let i = 0; i < cardIds.length; i++){
    const cardId = cardIds[i];
    const card = await db.readDocument('cards', cardId);

    const lineup = await db.readDocument(`leagues/${leagueId}/cards/${cardId}/lineups`, gameWeek);
    let scoreObject = {};
    try{
      scoreObject = {
        cardId: cardId,
        scoreWeek: lineup.scoreWeek,
        scoreSeason: lineup.scoreSeason,
        level: card._level,
        ownerId: lineup._ownerId
      };
    }catch(err){
      console.error(`...💩   league:${leagueId} card:${cardId} gameWeek:${gameWeek} lineup:${JSON.stringify(lineup)}`);
      continue;
    }

    const isOnLeaderboard = utils.isCardOnLeaderboardFilter(level, scoreObject.level);
    if(isOnLeaderboard){
      scores.push(scoreObject);
    }
    
    if(ownerId === lineup._ownerId){
      ownerCards.push(scoreObject);
    }
  }

  const sortedScores  = scores.sort((a, b) => orderBy === 'season' ? a.scoreSeason - b.scoreSeason : a.scoreWeek - b.scoreWeek).reverse()

  for(let i = 0; i < sortedScores.length; i++){
    sortedScores[i].rank = i + 1;
  }
  ownerCards = ownerCards.sort((a, b) => a.rank - b.rank)
  let leagueResults = {}

  if(sortedScores.length > 200){
    leagueResults.top = sortedScores.slice(0, 100),
    leagueResults.bottom = [...sortedScores.slice((sortedScores.length - 100), sortedScores.length)].sort().reverse()
  }else{
    leagueResults = sortedScores
  }

  let leaderboardObject = {
    gameWeek,
    ownerCards,
    leagueResults,
  }

  res.send(leaderboardObject);

});

//TODO: Apply logic from above
leagueRouter.get('/genesis/v2', async (req, res) => {
  const gameWeek = req.query.gameWeek || sbs.getNFLWeekV2();
  const orderBy = req.query.orderBy || 'season';
  const level = req.query.level || 'Pro';
  const ownerId = req.query.ownerId.toLowerCase();
  
  let leaderboard

  // hall of fame needs to consolidate hall of fame and spoiled hall of fame
  if(level === 'Hall of Fame'){
    let hof = await db.getLeaderboardV2(gameWeek, orderBy, 'Hall of Fame')
    let shof = await db.getLeaderboardV2(gameWeek, orderBy, 'Spoiled Hall of Fame')

    // combine hof and shof
    leaderboard = [...hof, ...shof]

    // sort by score week or season
    leaderboard.sort((a, b) => orderBy === 'season' ? a.scoreSeason - b.scoreSeason : a.scoreWeek - b.scoreWeek).reverse()

  // Spoiled league needs to consolidate spoiled pro and spoiled hall of fame
  }else if(level === 'Spoiled'){
    let spoiled = await db.getLeaderboardV2(gameWeek, orderBy, 'Spoiled Pro')
    let shof = await db.getLeaderboardV2(gameWeek, orderBy, 'Spoiled Hall of Fame')

    // combine hof and shof
    leaderboard = [...spoiled, ...shof]

    // sort by score week or season
    leaderboard.sort((a, b) => orderBy === 'season' ? a.scoreSeason - b.scoreSeason : a.scoreWeek - b.scoreWeek).reverse()
  }else{
    leaderboard = await db.getLeaderboardV2(gameWeek, orderBy, level)
  }

  // rank document
  for(let i = 0; i < leaderboard.length; i++){
    leaderboard[i].rank = i + 1;
  }

  // filter owners
  const ownerCards = leaderboard.filter(card => card.card._ownerId === ownerId)

  let genesisResults = {}

  if(leaderboard.length > 200){
    genesisResults.top = leaderboard.slice(0, 100),
    genesisResults.bottom = [...leaderboard.slice((leaderboard.length - 100), leaderboard.length)].sort().reverse()
  }else{
    genesisResults = leaderboard
  }

  let leaderboardObject = {
    gameWeek,
    ownerCards,
    genesisResults,
  }

  res.send(leaderboardObject);
});

leagueRouter.get('/:leagueId/results', async(req, res) => {
  const leagueId = req.params.leagueId;
  if(!leagueId) return res.status(400).send('...Missing LeagueId');
  const gameWeek = req.query.gameWeek || sbs.getNFLWeekV2();

  const results = await db.readDocument(`leagues/${leagueId}/results`, gameWeek);
  res.send(results);
});

leagueRouter.get('/community/:community', async (req, res) => {
  const community = req.params.community
  console.log(community)
  //const tokenCommunities = await db.readAllDocuments('tokenCommunities');
  res.send(community);
});

leagueRouter.get('/championship/:level/leaderboard', async (req, res) => {
  console.log('starting to get championship leaderboards')
  const gameWeek = req.query.gameWeek || sbs.getNFLWeekV2();
  console.log(gameWeek)
  const orderBy = req.query.orderBy || 'season';
  console.log(orderBy)
  const ownerId = req.query.ownerId.toLowerCase();
  const level = req.params.level;

  let leaderboard = await db.getChampionshipRoundLeaderboard(gameWeek, orderBy, level);
  console.log(leaderboard[0])

  for(let i = 0; i < leaderboard.length; i++){
    leaderboard[i].rank = i + 1;
  }

  // filter owners
  const ownerCards = leaderboard.filter(card => card.card._ownerId === ownerId)

  let leaderboardObject = {
    gameWeek,
    ownerCards,
    leaderboard,
  }

  res.send(leaderboardObject);
})



module.exports = leagueRouter;
