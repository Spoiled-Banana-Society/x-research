//✍️ STEP: 1  FILL OUT THE SCRIPT TEMPLATE BELOW

/* DESCRIPTION START:
========================

    📝 General Description:

    We need to add a default lineup for everyone.  The global default lineup ensures that all players get entered into the genesis league and can be scored with something. 
    It also will lay the ground work for owners to set default lines for themeselves. 

    👣 Deployment Steps: node addGlobalDefaultLIneup.js

    🔗 TaskLink: Trello Link Here

    📅 Date Run in sbs-fantasy-dev:

    📅 Date Run in sbs-fantasy-prod:

========================
DESCRIPTION END */

//🗃️ STEP 2: Add needed Dependencies

const SCRIPT_NAME = 'Add Global Default Lineup'; //required

//Packages

//services
const db = require('../../services/db');


//🚀 STEP 3: Write the script.  Include tests for validation where possible
const readACardDemo = async () => {
    const cardId = '5';
    const card = await db.readDocument('cards', cardId);
    console.log(card);
};

(async () => {
    console.log(`...📝   START:${SCRIPT_NAME}`);
    
    await readACardDemo();

    console.log(`...📝   END:${SCRIPT_NAME}`);
    process.exit(0);
})();
