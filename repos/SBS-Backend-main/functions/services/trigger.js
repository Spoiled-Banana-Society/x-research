//PACKAGES
const web3 = require('web3');
const { v4: uuidv4 } = require('uuid');
const { FieldValue } = require('firebase-admin/firestore');

//SERVICES
const env = require('./env');
const db = require('./db');
const api = require('./api');
const sbs = require('./sbs');
const cardContract = require('./cardContract');
const cardActionContract = require('./cardActionContract');
const utils = require('./utils');
const weekTransition = require('./weekTransition');


const internals = {};

//🧓  this code will likely never get hit again now we sold out, but if does, we should write tests around to ensure its good. 
internals.cardOnCreate = async (snap, context) => {
  console.log('...🔥   START cardOwnership.onCreate');
  const card = snap.data();
  const cardId = card._cardId;
  const ownerId = card._ownerId;
  if(cardId && ownerId){
    const owner = await db.readDocument('owners', ownerId);
    const leaguesCardIsPlaying = owner.Leagues ? owner.Leagues.filter(league => league.CardId === cardId) : []; 
    console.log(`...🕹️   leaguesCardIsPlayingIn:${JSON.stringify(leaguesCardIsPlaying)}`);
    
    await db.createOrUpdateDocument(`owners/${ownerId}/cards`, cardId, after, true);
    console.log(`...➕  owners/${ownerId}/cards added cardId:${cardId}`)
    const sbsCardMetadata = await utils.convertCardToCardMetadata(after);
    await db.createOrUpdateDocument('cardMetadata', cardId, sbsCardMetadata, true);
    console.log(`...➕   cardMetadata updated for cardId:${cardId}`)
      
    for(let i = 0; i < leaguesCardIsPlaying.length; i++){
      const leagueId = leaguesCardIsPlaying[i].leagueId;
      const league = await db.readDocument('leagues', leagueId);
      const leagueCard = await db.readDocument(`leagues/${leagueId}/cards`, cardId);
      after.isLocked = leagueCard.isLocked || false;
      after.joinedAt = leagueCard.joinedAt || db._getTimeStamp();
      const defaultLineup = utils.getDefaultLineup(after);
      await db.createOrUpdateDocument(`leagues/${leagueId}/cards`, cardId, after, false);
      console.log(`...🏆   update card:${cardId} in league:${leagueId} with new owner:${ownerId}`);
      await utils.setLineupInLeague(defaultLineup, league, sbs.getNFLWeekV2());
    }
  }
  console.log('...🔥   END cardOwnership.onCreate');
};

internals.onOwnerChange = async (change, context) => {
  console.log(`...🔥   START cardOwnership.onOwnerChange for ${context.params.cardId}`);
  const before = change.before.data();
  const after = change.after.data();
  const cardId = after._cardId;
  const prevOwnerId = before._ownerId;
  console.log(prevOwnerId)
  const newOwnerId = after._ownerId;
  console.log(newOwnerId)
  const gameweek = sbs.getNFLWeekV2();
  const TAX_YEAR = new Date().getUTCFullYear().toString();

  if (prevOwnerId == newOwnerId) {
    console.log(`...🛑   NOT RUNNING BECAUSE NO OWNER CHANGE WAS FOUND. RETURNING NOW`);
    return 0;
  }

  let leaguesPrevOwnerIsIn;
  let prevOwner = await db.readDocument('owners', prevOwnerId);
  if(prevOwner) {
    if (!prevOwner.Leagues) {
      console.log(`${prevOwnerId} HAS AN OWNER OBJECT BUT NO OWNER.LEAGUES ARRAY`)
      throw(`${prevOwnerId} HAS AN OWNER OBJECT BUT NO OWNER.LEAGUES ARRAY`)
    }
    leaguesPrevOwnerIsIn = prevOwner.Leagues;
  } else {
    let obj = {
      AvailableCredit: 0,
      AvailableEthCredit: 0,
      BlueCheckEmail: "",
      HasW9: {
        [TAX_YEAR]: false
      },
      IsBlueCheckVerified: false,
      Leagues: [],
      NumWithdrawals: 0,
      PendingCredit: 0,
      WithdrawnAmount: {
          [TAX_YEAR]: 0,
      },
      PFP: {
          ImageUrl: "",
          NftContract: "", 
          DisplayName: "",
      }
    }

    await db.createOrUpdateDocument('owners', ownerId, obj, false)
    prevOwner = obj;
  }

  //Update previous owner's document to not reflect them no longer owning this card
  if(await db.readDocument(`owners/${prevOwnerId}/cards/${cardId}/defaultLineup`, 'lineup')) {
    await db.deleteDocument(`owners/${prevOwnerId}/cards/${cardId}/defaultLineup`, 'lineup')
  }
  await db.deleteDocument(`owners/${prevOwnerId}/cards`, cardId)
  console.log(`...➖   owners/${prevOwnerId}/cards remove cardId:${cardId}`)
  const leaguesArrayAfterSelling = leaguesPrevOwnerIsIn.filter(item => item.CardId != cardId );
  prevOwner.Leagues = leaguesArrayAfterSelling;
  await db.createOrUpdateDocument('owners', prevOwnerId, prevOwner, true)
  console.log(`Deleted leagues that card: ${cardId} from the owner.Leagues of ${prevOwnerId}`);

  // Update new card Owner's data to reflect them now owning this card
  const ownerId = newOwnerId; 
  let owner = await db.readDocument('owners', ownerId);
  if(!owner || !owner.Leagues) {
    obj = {
      AvailableCredit: 0,
      AvailableEthCredit: 0,
      BlueCheckEmail: "",
      HasW9: {
        [TAX_YEAR]: false
      },
      IsBlueCheckVerified: false,
      Leagues: [],
      NumWithdrawals: 0,
      PendingCredit: 0,
      WithdrawnAmount: {
          [TAX_YEAR]: 0,
      },
      PFP: {
          ImageUrl: "",
          NftContract: "", 
          DisplayName: "",
      }
    }

    await db.createOrUpdateDocument('owners', ownerId, obj, false)
    owner = obj;
  }
  const leaguesCardIsIn = leaguesPrevOwnerIsIn.filter(league => league.CardId == cardId);
  console.log(`...🕹️   leaguesCardIsPlayingIn:${JSON.stringify(leaguesCardIsIn)}`);
  owner.Leagues = owner.Leagues.concat(leaguesCardIsIn);
  await db.createOrUpdateDocument(`owners/${ownerId}/cards`, cardId, after, false);
  console.log(`Added card: ${cardId} to ${ownerId}'s owner object`)
  await db.createOrUpdateDocument('owners', ownerId, owner, false)
  await db.createOrUpdateDocument('leagues/genesis/cards', cardId, after, false)
  console.log(`Added leagues that card: ${cardId} is in to the owner.Leagues of ${ownerId}`);

  // Update genesisLeaderboard
  const leaderBoardObject = await db.readDocument(`genesisLeaderboard/${gameweek}/cards`, cardId)
  if (leaderBoardObject) {
    leaderBoardObject.card = after;
    leaderBoardObject.ownerId = ownerId;
    await db.createOrUpdateDocument(`genesisLeaderboard/${gameweek}/cards`, cardId, leaderBoardObject, false)
    console.log(`Updated leaderboard object for card: ${cardId}`)
  } else {
    throw(`NO LEADERBOARD OBJECT FOUND FOR ${cardId}`)
  }

  // Update leagues the card is in including the ownerId for the current week's lineup
  for(let i = 0; i < leaguesCardIsIn.length; i++) {
    const leagueId = leaguesCardIsIn[i].LeagueId;
    const leagueCard = await db.readDocument(`leagues/${leagueId}/cards`, cardId);
    if(!leagueCard) {
      console.log(`There was no card object found in ${leagueId} for ${cardId}`)
      continue;
    }
    after.joinedAt = leagueCard.joinedAt || db._getTimeStamp();
    await db.createOrUpdateDocument(`leagues/${leagueId}/cards`, cardId, after, true);
    console.log(`Updated card: ${cardId} in ${leagueId}`)
    const lineup = await db.readDocument(`leagues/${leagueId}/cards/${cardId}/lineups`, gameweek);
    if(!lineup) {
      console.log(`There was no lineup object found in ${leagueId} for ${cardId} in ${gameweek}`)
      continue;
    }
    lineup._ownerId = ownerId;
    await db.createOrUpdateDocument(`leagues/${leagueId}/cards/${cardId}/lineups`, gameweek, lineup, false)
    console.log(`Updated owner to new owner for card: ${cardId} in ${leagueId} lineup in ${gameweek}`)
  }
  console.log(`...🔥   END  cardOwnership.onOwnerChange for ${context.params.cardId}`);
}

