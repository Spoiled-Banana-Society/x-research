//PACKAGES
require("firebase-functions/lib/logger/compat");
const express = require('express');
const ownerRouter = express.Router();
const { v4: uuidv4 } = require('uuid');
const web3 = require('web3');
const fetch = require("node-fetch");
const formidable = require('formidable-serverless'); 
const path = require('path');
const {Storage} = require('@google-cloud/storage');
const gc = new Storage({
  keyFilename: path.join(__dirname, '../configs/sbs-prod-env-firebase.json'),
  projectId: 'sbs-prod-env'
});
const sbs = require('../services/sbs');

//SERVICES
const env = require('../services/env');
const db = require('../services/db');
const api = require('../services/api');
const utils = require('../services/utils');
const playoffUtils = require('../services/playoffUtils');
const ownerUtils = require('../jobs/ownership');
const cardContract = require('../services/cardContract');
const cardActionContract = require('../services/cardActionContract');
const playoffCardContract = require('../services/playoffCardContract');
const playoffOwnership = require('../services/playoffOwnership');
const ownership = require('../services/ownership');
const { createOrUpdateDocument } = require("../services/db");
const weekTransition = require('../services/weekTransition');
const { FieldValue } = require("firebase-admin/firestore");

// constants
const NETWORK = env.get('NETWORK');
const SBS_WALLET = env.get('SBS_WALLET');
const COIN_CONTRACT_ADDRESS = env.get('COIN_CONTRACT_ADDRESS');
const etherscanKey = env.get('ETHERSCAN_API_KEY');
const PLAYOFFCARD_CONTRACT_ADDRESS = env.get('PLAYOFF_CARD_IMAGE_CREATOR_ENDPOINT');


/**
 * webhook takes an event sent from SBS-Ownership webhook and updates ownership accordingly
 * 
 */
// ownerRouter.post('/webhook', async (req, res) => {
//   const event = req.body;
  
//   //validation
//   if(!event.collection){
//     return res.status(400).send('...Webhook call Missing collection');
//   }

//   if(!event.cardId){
//     return res.status(400).send('...Webhook call Missing CardId');
//   }

//   if(!event.newOwner){
//     return res.status(400).send('.. Webhook call .Missing newOwner');
//   }

//   if(!event.prevOwner){
//     return res.status(400).send('... Webhook call Missing prevOwner');
//   }

//   if(event.collection != 'sbs-genesis-card' && event.collection != 'sbs-playoff-card-s1' && event.collection != "banana-best-ball-1"){
//     return res.status(400).send(`...Invalid collection:${event.collection} event recieved.`);
//   }

//   if(event.collection == 'sbs-genesis-card') {
//     //process ownership transfer event
//     await ownership.transferCardOwnership(event.cardId, event.newOwner);
//     console.log('...🔑   ownership webhook event processed:', JSON.stringify(event));
//   } else if (event.collection == 'sbs-playoff-card-s1') {
//     await playoffOwnership.transferCardOwnership(event.cardId, event.newOwner);
//     console.log('...🔑   playoffOwnership webhook event processed:', JSON.stringify(event));
//   } else if (event.collection == 'banana-best-ball-1') {
//     const token = await db.readDocument('draftTokens', event.cardId)
//     if (token) {
//       token.OwnerId = event.newOwner;
//       await db.createOrUpdateDocument('draftTokens', token.CardId, token, false)
//       console.log(`updated owner to new owner ${event.newOwner} for draft token ${token.CardId}`)
//     } 
//   }


  
//   res.send(event);
// });

/**
 * Route to test connecting with the Owner API Resource
 */
ownerRouter.get('/', (req, res) => {
  res.send('...👑 base owner route')
});

/**
 * @param {} id ownerWalletId
 * This route will return the owner Firestore corresponding to the requested owner
 */
ownerRouter.get('/:id', async (req, res) => {
  const ownerId = req.params.id.toLowerCase();
  let owner = await db.readDocument('owners', ownerId);
  const cards = await db.readAllDocuments(`owners/${ownerId}/cards`);
  const playoffCards = await db.readAllDocuments(`owners/${ownerId}/playoffCards`)

  const TAX_YEAR = new Date().getUTCFullYear().toString();

  if(!owner){
    const obj = {
      AvailableCredit: 0,
      AvailableEthCredit: 0,
      BlueCheckEmail: "",
      HasW9: {
        [TAX_YEAR]: false
      },
      IsBlueCheckVerified: false,
      Leagues: [],
      NumWithdrawals: 0,
      PendingCredit: 0,
      WithdrawnAmount: {
        [TAX_YEAR]: 0,
      }
    }
    await db.createOrUpdateDocument(`owners`, ownerId, obj, true);
  }

  //await utils.applyDefaultValues(owner, ownerId)
  
  owner.cards = cards ?? []
  owner.playoffCards = playoffCards ?? []
  owner.peels = await cardActionContract.balanceOfTokenType(ownerId, 'peel');
  owner.mashes = await cardActionContract.balanceOfTokenType(ownerId, 'mash');

  return res.send(utils.sortObject(owner));
});

