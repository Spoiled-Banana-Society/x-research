//✍️ STEP: 1  FILL OUT THE SCRIPT TEMPLATE BELOW

/* DESCRIPTION START:
========================

    📝 General Description:

    Assign game week string to current leagues.

    👣 Deployment Steps: node assignGameWeekToLeagues.js

    🔗 TaskLink: N/A

    📅 Date Run in sbs-fantasy-dev: //TODO: Run some point

    📅 Date Run in sbs-fantasy-prod: N/A

========================
DESCRIPTION END */

//🗃️ STEP 2: Add needed Dependencies

const SCRIPT_NAME = 'Assign Game Week'; //required

//Packages

//services
const db = require('../../services/db');
const sbs = require('../../services/sbs');


//🚀 STEP 3: Write the script.  Include tests for validation where possible
const assignGameWeekToLeagues = async () => {
  const gameWeek = '2022-REG-04' || sbs.getNFLWeekV2();
  const leagues = await db.readAllDocuments('leagues')
  for(let i = 0 ; i < leagues.length; i++){
    const leagueId = leagues[i].id
    leagues[i].gameWeek = gameWeek
    await db.createOrUpdateDocument('leagues', leagueId, leagues[i], true)
    console.log(`... updated ${leagues[i].id} successfully!`)
  }
}

(async () => {
    console.log(`...📝   START:${SCRIPT_NAME}`);
    
    await assignGameWeekToLeagues();

    console.log(`...📝   END:${SCRIPT_NAME}`);
    process.exit(0);
})();
