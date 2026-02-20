require("firebase-functions/lib/logger/compat");
const utils = require('../services/utils');
const express = require('express');
const devRouter = express.Router();

devRouter.get('/sleep/:wait', async (req, res) => {
  const waitInSeconds = parseInt(req.params.wait);
  await utils.sleep(waitInSeconds * 1000);
  res.send(`...🕙🛌 slept for ${waitInSeconds} seconds`);
  
});

module.exports = devRouter;