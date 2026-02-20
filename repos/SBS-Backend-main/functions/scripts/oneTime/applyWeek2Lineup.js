//✍️ STEP: 1  FILL OUT THE SCRIPT TEMPLATE BELOW

/* DESCRIPTION START:
========================

    📝 General Description:

    Apply last week's lineup to the current week's lineup

    👣 Deployment Steps: node applyWeek2Lineup.js

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


//🚀 STEP 3: Write the script.  Include tests for validation where possible
const getParticipatingLeagues = async () => {

  const list = [
    253,
    259,
    479,
    587,
    1758,
    1858,
    1877,
    2812,
    3505,
    3607,
    3627,
    3673,
    4770,
    5125,
    5201,
    5831,
    6066,
    6072,
    6316,
    6326,
    6389,
    6393,
    6410,
    6439,
    6548,
    6563,
    6815,
    6835,
    6883,
    6884,
    6959,
    7159,
    7331,
    7530,
    7656,
    7764,
    7929,
    8232,
    8270,
    8550,
    9363,
    9396,
    9439,
    9538,
    9563,
    9900,
  ]

  let leagueIds = await db.readAllDocuments('leagues')
  for (let i = 0; i < leagueIds.length; i++) {
    const league = await db.readDocument('leagues', i.toString)
    console.log('league: ', league)
  }

    // for(card in list){
    //   const cardId = list[card]
    //   if (!cardId) continue
    //   // grab previous data
    //   //let previousLineupData = await db.readDocument(`leagues/genesis/cards/${cardId}/lineups`, '2022-REG-02')
    //   // grab latest data
    //   //let latestLineupData = await db.readDocument(`/leagues/genesis/cards/${cardId}/lineups`, '2022-REG-03')

    //   try {
    //     latestLineupData.starting = previousLineupData.starting
    //     latestLineupData.bench = previousLineupData.bench
    //     await db.createOrUpdateDocument(`leagues/genesis/cards/${cardId}/lineups/`, '2022-REG-03', latestLineupData, true)
    //     console.log(`🍌...successfully copied lineup for ${cardId} in genesis.`)
    //   } catch (error) {
    //     console.log(`💩...failed copying lineup for ${cardId} in genesis.`)
    //     continue
    //   }
    // }
  
}

(async () => {
    console.log(`...📝   START:${SCRIPT_NAME}`);
    
    await getParticipatingLeagues();

    console.log(`...📝   END:${SCRIPT_NAME}`);
    process.exit(0);
})();

