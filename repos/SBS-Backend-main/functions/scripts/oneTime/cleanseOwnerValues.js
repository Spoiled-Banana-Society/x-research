//✍️ STEP: 1  FILL OUT THE SCRIPT TEMPLATE BELOW

/* DESCRIPTION START:
========================

    📝 General Description:

    Script to assign default values

    1. Grab every existing owner
    2. Check to see if they have the required default values
    3. If missing, assign the default value

    👣 Deployment Steps: node addPromoLeague.js

    📅 Date Run in sbs-fantasy-dev: CANNOT BE RUN IN DEV.  not enough cards

    📅 Date Run in sbs-fantasy-prod:

========================
DESCRIPTION END */

//🗃️ STEP 2: Add needed Dependencies

const SCRIPT_NAME = 'Assign default values'; //required

//Packages

//services
const db = require('../../services/db');
const cardContract = require('../../services/cardContract');
const cardActionContract = require('../../services/cardActionContract');

//🚀 STEP 3: Write the script.  Include tests for validation where possible
const assignDefaultValues = async () => {
    let ownerId
    const maxTokenId = parseInt(await cardContract.numTokensMinted())

    for(let i=0; i<maxTokenId; i++){

        const cardId = `${i}`
        ownerId = await cardContract.getOwnerByCardId(cardId)
        let owner = await db.readDocument('owners', ownerId)

        if(owner.availableCredit === undefined){
            console.log(`🍌 Assigning available credit for ${ownerId}`)
            let availableCredit = { availableCredit: 0 }
            await db.createOrUpdateDocument('owners', ownerId, availableCredit, true)
        }

        if(owner.pendingCredit === undefined){
            console.log(`🍌 Assigning pending credit for ${ownerId}`)
            let pendingCredit = { pendingCredit: 0 }
            await db.createOrUpdateDocument('owners', ownerId, pendingCredit, true)
        }

        if(owner.peels === undefined){
            console.log(`🍌 Assigned peel count for ${ownerId}`)
            let peels = { peels: await cardActionContract.balanceOfTokenType(ownerId, 'peel')}
            await db.createOrUpdateDocument('owners', ownerId, peels, true)
        }

        if(owner.mashes === undefined){
            console.log(`🍌 Assigned mash count for ${ownerId}`)
            let mashes = { mashes: await cardActionContract.balanceOfTokenType(ownerId, 'mash')}
            await db.createOrUpdateDocument('owners', ownerId, mashes, true)
        }
        
        // It runs but does not save for some reason
        // if(owner.league){
        //     console.log(`🍌 Removing errorenous league array for ${ownerId}`)
        //     delete owner.league
        //     await db.createOrUpdateDocument('owners', ownerId, owner, true)
        // }
    }
};

(async () => {
    console.log(`...📝   START:${SCRIPT_NAME}`);
    await assignDefaultValues();
    console.log(`...📝   END:${SCRIPT_NAME}`);
    process.exit(0);
})();
