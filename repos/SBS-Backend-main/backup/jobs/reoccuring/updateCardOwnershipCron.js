//running this will update cardOwnership of all cards in firebase.  Should be run often as seams fesible.
import db from "../../services/db.js";
import web3Utils from "../../services/web3.js";

(async () => {

  let tokenId;

  //Ensure you have the right: 
  for (let i = 0; i < 6000; i++) {
    tokenId = i.toString();
    await db.updateDocument('cards', tokenId, { _ownerWalletId:  await web3Utils.getOwnerByCardId(i) });
  }
  
  process.exit(0);
})();