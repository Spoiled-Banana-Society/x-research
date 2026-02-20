const SCRIPT_NAME = 'Get 2025 Txs and make csv'; //required

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
async function get2025WithdrawalRequests() {
    let txnArr = [];

    const ids = await db.readAllDocumentIds('withdrawalRequests')
    if (ids.length == 0) {
        console.log("No withdrawal transactions found")
        return
    }

    for (let i = 0; i < ids.length; i++) {
        const txn = await db.readDocument('withdrawalRequests', ids[i]);
        let _date = new Date(txn.timestamp._seconds * 1000)

        // convert to PST
        _date.setHours(_date.getHours() - 7)
        if (_date.getUTCFullYear() === 2025) {
          txnArr.push(txn)
        }
    }
    console.log(txnArr.length)
    return txnArr
}

const formatDate = (timestamp) => {
  const _d = new Date(timestamp._seconds * 1000)

  return `${String(_d.getUTCMonth() + 1).padStart(2, '0')}/${String(_d.getUTCDate()).padStart(2, '0')}/${_d.getUTCFullYear()} ${String(_d.getUTCHours()).padStart(2, '0')}:${String(_d.getUTCMinutes()).padStart(2, '0')}`
}

async function groupWithdrawals(txnArr) {
  const users = {}

  for (let i=0; i < txnArr.length; i++) {
    const txn = txnArr[i]
    const _user = txn.ownerId
    if (!users[_user]) {
      users[_user] = {
        'ETH': {},
        'APE': {}
      }
    }

    if (txn.coinWithdrawn === 'ape') {
      users[_user]['APE'][txn.id] = {
        'timestamp': formatDate(txn.timestamp),
        'amount': txn.amountWithdrawn
      }
    } else {
      users[_user]['ETH'][txn.id] = {
        'timestamp': formatDate(txn.timestamp),
        'amount': txn.amountWithdrawn
      }
    }
  }

  return users
}

function generateCSVFile(txnArr) {
    if (txnArr.length == 0) {
        console.log("Length of transaction array is 0 so we are just returning")
        return
    }

    const csvData = [];
    for (let i = 0; i < txnArr.length; i++) {
        const txn = txnArr[i];
        csvData.push({ 
          receiver: txn.ownerId, 
          token_type: (txn.coinWithdrawn == "ape") ? "ape" : "eth" , 
          crypto_amount: txn.amountWithdrawn,
          date: formatDate(txn.timestamp),
          usd_amount: null
        });
    }
    const csv = parse(csvData, ["receiver","token_type","crypto_amount","date","usd_amount"]);
    fs.writeFileSync('2025WithdrawalsMissingAmounts.csv', csv, (err) => {
        if (err) {
            console.log(err)
            return
        }
        console.log('csv generated')
    });
}

(async () => {
    console.log(`...📝   START:${SCRIPT_NAME}`);
    
    const txns = await get2025WithdrawalRequests();
    // const grouped = await groupWithdrawals(txns)
    // console.log(grouped)
    await generateCSVFile(txns)

    console.log(`...📝   END:${SCRIPT_NAME}`);
    process.exit(0);
})();

