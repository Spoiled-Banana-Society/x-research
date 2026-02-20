//PACKAGES
require("firebase-functions/lib/logger/compat");
const express = require('express');
const referralRouter = express.Router();
const { v4: uuidv4 } = require('uuid');

//SERVICES
const env = require('../services/env');
const db = require('../services/db');
const utils = require('../services/utils');
const secure = require('../services/secure');
const { ref } = require("firebase-functions/v1/database");


//CONSTANTS
const PASSPHRASE = env.get('PASSPHRASE');


//TODO: pagination, filtering, sorting, date range etc
referralRouter.post('/', async (req, res) => {

  let referralObject = req.body;

  const referralCode = referralObject.referralCode ? referralObject.referralCode.toLowerCase() : 'none';
  if(!referralObject.ownerId) return res.status(400).send('...Missing ownerId');
  const ownerId = referralObject.ownerId.toLowerCase();
  
  if(!referralObject.type) return res.status(400).send('...Missing type'); 
  if(referralObject.type.toLowerCase() != 'card')return res.status(400).send(`...Missing or invalid referral type:${referralObject.type}`);
  const referralType = referralObject.type.toLowerCase();
  
  if(!referralObject.mintCount || referralObject.mintCount < 1) return res.status(400).send('...Missing mintCount or mintCount is less than 1');
  const referralMintCount = parseInt(referralObject.mintCount);

  const referralRecordId = uuidv4();
  referralObject.createdAt = db._getTimeStamp();

  let referral = await db.readDocument('referrals', referralCode);
  
  //Track Referral
  if(!referral){
    referral = {
      cardReferralCount : 0,
      cardsMinted: 0
    };
  }

  if(referralCode != 'none'){
    referral.cardReferralCount += referralMintCount;
  } 

  referral.cardsMinted = referral.cardsMinted + referralMintCount;
  await db.createOrUpdateDocument(`referrals`, referralCode, referral, true);
  
  referralObject.referralRecordId = referralRecordId;
  await db.createOrUpdateDocument(`referrals/${referralCode}/records`, referralRecordId, referralObject, true);

  //Track cards minted by ownerId
  let owner = await db.readDocument('owners', ownerId);
  if(!owner || !owner.cardsMinted){
    owner = {
      cardsMinted: 0
    }
  }
  owner.cardsMinted = owner.cardsMinted + referralMintCount;
  await db.createOrUpdateDocument('owners',  ownerId, owner, true);

  res.send(db._sortObject(referralObject));
});

referralRouter.get('/', (req, res) => {
  res.send('get all referral')
});

referralRouter.get('/:id', (req, res) => {
  res.send('get referral by id')
});

module.exports = referralRouter;