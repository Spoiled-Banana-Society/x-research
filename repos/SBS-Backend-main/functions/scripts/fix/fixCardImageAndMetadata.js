const db = require('../../services/db');
const utils = require('../../services/utils');
const api = require('../../services/api');

(async () => {
    const cardIds = [  '2905', '2906', '2907', '7880', '7881', '7882', '7883', '7884', '7885',  '7886', '7887', '7888',  '7889'];
    const cardsMissingImages = [];
    for(let i = 0; i < cardIds.length; i++) {
        const cardId = cardIds[i];
        // const card = await db.readDocument('cards', cardId);
        // const newCard = await api.getCardImage(card)
        // await db.createOrUpdateDocument('cards', cardId, newCard, false)
        // console.log('Created new card image for ' + cardId)
        // const sbsCardMetadata = await utils.convertCardToCardMetadata(newCard);
        // await db.createOrUpdateDocument('cardMetadata', cardId, sbsCardMetadata, true);
        // console.log(`...➕   cardMetadata updated for cardId:${cardId}`)
        await api.refreshOpenseaMetadata(cardId);
    }
})();