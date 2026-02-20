require("firebase-functions/lib/logger/compat");
const db = require('../services/db');
const cardContract = require('../services/cardContract');

const internals = {};

internals.updateV1 = async (startCard, endCard) => {
  console.log(`...🔥   START Card Ownership V1 update between ${startCard} and ${endCard}`);
  
  if(endCard === 'end'){
    endCard = parseInt(await cardContract.numTokensMinted());
  }

  for(let i = startCard; i < endCard; i++){
    const cardId = `${i}`;
    const ownerId = (await cardContract.getOwnerByCardId(cardId)).toLowerCase();
    let card = await db.readDocument('cards', cardId);
    const prevOwner = card._ownerId.toLowerCase();
    if(ownerId != prevOwner){
      await db.deleteDocument(`owners/${prevOwner}/cards`, cardId)
    }
    card._ownerId = ownerId;
    await db.createOrUpdateDocument('cards', cardId, card, false)
    await db.createOrUpdateDocument(`owners/${ownerId}/cards`, cardId, card, false)
    console.log(`...updated cardId:${cardId} to ownerId:${ownerId}`)
  }
  console.log(`...🔥   END Card Ownership V1 update between ${startCard} and ${endCard}`);
}

internals.updateV2 = async (startCard, endCard) => {
  console.log(`...🔥   START Card Ownership V2 update between ${startCard} and ${endCard}`);
  for(let i = startCard; i < endCard; i++){
    const cardId = `${i}`;
    let card = await db.readDocument('cards', cardId);
    delete card.ownerId;
    card._ownerId = await cardContract.getOwnerByCardId(cardId);;
    await db.createOrUpdateDocument('cards', cardId, card, false);
    console.log(`...🃏   cardId:${i} _ownerId:${_ownerId}`)
  }
  console.log(`...🔥   END Card Ownership V2 update between ${startCard} and ${endCard}`);
}

internals.transferCardOwnership = async (cardId, newOwner, prevOwner) => {
  newOwner = newOwner.toLowerCase();
  prevOwner = newOwner.toLowerCase();
  const nullAddress = '0x0000000000000000000000000000000000000000';
  await db.createOrUpdateDocument('cards', `${cardId}`, { _ownerId: newOwner }, true);
  console.log(`...update card:${cardId} to ownerId: ${newOwner}`);
  if (prevOwner != nullAddress) {
    await db.deleteDocument(`owners/${prevOwner}/cards`, `${cardId}`);
    console.log(`...remove cardId:${cardId} from previous owner:${prevOwner}`)
  }
  const newOwnerExists = await db.readDocument('owners', `${newOwner}`);
  if (!newOwnerExists) {
    console.log(`...for card:${cardId} creating new ownerId:${newOwner}`)
    await db.createOrUpdateDocument('owners', `${newOwner}`, {availableCredit: 0, pendingCredit: 0, peels: 0, mashes: 0}, false);
  }
  const card = await db.readDocument('cards', `${cardId}`);
  await db.createOrUpdateDocument(`owners/${newOwner}/cards`, `${cardId}`, card, true);
  console.log(`...add cardId:${cardId} to ownerId:${newOwner}`)
}

module.exports = internals;