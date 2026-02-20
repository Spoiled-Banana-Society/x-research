const db = require('../../services/db');
const utils = require('../../services/utils');


// First portion is to be run in triggers to clean up these fields of the cards before transferring them to prod
const cleanCard = (card) => {
    card._freePeel = 0;
    card._ownerId = null;
    return card;
}

const setOwnerOnCard = async (card) => {
    const genesisCard = await db.readDocument('cards', card._cardId);
    const ownerId = genesisCard._ownerId;
    card._ownerId = ownerId;
    return card;
}

const giveCardsAway = async (min, max) => {
    let hofCardCount = 0;
    for(let i = min; i < max; i++) {
        const cardId = `${i}`;
        console.log(cardId);
        let card = await db.readDocument('playoffCards', cardId);
        if(card._level.toLowerCase() == 'hall of fame') {
            hofCardCount++;
        }
        //card = cleanCard(card);
        card = await setOwnerOnCard(card);
        await db.createOrUpdateDocument('playoffCards', cardId, card, false)
        //await db.createOrUpdateDocument(`owners/${card._ownerId}/playoffCards`, cardId, card, true)
    }
    console.log(hofCardCount)
}

(async () => {
    //await giveCardsAway(0, 1000);
    //await giveCardsAway(1000, 2000);
    //await giveCardsAway(2000, 3000);
    //await giveCardsAway(3000, 4000);
    //await giveCardsAway(4000, 5000);
    //await giveCardsAway(5000, 6000);
    //await giveCardsAway(6000, 7000);
    //await giveCardsAway(7000, 8000);
    //await giveCardsAway(8000, 9000);
    await giveCardsAway(9000, 10000);
})()



// Run this to assign playoff Cards to all current owners of the genesis cards