internals.onRosterChange = async (change, context) => {
  console.log(`...🔥   START cardOwnership.onRosterChange for ${context.params.cardId}`);
  const before = change.before.data();
  const after = change.after.data();
  const cardId = after._cardId;
  const gameweek = sbs.getNFLWeekV2();
  const ownerId = after._ownerId;

  let needToReset = false;
  if (JSON.stringify(before.DST) != JSON.stringify(after.DST) || JSON.stringify(before.QB) != JSON.stringify(after.QB) || JSON.stringify(before.RB) != JSON.stringify(after.RB) || JSON.stringify(before.TE) != JSON.stringify(after.TE) || JSON.stringify(before.WR) != JSON.stringify(after.WR)) {
    needToReset = true;
  }
  if(!needToReset) {
    console.log(`...🛑   NO ROSTER CHANGE was found in the change for ${context.params.cardId}`);
    return 0;
  }

  //update card metadata 
  const sbsCardMetadata = await utils.convertCardToCardMetadata(after);
  await db.createOrUpdateDocument('cardMetadata', cardId, sbsCardMetadata, true);
  console.log(`...➕   cardMetadata updated for cardId:${cardId}`)

  // update card in owner
  await db.createOrUpdateDocument(`owners/${ownerId}/cards`, cardId, after, false)
  console.log(`Updated card: ${cardId} in ${ownerId}`) 

  // Update card in leagues
  const owner = await db.readDocument('owners', ownerId);
  if(!owner || !owner.Leagues) {
    throw(`NO ONWER OR OWNER.LEAGUES FOUND FOR ${ownerId}`)
  }

  const defaultLineup = utils.getDefaultLineup(after);
  const leagueId = 'genesis'
  const oldLineup = await db.readDocument(`leagues/${leagueId}/cards/${cardId}/lineups`, gameweek)
  defaultLineup.gameWeek = sbs.getNFLWeekV2();
  defaultLineup.scoreWeek = (oldLineup) ? oldLineup.scoreWeek : 0;
  defaultLineup.prevWeekSeasonScore = (oldLineup) ? oldLineup.prevWeekSeasonScore : 0;
  defaultLineup.startingTeamArr = weekTransition.createTeamStartingArrayForLineup(defaultLineup);
  defaultLineup.scoreSeason = (oldLineup) ? oldLineup.scoreSeason : 0;
  console.log(`Carrying over scoreSeason and scoreWeek to new lineup object: scoreWeek = ${defaultLineup.scoreWeek} and scoreSeason = ${defaultLineup.scoreSeason} in ${leagueId} for ${gameweek}`)
  await db.createOrUpdateDocument(`leagues/${leagueId}/cards`, cardId, after, false)
  console.log(`Updated card: ${cardId} in ${leagueId}`)
  // set the current week's lineup for all leagues to default lineup
  await utils.setDefaultLineupAferMashOrPeel(defaultLineup, leagueId, sbs.getNFLWeekV2(), ownerId);
  console.log(`SET DEFAULT LINEUP FOR CARD: ${cardId} IN ${leagueId}`)


  // Update GenesisLeaderboard
  //const defaultLineup = utils.getDefaultLineup(after);
  //const oldLineup = await db.readDocument(`leagues/genesis/cards/${cardId}/lineups`, gameweek)
  //defaultLineup.scoreWeek = oldLineup.scoreWeek;
  //defaultLineup.scoreSeason = oldLineup.scoreSeason;
  //defaultLineup.gameWeek = gameweek;
  const leaderBoardObject = await db.readDocument(`genesisLeaderboard/${gameweek}/cards`, cardId);
  leaderBoardObject.card = after;
  leaderBoardObject.lineup.bench = defaultLineup.bench;
  leaderBoardObject.lineup.starting = defaultLineup.starting;
  await db.createOrUpdateDocument(`genesisLeaderboard/${gameweek}/cards`, cardId, leaderBoardObject, false)
  console.log(`Updated leaderboard object for card: ${cardId}`)

  console.log(`...🔥   END  cardOwnership.onRosterChange for ${context.params.cardId}`);
}

internals.onFreePeelAddition = async (change, context) => {
  console.log(`...🔥   START cardOwnership.onFreePeelAddition for ${context.params.cardId}`);
  const before = change.before.data();
  const after = change.after.data();
  const cardId = after._cardId;
  const ownerId = after._ownerId;
  const gameweek = sbs.getNFLWeekV2();
  if(before._freePeel > after._freePeel || before._freePeel == after._freePeel) {
    console.log(`...🛑   NO FREE PEELS added for ${context.params.cardId}, returning now`);
    return 0;
  }
  // update card in owners
  await db.createOrUpdateDocument(`owners/${ownerId}/cards`, cardId, after, false)
  console.log(`Updated card: ${cardId} in ${ownerId}'s owner object`)
  
  //update card in leagues
  const owner = await db.readDocument('owners', ownerId)
  if(!owner || !owner.Leagues) {
    throw(`NO ONWER OR OWNER.LEAGUES FOUND FOR ${ownerId}`)
  }
  const leaguesCardIsIn = owner.Leagues.filter(item => item.CardId == cardId)
  for(let i = 0; i < leaguesCardIsIn.length; i++) {
    const leagueId = leaguesCardIsIn[i].leagueId;
    await db.createOrUpdateDocument(`leagues/${leagueId}/cards`, cardId, after, false)
    console.log(`Updated card: ${cardId} in ${leagueId}`)
  }

  //Update Genesis Leaderboard
  const leaderBoardObject = await db.readDocument(`genesisLeaderboard/${gameweek}/cards`, cardId);
  leaderBoardObject.card = after;
  await db.createOrUpdateDocument(`genesisLeaderboard/${gameweek}/cards`, cardId, leaderBoardObject, false)
  console.log(`Updated leaderboard object for card: ${cardId}`)

  console.log(`...🔥   END  cardOwnership.onFreePeelAddition for ${context.params.cardId}`);
}

