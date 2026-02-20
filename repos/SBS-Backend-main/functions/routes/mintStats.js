require("firebase-functions/lib/logger/compat");
const db = require('../services/db');
const cardContract = require('../services/cardContract');
const utils = require('../services/utils');

const express = require('express');
const mintStatsRouter = express.Router();

mintStatsRouter.get('/', async (req, res) => {

  let mintStats = await db.readDocument('supply', 'main');
  mintStats.cards.minted = parseInt(await cardContract.numTokensMinted());
  mintStats.cards.remaining = mintStats.cards.total - mintStats.cards.minted;
  let sortedMintStats = {
    cards: utils.sortObject(mintStats.cards),
    freePeels: utils.sortObject(mintStats.freePeels),
    paidPeels: utils.sortObject(mintStats.paidPeels),
    paidMashes: utils.sortObject(mintStats.paidMashes),
  }
  await db.createOrUpdateDocument('supply', 'main', sortedMintStats, true);
  res.send(sortedMintStats);

});

module.exports = mintStatsRouter;