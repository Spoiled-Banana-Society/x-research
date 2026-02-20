const db = require('../../../functions/services/db');
const utils = require('../../../functions/services/utils');
const cardContract = require('../../../functions/services/cardContract');

(async () => {
  const owners = await db.readAllDocuments('owners');
  for (let i = 0; i < owners.length; i++) {

  }


  const cards = await db.readAllDocuments('cards');
  for (let i = 0; i < cards.length; i++) {
    let card = cards[i];
    delete card._ownerWalletId;
    card._ownerId = await cardContract.getOwnerByCardId(card._cardId);
    card._isMinted = card._ownerId != 'unassigned' ? true : false;
    card._updatedAt = new Date().toISOString();
    console.log(card);
    await db.createOrUpdateDocument('cards', card._cardId, card, false);
    await db.createOrUpdateDocument(`owners/${card._ownerId}/cards`, card._cardId, card, false);
  }

})();