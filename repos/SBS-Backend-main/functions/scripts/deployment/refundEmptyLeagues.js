
//✍️ STEP: 1  FILL OUT THE SCRIPT TEMPLATE BELOW

/* DESCRIPTION START:
========================

    📝 General Description:

    All leagues that run without the min number of players expect when exempted for some reason should be refund the entry fee back to players. 


    👣 Deployment Steps: node refundEmptyLeagues.js

    🔗 TaskLink: Trello Link Here

    📅 Date Run in dev:

    📅 Date Run in prod: 9/20/2022 with a database backup taken

========================
DESCRIPTION END */

//🗃️ STEP 2: Add needed Dependencies

const SCRIPT_NAME = 'Refund Empty Leagues'; //required

const { FieldValue } = require('firebase-admin/firestore');

//PACKAGES
const { v4: uuidv4 } = require('uuid');

//SERVICES
const db = require('../../services/db');
const TX = require('../../services/tx');
const utils = require('../../services/utils');
const sbs = require('../../services/sbs');


//🚀 STEP 3: Write the script.  Include tests for validation where possible
const getCardsInEmptyLeaguesToRefund = async () => {
  let leagueIds = await db.readAllDocumentIds('leagues');
  leagueIds = leagueIds.filter(leagueId => leagueId.includes('Season(Thu Oct 20 2022') || leagueId.includes('Weekly(Thu Oct 20 2022'));
  
  //leagues that didn't get the to the min number of players. 
  let emptyLeagues = [];
  for(let i = 0; i < leagueIds.length; i++){
    const leagueId = leagueIds[i];
    const league = await db.readDocument('leagues', leagueId);
    if(!league) {
      console.log(`found a leagueID that returns an empty object.... ${leagueId}`)
      continue;
    }
    const cardsInLeague =  await db.readAllDocumentIds(`leagues/${leagueId}/cards`) || []; 
    const minPlayers = league.game.minPlayers || 2;
    
    if(cardsInLeague.length > 0 && cardsInLeague.length < minPlayers ){
      emptyLeagues.push({
        league, 
        cardsToRefund : cardsInLeague,
      });
      console.log(`...🗑️   ${leagueId} added to emptyLeagues with ${cardsInLeague.length} cards to refund.`);
    }
    console.log(`...${i} of ${leagueIds.length}`);
  }
  return emptyLeagues;
};

const refundCardInLeague = async (league, ownerId, cardId) => {

  const leagueId = league.id;
  const refundAmount = league.entry.fee;
  const txHash = `${ownerId}-${leagueId}-${refundAmount}`;

  const isAlreadyRefunded = await db.readDocument('transactions', "refundEntryFee-" + txHash);
  if(isAlreadyRefunded) return console.log(`...🛑  TxHash:${txHash} already exists for this entryFee refund`);
  
  //no need to refund when no entry was taken. 
  if(refundAmount > 0){
    //🚀 Uncomment this when you ready to do this for real
    await db.createOrUpdateDocument(`owners`, ownerId, { availableCredit: FieldValue.increment(refundAmount)}, true);
    const txData = {
      type: 'refundEntryFee',
      _txHash: txHash,
      ownerId: ownerId,
      isOnChain: false,
      network: null,
      metadata: {
        leagueId,
        refundAmount,
        cardId,
      }
    }
    await TX.createSBSTx(txData);
    //🚀 Uncomment this when you ready to do this for real
    console.log(`...🔙   Refund:${refundAmount} to ownerId:${ownerId} card:${cardId} from ${leagueId}`)
  }
};

(async () => {
  console.log(`...📝   START:${SCRIPT_NAME}`);

  const emptyLeagues = await getCardsInEmptyLeaguesToRefund();
  for(let i = 0; i < emptyLeagues.length; i++){
      const league = emptyLeagues[i].league;
      const leagueId = emptyLeagues[i].league.id;
      const cardsToRefund = emptyLeagues[i].cardsToRefund;
      for(let j = 0; j < cardsToRefund.length; j++){
        const cardId = cardsToRefund[j];
        const card = await db.readDocument(`leagues/${leagueId}/cards`, cardId);
        const ownerId = card._ownerId;
        await refundCardInLeague(league, ownerId, cardId);
      }
      
  }

  console.log(`...📝   END:${SCRIPT_NAME}`);
  process.exit(0);
})();