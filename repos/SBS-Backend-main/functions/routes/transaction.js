//PACKAGES
require("firebase-functions/lib/logger/compat");
const express = require('express');
const txRouter = express.Router();

//SERVICES
const env = require('../services/env');
const db = require('../services/db');
const secure = require('../services/secure');

//CONSTANTS
const PASSPHRASE = env.get('PASSPHRASE');


//TODO: pagination, filtering, sorting, date range etc
txRouter.get('/', async (req, res) => {
  const txs = await db.readAllDocumentIds('transactions');
  return res.send(txs);
});

txRouter.get('/:id', async (req, res) => {
  const txId = req.params.id;
  if(!txId) return res.status(400).send('Missing transaction id');
  const tx = await db.readDocument('transactions', txId);
  return res.send(db._sortObject(tx));
});

module.exports = txRouter;