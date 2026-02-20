//PACKAGES
require("firebase-functions/lib/logger/compat");
const functions = require("firebase-functions");
const cors = require("cors");
const morgan = require('morgan');
const express = require("express");
const app = express();

//SERVICES
const ownership = require('./services/ownership');
const db = require('./services/db');
const sbs = require('./services/sbs');
const stat = require('./services/stat');
const score = require('./services/score');
const scoreTriggers = require('./services/score-triggers');
const triggerService = require('./services/trigger');
const weekTransition = require('./services/weekTransition');
const playoffTriggerService = require('./services/playoffTriggers');
const championshipRoundService = require('./services/championshipRounds');
const lineups = require('./services/lineup');
const playoffScoring = require('./services/playoffScoring');
const draftTriggers = require('./services/draftTokenTriggers');
const sportsDataScore = require('./services/sportsDataScore')


//MIDDLEWARE
const authMiddleware = require('./middleware/authMiddleware');
const { appendFile } = require("fs");

//ROUTES
app.use(cors());
app.use(morgan('dev'));
// app.use(morgan('dev'));
app.get('/', async (req, res) => res.send(`🍌 Base Spoiled Banna Society Endpoint`));
app.use('/admin', require('./routes/admin'));
app.use('/owner', require('./routes/owner'));
app.use('/card', require('./routes/card'));
app.use('/league', require('./routes/league'));
app.use('/leaderboard', require('./routes/leaderboard'));
app.use('/team', require('./routes/team'));
app.use('/token', require('./routes/token'));
app.use('/mintStats', require('./routes/mintStats'));
app.use('/dev', require('./routes/dev'));
app.use('/referral', require('./routes/referral'));
app.use('/supply', require('./routes/supply'));
app.use('/transaction', require('./routes/transaction'));
// only use these after playoff cards are in prod
app.use('/playoffLeague', require('./routes/playoffLeague'));
app.use('/playoffCard', require('./routes/playoffCard'));
app.use('/webhooks', require('./routes/webhooks'))
app.use('/logging', require('./routes/logging'))

//exports.api = functions.https.onRequest(app);
exports.api = functions.runWith({timeoutSeconds: 60, memory: '1GB'}).https.onRequest(app);


//CONSTANT
const gameWeek = sbs.getNFLWeekV2();
const islandGameCron = "0-59/10 16-23 * * 1,3,4"
const islandGameCronOffset = "0-59/8 16-23 * * 1,3,4"
const mainSlateCron = "0-59/10 7-22 * * 0"
const mainSlateCronOffset = "0-59/8 7-22 * * 0"

exports.owner = {
  onPFPUpdate: functions.firestore.document('owners/{ownerId}').onUpdate(async (change, context) => {
    return await triggerService.onPFPChange(change, context);
  })
}


exports.card = {
  onCreate: functions.firestore.document('cards/{cardId}').onCreate(async (snap, context) => {
    return await triggerService.cardOnCreate(snap, context);
  }),
  onOwnerChange: functions.firestore.document('cards/{cardId}').onUpdate(async (change, context) => {
    return await triggerService.onOwnerChange(change, context);
  }),
  onRosterChange: functions.firestore.document('cards/{cardId}').onUpdate(async (change, context) => {
    return await triggerService.onRosterChange(change, context);
  }),
  onFreePeelAddition: functions.firestore.document('cards/{cardId}').onUpdate(async (change, context) => {
    return await triggerService.onFreePeelAddition(change, context);
  }),
  onPrizeChanges: functions.firestore.document('cards/{cardId}').onUpdate(async (change, context) => {
    return await triggerService.onPrizeChanges(change, context);
  }),
  onLevelChange: functions.firestore.document('cards/{cardId}').onUpdate(async (change, context) => {
    return await triggerService.onLevelChange(change, context)
  })
};

const draftTokenConfig = { timeoutSeconds: 540, memory: "512MB", failurePolicy: true };
const draftTokenFrequency = 'every 6 minutes';

exports.draftTokens = {
  onUpdate: functions.firestore.document('draftTokens/{tokenId}').onUpdate(async (change, context) => {
    return await draftTriggers.UpdateDraftTokenInSubcollectionsOnOwnerChange(change, context)
  }),
  onDraftClose: functions.firestore.document('draftTokenMetadata/{tokenId}').onUpdate(async (change, context) => {
    return await draftTriggers.updateMetadataOnDraftClose(change, context)
  }),
  onScoreChange: functions.firestore.document('scores/{gameweek}').onUpdate(async (change, context) => {
    return await sportsDataScore.ScoreDraftTokens(change, context)
  }),
  onDraftCompletion: functions.firestore.document('draftTokenMetadata/{tokenId}').onUpdate(async (change, context) => {
    return await draftTriggers.onDraftCompletionAndCardCreation(change, context)
  }),
  onScoreCardUpdate: functions.firestore.document('drafts/{draftId}/scores/{gameweek}/cards/{cardId}').onUpdate(async (change, context) => {
    return await draftTriggers.UpdateDraftTokenOnScoreUpdate(change, context)
  }),
  // run from 8-10pm on Mon and Thurs
  updateRankInTokensIsland: functions.runWith(draftTokenConfig).pubsub.schedule(islandGameCron).timeZone("America/Los_Angeles").onRun(async () => {
    return draftTriggers.UpdateRankInCardAndMetadata();
  }),
  // run from 12-8pm pst on Sundays
  updateRankInTokensSunday: functions.runWith(draftTokenConfig).pubsub.schedule(mainSlateCron).timeZone("America/Los_Angeles").onRun(async () => {
    return draftTriggers.UpdateRankInCardAndMetadata();
  }),
  onPrizeChange: functions.firestore.document('draftTokens/{cardId}').onUpdate(async (change, context) => {
    return await draftTriggers.OnPrizeChange(change, context)
  }),
}

exports.playoffCard = {
  onCreate: functions.firestore.document('playoffCards/{cardId}').onCreate(async (snap, context) => {
    return await playoffTriggerService.cardOnCreate(snap, context);
  }),
  onOwnerChange: functions.firestore.document('playoffCards/{cardId}').onUpdate(async (change, context) => {
    return await playoffTriggerService.onOwnerChange(change, context);
  }),
  onRosterChange: functions.firestore.document('playoffCards/{cardId}').onUpdate(async (change, context) => {
    return await playoffTriggerService.onRosterChange(change, context);
  }),
  onFreePeelAddition: functions.firestore.document('playoffCards/{cardId}').onUpdate(async (change, context) => {
    return await playoffTriggerService.onFreePeelAddition(change, context);
  }),
  onPrizeChanges: functions.firestore.document('playoffCards/{cardId}').onUpdate(async (change, context) => {
    return await playoffTriggerService.onPrizeChanges(change, context);
  }),
  onLevelChange: functions.firestore.document('playoffCards/{cardId}').onUpdate(async (change, context) => {
    return await playoffTriggerService.onLevelChange(change, context)
  })
}

exports.referral = {
  onCreate: functions.firestore.document('referrals/{referralCode}').onCreate(async (snap, context) => {
    return await triggerService.referralOnCreate(snap, context);
  }),
  onUpdate: functions.firestore.document('referrals/{referralCode}').onUpdate(async (change, context) => {
    return await triggerService.referralOnUpdate(change, context);
  }),
};

exports.tx = {
  onCreate: functions.firestore.document('transactions/{txHash}').onCreate(async (snap, context) => {
    return await triggerService.txOnCreate(snap, context);
  }),
  onUpdate: functions.firestore.document('transactions/{txHash}').onUpdate(async (change, context) => {
    return await triggerService.txOnUpdate(change, context);
  }),
};

exports.ownerTx = {
  onCreate: functions.runWith({timeoutSeconds: 540, memory: '512MB', failurePolicy: false}).firestore.document('owners/{ownerWalletId}/transactions/{txHash}').onCreate(async (snap, context) => {
    return await triggerService.confirmTransactionOnChain(snap, context);
  }),
};

exports.leagueJoin = {
  onJoin: functions.firestore.document('leagues/{leagueId}/cards/{cardId}').onCreate(async(snap, context) => {
    return await triggerService.onLeagueJoin(snap, context);
  })
}

const gameweekUpdateFunctionConfig = { timeoutSeconds: 100, memory: "512MB", failurePolicy: true }
const gameweekUpdateFunctionFrequency = 'every tuesday 03:00'

exports.gameweekUpdateFunction = functions.runWith(gameweekUpdateFunctionConfig).pubsub.schedule(gameweekUpdateFunctionFrequency).onRun(async () => {
  const gameweekNum = await db.readDocument("gameweekTracker", "gameweekNum")
  gameweekNum.WeekNum++;
  await db.createOrUpdateDocument("gameweekTracker", "gameweekNum", gameweekNum, false)
});

//SCHEDULED JOBS (CRONS)
const cardOwnershipFunctionConfig = { timeoutSeconds: 540, memory: "512MB", failurePolicy: true };
const cardOwnershipFrequency = 'every 8 hours';

exports.cronOwner = {
  cards0to1000: functions.runWith(cardOwnershipFunctionConfig).pubsub.schedule(cardOwnershipFrequency).onRun(async () => {
    return await ownership.update(0, 1000);
  }),
  cards1000to2000: functions.runWith(cardOwnershipFunctionConfig).pubsub.schedule(cardOwnershipFrequency).onRun(async () => {
    return await ownership.update(1000, 2000);
  }),
  cards2000to3000: functions.runWith(cardOwnershipFunctionConfig).pubsub.schedule(cardOwnershipFrequency).onRun(async () => {
    return await ownership.update(2000, 3000);
  }),
  cards3000to4000: functions.runWith(cardOwnershipFunctionConfig).pubsub.schedule(cardOwnershipFrequency).onRun(async () => {
    return await ownership.update(3000, 4000);
  }),
  cards4000to5000: functions.runWith(cardOwnershipFunctionConfig).pubsub.schedule(cardOwnershipFrequency).onRun(async () => {
    return await ownership.update(4000, 5000);
  }),
  cards5000to6000: functions.runWith(cardOwnershipFunctionConfig).pubsub.schedule(cardOwnershipFrequency).onRun(async () => {
    return await ownership.update(5000, 6000);
  }),
  cards6000to7000: functions.runWith(cardOwnershipFunctionConfig).pubsub.schedule(cardOwnershipFrequency).onRun(async () => {
    return await ownership.update(6000, 7000);
  }),
  cards7000to8000: functions.runWith(cardOwnershipFunctionConfig).pubsub.schedule(cardOwnershipFrequency).onRun(async () => {
    return await ownership.update(7000, 8000);
  }),
  cards8000to9000: functions.runWith(cardOwnershipFunctionConfig).pubsub.schedule(cardOwnershipFrequency).onRun(async () => {
    return await ownership.update(8000, 9000);
  }),
  cards9000toEnd: functions.runWith(cardOwnershipFunctionConfig).pubsub.schedule(cardOwnershipFrequency).onRun(async () => {
    return await ownership.update(9000, 'end');
  }),
}

