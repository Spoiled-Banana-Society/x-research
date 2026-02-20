//TODO: BUILD A RESTORE SCRIPT THAT WILL TAKE AN EMPTY ENVIRONMENT AND GET EVERYTHING IN PLACE BASED UPON THE NETWORK ITS IN
//The items above are a one time restore script.  Other things will need to be done to restore new environments in the future. Needs to be automated at some point
//PACKAGES


//SERVICES
const envService = require('../../services/env');
const dbService = require('../../services/db');
const cardContractService = require('../../services/cardContract');
const cardActionContractService = require('../../services/cardActionContract');
const apiService = require('../../services/api');
const { jeffMetadataApi } = require('../../services/api');


(async () => {
  const RESTORE_SOURCE_ENDPOINT = envService.get('SBS_DEV_API');
  const START = 0; 
  const END = 10_000;
  for (let i = START; i < END; i++) {
    //Doing this to force a proper update of metadata
    const cardId = `${i}`;
    let card =  await apiService.getJsonFromUrl(`${RESTORE_SOURCE_ENDPOINT}/card/${cardId}?type=secret`);
    card._ownerId = await cardContractService.getOwnerByCardId(cardId);  
    urlPath = card._imageUrl.split('https://storage.googleapis.com/sbs-fantasy-dev-card-images/thumbnails/')[1];
    card._imageUrl = `https://storage.googleapis.com/sbs-fantasy-prod-card-images-1/thumbnails/${urlPath}`;
    await dbService.createOrUpdateDocument('cards', cardId, card, false);
    console.log(`...cardId:${cardId}`);
    // const cardId = `${i}`;
    
    // //The trigger should take care of everything else
    // await dbService.createOrUpdateDocument('cards', cardId, card, false);
    // console.log(`...⛏️   CardId:${i} added for ownerId:${ownerId}` );     
  }

  process.exit(0);
})();
