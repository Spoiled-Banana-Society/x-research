const db = require('../../../functions/services/db');
const utils = require('../../../functions/services/utils');
const sbsWeb3Utils = require('../../../functions/services/web3');
const fs = require('fs');
const path = require('path');

(async () => {

  const dirpath = path.join(__dirname, "../../final_metadata");
  fs.readdir(dirpath, async (err, files) =>{
    if (err) return console.log('Unable to scan directory: ' + err);
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const rawMetaData = fs.readFileSync(path.join(dirpath, file), 'utf8');
      const metaData = JSON.parse(rawMetaData);
      await db.createOrUpdateDocument('cardMetadata', file, metaData, true); 
      console.log(`...${file}:card metadata added to firebase`);
    }
  });

  
})();