exports.cronSBSTotalSupply = functions.pubsub.schedule('every 1 hours').onRun(async () => {
  return await db.updateSBSTotalSupply();
})

exports.withdrawalTriggers = {
  onBlueCheckVerification: functions.firestore.document('owners/{ownerId}').onUpdate( async (change, context) => {
    return await triggerService.OnBlueCheckVerification(change, context)
  }),
  onW9Submission: functions.firestore.document('owners/{ownerId}').onUpdate( async (change, context) => {
    return await triggerService.OnW9Upload(change, context)
  })
}

//TODO: WIP lineup cron.  Need to provision enough of these to handle this in under 540 secons
// const lineup = require('./services/lineup');
// //LINEUP CRONS
// exports.setDefaultLinupCrons = 
//   functions.runWith({timeoutSeconds: 540, memory: "1GB", failurePolicy: true})
//   .pubsub.schedule('0 01 * * 2') //At 1:00am on Tuesday
//   .timeZone('America/New_York')
//   .onRun(async () => {
//     return await lineup.setDefaultLineup(gameWeek, 0, 10_000);
// });

const scoreUpdatesFunctionConfig = { timeoutSeconds: 540, memory: "512MB", failurePolicy: false };
exports.scoreTriggers = {
  findScoringChanges: functions.runWith(scoreUpdatesFunctionConfig).firestore.document('scores/{gameweek}').onUpdate(async (change, context) => {
    return await scoreTriggers.onScoreUpdate(change, context);
  }),
  genesisScore0To200: functions.runWith(scoreUpdatesFunctionConfig).firestore.document('scoringChangeStaging/{gameweek}').onUpdate(async (change, context) => {
    return await scoreTriggers.scoreLineupsInGenesis(change, context, 0, 200)
  }),
  genesisScore200To400: functions.runWith(scoreUpdatesFunctionConfig).firestore.document('scoringChangeStaging/{gameweek}').onUpdate(async (change, context) => {
    return await scoreTriggers.scoreLineupsInGenesis(change, context, 200, 400)
  }),
  genesisScore400To600: functions.runWith(scoreUpdatesFunctionConfig).firestore.document('scoringChangeStaging/{gameweek}').onUpdate(async (change, context) => {
    return await scoreTriggers.scoreLineupsInGenesis(change, context, 400, 600)
  }),
  genesisScore600To800: functions.runWith(scoreUpdatesFunctionConfig).firestore.document('scoringChangeStaging/{gameweek}').onUpdate(async (change, context) => {
    return await scoreTriggers.scoreLineupsInGenesis(change, context, 600, 800)
  }),
  genesisScore800To1000: functions.runWith(scoreUpdatesFunctionConfig).firestore.document('scoringChangeStaging/{gameweek}').onUpdate(async (change, context) => {
    return await scoreTriggers.scoreLineupsInGenesis(change, context, 800, 1000)
  }),
  genesisScore1000To1200: functions.runWith(scoreUpdatesFunctionConfig).firestore.document('scoringChangeStaging/{gameweek}').onUpdate(async (change, context) => {
    return await scoreTriggers.scoreLineupsInGenesis(change, context, 1000, 1200)
  }),
  genesisScore1200To1400: functions.runWith(scoreUpdatesFunctionConfig).firestore.document('scoringChangeStaging/{gameweek}').onUpdate(async (change, context) => {
    return await scoreTriggers.scoreLineupsInGenesis(change, context, 1200, 1400)
  }),
  genesisScore1400To1600: functions.runWith(scoreUpdatesFunctionConfig).firestore.document('scoringChangeStaging/{gameweek}').onUpdate(async (change, context) => {
    return await scoreTriggers.scoreLineupsInGenesis(change, context, 1400, 1600)
  }),
  genesisScore1600To1800: functions.runWith(scoreUpdatesFunctionConfig).firestore.document('scoringChangeStaging/{gameweek}').onUpdate(async (change, context) => {
    return await scoreTriggers.scoreLineupsInGenesis(change, context, 1600, 1800)
  }),
  genesisScore1800To2000: functions.runWith(scoreUpdatesFunctionConfig).firestore.document('scoringChangeStaging/{gameweek}').onUpdate(async (change, context) => {
    return await scoreTriggers.scoreLineupsInGenesis(change, context, 1800, 2000)
  }),
  genesisScore2000To2200: functions.runWith(scoreUpdatesFunctionConfig).firestore.document('scoringChangeStaging/{gameweek}').onUpdate(async (change, context) => {
    return await scoreTriggers.scoreLineupsInGenesis(change, context, 2000, 2200)
  }),
  genesisScore2200To2400: functions.runWith(scoreUpdatesFunctionConfig).firestore.document('scoringChangeStaging/{gameweek}').onUpdate(async (change, context) => {
    return await scoreTriggers.scoreLineupsInGenesis(change, context, 2200, 2400)
  }),
  genesisScore2400To2600: functions.runWith(scoreUpdatesFunctionConfig).firestore.document('scoringChangeStaging/{gameweek}').onUpdate(async (change, context) => {
    return await scoreTriggers.scoreLineupsInGenesis(change, context, 2400, 2600)
  }),
  genesisScore2600To2800: functions.runWith(scoreUpdatesFunctionConfig).firestore.document('scoringChangeStaging/{gameweek}').onUpdate(async (change, context) => {
    return await scoreTriggers.scoreLineupsInGenesis(change, context, 2600, 2800)
  }),
  genesisScore2800To3000: functions.runWith(scoreUpdatesFunctionConfig).firestore.document('scoringChangeStaging/{gameweek}').onUpdate(async (change, context) => {
    return await scoreTriggers.scoreLineupsInGenesis(change, context, 2800, 3000)
  }),
  genesisScore3000To3200: functions.runWith(scoreUpdatesFunctionConfig).firestore.document('scoringChangeStaging/{gameweek}').onUpdate(async (change, context) => {
    return await scoreTriggers.scoreLineupsInGenesis(change, context, 3000, 3200)
  }),
  genesisScore3200To3400: functions.runWith(scoreUpdatesFunctionConfig).firestore.document('scoringChangeStaging/{gameweek}').onUpdate(async (change, context) => {
    return await scoreTriggers.scoreLineupsInGenesis(change, context, 3200, 3400)
  }),
  genesisScore3400To3600: functions.runWith(scoreUpdatesFunctionConfig).firestore.document('scoringChangeStaging/{gameweek}').onUpdate(async (change, context) => {
    return await scoreTriggers.scoreLineupsInGenesis(change, context, 3400, 3600)
  }),
  genesisScore3600To3800: functions.runWith(scoreUpdatesFunctionConfig).firestore.document('scoringChangeStaging/{gameweek}').onUpdate(async (change, context) => {
    return await scoreTriggers.scoreLineupsInGenesis(change, context, 3600, 3800)
  }),
  genesisScore3800To4000: functions.runWith(scoreUpdatesFunctionConfig).firestore.document('scoringChangeStaging/{gameweek}').onUpdate(async (change, context) => {
    return await scoreTriggers.scoreLineupsInGenesis(change, context, 3800, 4000)
  }),
  genesisScore4000To4200: functions.runWith(scoreUpdatesFunctionConfig).firestore.document('scoringChangeStaging/{gameweek}').onUpdate(async (change, context) => {
    return await scoreTriggers.scoreLineupsInGenesis(change, context, 4000, 4200)
  }),
  genesisScore4200To4400: functions.runWith(scoreUpdatesFunctionConfig).firestore.document('scoringChangeStaging/{gameweek}').onUpdate(async (change, context) => {
    return await scoreTriggers.scoreLineupsInGenesis(change, context, 4200, 4400)
  }),
  genesisScore4400To4600: functions.runWith(scoreUpdatesFunctionConfig).firestore.document('scoringChangeStaging/{gameweek}').onUpdate(async (change, context) => {
    return await scoreTriggers.scoreLineupsInGenesis(change, context, 4400, 4600)
  }),
  genesisScore4600To4800: functions.runWith(scoreUpdatesFunctionConfig).firestore.document('scoringChangeStaging/{gameweek}').onUpdate(async (change, context) => {
    return await scoreTriggers.scoreLineupsInGenesis(change, context, 4600, 4800)
  }),
  genesisScore4800To5000: functions.runWith(scoreUpdatesFunctionConfig).firestore.document('scoringChangeStaging/{gameweek}').onUpdate(async (change, context) => {
    return await scoreTriggers.scoreLineupsInGenesis(change, context, 4800, 5000)
  }),
  genesisScore5000To5200: functions.runWith(scoreUpdatesFunctionConfig).firestore.document('scoringChangeStaging/{gameweek}').onUpdate(async (change, context) => {
    return await scoreTriggers.scoreLineupsInGenesis(change, context, 5000, 5200)
  }),
  genesisScore5200To5400: functions.runWith(scoreUpdatesFunctionConfig).firestore.document('scoringChangeStaging/{gameweek}').onUpdate(async (change, context) => {
    return await scoreTriggers.scoreLineupsInGenesis(change, context, 5200, 5400)
  }),
  genesisScore5400To5600: functions.runWith(scoreUpdatesFunctionConfig).firestore.document('scoringChangeStaging/{gameweek}').onUpdate(async (change, context) => {
    return await scoreTriggers.scoreLineupsInGenesis(change, context, 5400, 5600)
  }),
  genesisScore5600To5800: functions.runWith(scoreUpdatesFunctionConfig).firestore.document('scoringChangeStaging/{gameweek}').onUpdate(async (change, context) => {
    return await scoreTriggers.scoreLineupsInGenesis(change, context, 5600, 5800)
  }),
  genesisScore5800To6000: functions.runWith(scoreUpdatesFunctionConfig).firestore.document('scoringChangeStaging/{gameweek}').onUpdate(async (change, context) => {
    return await scoreTriggers.scoreLineupsInGenesis(change, context, 5800, 6000)
  }),
  genesisScore6000To6200: functions.runWith(scoreUpdatesFunctionConfig).firestore.document('scoringChangeStaging/{gameweek}').onUpdate(async (change, context) => {
    return await scoreTriggers.scoreLineupsInGenesis(change, context, 6000, 6200)
  }),
  genesisScore6200To6400: functions.runWith(scoreUpdatesFunctionConfig).firestore.document('scoringChangeStaging/{gameweek}').onUpdate(async (change, context) => {
    return await scoreTriggers.scoreLineupsInGenesis(change, context, 6200, 6400)
  }),
  genesisScore6400To6600: functions.runWith(scoreUpdatesFunctionConfig).firestore.document('scoringChangeStaging/{gameweek}').onUpdate(async (change, context) => {
    return await scoreTriggers.scoreLineupsInGenesis(change, context, 6400, 6600)
  }),
  genesisScore6600To6800: functions.runWith(scoreUpdatesFunctionConfig).firestore.document('scoringChangeStaging/{gameweek}').onUpdate(async (change, context) => {
    return await scoreTriggers.scoreLineupsInGenesis(change, context, 6600, 6800)
  }),
  genesisScore6800To7000: functions.runWith(scoreUpdatesFunctionConfig).firestore.document('scoringChangeStaging/{gameweek}').onUpdate(async (change, context) => {
    return await scoreTriggers.scoreLineupsInGenesis(change, context, 6800, 7000)
  }),
  genesisScore7000To7200: functions.runWith(scoreUpdatesFunctionConfig).firestore.document('scoringChangeStaging/{gameweek}').onUpdate(async (change, context) => {
    return await scoreTriggers.scoreLineupsInGenesis(change, context, 7000, 7200)
  }),
  genesisScore7200To7400: functions.runWith(scoreUpdatesFunctionConfig).firestore.document('scoringChangeStaging/{gameweek}').onUpdate(async (change, context) => {
    return await scoreTriggers.scoreLineupsInGenesis(change, context, 7200, 7400)
  }),
  genesisScore7400To7600: functions.runWith(scoreUpdatesFunctionConfig).firestore.document('scoringChangeStaging/{gameweek}').onUpdate(async (change, context) => {
    return await scoreTriggers.scoreLineupsInGenesis(change, context, 7400, 7600)
  }),
  genesisScore7600To7800: functions.runWith(scoreUpdatesFunctionConfig).firestore.document('scoringChangeStaging/{gameweek}').onUpdate(async (change, context) => {
    return await scoreTriggers.scoreLineupsInGenesis(change, context, 7600, 7800)
  }),
  genesisScore7800To8000: functions.runWith(scoreUpdatesFunctionConfig).firestore.document('scoringChangeStaging/{gameweek}').onUpdate(async (change, context) => {
    return await scoreTriggers.scoreLineupsInGenesis(change, context, 7800, 8000)
  }),
  genesisScore8000To8200: functions.runWith(scoreUpdatesFunctionConfig).firestore.document('scoringChangeStaging/{gameweek}').onUpdate(async (change, context) => {
    return await scoreTriggers.scoreLineupsInGenesis(change, context, 8000, 8200)
  }),
  genesisScore8200To8400: functions.runWith(scoreUpdatesFunctionConfig).firestore.document('scoringChangeStaging/{gameweek}').onUpdate(async (change, context) => {
    return await scoreTriggers.scoreLineupsInGenesis(change, context, 8200, 8400)
  }),
  genesisScore8400To8600: functions.runWith(scoreUpdatesFunctionConfig).firestore.document('scoringChangeStaging/{gameweek}').onUpdate(async (change, context) => {
    return await scoreTriggers.scoreLineupsInGenesis(change, context, 8400, 8600)
  }),
  genesisScore8600To8800: functions.runWith(scoreUpdatesFunctionConfig).firestore.document('scoringChangeStaging/{gameweek}').onUpdate(async (change, context) => {
    return await scoreTriggers.scoreLineupsInGenesis(change, context, 8600, 8800)
  }),
  genesisScore8800To9000: functions.runWith(scoreUpdatesFunctionConfig).firestore.document('scoringChangeStaging/{gameweek}').onUpdate(async (change, context) => {
    return await scoreTriggers.scoreLineupsInGenesis(change, context, 8800, 9000)
  }),
  genesisScore9000To9200: functions.runWith(scoreUpdatesFunctionConfig).firestore.document('scoringChangeStaging/{gameweek}').onUpdate(async (change, context) => {
    return await scoreTriggers.scoreLineupsInGenesis(change, context, 9000, 9200)
  }),
  genesisScore9200To9400: functions.runWith(scoreUpdatesFunctionConfig).firestore.document('scoringChangeStaging/{gameweek}').onUpdate(async (change, context) => {
    return await scoreTriggers.scoreLineupsInGenesis(change, context, 9200, 9400)
  }),
  genesisScore9400To9600: functions.runWith(scoreUpdatesFunctionConfig).firestore.document('scoringChangeStaging/{gameweek}').onUpdate(async (change, context) => {
    return await scoreTriggers.scoreLineupsInGenesis(change, context, 9400, 9600)
  }),
  genesisScore9600To9800: functions.runWith(scoreUpdatesFunctionConfig).firestore.document('scoringChangeStaging/{gameweek}').onUpdate(async (change, context) => {
    return await scoreTriggers.scoreLineupsInGenesis(change, context, 9600, 9800)
  }),
  genesisScore9800To10000: functions.runWith(scoreUpdatesFunctionConfig).firestore.document('scoringChangeStaging/{gameweek}').onUpdate(async (change, context) => {
    return await scoreTriggers.scoreLineupsInGenesis(change, context, 9800, 10000)
  }),
  // scoreCustomSeasonPart1: functions.runWith(scoreUpdatesFunctionConfig).firestore.document('scoringChangeStaging/{gameweek}').onUpdate(async (change, context) => {
  //   return await scoreTriggers.scoreSeasonLeaguesPart1(change, context);
  // }),
  // scoreCustomSeasonPart2: functions.runWith(scoreUpdatesFunctionConfig).firestore.document('scoringChangeStaging/{gameweek}').onUpdate(async (change, context) => {
  //   return await scoreTriggers.scoreSeasonLeaguesPart2(change, context);
  // }),
  // scoreCustomSeasonPartThree: functions.runWith(scoreUpdatesFunctionConfig).firestore.document('scoringChangeStaging/{gameweek}').onUpdate(async (change, context) => {
  //   return await scoreTriggers.scoreSeasonLeaguesPart3(change, context);
  // }),
  // scoreCustomWeekly: functions.runWith(scoreUpdatesFunctionConfig).firestore.document('scoringChangeStaging/{gameweek}').onUpdate(async (change, context) => {
  //   return await scoreTriggers.scoreWeeklyLeagues(change, context)
  // }),
  updateTeamStartingArray: functions.runWith(scoreUpdatesFunctionConfig).firestore.document('leagues/{leagueId}/cards/{cardId}/lineups/{gameweek}').onUpdate(async (change, context) => {
    return await scoreTriggers.onLineupChange(change, context)
  }),
  scoreChampionshipRounds: functions.runWith(scoreUpdatesFunctionConfig).firestore.document('scoringChangeStaging/{gameweek}').onUpdate(async (change, context) => {
    return await championshipRoundService.scoreLineupsChampionshipRounds(change, context)
  }),
  updateLineupsInChampionships: functions.runWith(scoreUpdatesFunctionConfig).firestore.document('leagues/genesis/cards/{cardId}/lineups/{gameweek}').onUpdate(async (change, context) => {
    return await championshipRoundService.updateLineupsInChampionships(change, context)
  }),
}