internals.onPrizeChanges = async (change, context) => {
  console.log(`...🔥   START cardOwnership.onPrizeChanges for ${context.params.cardId}`);
  const before = change.before.data();
  const after = change.after.data();
  const cardId = after._cardId;
  const ownerId = after._ownerId;
  const gameweek = sbs.getNFLWeekV2()

  if(before.prizes) {
    if(before.prizes['ape'] == after.prizes['ape'] && before.prizes['eth'] == after.prizes['eth']) {
      console.log(`...🛑   No prize changes were found for ${cardId} returning now`)
      return 0;
    }
  }

  // update card in owners
  await db.createOrUpdateDocument(`owners/${ownerId}/cards`, cardId, after, false)
  console.log(`Updated card: ${cardId} in ${ownerId}'s owner object`)
  
  //update card in leagues
  const owner = await db.readDocument('owners', ownerId)
  if(!owner || !owner.Leagues) {
    throw(`NO ONWER OR OWNER.LEAGUES FOUND FOR ${ownerId}`)
  }
  const leaguesCardIsIn = owner.Leagues.filter(item => item.CardId == cardId)
  for(let i = 0; i < leaguesCardIsIn.length; i++) {
    const leagueId = leaguesCardIsIn[i].leagueId;
    await db.createOrUpdateDocument(`leagues/${leagueId}/cards`, cardId, after, false)
    console.log(`Updated card: ${cardId} in ${leagueId}`)
  }

  //Update Genesis Leaderboard
  const leaderBoardObject = await db.readDocument(`genesisLeaderboard/${gameweek}/cards`, cardId);
  if(!leaderBoardObject) {
    console.log(`No leaderboard object was found for ${cardId}`)
  }
  leaderBoardObject.card = after;
  await db.createOrUpdateDocument(`genesisLeaderboard/${gameweek}/cards`, cardId, leaderBoardObject, false)
  console.log(`Updated leaderboard object for card: ${cardId}`)

  // update metadata and opensea
  const metadata = utils.convertCardToCardMetadata(after)
  await api.refreshOpenseaMetadata(cardId)

  console.log(`...🔥   END  cardOwnership.onPrizeChanges for ${context.params.cardId}`);
}

internals.onLevelChange = async (change, context) => {
  console.log(`...🔥   START cardOwnership.onLevelChange for ${context.params.cardId}`);
  const before = change.before.data();
  const after = change.after.data();
  const cardId = after._cardId;
  const ownerId = after._ownerId;
  const gameweek = sbs.getNFLWeekV2()

  if(before._level == after._level) {
    console.log("NO level change was detected so we are returning immediately")
    return 0
  }

  //update card metadata 
  const sbsCardMetadata = await utils.convertCardToCardMetadata(after);
  await db.createOrUpdateDocument('cardMetadata', cardId, sbsCardMetadata, true);
  console.log(`...➕   cardMetadata updated for cardId:${cardId}`)

  // update card in owners
  await db.createOrUpdateDocument(`owners/${ownerId}/cards`, cardId, after, false)
  console.log(`Updated card: ${cardId} in ${ownerId}'s owner object`)
  
  //update card in leagues
  const owner = await db.readDocument('owners', ownerId)
  if(!owner || !owner.Leagues) {
    console.error(`NO OWNER OR OWNER.LEAGUES FOUND FOR ${ownerId}`)
    return;
  }
  const leaguesCardIsIn = owner.Leagues.filter(item => item.CardId == cardId)
  for(let i = 0; i < leaguesCardIsIn.length; i++) {
    const leagueId = leaguesCardIsIn[i].leagueId;
    await db.createOrUpdateDocument(`leagues/${leagueId}/cards`, cardId, after, false)
    console.log(`Updated card: ${cardId} in ${leagueId}`)
  }

  //Update Genesis Leaderboard
  const leaderBoardObject = await db.readDocument(`genesisLeaderboard/${gameweek}/cards`, cardId);
  if(!leaderBoardObject) {
    console.log(`No leaderboard object was found for ${cardId}`)
  }
  leaderBoardObject.card = after;
  await db.createOrUpdateDocument(`genesisLeaderboard/${gameweek}/cards`, cardId, leaderBoardObject, false)
  console.log(`Updated leaderboard object for card: ${cardId}`)

  console.log(`...🔥   END  cardOwnership.onLevelChange for ${context.params.cardId}`);
}

internals.txOnCreate = async (snap, context) => {
  console.log('...🔥 START transaction.onCreate');
  const tx = snap.data();
  const txHash = context.params.txHash;
  const ownerId = tx._ownerId.toLowerCase()
  const type = tx.type;


  if(ownerId){
    await db.createOrUpdateDocument(`owners/${ownerId.toLowerCase()}/transactions`, txHash, tx, true);
    console.log(`...➕  owners/${ownerId.toLowerCase()}/tx added txHash:${txHash}`);
  }

  if(type === 'deposit'){
    const prevOwnerObject = await readDocument('owners', ownerId.toLowerCase());
    const prevPendingCredit = Number(prevOwnerObject.pendingCredit) ? Number(parseFloat(prevPendingObject.pendingCredit)) : 0;
    const depositAmount = parseFloat(tx.depositAmount);
    const pendingCredit = prevPendingCredit + Number(depositAmount);
    await db.createOrUpdateDocument('owners', ownerId.toLowerCase(), {pendingCredit: pendingCredit.toString()}, true)
  }


  console.log('...🔥 END transaction.onCreate');
}

internals.txOnUpdate = async (change, context) => {
  console.log('...🔥 START tx.onUpdate');
  const before = change.before.data();
  const after = change.after.data();
  const txHash = context.params.txHash;
  const ownerId = after._ownerId.toLowerCase();
  if(ownerId){
    await db.createOrUpdateDocument(`owners/${ownerId.toLowerCase()}/transactions`, txHash, tx, true);
    console.log(`...➕  owners/${ownerId.toLowerCase()}/tx updated txHash:${txHash}`);
  }
  console.log('...🔥 END tx.onUpdate');
};

internals.confirmTransactionOnChain = async (snap, context) => {
  console.log('...🔥   START confirmTransactionOnChain');
  const MAX_RETRIES = env.get('ETHERSCAN_MAX_RETRIES');
  const RETRY_FREQUENCY = env.get('ETHERSCAN_RETRY_FREQUENCY');
  const NETWORK = env.get('NETWORK');
  const tx = snap.data();
  const txHash = tx.txHash;
  const ownerId = tx._ownerId;
  const isValidTx = await api.eth_getTransactionReceipt(txHash);
  const depositAmount = web3.utils.fromWei(isValidTx.result.logs[0].data);
  if(!isValidTx){
    console.error(`...💩   tx:${txHash} not found on chain:${NETWORK}`);
    return 0;
  }
  if(isValidTx.result.blockNumber){
    let isTxConfirmed = false;
    let retryCount = 0;
    while(!isTxConfirmed && retryCount < MAX_RETRIES){
      isTxConfirmed = await api.eth_isTransactionConfirmed(txHash);
      if(!isTxConfirmed){
        await utils.sleep(RETRY_FREQUENCY);
        retryCount++;
      }
    }
    if(isTxConfirmed){
      console.log(`...✅   txHash:${txHash} successfully confirm on network:${NETWORK}`);
      const prevOwnerObject = await readDocument('owners', ownerId);
      const prevAvailableCredit = prevOwnerObject.availableCredit ? Number(parseFloat(prevOwnerObject.availableCredit)) : 0;
      const availableCredit = prevAvailableCredit + Number(parseFloat(depositAmount));
      const prevPendingCredit = Number(parseFloat(prevOwnerObject.pendingCredit));
      const pendingCredit = prevPendingCredit - Number(parseFloat(depositAmount));
      const updatedCreditObject = {
        pendingCredit,
        availableCredit
      }
      await db.createOrUpdateDocument('owners', ownerId, updatedCreditObject, true)
    }
  }
  console.log('...🔥   END confirmTransactionOnChain');
}

