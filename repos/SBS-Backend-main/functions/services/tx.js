//PACKAGES
require("firebase-functions/lib/logger/compat");
const Web3 = require('web3');

//SERVICES
const ENV = require('./env');
const db = require('./db');

// const ETH_ENV = ENV.get('NETWORK');
// const INFURA_PROJECT_ID = ENV.get('INFURA_PROJECT_ID');
// const web3 = new Web3(new Web3.providers.HttpProvider(`https://${ETH_ENV}.infura.io/v3/${INFURA_PROJECT_ID}`));

const internals = {};

internals.createSBSTx = async (txData) => {
const transaction = {
    id: `${txData.type}-${txData._txHash}`,
    ownerId: txData.ownerId,
    type: txData.type,
    isOnChain: txData.isOnChain,
    network: txData.network,
    etherscanUrl: internals.getEtherscanUrl(txData),
    isConfirmed: txData.isOnChain ? false : null,
    timestamp: db._getTimeStamp(),
    metadata: txData.metadata
  }
  await db.createOrUpdateDocument('transactions', transaction.id, transaction, true);
  await db.createOrUpdateDocument(`owners/${transaction.ownerId}/transactions`, transaction.id, transaction, true)
  console.log(`...➕   ADD TX:${transaction.id}`);
}

internals.getEtherscanUrl = (txData) => {
  if(!txData.isOnChain) return null;
  if(txData.network === 'mainnet') return `https://etherscan.io/tx/${txData._txHash}`;
  if(txData.network === 'rinkeby') return `https://rinkeby.etherscan.io/tx/${txData._txHash}`;
  return null;
}



module.exports = internals;