exports.playoffScoringTriggers = {
  playoffScore0To1000: functions.runWith(scoreUpdatesFunctionConfig).firestore.document('scoringChangeStaging/{gameweek}').onUpdate(async (change, context) => {
    return await playoffScoring.scoreLineupsInGenesisPlayoffLeagueInParts(change, context, 0, 1000)
  }),
  playoffScore1000To2000: functions.runWith(scoreUpdatesFunctionConfig).firestore.document('scoringChangeStaging/{gameweek}').onUpdate(async (change, context) => {
    return await playoffScoring.scoreLineupsInGenesisPlayoffLeagueInParts(change, context, 1000, 2000)
  }),
  playoffScore2000To3000: functions.runWith(scoreUpdatesFunctionConfig).firestore.document('scoringChangeStaging/{gameweek}').onUpdate(async (change, context) => {
    return await playoffScoring.scoreLineupsInGenesisPlayoffLeagueInParts(change, context, 2000, 3000)
  }),
  playoffScore3000To4000: functions.runWith(scoreUpdatesFunctionConfig).firestore.document('scoringChangeStaging/{gameweek}').onUpdate(async (change, context) => {
    return await playoffScoring.scoreLineupsInGenesisPlayoffLeagueInParts(change, context, 3000, 4000)
  }),
  playoffScore4000To5000: functions.runWith(scoreUpdatesFunctionConfig).firestore.document('scoringChangeStaging/{gameweek}').onUpdate(async (change, context) => {
    return await playoffScoring.scoreLineupsInGenesisPlayoffLeagueInParts(change, context, 4000, 5000)
  }),
  playoffScore5000To6000: functions.runWith(scoreUpdatesFunctionConfig).firestore.document('scoringChangeStaging/{gameweek}').onUpdate(async (change, context) => {
    return await playoffScoring.scoreLineupsInGenesisPlayoffLeagueInParts(change, context, 5000, 6000)
  }),
  playoffScore6000To7000: functions.runWith(scoreUpdatesFunctionConfig).firestore.document('scoringChangeStaging/{gameweek}').onUpdate(async (change, context) => {
    return await playoffScoring.scoreLineupsInGenesisPlayoffLeagueInParts(change, context, 6000, 7000)
  }),
  playoffScore7000To8000: functions.runWith(scoreUpdatesFunctionConfig).firestore.document('scoringChangeStaging/{gameweek}').onUpdate(async (change, context) => {
    return await playoffScoring.scoreLineupsInGenesisPlayoffLeagueInParts(change, context, 7000, 8000)
  }),
  playoffScore8000To9000: functions.runWith(scoreUpdatesFunctionConfig).firestore.document('scoringChangeStaging/{gameweek}').onUpdate(async (change, context) => {
    return await playoffScoring.scoreLineupsInGenesisPlayoffLeagueInParts(change, context, 8000, 9000)
  }),
  playoffScore9000To10000: functions.runWith(scoreUpdatesFunctionConfig).firestore.document('scoringChangeStaging/{gameweek}').onUpdate(async (change, context) => {
    return await playoffScoring.scoreLineupsInGenesisPlayoffLeagueInParts(change, context, 9000, 10000)
  }),
  playoffScore10000To11000: functions.runWith(scoreUpdatesFunctionConfig).firestore.document('scoringChangeStaging/{gameweek}').onUpdate(async (change, context) => {
    return await playoffScoring.scoreLineupsInGenesisPlayoffLeagueInParts(change, context, 10000, 11000)
  }),
  playoffScore11000To12000: functions.runWith(scoreUpdatesFunctionConfig).firestore.document('scoringChangeStaging/{gameweek}').onUpdate(async (change, context) => {
    return await playoffScoring.scoreLineupsInGenesisPlayoffLeagueInParts(change, context, 11000, 12000)
  }),
  playoffScore12000To12500: functions.runWith(scoreUpdatesFunctionConfig).firestore.document('scoringChangeStaging/{gameweek}').onUpdate(async (change, context) => {
    return await playoffScoring.scoreLineupsInGenesisPlayoffLeagueInParts(change, context, 12000, 12500)
  }),
}

