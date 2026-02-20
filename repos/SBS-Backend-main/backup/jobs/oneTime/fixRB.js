//running this will update cardOwnership of all cards in firebase.  Should be run often as seams fesible.
import db from "../../services/db.js";

(async () => {

  let tokenId;
  let card;
  let teamId;
  let positionLabel;
  //Ensure you have the right: 
  for (let i = 0; i < 10_000; i++) {
    tokenId = i.toString();

    card = await db.readDocument('cards', tokenId);

    teamId = card.startingLineup[2].teamId;
    positionLabel = card.startingLineup[2].positionLabel;

    delete card.startingLineup[2].team;
    card.startingLineup[2].teamPosition = `${teamId} ${positionLabel}`
    
    await db.createOrUpdateDocument('cards', tokenId, card);

  }
  
  process.exit(0);
})();