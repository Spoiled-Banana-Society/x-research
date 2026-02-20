//PACKAGES

//SERVICES
const db = require('../../services/db');

//Running simple script below to add a free peel to production. 
//1. Ensure you are pointed prod
//2. Run
//3. Validate in firestore

const START = 8777;
const END = 9015;

(async () => {
  const freePeelObject = { _freePeel: 1};
  
  for (let i = START; i < END; i++) {
    await db.createOrUpdateDocument('cards', `${i}`, freePeelObject, true);
    console.log('...added free peel to card:', i);
  }

  process.exit(0);
})();