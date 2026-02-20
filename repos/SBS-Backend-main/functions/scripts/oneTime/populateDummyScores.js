//✍️ STEP: 1  FILL OUT THE SCRIPT TEMPLATE BELOW

/* DESCRIPTION START:
========================

    📝 General Description:

    Populate dummy scores

    👣 Deployment Steps: node populateDummyScores.js

    🔗 TaskLink: N/A

    📅 Date Run in sbs-fantasy-dev: //TODO: Run some point

    📅 Date Run in sbs-fantasy-prod: N/A

========================
DESCRIPTION END */

//🗃️ STEP 2: Add needed Dependencies

const SCRIPT_NAME = 'Populate dummy scores'; //required

//SERVICES
const db = require("../../services/db");
const sbs = require("../../services/sbs");

// see what leagues they are in
// calculate their highest possible score with their previous card

//🚀 STEP 3: Write the script. Include tests for validation where possible
    const populateDummyScores = async () => {
    const emptyScores = sbs.getEmptyScoresDocument();
    const gameWeek = '2022-REG-02';
    await db.createOrUpdateDocument('scores', '2022-REG-02', emptyScores, true);
}


(async () => {
    console.log(`...📝   START:${SCRIPT_NAME}`);
    
    await populateDummyScores();

    console.log(`...📝   END:${SCRIPT_NAME}`);
    process.exit(0);
})();