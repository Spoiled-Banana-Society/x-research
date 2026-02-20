//✍️ STEP: 1  FILL OUT THE SCRIPT TEMPLATE BELOW

/* DESCRIPTION START:
========================

    📝 General Description:

    Removing owners that do not exist in dev.

    👣 Deployment Steps: node cleanOwners.js

    🔗 TaskLink: N/A

    📅 Date Run in sbs-fantasy-dev: 8/29/2022

    📅 Date Run in sbs-fantasy-prod: N/A

========================
DESCRIPTION END */

//🗃️ STEP 2: Add needed Dependencies

const SCRIPT_NAME = 'Clean Owners'; //required

//Packages

//services
const db = require('../../services/db');
const cardContract = require('../../services/cardContract');


//🚀 STEP 3: Write the script.  Include tests for validation where possible
const cleanOwners = async () => {
  //get current owners
  const maxToken = parseInt(await cardContract.numTokensMinted());
  const currentOwnerSet = new Set();
  for (let i = 0; i < maxToken; i++) {
    const cardId = `${i}`;
    const ownerId = await cardContract.getOwnerByCardId(cardId);
    currentOwnerSet.add(ownerId);
  }
  
  const ownerIds = await db.readAllDocumentIds('owners');
  
  for(let i = 0; i < ownerIds.length; i++){
    const ownerId = ownerIds[i]; 
    if(!currentOwnerSet.has(ownerId)){
      await db.recursiveDelete('owners', ownerId);
      console.log(`...➖ Removed ownerId:${ownerId}`)
    }
  }
};


(async () => {
    console.log(`...📝   START:${SCRIPT_NAME}`);
    
    await cleanOwners();

    console.log(`...📝   END:${SCRIPT_NAME}`);
    process.exit(0);
})();
