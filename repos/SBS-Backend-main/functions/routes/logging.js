require("firebase-functions/lib/logger/compat");

const express = require('express');
const db  = require('../services/db');
const logging = express.Router();
 
logging.post('/social-users', async (req, res) => {
  const event = JSON.parse(req.body || "{}");
  const ethAddress = event.ethAddress
  const existingLog = await db.readDocument('socialUsers', ethAddress);
  if (!existingLog) {
    const d = new Date()
    event.dateJoined = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`

    console.log('trying to update')
    await db.createOrUpdateDocument('socialUsers', ethAddress, event);
  }

  res.send("complete")
});

module.exports = logging;


