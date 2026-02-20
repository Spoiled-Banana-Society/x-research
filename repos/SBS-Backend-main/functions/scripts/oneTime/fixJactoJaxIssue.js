//PACKAGES

//SERVICES
const cardContract = require('../../services/cardContract');
const db = require('../../services/db');


(async () => {

  const START = 8932;
  const END = 10_000;

  for(let i = START; i < END; i++){
    let numJac = 0;
    const cardId = `${i}`;
    const card = await db.readDocument('cards', cardId);
    const isJACPresent = card._teamHash.search('JAC') != -1 ? true : false
    if(isJACPresent){
      console.log(card);
      numJac++;
    }
  }

  process.exit(0);
})();