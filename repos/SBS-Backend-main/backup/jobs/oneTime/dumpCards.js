
const db = require('../../../functions/services/db');
const utils = require('../../../functions/services/utils');
const cardContract = require('../../../functions/services/cardContract');
const fs = require('fs');

/**
 *This Script will dump all cards into a json file stored on backup folder on the developers machine. 
 *This is for migration and developer use only.  Its pretty costly so should avoid doing this alot. 
 */
(async () => {
  let cards = [];
  let card ;
  let cardId;
  let cardObject;
  let maxMintedToken = await cardContract.numTokensMinted();
  for (let i = 0; i < 10_000; i++) {
    cardId = i.toString();
    card = await db.readDocument('cards', cardId);
    cardObject = {
      _cardId: cardId,
      _isMinted: (i < parseInt(maxMintedToken)) ? true : false,
      _level: card.level,
      QB1: card.attributes.find(x => x.trait_type === 'QB1').value,
      QB2: card.attributes.find(x => x.trait_type === 'QB2').value,
      RB1: card.attributes.find(x => x.trait_type === 'RB1').value,
      RB2: card.attributes.find(x => x.trait_type === 'RB2').value,
      RB3: card.attributes.find(x => x.trait_type === 'RB3').value,
      RB4: card.attributes.find(x => x.trait_type === 'RB4').value,
      WR1: card.attributes.find(x => x.trait_type === 'WR1').value,
      WR2: card.attributes.find(x => x.trait_type === 'WR2').value,
      WR3: card.attributes.find(x => x.trait_type === 'WR3').value,
      WR4: card.attributes.find(x => x.trait_type === 'WR4').value,
      WR5: card.attributes.find(x => x.trait_type === 'WR5').value,
      TE1: card.attributes.find(x => x.trait_type === 'TE1').value,
      TE2: card.attributes.find(x => x.trait_type === 'TE2').value,
      DST1: card.attributes.find(x => x.trait_type === 'DST1').value,
      DST2: card.attributes.find(x => x.trait_type === 'DST2').value,
    }

    cardObject.QB1 = (cardObject.QB1 === 'OAK') ? 'LV' : cardObject.QB1;
    cardObject.QB2 = (cardObject.QB2 === 'OAK') ? 'LV' : cardObject.QB2;
    cardObject.RB1 = (cardObject.RB1 === 'OAK') ? 'LV' : cardObject.RB1;
    cardObject.RB2 = (cardObject.RB2 === 'OAK') ? 'LV' : cardObject.RB2;
    cardObject.RB3 = (cardObject.RB3 === 'OAK') ? 'LV' : cardObject.RB3;
    cardObject.RB4 = (cardObject.RB4 === 'OAK') ? 'LV' : cardObject.RB4;
    cardObject.WR1 = (cardObject.WR1 === 'OAK') ? 'LV' : cardObject.WR1;
    cardObject.WR2 = (cardObject.WR2 === 'OAK') ? 'LV' : cardObject.WR2;
    cardObject.WR3 = (cardObject.WR3 === 'OAK') ? 'LV' : cardObject.WR3;
    cardObject.WR4 = (cardObject.WR4 === 'OAK') ? 'LV' : cardObject.WR4;
    cardObject.WR5 = (cardObject.WR5 === 'OAK') ? 'LV' : cardObject.WR5;
    cardObject.TE1 = (cardObject.TE1 === 'OAK') ? 'LV' : cardObject.TE1;
    cardObject.TE2 = (cardObject.TE2 === 'OAK') ? 'LV' : cardObject.TE2;
    cardObject.DST1 = (cardObject.DST1 === 'OAK') ? 'LV' : cardObject.DST1;
    cardObject.DST2 = (cardObject.DST2 === 'OAK') ? 'LV' : cardObject.DST2;

    cardObject.QB1 = (cardObject.QB1 === 'JAX') ? 'JAC' : cardObject.QB1;
    cardObject.QB2 = (cardObject.QB2 === 'JAX') ? 'JAC' : cardObject.QB2;
    cardObject.RB1 = (cardObject.RB1 === 'JAX') ? 'JAC' : cardObject.RB1;
    cardObject.RB2 = (cardObject.RB2 === 'JAX') ? 'JAC' : cardObject.RB2;
    cardObject.RB3 = (cardObject.RB3 === 'JAX') ? 'JAC' : cardObject.RB3;
    cardObject.RB4 = (cardObject.RB4 === 'JAX') ? 'JAC' : cardObject.RB4;
    cardObject.WR1 = (cardObject.WR1 === 'JAX') ? 'JAC' : cardObject.WR1;
    cardObject.WR2 = (cardObject.WR2 === 'JAX') ? 'JAC' : cardObject.WR2;
    cardObject.WR3 = (cardObject.WR3 === 'JAX') ? 'JAC' : cardObject.WR3;
    cardObject.WR4 = (cardObject.WR4 === 'JAX') ? 'JAC' : cardObject.WR4;
    cardObject.WR5 = (cardObject.WR5 === 'JAX') ? 'JAC' : cardObject.WR5;
    cardObject.TE1 = (cardObject.TE1 === 'JAX') ? 'JAC' : cardObject.TE1;
    cardObject.TE2 = (cardObject.TE2 === 'JAX') ? 'JAC' : cardObject.TE2;
    cardObject.DST1 = (cardObject.DST1 === 'JAX') ? 'JAC' : cardObject.DST1;
    cardObject.DST2 = (cardObject.DST2 === 'JAX') ? 'JAC' : cardObject.DST2;

    cardObject._teamHash = utils.getTeamHash(cardObject);
    cards.push(cardObject);
  }

  fs.appendFileSync('cards-4-22-2022.json', cards, err => {
    if (err) {
      console.error(err)
      return process.exit(1);
    } else {
      console.log('...Redis data from backup written to file!');
      process.exit(0);
    }
  })

})();