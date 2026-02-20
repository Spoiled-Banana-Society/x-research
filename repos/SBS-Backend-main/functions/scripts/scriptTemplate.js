//✍️ STEP: 1  FILL OUT THE SCRIPT TEMPLATE BELOW

/* DESCRIPTION START:
========================

    📝 General Description:

    The intent of the script is to demo use of the script template.  Why we need this script will be included here and 
    an other relevant details. 

    👣 Deployment Steps: node scriptTemplate.js

    🔗 TaskLink: Trello Link Here

    📅 Date Run in sbs-fantasy-dev:

    📅 Date Run in sbs-fantasy-prod:

========================
DESCRIPTION END */

//🗃️ STEP 2: Add needed Dependencies

const SCRIPT_NAME = 'Script Template'; //required

//Packages

//services
const db = require('../services/db');


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
