
//app dependencies
const db = require('../services/db');
const utils = require('../services/utils');
const cardContract = require('../services/cardContract');

//validate that the token is being passed and the team for that token exists
module.exports = async (req, res, next) => {
  console.log('...checkTokenExists middleware called');

  const tokenId = req.body._tokenId;
  if(!tokenId) return res.status(404).send('Token is missing');
  
  const currentTeam = await db.readDocument('cards', tokenId.toString());
  if(utils.isObjectEmpty(currentTeam)) return res.status(404).send(`Team with tokenId: ${tokenId} not found`);
  

  const ownerWalletId = req.body._ownerWalletId;
  if(!ownerWalletId) return res.status(404).send('Owner wallet id is missing');
  
  const validatedOwnerWallet = await cardContract.getOwnerByCardId(tokenId);

  if(validatedOwnerWallet != ownerWalletId) {
    await db.updateDocument('cards', tokenId.toString(), { _ownerWalletId: validatedOwnerWallet });
    return res.status(400).send(`Actual Owner of tokenId ${tokenId} does not match passed owner of ${ownerWalletId}`)
  }

  req.res.locals.currentTeam = currentTeam;

  next();
};