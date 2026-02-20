const fs = require('fs');
const db = require('../../../functions/services/db');
const utils = require('../../../functions/services/utils');

let card;
(async () => {
  const rawCards = fs.readFileSync('./cards-4-22-20-22.json');
  const cards = JSON.parse(rawCards);

  for (let i = 0; i < 1; i++) {
    card = cards[i];
    card.QB = [card.QB1, card.QB2].sort();
    card.RB = [card.RB1, card.RB2, card.RB3, card.RB4].sort();
    card.WR = [card.WR1, card.WR2, card.WR3, card.WR4, card.WR5].sort();
    card.TE = [card.TE1, card.TE2].sort();
    card.DST = [card.DST1, card.DST2].sort();
    card._teamHash = utils.getTeamHash(card);
    delete card['QB1'];
    delete card['QB2'];
    delete card['RB1'];
    delete card['RB2'];
    delete card['RB3'];
    delete card['RB4'];
    delete card['WR1'];
    delete card['WR2'];
    delete card['WR3'];
    delete card['WR4'];
    delete card['WR5'];
    delete card['TE1'];
    delete card['TE2'];
    delete card['DST1'];
    delete card['DST2'];
    await db.createOrUpdateDocument('cards', card._cardId, card, false);
    console.log(`...Card:${card._cardId} created. `);
  }
  
  
  


  process.exit(0);
})();