ownerRouter.post('/:id/addToken', async (req, res) => {
  const ownerId = req.params.id;
  if(!ownerId) return res.status(400).send('Missing ownerWalletId.');

  const tokenType = req.body.tokenType;
  if(!tokenType) return res.status(400).send('Missing tokenType.');
  if(tokenType !== 'peel' && tokenType !== 'mash') return res.status(400).send('Invalid tokenType.');

  const tokenId = req.body.tokenId;
  if(!tokenId) return res.status(400).send('Missing tokenId.');

  const hash = req.body.hash;
  if(!hash) return res.status(400).send('Missing hash.');

  let ownerObject = await db.readDocument('owners', ownerId);
  if(!ownerObject) return res.status(404).send(`OwnerWalletId: ${ownerId} not found.`);

  if(!ownerObject.peel) ownerObject.peel = [];
  if(tokenType === 'peel') ownerObject.peel.push(tokenId);
  
  if(!ownerObject.mash) ownerObject.mash = [];
  if(tokenType === 'mash') ownerObject.mash.push(tokenId);

  ownerObject = utils.sortObject(ownerObject);
  await db.createOrUpdateDocument(`owners`, ownerId, ownerObject, true);

  //TODO: add call to owner transactions
  let txObject = {
    _hash: hash,
    createdAt: db._getTimeStamp(),
    tokenType,
    tokenId,
  }

  await db.createOrUpdateDocument(`owners/${ownerId}/transactions`, txObject._hash, txObject, true);
  txObject.createdAt = txObject.createdAt.toDate()
  res.send(txObject);
})

/**
 * @param {} id ownerWalletId
 * Returns all transactions for a connectedOwnerWalletId
 */
ownerRouter.get('/:id/transactions', async (req, res) => {
  const ownerWalletId = req.params.id.toLowerCase();
  let transactions = await db.readAllDocuments(`owners/${ownerWalletId}/transactions`);
  if(!transactions) return res.send([]);
  for(let i = 0; i < transactions.length; i++) {
    transactions[i]._createdAt = transactions[i]._createdAt.toDate();
  }
  // for (let i = 0; i < transactions.length; i++) formattedTransactions.push(await utils.formatTransactionResponse(transactions[i]));
  transactions = utils._sortArrByKey(transactions, '_createdAt');
  res.send(transactions);
});

/**
 * @param  {} ownerWalletId - owner wallet id
 * @param  {} value - deposit amount
 * Route to call once credit has been deposited into owners account.  Will trigger then Firestore onCreate Trigger function to confirm the transaction
*/
ownerRouter.post('/:ownerId/deposit/:txHash', async (req, res) => {  

  const ownerId = req.params.ownerId.toLowerCase();
  if(!ownerId) return res.status(400).send('...Missing ownerId');

  const txHash = req.params.txHash;
  if(!txHash) return res.status(400).send('...Missing txHash');


  const isDuplicate = await db.readDocument('transactions', `deposit-${txHash}`);
  if(isDuplicate)return res.status(400).send(`...txHash: deposit-${txHash} already exists`);

  //Call API to get transactions from etherscanAPI
  const txReceipt = await api.eth_getTransactionReceipt(txHash);
  const fromAddress = txReceipt.result.from.toLowerCase();
  const coinContractAddress = txReceipt.result.to;
  const toAddress = cardContract.convertPaddedAddressToValidAddress(txReceipt.result.logs[0].topics[2]);

  //Ensure tx is from ownerId
  if(ownerId != fromAddress ) return res.status(400).send('...tx invalid!  The tx fromAddress does not match ownerId.');

  //Ensure the currencyContract Address matches accepted Currency in Network
  if(COIN_CONTRACT_ADDRESS.toLowerCase() != coinContractAddress) return res.status(400).send('...tx invalid!  The tx smart contract address is not accepted by SBS');
  
  //Ensure the toAddress is the SBS_Wallet
  if(SBS_WALLET != toAddress) return res.status(400).send('...tx invalid. the tx is not being sent to valid sbs wallet address');

  const depositAmount = web3.utils.fromWei(txReceipt.result.logs[0].data);

  const owner = await db.readDocument('owners', req.params.ownerId);
  if(!owner) return res.status(400).send(`An owner object was not found for ${req.params.ownerId}`)
  await db.createOrUpdateDocument(`owners`, ownerId, { avaiableCredit: FieldValue.increment(Number(depositAmount)) })


  //TODO: write logic to record the transaction, write transaction validation logic, perfect the shape of transaction to handle all cases or switch statment or firestore triggers
  const id = `deposit-${txHash}`;
  const network = NETWORK;
  const txObject = {
    id,
    txHash,
    type: 'deposit',
    _ownerId: ownerId,  //This has to _ownerId due to what the firestore trigger is expecting. 
    fromAddress,
    toAddress,
    depositAmount,
    depositCoin: '$APE',
    prevBalance: owner.availableCredit,
    coinContractAddress,
    network,
    txReceipt, 
    createdAt: db._getTimeStamp(),
  }
  
  await createOrUpdateDocument('transactions', id, txObject, true);
  res.send(txObject);
});

ownerRouter.get('/arePeelsAndMashesOpen', async (req, res) => {
  const date = new Date();
  const day = date.getDay();
  if(day != 2 && day != 3) {
    console.log("You cannot peel a card if it is not tuesday or wednesday")
    return res.status(400).send("You cannot peel a card if it is not tuesday or wednesday")
  }

  return res.status(200).send(true)
});

