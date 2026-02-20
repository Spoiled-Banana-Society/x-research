//PACKAGES
require("firebase-functions/lib/logger/compat");
const express = require('express');
const supplyRouter = express.Router();

//SERVICES
const envService = require('../services/env');
const dbService = require('../services/db');
const cardContractService = require('../services/cardContract');
const cardActionService = require('../services/cardActionContract');
const utils = require('../services/utils');


supplyRouter.get('/', async (req, res) => {

  const CARDS_MINTED = parseInt(await cardContractService.numTokensMinted());
  let supply = await dbService.readDocument('supply', 'main');  
  supply.cards.minted = CARDS_MINTED;
  supply.cards.remaining = 10_000 - CARDS_MINTED;

  //sortObject is used for ensuring the order of the key values doesn't change between calls.
  supply.cards = utils.sortObject(supply.cards)
  supply.freePeels = utils.sortObject(supply.freePeels);
  supply.paidPeels = utils.sortObject(supply.paidPeels);
  supply.paidMashes = utils.sortObject(supply.paidMashes);
  res.send(utils.sortObject(supply));
});

module.exports = supplyRouter;