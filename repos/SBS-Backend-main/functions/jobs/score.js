const internals = {};
const functions = require('firebase-functions');
const db = require('../services/db');
const sbsUtils = require('../services/sbs');

internals.update = (frequency, startCard, endCard) => {
  return functions.pubsub.schedule(frequency, startCard, endCard).onRun( async () => {
    const scores = await db.readDocument('scores', nflWeekStr);
    await sbsUtils.setCardScores(nflWeekStr, scores, start, end);
    return 0;
  });
}

module.exports = internals;