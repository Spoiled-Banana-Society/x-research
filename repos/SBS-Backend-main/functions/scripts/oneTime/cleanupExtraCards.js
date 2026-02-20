//✍️ STEP: 1  FILL OUT THE SCRIPT TEMPLATE BELOW

/* DESCRIPTION START:
========================

    📝 General Description:

    There are a bunch of unused cards in dev that need to be cleaned up.  Removing this now. 

    👣 Deployment Steps: node cleanupExtraCards.js

    🔗 TaskLink: Trello Link Here

    📅 Date Run in sbs-fantasy-dev:

    📅 Date Run in sbs-fantasy-prod:

========================
DESCRIPTION END */

//🗃️ STEP 2: Add needed Dependencies

const SCRIPT_NAME = 'Cleanup Extra Cards'; //required

//Packages

//services
const db = require('../../services/db');
const cardContract = require('../../services/cardContract');

//🚀 STEP 3: Write the script.  Include tests for validation where possible
const run = async () => {
  const maxTokenId = parseInt(await cardContract.numTokensMinted());

  for (let i = maxTokenId; i < 10_000; i++){
    const cardId = `${i}`;
    await db.deleteDocument('cards', cardId);
    console.log(`...deleted card:${cardId}`);
  }
};



(async () => {
    console.log(`...📝   START:${SCRIPT_NAME}`);
    
    await run();

    console.log(`...📝   END:${SCRIPT_NAME}`);
    process.exit(0);
})();