/**
* @param  {} ownerWalletId - owner wallet id
* @param  {} cardId - The specifc card to roll
* This route will roll a card.  
*/
ownerRouter.post('/:ownerId/card/:cardId/peel/:peelType/tx/:tx', async (req, res) => {

  const ownerId = req.params.ownerId.toLowerCase();
  if(!ownerId) return res.status(400).send('Missing ownerId.');

  const cardId = req.params.cardId;
  if(!cardId) return res.status(400).send('Missing cardId.');

  const peelType = req.params.peelType; //free or paid
  if(!peelType) return res.status(400).send('Missing peelType.');

  if(peelType !== 'freePeel' && peelType !== 'paidPeel') return res.status(400).send('Invalid peelType.');

  const tx = req.params.tx;
  if(!tx) return res.status(400).send('Missing tx.');
  if(peelType === 'freePeel' && tx != '0') return res.status(400).send('All free peels must have a tx of 0.');

  //first check of ownership
  const prevCard = await db.readDocument(`owners/${ownerId}/cards`, cardId);
  if(!prevCard) return res.status(404).send(`cardId: ${cardId} not owned by ${ownerId}`);
  let card = {...prevCard};

  //second check of ownership
  const verifiedOwnerId = await cardContract.getOwnerByCardId(cardId);
  if(verifiedOwnerId !== ownerId) return res.status(400).send(`cardId: ${cardId} not owned by ${ownerId}`);

  if(peelType === 'freePeel' && card._freePeel < 1) return res.status(400).send(`cardId: ${cardId} has no free peels`);
  if(peelType === 'freePeel' && card._freePeel > 0) card._freePeel--;
    
  const peeledCard = await utils.peelCard(card, peelType);
  const peeledCardMetadata = await utils.convertCardToCardMetadata(peeledCard);
  let peelTransaction = {
    _tx: (peelType === 'freePeel') ? `${peelType}-${uuidv4()}` : tx,
    _ownerId: ownerId,
    _transformationType: peelType,
    _createdAt: db._getTimeStamp(),
    prevCard,
    peeledCard
  }
  
  //TODO: Push all of these into a Promise.all
  //TODO: Figure out a way for a document trigger to duplicate from the card object
  await db.createOrUpdateDocument('cards', cardId, peeledCard, false);
  await db.createOrUpdateDocument(`owners/${ownerId}/transactions`, peelTransaction._tx, peelTransaction, false)

  //only change card metadata if we are pointed to mainnet
  if(NETWORK === 'mainnet'){
    await db.createOrUpdateDocument('cardMetadata', cardId, peeledCardMetadata, false);
  }
  
  if(peelType === 'freePeel') {
    await utils.addFreePeelToSupply();
  }

  if(peelType === 'paidPeel') {
    await utils.addPaidPeelToSupply();
  }
  await utils.sleep(6000);
  //Doing the refresh at the last thing ensures that all the firestore trigger functions have already executed before forcing a refresh of the metadata
  await api.refreshOpenseaMetadata(cardId);
  res.send(peelTransaction);
});

ownerRouter.post('/:ownerId/playoffCard/:cardId/peel/:peelType/tx/:tx', async (req, res) => {

  const ownerId = req.params.ownerId.toLowerCase();
  if(!ownerId) return res.status(400).send('Missing ownerId.');

  const cardId = req.params.cardId;
  if(!cardId) return res.status(400).send('Missing cardId.');

  const peelType = req.params.peelType; //free or paid
  if(!peelType) return res.status(400).send('Missing peelType.');

  if(peelType !== 'freePeel' && peelType !== 'paidPeel') return res.status(400).send('Invalid peelType.');

  const tx = req.params.tx;
  if(!tx) return res.status(400).send('Missing tx.');
  if(peelType === 'freePeel' && tx != '0') return res.status(400).send('All free peels must have a tx of 0.');

  //first check of ownership
  const prevCard = await db.readDocument(`owners/${ownerId}/playoffCards`, cardId);
  if(!prevCard) return res.status(404).send(`cardId: ${cardId} not owned by ${ownerId}`);
  let card = await db.readDocument('playoffCards', cardId);

  //second check of ownership
  const verifiedOwnerId = await playoffCardContract.getOwnerByCardId(cardId);
  if(verifiedOwnerId !== ownerId) return res.status(400).send(`cardId: ${cardId} not owned by ${ownerId}`);

  if(peelType === 'freePeel' && card._freePeel < 1) return res.status(400).send(`cardId: ${cardId} has no free peels`);
  if(peelType === 'freePeel' && card._freePeel > 0) card._freePeel--;
    
  const peeledCard = await playoffUtils.peelCard(card, peelType);
  const peeledCardMetadata = await playoffUtils.convertPlayoffCardToCardMetadata(peeledCard);
  let peelTransaction = {
    _tx: (peelType === 'freePeel') ? `${peelType}-${uuidv4()}` : tx,
    _ownerId: ownerId,
    _transformationType: peelType,
    _createdAt: db._getTimeStamp(),
    prevCard,
    peeledCard
  }

  //TODO: Push all of these into a Promise.all
  //TODO: Figure out a way for a document trigger to duplicate from the card object
  await db.createOrUpdateDocument('playoffCards', cardId, peeledCard, false);
  await db.createOrUpdateDocument(`owners/${ownerId}/transactions`, peelTransaction._tx, peelTransaction, false)

  //only change card metadata if we are pointed to mainnet
  if(NETWORK === 'mainnet'){
    await db.createOrUpdateDocument('playoffCardMetadata', cardId, peeledCardMetadata, false);
  }
  
  if(peelType === 'freePeel') {
    await utils.addFreePeelToSupply();
  }

  if(peelType === 'paidPeel') {
    await utils.addPaidPeelToSupply();
  }
  await utils.sleep(6000);
  //Doing the refresh at the last thing ensures that all the firestore trigger functions have already executed before forcing a refresh of the metadata
  //await api.refreshPlayoffOpenseaMetadata(cardId);
  res.send(peelTransaction);
});  