internals.referralOnCreate = async (snap, context) => {
  console.log('...🔥 START referral.onCreate');
  const referral = snap.data();
  const ownerId = context.params.referralCode.toLowerCase();
  await db.createOrUpdateDocument(`owners`, ownerId, referral, true);
  console.log('...🔥 END referral.onCreate');
};

internals.referralOnUpdate = async (change, context) => {
  console.log('...🔥 START referral.onUpdate');
  const before = change.before.data();
  const after = change.after.data();
  const referral = after;
  const ownerId = context.params.referralCode.toLowerCase();
  await db.createOrUpdateDocument(`owners`, ownerId, referral, true);
  console.log('...🔥 END referral.onUpdate');
};

internals.onLeagueJoin = async (snap, context) => {
  console.log('...start on join trigger');
  console.log('...end on join trigger');
};

// trigger on scores/{gameweek}
internals.checkForAllGamesClosed = async (change, context) => {
  console.log(`Starting trigger to check for all games being closed for ${context.params.gameweek}`)
  const after = change.after.data();
  const gameWeek = context.params.gameweek;
  const progress = await db.readDocument('weekTransitionProgress', gameWeek);
  if(progress && progress.areScoresClosed) {
      console.log(`We have already confirmed scores are closed and set areScoresClosed to true in ${gameWeek}`)
      return 0;
  }
  const scores = after.FantasyPoints
  const year = gameWeek.split('-')[0];
  const season = gameWeek.split('-')[1];
  const week = gameWeek.split('-')[2]; 
  const data = await utils.getGames(year, season, week);
  const teamsPlayingThisWeek = [];
  for(let i = 0; i < data.length; i++) {
    teamsPlayingThisWeek.push(data[i].home.alias.toUpperCase())
    teamsPlayingThisWeek.push(data[i].away.alias.toUpperCase())
  }
  for(let i = 0; i < scores.length; i++) {
    if(scores[i].GameStatus != "closed") {
      if(scores[i].GameStatus == "none") {
        if(teamsPlayingThisWeek.includes(scores[i].team.toUpperCase())) {
            console.log('This week is still ongoing so we will not be running the scraper yet')
            return 0;
        }
      } else {
        console.log('This game is not closed or "none" so the game must still be ongoing')
        return 0;
      }
    }
  }

  const res = { areScoresClosed: true }
  try {
    await db.createOrUpdateDocument('weekTransition', gameWeek, res, true)
  } catch(err) {
    console.log(err)
  }
  //await db.createOrUpdateDocument('weekTransition', gameWeek, res, true)
  console.log(`Created weekTransition document for ${gameWeek} to show that scores are closed for the week and start the week transition process`)
  console.log(`END of checkForAllGamesClosed`)
}

// trigger for weekTransition/{gameweek}
internals.validateGenesisWeekAndSeasonScoreInParts = async (change, context, min, max) => {
  console.log(`Start of validateGenesisWeekAndSeasonScoreInParts from ${min} to ${max}`);
  const gameweek = context.params.gameweek;
  const progress = change.after.data();
  const fieldKey = `hasValidatedGenesisWeekAndSeasonScoresFor${min}To${max}`
  if(!progress || !progress.hasVerifiedScores || progress[fieldKey]) {
    console.log("Either we have not finished comparing scores or we have already run this function for " + min + " to " + max) 
    return 0;
  }
  await weekTransition.validateGenesisLeagueWeekAndSeasonScoreInParts(gameweek, min, max)
  console.log(`Validated Genesis week and season scores for cards ${min} to ${max}`);

  const res = { [fieldKey]: true };
  try {
    await db.createOrUpdateDocument('weekTransition', gameweek, res, true)
    console.log('Updated WeekTransition document')
  } catch(err) {
    console.log(err)
  }
  return 0;
}

// Trigger for weekTransition/{gameweek} 
internals.validateGenesisDataPropagationInParts = async (change, context, min, max) => {
  console.log(`Start of validateGenesisDataPropagationInParts in ${context.params.gameweek}`);
  const gameweek = context.params.gameweek;
  const progress = change.after.data();
  const fieldKey = `hasValidatedGenesisScoresPropagationFor${min}To${max}`
  const validationFieldKey = `hasValidatedGenesisWeekAndSeasonScoresFor${min}To${max}`
  if(!progress || !progress.hasVerifiedScores || !progress[validationFieldKey] || progress[fieldKey]) {
    console.log("Either we have not finished prior steps needed or we have already run this for  " + min + " to " + max) 
    return 0;
  }

  await weekTransition.validateGenesisLeagueScorePropagationInParts(gameweek, min, max);
  console.log(`Completed validation of score propagation to the genesisLeaderboard for cards ${min} to ${max}`)
  const res = { [fieldKey]: true };
  try {
    await db.createOrUpdateDocument('weekTransition', gameweek, res, true)
    console.log('Updated WeekTransition document')
  } catch(err) {
    console.log(err)
  }
  return 0;
}

// trigger for weekTransition/{gameweek}
internals.verifyLineupsForWeeklyCustomLeagues = async (change, context) => {
  console.log(`Started Verifying lineups in custom weekly leagues for ${context.params.gameweek}`)
  const gameweek = context.params.gameweek;
  const progress = change.after.data();
  if(!progress || !progress.hasVerifiedScores || progress.hasVerifiedWeeklyCustomLeagueScores) {
    console.log(`Either we have not finished the steps required to run this or it has already run for ${gameweek}`);
    return 0;
  }

  await weekTransition.verifyLineupsForWeeklyCustomLeagues(gameweek);
  console.log('Completed validation of lineup scores in weekly custom leagues for ' + gameweek)
  const res = { hasVerifiedWeeklyCustomLeagueScores: true }
  await db.createOrUpdateDocument('weekTransition', gameweek, res, true);
  return 0;
}


// trigger for weekTransition/{gameweek}
internals.verifyLineupScoresForFirstHalfOfSeasonLeagues = async (change, context) => {
  console.log(`Started Verifying lineups in first half of Custom Season leagues for ${context.params.gameweek}`)
  const gameweek = context.params.gameweek;
  const progress = change.after.data();
  if(!progress || !progress.hasVerifiedScores || progress.hasVerifiedFirstHalfOfCustomSeasonLeagues) {
    console.log(`Either we have not finished the steps required to run this or it has already run for ${gameweek}`);
    return 0;
  }

  await weekTransition.verifyLineupScoresForFirstHalfOfSeasonLeagues(gameweek);
  console.log('Completed validation of lineup scores in first half of Custom Season leagues for ' + gameweek)
  const res = { hasVerifiedFirstHalfOfCustomSeasonLeagues: true }
  await db.createOrUpdateDocument('weekTransition', gameweek, res, true);
  return 0;
}


