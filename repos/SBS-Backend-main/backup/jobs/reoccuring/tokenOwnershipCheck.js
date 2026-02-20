//This script will let us know if there is something wrong in the code with token assignment.  
//The number of unassigned tokens + the number of owned tokens in the db should always equal 10_000;

import web3Utils from '../../services/web3-utils.js';
import db from '../../services/db.js';

(async () => {
  

  const unassigned = await db.unassignedTokens();
  const owned = await web3Utils.numTokensMinted();

  console.log(`unassigned: ${unassigned.length}`);
  console.log(`owned: ${owned}`);
  console.log(`unassigned + owned: ${parseInt(unassigned.length) + parseInt(owned)}`);


  process.exit(0);
})();