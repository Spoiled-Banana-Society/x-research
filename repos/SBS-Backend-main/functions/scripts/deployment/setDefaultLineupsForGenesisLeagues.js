//✍️ STEP: 1  FILL OUT THE SCRIPT TEMPLATE BELOW

//TODO: TURN THIS INTO A CRON TO RUN EVERY WEEK!!!!
/* DESCRIPTION START:
========================

    📝 General Description:

    As I was troubleshooting, I realized we had a major issue in that not all owners were not showin in the genesis league inside the owner object. 
    If an owner has  cards, they should be in the genesis league.  This reference in the owner object must be correct as its the only way 
    we can find the cards an owner has to know what to update in a peel and mash situation that is already entered into a league. 

    
    
    👣 Deployment Steps: node setDefaultLineupsForGenesisLeagues.js

    🔗 TaskLink: Trello Link Here

    📅 Date Run in sbs-fantasy-dev: 

    📅 Date Run in sbs-fantasy-prod:

========================
DESCRIPTION END */

//🗃️ STEP 2: Add needed Dependencies

const SCRIPT_NAME = "Set Default Lineups for genesis" //required

//PACKAGES

//SERVICES
const db = require("../../services/db")
const cardContract = require("../../services/cardContract")
const utils = require("../../services/utils")
const sbs = require("../../services/sbs")

//🚀 STEP 3: Write the script.  Include tests for validation where possible

const run = async () => {

  const gameWeek = sbs.getNFLWeekV2();

  //grab all leagueIds that are not genesis
  let leagueIds = ['genesis']

  //iterate through each leagues cards.
  for (let i = 0; i < leagueIds.length; i++) {
      const leagueId = leagueIds[i];
      if(!leagueId) continue;
      const league = await db.readDocument('leagues', leagueId);
      //const cardIds = await db.readAllDocumentIds(`leagues/${leagueId}/cards`);
      for(let j = 0; j < 10_000; j++){
          const cardId = `${j}`;
          if(!cardId) continue;
          const prevCard = await db.readDocument(`leagues/${leagueId}/cards`, cardId);
          const currentCard = await db.readDocument('cards', cardId);

          currentCard.joinedAt = prevCard.joinedAt || db._getTimeStamp();
          await db.createOrUpdateDocument(`leagues/${leagueId}/cards`, cardId, currentCard, true);
          console.log(`...🃏   Update card:${cardId} for league:${leagueId}`);
          
          const isSetAlready = await db.readDocument(`leagues/${leagueId}/cards/${cardId}/lineups`, gameWeek);
          if(isSetAlready) {
            console.log(`...✅   league:${leagueId} card:${cardId} lineup already set`);
            continue;
          }
        
          //const userDefaultLineup = await db.readDocument(`owners/${ownerId}/cards/${cardId}/defaultLineup`, 'lineup')  ;
          const usersPreviousLineup = await db.readDocument(`leagues/${leagueId}/cards/${cardId}/lineups`, sbs.getPreviousNFLWeek(gameWeek));
          let lineup;
          //use this if we have it first. 
          // if(userDefaultLineup){
          //   lineup = userDefaultLineup;
          //   console.log(`...🧔   league:${leagueId} card:${cardId} gameWeek:${gameWeek} User default lineup set`);
          // }
          
          //user this next if we don't
          if(!lineup && usersPreviousLineup){
            lineup = usersPreviousLineup;
            console.log(`...🔙   league:${leagueId} card:${cardId} gameWeek:${gameWeek} User previous lineup set`);
          }

          //otherwise get a system generated lineup
          if(!lineup){
            lineup = utils.getDefaultLineup(currentCard); ;
            console.log(`...🤖   league:${leagueId} card:${cardId} gameWeek:${gameWeek} system default lineup set`);
          }

          lineup.scoreWeek = 0;
          const ownerId = currentCard._ownerId;
          await utils.setLineupInLeague(lineup, league, sbs.getNFLWeekV2(), ownerId, false);
      }
  } 
}

(async () => {
    console.log(`...📝   START:${SCRIPT_NAME}`)
    await run();
    console.log(`...📝   END:${SCRIPT_NAME}`)
    process.exit(0)
})()