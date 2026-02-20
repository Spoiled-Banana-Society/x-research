const express = require('express');
const leaderboardRouter = express.Router();
require("firebase-functions/lib/logger/compat");

leaderboardRouter.get('/', (req, res) => {
  //placeholder
  res.send('...🏆 base leaderboard route')
});

module.exports = leaderboardRouter;