const refundFrequency = '0 18 * * 4';
const refundsConfig = { timeoutSeconds: 540, memory: "512MB", failurePolicy: false };
exports.refundEmptyLeagues = functions.runWith(refundsConfig).pubsub.schedule(refundFrequency).onRun(async () => {
  return await refunds.refundEmptyLeagues();
})

const withdrawalTriggerConfig = { timeoutSeconds: 540, memory: "512MB", failurePolicy: false };
exports.withdrawalTriggers = {
  onW9Upload: functions.runWith(withdrawalTriggerConfig).firestore.document('owners/{ownerId}').onUpdate( async (change, context) => {
    return await triggerService.OnW9Upload(change, context)
  }),
  onBlueCheckVerification: functions.runWith(withdrawalTriggerConfig).firestore.document('owners/{ownerId}').onUpdate( async (change, context) => {
    return await triggerService.OnBlueCheckVerification(change, context)
  }),
}


const weekTransitionConfig = { timeoutSeconds: 540, memory: "512MB", failurePolicy: false };
const addTopAwardsConfig = { timeoutSeconds: 540, memory: "512MB", failurePolicy: true }
// week Transition triggers
exports.weekTransition = {
  checkForAllGamesClosed: functions.runWith(weekTransitionConfig).firestore.document('scores/{gameweek}').onUpdate(async (change, context) => {
    return await triggerService.checkForAllGamesClosed(change, context);
  }),
  validateGenesisWeekAndSeasonScore0To1000: functions.runWith(weekTransitionConfig).firestore.document('weekTransition/{gameweek}').onUpdate(async (change, context) => {
    return await triggerService.validateGenesisWeekAndSeasonScoreInParts(change, context, 0, 1000)
  }),
  validateGenesisWeekAndSeasonScore1000To2000: functions.runWith(weekTransitionConfig).firestore.document('weekTransition/{gameweek}').onUpdate(async (change, context) => {
    return await triggerService.validateGenesisWeekAndSeasonScoreInParts(change, context, 1000, 2000)
  }),
  validateGenesisWeekAndSeasonScore2000To3000: functions.runWith(weekTransitionConfig).firestore.document('weekTransition/{gameweek}').onUpdate(async (change, context) => {
    return await triggerService.validateGenesisWeekAndSeasonScoreInParts(change, context, 2000, 3000)
  }),
  validateGenesisWeekAndSeasonScore3000To4000: functions.runWith(weekTransitionConfig).firestore.document('weekTransition/{gameweek}').onUpdate(async (change, context) => {
    return await triggerService.validateGenesisWeekAndSeasonScoreInParts(change, context, 3000, 4000)
  }),
  validateGenesisWeekAndSeasonScore4000To5000: functions.runWith(weekTransitionConfig).firestore.document('weekTransition/{gameweek}').onUpdate(async (change, context) => {
    return await triggerService.validateGenesisWeekAndSeasonScoreInParts(change, context, 4000, 5000)
  }),
  validateGenesisWeekAndSeasonScore5000To6000: functions.runWith(weekTransitionConfig).firestore.document('weekTransition/{gameweek}').onUpdate(async (change, context) => {
    return await triggerService.validateGenesisWeekAndSeasonScoreInParts(change, context, 5000, 6000)
  }),
  validateGenesisWeekAndSeasonScore6000To7000: functions.runWith(weekTransitionConfig).firestore.document('weekTransition/{gameweek}').onUpdate(async (change, context) => {
    return await triggerService.validateGenesisWeekAndSeasonScoreInParts(change, context, 6000, 7000)
  }),
  validateGenesisWeekAndSeasonScore7000To8000: functions.runWith(weekTransitionConfig).firestore.document('weekTransition/{gameweek}').onUpdate(async (change, context) => {
    return await triggerService.validateGenesisWeekAndSeasonScoreInParts(change, context, 7000, 8000)
  }),
  validateGenesisWeekAndSeasonScore8000To9000: functions.runWith(weekTransitionConfig).firestore.document('weekTransition/{gameweek}').onUpdate(async (change, context) => {
    return await triggerService.validateGenesisWeekAndSeasonScoreInParts(change, context, 8000, 9000)
  }),
  validateGenesisWeekAndSeasonScore9000To10000: functions.runWith(weekTransitionConfig).firestore.document('weekTransition/{gameweek}').onUpdate(async (change, context) => {
    return await triggerService.validateGenesisWeekAndSeasonScoreInParts(change, context, 9000, 10000)
  }),
  validateGenesisDataPropagation0To1000: functions.runWith(weekTransitionConfig).firestore.document('weekTransition/{gameweek}').onUpdate(async (change, context) => {
    return await triggerService.validateGenesisDataPropagationInParts(change, context, 0, 1000)
  }),
  validateGenesisDataPropagation1000To2000: functions.runWith(weekTransitionConfig).firestore.document('weekTransition/{gameweek}').onUpdate(async (change, context) => {
    return await triggerService.validateGenesisDataPropagationInParts(change, context, 1000, 2000)
  }),
  validateGenesisDataPropagation2000To3000: functions.runWith(weekTransitionConfig).firestore.document('weekTransition/{gameweek}').onUpdate(async (change, context) => {
    return await triggerService.validateGenesisDataPropagationInParts(change, context, 2000, 3000)
  }),
  validateGenesisDataPropagation3000To4000: functions.runWith(weekTransitionConfig).firestore.document('weekTransition/{gameweek}').onUpdate(async (change, context) => {
    return await triggerService.validateGenesisDataPropagationInParts(change, context, 3000, 4000)
  }),
  validateGenesisDataPropagation4000To5000: functions.runWith(weekTransitionConfig).firestore.document('weekTransition/{gameweek}').onUpdate(async (change, context) => {
    return await triggerService.validateGenesisDataPropagationInParts(change, context, 4000, 5000)
  }),
  validateGenesisDataPropagation5000To6000: functions.runWith(weekTransitionConfig).firestore.document('weekTransition/{gameweek}').onUpdate(async (change, context) => {
    return await triggerService.validateGenesisDataPropagationInParts(change, context, 5000, 6000)
  }),
  validateGenesisDataPropagation6000To7000: functions.runWith(weekTransitionConfig).firestore.document('weekTransition/{gameweek}').onUpdate(async (change, context) => {
    return await triggerService.validateGenesisDataPropagationInParts(change, context, 6000, 7000)
  }),
  validateGenesisDataPropagation7000To8000: functions.runWith(weekTransitionConfig).firestore.document('weekTransition/{gameweek}').onUpdate(async (change, context) => {
    return await triggerService.validateGenesisDataPropagationInParts(change, context, 7000, 8000)
  }),
  validateGenesisDataPropagation8000To9000: functions.runWith(weekTransitionConfig).firestore.document('weekTransition/{gameweek}').onUpdate(async (change, context) => {
    return await triggerService.validateGenesisDataPropagationInParts(change, context, 8000, 9000)
  }),
  validateGenesisDataPropagation9000To10000: functions.runWith(weekTransitionConfig).firestore.document('weekTransition/{gameweek}').onUpdate(async (change, context) => {
    return await triggerService.validateGenesisDataPropagationInParts(change, context, 9000, 10000)
  }),
  verifyLineupsForWeeklyCustomLeagues: functions.runWith(weekTransitionConfig).firestore.document('weekTransition/{gameweek}').onUpdate(async (change, context) => {
    return await triggerService.verifyLineupsForWeeklyCustomLeagues(change, context)
  }),
  verifyLineupScoresForFirstHalfOfSeasonLeagues: functions.runWith(weekTransitionConfig).firestore.document('weekTransition/{gameweek}').onUpdate(async (change, context) => {
    return await triggerService.verifyLineupScoresForFirstHalfOfSeasonLeagues(change, context)
  }),
  verifyLineupScoresForSecondHalfOfSeasonLeagues: functions.runWith(weekTransitionConfig).firestore.document('weekTransition/{gameweek}').onUpdate(async (change, context) => {
    return await triggerService.verifyLineupScoresForSecondHalfOfSeasonLeagues(change, context)
  }),
  addAwardsToGenesisSeasonLeaderboard: functions.runWith(weekTransitionConfig).firestore.document('weekTransition/{gameweek}').onUpdate(async (change, context) => {
    return await triggerService.addAwardsToGenesisSeasonLeaderboard(change, context)
  }),
  addAwardsToGenesisWeeklyTopLeaderboard: functions.runWith(weekTransitionConfig).firestore.document('weekTransition/{gameweek}').onUpdate(async (change, context) => {
    return await triggerService.addAwardsToGenesisWeeklyTopLeaderboard(change, context)
  }),
  addAwardsToGenesisSeasonHOFLeaderboard: functions.runWith(weekTransitionConfig).firestore.document('weekTransition/{gameweek}').onUpdate(async (change, context) => {
    return await triggerService.addAwardsToGenesisSeasonHOFLeaderboard(change, context)
  }),
  addAwardsToGenesisWeeklyHOFLeaderboard: functions.runWith(weekTransitionConfig).firestore.document('weekTransition/{gameweek}').onUpdate(async (change, context) => {
    return await triggerService.addAwardsToGenesisWeeklyHOFLeaderboard(change, context)
  }),
  addAwardsToGenesisSeasonSpoiledLeaderboard: functions.runWith(weekTransitionConfig).firestore.document('weekTransition/{gameweek}').onUpdate(async (change, context) => {
    return await triggerService.addAwardsToGenesisSeasonSpoiledLeaderboard(change, context)
  }),
  addAwardsToGenesisWeeklySpoiledLeaderboard: functions.runWith(weekTransitionConfig).firestore.document('weekTransition/{gameweek}').onUpdate(async (change, context) => {
    return await triggerService.addAwardsToGenesisWeeklySpoiledLeaderboard(change, context)
  }),
  addAwardsToCustomTopPaidWeeklyLeagues: functions.runWith(weekTransitionConfig).firestore.document('weekTransition/{gameweek}').onUpdate(async (change, context) => {
    return await triggerService.addAwardsToCustomTopPaidWeeklyLeagues(change, context)
  }),
  addAwardsToTopThreePaidWeeklyLeagues: functions.runWith(weekTransitionConfig).firestore.document('weekTransition/{gameweek}').onUpdate(async (change, context) => {
    return await triggerService.addAwardsToTopThreePaidWeeklyLeagues(change, context)
  }),
  addAwardsToTopFivePaidWeeklyLeagues: functions.runWith(weekTransitionConfig).firestore.document('weekTransition/{gameweek}').onUpdate(async (change, context) => {
    return await triggerService.addAwardsToTopFivePaidWeeklyLeagues(change, context)
  }),
  generateWeeklyLeaderboardForCustomSeasonLeagues: functions.runWith(weekTransitionConfig).firestore.document('weekTransition/{gameweek}').onUpdate(async (change, context) => {
    return await triggerService.generateWeeklyLeaderboardForCustomSeasonLeagues(change, context)
  }),
  payoutWeeklyGenesis: functions.runWith(weekTransitionConfig).runWith(weekTransitionConfig).firestore.document('weekTransition/{gameweek}').onUpdate(async (change, context) => {
    return await triggerService.payoutWeeklyGenesis(change, context)
  }),
  payoutWeeklyLeagues: functions.runWith(weekTransitionConfig).firestore.document('weekTransition/{gameweek}').onUpdate(async (change, context) => {
    return await triggerService.payoutWeeklyLeagues(change, context)
  })
}