// trigger for weekTransition/{gameweek}
internals.verifyLineupScoresForSecondHalfOfSeasonLeagues = async (change, context) => {
  console.log(`Started Verifying lineups in Second half of Custom Season leagues for ${context.params.gameweek}`)
  const gameweek = context.params.gameweek;
  const progress = change.after.data();
  if(!progress || !progress.hasVerifiedScores || progress.hasVerifiedSecondHalfOfCustomSeasonLeagues) {
    console.log(`Either we have not finished the steps required to run this or it has already run for ${gameweek}`);
    return 0;
  }

  await weekTransition.verifyLineupScoresForSecondHalfOfSeasonLeagues(gameweek);
  console.log('Completed validation of lineup scores in second half of Custom Season leagues for ' + gameweek)
  const res = { hasVerifiedSecondHalfOfCustomSeasonLeagues: true }
  await db.createOrUpdateDocument('weekTransition', gameweek, res, true);
  return 0;
}


// trigger for weekTransition/{gameweek} to generate season leaderboard for genesis after score validation has happened
internals.addAwardsToGenesisSeasonLeaderboard = async (change, context) => {
  console.log(`START of addAwardsToGenesisSeasonLeaderboard in ${context.params.gameweek}`)
  const gameweek = context.params.gameweek;
  const progress = change.after.data();
  if(!progress || !progress.hasVerifiedScores || progress.addedAwardsForGenesisSeasonAll || progress.creatingSeasonTopLeaderboard) {
    console.log(`Either we have not finished the steps required to run this or it has already run for ${gameweek}`)
    return 0;
  }
  if(!progress.hasValidatedGenesisScoresPropagationFor0To1000 || !progress.hasValidatedGenesisScoresPropagationFor1000To2000 || !progress.hasValidatedGenesisScoresPropagationFor2000To3000 || !progress.hasValidatedGenesisScoresPropagationFor3000To4000 || !progress.hasValidatedGenesisScoresPropagationFor4000To5000) {
    console.log('We have not finished validating genesis data yet so we are returning')
    return 0
  }
  if(!progress.hasValidatedGenesisScoresPropagationFor5000To6000 || !progress.hasValidatedGenesisScoresPropagationFor6000To7000 || !progress.hasValidatedGenesisScoresPropagationFor7000To8000 || !progress.hasValidatedGenesisScoresPropagationFor8000To9000 || !progress.hasValidatedGenesisScoresPropagationFor9000To10000) {
    console.log('We have not finished validating genesis data yet so we are returning')
    return 0
  }
  await db.createOrUpdateDocument('weekTransition', gameweek, { creatingSeasonTopLeaderboard: true }, true)

  await weekTransition.generateSeasonLeaderboardForGameweek(gameweek);
  console.log(`Completed adding awards to genesis Season All leaderboard for ${gameweek}`);
  const res = { addedAwardsForGenesisSeasonAll: true };
  await db.createOrUpdateDocument('weekTransition', gameweek, res, true);
  return 0;
}

// trigger for weekTransition/{gameweek} to generate weekly leaderboard for genesis after score validation has happened
internals.addAwardsToGenesisWeeklyTopLeaderboard = async (change, context) => {
  console.log(`START of addAwardsToGenesisWeeklyTopLeaderboard in ${context.params.gameweek}`)
  const gameweek = context.params.gameweek;
  const progress = change.after.data();
  if(!progress || !progress.hasVerifiedScores || progress.addedAwardsForGenesisWeeklyTop || progress.creatingWeeklyTopLeaderboard) {
    console.log(`Either we have not finished the steps required to run this or it has already run for ${gameweek}`)
    return 0;
  }

  if(!progress.hasValidatedGenesisScoresPropagationFor0To1000 || !progress.hasValidatedGenesisScoresPropagationFor1000To2000 || !progress.hasValidatedGenesisScoresPropagationFor2000To3000 || !progress.hasValidatedGenesisScoresPropagationFor3000To4000 || !progress.hasValidatedGenesisScoresPropagationFor4000To5000) {
    console.log('We have not finished validating genesis data yet so we are returning')
    return 0
  }
  if(!progress.hasValidatedGenesisScoresPropagationFor5000To6000 || !progress.hasValidatedGenesisScoresPropagationFor6000To7000 || !progress.hasValidatedGenesisScoresPropagationFor7000To8000 || !progress.hasValidatedGenesisScoresPropagationFor8000To9000 || !progress.hasValidatedGenesisScoresPropagationFor9000To10000) {
    console.log('We have not finished validating genesis data yet so we are returning')
    return 0
  }
  await db.createOrUpdateDocument('weekTransition', gameweek, { creatingWeeklyTopLeaderboard: true }, true)

  await weekTransition.generateWeeklyTopLeaderboardForGameWeek(gameweek);
  console.log(`Completed adding awards to genesis Weekly Top leaderboard for ${gameweek}`);
  const res = { addedAwardsForGenesisWeeklyTop: true };
  await db.createOrUpdateDocument('weekTransition', gameweek, res, true);
  return 0;
}


// trigger for weekTransition/{gameweek} to generate season HOF leaderboard for genesis after score validation has happened
internals.addAwardsToGenesisSeasonHOFLeaderboard = async (change, context) => {
  console.log(`START of addAwardsToGenesisSeasonHOFLeaderboard in ${context.params.gameweek}`)
  const gameweek = context.params.gameweek;
  const progress = change.after.data();
  if(!progress || !progress.hasVerifiedScores || progress.addedAwardsForGenesisSeasonHof || progress.creatingSeasonHOFLeaderboard) {
    console.log(`Either we have not finished the steps required to run this or it has already run for ${gameweek}`)
    return 0;
  }

  if(!progress.hasValidatedGenesisScoresPropagationFor0To1000 || !progress.hasValidatedGenesisScoresPropagationFor1000To2000 || !progress.hasValidatedGenesisScoresPropagationFor2000To3000 || !progress.hasValidatedGenesisScoresPropagationFor3000To4000 || !progress.hasValidatedGenesisScoresPropagationFor4000To5000) {
    console.log('We have not finished validating genesis data yet so we are returning')
    return 0
  }
  if(!progress.hasValidatedGenesisScoresPropagationFor5000To6000 || !progress.hasValidatedGenesisScoresPropagationFor6000To7000 || !progress.hasValidatedGenesisScoresPropagationFor7000To8000 || !progress.hasValidatedGenesisScoresPropagationFor8000To9000 || !progress.hasValidatedGenesisScoresPropagationFor9000To10000) {
    console.log('We have not finished validating genesis data yet so we are returning')
    return 0
  }
  await db.createOrUpdateDocument('weekTransition', gameweek, { creatingSeasonHOFLeaderboard: true }, true)

  await weekTransition.generateSeasonHofLeaderboardForGameweek(gameweek);
  console.log(`Completed adding awards to genesis Season HOF leaderboard for ${gameweek}`);
  const res = { addedAwardsForGenesisSeasonHof: true };
  await db.createOrUpdateDocument('weekTransition', gameweek, res, true);
  return 0;
}


