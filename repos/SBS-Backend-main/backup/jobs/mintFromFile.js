
import fs from "fs";
import db from "../services/db.js";

let card;

(async () => {

  fs.readFile('./backup/sbsdata.json', 'utf8', async (err, data) => {

    if (err) {
        console.log(`Error reading file from disk: ${err}`);
    } else {

        // parse JSON string to JSON object
        const jsonData = await JSON.parse(data);
      
        for (let i = 5008; i < 5129; i++) {
          card = jsonData[i];
          card._tokenId = i.toString();
          await db.createOrUpdateDocument('cards', card._tokenId, card);
        }
        
        process.exit(0);
    }

});

})();