/**
* @param  {} ownerWalletId - owner wallet id
* @param  {} card1 - first card parent to mash
* @param  {} card2 - second card parent to mash
* This route mashes two cards to together.  The two resultant cards will have characters from one or both cards. 
 */
ownerRouter.post('/:ownerId/card1/:card1/card2/:card2/mash/tx/:tx', async (req, res) => {

  const ownerId = req.params.ownerId.toLowerCase();
  if(!ownerId) return res.status(400).send('Missing ownerId.');

  const card1 = req.params.card1;
  if(!card1) return res.status(400).send('Missing card1.');

  const card2 = req.params.card2;
  if(!card2) return res.status(400).send('Missing card2.');

  const tx = req.params.tx;
  if(!tx) return res.status(400).send('Missing tx.');

  const prevCard1 = await db.readDocument(`owners/${ownerId}/cards`, card1);
  if(!prevCard1) return res.status(404).send(`card1: ${card1} not owned by ${ownerId}`);
  const verifiedCard1Owner = await cardContract.getOwnerByCardId(card1);
  if(verifiedCard1Owner !== ownerId) return res.status(400).send(`cardId: ${card1} not owned by ${ownerId}`);

  const prevCard2 = await db.readDocument(`owners/${ownerId}/cards`, card2);
  if(!prevCard2) return res.status(404).send(`card2: ${card2} not owned by ${ownerId}`);
  const verifiedCard2Owner = await cardContract.getOwnerByCardId(card2);
  if(verifiedCard2Owner !== ownerId) return res.status(400).send(`cardId: ${card2} not owned by ${ownerId}`);

  const mash = await utils.mashCards(prevCard1, prevCard2);
  let mashTransaction = {
    _tx: tx,
    _ownerId: ownerId,
    _transformationType: 'paidMash',
    _createdAt: db._getTimeStamp(),
    prevCard1,
    prevCard2,
    mashedCard1: mash.mashedCard1,
    mashedCard2: mash.mashedCard2
  }

  const mashCard1Metadata = await utils.convertCardToCardMetadata(mash.mashedCard1);
  const mashCard2Metadata = await utils.convertCardToCardMetadata(mash.mashedCard2);

  await db.createOrUpdateDocument('cards', card1, mash.mashedCard1, false);
  await db.createOrUpdateDocument('cards', card2, mash.mashedCard2, false);
  await db.createOrUpdateDocument(`owners/${ownerId}/transactions`, mashTransaction._tx, mashTransaction, false)


  if(NETWORK === 'mainnet'){
    await db.createOrUpdateDocument('cardMetadata', card1, mashCard1Metadata, false);
    await db.createOrUpdateDocument('cardMetadata', card2, mashCard2Metadata, false);
  }

  await utils.addPaidMashToMintStats();
  await utils.sleep(6000);
  //Doing the refresh at the last thing ensures that all the firestore trigger functions have already executed before forcing a refresh of the metadata
  await api.refreshOpenseaMetadata(card1);
  await api.refreshOpenseaMetadata(card2);
  res.send(mashTransaction);
});

/**
* @param  {} ownerWalletId - owner wallet id
* @param  {} card1 - first card parent to mash
* @param  {} card2 - second card parent to mash
* This route mashes two cards to together.  The two resultant cards will have characters from one or both cards. 
 */
ownerRouter.post('/:ownerId/playoffCard1/:card1/playoffCard2/:card2/mash/tx/:tx', async (req, res) => {
  const ownerId = req.params.ownerId.toLowerCase();
  if(!ownerId) return res.status(400).send('Missing ownerId.');

  const card1 = req.params.card1;
  if(!card1) return res.status(400).send('Missing card1.');

  const card2 = req.params.card2;
  if(!card2) return res.status(400).send('Missing card2.');

  const tx = req.params.tx;
  if(!tx) return res.status(400).send('Missing tx.');

  const prevCard1 = await db.readDocument(`owners/${ownerId}/playoffCards`, card1);
  if(!prevCard1) return res.status(404).send(`card1: ${card1} not owned by ${ownerId}`);
  const verifiedCard1Owner = await playoffCardContract.getOwnerByCardId(card1);
  if(verifiedCard1Owner !== ownerId) return res.status(400).send(`cardId: ${card1} not owned by ${ownerId}`);

  const prevCard2 = await db.readDocument(`owners/${ownerId}/playoffCards`, card2);
  if(!prevCard2) return res.status(404).send(`card2: ${card2} not owned by ${ownerId}`);
  const verifiedCard2Owner = await playoffCardContract.getOwnerByCardId(card2);
  if(verifiedCard2Owner !== ownerId) return res.status(400).send(`cardId: ${card2} not owned by ${ownerId}`);

  const mash = await playoffUtils.mashCards(prevCard1, prevCard2);
  let mashTransaction = {
    _tx: tx,
    _ownerId: ownerId,
    _transformationType: 'paidMashOnPlayoffCard',
    _createdAt: db._getTimeStamp(),
    prevCard1,
    prevCard2,
    mashedCard1: mash.mashedCard1,
    mashedCard2: mash.mashedCard2
  }

  const mashCard1Metadata = await utils.convertPlayoffCardToCardMetadata(mash.mashedCard1);
  const mashCard2Metadata = await utils.convertPlayoffCardToCardMetadata(mash.mashedCard2);

  await db.createOrUpdateDocument('playoffCards', card1, mash.mashedCard1, false);
  await db.createOrUpdateDocument('playoffCards', card2, mash.mashedCard2, false);
  await db.createOrUpdateDocument(`owners/${ownerId}/transactions`, mashTransaction._tx, mashTransaction, false)


  if(NETWORK === 'mainnet'){
    await db.createOrUpdateDocument('playoffCardMetadata', card1, mashCard1Metadata, false);
    await db.createOrUpdateDocument('playoffCardMetadata', card2, mashCard2Metadata, false);
  }

  await utils.addPaidMashToMintStats();
  await utils.sleep(6000);
  //Doing the refresh at the last thing ensures that all the firestore trigger functions have already executed before forcing a refresh of the metadata
  await api.refreshPlayoffOpenseaMetadata(card1);
  await api.refreshPlayoffOpenseaMetadata(card2);
  res.send(mashTransaction);
});