// Update players array from draft stats
const updatePlayersFrequency = 'every 12 hours';
const updatePlayersConfig = { timeoutSeconds: 300, memory: "512MB", failurePolicy: true }

exports.updatePlayersFromTeam = functions.runWith(updatePlayersConfig).pubsub.schedule(updatePlayersFrequency).onRun(async () => {
  return await stat.analyzeData()
});

// Update ADP for players in drafts
const updateADPFrequency = 'every 1 hours';
const updateADPConfig = { timeoutSeconds: 500, memory: "512MB", failurePolicy: true }

exports.updateADPForPlayers = functions.runWith(updateADPConfig).pubsub.schedule(updateADPFrequency).onRun(async () => {
  return await stat.updateADPForStats()
});

// Check for missing/transfered tokens
const checkMissingTokenFrequency = 'every 10 minutes';
const checkMissingConfig = { timeoutSeconds: 540, memory: "512MB", failurePolicy: true }

exports.checkForMissingTokens = functions.runWith(checkMissingConfig).pubsub.schedule(checkMissingTokenFrequency).onRun(async () => {
  return await stat.checkForMissingTokens()
});

// Check for missing/transfered tokens
const checkMissingToken2HFrequency = 'every 10 minutes';
const checkMissingConfig2H = { timeoutSeconds: 540, memory: "512MB", failurePolicy: true }

exports.checkForMissingTokens2H = functions.runWith(checkMissingConfig2H).pubsub.schedule(checkMissingToken2HFrequency).onRun(async () => {
  return await stat.checkForMissingTokens2H()
});

// Check for missing/transfered tokens
const checkMissingToken3HFrequency = 'every 10 minutes';
const checkMissingConfig3H = { timeoutSeconds: 540, memory: "512MB", failurePolicy: true }

exports.checkForMissingTokens3H = functions.runWith(checkMissingConfig3H).pubsub.schedule(checkMissingToken3HFrequency).onRun(async () => {
  return await stat.checkForMissingTokens3H()
});

// Check for missing/transfered tokens
const checkMissingToken4HFrequency = 'every 10 minutes';
const checkMissingConfig4H = { timeoutSeconds: 540, memory: "512MB", failurePolicy: true }

exports.checkForMissingTokens4H = functions.runWith(checkMissingConfig4H).pubsub.schedule(checkMissingToken4HFrequency).onRun(async () => {
  return await stat.checkForMissingTokens4H()
});

// Check for missing/transfered tokens
const checkForMissingTokensLastBit = 'every 5 minutes';
const checkMissingConfigLastBit = { timeoutSeconds: 540, memory: "512MB", failurePolicy: true }

exports.checkForMissingTokensLastBit = functions.runWith(checkMissingConfigLastBit).pubsub.schedule(checkForMissingTokensLastBit).onRun(async () => {
  return await stat.checkForMissingTokensLastBit()
});


//SCORING CRONS
const statEngineFrequency = 'every 10 minutes';
const stateEngineFunctionConfig = { timeoutSeconds: 60, memory: "512MB", failurePolicy: true };

exports.statsEngine = functions.runWith(stateEngineFunctionConfig).pubsub.schedule(mainSlateCronOffset).timeZone("America/Los_Angeles").onRun(async () => {
  const gameweek = sbs.getNFLWeekV2()
  return await stat.setScoresFromRollingInsights(gameweek);
})
exports.statsEngineIsland = functions.runWith(stateEngineFunctionConfig).pubsub.schedule(islandGameCronOffset).timeZone("America/Los_Angeles").onRun(async () => {
  const gameweek = sbs.getNFLWeekV2()
  return await stat.setScoresFromRollingInsights(gameweek);
})


const opponentsFrequency = 'every 24 hours';
const opponentsFunctionConfig = { timeoutSeconds: 540, memory: "512MB", failurePolicy: false };
exports.opponentsDataUpdate = functions.runWith(opponentsFunctionConfig).pubsub.schedule(opponentsFrequency).onRun(async () => {
  return await lineups.updateOpponentInfo()
})

const leagueScoreFrequency = 'every 10 minutes';
const leagueScoreFunctionConfig = { timeoutSeconds: 540, memory: "512MB", failurePolicy: true };

exports.leagueScore = functions.runWith(leagueScoreFunctionConfig).pubsub.schedule(leagueScoreFrequency).onRun(async () => {
  return await score.scoreLeagues(gameWeek);
})

const genesisScoreFrequency = 'every 1 minutes';
const genesisScoreFunctionConfig = { timeoutSeconds: 120, memory: "512MB", failurePolicy: true };

//dev (comment this one out when deploying to prod)
// exports.genesisScore0To54 = functions.runWith(genesisScoreFunctionConfig).pubsub.schedule(genesisScoreFrequency).onRun(async () => {
//   return await score.scoreLineupsInGenesis(gameWeek, 0, 54);
// });

// prod (comment this out when deploy to dev)
exports.genesisScore0To100 = functions.runWith(genesisScoreFunctionConfig).pubsub.schedule(genesisScoreFrequency).onRun(async () => {
  return score.scoreLineupsInGenesis(gameWeek, 0, 100);
});
exports.genesisScore100To200 = functions.runWith(genesisScoreFunctionConfig).pubsub.schedule(genesisScoreFrequency).onRun(async () => {
    return score.scoreLineupsInGenesis(gameWeek, 100, 200);
  });
exports.genesisScore200To300 = functions.runWith(genesisScoreFunctionConfig).pubsub.schedule(genesisScoreFrequency).onRun(async () => {
    return score.scoreLineupsInGenesis(gameWeek, 200, 300);
  });
exports.genesisScore300To400 = functions.runWith(genesisScoreFunctionConfig).pubsub.schedule(genesisScoreFrequency).onRun(async () => {
    return score.scoreLineupsInGenesis(gameWeek, 300, 400);
  });
exports.genesisScore400To500 = functions.runWith(genesisScoreFunctionConfig).pubsub.schedule(genesisScoreFrequency).onRun(async () => {
    return score.scoreLineupsInGenesis(gameWeek, 400, 500);
  });
exports.genesisScore500To600 = functions.runWith(genesisScoreFunctionConfig).pubsub.schedule(genesisScoreFrequency).onRun(async () => {
    return score.scoreLineupsInGenesis(gameWeek, 500, 600);
  });
exports.genesisScore600To700 = functions.runWith(genesisScoreFunctionConfig).pubsub.schedule(genesisScoreFrequency).onRun(async () => {
    return score.scoreLineupsInGenesis(gameWeek, 600, 700);
  });
exports.genesisScore700To800 = functions.runWith(genesisScoreFunctionConfig).pubsub.schedule(genesisScoreFrequency).onRun(async () => {
    return score.scoreLineupsInGenesis(gameWeek, 700, 800);
  });
exports.genesisScore800To900 = functions.runWith(genesisScoreFunctionConfig).pubsub.schedule(genesisScoreFrequency).onRun(async () => {
    return score.scoreLineupsInGenesis(gameWeek, 800, 900);
  });
exports.genesisScore900To1000 = functions.runWith(genesisScoreFunctionConfig).pubsub.schedule(genesisScoreFrequency).onRun(async () => {
    return score.scoreLineupsInGenesis(gameWeek, 900, 1000);
  });
exports.genesisScore1000To1100 = functions.runWith(genesisScoreFunctionConfig).pubsub.schedule(genesisScoreFrequency).onRun(async () => {
    return score.scoreLineupsInGenesis(gameWeek, 1000, 1100);
  });
exports.genesisScore1100To1200 = functions.runWith(genesisScoreFunctionConfig).pubsub.schedule(genesisScoreFrequency).onRun(async () => {
    return score.scoreLineupsInGenesis(gameWeek, 1100, 1200);
  });
exports.genesisScore1200To1300 = functions.runWith(genesisScoreFunctionConfig).pubsub.schedule(genesisScoreFrequency).onRun(async () => {
    return score.scoreLineupsInGenesis(gameWeek, 1200, 1300);
  });
exports.genesisScore1300To1400 = functions.runWith(genesisScoreFunctionConfig).pubsub.schedule(genesisScoreFrequency).onRun(async () => {
    return score.scoreLineupsInGenesis(gameWeek, 1300, 1400);
  });
exports.genesisScore1400To1500 = functions.runWith(genesisScoreFunctionConfig).pubsub.schedule(genesisScoreFrequency).onRun(async () => {
    return score.scoreLineupsInGenesis(gameWeek, 1400, 1500);
  });
exports.genesisScore1500To1600 = functions.runWith(genesisScoreFunctionConfig).pubsub.schedule(genesisScoreFrequency).onRun(async () => {
    return score.scoreLineupsInGenesis(gameWeek, 1500, 1600);
  });
exports.genesisScore1600To1700 = functions.runWith(genesisScoreFunctionConfig).pubsub.schedule(genesisScoreFrequency).onRun(async () => {
    return score.scoreLineupsInGenesis(gameWeek, 1600, 1700);
  });
exports.genesisScore1700To1800 = functions.runWith(genesisScoreFunctionConfig).pubsub.schedule(genesisScoreFrequency).onRun(async () => {
    return score.scoreLineupsInGenesis(gameWeek, 1700, 1800);
  });
exports.genesisScore1800To1900 = functions.runWith(genesisScoreFunctionConfig).pubsub.schedule(genesisScoreFrequency).onRun(async () => {
    return score.scoreLineupsInGenesis(gameWeek, 1800, 1900);
  });
exports.genesisScore1900To2000 = functions.runWith(genesisScoreFunctionConfig).pubsub.schedule(genesisScoreFrequency).onRun(async () => {
    return score.scoreLineupsInGenesis(gameWeek, 1900, 2000);
  });
exports.genesisScore2000To2100 = functions.runWith(genesisScoreFunctionConfig).pubsub.schedule(genesisScoreFrequency).onRun(async () => {
    return score.scoreLineupsInGenesis(gameWeek, 2000, 2100);
  });
exports.genesisScore2100To2200 = functions.runWith(genesisScoreFunctionConfig).pubsub.schedule(genesisScoreFrequency).onRun(async () => {
    return score.scoreLineupsInGenesis(gameWeek, 2100, 2200);
  });
exports.genesisScore2200To2300 = functions.runWith(genesisScoreFunctionConfig).pubsub.schedule(genesisScoreFrequency).onRun(async () => {
    return score.scoreLineupsInGenesis(gameWeek, 2200, 2300);
  });