// trigger for weekTransition/{gameweek} to generate season HOF leaderboard for genesis after score validation has happened
internals.addAwardsToGenesisWeeklyHOFLeaderboard = async (change, context) => {
  console.log(`START of addAwardsToGenesisWeeklyHOFLeaderboard in ${context.params.gameweek}`)
  const gameweek = context.params.gameweek;
  const progress = change.after.data();
  if(!progress || !progress.hasVerifiedScores || progress.addedAwardsForGenesisWeeklyHof || progress.creatingWeeklyHOFLeaderboard) {
    console.log(`Either we have not finished the steps required to run this or it has already run for ${gameweek}`)
    return 0;
  }

  if(!progress.hasValidatedGenesisScoresPropagationFor0To1000 || !progress.hasValidatedGenesisScoresPropagationFor1000To2000 || !progress.hasValidatedGenesisScoresPropagationFor2000To3000 || !progress.hasValidatedGenesisScoresPropagationFor3000To4000 || !progress.hasValidatedGenesisScoresPropagationFor4000To5000) {
    console.log('We have not finished validating genesis data yet so we are returning')
    return 0
  }
  if(!progress.hasValidatedGenesisScoresPropagationFor5000To6000 || !progress.hasValidatedGenesisScoresPropagationFor6000To7000 || !progress.hasValidatedGenesisScoresPropagationFor7000To8000 || !progress.hasValidatedGenesisScoresPropagationFor8000To9000 || !progress.hasValidatedGenesisScoresPropagationFor9000To10000) {
    console.log('We have not finished validating genesis data yet so we are returning')
    return 0
  }
  await db.createOrUpdateDocument('weekTransition', gameweek, { creatingWeeklyHOFLeaderboard: true }, true)

  await weekTransition.generateWeeklyHofLeaderboardForGameWeek(gameweek);
  console.log(`Completed adding awards to genesis Weekly HOF leaderboard for ${gameweek}`);
  const res = { addedAwardsForGenesisWeeklyHof: true };
  await db.createOrUpdateDocument('weekTransition', gameweek, res, true);
  return 0;
}


// trigger for weekTransition/{gameweek} to generate season HOF leaderboard for genesis after score validation has happened
internals.addAwardsToGenesisSeasonSpoiledLeaderboard = async (change, context) => {
  console.log(`START of addAwardsToGenesisSeasonSpoiledLeaderboard in ${context.params.gameweek}`)
  const gameweek = context.params.gameweek;
  const progress = change.after.data();
  if(!progress || !progress.hasVerifiedScores || progress.addedAwardsForGenesisSeasonSpoiled || progress.creatingSeasonSpoiledLeaderboard) {
    console.log(`Either we have not finished the steps required to run this or it has already run for ${gameweek}`)
    return 0;
  }

  if(!progress.hasValidatedGenesisScoresPropagationFor0To1000 || !progress.hasValidatedGenesisScoresPropagationFor1000To2000 || !progress.hasValidatedGenesisScoresPropagationFor2000To3000 || !progress.hasValidatedGenesisScoresPropagationFor3000To4000 || !progress.hasValidatedGenesisScoresPropagationFor4000To5000) {
    console.log('We have not finished validating genesis data yet so we are returning')
    return 0
  }
  if(!progress.hasValidatedGenesisScoresPropagationFor5000To6000 || !progress.hasValidatedGenesisScoresPropagationFor6000To7000 || !progress.hasValidatedGenesisScoresPropagationFor7000To8000 || !progress.hasValidatedGenesisScoresPropagationFor8000To9000 || !progress.hasValidatedGenesisScoresPropagationFor9000To10000) {
    console.log('We have not finished validating genesis data yet so we are returning')
    return 0
  }
  await db.createOrUpdateDocument('weekTransition', gameweek, { creatingSeasonSpoiledLeaderboard: true })

  await weekTransition.generateSeasonSpoiledLeaderboardForGameweek(gameweek);
  console.log(`Completed adding awards to genesis Season Spoiled leaderboard for ${gameweek}`);
  const res = { addedAwardsForGenesisSeasonSpoiled: true };
  await db.createOrUpdateDocument('weekTransition', gameweek, res, true);
  return 0;
}


// trigger for weekTransition/{gameweek} to generate season HOF leaderboard for genesis after score validation has happened
internals.addAwardsToGenesisWeeklySpoiledLeaderboard = async (change, context) => {
  console.log(`START of addAwardsToGenesisWeeklySpoiledLeaderboard in ${context.params.gameweek}`)
  const gameweek = context.params.gameweek;
  const progress = change.after.data();
  if(!progress || !progress.hasVerifiedScores || progress.addedAwardsForGenesisWeeklySpoiled || progress.creatingWeeklySpoiledLeaderboard) {
    console.log(`Either we have not finished the steps required to run this or it has already run for ${gameweek}`)
    return 0;
  }

  if(!progress.hasValidatedGenesisScoresPropagationFor0To1000 || !progress.hasValidatedGenesisScoresPropagationFor1000To2000 || !progress.hasValidatedGenesisScoresPropagationFor2000To3000 || !progress.hasValidatedGenesisScoresPropagationFor3000To4000 || !progress.hasValidatedGenesisScoresPropagationFor4000To5000) {
    console.log('We have not finished validating genesis data yet so we are returning')
    return 0
  }
  if(!progress.hasValidatedGenesisScoresPropagationFor5000To6000 || !progress.hasValidatedGenesisScoresPropagationFor6000To7000 || !progress.hasValidatedGenesisScoresPropagationFor7000To8000 || !progress.hasValidatedGenesisScoresPropagationFor8000To9000 || !progress.hasValidatedGenesisScoresPropagationFor9000To10000) {
    console.log('We have not finished validating genesis data yet so we are returning')
    return 0
  }
  await db.createOrUpdateDocument('weekTransition', gameweek, { creatingWeeklySpoiledLeaderboard: true })

  await weekTransition.generateWeeklySpoiledLeaderboardForGameweek(gameweek);
  console.log(`Completed adding awards to genesis Weekly Spoiled leaderboard for ${gameweek}`);
  const res = { addedAwardsForGenesisWeeklySpoiled: true };
  await db.createOrUpdateDocument('weekTransition', gameweek, res, true);
  return 0;
}


// trigger for weekTransition/{gameweek} to generate season HOF leaderboard for genesis after score validation has happened
internals.addAwardsToCustomTopPaidWeeklyLeagues = async (change, context) => {
  console.log(`START of addAwardsToCustomTopPaidWeeklyLeagues in ${context.params.gameweek}`)
  const gameweek = context.params.gameweek;
  const progress = change.after.data();
  if(!progress || !progress.hasVerifiedScores || progress.addedAwardsForTopPaidWeeklyLeagues) {
    console.log(`Either we have not finished the steps required to run this or it has already run for ${gameweek}`)
    return 0;
  }

  if(!progress.hasVerifiedWeeklyCustomLeagueScores) {
    console.log('The lineups for custom weekly leagues has not been completed yet so we are returning now')
    return 0;
  }

  await weekTransition.runForWeeklyTopPaidLeagues(gameweek);
  console.log(`Completed adding awards to weekly top paid leagues for ${gameweek}`);
  const res = { addedAwardsForTopPaidWeeklyLeagues: true };
  await db.createOrUpdateDocument('weekTransition', gameweek, res, true);
  return 0;
}


