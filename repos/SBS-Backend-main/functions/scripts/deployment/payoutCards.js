//✍️ STEP: 1  FILL OUT THE SCRIPT TEMPLATE BELOW

/* DESCRIPTION START:
========================

    📝 General Description:

    The intent of the script is to demo use of the script template.  Why we need this script will be included here and 
    an other relevant details. 

    👣 Deployment Steps: node payoutCards.js

    🔗 TaskLink: Trello Link Here

    📅 Date Run in sbs-fantasy-dev:

    📅 Date Run in sbs-fantasy-prod:

========================
DESCRIPTION END */

//🗃️ STEP 2: Add needed Dependencies

const SCRIPT_NAME = 'Payout Cards'; //required

//Packages
const { FieldValue } = require('firebase-admin/firestore');
const { v4: uuidv4 } = require('uuid');

//services
const db = require('../../services/db');
const utils = require('../../services/utils');
const cardContract = require('../../services/cardContract');

const payoutWeeklyGenesis = async (gameWeek) => {
  console.log(`...🪙    START gameWeek:${gameWeek} league:genesis payout`)

  const weekAllPrizeWinners = await db.getGenesisPrizeWinners(gameWeek, 'weekAll');
  console.log(weekAllPrizeWinners)
  const weekHofPrizeWinners = await db.getGenesisPrizeWinners(gameWeek, 'weekHof')
  console.log(weekHofPrizeWinners)
  const weekSpoiledPrizeWinners = await db.getGenesisPrizeWinners(gameWeek, 'weekSpoiled');
  console.log(weekSpoiledPrizeWinners)
  const allGenesisPrizeWinners = [...weekAllPrizeWinners, ...weekHofPrizeWinners, ...weekSpoiledPrizeWinners]; 

  for(let i = 0; i < allGenesisPrizeWinners.length; i++){
    const winner = allGenesisPrizeWinners[i];
    const cardId = winner.cardId;
    const prizeAmount = winner.prize.prize;
    const txId = uuidv4();
    const transactionObject = {
      winner,
      txId: txId,
      createdAt: db._getTimeStamp()
    }
    await db.createOrUpdateDocument('transactions', txId, transactionObject, true);//change the id to be something that can't be accidently run twice
    await db.createOrUpdateDocument(`cards/${cardId}/transactions`, txId, transactionObject, true);
    await db.createOrUpdateDocument('cards', cardId, {prizes:{ ape: FieldValue.increment(prizeAmount) } }, true);
    console.log(`...💰   gameWeek:${gameWeek} leagueId:genesis cardId:${cardId} wins ape:${prizeAmount}`);
  }

  console.log(`...🪙    END gameWeek:${gameWeek} league:genesis payout`)
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
        createdAt: db._getTimeStamp()
      }
      await db.createOrUpdateDocument('transactions', txId, transactionObject, true);
      await db.createOrUpdateDocument(`cards/${cardId}/transactions`, txId, transactionObject, true);
      await db.createOrUpdateDocument('cards', cardId, { prizes:{ ape: FieldValue.increment(prizeAmount) } }, true);
      console.log(`...💰   gameWeek:${gameWeek} leagueId:${leagueId} cardId:${cardId} apePrize:${prizeAmount}`);
    }
  }
} 

