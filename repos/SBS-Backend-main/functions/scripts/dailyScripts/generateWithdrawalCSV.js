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

const SCRIPT_NAME = 'Generate CSV file with todays withdrawal requests'; //required

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
async function getValidNewWithdrawalRequests() {
    let txnArr = [];

    const ids = await db.readAllDocumentIds('withdrawalRequests')
    if (ids.length == 0) {
        console.log("No withdrawal transactions found")
        return
    }
    for (let i = 0; i < ids.length; i++) {
        const txn = await db.readDocument('withdrawalRequests', ids[i]);
        if (!txn.sentToTeam) {
            if(txn.needsW9 && !txn.hasW9) {
                continue;
            }
            if (!txn.isBlueCheckVerified) {
                continue;
            }
            txnArr.push(txn)
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
        csvData.push({ token_type: (txn.coinWithdrawn == "ape") ? "erc20" : "native" , token_address: (txn.coinWithdrawn == "ape") ? COIN_CONTRACT_ADDRESS : null, receiver: txn.ownerId, amount: txn.amountWithdrawn, id: null });
    }
    const csv = parse(csvData, ["token_type","token_address","receiver","amount","id"]);
    fs.writeFileSync('withdrawalRequests.csv', csv, (err) => {
        if (err) {
            console.log(err)
            return
        }
        console.log('csv generated')
    });
}

async function updateTxnAfterAddedToCSV(txn) {
    if (!txn) {
        console.log('txn was not defined')
        return;
    }
    txn.sentToTeam = true;
    await db.createOrUpdateDocument('withdrawalRequests', txn.id, txn, false);
    await db.createOrUpdateDocument(`owners/${txn.ownerId}/transactions`, txn.id, txn, false);
    await db.createOrUpdateDocument('transactions', txn.id, txn, false);
}

(async () => {
    console.log(`...📝   START:${SCRIPT_NAME}`);
    
    const txns = await getValidNewWithdrawalRequests();
    for(let i = 0; i < txns.length; i++) {
        console.log(txns[i])
    }
    await utils.sleep(1000)
    if (txns) {
        generateCSVFile(txns)
        for (let i = 0; i < txns.length; i++) {
            await updateTxnAfterAddedToCSV(txns[i])
        }
    }

    console.log(`...📝   END:${SCRIPT_NAME}`);
    process.exit(0);
})();

