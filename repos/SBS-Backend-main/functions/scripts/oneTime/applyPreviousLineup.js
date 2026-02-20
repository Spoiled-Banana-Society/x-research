//✍️ STEP: 1  FILL OUT THE SCRIPT TEMPLATE BELOW

/* DESCRIPTION START:
========================

    📝 General Description:

    Apply last week's lineup to the current week's lineup

    👣 Deployment Steps: node applyPreviousLineup.js

    🔗 TaskLink: N/A

    📅 Date Run in sbs-fantasy-dev: //TODO: Run some point

    📅 Date Run in sbs-fantasy-prod: N/A

========================
DESCRIPTION END */

//🗃️ STEP 2: Add needed Dependencies

const SCRIPT_NAME = 'Apply previously used lineup'; //required

//Packages

//services
const db = require('../../services/db');
const utils = require("../../services/utils")


//🚀 STEP 3: Write the script.  Include tests for validation where possible
const applyPreviousLineup = async () => {

    for (let j = 0; j < 10_000; j++) {
      const cardId = `${j}`
      if (!cardId) continue

      // grab previous data
      let previousLineupData = await db.readDocument(`leagues/genesis/cards/${cardId}/lineups`, '2022-REG-01')
      // garb latest data
      let latestLineupData = await db.readDocument(`/leagues/genesis/cards/${cardId}/lineups`, '2022-REG-02')

      try {
        latestLineupData.starting = previousLineupData.starting
        latestLineupData.bench = previousLineupData.bench
        await db.createOrUpdateDocument(`leagues/genesis/cards/${cardId}/lineups/`, '2022-REG-02', latestLineupData, true)
        console.log(`🍌...successfully copied lineup for ${cardId} in genesis.`)
      } catch (error) {
        console.log(`💩...failed copying lineup for ${cardId} in genesis.`)
        continue
      }
    }
  
}

(async () => {
    console.log(`...📝   START:${SCRIPT_NAME}`);
    
    await applyPreviousLineup();

    console.log(`...📝   END:${SCRIPT_NAME}`);
    process.exit(0);
})();

