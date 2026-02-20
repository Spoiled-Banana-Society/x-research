require("firebase-functions/lib/logger/compat");
const express = require('express');
const teamRouter = express.Router();

teamRouter.get('/', (req, res) => {
  //placeholder
  res.send('...👕 base team route')
});

module.exports = teamRouter;