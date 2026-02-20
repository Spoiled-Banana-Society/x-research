//PACKAGES

//SERVICES
const db = require('../../services/db');
const api = require('../../services/api');


(async () => {
  
  for(let i= 0; i < 10; i++){
    const cardId = `${i}`;
    let card = await api.getJsonFromUrl(`https://us-central1-sbs-fantasy-prod.cloudfunctions.net/api/card/${cardId}`);
    card = await api.getCardImage(card);
    await db.createOrUpdateDocument('cards', cardId, card, true);
    console.log(`...cardId:${cardId} restored from new prod`);
  }

  process.exit(0);
})();