//For this route to work, the owner must prove their enter wallet address belongs to them
ownerRouter.post('/:id/claim', async (req, res) => {
  res.send('...👑 Withdraw eth credit by wallet id')
});

ownerRouter.patch('/lineups', async (req, res) => {
  try {
    await db.setGenesisLineups();
    res.status(200).send('Successfully updated');
  } catch {
    res.status(500).send('Something went wrong')
  }
});

ownerRouter.patch('/:ownerId/cards/:cardId/lineups', async (req, res) => {
  const ownerId = req.params.ownerId.toLowerCase();
  const cardId = req.params.cardId;
  const lineups = req.body;

  if (!ownerId) return res.status(400).send('Missing ownerId.');
  if(!cardId) return res.status(400).send('Missing cardId..');

  const cardOwner = await db.readDocument(`owners/${ownerId}/cards`, cardId);
  if(!cardOwner) return res.status(400).send(`cardId: ${cardId} not owned by ${ownerId}`);
  
  if (!lineups.starting) return res.status(400).send('Missing starting position.');
  if (!lineups.bench) return res.status(400).send('Missing bench position.');  

  try { 
    await db.createOrUpdateDocument(`owners/${ownerId}/cards`, cardId, {lineups}, true);
    res.send(204).send('Default lineup updated sucessfully.')
  } catch (e) {
    res.send(400).send('Failed to update.')
  }

})

