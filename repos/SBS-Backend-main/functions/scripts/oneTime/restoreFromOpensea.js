
const api = require('../../services/api');
const env = require('../../services/env');
const utils = require('../../services/utils');
const cardContract = require('../../services/cardContract');
const db = require('../../services/db');

(async () => {


  const NODE_ENV = env.get('NODE_ENV');

  if(NODE_ENV === 'prod') throw new Error(`...⛔   NODE_ENV:${NODE_ENV}  !!!!STOPPING TO PREVENT OVERRIDE OF PROD!!!!`) 

  const CARD_CONTRACT_ADDRESS =  env.get('RINKEBY_CARD_CONTRACT_ADDRESS');

  //API for getting how many are in the collect. 
  const collectionStats = await api.get('https://testnets-api.opensea.io/api/v1/collection/sbs-genesis-card/stats');
  const cardSupply = collectionStats.stats.total_supply;

  for (let i = 0; i < cardSupply; i++) {
    await utils.sleep(1000);
    const cardId = `${i}`;
    const asset = await api.get(`https://testnets-api.opensea.io/api/v1/asset/${CARD_CONTRACT_ADDRESS}/${cardId}/`);
    const assetTraits = asset.traits;
    const imageUrl = asset.image_url;
    const ownerId = await cardContract.getOwnerByCardId(cardId);
    const card = await utils.convertAssetTraitsToCard(cardId, assetTraits, imageUrl, ownerId);
    await db.createOrUpdateDocument('cards', cardId, card, false);
    console.log(`...🪄   cardId:${cardId} restored for ownerId${ownerId}`);
  }
  
  process.exit(0);
})();