const payoutWeeklyLeagues = async (gameWeek) => {
  console.log(`...🐒   START gameWeek:${gameWeek} leagues payout`);

  
  let leagueIds = await db.readAllDocumentIds('leagues');

  //TODO: create a better way of figure out which leagues are part of a given gameWeek
  if(gameWeek === '2022-REG-01'){
    leagueIds = leagueIds.filter(leagueId => leagueId.includes('Weekly(Thu Sep 08 2022'))
  }
  if(gameWeek === '2022-REG-02'){
    leagueIds = leagueIds.filter(leagueId => leagueId.includes('Weekly(Thu Sep 15 2022'))
  }
  if(gameWeek === '2022-REG-03'){
    leagueIds = leagueIds.filter(leagueId => leagueId.includes('Weekly(Thu Sep 22 2022'))
  }
  if(gameWeek === '2022-REG-04'){
    leagueIds = leagueIds.filter(leagueId => leagueId.includes('Weekly(Thu Sep 29 2022'))
  }

  for(let i = 0; i < leagueIds.length; i++){
    const leagueId = leagueIds[i];
    const splitArr = leagueId.split('|');
    if (splitArr[2] == "Top-3-Paid") {
      console.log(`Skipping a leagueID with top 3 paid... ${leagueId}`)
      continue;
    }
    const league = await db.readDocument(`leagues`, leagueId);  
    const maxPlayer = league.game.maxPlayers;
    const isWeeklyPayout = utils.isWeeklyPayout(league);
    if(!isWeeklyPayout) continue;
    const results = await db.readDocument(`leagues/${leagueId}/results`, gameWeek);
    if(!results){
      console.log(`...⏩   gameWeek:${gameWeek} league:${leagueId} no results`);
      continue;
    }

    //change results to calculated results if max isn't reached. 
    if(maxPlayer > results.week.length){
      const adjustedResults = utils.adjustWeeklyResults(gameWeek, league, results);
      await payoutResults(gameWeek, leagueId, adjustedResults);
    } else {
      await payoutResults(gameWeek, leagueId, results);
    }

  }

  console.log(`...🐒   END gameWeek:${gameWeek} leagues payout`);
}