ownerRouter.post('/:ownerId/withdrawal', async (req, res) => {
  let needsW9 = false;
  let email = null;

  const TAX_YEAR = new Date().getUTCFullYear().toString();

  //get request body with the values coin, amount, 
  const withdrawalObject = req.body;

  // Validate Request
  if(!withdrawalObject.coin) return res.status(400).send('...Missing coin');
  if(typeof withdrawalObject.coin != "string") return res.status(400).send('...Coin sent was not a string')
  withdrawalObject.coin = withdrawalObject.coin.toLowerCase();
  if(withdrawalObject.coin != "eth" && withdrawalObject.coin != "ape") return res.status(400).send(`...coin:${withdrawalObject.coin} not valid`);
  if(!withdrawalObject.amount) return res.status(400).send('...Missing amount');
  if(typeof withdrawalObject.amount != "number") return res.status(400).send('...Amount sent was not a number')
  if(withdrawalObject.amount <= 0) return res.status(400).send('...Amount sent was 0 or a negative number')
  

  const owner = await db.readDocument('owners', req.params.ownerId);
  if (!owner) return res.status(400).send('...No owner document was found for the ownerId passed in') 
  if (owner.IsBlueCheckVerified) {
    withdrawalObject.isBlueCheckVerified = owner.IsBlueCheckVerified;
  } else {
    owner.IsBlueCheckVerified = false
    withdrawalObject.isBlueCheckVerified = false;
  }
  isBlueCheckVerified = owner.isBlueCheckVerified;
  if(!owner.WithdrawnAmount || !owner.WithdrawnAmount[TAX_YEAR]) {
    owner.WithdrawnAmount = {
      [TAX_YEAR]: 0
    }
  }
  if(!owner.HasW9[TAX_YEAR]) {
    owner.HasW9[TAX_YEAR] = false;
  } 

  const date = new Date();
  let day = date.getUTCDate();
  let month = date.getUTCMonth();
  if (month < 10) {
    month = "0" + month.toString()
  } else {
    month = month.toString()
  }
  if (day < 10) {
    day = "0" + day.toString()
  } else {
    day = day.toString();
  }
  const year = date.getUTCFullYear().toString();
  let prevCredit;
  let prevWithdrawn = Number(owner.WithdrawnAmount[TAX_YEAR] || 0);
  if (withdrawalObject.coin.toLowerCase() == "ape") {
    return res.status(400).send(`Cannot process APE at the moment. Contact support.`)
    if (!owner.AvailableCredit) {
      owner.AvailableCredit = 0;
    }
    if (owner.AvailableCredit < withdrawalObject.amount) return res.status(400).send(`.....Does not have enough available APE to withdrawal ${withdrawalObject.amount}`)
    prevCredit = owner.availableCredit;
    let results;
    await fetch(`https://api.etherscan.io/v2/api?chainid=1&module=token&action=tokeninfo&contractaddress=0x4d224452801ACEd8B2F0aebE155379bb5D594381&apikey=${etherscanKey}`)
    .then((res) => res.json())
    .then((data) => {
      results = data;
    })
    .catch((err) => {
      throw(err)
    });
    const apePrice = parseFloat(Number(results.result[0].tokenPriceUSD).toFixed(2));
    owner.WithdrawnAmount[TAX_YEAR] = parseFloat((prevWithdrawn + (Number(withdrawalObject.amount) * apePrice)).toFixed(2));
    owner.AvailableCredit = Number(owner.AvailableCredit) - withdrawalObject.amount;
  } else if (withdrawalObject.coin.toLowerCase() == "eth") {
    if (!owner.AvailableEthCredit) {
      console.log("Resetting available eth to 0")
      owner.AvailableEthCredit = 0;
    }
    console.log(owner.AvailableEthCredit)
    if (owner.AvailableEthCredit < withdrawalObject.amount) return res.status(400).send(`.....Does not have enough available ETH to withdrawal ${withdrawalObject.amount}`)
    prevCredit = owner.AvailableEthCredit;
    let results;
    await fetch(`https://api.etherscan.io/v2/api?chainid=1&module=stats&action=ethprice&apikey=${etherscanKey}`)
    .then((res) => res.json())
    .then((data) => { results = data; })
    .catch((err) => {
      throw(err)
    });
    const ethPrice = Number(results.result.ethusd)
    console.log(ethPrice)
    owner.WithdrawnAmount[TAX_YEAR] = parseFloat((prevWithdrawn + Number(withdrawalObject.amount) * ethPrice).toFixed(2));
    owner.AvailableEthCredit = Number(owner.AvailableEthCredit) - withdrawalObject.amount;
  }
  
  if (owner.WithdrawnAmount[TAX_YEAR] >= 600 && !owner.HasW9[TAX_YEAR]) {
    needsW9 = true;
  }
  if(!owner.NumWithdrawals) {
    owner.NumWithdrawals = 0;
  }
  owner.NumWithdrawals += 1;

  const withdrawalTxn = {
    id: "withdrawal-" + req.params.ownerId + "-" + withdrawalObject.amount + "-" + withdrawalObject.coin + "-" + owner.NumWithdrawals,
    ownerId: req.params.ownerId,
    timestamp: date,
    amountWithdrawn: Number(withdrawalObject.amount),
    coinWithdrawn: withdrawalObject.coin,
    currentBalance: (withdrawalObject.coin == "ape") ? owner.AvailableCredit : owner.AvailableEthCredit,
    prevBalance: prevCredit,
    newTotalWithdrawnByOwner: Number(owner.WithdrawnAmount[TAX_YEAR]),
    oldTotalWithdrawnByOwner: prevWithdrawn,
    isBlueCheckVerified: owner.IsBlueCheckVerified,
    needsW9: needsW9,
    hasW9: owner.HasW9[TAX_YEAR],
    sentToTeam: false,
    type: "withdrawal"
  }
  await db.createOrUpdateDocument('transactions', withdrawalTxn.id, withdrawalTxn, false)
  await db.createOrUpdateDocument('withdrawalRequests', withdrawalTxn.id, withdrawalTxn, false)
  await db.createOrUpdateDocument('owners', req.params.ownerId, owner, true)
  await db.createOrUpdateDocument(`owners/${req.params.ownerId}/transactions`, withdrawalTxn.id, withdrawalTxn, false)
  
  if (owner.IsBlueCheckVerified) {
    email = owner.BlueCheckEmail;
  }
  let infoHash;
  if(owner.infoHash) {
    infoHash = owner.infoHash;
  }

  res.status(200).send({ email: email, infoHash: infoHash, needsW9: needsW9, isBlueCheckVerified: owner.IsBlueCheckVerified, hasW9: owner.HasW9[TAX_YEAR], txnId: withdrawalTxn.id });
})

// req object should look like { isBlueCheckVerified: , email: }
ownerRouter.post('/:ownerId/withdrawal/isBlueCheck', async (req, res) => {
  const data = req.body;
  // validate request 
  if (data.isBlueCheckVerified == null) return res.status(400).send('...isBlueCheckVerified field was not included in the request');
  const owner = await db.readDocument('owners', req.params.ownerId)
  if (!owner) return res.status(400).send(`...No owner document was found for ${req.params.ownerId}`)

  if (data.email) {
    owner.BlueCheckEmail = data.email;
    if (data.isBlueCheckVerified == true) {
      owner.IsBlueCheckVerified = true;
    }
    await db.createOrUpdateDocument('owners', req.params.ownerId, owner, false)
    console.log(`Updated ${req.params.ownerId}'s email for blue check verification`)
  }
  const tx = {
    txId: 'verification' + uuidv4(),
    createdAt: db._getTimeStamp(),
    ownerId: req.params.ownerId,
    isBlueCheckVerified: owner.IsBlueCheckVerified,
    wasSuccess: owner.IsBlueCheckVerified,
    email: owner.BlueCheckEmail,
    type: 'verification'
  }
  await db.createOrUpdateDocument(`owners/${req.params.ownerId}/transactions`, tx.txId, tx, false)
  await db.createOrUpdateDocument(`transactions`, tx.txId, tx, false)

  res.send(tx);
});

