//✍️ STEP: 1  FILL OUT THE SCRIPT TEMPLATE BELOW

/* DESCRIPTION START:
========================

    📝 General Description:

    Get winners from week 1 and 2 and fetch their current lineups

    👣 Deployment Steps: node getPreviouewWinners.js

    🔗 TaskLink: https://trello.com/c/yrLs3Y5b

    📅 Date Run in sbs-fantasy-dev:

    📅 Date Run in sbs-fantasy-prod:

========================
DESCRIPTION END */

//🗃️ STEP 2: Add needed Dependencies

const SCRIPT_NAME = 'Get previous winners'; //required

//Packages

//services
const db = require('../../services/db');
const utils = require('../../services/utils');
const sbs = require('../../services/sbs');


//🚀 STEP 3: Write the script.  Include tests for validation where possible
const getPreviousWinners = async () => {
    const gameWeek = '2022-REG-03'
    for(let i = 0; i < 10000; i++){
        const cardNo = [i].toString()
        const card = await db.readDocument('cards', cardNo)
        if(card.prizes && card.prizes.eth){
            const lineup = await db.readDocument(`leagues/genesis/cards/${cardNo}/lineups/`, gameWeek)
            console.log(`🍌 lineup for Card ${cardNo} 🍌`)
            console.log('QB: ', lineup.starting.QB[0])
            console.log('RB: ', lineup.starting.RB[0])
            console.log('RB: ', lineup.starting.RB[1])
            console.log('WR: ', lineup.starting.WR[0])
            console.log('WR: ', lineup.starting.WR[1])
            console.log('WR: ', lineup.starting.WR[2])
            console.log('TE: ', lineup.starting.TE[0])
            console.log('DST: ', lineup.starting.DST[0])
            console.log('...')
            console.log(`🪑 bench for Card ${cardNo} 🪑`)
            console.log('QB: ', lineup.bench.QB[0])
            console.log('RB: ', lineup.bench.RB[0])
            console.log('RB: ', lineup.bench.RB[1])
            console.log('WR: ', lineup.bench.WR[0])
            console.log('WR: ', lineup.bench.WR[1])
            console.log('TE: ', lineup.bench.TE[0])
            console.log('DST: ', lineup.bench.DST[0])
        }
    }
};

(async () => {
    console.log(`...📝   START:${SCRIPT_NAME}`);
    await getPreviousWinners()
    console.log(`...📝   END:${SCRIPT_NAME}`);
    process.exit(0);
})();
