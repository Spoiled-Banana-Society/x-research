//✍️ STEP: 1  FILL OUT THE SCRIPT TEMPLATE BELOW

/* DESCRIPTION START:
========================

    📝 General Description:

    Find all the cards that were affected by the bad peel/mash that happened on 9/13.

    👣 Deployment Steps: node findAffectedBadPeelMash.js

    🔗 TaskLink: N/A

    📅 Date Run in sbs-fantasy-dev: //TODO: Run some point

    📅 Date Run in sbs-fantasy-prod: N/A

========================
DESCRIPTION END */

//🗃️ STEP 2: Add needed Dependencies

const SCRIPT_NAME = 'Get rewards for genesis cards'; //required

//Packages
const { parse } = require('json2csv');
const fs = require('fs');

//services
const db = require('../../services/db');
const cardContract = require('../../services/cardContract');
const utils = require('../../services/utils');
const env = require('../../services/env');
const COIN_CONTRACT_ADDRESS = env.get('COIN_CONTRACT_ADDRESS');


//🚀 STEP 3: Write the script. Include tests for validation where possible
async function getPrizesFromGenesisCards() {
    let txnArr = [];

    const cardIds = await db.readAllDocumentIds('cards')
    if (cardIds.length == 0) {
        console.log("Could not read cards")
        return
    }
    for (let i = 0; i < cardIds.length; i++) {
        const card = await db.readDocument('cards', cardIds[i]);
        if (card.prizes) {
            Object.keys(card.prizes).forEach(coinReward => {
                txnArr.push({
                    'cardId': cardIds[i],
                    'owner': card._ownerId,
                    'coinReward': coinReward,
                    'amount': card.prizes[coinReward]
                })
            })
        }
    }
    console.log(txnArr.length)
    return txnArr
}

function generateCSVFile(txnArr) {
    if (txnArr.length == 0) {
        console.log("Length of transaction array is 0 so we are just returning")
        return
    }

    const csvData = [];
    for (let i = 0; i < txnArr.length; i++) {
        const txn = txnArr[i];
        csvData.push({ token_type: txn.coinReward, owner: txn.owner, amount: txn.amount, cardId: txn.cardId });
    }
    const csv = parse(csvData, ["token_type","owner","amount","cardId"]);
    fs.writeFileSync('genesisRewards.csv', csv, (err) => {
        if (err) {
            console.log(err)
            return
        }
        console.log('csv generated')
    });
}

// async function updateTxnAfterAddedToCSV(txn) {
//     if (!txn) {
//         console.log('txn was not defined')
//         return;
//     }
//     txn.sentToTeam = true;
//     await db.createOrUpdateDocument('withdrawalRequests', txn.id, txn, false);
//     await db.createOrUpdateDocument(`owners/${txn.ownerId}/transactions`, txn.id, txn, false);
//     await db.createOrUpdateDocument('transactions', txn.id, txn, false);
// }

(async () => {
    console.log(`...📝   START:${SCRIPT_NAME}`);
    
    const txns = await getPrizesFromGenesisCards();
    await utils.sleep(1000)
    if (txns) {
        generateCSVFile(txns)
    }

    console.log(`...📝   END:${SCRIPT_NAME}`);
    process.exit(0);
})();

