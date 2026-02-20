
const cardContractService = require('../../services/cardContract');
const dbService = require('../../services/db');
const utils = require('../../services/utils');



(async () => {
  const START = parseInt((await cardContractService.numTokensMinted()));
  const END = 10_000;
  const hofCards = [8170, 9787, 8955, 9376, 7942, 8611, 8820, 8548, 9578, 9462, 8608, 8207, 8620, 9181, 9983, 9601, 8540, 9126, 9602, 9385, 9764, 8282, 8727, 9041];

  for (let i = START; i < END; i++) {
    const cardId = `${i}`;
    let card = await dbService.readDocument('cards', cardId);
    newCard = utils._sortObject(await utils.shuffleTeam(card));
    if(hofCards.includes(parseInt(cardId))){
      newCard._level = 'Hall of Fame';
      console.log('...Hall of Fame');
    }
    await dbService.createOrUpdateDocument('cards', cardId, newCard, false);
    console.log(`...cardId:${cardId}`);
  }

  console.log(`numHof:${numHof}`);
  console.log(`numCards:${numCards}`);

  process.exit(0);
})();