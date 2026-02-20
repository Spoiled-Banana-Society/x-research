//PACKAGES
require("firebase-functions/lib/logger/compat");

//SERVICES
const db = require('./db');
const cardContract = require('./cardContract');
const api = require('./api');

const internals = {};

internals.update = async (startCard, endCard) => {
  if(endCard === 'end') endCard = parseInt(await cardContract.numTokensMinted());
  console.log(`...🔥   START Card Ownership V2 update between ${startCard} and ${endCard}`);
  for(let i = startCard; i < endCard; i++){
    const cardId = `${i}`;
    const _ownerId = await cardContract.getOwnerByCardId(cardId);;
    await db.createOrUpdateDocument('cards', cardId, { _ownerId: _ownerId}, true);
    console.log(`...🃏   cardId:${i} _ownerId:${_ownerId}`)
  }
  console.log(`...🔥   END Card Ownership V2 update between ${startCard} and ${endCard}`);
}

internals.transferCardOwnership = async (cardId, ownerId) => {
  console.log(`...🔁   START transferCardOwnership of cardId:${cardId} to ${ownerId}`)
  await db.createOrUpdateDocument('cards', `${cardId}`, { _ownerId: ownerId.toLowerCase() }, true);
  await db.updateSBSTotalSupply();
  await api.refreshOpenseaMetadata(cardId);
  console.log(`...🔁   END transferCardOwnership of cardId:${cardId} to ${ownerId}`)
}

// internals.restore = async (startCard, endCard) => {
//   if(endCard === 'end') endCard = parseInt(await cardContract.numTokensMinted());
//   for(let i = startCard; i < endCard; i++){
//     const cardId = `${i}`;
//     let card = await api.get(`https://us-central1-sbs-fantasy-dev.cloudfunctions.net/api/card/secret/${cardId}`);
//     card._ownerId = await cardContract.getOwnerByCardId(cardId);  
//     urlPath = card._imageUrl.split('https://storage.googleapis.com/sbs-fantasy-dev-card-images/thumbnails/')[1];
//     card._imageUrl = `https://storage.googleapis.com/sbs-fantasy-prod-card-images-1/thumbnails/${urlPath}`;
//     await db.createOrUpdateDocument('cards', cardId, card, false);
//     console.log(`...cardId:${cardId}`);
//   }
// }

internals.restoreV2 = async (startCard, endCard) => {
  if(endCard === 'end') endCard = parseInt(await cardContract.numTokensMinted());
  for(let i = startCard; i < endCard; i++){
    const cardId = `${i}`;
    let card = await api.get(`https://us-central1-sbs-fantasy-dev.cloudfunctions.net/api/card/secret/${cardId}`);
    card._ownerId = await cardContract.getOwnerByCardId(cardId);  
    card = await api.getCardImage(card);
    await db.createOrUpdateDocument('cards', cardId, card, false);
    console.log(`...cardId:${cardId}`);
  }
}

module.exports = internals;