// trigger for weekTransition/{gameweek} to generate season HOF leaderboard for genesis after score validation has happened
internals.addAwardsToTopThreePaidWeeklyLeagues = async (change, context) => {
  console.log(`START of addAwardsToTopThreePaidWeeklyLeagues in ${context.params.gameweek}`)
  const gameweek = context.params.gameweek;
  const progress = change.after.data();
  if(!progress || !progress.hasVerifiedScores || progress.addedAwardsForTopThreePaidWeeklyLeagues) {
    console.log(`Either we have not finished the steps required to run this or it has already run for ${gameweek}`)
    return 0;
  }
  if(!progress.hasVerifiedWeeklyCustomLeagueScores) {
    console.log('The lineups for custom weekly leagues has not been completed yet so we are returning now')
    return 0;
  }

  await weekTransition.runForWeeklyTopThreePaidLeagues(gameweek);
  console.log(`Completed adding awards to weekly top three paid leagues for ${gameweek}`);
  const res = { addedAwardsForTopThreePaidWeeklyLeagues: true };
  await db.createOrUpdateDocument('weekTransition', gameweek, res, true);
  return 0;
}


internals.addAwardsToTopFivePaidWeeklyLeagues = async (change, context) => {
  console.log(`START of addAwardsToTopFivePaidWeeklyLeagues in ${context.params.gameweek}`)
  const gameweek = context.params.gameweek;
  const progress = change.after.data();
  if(!progress || !progress.hasVerifiedScores || progress.addedAwardsForTopFivePaidWeeklyLeagues) {
    console.log(`Either we have not finished the steps required to run this or it has already run for ${gameweek}`)
    return 0;
  }
  if(!progress.hasVerifiedWeeklyCustomLeagueScores) {
    console.log('The lineups for custom weekly leagues has not been completed yet so we are returning now')
    return 0;
  }

  await weekTransition.runForWeeklyTopFivePaidLeagues(gameweek);
  console.log(`Completed adding awards to Custom Top 5 Paid Weekly leagues for ${gameweek}`);
  const res = { addedAwardsForTopFivePaidWeeklyLeagues: true };
  await db.createOrUpdateDocument('weekTransition', gameweek, res, true);
  return 0;
}


// trigger for weekTransition/{gameweek} to generate season HOF leaderboard for genesis after score validation has happened
internals.generateWeeklyLeaderboardForCustomSeasonLeagues = async (change, context) => {
  console.log(`START of generateWeeklyLeaderboardForCustomSeasonLeagues in ${context.params.gameweek}`)
  const gameweek = context.params.gameweek;
  const progress = change.after.data();
  if(!progress || !progress.hasVerifiedScores || progress.generatedResultsForCustomSeasonLeagues) {
    console.log(`Either we have not finished the steps required to run this or it has already run for ${gameweek}`)
    return 0;
  }
  if(!progress.hasVerifiedFirstHalfOfCustomSeasonLeagues || !progress.hasVerifiedSecondHalfOfCustomSeasonLeagues) {
    console.log('The lineups for custom weekly leagues has not been completed yet so we are returning now')
    return 0;
  }

  await weekTransition.runForCustomSeasonLeaguesDuringSeason(gameweek);
  console.log(`Completed generating Custom Season league leaderboards for ${gameweek}`);
  const res = { generatedResultsForCustomSeasonLeagues: true };
  await db.createOrUpdateDocument('weekTransition', gameweek, res, true);
  return 0;
}

// Functions from PayoutScript below