/**
* @param  {} ownerId - owner wallet id
* This route will return all deposits and pending/completed withdrawal requests.  
*/
ownerRouter.get('/:ownerId/history', async (req, res) => {
  const ownerId = req.params.ownerId.toLowerCase();
  if(!ownerId) return res.status(400).send('Missing ownerId');

  const transactions = await db.readAllDocumentIds(`owners/${ownerId}/transactions`);
  const completedWithdrawals = [];
  const pendingWithdrawals = [];
  const deposits = [];

  for(let i = 0; i < transactions.length; i++) {
    const txId = transactions[i];
    const tx = await db.readDocument(`owners/${ownerId}/transactions`, txId)
    if(tx.type && tx.type == 'deposit') {
      deposits.push({ txId: txId, amount: tx.depositAmount, coin: tx.depositCoin })
    } else if (tx.type && tx.type == 'withdrawal') {
      if(tx.sentToTeam == true) {
        completedWithdrawals.push({ txId: txId, amount: tx.amountWithdrawn, coin: tx.coinWithdrawn })
      } else if(tx.sentToTeam == false) {
        pendingWithdrawals.push({ txId: txId, amount: tx.amountWithdrawn, coin: tx.coinWithdrawn })
      }
    }
  }
  const result = {
    completedWithdrawals: completedWithdrawals,
    pendingWithdrawals: pendingWithdrawals,
    deposits: deposits
  }
  res.send(result)
});

/**
* @param  {} ownerId - owner wallet id
* @param  {} txId - tx Id for withdrawal request 
* This route will cancel a pending withdrawal request.  
*/
ownerRouter.post('/:ownerId/withdrawal/:txId/cancel', async (req, res) => {
  const ownerId = req.params.ownerId.toLowerCase();
  const TAX_YEAR = new Date().getUTCFullYear().toString();
  if(!ownerId) return res.status(400).send('... Missing OwnerId');

  const txId = req.params.txId;
  if(!txId) return res.status(400).send('... Missing tx Id');

  const tx = await db.readDocument(`owners/${ownerId}/transactions`, txId);
  if(!tx) return res.status(400).send(`... No transaction object was found for ${txId}`)
  if(tx.sentToTeam == undefined || tx.sentToTeam == true) return res.status(400).send(`.... this transaction has already been sent to the team to process and cannot be cancelled`)

  const owner = await db.readDocument('owners', ownerId);
  if(!owner) return res.status(400).send('... No owner object was found for this ownerId');

  if(tx.coinWithdrawn && tx.coinWithdrawn == "ape") {
    owner.AvailableCredit = Number(owner.AvailableCredit) + Number(tx.amountWithdrawn);
  } else if(tx.coinWithdrawn && tx.coinWithdrawn == "eth") {
    owner.AvailableEthCredit = Number(owner.AvailableEthCredit) + Number(tx.amountWithdrawn);
  }
  owner.WithdrawnAmount[TAX_YEAR] = Number(owner.WithdrawnAmount[TAX_YEAR] || 0) - (tx.newTotalWithdrawnByOwner - tx.oldTotalWithdrawnByOwner);
  owner.NumWithdrawals--;
  await db.createOrUpdateDocument('owners', ownerId, owner, false);
  console.log('Updated owners credits by adding back the amount Withdrawn to their total balance');
  await db.deleteDocument('transactions', txId)
  await db.deleteDocument(`owners/${ownerId}/transactions`, txId)
  await db.deleteDocument(`withdrawalRequests`, txId)
  console.log('Deleted document for cancelled withdrawal request with txId: ' + txId)

  res.send({ didCancelRequest: true })
})

ownerRouter.post('/:ownerId/submitW9', async (req, res, next) => {
  const ownerId = req.params.ownerId.toLowerCase();
  const TAX_YEAR = new Date().getUTCFullYear().toString();
  if(!ownerId) return res.status(400).send('... Missing OwnerId');

  const owner = await db.readDocument('owners', ownerId);
  if(!owner) return res.status(400).send('... No owner object was found for this ownerId');

  console.log('start of upload endpoint')
  const form = new formidable.IncomingForm();
  const firstName = req.query.firstName;
  const lastName = req.query.lastName;
  const fileName = `1099-${TAX_YEAR}/` + firstName.toUpperCase() + "_" + lastName.toUpperCase() + "_" + req.params.ownerId.toLowerCase() + ".pdf";
  if(typeof firstName != "string" || firstName == null) return res.status(400).send('... THE NAME SENT WAS NOT A STRING OR WAS NULL')
  if(typeof lastName != "string" || lastName == null) return res.status(400).send('... THE NAME SENT WAS NOT A STRING OR WAS NULL')
  return form.parse(req, async function(err, fields, files) {
    try {
      const bucketName = 'sbs-prod-env.appspot.com';
      const filePath = files.w9.path;
      if(files.w9.type != "application/pdf") {
        console.log("this is the type it has")
        console.log(files.w9.type)
        return res.status(400).send('... File is not a pdf');
      }
      console.log(files.w9.type)
      const res = await gc.bucket(bucketName)
          .upload(filePath, { destination: fileName })
          .catch(err => {
            console.log(`Something went wrong with file upload: ${err}`)
            return res.status(400).send('error in uploading file')
          });

      const updatedRecord = owner.HasW9 ? {...owner.HasW9} : {}
      updatedRecord[TAX_YEAR] = true
      await db.createOrUpdateDocument('owners', req.params.ownerId, { HasW9: updatedRecord }, true)

    } catch (err) {
      console.log(err)
      return false;
    }
    
    return res.status(200).send({ wasSuccessful: true});
  });
  // console.log("wasProblem: " + wasProblem)
  // if(wasProblem === true) {
  //   console.log("Made it in here because file was not pdf")
  //   return res.status(400).send('... The file sent was not a pdf')
  // } else {
  //   return res.status(200).send('Uploaded W9 for' + req.params.ownerId);
  // }  
});

