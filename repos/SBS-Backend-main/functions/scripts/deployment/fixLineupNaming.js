//✍️ STEP: 1  FILL OUT THE SCRIPT TEMPLATE BELOW

/* DESCRIPTION START:
========================

    📝 General Description:

    In order for scoring to work correctly, we need to rename all the rounds to the game week format of 2022-REG-01.  Doing thsi will require a strange mapping table that we don't want/need to implement. 
    
    The first time this script is run, it will fix naming. 
    Additional times being run it will validate that the lineups are in the correct format.  

    👣 Deployment Steps: node fixLineupNaming.js

    🔗 TaskLink: Trello Link Here

    📅 Date Run in sbs-fantasy-dev:  9/7/2022

    📅 Date Run in sbs-fantasy-prod:

========================
DESCRIPTION END */

//🗃️ STEP 2: Add needed Dependencies

const SCRIPT_NAME = 'Fix Lineup Naming'; //required

//PACKAGES

//SERVICES
const db = require('../../services/db');
const sbs = require('../../services/sbs');


//🚀 STEP 3: Write the script.  Include tests for validation where possible
const run = async () => {
  const leagueIds = await db.readAllDocumentIds('leagues');
  for (let i = 0; i < leagueIds.length; i++) {
    const leagueId = leagueIds[i];
    const cardIds = await db.readAllDocumentIds(`leagues/${leagueId}/cards`);
    for(let j = 0; j < cardIds.length; j++){
      const cardId = cardIds[j];
      const documentPath = `leagues/${leagueId}/cards/${cardId}/lineups`;
      const validDocumentId = sbs.getNFLWeekV2();
      const invalidDocumentId = 'ROUND 1';
      const isLineupDocumentAlreadyCorrect = await db.readDocument(documentPath, validDocumentId);
      if(isLineupDocumentAlreadyCorrect) {
        console.log(`...✅  documentPath:${documentPath} for document:${validDocumentId} is valid`);
        continue;
      }
      const oldLineup = await db.readDocument(documentPath, invalidDocumentId);
      console.log(`...🐏   copy lineup from invalidDocumentId:${invalidDocumentId}`);
      await db.createOrUpdateDocument(documentPath, validDocumentId, oldLineup, true);
      console.log(`...🛠️   documentPath:${documentPath} added for document:${validDocumentId}`);
      await db.recursiveDelete(documentPath, invalidDocumentId)
      console.log(`...➖   document:${invalidDocumentId} removed`);
    }
  }
};



(async () => {
    console.log(`...📝   START:${SCRIPT_NAME}`);
    
    await run();

    console.log(`...📝   END:${SCRIPT_NAME}`);
    process.exit(0);
})();