const payoutCustom = async (gameWeek) => {

  // const customPayoutData = [
  //   { cardId:"9117",prize:0.25},
  //   { cardId:"4623",prize:0.2},
  //   { cardId:"9900",prize:0.15},
  //   { cardId:"8987",prize:0.09},
  //   { cardId:"5134",prize:0.07},
  //   { cardId:"3627",prize:0.06},
  //   { cardId:"9538",prize:0.03},
  //   { cardId:"6096",prize:0.03},
  //   { cardId:"7530",prize:0.03},
  //   { cardId:"1874",prize:0.03},
  //   { cardId:"4569",prize:0.03},
  //   { cardId:"4770",prize:0.03},
  //   { cardId:"2998",prize:0.03},
  //   { cardId:"3119",prize:0.03},
  //   { cardId:"6815",prize:0.025},
  //   // { cardId:"3896",prize:0.025},
  //   { cardId:"7656",prize:0.025},
  //   { cardId:"3763",prize:0.025},
  //   { cardId:"7058",prize:0.025},
  //   { cardId:"7988",prize:0.025},
  //   { cardId:"8037",prize:0.025},
  //   { cardId:"6389",prize:0.025},
  //   { cardId:"5324",prize:0.025},
  //   { cardId:"253",prize:0.025},
  //   { cardId:"6563",prize:0.025},
  //   { cardId:"8232",prize:0.025},
  //   { cardId:"9396",prize:0.025},
  //   { cardId:"9171",prize:0.025},
  //   { cardId:"337",prize:0.025},
  //   { cardId:"6883",prize:0.025},
  //   { cardId:"7112",prize:0.02},
  //   { cardId:"4075",prize:0.02},
  //   { cardId:"6688",prize:0.02},
  //   { cardId:"5125",prize:0.02},
  //   { cardId:"479",prize:0.02},
  //   { cardId:"3653",prize:0.02},
  //   { cardId:"6696",prize:0.02},
  //   { cardId:"8148",prize:0.02},
  //   { cardId:"6410",prize:0.02},
  //   { cardId:"1858",prize:0.02},
  //   { cardId:"2812",prize:0.02},
  //   { cardId:"6911",prize:0.02},
  //   { cardId:"6959",prize:0.02},
  //   { cardId:"587",prize:0.02},
  //   { cardId:"1877",prize:0.02},
  //   { cardId:"6072",prize:0.02},
  //   { cardId:"2611",prize:0.02},
  //   { cardId:"6393",prize:0.02},
  //   { cardId:"2887",prize:0.02},
  //   { cardId:"1890",prize:0.02},
  //   { cardId:"6326",prize:0.02},
  //   { cardId:"8550",prize:0.02},
  //   { cardId:"6548",prize:0.02},
  //   { cardId:"9363",prize:0.02},
  //   { cardId:"1719",prize:0.02},
  //   { cardId:"6835",prize:0.02},
  //   { cardId:"6316",prize:0.02},
  //   { cardId:"4463",prize:0.02},
  //   { cardId:"4140",prize:0.02},
  //   { cardId:"6439",prize:0.02},
  //   { cardId:"58",prize:0.02},
  //   { cardId:"7159",prize:0.02},
  //   { cardId:"4075",prize:0.08},
  //   { cardId:"1666",prize:0.07},
  //   { cardId:"7917",prize:0.05},
  //   { cardId:"9326",prize:0.045},
  //   { cardId:"8523",prize:0.04},
  //   { cardId:"1749",prize:0.035},
  //   { cardId:"8270",prize:0.03},
  //   { cardId:"4075",prize:0.1},
  //   { cardId:"5201",prize:0.08},
  //   { cardId:"9860",prize:0.07},
  //   { cardId:"8523",prize:0.06},
  //   { cardId:"259",prize:0.05},
  //   { cardId:"3607",prize:0.04},
  //   { cardId:"6656",prize:0.03},
  //   { cardId:"4051",prize:1},
  //   { cardId:"2478",prize:0.25},
  //   { cardId:"2231",prize:0.15},
  //   { cardId:"6627",prize:0.1},
  //   { cardId:"445",prize:0.08},
  //   // { cardId:"2553",prize:0.06},
  //   { cardId:"8237",prize:0.05},
  //   { cardId:"7436",prize:0.03},
  //   { cardId:"226",prize:0.03},
  //   { cardId:"8628",prize:0.03},
  //   // { cardId:"5138",prize:0.03},
  //   { cardId:"7369",prize:0.03},
  //   { cardId:"3021",prize:0.03},
  //   { cardId:"2852",prize:0.03},
  //   { cardId:"8595",prize:0.03},
  //   { cardId:"5745",prize:0.025},
  //   { cardId:"9456",prize:0.025},
  //   { cardId:"4524",prize:0.025},
  //   { cardId:"6894",prize:0.025},
  //   { cardId:"4263",prize:0.025},
  //   { cardId:"5769",prize:0.025},
  //   { cardId:"6269",prize:0.025},
  //   { cardId:"5048",prize:0.025},
  //   // { cardId:"2096",prize:0.025},
  //   { cardId:"3603",prize:0.025},
  //   { cardId:"335",prize:0.025},
  //   { cardId:"8300",prize:0.025},
  //   { cardId:"3026",prize:0.025},
  //   { cardId:"2406",prize:0.025},
  //   { cardId:"5935",prize:0.025},
  //   { cardId:"5361",prize:0.025},
  //   { cardId:"8268",prize:0.025},
  //   { cardId:"6569",prize:0.025},
  //   { cardId:"9613",prize:0.025},
  //   { cardId:"3893",prize:0.025},
  //   { cardId:"4015",prize:0.025},
  //   { cardId:"3551",prize:0.02},
  //   { cardId:"7662",prize:0.02},
  //   { cardId:"4859",prize:0.02},
  //   { cardId:"3099",prize:0.02},
  //   { cardId:"692",prize:0.02},
  //   { cardId:"80",prize:0.02},
  //   { cardId:"3917",prize:0.02},
  //   { cardId:"7321",prize:0.02},
  //   { cardId:"5908",prize:0.02},
  //   { cardId:"1729",prize:0.02},
  //   { cardId:"7947",prize:0.02},
  //   // { cardId:"9367",prize:0.02},
  //   { cardId:"2663",prize:0.02},
  //   { cardId:"7144",prize:0.02},
  //   { cardId:"4031",prize:0.02},
  //   { cardId:"9033",prize:0.02},
  //   { cardId:"5135",prize:0.02},
  //   { cardId:"7230",prize:0.02},
  //   { cardId:"9310",prize:0.02},
  //   { cardId:"1090",prize:0.02},
  //   { cardId:"7953",prize:0.02},
  //   { cardId:"7076",prize:0.02},
  //   { cardId:"2931",prize:0.02},
  //   { cardId:"3715",prize:0.02},
  //   { cardId:"3841",prize:0.02},
  //   { cardId:"1548",prize:0.02},
  //   { cardId:"6039",prize:0.02},
  //   { cardId:"1418",prize:0.02},
  //   { cardId:"5101",prize:0.02},
  //   { cardId:"8584",prize:0.02},
  //   { cardId:"9730",prize:0.02},
  //   { cardId:"6205",prize:0.02},
  //   { cardId:"6734",prize:0.02},
  //   { cardId:"4638",prize:0.02},
  //   { cardId:"6455",prize:0.02},
  //   { cardId:"4313",prize:0.02},
  //   { cardId:"1642",prize:0.02},
  //   { cardId:"7286",prize:0.02},
  //   { cardId:"9456",prize:0.2},
  //   { cardId:"3592",prize:0.08},
  //   { cardId:"1666",prize:0.07},
  //   { cardId:"5082",prize:0.06},
  //   { cardId:"2376",prize:0.05},
  //   { cardId:"8300",prize:0.25},
  //   { cardId:"6455",prize:0.125},
  //   { cardId:"3592",prize:0.1},
  //   { cardId:"8543",prize:0.09},
  //   { cardId:"1652",prize:0.06},
  //   { cardId:"7762",prize:0.04},
  //   { cardId:"9718",prize:0.03},
  // ];

  const customPayoutData = [
    { cardId:"1666",prize:0.07},
  ]

  for(let i = 0; i < customPayoutData.length; i++){
    const cardId = customPayoutData[i].cardId;
    const leagueId = 'genesis';
    const prizeCoin = 'eth';
    const prizeAmount = customPayoutData[i].prize;
    const awardPrizeId = utils.getAwardPrizeId(gameWeek, cardId, leagueId, prizeCoin, prizeAmount);
    
    const isAlreadyAwarded = await db.readDocument(`cards/${cardId}/transactions`, awardPrizeId);
    if(isAlreadyAwarded){
      console.log(`...🛑  award tx already found for card:${cardId}`);
      continue;
    }
    
    const card = await db.readDocument('cards', cardId);
    const ownerId = card._ownerId;
    let prevPrizeAmount;
    
    if(card.prizes){
      prevPrizeAmount = card.prizes.eth != undefined ? card.prizes.eth : 0;
    } else {
      prevPrizeAmount = 0;
    }

    const newPrizeAmount = parseFloat(parseFloat(prevPrizeAmount + prizeAmount).toFixed(2));

    const awardPrizeTx = {
      id: awardPrizeId,
      cardId: cardId,
      ownerId: ownerId,
      type: 'awardPrize',
      timestamp: db._getTimeStamp(),
      txData: {
        leagueId: 'genesis',
        gameWeek: gameWeek,
        prizeAmount: prizeAmount,
        prizeCoin: 'ape',
        prizePrevAmountOnCard: prevPrizeAmount,
        prizeNewAmountOnCard: newPrizeAmount,
      }
    }

    await db.createOrUpdateDocument('transactions', awardPrizeId, awardPrizeTx, false);
    await db.createOrUpdateDocument(`cards/${cardId}/transactions`, awardPrizeId, awardPrizeTx, false);
    await db.createOrUpdateDocument('cards', cardId, {prizes:{ eth: newPrizeAmount } }, true);
    console.log(`...💰   awardPrizeId:${awardPrizeId}`)
  }


}