exports.genesisScore2300To2400 = functions.runWith(genesisScoreFunctionConfig).pubsub.schedule(genesisScoreFrequency).onRun(async () => {
    return score.scoreLineupsInGenesis(gameWeek, 2300, 2400);
  });
exports.genesisScore2400To2500 = functions.runWith(genesisScoreFunctionConfig).pubsub.schedule(genesisScoreFrequency).onRun(async () => {
    return score.scoreLineupsInGenesis(gameWeek, 2400, 2500);
  });
exports.genesisScore2500To2600 = functions.runWith(genesisScoreFunctionConfig).pubsub.schedule(genesisScoreFrequency).onRun(async () => {
    return score.scoreLineupsInGenesis(gameWeek, 2500, 2600);
  });
exports.genesisScore2600To2700 = functions.runWith(genesisScoreFunctionConfig).pubsub.schedule(genesisScoreFrequency).onRun(async () => {
    return score.scoreLineupsInGenesis(gameWeek, 2600, 2700);
  });
exports.genesisScore2700To2800 = functions.runWith(genesisScoreFunctionConfig).pubsub.schedule(genesisScoreFrequency).onRun(async () => {
    return score.scoreLineupsInGenesis(gameWeek, 2700, 2800);
  });
exports.genesisScore2800To2900 = functions.runWith(genesisScoreFunctionConfig).pubsub.schedule(genesisScoreFrequency).onRun(async () => {
    return score.scoreLineupsInGenesis(gameWeek, 2800, 2900);
  });
exports.genesisScore2900To3000 = functions.runWith(genesisScoreFunctionConfig).pubsub.schedule(genesisScoreFrequency).onRun(async () => {
    return score.scoreLineupsInGenesis(gameWeek, 2900, 3000);
  });
exports.genesisScore3000To3100 = functions.runWith(genesisScoreFunctionConfig).pubsub.schedule(genesisScoreFrequency).onRun(async () => {
    return score.scoreLineupsInGenesis(gameWeek, 3000, 3100);
  });
exports.genesisScore3100To3200 = functions.runWith(genesisScoreFunctionConfig).pubsub.schedule(genesisScoreFrequency).onRun(async () => {
    return score.scoreLineupsInGenesis(gameWeek, 3100, 3200);
  });
exports.genesisScore3200To3300 = functions.runWith(genesisScoreFunctionConfig).pubsub.schedule(genesisScoreFrequency).onRun(async () => {
    return score.scoreLineupsInGenesis(gameWeek, 3200, 3300);
  });
exports.genesisScore3300To3400 = functions.runWith(genesisScoreFunctionConfig).pubsub.schedule(genesisScoreFrequency).onRun(async () => {
    return score.scoreLineupsInGenesis(gameWeek, 3300, 3400);
  });
exports.genesisScore3400To3500 = functions.runWith(genesisScoreFunctionConfig).pubsub.schedule(genesisScoreFrequency).onRun(async () => {
    return score.scoreLineupsInGenesis(gameWeek, 3400, 3500);
  });
exports.genesisScore3500To3600 = functions.runWith(genesisScoreFunctionConfig).pubsub.schedule(genesisScoreFrequency).onRun(async () => {
    return score.scoreLineupsInGenesis(gameWeek, 3500, 3600);
  });
exports.genesisScore3600To3700 = functions.runWith(genesisScoreFunctionConfig).pubsub.schedule(genesisScoreFrequency).onRun(async () => {
    return score.scoreLineupsInGenesis(gameWeek, 3600, 3700);
  });
exports.genesisScore3700To3800 = functions.runWith(genesisScoreFunctionConfig).pubsub.schedule(genesisScoreFrequency).onRun(async () => {
    return score.scoreLineupsInGenesis(gameWeek, 3700, 3800);
  });
exports.genesisScore3800To3900 = functions.runWith(genesisScoreFunctionConfig).pubsub.schedule(genesisScoreFrequency).onRun(async () => {
    return score.scoreLineupsInGenesis(gameWeek, 3800, 3900);
  });
exports.genesisScore3900To4000 = functions.runWith(genesisScoreFunctionConfig).pubsub.schedule(genesisScoreFrequency).onRun(async () => {
    return score.scoreLineupsInGenesis(gameWeek, 3900, 4000);
  });