ownerRouter.post('/:ownerId/playoffCards/:cardId/mint', async (req, res) => {
  const ownerId = req.params.ownerId;
  const cardId = req.params.cardId;
  await utils.sleep(8000);
  //validation 
  const card = await db.readDocument('playoffCards', cardId)
  if(!card) {
    console.log('No card found returning 400');
    return res.status(400).send('This card was not found')
  }

  if(!ownerId) {
    console.log('No owner Id was found');
    return res.status(400).send('No owner Id was found in route');
  }
  
  let owner = await db.readDocument('owners', ownerId);
  if(!owner) {
    console.log('No owner object was found')
    owner = {
      availableCredit: 0,
      leagues: [],
      pendingCredit: 0,
    }
    await db.createOrUpdateDocument(`owners`, ownerId, owner, true);
  }

  card._ownerId = ownerId;
  const metadata = await playoffUtils.convertPlayoffCardToCardMetadata(card);
  await db.createOrUpdateDocument('playoffCardMetadata', cardId, metadata, false)
  await db.createOrUpdateDocument('playoffCards', cardId, card, true)
  await utils.sleep(1000)
  await api.refreshPlayoffOpenseaMetadata(Number(cardId))
  console.log('Updated our metadata and updated opensea metadata')

  await db.createOrUpdateDocument(`owners/${ownerId}/playoffCards`, cardId, card, false)
  owner.Leagues.push({ cardId: cardId, league: 'minted-playoffs-2022-2023' })
  await db.createOrUpdateDocument('owners', ownerId, owner, false)
  console.log('Added playoff card to owners playoff Card collection and added the playoffs league to their owner object')

  const gameweek = '2022-PST-01';
  const now = db._getTimeStamp()
  const lineup = {
    starting: {
      QB: [card.rosterWithTeams.QB[0]],
      RB: [card.rosterWithTeams.RB[0], card.rosterWithTeams.RB[1]],
      WR: [card.rosterWithTeams.WR[0], card.rosterWithTeams.WR[1], card.rosterWithTeams.WR[2]],
      TE: [card.rosterWithTeams.TE[0]],
      DST: [card.rosterWithTeams.DST[0]],
    },
    bench: {
      QB: [card.rosterWithTeams.QB[1]],
      RB: [card.rosterWithTeams.RB[2], card.rosterWithTeams.RB[3]],
      WR: [card.rosterWithTeams.WR[3], card.rosterWithTeams.WR[4]],
      TE: [card.rosterWithTeams.TE[1]],
      DST: [card.rosterWithTeams.DST[1]],
    } ,
    _cardId: card._cardId,
    _ownerId: card._ownerId,
    _isLocked: false, 
    _isDefault: true,
    _isSetByCurrentOwner: false,
    _createdAt: now,
    _updatedAt: now,
    gameWeek: gameweek,
    prevWeekSeasonScore: 0,
    scoreWeek: 0,
    scoreSeason: 0,
  }
  lineup.startingTeamArr = weekTransition.createTeamStartingArrayForLineup(lineup)

  await db.createOrUpdateDocument('leagues/minted-playoffs-2022-2023/cards', cardId, card, false);
  await db.createOrUpdateDocument(`leagues/minted-playoffs-2022-2023/cards/${cardId}/lineups`, gameweek, lineup, false);
  await db.createOrUpdateDocument(`leagues/genesis-playoff-league/cards`, cardId, card, true);
  await db.createOrUpdateDocument(`leagues/genesis-playoff-league/cards/${cardId}/lineups`, gameweek, lineup, true);
  console.log(`Added Card: ${cardId} to playoffs league and created a default lineup`)

  const leaderboardObject = {
    card: card,
    lineup: lineup,
    scoreWeek: 0,
    scoreSeason: 0,
    cardId: cardId,
    level: card._level,
    ownerId: ownerId,
  }
  await db.createOrUpdateDocument(`mintedPlayoffs2022Leaderboard/${gameweek}/cards`, cardId, leaderboardObject, true)
  await db.createOrUpdateDocument(`genesisPlayoffsLeaderboard/${gameweek}/cards`, cardId, leaderboardObject, true)
  console.log(`Created playoffs leaderboard object for card: ${cardId}`)

  const txId = `playoff-card-mint-${ownerId}-${cardId}`;
  const tx = {
    txId: txId,
    card: card,
    cardId: cardId,
    level: card._level,
    ownerId: ownerId,
    type: "playoffCardMint"
  }
  await db.createOrUpdateDocument('transactions', txId, tx, false)
  await db.createOrUpdateDocument(`owners/${ownerId}/transactions`, txId, tx, false)
  console.log(`Created mint transaction for txId: ${txId}`)

  res.send({ mintSuccess: true })
});

ownerRouter.get('/actions/getGameweeks', async (req, res) => {
  const currentGameweek = sbs.getNFLWeekV2();
  const split = currentGameweek.split('-');
  const weekNum = Number(split[1]);
  const dataArr = [];
  let weekString;
  for(let i = weekNum; i > 3; i--) {
    const weekNum = i;
    if (weekNum < 10) {
      weekString = `2023REG-0${i}`
    } else {
      weekString = `2023REG-${i}`;
    }

    dataArr.push(weekString)
  }

  let result = {
    currentWeek: currentGameweek,
    gameweeks: dataArr,
  }

  res.status(200).send(result)
});

module.exports = ownerRouter;