//only run this in case you want to start over.  Doing really bad is you need run this alot. 
const cleanupBadPrizes = async () => {
  const getAllPrizeWinners = await db.getAllPrizeWinners();
  for(let i = 0; i < getAllPrizeWinners.length; i++){
    const card = getAllPrizeWinners[i];
    const cardId = card._cardId;
    delete card.prizes;
    if(!card.prizes){  //check that prizes is truely gone before adding back in. 
      await db.createOrUpdateDocument('cards', cardId, card, false);
      console.log(`...🧼   Removed prize object from card:${cardId} ...${i} of ${getAllPrizeWinners.length}`);
      const allTxsOnCard = await db.readAllDocumentIds(`cards/${cardId}/transactions`);
      for(let j = 0; j < allTxsOnCard.length; j++){
        const txId = allTxsOnCard[j];
        await db.deleteDocument(`cards/${cardId}/transactions`, txId);
        console.log(`...🗑️   Remove bad txId:${txId}`)
      }
    }
  }
}


//🚀 STEP 3: Write the script.  Include tests for validation where possible
const run = async () => {
  const gameWeek = '2023REG-16';
  await payoutWeeklyGenesis(gameWeek);
  //await payoutWeeklyLeagues(gameWeek);
  //await cleanupBadPrizes();
  //await payoutCustom(gameWeek);
    
};



(async () => {
    console.log(`...📝   START:${SCRIPT_NAME}`);
    
    await run();

    console.log(`...📝   END:${SCRIPT_NAME}`);
    process.exit(0);
})();
