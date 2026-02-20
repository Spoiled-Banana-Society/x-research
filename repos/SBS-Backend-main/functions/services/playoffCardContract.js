require("firebase-functions/lib/logger/compat");
const ENV = require('./env');
const Web3 = require('web3');


const NETWORK = ENV.get('NETWORK');
const INFURA_PROJECT_ID = ENV.get('INFURA_PROJECT_ID');
const PROVIDER_ENDPOINT = `https://${NETWORK}.infura.io/v3/${INFURA_PROJECT_ID}`;

//const MAINNET_CARD_CONTRACT_ADDRESS = ENV.get('MAINNET_CARD_CONTRACT_ADDRESS');
const GOERLI_CARD_CONTRACT_ADDRESS = (NETWORK.toLowerCase() == 'mainnet') ? ENV.get('MAINNET_PLAYOFF_CARD_CONTRACT_ADDRESS') : ENV.get('GOERLI_PLAYOFF_CARD_CONTRACT_ADDRESS');

//const CONTRACT_ADDRESS = (NETWORK === 'mainnet') ? MAINNET_CARD_CONTRACT_ADDRESS : GOERLI_CARD_CONTRACT_ADDRESS;
const CONTRACT_ADDRESS = GOERLI_CARD_CONTRACT_ADDRESS;
//TODO: consider grabbing this contract from the source instead of hard coding it to ensure you get the latest changes
const ABI = require('../configs/playoffCardContractABI.json');
const web3 = new Web3(new Web3.providers.HttpProvider(PROVIDER_ENDPOINT)); 
const contract = new web3.eth.Contract(ABI, CONTRACT_ADDRESS);

const internals = {};

internals.getOwnerByCardId = async (tokenId)=> {

  let ownerId;

  await contract.methods.ownerOf(tokenId).call()
  .then(result => {
    ownerId = result;
  })
  .catch(err => {
    console.error(`error:${JSON.stringify(err)}`);
    ownerId = 'unassigned';
  }); 
  
  return ownerId.toLowerCase();
}

internals.numTokensMinted = async () => {
  
  let num;
  
  await contract.methods.numTokensMinted().call()
  .then(result => {
    num = result;
  })
  .catch(err => {
    console.log(`🚨error:${err}`);
  });

  return num;
}

internals.convertPaddedAddressToValidAddress = (paddedAddress) => web3.eth.abi.decodeParameter('address', paddedAddress);

/* generic web3 utils */
internals.convert = (value, currentUnits, targetUnits) => {
  if(currentUnits === targetUnits) return value;
  //dec to hex
  if(targetUnits === 'dec') return web3.utils.hexToNumberString(value);
  //hex to dec
  if(targetUnits === 'hex') return web3.utils.toHex(value);
  //ether to wei
  if(targetUnits === 'wei') return web3.utils.toWei(value, currentUnits);
  //wei to ether
  if(targetUnits === 'ether') return web3.utils.fromWei(value, targetUnits);
  return `invalid target units:${targetUnits}`;
}


module.exports = internals;