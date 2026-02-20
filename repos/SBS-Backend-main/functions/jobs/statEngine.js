const functions = require("firebase-functions");
const sbsUtils = require("../services/sbs");
const internals = {};

internals.connectionTest = () => console.log("...state engine connection test!");

internals.mainStatEngine = (frequency) => {
  return functions.pubsub.schedule(frequency).onRun( async () => {
    const nflWeekStr = '2022-REG-week-1'; //TODO: add ability to get this for PRE, REG, PST
    const stats = await sbsUtils.getStats(nflWeekStr);
    await sbsUtils.setScores(nflWeekStr, stats);
    return 0;
  });
};

internals.altStatEngine = (frequency) => {
  return functions.pubsub.schedule(frequency).onRun( async () => {
    const nflWeekStr = '2022-REG-week-1'; //TODO: add ability to get this for PRE, REG, PST
    //TODO: create a service for getting stats from an alt source for ensuring we get this right.  
    //lets update this in another place and run the frequence less often for this one.  
    //const stats = await sbsUtils.getStats(nflWeekStr);
    //await sbsUtils.setScores(nflWeekStr, stats);
    return 0;
  });
}

module.exports = internals;