const sbsUtils = require("../../services/sbs");
const utils = require("../../services/utils");
const db = require("../../services/db");
const web3Utils = require("../services/web3-utils");
const dstScoring = require("../services/dst-scoring-utils");
const fs = require("fs");
const {Storage} = require('@google-cloud/storage');
const gc = new Storage({
    keyFilename: 'serviceAccount.json',
    projectId: 'sbs-fantasy-prod'
  });



  let card;


  (async () => {

    

    const numTokens = parseInt(await web3Utils.numTokensMinted());

    for (let i = 0; i < numTokens; i++) {
      
      card = await db.readDocument('cards', i.toString());

      delete card.lastTouched;

      await db.createOrUpdateDocument('cards', i.toString(), card, false);
    }


    
    process.exit(0);
  })();



