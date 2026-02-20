//✍️ STEP: 1  FILL OUT THE SCRIPT TEMPLATE BELOW

/* DESCRIPTION START:
========================

    📝 General Description:

    Apply last week's lineup to the current week's lineup

    👣 Deployment Steps: node getParticipatingLeagues.js

    🔗 TaskLink: N/A

    📅 Date Run in sbs-fantasy-dev: //TODO: Run some point

    📅 Date Run in sbs-fantasy-prod: N/A

========================
DESCRIPTION END */

//🗃️ STEP 2: Add needed Dependencies

const SCRIPT_NAME = 'Get participating leagues'; //required

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

  let leagueIds = await db.readAllDocumentIds('leagues')
  for (let i = 0; i < leagueIds.length; i++) {
    const league = await db.readDocument('leagues', leagueIds[i])
    if(league.id === 'genesis') return
    for(card in list){
      const participatingCard = await db.readDocument(`leagues/${league.id}/cards`, list[card].toString())
      if(participatingCard){
        console.log(`Card ${list[card]} is participating in ${league.id}`)
        const lineup = await db.readDocument(`leagues${league.id}/cards/${list[card].toString()}/lineups`, '2022-REG-03')
        console.log(lineup.starting)
        console.log('...')
        console.log(lineup.bench)
      }
    }
  }
  
}

(async () => {
    console.log(`...📝   START:${SCRIPT_NAME}`);
    
    await getParticipatingLeagues();

    console.log(`...📝   END:${SCRIPT_NAME}`);
    process.exit(0);
})();