// exports.genesisScore4000To4100 = functions.runWith(genesisScoreFunctionConfig).pubsub.schedule(genesisScoreFrequency).onRun(async () => {
//     return score.scoreLineupsInGenesis(gameWeek, 4000, 4100);
//   });
// exports.genesisScore4100To4200 = functions.runWith(genesisScoreFunctionConfig).pubsub.schedule(genesisScoreFrequency).onRun(async () => {
//     return score.scoreLineupsInGenesis(gameWeek, 4100, 4200);
//   });
// exports.genesisScore4200To4300 = functions.runWith(genesisScoreFunctionConfig).pubsub.schedule(genesisScoreFrequency).onRun(async () => {
//     return score.scoreLineupsInGenesis(gameWeek, 4200, 4300);
//   });
// exports.genesisScore4300To4400 = functions.runWith(genesisScoreFunctionConfig).pubsub.schedule(genesisScoreFrequency).onRun(async () => {
//     return score.scoreLineupsInGenesis(gameWeek, 4300, 4400);
//   });
// exports.genesisScore4400To4500 = functions.runWith(genesisScoreFunctionConfig).pubsub.schedule(genesisScoreFrequency).onRun(async () => {
//     return score.scoreLineupsInGenesis(gameWeek, 4400, 4500);
//   });
// exports.genesisScore4500To4600 = functions.runWith(genesisScoreFunctionConfig).pubsub.schedule(genesisScoreFrequency).onRun(async () => {
//     return score.scoreLineupsInGenesis(gameWeek, 4500, 4600);
//   });
// exports.genesisScore4600To4700 = functions.runWith(genesisScoreFunctionConfig).pubsub.schedule(genesisScoreFrequency).onRun(async () => {
//     return score.scoreLineupsInGenesis(gameWeek, 4600, 4700);
//   });
// exports.genesisScore4700To4800 = functions.runWith(genesisScoreFunctionConfig).pubsub.schedule(genesisScoreFrequency).onRun(async () => {
//     return score.scoreLineupsInGenesis(gameWeek, 4700, 4800);
//   });
// exports.genesisScore4800To4900 = functions.runWith(genesisScoreFunctionConfig).pubsub.schedule(genesisScoreFrequency).onRun(async () => {
//     return score.scoreLineupsInGenesis(gameWeek, 4800, 4900);
//   });
// exports.genesisScore4900To5000 = functions.runWith(genesisScoreFunctionConfig).pubsub.schedule(genesisScoreFrequency).onRun(async () => {
//     return score.scoreLineupsInGenesis(gameWeek, 4900, 5000);
//   });
// exports.genesisScore5000To5100 = functions.runWith(genesisScoreFunctionConfig).pubsub.schedule(genesisScoreFrequency).onRun(async () => {
//     return score.scoreLineupsInGenesis(gameWeek, 5000, 5100);
//   });
// exports.genesisScore5100To5200 = functions.runWith(genesisScoreFunctionConfig).pubsub.schedule(genesisScoreFrequency).onRun(async () => {
//     return score.scoreLineupsInGenesis(gameWeek, 5100, 5200);
//   });
// exports.genesisScore5200To5300 = functions.runWith(genesisScoreFunctionConfig).pubsub.schedule(genesisScoreFrequency).onRun(async () => {
//     return score.scoreLineupsInGenesis(gameWeek, 5200, 5300);
//   });
// exports.genesisScore5300To5400 = functions.runWith(genesisScoreFunctionConfig).pubsub.schedule(genesisScoreFrequency).onRun(async () => {
//     return score.scoreLineupsInGenesis(gameWeek, 5300, 5400);
//   });
// exports.genesisScore5400To5500 = functions.runWith(genesisScoreFunctionConfig).pubsub.schedule(genesisScoreFrequency).onRun(async () => {
//     return score.scoreLineupsInGenesis(gameWeek, 5400, 5500);
//   });
// exports.genesisScore5500To5600 = functions.runWith(genesisScoreFunctionConfig).pubsub.schedule(genesisScoreFrequency).onRun(async () => {
//     return score.scoreLineupsInGenesis(gameWeek, 5500, 5600);
//   });
// exports.genesisScore5600To5700 = functions.runWith(genesisScoreFunctionConfig).pubsub.schedule(genesisScoreFrequency).onRun(async () => {
//     return score.scoreLineupsInGenesis(gameWeek, 5600, 5700);
//   });
// exports.genesisScore5700To5800 = functions.runWith(genesisScoreFunctionConfig).pubsub.schedule(genesisScoreFrequency).onRun(async () => {
//     return score.scoreLineupsInGenesis(gameWeek, 5700, 5800);
//   });
// exports.genesisScore5800To5900 = functions.runWith(genesisScoreFunctionConfig).pubsub.schedule(genesisScoreFrequency).onRun(async () => {
//     return score.scoreLineupsInGenesis(gameWeek, 5800, 5900);
//   });
// exports.genesisScore5900To6000 = functions.runWith(genesisScoreFunctionConfig).pubsub.schedule(genesisScoreFrequency).onRun(async () => {
//     return score.scoreLineupsInGenesis(gameWeek, 5900, 6000);
//   });
// exports.genesisScore6000To6100 = functions.runWith(genesisScoreFunctionConfig).pubsub.schedule(genesisScoreFrequency).onRun(async () => {
//     return score.scoreLineupsInGenesis(gameWeek, 6000, 6100);
//   });
// exports.genesisScore6100To6200 = functions.runWith(genesisScoreFunctionConfig).pubsub.schedule(genesisScoreFrequency).onRun(async () => {
//     return score.scoreLineupsInGenesis(gameWeek, 6100, 6200);
//   });
// exports.genesisScore6200To6300 = functions.runWith(genesisScoreFunctionConfig).pubsub.schedule(genesisScoreFrequency).onRun(async () => {
//     return score.scoreLineupsInGenesis(gameWeek, 6200, 6300);
//   });
// exports.genesisScore6300To6400 = functions.runWith(genesisScoreFunctionConfig).pubsub.schedule(genesisScoreFrequency).onRun(async () => {
//     return score.scoreLineupsInGenesis(gameWeek, 6300, 6400);
//   });
// exports.genesisScore6400To6500 = functions.runWith(genesisScoreFunctionConfig).pubsub.schedule(genesisScoreFrequency).onRun(async () => {
//     return score.scoreLineupsInGenesis(gameWeek, 6400, 6500);
//   });
// exports.genesisScore6500To6600 = functions.runWith(genesisScoreFunctionConfig).pubsub.schedule(genesisScoreFrequency).onRun(async () => {
//     return score.scoreLineupsInGenesis(gameWeek, 6500, 6600);
//   });
// exports.genesisScore6600To6700 = functions.runWith(genesisScoreFunctionConfig).pubsub.schedule(genesisScoreFrequency).onRun(async () => {
//     return score.scoreLineupsInGenesis(gameWeek, 6600, 6700);
//   });
// exports.genesisScore6700To6800 = functions.runWith(genesisScoreFunctionConfig).pubsub.schedule(genesisScoreFrequency).onRun(async () => {
//     return score.scoreLineupsInGenesis(gameWeek, 6700, 6800);
//   });
// exports.genesisScore6800To6900 = functions.runWith(genesisScoreFunctionConfig).pubsub.schedule(genesisScoreFrequency).onRun(async () => {
//     return score.scoreLineupsInGenesis(gameWeek, 6800, 6900);
//   });
// exports.genesisScore6900To7000 = functions.runWith(genesisScoreFunctionConfig).pubsub.schedule(genesisScoreFrequency).onRun(async () => {
//     return score.scoreLineupsInGenesis(gameWeek, 6900, 7000);
//   });
// exports.genesisScore7000To7100 = functions.runWith(genesisScoreFunctionConfig).pubsub.schedule(genesisScoreFrequency).onRun(async () => {
//     return score.scoreLineupsInGenesis(gameWeek, 7000, 7100);
//   });
// exports.genesisScore7100To7200 = functions.runWith(genesisScoreFunctionConfig).pubsub.schedule(genesisScoreFrequency).onRun(async () => {
//     return score.scoreLineupsInGenesis(gameWeek, 7100, 7200);
//   });
// exports.genesisScore7200To7300 = functions.runWith(genesisScoreFunctionConfig).pubsub.schedule(genesisScoreFrequency).onRun(async () => {
//     return score.scoreLineupsInGenesis(gameWeek, 7200, 7300);
//   });
// exports.genesisScore7300To7400 = functions.runWith(genesisScoreFunctionConfig).pubsub.schedule(genesisScoreFrequency).onRun(async () => {
//     return score.scoreLineupsInGenesis(gameWeek, 7300, 7400);
//   });
// exports.genesisScore7400To7500 = functions.runWith(genesisScoreFunctionConfig).pubsub.schedule(genesisScoreFrequency).onRun(async () => {
//     return score.scoreLineupsInGenesis(gameWeek, 7400, 7500);
//   });
// exports.genesisScore7500To7600 = functions.runWith(genesisScoreFunctionConfig).pubsub.schedule(genesisScoreFrequency).onRun(async () => {
//     return score.scoreLineupsInGenesis(gameWeek, 7500, 7600);
//   });
// exports.genesisScore7600To7700 = functions.runWith(genesisScoreFunctionConfig).pubsub.schedule(genesisScoreFrequency).onRun(async () => {
//     return score.scoreLineupsInGenesis(gameWeek, 7600, 7700);
//   });
// exports.genesisScore7700To7800 = functions.runWith(genesisScoreFunctionConfig).pubsub.schedule(genesisScoreFrequency).onRun(async () => {
//     return score.scoreLineupsInGenesis(gameWeek, 7700, 7800);
//   });
// exports.genesisScore7800To7900 = functions.runWith(genesisScoreFunctionConfig).pubsub.schedule(genesisScoreFrequency).onRun(async () => {
//     return score.scoreLineupsInGenesis(gameWeek, 7800, 7900);
//   });
// exports.genesisScore7900To8000 = functions.runWith(genesisScoreFunctionConfig).pubsub.schedule(genesisScoreFrequency).onRun(async () => {
//     return score.scoreLineupsInGenesis(gameWeek, 7900, 8000);
//   });
// exports.genesisScore8000To8100 = functions.runWith(genesisScoreFunctionConfig).pubsub.schedule(genesisScoreFrequency).onRun(async () => {
//     return score.scoreLineupsInGenesis(gameWeek, 8000, 8100);
//   });
// exports.genesisScore8100To8200 = functions.runWith(genesisScoreFunctionConfig).pubsub.schedule(genesisScoreFrequency).onRun(async () => {
//     return score.scoreLineupsInGenesis(gameWeek, 8100, 8200);
//   });
// exports.genesisScore8200To8300 = functions.runWith(genesisScoreFunctionConfig).pubsub.schedule(genesisScoreFrequency).onRun(async () => {
//     return score.scoreLineupsInGenesis(gameWeek, 8200, 8300);
//   });
// exports.genesisScore8300To8400 = functions.runWith(genesisScoreFunctionConfig).pubsub.schedule(genesisScoreFrequency).onRun(async () => {
//     return score.scoreLineupsInGenesis(gameWeek, 8300, 8400);
//   });
// exports.genesisScore8400To8500 = functions.runWith(genesisScoreFunctionConfig).pubsub.schedule(genesisScoreFrequency).onRun(async () => {
//     return score.scoreLineupsInGenesis(gameWeek, 8400, 8500);
//   });
// exports.genesisScore8500To8600 = functions.runWith(genesisScoreFunctionConfig).pubsub.schedule(genesisScoreFrequency).onRun(async () => {
//     return score.scoreLineupsInGenesis(gameWeek, 8500, 8600);
//   });
// exports.genesisScore8600To8700 = functions.runWith(genesisScoreFunctionConfig).pubsub.schedule(genesisScoreFrequency).onRun(async () => {
//     return score.scoreLineupsInGenesis(gameWeek, 8600, 8700);
//   });
// exports.genesisScore8700To8800 = functions.runWith(genesisScoreFunctionConfig).pubsub.schedule(genesisScoreFrequency).onRun(async () => {
//     return score.scoreLineupsInGenesis(gameWeek, 8700, 8800);
//   });
// exports.genesisScore8800To8900 = functions.runWith(genesisScoreFunctionConfig).pubsub.schedule(genesisScoreFrequency).onRun(async () => {
//     return score.scoreLineupsInGenesis(gameWeek, 8800, 8900);
//   });
// exports.genesisScore8900To9000 = functions.runWith(genesisScoreFunctionConfig).pubsub.schedule(genesisScoreFrequency).onRun(async () => {
//     return score.scoreLineupsInGenesis(gameWeek, 8900, 9000);
//   });
// exports.genesisScore9000To9100 = functions.runWith(genesisScoreFunctionConfig).pubsub.schedule(genesisScoreFrequency).onRun(async () => {
//     return score.scoreLineupsInGenesis(gameWeek, 9000, 9100);
//   });
// exports.genesisScore9100To9200 = functions.runWith(genesisScoreFunctionConfig).pubsub.schedule(genesisScoreFrequency).onRun(async () => {
//     return score.scoreLineupsInGenesis(gameWeek, 9100, 9200);
//   });
// exports.genesisScore9200To9300 = functions.runWith(genesisScoreFunctionConfig).pubsub.schedule(genesisScoreFrequency).onRun(async () => {
//     return score.scoreLineupsInGenesis(gameWeek, 9200, 9300);
//   });
// exports.genesisScore9300To9400 = functions.runWith(genesisScoreFunctionConfig).pubsub.schedule(genesisScoreFrequency).onRun(async () => {
//     return score.scoreLineupsInGenesis(gameWeek, 9300, 9400);
//   });
// exports.genesisScore9400To9500 = functions.runWith(genesisScoreFunctionConfig).pubsub.schedule(genesisScoreFrequency).onRun(async () => {
//     return score.scoreLineupsInGenesis(gameWeek, 9400, 9500);
//   });
// exports.genesisScore9500To9600 = functions.runWith(genesisScoreFunctionConfig).pubsub.schedule(genesisScoreFrequency).onRun(async () => {
//     return score.scoreLineupsInGenesis(gameWeek, 9500, 9600);
//   });
// exports.genesisScore9600To9700 = functions.runWith(genesisScoreFunctionConfig).pubsub.schedule(genesisScoreFrequency).onRun(async () => {
//     return score.scoreLineupsInGenesis(gameWeek, 9600, 9700);
//   });
// exports.genesisScore9700To9800 = functions.runWith(genesisScoreFunctionConfig).pubsub.schedule(genesisScoreFrequency).onRun(async () => {
//     return score.scoreLineupsInGenesis(gameWeek, 9700, 9800);
//   });
// exports.genesisScore9800To9900 = functions.runWith(genesisScoreFunctionConfig).pubsub.schedule(genesisScoreFrequency).onRun(async () => {
//     return score.scoreLineupsInGenesis(gameWeek, 9800, 9900);
//   });
// exports.genesisScore9900To10000 = functions.runWith(genesisScoreFunctionConfig).pubsub.schedule(genesisScoreFrequency).onRun(async () => {
//     return score.scoreLineupsInGenesis(gameWeek, 9900, 10000)
// });

