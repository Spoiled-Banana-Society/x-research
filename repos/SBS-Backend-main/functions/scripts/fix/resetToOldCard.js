const db = require('../../services/db');
const utils = require('../../services/utils');
const api = require('../../services/api');

(async () => {
    const cardId = '1244';
    const txId = 'freePeel-b7347135-39c7-4327-8ccc-d6027733747e'
    const txPath = 'owners/0xa6f0830fee0888ced178961619bfb12266a3c681/transactions'
    const tx = await db.readDocument(txPath, txId);
    const ogTeam = tx.prevCard;
    const newCard = await api.getCardImage(ogTeam)
    await db.createOrUpdateDocument('cards', cardId, newCard, false)
    console.log('Created new card image for ' + cardId)
    const sbsCardMetadata = await utils.convertCardToCardMetadata(newCard);
    await db.createOrUpdateDocument('cardMetadata', cardId, sbsCardMetadata, true);
    console.log(`...➕   cardMetadata updated for cardId:${cardId}`)
    await api.refreshOpenseaMetadata(cardId);
})();