import db from "../../services/db.js";

let lowBoundCardId = 0;
let highBoundCardId = 10_000;
let numHallOfFameCards = 100;
const collectionName = "cards";
let teamCards = [];
for (let i = lowBoundCardId; i <= highBoundCardId; i++) {
    teamCards.push(i);
}

  function* shuffle(...array) {
    let i = array.length;

    while (i--) {
      yield array.splice(Math.floor(Math.random() * (i + 1)), 1)[0];
    }
  }


(async () => {

  let randomCard = shuffle(...teamCards);
  let currentCardId;
  let updatedCard;
  

  for (let i = 0; i < numHallOfFameCards; i++) {

    currentCardId = randomCard.next().value.toString();

    updatedCard = await db.readDocument('cards', currentCardId);

    updatedCard.attributes[15].value = "Hall of Fame";
    updatedCard.level = 'Hall of Fame';
    

    await db.updateDocument(
      collectionName, 
      currentCardId, 
      updatedCard
      );
  }

  console.log("...🏆  Hall of Fame successfully Set!");
  process.exit(0);

})();