const lineupsFunctionConfig = { timeoutSeconds: 540, memory: "512MB", failurePolicy: false };
const lineupFrequency = '30 22 * * 1';
exports.setLineupsInGenesis0To250 = functions.runWith(lineupsFunctionConfig).pubsub.schedule(lineupFrequency).onRun(async () => {
  const gameweek = sbs.getNFLWeekV2()
  return await weekTransition.setDefaultLineupForPartOfGenesis(gameweek, 0, 250)
});
exports.setLineupsInGenesis250To500 = functions.runWith(lineupsFunctionConfig).pubsub.schedule(lineupFrequency).onRun(async () => {
  const gameweek = sbs.getNFLWeekV2()
  return await weekTransition.setDefaultLineupForPartOfGenesis(gameweek, 250, 500)
});
exports.setLineupsInGenesis500To750 = functions.runWith(lineupsFunctionConfig).pubsub.schedule(lineupFrequency).onRun(async () => {
  const gameweek = sbs.getNFLWeekV2()
  return await weekTransition.setDefaultLineupForPartOfGenesis(gameweek, 500, 750)
});
exports.setLineupsInGenesis750To1000 = functions.runWith(lineupsFunctionConfig).pubsub.schedule(lineupFrequency).onRun(async () => {
  const gameweek = sbs.getNFLWeekV2()
  return await weekTransition.setDefaultLineupForPartOfGenesis(gameweek, 750, 1000)
});
exports.setLineupsInGenesis1000To1250 = functions.runWith(lineupsFunctionConfig).pubsub.schedule(lineupFrequency).onRun(async () => {
  const gameweek = sbs.getNFLWeekV2()
  return await weekTransition.setDefaultLineupForPartOfGenesis(gameweek, 1000, 1250)
});
exports.setLineupsInGenesis1250To1500 = functions.runWith(lineupsFunctionConfig).pubsub.schedule(lineupFrequency).onRun(async () => {
  const gameweek = sbs.getNFLWeekV2()
  return await weekTransition.setDefaultLineupForPartOfGenesis(gameweek, 1250, 1500)
});
exports.setLineupsInGenesis1500To1750 = functions.runWith(lineupsFunctionConfig).pubsub.schedule(lineupFrequency).onRun(async () => {
  const gameweek = sbs.getNFLWeekV2()
  return await weekTransition.setDefaultLineupForPartOfGenesis(gameweek, 1500, 1750)
});
exports.setLineupsInGenesis1750To2000 = functions.runWith(lineupsFunctionConfig).pubsub.schedule(lineupFrequency).onRun(async () => {
  const gameweek = sbs.getNFLWeekV2()
  return await weekTransition.setDefaultLineupForPartOfGenesis(gameweek, 1750, 2000)
});
exports.setLineupsInGenesis2000To2250 = functions.runWith(lineupsFunctionConfig).pubsub.schedule(lineupFrequency).onRun(async () => {
  const gameweek = sbs.getNFLWeekV2()
  return await weekTransition.setDefaultLineupForPartOfGenesis(gameweek, 2000, 2250)
});
exports.setLineupsInGenesis2250To2500 = functions.runWith(lineupsFunctionConfig).pubsub.schedule(lineupFrequency).onRun(async () => {
  const gameweek = sbs.getNFLWeekV2()
  return await weekTransition.setDefaultLineupForPartOfGenesis(gameweek, 2250, 2500)
});
exports.setLineupsInGenesis2500To2750 = functions.runWith(lineupsFunctionConfig).pubsub.schedule(lineupFrequency).onRun(async () => {
  const gameweek = sbs.getNFLWeekV2()
  return await weekTransition.setDefaultLineupForPartOfGenesis(gameweek, 2500, 2750)
});
exports.setLineupsInGenesis2750To3000 = functions.runWith(lineupsFunctionConfig).pubsub.schedule(lineupFrequency).onRun(async () => {
  const gameweek = sbs.getNFLWeekV2()
  return await weekTransition.setDefaultLineupForPartOfGenesis(gameweek, 2750, 3000)
});
exports.setLineupsInGenesis3000To3250 = functions.runWith(lineupsFunctionConfig).pubsub.schedule(lineupFrequency).onRun(async () => {
  const gameweek = sbs.getNFLWeekV2()
  return await weekTransition.setDefaultLineupForPartOfGenesis(gameweek, 3000, 3250)
});
exports.setLineupsInGenesis3250To3500 = functions.runWith(lineupsFunctionConfig).pubsub.schedule(lineupFrequency).onRun(async () => {
  const gameweek = sbs.getNFLWeekV2()
  return await weekTransition.setDefaultLineupForPartOfGenesis(gameweek, 3250, 3500)
});
exports.setLineupsInGenesis3500To3750 = functions.runWith(lineupsFunctionConfig).pubsub.schedule(lineupFrequency).onRun(async () => {
  const gameweek = sbs.getNFLWeekV2()
  return await weekTransition.setDefaultLineupForPartOfGenesis(gameweek, 3500, 3750)
});
exports.setLineupsInGenesis3750To4000 = functions.runWith(lineupsFunctionConfig).pubsub.schedule(lineupFrequency).onRun(async () => {
  const gameweek = sbs.getNFLWeekV2()
  return await weekTransition.setDefaultLineupForPartOfGenesis(gameweek, 3750, 4000)
});
exports.setLineupsInGenesis4000To4250 = functions.runWith(lineupsFunctionConfig).pubsub.schedule(lineupFrequency).onRun(async () => {
  const gameweek = sbs.getNFLWeekV2()
  return await weekTransition.setDefaultLineupForPartOfGenesis(gameweek, 4000, 4250)
});
exports.setLineupsInGenesis4250To4500 = functions.runWith(lineupsFunctionConfig).pubsub.schedule(lineupFrequency).onRun(async () => {
  const gameweek = sbs.getNFLWeekV2()
  return await weekTransition.setDefaultLineupForPartOfGenesis(gameweek, 4250, 4500)
});
exports.setLineupsInGenesis4500To4750 = functions.runWith(lineupsFunctionConfig).pubsub.schedule(lineupFrequency).onRun(async () => {
  const gameweek = sbs.getNFLWeekV2()
  return await weekTransition.setDefaultLineupForPartOfGenesis(gameweek, 4500, 4750)
});
exports.setLineupsInGenesis4750To5000 = functions.runWith(lineupsFunctionConfig).pubsub.schedule(lineupFrequency).onRun(async () => {
  const gameweek = sbs.getNFLWeekV2()
  return await weekTransition.setDefaultLineupForPartOfGenesis(gameweek, 4750, 5000)
});
exports.setLineupsInGenesis5000To5250 = functions.runWith(lineupsFunctionConfig).pubsub.schedule(lineupFrequency).onRun(async () => {
  const gameweek = sbs.getNFLWeekV2()
  return await weekTransition.setDefaultLineupForPartOfGenesis(gameweek, 5000, 5250)
});
exports.setLineupsInGenesis5250To5500 = functions.runWith(lineupsFunctionConfig).pubsub.schedule(lineupFrequency).onRun(async () => {
  const gameweek = sbs.getNFLWeekV2()
  return await weekTransition.setDefaultLineupForPartOfGenesis(gameweek, 5250, 5500)
});
exports.setLineupsInGenesis5500To5750 = functions.runWith(lineupsFunctionConfig).pubsub.schedule(lineupFrequency).onRun(async () => {
  const gameweek = sbs.getNFLWeekV2()
  return await weekTransition.setDefaultLineupForPartOfGenesis(gameweek, 5500, 5750)
});
exports.setLineupsInGenesis5750To6000 = functions.runWith(lineupsFunctionConfig).pubsub.schedule(lineupFrequency).onRun(async () => {
  const gameweek = sbs.getNFLWeekV2()
  return await weekTransition.setDefaultLineupForPartOfGenesis(gameweek, 5750, 6000)
});
exports.setLineupsInGenesis6000To6250 = functions.runWith(lineupsFunctionConfig).pubsub.schedule(lineupFrequency).onRun(async () => {
  const gameweek = sbs.getNFLWeekV2()
  return await weekTransition.setDefaultLineupForPartOfGenesis(gameweek, 6000, 6250)
});
exports.setLineupsInGenesis6250To6500 = functions.runWith(lineupsFunctionConfig).pubsub.schedule(lineupFrequency).onRun(async () => {
  const gameweek = sbs.getNFLWeekV2()
  return await weekTransition.setDefaultLineupForPartOfGenesis(gameweek, 6250, 6500)
});
exports.setLineupsInGenesis6500To6750 = functions.runWith(lineupsFunctionConfig).pubsub.schedule(lineupFrequency).onRun(async () => {
  const gameweek = sbs.getNFLWeekV2()
  return await weekTransition.setDefaultLineupForPartOfGenesis(gameweek, 6500, 6750)
});
exports.setLineupsInGenesis6750To7000 = functions.runWith(lineupsFunctionConfig).pubsub.schedule(lineupFrequency).onRun(async () => {
  const gameweek = sbs.getNFLWeekV2()
  return await weekTransition.setDefaultLineupForPartOfGenesis(gameweek, 6750, 7000)
});
exports.setLineupsInGenesis7000To7250 = functions.runWith(lineupsFunctionConfig).pubsub.schedule(lineupFrequency).onRun(async () => {
  const gameweek = sbs.getNFLWeekV2()
  return await weekTransition.setDefaultLineupForPartOfGenesis(gameweek, 7000, 7250)
});
exports.setLineupsInGenesis7250To7500 = functions.runWith(lineupsFunctionConfig).pubsub.schedule(lineupFrequency).onRun(async () => {
  const gameweek = sbs.getNFLWeekV2()
  return await weekTransition.setDefaultLineupForPartOfGenesis(gameweek, 7250, 7500)
});
exports.setLineupsInGenesis7500To7750 = functions.runWith(lineupsFunctionConfig).pubsub.schedule(lineupFrequency).onRun(async () => {
  const gameweek = sbs.getNFLWeekV2()
  return await weekTransition.setDefaultLineupForPartOfGenesis(gameweek, 7500, 7750)
});
exports.setLineupsInGenesis7750To8000 = functions.runWith(lineupsFunctionConfig).pubsub.schedule(lineupFrequency).onRun(async () => {
  const gameweek = sbs.getNFLWeekV2()
  return await weekTransition.setDefaultLineupForPartOfGenesis(gameweek, 7750, 8000)
});
exports.setLineupsInGenesis8000To8250 = functions.runWith(lineupsFunctionConfig).pubsub.schedule(lineupFrequency).onRun(async () => {
  const gameweek = sbs.getNFLWeekV2()
  return await weekTransition.setDefaultLineupForPartOfGenesis(gameweek, 8000, 8250)
});
exports.setLineupsInGenesis8250To8500 = functions.runWith(lineupsFunctionConfig).pubsub.schedule(lineupFrequency).onRun(async () => {
  const gameweek = sbs.getNFLWeekV2()
  return await weekTransition.setDefaultLineupForPartOfGenesis(gameweek, 8250, 8500)
});
exports.setLineupsInGenesis8500To8750 = functions.runWith(lineupsFunctionConfig).pubsub.schedule(lineupFrequency).onRun(async () => {
  const gameweek = sbs.getNFLWeekV2()
  return await weekTransition.setDefaultLineupForPartOfGenesis(gameweek, 8500, 8750)
});
exports.setLineupsInGenesis8750To9000 = functions.runWith(lineupsFunctionConfig).pubsub.schedule(lineupFrequency).onRun(async () => {
  const gameweek = sbs.getNFLWeekV2()
  return await weekTransition.setDefaultLineupForPartOfGenesis(gameweek, 8750, 9000)
});
exports.setLineupsInGenesis9000To9250 = functions.runWith(lineupsFunctionConfig).pubsub.schedule(lineupFrequency).onRun(async () => {
  const gameweek = sbs.getNFLWeekV2()
  return await weekTransition.setDefaultLineupForPartOfGenesis(gameweek, 9000, 9250)
});
exports.setLineupsInGenesis9250To9500 = functions.runWith(lineupsFunctionConfig).pubsub.schedule(lineupFrequency).onRun(async () => {
  const gameweek = sbs.getNFLWeekV2()
  return await weekTransition.setDefaultLineupForPartOfGenesis(gameweek, 9250, 9500)
});
exports.setLineupsInGenesis9500To9750 = functions.runWith(lineupsFunctionConfig).pubsub.schedule(lineupFrequency).onRun(async () => {
  const gameweek = sbs.getNFLWeekV2()
  return await weekTransition.setDefaultLineupForPartOfGenesis(gameweek, 9500, 9750)
});
exports.setLineupsInGenesis9750To10000 = functions.runWith(lineupsFunctionConfig).pubsub.schedule(lineupFrequency).onRun(async () => {
  const gameweek = sbs.getNFLWeekV2()
  return await weekTransition.setDefaultLineupForPartOfGenesis(gameweek, 9750, 10000)
});
exports.setLineupsForNewWeekInSeasonCustomLeagues = functions.runWith(lineupsFunctionConfig).pubsub.schedule(lineupFrequency).onRun(async () => {
  const gameweek = sbs.getNFLWeekV2()
  return await weekTransition.setLineupsForNewWeekInSeasonCustomLeagues(gameweek)
});