// trigger at weekTransition/{gameweek}
internals.payoutWeeklyGenesis = async (change, context) => {
  const gameWeek = context.params.gameweek;
  console.log(`...🪙    START gameWeek:${gameWeek} league:genesis payout`)
  const progress = change.after.data();
  if(!progress || !progress.addedAwardsForGenesisWeeklySpoiled || !progress.addedAwardsForGenesisSeasonSpoiled || !progress.addedAwardsForGenesisWeeklyHof || !progress.addedAwardsForGenesisSeasonHof || !progress.addedAwardsForGenesisWeeklyTop || !progress.addedAwardsForGenesisSeasonAll || progress.paidOutGenesis || progress.genesisPayoutsInProgress) {
    console.log(`Not All of the awards function for genesis league have been completed so we cannot run this function yet to pay out genesis league awards`)
    return 0;
  }
  await db.createOrUpdateDocument('weekTransition', gameWeek, { genesisPayoutsInProgress: true }, true)

  const weekAllPrizeWinners = await db.getGenesisPrizeWinners(gameWeek, 'weekAll');
  const weekHofPrizeWinners = await db.getGenesisPrizeWinners(gameWeek, 'weekHof')
  const weekSpoiledPrizeWinners = await db.getGenesisPrizeWinners(gameWeek, 'weekSpoiled');
  const allGenesisPrizeWinners = [...weekAllPrizeWinners, ...weekHofPrizeWinners, ...weekSpoiledPrizeWinners]; 

  for(let i = 0; i < allGenesisPrizeWinners.length; i++){
    const winner = allGenesisPrizeWinners[i];
    const cardId = winner.CardId;
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

  const res = { paidOutGenesis: true }
  await db.createOrUpdateDocument('weekTransition', gameWeek, res, true);
  console.log(`...🪙    END gameWeek:${gameWeek} league:genesis payout`)
}

// Helper function to payout weekly leagues to isolate functionality in different functions
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

// trigger at weekTransition/{gameweek}
internals.payoutWeeklyLeagues = async (change, context) => {
  const gameWeek = context.params.gameweek;
  console.log(`...🐒   START gameWeek:${gameWeek} leagues payout`);
  const progress = change.after.data();
  if(!progress || !progress.addedAwardsForTopPaidWeeklyLeagues || !progress.addedAwardsForTopThreePaidWeeklyLeagues || !progress.addedAwardsForTopFivePaidWeeklyLeagues || progress.paidOutWeeklyCustomLeagues || progress.weeklyPayoutsInProgress) {
    console.log('We have either not completed all of the awards scripts for weekly leagues or have already paid out weekly leagues');
    return 0;
  }
  await db.createOrUpdateDocument('weekTransition', gameWeek, { weeklyPayoutsInProgress: true }, true)
  
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
  const res = { paidOutWeeklyCustomLeagues: true }
  await db.createOrUpdateDocument('weekTransition', gameWeek, res, true)
  console.log(`...🐒   END gameWeek:${gameWeek} leagues payout`);
}

// trigger on owners/:id 
internals.OnBlueCheckVerification = async (change, context) => {
  const ownerId = context.params.ownerId;
  const before = change.before.data();
  const after = change.after.data();
  if(after.isBlueCheckVerified == undefined) {
    console.log('isBlueCheckVerified is not defined so we are returning')
    return 0;
  }
  if(before.isBlueCheckVerified == true && after.isBlueCheckVerified == true) {
    console.log('THis owner was already blue check verified or they still are not verified so we are returning')
    return 0;
  }
  const ownerTxs = await db.readAllDocumentIds(`owner/${ownerId}/transactions`)
  if(!ownerTxs) {
    console.log('OWNER TRANSACTIONS RETURNED undefined')
  }
  for(let i = 0; i < ownerTxs.length; i++) {
    const txId = ownerTxs[i];
    const tx = await db.readDocument(`owners/${ownerId}/transactions`, txId)
    if(tx.type != 'withdrawal') {
      continue;
    }
    if(tx.isBlueCheckVerified) {
      console.log(`This transaction is already marked as verified: ${tx.id}`)
      continue;
    }
    tx.isBlueCheckVerified = true;
    await db.createOrUpdateDocument('withdrawalRequests', tx.id, tx, false)
    await db.createOrUpdateDocument(`owners/${ownerId}/transactions`, tx.id, tx, false)
    console.log(`Updated ${tx.id} in owner transactions and withdrawal requests collection to reflect the owner being verified`)
  }
  return 0;
}

// trigger on owners/:id 
internals.OnW9Upload = async (change, context) => {
  const ownerId = context.params.ownerId;
  const before = change.before.data();
  const after = change.after.data();
  if(after.hasW9 == undefined) {
    console.log('hasW9 is not defined so we are returning')
    return 0;
  }
  if(before.hasW9 == true && after.hasW9 == true) {
    console.log('THis owner has already uploaded a W9 in the past so we are returning')
    return 0;
  }
  const ownerTxs = await db.readAllDocumentIds(`owner/${ownerId}/transactions`)
  if(!ownerTxs) {
    console.log('OWNER TRANSACTIONS RETURNED undefined')
  }
  for(let i = 0; i < ownerTxs.length; i++) {
    const txId = ownerTxs[i];
    const tx = await db.readDocument(`owners/${ownerId}/transactions`, txId)
    if(tx.type != 'withdrawal') {
      continue;
    }
    if(tx.hasW9) {
      console.log(`This transaction is already marked as having W9: ${tx.id}`)
      continue;
    }
    await db.createOrUpdateDocument('withdrawalRequests', tx.id, { hasW9: true }, false)
    await db.createOrUpdateDocument(`owners/${ownerId}/transactions`, tx.id, { hasW9: true }, false)
    console.log(`Updated ${tx.id} in owner transactions and withdrawal requests collection to reflect the owner having uploaded a W9`)
  }
  return 0;
}

// Trigger on leagues/{leagueId}/cards/{cardId}/lineups/{gameweek}
internals.onGenesisLineupChange = async (change, context) => {
  const before = change.before.data();
  const after = change.after.data();
  const gameweek = context.params.gameweek;
  const cardId = context.params.cardId;

  const level = after._level;
  let onLeaderboard = false;
  if (level.toLowerCase() == 'pro') {
    let card = await db.readDocument(`leagues/2022-Pro-Round-1/cards`, cardId);
    if(card) {
      onLeaderboard = true;
    }
  }
  if (level.toLowerCase() == 'spoiled pro' || level.toLowerCase() == 'spoiled hall of fame') {
    let card = await db.readDocument(`leagues/2022-Spoiled-Round-1/cards`, cardId);
    if(card) {
      onLeaderboard = true;
    }
  }
  if (level.toLowerCase() == 'hall of fame' || level.toLowerCase() == 'spoiled hall of fame') {
    let card = await db.readDocument(`leagues/2022-HOF-Round-1/cards`, cardId);
    if(card) {
      onLeaderboard = true;
    }
  }
  if(!onLeaderboard) {
    console.log('The card Id associated with this lineup is not in round 1 of the championship round')
    return 0;
  }

  // update lineup for card in championship league
  if (level.toLowerCase() == 'pro') {
    await db.createOrUpdateDocument(`leagues/2022-Pro-Round-1/cards`, cardId, after, false);
    console.log(`updated lineup for card ${cardId} in Pro championship league`)
  }
  if (level.toLowerCase() == 'spoiled pro' || level.toLowerCase() == 'spoiled hall of fame') {
    await db.createOrUpdateDocument(`leagues/2022-Spoiled-Round-1/cards`, cardId, after, false);
    console.log(`updated lineup for card ${cardId} in Spoiled championship league`)
  }
  if (level.toLowerCase() == 'hall of fame' || level.toLowerCase() == 'spoiled hall of fame') {
    await db.createOrUpdateDocument(`leagues/2022-HOF-Round-1/cards`, cardId, after, false);
    console.log(`updated lineup for card ${cardId} in HOF championship league`)
  }
  return 0
}


internals.onPFPChange = async (change, context) => {
  const before = change.before.data();
  const after = change.after.data();
  const ownerId = context.params.ownerId
  const gameweek = sbs.getNFLWeekV2()
  const split = gameweek.split('-');
  let prevWeek;
  if ((Number(split[1]) - 1) > 9) {
    prevWeek = `2023REG-${(Number(split[1]) - 1)}`
  } else {
    prevWeek = `2023REG-0${(Number(split[1]) - 1)}`
  }
 
  
  if (before.PFP.DisplayName == after.PFP.DisplayName && before.PFP.ImageUrl == after.PFP.ImageUrl) {
    console.log(`PFP was not changed for ${ownerId} so we are just returning`)
    return
  }

  const newPFP = after.PFP;
  console.log("NEW PFP: ", newPFP)

  const genesisCardIds = await db.readAllDocumentIds(`owners/${ownerId}/cards`)
  for (let i = 0; i < genesisCardIds.length; i++) {
    const cardId = genesisCardIds[i];
    const leaderboardObj = await db.readDocument(`genesisLeaderboard/${gameweek}/cards`, cardId)
    leaderboardObj.PFP = newPFP;

    console.log('leaaderboardOBJ: ', leaderboardObj)
    await db.createOrUpdateDocument(`genesisLeaderboard/${gameweek}/cards`, cardId, leaderboardObj, false)
    console.log(`Updated pfp for Genesis Card ${cardId} in genesisLeaderboard`)
  }

  const draftTokenIds = await db.readAllDocumentIds(`owners/${ownerId}/usedDraftTokens`)
  for(let i = 0; i < draftTokenIds.length; i++) {
    const cardId = draftTokenIds[i];
    const draftCard = await db.readDocument('draftTokens', cardId)
    if (draftCard.LeagueId == "") {
      console.log(`this draft token ${cardId} for owner: ${ownerId} has an empty league id`)
      continue;
    }
    const cardScoreObj = await db.readDocument(`drafts/${draftCard.LeagueId}/scores/${gameweek}/cards`, cardId);
    if (!cardScoreObj) {
      console.log("This card does not have score object so we do not need to update it here")
      continue;
    }
    

    await db.createOrUpdateDocument(`drafts/${draftCard.LeagueId}/scores/${gameweek}/cards`, cardId, { PFP: newPFP }, true)
    await db.createOrUpdateDocument(`draftTokenLeaderboard/${gameweek}/cards`, cardId, { PFP: newPFP }, true)
    console.log(`Updated PFP data for draft token ${cardId} in league and on leaderboards`)

    const prevCardScoreObj = await db.readDocument(`drafts/${draftCard.LeagueId}/scores/${prevWeek}/cards`, cardId);
    if (!prevCardScoreObj) {
      console.log("This card does not have score object so we do not need to update it here")
      continue;
    }

    await db.createOrUpdateDocument(`drafts/${draftCard.LeagueId}/scores/${prevWeek}/cards`, cardId, { PFP: newPFP }, true)
    await db.createOrUpdateDocument(`draftTokenLeaderboard/${prevWeek}/cards`, cardId, { PFP: newPFP }, true)
  }

  console.log("updated PFP data for all owners genesis cards and used draft tokens")
}



module.exports = internals; 