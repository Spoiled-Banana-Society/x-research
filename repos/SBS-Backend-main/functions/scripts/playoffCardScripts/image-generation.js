const Web3 = require('web3');
require("firebase-functions/lib/logger/compat");
const internals = {};
const fetch = require('node-fetch');
const ENV = require('../../services/env');
const { defineBoolean } = require('firebase-functions/v2/params');
const ETHERSCAN_API_KEY = ENV.get('ETHERSCAN_API_KEY');
const NETWORK = ENV.get('NETWORK');
const PLAYOFF_CARD_IMAGE_CREATOR_ENDPOINT = ENV.get('PLAYOFF_CARD_IMAGE_CREATOR_ENDPOINT');
const JEFF_SBS_METADATA_API = ENV.get('JEFF_SBS_METADATA_API');
const CARD_CONTRACT_ADDRESS = (NETWORK === 'mainent') ? ENV.get('MAINNET_CARD_CONTRACT_ADDRESS') : ENV.get('RINKEBY_CARD_CONTRACT_ADDRESS');
const ETHERSCAN_BASE_URL = ENV.get('ETHERSCAN_BASE_URL');
const db = require('../../services/db');
const playoffUtils = require('../../services/playoffUtils');
const { ApiError } = require('@google-cloud/storage/build/src/nodejs-common');
const api = require('../../services/api');

const getCardImage = async (card) => {
    const body = {card};
    const options = {
      method: 'POST',
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' }
    };
    console.log(PLAYOFF_CARD_IMAGE_CREATOR_ENDPOINT)
    const res = await fetch(PLAYOFF_CARD_IMAGE_CREATOR_ENDPOINT, options);
    const json = await res.json();
    if(!json) console.error(json);
    return json;
}

(async () => {
    const card = await db.readDocument('playoffCards', '1')
    const metadata = playoffUtils.convertPlayoffCardToCardMetadata(card);
    await db.createOrUpdateDocument('playoffCardMetadata', '1', metadata, false)
    const newCard = await getCardImage(card)
    await db.createOrUpdateDocument('playoffCards', '300', newCard, false)
    console.log(newCard)
})()

// const generateImagesForCards = async (min, max) => {
//   for(let i = min; i < max; i++) {
//     const cardId = `${i}`;
//     console.log(cardId)
//     const card = await db.readDocument('playoffCards', cardId);
//     const newCard = await getCardImage(card);
//     await db.createOrUpdateDocument('playoffCards', cardId, newCard, false)
//     console.log('generated image for ' + cardId);
//   }
// }

(async () => {
  //await generateImagesForCards(0, 1000);
  //await generateImagesForCards(1000, 2000);
  //await generateImagesForCards(2822, 3000);
  //await generateImagesForCards(3000, 4000);
  //await generateImagesForCards(4000, 5000);
  //await generateImagesForCards(5000, 6000);
  await generateImagesForCards(6582, 7000);
  //await generateImagesForCards(7000, 8000);
  //await generateImagesForCards(8000, 9000);
  //await generateImagesForCards(9000, 10000);
})()
