require("firebase-functions/lib/logger/compat");

const internals = {};

internals._ = () => '...scoring utils connection successful';

internals.getOpponent = (teamType) => {
  return (teamType === 'home') ? 'away' : 'home';
}

internals.sumAllScores = (scoresArr) => {
  const sumTotalPoints = scoresArr.reduce(function(a, b){
    return a + b;
  }, 0);

  return parseFloat(sumTotalPoints.toFixed(2));
}

internals.getDstTouchdowns = (gs, teamType) => {
  const dstTouchdowns = gs.statistics[teamType].touchdowns.fumble_return + gs.statistics[teamType].touchdowns.punt_return + gs.statistics[teamType].touchdowns.kick_return + gs.statistics[teamType].touchdowns.int_return + gs.statistics[teamType].misc_returns.totals.blk_fg_touchdowns + gs.statistics[teamType].misc_returns.totals.blk_punt_touchdowns + gs.statistics[teamType].misc_returns.totals.fg_return_touchdowns;
  return dstTouchdowns;
}

internals.pointDstTouchdowns = (dstTouchdowns) => {
  return dstTouchdowns * 6;
}

internals.getDstPointsAllowed = (gs, teamType) => {
  teamType = (teamType === 'home') ? 'away' : 'home';
  const dstPointsAllowed = gs.summary[teamType].points;
  return dstPointsAllowed;
}

internals.pointDstPointsAllowed = (dstPointsAllowed) => {
  if(dstPointsAllowed === 0) return 10;
  if(dstPointsAllowed <= 6) return 7;
  if(dstPointsAllowed <= 13) return 4;
  if(dstPointsAllowed <= 20) return 1;
  if(dstPointsAllowed <= 27) return 0;
  if(dstPointsAllowed <= 34) return -1;
  if(dstPointsAllowed >= 35) return -4;
}

internals.getDstSacks = (gs, teamType) => {
  const dstSacks =  gs.statistics[teamType].defense.totals.sacks;
  return dstSacks;
}

internals.pointDstSacks = (dstSacks) => dstSacks * 1;

internals.getDstInterceptions = (gs, teamType) => {
  const dstInterceptions = gs.statistics[teamType].defense.totals.interceptions;
  return dstInterceptions;
}

internals.pointDstInterceptions = (dstInterceptions) => dstInterceptions * 2; 

internals.getDstFumbleRecoveries = (gs, teamType) => {
  const dstFumbleRecoveries = gs.statistics[teamType].fumbles.totals.opp_rec;
  return dstFumbleRecoveries;
}

internals.pointDstFumbleRecoveries = (dstFumbleRecoveries) => dstFumbleRecoveries * 2;

internals.getDstSafeties = (gs, teamType) => {
  const dstSafeties = gs.statistics[teamType].defense.totals.safeties;
  return dstSafeties;
}

internals.pointDstSafeties = (dstSafeties) => dstSafeties * 2;

internals.getDstForcedFumbles = (gs, teamType) => {
  const dstForceFumbles = gs.statistics[teamType].defense.totals.forced_fumbles + gs.statistics[teamType].defense.totals.sp_forced_fumbles;
  return dstForceFumbles;
}

internals.pointDstForcedFumbles = (dstForceFumbles) => dstForceFumbles * 1;

internals.getDstBlockedKicks = (gs, teamType) => {
  const dstBlockedKicks = gs.statistics[teamType].defense.totals.sp_blocks;  //is this right?
  return dstBlockedKicks;
}

internals.pointDstBlockedKicks = (dstBlockedKicks) => dstBlockedKicks * 2;

module.exports = internals;