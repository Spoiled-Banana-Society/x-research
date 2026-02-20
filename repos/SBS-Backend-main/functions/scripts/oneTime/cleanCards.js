//✍️ STEP: 1  FILL OUT THE SCRIPT TEMPLATE BELOW

/* DESCRIPTION START:
========================

    📝 General Description:

    Clean up cards in dev by removing all cards that do not exist in the dev Environment

    👣 Deployment Steps: node cleanCards.js

    🔗 TaskLink: N/A

    📅 Date Run in sbs-fantasy-dev: //TODO: Run some point

    📅 Date Run in sbs-fantasy-prod: N/A

========================
DESCRIPTION END */

//🗃️ STEP 2: Add needed Dependencies

const SCRIPT_NAME = 'Clean Cards'; //required

//Packages

//services
const db = require('../../services/db');
const cardContract = require('../../services/cardContract');


//🚀 STEP 3: Write the script.  Include tests for validation where possible
const cleanCards = async () => {
  const cardIds = await db.readAllDocumentIds('cards');
  for(let i = 0; i < cardIds.length; i++){
    const cardId = cardIds[i];
    const ownerId = await cardContract.getOwnerByCardId(cardId);
    if(ownerId === 'unassigned'){
      await db.deleteDocument('cards', cardId);
    }
  }
}

(async () => {
    console.log(`...📝   START:${SCRIPT_NAME}`);
    
    await cleanCards();

    console.log(`...📝   END:${SCRIPT_NAME}`);
    process.exit(0);
})();
