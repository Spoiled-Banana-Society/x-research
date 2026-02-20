//PACKAGES
const fetch = require("node-fetch");
const _ = require("lodash");
const { DateTime, Interval } = require("luxon");
const CryptoJS = require("crypto-js");
const { v4: uuidv4 } = require('uuid');

//SERVICES
const db = require("./db");
require("firebase-functions/lib/logger/compat");
const ENV = require('./env');
const api = require('./api');
const web3Utils = require('./cardContract');
const dstScoring = require('./dst-scoring');
const sbs = require('./sbs');
const weekTransition = require('./weekTransition');

const internals = {};

internals._SPORTRADAR_NFL_API_KEY = ENV.get('SPORT_RADAR_API_KEY');
internals._SPORTDATA_API_KEY = ENV.get('SPORT_DATA_API_KEY');
internals._SPORTRADAR_VALID_NFL_TEAMS = ENV.get('SPORT_RADAR_VALID_NFL_TEAMS')
internals._VALID_NFL_TEAMS = ENV.get('VALID_NFL_TEAMS');
internals._VALID_NFL_POSITION_IDS = ENV.get('VALID_NFL_POSITION_IDS');
internals.validNFLTeams = () => VALID_NFL_TEAMS;
internals.SPOILEDCARDS = 'U2FsdGVkX1+Je0pTGtTX1F7fXunO94Ik/iduM6jeLvNKeSCeSbqpFIt4kuqKfm5cQoe+1d7A2/AoHgbhp0eBlSdcz7rGhHwiEdQA9fKXDKfSt0k96wsLhv5FksjNCg0Ixc/BO+aox2t/5tS7zn9z6Dn+hbWRL1qudnmIsLut1z41ynbyJKIhdrsizJ1kr28DFoxsRzM+TVFFuDbr39cGkxJipL8b91MXNDO8OKbtiSaKn7JhO1bm/ArZJ9/jSBNZeovDVSLsncHrKApHKD5x6ga/uM8e7toepKecZZ15FCfwP2h6kNiOlfFhsqGwb+WNOs7+DX9dLONS51H2xiui5kzUe2vJQPnbBuqVcHSuqfuO3s78MgpbWmd+53BbUgYhieRxuVIObOpJp5NnKZ/FSOHgSwpOs4X2yfs+xxUzRcZYldIUmAU1HS3cOrD8wOXlBlSRWHnFVLysLPntT5v8S3iiOryjYjkGO6X7zEXh1MuUdPhR2EMuF3UW46HEh9PaxzYAYues4d5LtiDs26+BlWhufLfB/5Q1Pi8usiIkPJXadUqNoDDt8qTjvRdo2ekdN0GpAVzgnHdX7UlC4yV6eGvSw3eL9tufohYebRLq38OYvO3d6OO+J14wRYPcgsgFSVtvWRO8fthAuMeKwUyfauCQ+eXP/onkm2+qOIHmsrAio0ooa/1UjCBoVVjWNeJs0BYi2t2F6jM0naRuuIMF5ehm3JEsnifSJCZ4jaUP+xwWz7rTINHvVEaAg/U/WtURSWyHB67qBD3wia901dc0/YzBjDJdsPCfKpv9MCQWfio8MvxZPl3IXt7JQSYa6IynVvbMzWyClPoM+EOp43rgZI/8e83OimTr7TIcUoYZemUA5sUWr0dgK06ACsKYjTkuWPvn4+LhB/pyijZx5jciWx+xzgUnFi0C6mcRKTC5TlaIF5LaJHN6zDfv3/fiB+oqIIYz8glZ3s2GsiNNUX6R3TdAaX81HqG5RR4Gy4czT63uyZIgCjuZyFGisJJs5BoE7uHyIxKsuMCQjYzSyv9knHL6Wdipub0juJPtVHGxHl1fZhC7Pd3JCLs7ZzJOUWOMfA2dzTRi1YPeC3k1qT4SHvwaRi6DARDHaLJVRuMNK7rMkGzsjWUG4mV4nYDNtDG+qfjIe0gF6hLX7nPwHeZvoptyv9aTjq0g3IUmJQba6SF/tqdBJs5ab8K1J8qXgFVmea7xd2AA+Ey4tHNtcPK3xg2U1sdKpcqWjoPrZCXvgNtgzUT4hGcExvvGXmjTDZcIOcrITVzMWH3+EOE+cw1GWX7ZS4lX1VhhhiZXb0IZEEE3BSvkCpJ4g5+C1S4oWGCQVKhdAjgkL+NMg+Zt3Fg/1PQRp/2MmuYC0Si5nJGo/rIunwFpTM3oDuzpUmvgid1aPXZPdwpp0N2forAJIx0SH9VGVm1rmFktc/9mTXMvnZxNlD8fnASB27BHVpI8E967BJEn4lrCMUs71WO/pWtul2qb2vW5h1aLalDsZTIveoitbKtDhveS0bgzvQl7q6dZZ7Vy1yk+s4hqbHFNTWT/7h6zqrSAM13tFFHZe4QWgSDil3ox47zEGUquKrBbOI0YmaizgqsEgD1C4ABDel6Qls1NFrFPIaWsNGbSKa6WarDRm8szsZW/AkDq+l2MwlpkIJhohj8nGbMTnUXD6rX23ysqFlsF6RfDtPUujQtAiF6ox11HbHYZnFVmKkG73oXQfmlBWw5RgkCX0ubZorrx8dPxb4KAmMCY1qISsWu4Rryg8hSP85tDZOsTJdUU4T2zbTlnBUSY4Tsrz9OjKDnNnhqb/VdrvwpvkFfZjpvCRh5998ZbcjYJ9l7oU0YykEstyc1WTM9wpFRo4LKPh85wtZJwJKND9Y65h/9UEioJH/JOZhcZXX2Drn2wi3USuLI/+3TXsxcln8/5GqOiG93fkPhoVYYzQSp9TMTzVw60s4oFg3MrZ+5Fd+TdGH8lcLN9Z487ideO4yNvy4Gj2OZs8FbZ0Qdk3T9bkuW7V4UVdi40Jii207ze/07B3k6hAeOPqydtc2cOx/BjDxff4+ugp22uLW2pbDmBEP5sP9Mp0ZRv5H1+qHGL1QzqE4yZh8LS4rDHRV9eJDQYDqQrqePPLbSfSnyEh+9Pxd2xW7dUUrcS5gPPzA7AGlJrpvbE1Of/b+4yb/Jowi0dtAKEJYeSmC1VaYXU1DQgc+xlEK3M5ajTzqnGCp6O9YOpBM1tjHWyOO/cIJ1PHWI3lEDq8vtP7za/5ZTlKFGPOQvu377JGQOgTDdp8fCf2Jko30BWLn3duwtq9agbWn52FFubkE6tEZOm3r7WNVwkCrRaKUEsF4Vi760aNjgFV3zWX5G+3UkXRH40a+i68+TiR+0Eop4xOfZJWUyy1xtV3nGyfCxJ70F7UFHiilxgDNWsK0yvAKl4sEFLEU6prMpdBBNjJCirp+VhRcJyUsoO10KfS/0qGgR6G/q1VkbERQIzcw0omHPlUhFyQJXV9Sr82S97Srsiz4xLhoLd+9qFgI9EARw24rESI1PDpX966nvEyFKjIAzqp7exGrPsAG6jLwjuaecfw6e01cFDZrIGLOYFHoRRFb3LtTr/ZH+jQ/kDoTAhVy7lLdz0ESoC9WgPwiREwWc6LQEJFovhV6rnQ9gRhy5GRqNjsVOKwo8S1E/9TYMuXM1WWGvtpTNdDCu7MGYic6HAbFA/FmGp3tbB1jPtFyRJFCrdrr1FYAE/7XNtfKa4/4ZeounjRU9ZkQ6Xssr59jF8P7ODk9xnfSQqjECIG6kI6+tpvzLFYSYIoESuI2vJ6H4ODWfThIWEYLLJBV/hC165pWx+g20xFa2E+J9U3G8dHriEx+EGCsYwHvdxxgQFUQs11nQfNucDyfuIPlVzmVBRa86nn6Qp1vRi1shkedfyLoO5egLjUHJJZBkTEHVvDCt47/f9CMUcIqt80mgy9VVXLRq/HiqhRXNiLw01E9sFTL+9O+dmy3PeBn+QttgUt2397Ft5Rw9Q7o4k1iOLm20ffReIH2RwKXoS1d/9clyjJnvJXiO08ZrPBzJ0vGD9x/vzKQJUltv449W4xL6ST81ajPcJPa0TjX5zuFKdVObW2ifbK1kEjT0w1Yv34N9uJgcBTijKxuC612CBqiwMrrod7NuNdtwVnhE9o+5IWvLnEWQTCQjQ1WiA78hfFrdiVjGlzwWx2VJ/EHu5zar/rjlg9J3B4uvtIFp+of3wF1tmAkkDkas8G/trC4ISf+wiz3bfrG3FHaJk/iKu1zWdfvu/8yn3NPhh1Yjla3CN+AgbI1s=';

internals.getValidNFLTeams = () => {
  // This will return { radarTeamAlias: sbsTeamAlias }
  const teams = {}; 

  internals._SPORTRADAR_VALID_NFL_TEAMS = ENV.get('SPORT_RADAR_VALID_NFL_TEAMS');
  internals._VALID_NFL_TEAMS = ENV.get('VALID_NFL_TEAMS');

  internals._SPORTRADAR_VALID_NFL_TEAMS.forEach((radarTeam, index) => {
    teams[radarTeam] = internals._VALID_NFL_TEAMS[index];
  })

  return teams;
};

internals._parseGames = async (data) => {
  let parsedGameData = [];

  const gameData = data;

  gameData.forEach((game) => {
    parsedGameData.push({
      gameId: game.GameKey,
      week: game.Week,
      home: {
        id: game.HomeTeam,
        name: game.HomeTeam,
        alias: game.HomeTeam,
      },
      away: {
        id: game.AwayTeam,
        name: game.AwayTeam,
        alias: game.AwayTeam,
      },
      status: game.Status,
      scheduled: game.DateTime,
      venue: game.StadiumDetails,
      broadcast: game.Channel,
    });
  });

  return parsedGameData;
};

internals._getGames = async (year, season, week) => {
  const url = `https://api.sportradar.us/nfl/official/trial/v7/en/games/${year}/${season}/${week}/schedule.json?api_key=${internals._SPORTRADAR_NFL_API_KEY}`;

  let games;

  await fetch(url)
    .then((response) => response.json())
    .then(async (data) => {
      games = internals._parseGames(data);
    })
    .catch((err) => console.error(err));

  return games;
};

internals._getGamesSportsData = async (season, week) => {
  const url = `https://api.sportsdata.io/v3/nfl/scores/json/ScoresByWeek/${season}/${week}?key=cc1e7d75df054c6c82c4ff2f02ded616`;

  let games;

  await fetch(url)
    .then((response) => response.json())
    .then(async (data) => {
      games = internals._parseGames(data);
    })
    .catch((err) => console.error(err));

  return games;
};

internals._getPlayerPassing = (player, teamType, gameStats) => {

  const id = player.id;
  const targetStats = gameStats.statistics[teamType].passing.players;
  const playerIndex = _.findIndex(targetStats, { 'id' : id })
  
  if(playerIndex === -1){
    return {
      yards: 0,
      touchDowns: 0,
      twoPtConversions: 0,
      interceptions: 0
    }
  }

  return {
    yards: targetStats[playerIndex].yards != undefined ? targetStats[playerIndex].yards : 0,
    touchDowns: targetStats[playerIndex].touchdowns != undefined ? targetStats[playerIndex].touchdowns : 0,
    twoPtConversions: internals._getTwoPtConversions(player, teamType, gameStats, 'pass'),
    interceptions: targetStats[playerIndex].interceptions != undefined ? targetStats[playerIndex].interceptions : 0,
  };
}

internals._getTwoPtConversions = (player, teamType, gameStats, type) => {
  const id = player.id;
  const targetStats = gameStats.statistics[teamType].extra_points.conversions.players;
  const playerIndex = _.findIndex(targetStats, { 'id' : id })
  let res = 0;
  if(playerIndex != -1 && targetStats[playerIndex].category === type) {
    res = (targetStats[playerIndex].successes) ? targetStats[playerIndex].successes : 0
  }
  return res
}

internals._getPlayerRushing = (player, teamType, gameStats) => {

  const id = player.id;
  const targetStats = gameStats.statistics[teamType].rushing.players;
  const playerIndex = _.findIndex(targetStats, {'id': id});

  return {
    yards: (playerIndex != -1) ? targetStats[playerIndex].yards : 0,
    touchdowns: (playerIndex != -1) ? targetStats[playerIndex].touchdowns : 0,
    twoPtConversions: internals._getTwoPtConversions(player, teamType, gameStats, 'rush'),
  };
}

internals._getPlayerRecieving = (player, teamType, gameStats) => {

  const id = player.id;
  const targetStats = gameStats.statistics[teamType].receiving.players;
  const playerIndex = _.findIndex(targetStats, {'id' : id});

  if(playerIndex === -1){
    return {
      yards: 0,
      receptions: 0,
      touchDowns: 0,
      twoPtConversions: 0
    };
  }

  return {
    yards: targetStats[playerIndex].yards,
    receptions: targetStats[playerIndex].receptions,
    touchDowns: targetStats[playerIndex].touchdowns,
    twoPtConversions: internals._getTwoPtConversions(player, teamType, gameStats, 'receive'),
  };
}

internals._calcTotalYardsForPlayer = (player, teamType, gameStats) => {

  const passing = internals._getPlayerPassing(player, teamType, gameStats);
  const receiving = internals._getPlayerRecieving(player, teamType, gameStats);
  const rushing = internals._getPlayerRushing(player, teamType, gameStats);

  return rushing.yards + passing.yards + receiving.yards;
}

internals._calcPassingYardsPoints = (yards) => {
  let points = yards * .04;
  if(yards >= 300){
    points += 3;
  }
  return points;
}

internals._calclRushingYardsPoints = (yards) => {
  let points = yards * .1;
  if(yards >= 100){
    points += 3;
  }
  return points;
}

internals._calcReceivingYardsPoints = (yards) => {
  let points = yards * .1;
  if(yards >= 100){
    points += 3;
  }
  return points;
}

internals._calcPassingTouchDownPoints = (touchdowns) => touchdowns * 4;
internals._calcTwoPtConversionPoints = (conversions) => conversions * 2;
internals._calcPassingPicksDeductPoints = (picks) => picks * -1;
internals._calcRushingTouchDownPoints = (touchdowns) => touchdowns * 6;
internals._calcRecievingTouchDownPoints = (touchdowns) => touchdowns * 6;


internals._getLostFumbles = (player, teamType, gameStats) => {
  const id = player.id;
  const targetStats = gameStats.statistics[teamType].fumbles.players;
  const playerIndex = _.findIndex(targetStats, { 'id' : id })

  return (playerIndex != -1) ? (targetStats[playerIndex].lost_fumbles * -1) : 0;
}

internals._calcFantasySportsScore = (player, teamType, gameStats) => {

  //passing
  const playerPass = internals._getPlayerPassing(player, teamType, gameStats);
  const passingYardPoints = internals._calcPassingYardsPoints(playerPass.yards); 
  const passingTouchDownPoints = internals._calcPassingTouchDownPoints(playerPass.touchDowns);
  const passingConversionsPoints = internals._calcTwoPtConversionPoints(playerPass.twoPtConversions);
  const passingPicksPointDeduct = internals._calcPassingPicksDeductPoints(playerPass.interceptions);

  //rushing
  const playerRush = internals._getPlayerRushing(player, teamType, gameStats);
  const rushingYardPoints = internals._calclRushingYardsPoints(playerRush.yards);
  const rushingTouchDownPoints = internals._calcRushingTouchDownPoints(playerRush.touchdowns);
  const rushingConversionPoints = internals._calcTwoPtConversionPoints(playerRush.twoPtConversions);

  //receiving
  const playerRecp = internals._getPlayerRecieving(player, teamType, gameStats);
  const receivingReceptionsPoints = playerRecp.receptions;
  const receivingYardsPoints = internals._calcReceivingYardsPoints(playerRecp.yards);
  const receivingTouchDownsPoints = internals._calcRecievingTouchDownPoints(playerRecp.touchDowns);
  const receivingConversionPoints = internals._calcTwoPtConversionPoints(playerRecp.twoPtConversions);

  const lostFumbles = internals._getLostFumbles(player, teamType, gameStats);
  
  let ptArr = [
    passingYardPoints, passingTouchDownPoints, passingConversionsPoints, passingPicksPointDeduct, 
    rushingYardPoints, rushingTouchDownPoints, rushingConversionPoints,
    receivingYardsPoints, receivingReceptionsPoints, receivingTouchDownsPoints, receivingConversionPoints,
    lostFumbles
  ] 

  const sum = ptArr.reduce(function(a, b){
    return a + b;
}, 0);

 return parseFloat(sum.toFixed(2));
}

internals._addBasicPlayerData = (players, team, type, arr ) => {
  let found;

  for(let i = 0; i < arr.length; i++){
    found = players.some(player => player.id === arr[i].id)
    if(!found) players.push({
      id: arr[i].id,
      name: arr[i].name,
      position: arr[i].position,
      teamType: type,
      team,
    });
  } 

  return players;
}

internals._getBasicPlayerData = (gameStats) => {

  
  //if(gameStats.status != 'closed') return [];

  let players = [];
  const homeTeam = gameStats.summary.home.alias;
  const awayTeam = gameStats.summary.away.alias;

 
  
  players = internals._addBasicPlayerData(players, homeTeam, 'home', [...gameStats.statistics.home.passing.players]);
  players = internals._addBasicPlayerData(players, homeTeam, 'home', [...gameStats.statistics.home.receiving.players]);
  players = internals._addBasicPlayerData(players, homeTeam, 'home', [...gameStats.statistics.home.rushing.players]);
  players = internals._addBasicPlayerData(players, homeTeam, 'home', [...gameStats.statistics.home.extra_points.conversions.players]);

  players = internals._addBasicPlayerData(players, awayTeam, 'away', [...gameStats.statistics.away.passing.players]);
  players = internals._addBasicPlayerData(players, awayTeam, 'away', [...gameStats.statistics.away.receiving.players]);
  players = internals._addBasicPlayerData(players, awayTeam, 'away', [...gameStats.statistics.away.rushing.players]);
  players = internals._addBasicPlayerData(players, awayTeam, 'away', [...gameStats.statistics.away.extra_points.conversions.players]);
  
  return players;
}

internals._calcPlayerScore = (player, gameStats) => {

  const teamType = player.teamType;
  
  const currentPlayer = {
    id: player.id,
    name: player.name,
    position: player.position,
    team: player.team,
    totalYards: internals._calcTotalYardsForPlayer(player, teamType, gameStats),
    fantasySportsScore: internals._calcFantasySportsScore(player, teamType, gameStats),
    passing: internals._getPlayerPassing(player, teamType, gameStats),
    receiving: internals._getPlayerRecieving(player, teamType, gameStats),
    rushing: internals._getPlayerRushing(player, teamType, gameStats),
    gameStatus: gameStats.status,
  }
  
  return currentPlayer;
}

internals.getGames = async (season, week) => await internals._getGames(season, week);

internals._getOffensiveStats = async (gameStats) => {

  let allPlayersStatsFromGame = [];
  
  //on array containing all scorable fatansy offensive players from a game
  let allPlayerIds = internals._getBasicPlayerData(gameStats);
  let currentPlayer;

  for(let i = 0; i < allPlayerIds.length; i++){
    currentPlayer = allPlayerIds[i];
    currentPlayer = internals._calcPlayerScore(currentPlayer, gameStats); 
    allPlayersStatsFromGame.push(currentPlayer);
  }

  return allPlayersStatsFromGame;  
};

internals._getPlayerStats = async (games) => {
  let gameId;
  let url;
  let currentPlayerGameScores;
  let allPlayerScores = [];

  for (let i = 0; i < games.length; i++) {
    gameId = games[i].gameId;

    const options = {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    }
    
    const response = await fetch(`https://api.sportradar.us/nfl/official/trial/v6/en/games/${gameId}/statistics.json?api_key=${internals.SPORTRADAR_NFL_API_KEY}`, options );
    const gameStats = await response.json();
    currentPlayerGameScores = await internals._getOffensiveStats(gameStats);
    for( let j= 0; j < currentPlayerGameScores.length; j++){
      allPlayerScores.push(currentPlayerGameScores[j]);
    }
    currentPlayerGameScores = [];
  }

  return allPlayerScores;
};

internals.getPlayerStats = async (games) => await internals._getPlayerStats(games);


internals._getTopPayersByPosition = async (players, position) => {

  let targetPlayers = [];

  //Get all the players for a position
  players.forEach(player => {
    if(player.position === position){
      targetPlayers.push(player);
    }
  });

  return targetPlayers;

}


internals._sortArrByKey = (arr, key) => {
  const sorted = arr.sort(function (a, b) {
    return b[key] - a[key];
  });

  return sorted;
}

internals.rankPlayers = async (players) => {

  const topQuarterBacks = await internals._getTopPayersByPosition(players, 'QB');
  let topRunningBacks = await internals._getTopPayersByPosition(players, 'RB');
  const topFullBacks = await internals._getTopPayersByPosition(players, 'FB');
  topRunningBacks = topRunningBacks.concat(topFullBacks)
  const topWideReceiver = await internals._getTopPayersByPosition(players, 'WR');
  const topTightEnds = await internals._getTopPayersByPosition(players, 'TE');  

  let stats = {
    qb: internals._sortArrByKey(topQuarterBacks, 'fantasySportsScore'),
    rb: internals._sortArrByKey(topRunningBacks, 'fantasySportsScore'),
    wr: internals._sortArrByKey(topWideReceiver, 'fantasySportsScore'),
    te: internals._sortArrByKey(topTightEnds, 'fantasySportsScore')
  };

  return stats;
}

internals.rankDefense = async (teams) => internals._sortArrByKey(teams, 'fantasySportsScore');

internals._getPointsAllowed = (team, gameStats) => {
  //Needing to get the oppoiste teams points for allowed points
  team = team === 'home' ? 'away' : 'home';
  return gameStats.summary[team].points;
}

internals._getTeamName = (team, gameStats) => gameStats.statistics[team].alias;
internals._getDefensiveTouchDowns = (team, gameStats) => {
  
  //4 types of defensive touchdowns
  //1. Interceptions
  const defTouchdownInterceptions = gameStats.statistics[team].touchdowns.int_return;

  //2. Fumbles
  const defTouchdownFumbles = gameStats.statistics[team].touchdowns.fumble_return;

  //3. Kick return 
  const defTouchdownKickReturn = gameStats.statistics[team].touchdowns.kick_return;

  //4. Punt return 
  const defTouchdownPuntReturn = gameStats.statistics[team].touchdowns.punt_return;
  
  
  return (defTouchdownInterceptions + defTouchdownFumbles + defTouchdownKickReturn + defTouchdownPuntReturn) * 6; 

}
internals._getSacks = (team, gameStats) => gameStats.statistics[team].defense.totals.sacks || 0;
internals._getInterceptions = (team, gameStats) => gameStats.statistics[team].defense.totals.interceptions || 0;
internals._getFumbleRecoveries = (team, gameStats) => gameStats.statistics[team].defense.totals.fumble_recoveries || 0;
internals._getsafeties = (team, gameStats) => gameStats.statistics[team].defense.totals.safeties || 0;
internals._getForcedFumbles = (team, gameStats) => gameStats.statistics[team].defense.totals.forced_fumbles || 0;
internals._getBlockedKicks = (team, gameStats) => gameStats.statistics[team].defense.totals.sp_blocks || 0;


internals._getAllowedPointsScore = (team, gameStats) => {
  const defPointsAllowed = internals._getPointsAllowed(team, gameStats);
  let points;
  //Points Allowed 0 then 10pts
  if(defPointsAllowed < 1){
    points = 10;
  } 

  //Points Allowed 1 - 6 then 7pts
  if(defPointsAllowed >= 1 && defPointsAllowed <= 6){
    points = 7;
  } 

  // Points Allowed 7 - 13 then 4pts
  if(defPointsAllowed >= 7 && defPointsAllowed <= 13){
    points = 4;
  } 

  //Points Allowed 14 - 20 then 2pts
  if(defPointsAllowed >= 14 && defPointsAllowed <= 20){
    points = 1;
  } 

  //Points Allowed 21 - 27 then 0pts
  if(defPointsAllowed >= 21 && defPointsAllowed <= 27){
    points = 0;
  }

  //Points Allowed 28 - 34 then -2pts
  if(defPointsAllowed >= 28 && defPointsAllowed <= 34){
    points = -1;
  } 

  //Points Allowed 35+ then -4pts
  if(defPointsAllowed >= 35){
    points = -4;
  } 
  
  return points;
}

internals._getDefensiveFantasyScore = (teamType, gs) => {
  let scoresArr = [];
  scoresArr.push(dstScoring.pointDstTouchdowns(dstScoring.getDstTouchdowns(gs, teamType)));
  scoresArr.push(dstScoring.pointDstPointsAllowed(dstScoring.getDstPointsAllowed(gs, teamType)));
  scoresArr.push(dstScoring.pointDstSacks(dstScoring.getDstSacks(gs, teamType)));
  scoresArr.push(dstScoring.pointDstInterceptions(dstScoring.getDstInterceptions(gs, teamType)));
  scoresArr.push(dstScoring.pointDstFumbleRecoveries(dstScoring.getDstFumbleRecoveries(gs, teamType)));
  scoresArr.push(dstScoring.pointDstSafeties(dstScoring.getDstSafeties(gs, teamType)));
  scoresArr.push(dstScoring.pointDstForcedFumbles(dstScoring.getDstForcedFumbles(gs, teamType)));
  scoresArr.push(dstScoring.pointDstBlockedKicks(dstScoring.getDstBlockedKicks(gs, teamType)));
  return dstScoring.sumAllScores(scoresArr);
}


internals._getDefTeamStats = (gs, teamType) => {
  return {
    team: internals._getTeamName(teamType, gs),
    fantasySportsScore: internals._getDefensiveFantasyScore(teamType, gs),
    defensiveTouchDowns: dstScoring.getDstTouchdowns(gs, teamType),
    PointsAllowed: dstScoring.getDstPointsAllowed(gs, teamType),
    sacks: dstScoring.getDstSacks(gs, teamType),
    interceptions: dstScoring.getDstInterceptions(gs, teamType),
    fumbleRecoveries: dstScoring.getDstFumbleRecoveries(gs, teamType),
    safeties: dstScoring.getDstSafeties(gs, teamType),
    forcedFumbles: dstScoring.getDstForcedFumbles(gs, teamType),
    blockedKicks: dstScoring.getDstBlockedKicks(gs, teamType),
    gameStatus: gs.status  
  }
}

internals._getDefensiveStats = async (gs) => {

  let homeDef;
  let awayDef;

  homeDef = internals._getDefTeamStats(gs, 'home')
  awayDef = internals._getDefTeamStats(gs, 'away')

  return [homeDef, awayDef];
}

internals.getDefensiveStats = async (games) => await internals._getDefensiveStats(games)

internals._getFantasyStats = async (games) => {

  let gameId;

  let offense = [];
  let currentOffense;
  
  let defense = [];
  let currentDefense;  
  
  for (let i = 0; i < games.length; i++) {
    gameId = games[i].gameId;

    const response = await fetch(`https://api.sportradar.us/nfl/official/trial/v6/en/games/${gameId}/statistics.json?api_key=jf4ypzmzfzfchmazkgk2rfc5`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const gameStats = await response.json();

    //only get stats for games that have stats available to them
    //If this is removed Will attempt to access object that don't exist
  if(!gameStats.status.match(/^(inprogress|halftime|complete|closed)$/)) continue
    
    currentOffense = await internals._getOffensiveStats(gameStats);
    for( let j= 0; j < currentOffense.length; j++) offense.push(currentOffense[j]);
    currentOffense = [];

    currentDefense = await internals._getDefensiveStats(gameStats);
    for(let j=0; j < currentDefense.length; j++) defense.push(currentDefense[j]);
    currentDefense = [];
  }

  return { offense, defense}

}

internals.getStatsAndPoints = async (games) => {

  let gameId;
  let offense = [];
  let currentOffense;
  let defense = [];
  let currentDefense;  
  let gs;
  
  for (let i = 0; i < games.length; i++) {
    gameId = games[i].gameId;

    const response = await fetch(`https://api.sportradar.us/nfl/official/trial/v6/en/games/${gameId}/statistics.json?api_key=jf4ypzmzfzfchmazkgk2rfc5`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    gs = await response.json();
    if(!gs.status.match(/^(inprogress|halftime|complete|closed|cancelled)$/)) continue
    
    currentOffense = await internals._getOffensiveStats(gs);
    for( let j= 0; j < currentOffense.length; j++) offense.push(currentOffense[j]);
    currentOffense = [];

    currentDefense = await internals._getDefensiveStats(gs);
    for(let j=0; j < currentDefense.length; j++) defense.push(currentDefense[j]);
    currentDefense = [];
  }

  return { offense, defense}



}


internals.getFantasyStats = async (games) => await internals._getFantasyStats(games)

//TODO: Who is using this? Can get rid of it?
internals._isTeamValid = (team) => {

  const validTeams = ['ARI', 'ATL', 'BAL', 'BUF', 'CAR', 'CHI', 'CIN', 'CLE', 'DAL', 'DEN', 'DET', 'GB', 'HOU', 'IND', 'JAX', 'KC', 'LAC', 'LAR', 'MIA', 'MIN', 'NE', 'NO', 'NYG', 'NYJ', 'OAK', 'PHI', 'PIT', 'SEA', 'SF', 'TB', 'TEN', 'WAS'];

  return validTeams.includes(team);
}

internals.isTeamValid = (team) => _isTeamValid(team); 

//TODO: Add logic to calculate end of REG Season
internals.getNFLSeason = (year) => 'REG';
internals._getNFLWeek = async () => {
  
  let nflWeek = 17;

  //TODO: Pay for this API for I a different less expensive way to get the NFL week.  Hard coding for now. 
  // const options = {
  //   method: 'GET',
  //   redirect: 'follow'
  // };
  
  // await fetch(`https://api.sportsdata.io/v3/nfl/scores/json/CurrentWeek?key=${internals._SPORTDATA_API_KEY}`, options)
  //   .then(response => response.text())
  //   .then(result => {
  //     console.log('...getting NFL week from sportsData')
  //     nflWeek = parseInt(result);
  //   })
  //   .catch(error => {
  //     console.log('...🚨 error fetching NFL Week from sportsData', error)
  // });

    return nflWeek;
}

internals.getNFLWeek = async () => await internals._getNFLWeek();
internals.getPrevNFLWeek = async () => await internals._getNFLWeek() - 1;
internals.uniqueCheck = (arr) => {
  let filterArr = arr.filter((v, i, a) => a.indexOf(v) === i); 

  if(filterArr.length === arr.length){
    return true;
  } else return false;
}

internals.getRandomNFLTeamByIndex = (index) => {
  
  const validTeams = VALID_NFL_TEAMS;
  return validTeams[index];
}

internals._sortObject = (o) => {
  let sorted = {},
    key,
    a = [];

  for (key in o) {
    if (o.hasOwnProperty(key)) {
      a.push(key);
    }
  }

  a.sort();

  for (key = 0; key < a.length; key++) {
    sorted[a[key]] = o[a[key]];
  }
  return sorted;
};

internals.sortObject = (o) => internals._sortObject(o);

internals.sortStartingLineup = (team) => {
  let startingLineup = team.startingLineup;
  let sortedStartingLineup = [];

  startingLineup.forEach(player => {

    sortedStartingLineup.push(internals._sortObject(player));
    
  });
  team.startingLineup = sortedStartingLineup;

  return team;
}

internals.sortStartingLineUps = (teams) => {

  let sortedTeams = [];

  teams.forEach(team => {
    sortedTeams.push(internals.sortStartingLineup(team));
  });

  return sortedTeams;


}

internals._isObjectEmpty = (obj) => Object.keys(obj).length === 0 ? true : false;
internals.isObjectEmpty = (obj) => internals._isObjectEmpty(obj);

internals.getRandomByIndex = (arr, index) => arr[index];
internals.getAllNFLTeams = () => internals._VALID_NFL_TEAMS;

internals.getSportRadarNFLTeams = () => internals._SPORTRADAR_VALID_NFL_TEAMS;

internals.getAllNFLPositionIds = () => internals._VALID_NFL_POSITION_IDS;

internals.getPlayerScore = (gs, team, position, prevScores) => {

  let positionData;
  let teamData;
  let prevQB = 0; 
  let prevRB = 0;
  let prevWR = 0;
  let prevTE = 0;
  let prevDST = 0;

  if(Object.entries(prevScores).length != 0) {
    prevQB = prevScores.FantasyPoints.find(p => p.team === team).QB;
    prevRB = prevScores.FantasyPoints.find(p => p.team === team).RB;
    prevWR = prevScores.FantasyPoints.find(p => p.team === team).WR;
    prevTE = prevScores.FantasyPoints.find(p => p.team === team).TE;
    prevDST = prevScores.FantasyPoints.find(p => p.team === team).DST;
  } 
  
  if(position === 'QB') positionData = gs.stats.offense.qb != 0 ? gs.stats.offense.qb : prevQB;
  if(position === 'RB') positionData = gs.stats.offense.rb != 0 ? gs.stats.offense.rb : prevRB;
  if(position === 'WR') positionData = gs.stats.offense.wr != 0 ? gs.stats.offense.wr : prevWR;
  if(position === 'TE') positionData = gs.stats.offense.te != 0 ? gs.stats.offense.te : prevTE;
  if(position === 'DST') positionData = gs.stats.defense != 0 ? gs.stats.defense : prevDST;
  
  if(positionData === undefined || positionData === 0) return 0;
    teamData = positionData.filter(player => player.team === team);
  if(teamData.length === 0) return 0;
    teamData = teamData.sort(function(a, b){return b.fantasySportsScore - a.fantasySportsScore});
  return teamData[0].fantasySportsScore != undefined ? teamData[0].fantasySportsScore : 0;
}

internals.translateTeam = (team) => {
  if(team === 'LAR') team = 'LAR';
  if(team === 'JAX') team = 'JAC';
  if(team === 'OAK') team = 'LV';
  return team;
}


internals.getPointsFromScore = (scores, team, position) => {

  if(team === 'OAK') team = 'LV';

  return scores.FantasyPoints.find(x => x.Team === team)[position];
}

internals.scoreCards = async (nflWeekStr, teamStats, cardIds) => {

  let card;
  let pts;
  let totalWeeklyPts; 


  for (let i = 0; i < 2; i++) {
    card = await db.readDocument('cards', cardIds[i]);
    card[nflWeekStr] = {};
    card[nflWeekStr].startingLineup = [];
    
    totalWeeklyPts = 0;
    card.startingLineup.forEach(player => {
      pts = internals.getPointsFromScore(teamStats.FantasyPoints, player.teamId, player.positionLabel);
      card[nflWeekStr].startingLineup.push({
        positionId: player.positionId,
        positionLabel: player.positionLabel,
        starting: player.starting,
        teamId: player.teamId,
        teamPosition: player.teamPosition,
        pts
      });

      if(player.starting) totalWeeklyPts += pts;
    });
    
    card[nflWeekStr].weekPts = parseFloat(totalWeeklyPts.toFixed(2));
    card[nflWeekStr].seasonPts = parseFloat(totalWeeklyPts.toFixed(2)); 
    
    console.log(card);
  }

  return 0;

}

internals.getGameType = (games, teamId) => {
  let gameType = 'bye';
  games.forEach(game => {
    if(game.home.alias === teamId) gameType = 'home';
    if(game.away.alias === teamId) gameType = 'away';
  });
  return gameType;
}

internals.getScheduledTime = (games, teamId) => {

  let scheduledTime = 'unknown';

  games.forEach(game => {
    if(game.home.alias === teamId) scheduledTime = game.scheduled;
    if(game.away.alias === teamId) scheduledTime =  game.scheduled;
  });

  //Formate using momentjs

  return scheduledTime;
}

internals.getGameStatus = (games, teamId) => {

  let gameStatus = 'unknown';

  games.forEach(game => {
    if(game.home.alias === teamId) gameStatus = game.status;
    if(game.away.alias === teamId) gameStatus =  game.status;
  });

  return gameStatus;
}

internals.getGameStatusByTeam = (_stats, teamId) => _stats.stats.defense.find(x => x.team === teamId) ?  _stats.stats.defense.find(x => x.team === teamId).gameStatus : 'none';

internals.getOpponent = (games, teamId) => {

  let opponent = 'unknown';

  games.forEach(game => {
    if(game.home.alias === teamId) opponent = game.away.alias;
    if(game.away.alias === teamId) opponent = game.home.alias;
  });

  return opponent;
}

internals.getGameDay = (games, teamId) => {
  let scheduledTime = 'unknown';

  games.forEach(game => {
    if(game.home.alias === teamId) scheduledTime = game.scheduled;
    if(game.away.alias === teamId) scheduledTime =  game.scheduled;
  });

    let dayStr = scheduledTime;


  return DateTime.fromISO(dayStr, {zone: 'America/New_York'}).toFormat('ccc');
}

internals.getGameTime = (games, teamId) => {
  let scheduledTime = 'unknown';

  games.forEach(game => {
    if(game.home.alias === teamId) scheduledTime = game.scheduled;
    if(game.away.alias === teamId) scheduledTime =  game.scheduled;
  });

  let dayStr = scheduledTime;;

  return DateTime.fromISO(dayStr, {zone: 'America/New_York'}).toFormat('h:mm a') + ' EST';
}

internals.getGameVenue = (games, teamId) => {

  let venue = 'unknown';

  games.forEach(game => {
    if(game.home.alias === teamId) venue = game.venue;
    if(game.away.alias === teamId) venue = game.venue;
  });

  return venue;
}

internals.getBroadcast = (games, teamId) => {

  let broadcast = 'unknown';

  games.forEach(game => {
    if(game.home.alias === teamId) broadcast = game.broadcast;
    if(game.away.alias === teamId) broadcast = game.broadcast;
  });

  return broadcast;
}

internals.addGameData = (teams, games) => {

  let transformedTeams = [];
  let transformedStartingLineup = [];

  if(teams.length === undefined) {
    teams.startingLineup.forEach(player => {
      transformedStartingLineup.push({
        positionId: player.positionId,
        positionLabel: player.positionLabel,
        starting: player.starting,
        teamId: player.teamId,
        teamPosition: player.teamPosition,
        gameType: internals.getGameType(games, player.teamId),
        playersWeeklyAverage: 0,
        scheduled: internals.getScheduledTime(games, player.teamId),
        gameDay: internals.getGameDay(games, player.teamId), 
        gameTime: internals.getGameTime(games, player.teamId),
        status: internals.getGameStatus(games, player.teamId),
        opponent: internals.getOpponent(games, player.teamId),
        venue: internals.getGameVenue(games, player.teamId),
        broadcast: internals.getBroadcast(games, player.teamId) 
      });
    });

    teams.startingLineup = transformedStartingLineup;
    return teams;
  }



  teams.forEach(team => {

    transformedTeams = [];
    transformedStartingLineup = [];

    team.startingLineup.forEach(player => {
      transformedStartingLineup.push({
        positionId: player.positionId,
        positionLabel: player.positionLabel,
        starting: player.starting,
        teamId: player.teamId,
        teamPosition: player.teamPosition,
        gameType: internals.getGameType(games, player.teamId),
        playersWeeklyAverage: 0,
        scheduled: internals.getScheduledTime(games, player.teamId),
        gameDay: internals.getGameDay(games, player.teamId), 
        gameTime: internals.getGameTime(games, player.teamId),
        status: internals.getGameStatus(games, player.teamId),
        opponent: internals.getOpponent(games, player.teamId),
        venue: internals.getGameVenue(games, player.teamId),
        broadcast: internals.getBroadcast(games, player.teamId) 
      });
    });

    team.startingLineup = transformedStartingLineup;
    transformedTeams.push(team);
  });


  return teams;
}

internals.translateTeams = (teams) => {
  
  let translatedStartingLineup = [];
  let currentPlayer;

  if(teams.length === undefined) {

    translatedStartingLineup = [];
    currentPlayer = {};
    
    teams.startingLineup.forEach(player => {
    
      if(player.teamId === 'JAX'){
        player.teamId = 'JAC'; 
        player.teamPosition = `JAC ${player.positionLabel}`
      }

      if(player.teamId === 'LAR'){
        player.teamId = 'LA';
        player.teamPosition = `LA ${player.positionLabel}`
      }

      if(player.teamId === 'OAK'){
        player.teamId = 'LV';
        player.teamPosition = `LV ${player.positionLabel}`
      }

      currentPlayer = player;
      translatedStartingLineup.push(currentPlayer);

    });

    teams.startingLineup = [];
    teams.startingLineup = translatedStartingLineup;
    
  } else {
    
    teams.forEach(team => {

      translatedStartingLineup = [];
      currentPlayer = {};
  
      team.startingLineup.forEach(player => { 
        
        if(player.teamId === 'JAX'){
          player.teamId = 'JAC'; 
          player.teamPosition = `JAC ${player.positionLabel}`
        }
  
        if(player.teamId === 'LAR'){
          player.teamId = 'LA';
          player.teamPosition = `LA ${player.positionLabel}`
        }
  
        if(player.teamId === 'OAK'){
          player.teamId = 'LV';
          player.teamPosition = `LV ${player.positionLabel}`
        }
        

        currentPlayer = player;
  
        translatedStartingLineup.push(currentPlayer);
      });
      team.startingLineup = [];
      team.startingLineup = translatedStartingLineup;
    });
  }

  return teams;
}

internals.cleanCardObject = (startingLineup) => {
  
  let transformedStartingLineup = [];

  for (let i = 0; i < startingLineup.length; i++) {
    transformedStartingLineup.push({
        positionId: startingLineup[i].positionId,
        positionLabel: startingLineup[i].positionLabel,
        teamId: startingLineup[i].teamId,
        teamPosition: startingLineup[i].teamPosition,
        starting: startingLineup[i].starting
    });   
  }

  return transformedStartingLineup;
}

internals.getPrevNFLWeek = (nflWeekStr) => {
  let week = parseInt(nflWeekStr.split('-week-')[1]);
  return week === 1 ? nflWeekStr : `${nflWeekStr.split('-week-')[0]}-week-${--week}`;
}

internals.filterOutExtraObjects = async (arr, nflWeekStr) => {
  
  let filteredArr = [];
  
  for(let i = 0; i < arr.length; i++){
    if(Object.keys(arr[i]) != nflWeekStr){
      filteredArr.push(arr[i]);
    }
  }

  return filteredArr;
}

internals.getNFLWeekStr = async (year, season, week) => `${year}-${season}-week-${week}`;

internals.getCardLevel = (level) => {
  let cardLevel = 'unknown';
  switch(level){
    case 'pro':
      cardLevel = 'Pro';
      break;
    case 'hof':
      cardLevel = 'Hall of Fame';
      break;
    default:
      cardLevel = 'all';
      break;
  }
  return cardLevel;
}

internals.getSortType = (sort) => (sort === 'top') ? 'desc' : 'asc';


internals.scoreCardOptomized = async (nflWeekStr, tokenId) => {

  let card = await db.readDocument('cards', tokenId.toString());
  let oStartingLineup = [];
  let weeklyPts = 0;

   //starting with getting the optomized score for 1 token
  const nflWeekStartingLineup = card.scores.find(score => Object.keys(score).includes(nflWeekStr));
  const nflWeekStartingLineupIndex = card.scores.findIndex(score => Object.keys(score).includes(nflWeekStr));

  const _setQBs = (data) => {

    let qbArr = data.startingLineup.filter(player => player.positionLabel === 'QB');
    qbArr = internals._sortArrByKey(qbArr, 'pts');
    qbArr[0].starting = true;
    weeklyPts += qbArr[0].pts;
    qbArr[1].starting = false;

    oStartingLineup.push(internals._sortObject(qbArr[0]));
    oStartingLineup.push(internals._sortObject(qbArr[1]));
  };


  const _setRBs = (data) => {
    let rbArr = data.startingLineup.filter(player => player.positionLabel === 'RB');
    rbArr = internals._sortArrByKey(rbArr, 'pts');
    rbArr[0].starting = true;
    rbArr[1].starting = true;
    weeklyPts += rbArr[0].pts;
    weeklyPts += rbArr[0].pts;
    rbArr[2].starting = false;
    rbArr[3].starting = false;

    oStartingLineup.push(internals._sortObject(rbArr[0]));
    oStartingLineup.push(internals._sortObject(rbArr[1]));
    oStartingLineup.push(internals._sortObject(rbArr[2]));
    oStartingLineup.push(internals._sortObject(rbArr[3]));
  };

  const _setWRs = (data) => {
    let wrArr = data.startingLineup.filter(player => player.positionLabel === 'WR');
    wrArr = internals._sortArrByKey(wrArr, 'pts');
    wrArr[0].starting = true;
    wrArr[1].starting = true;
    wrArr[2].starting = true;
    weeklyPts += wrArr[0].pts;
    weeklyPts += wrArr[0].pts;
    weeklyPts += wrArr[0].pts;
    wrArr[3].starting = false;
    wrArr[4].starting = false;


    oStartingLineup.push(internals._sortObject(wrArr[0]));
    oStartingLineup.push(internals._sortObject(wrArr[1]));
    oStartingLineup.push(internals._sortObject(wrArr[2]));
    oStartingLineup.push(internals._sortObject(wrArr[3]));
    oStartingLineup.push(internals._sortObject(wrArr[4]));
  };

  const _setTEs = (data) => {

    let teArr = data.startingLineup.filter(player => player.positionLabel === 'TE');
    teArr = internals._sortArrByKey(teArr, 'pts');
    teArr[0].starting = true;
    weeklyPts += teArr[0].pts;
    teArr[1].starting = false;

    oStartingLineup.push(internals._sortObject(teArr[0]));
    oStartingLineup.push(internals._sortObject(teArr[1]));
  };

  const _setDSTs = (data) => {

    let dstArr = data.startingLineup.filter(player => player.positionLabel === 'DST');
    dstArr = internals._sortArrByKey(dstArr, 'pts');
    dstArr[0].starting = true;
    weeklyPts += dstArr[0].pts;
    dstArr[1].starting = false;

    oStartingLineup.push(internals._sortObject(dstArr[0]));
    oStartingLineup.push(internals._sortObject(dstArr[1]));
  };

  _setQBs(nflWeekStartingLineup[nflWeekStr])
  _setRBs(nflWeekStartingLineup[nflWeekStr])
  _setWRs(nflWeekStartingLineup[nflWeekStr])
  _setTEs(nflWeekStartingLineup[nflWeekStr])
  _setDSTs(nflWeekStartingLineup[nflWeekStr])

  card.scores[nflWeekStartingLineupIndex][nflWeekStr].startingLineup = [];
  card.scores[nflWeekStartingLineupIndex][nflWeekStr].startingLineup = oStartingLineup;

  card[`${nflWeekStr}-weeklyPts`] = weeklyPts.toFixed(2);

  return card;
}

internals.checkLineups = async (defaultLineup, cardId) => {
  let passesCheck = false
  let card = await db.readDocument('cards', cardId);
  if(
    card.QB.includes(defaultLineup.starting.QB[0]) &&
    card.QB.includes(defaultLineup.bench.QB[0]) &&

    card.RB.includes(defaultLineup.starting.RB[0]) &&
    card.RB.includes(defaultLineup.starting.RB[1]) &&
    card.RB.includes(defaultLineup.bench.RB[0]) &&
    card.RB.includes(defaultLineup.bench.RB[1]) &&

    card.WR.includes(defaultLineup.starting.WR[0]) &&
    card.WR.includes(defaultLineup.starting.WR[1]) &&
    card.WR.includes(defaultLineup.starting.WR[2]) &&
    card.WR.includes(defaultLineup.bench.WR[0]) &&
    card.WR.includes(defaultLineup.bench.WR[1]) &&

    card.TE.includes(defaultLineup.starting.TE[0]) &&
    card.TE.includes(defaultLineup.bench.TE[0]) &&

    card.DST.includes(defaultLineup.starting.DST[0]) &&
    card.DST.includes(defaultLineup.bench.DST[0])
  ){
    passesCheck = true
    return passesCheck
  }
  return passesCheck
}

internals.getTargetStat = (year, season, week, type) => {
  type = (type === 'week') ? 'weekly' : 'season';
  return `${year}-${season}-week-${week}-${type}Pts`;
}

internals.breakTie = async (team1, team2, nflWeekStr, targetStat, sort) => {

  let arr = [];

  //TODO: Write all the logic to the points we need. 
  // 1st. Total Bench Points
  const team1TotalBenchPoints = internals.getCardTotalBenchPts(team1, nflWeekStr);
  const team2TotalBenchPoints = internals.getCardTotalBenchPts(team2, nflWeekStr);

  if(team1TotalBenchPoints > team2TotalBenchPoints) {
      arr.push(team1);
      arr.push(team2);
      return arr;
  }
  if(team1TotalBenchPoints < team2TotalBenchPoints) {
      arr.push(team2);
      arr.push(team1);
      return arr;
  }


  //These next tie breaks in practic should never really be used but will have them if needed. 
  // 2nd. Starting Qb point total
  // 3rd. Starting Rb point total
  // 4th. Starting Wr point total
  // 5th. Starting Te point total
  // 6th. Starting Def point total
  return [team1, team2];
}

internals.getCardSeasonTotalBenchPts = (team, nflWeekStr) => {
  let totalBenchPts = 0;

  const teamScoresIndexBench16 = team.scores.findIndex(score => Object.keys(score).includes('2021-REG-week-16'));
  const teamScoresIndexBench17 = team.scores.findIndex(score => Object.keys(score).includes('2021-REG-week-17'));
  const teamScoresIndexBench18 = team.scores.findIndex(score => Object.keys(score).includes('2021-REG-week-18'));
  
  let bench16 = team.scores[teamScoresIndexBench16]['2021-REG-week-16'].startingLineup.filter(player => player.starting === false);
  let bench17 = team.scores[teamScoresIndexBench17]['2021-REG-week-17'].startingLineup.filter(player => player.starting === false);
  let bench18 = team.scores[teamScoresIndexBench18]['2021-REG-week-18'].startingLineup.filter(player => player.starting === false);
  
  bench16.forEach(player => {totalBenchPts += player.pts });
  bench17.forEach(player => {totalBenchPts += player.pts });
  bench18.forEach(player => {totalBenchPts += player.pts });

  return parseFloat(totalBenchPts.toFixed(2));
}

internals.runTieBreakerOnBenchScore = (arr, nflWeekStr) => {

  arr.forEach(card => {
    card.benchPts = internals.getCardSeasonTotalBenchPts(card, nflWeekStr);
  });

  arr = arr.sort((a, b) => b.benchPts - a.benchPts )

  return arr;
}

internals.sleep = async  (ms) => await new Promise(resolve => setTimeout(resolve, ms));

internals.formatFirebaseTimestamp = (timestamp) => new Date(timestamp._seconds*1000).toUTCString();

internals.formatTransactionResponse = async (tx) => {
  tx.createdAt = internals.formatFirebaseTimestamp(tx.createdAt);
  tx.value = await web3Utils.convert(tx.value, tx.units, 'ether');
  tx.units = 'ether';
  return tx;
}

internals.shuffle = function*(...array){
  let i = array.length;
  while (i--) {
    yield array.splice(Math.floor(Math.random() * (i + 1)), 1)[0];
  }
}

internals.pickChoosen = (arr, numChoosen) => {
  let randomPick = internals.shuffle(...arr);
  let current;
  let choosen = [];

  for(let i = 0; i < numChoosen; i++){
    current = randomPick.next().value;
    choosen.push(current);
  }

  return choosen;
}

internals.encryptWithAES = (text, passphrase) => CryptoJS.AES.encrypt(text, passphrase).toString();

internals.decryptWithAES = (ciphertext, passphrase) => {
  const bytes = CryptoJS.AES.decrypt(ciphertext, passphrase);
  const originalText = bytes.toString(CryptoJS.enc.Utf8);
  return originalText;
};

internals.isCardChoosen = (card) => {
  const SPOILEDCARDS = internals.SPOILEDCARDS;
  const spoiledCardsArr = internals.decryptWithAES(internals.SPOILEDCARDS).split(':');
  return spoiledCardsArr.find(spoiled => spoiled == card) ? true : false;
}

internals.isCardSpoiled = (card, level) => internals.isCardChoosen(card) ? `${level}:Spoiled` : level;

internals.getLineupHash = (card) => {

  let _startingQB = card.starting.QB.sort();
  let _benchQB = card.bench.QB.sort();

  let _startingRB = card.starting.RB.sort();
  let _benchRB = card.bench.RB.sort();

  let _startingWR = card.starting.WR.sort();
  let _benchWR = card.bench.WR.sort();

  let _startingTE = card.starting.TE.sort();
  let _benchTE = card.bench.TE.sort();

  let _startingDST = card.starting.DST.sort(); 
  let _benchDST = card.bench.DST.sort(); 

  return `QB:${_startingQB[0]},${_benchQB[0]}|RB:${_startingRB[0]},${_startingRB[1]},${_benchRB[0]},${_benchRB[1]}|WR:${_startingWR[0]},${_startingWR[1]},${_startingWR[2]},${_benchWR[0]},${_benchWR[1]}|TE:${_startingTE[0]},${_benchTE[0]}|DST:${_startingDST[0]},${_benchDST[0]}`; 
}

internals.getTeamHash = (card) => {

  let _QB = card.QB.sort();
  let _RB = card.RB.sort();
  let _WR = card.WR.sort();
  let _TE = card.TE.sort();
  let _DST = card.DST.sort(); 

  return `QB:${_QB[0]},${_QB[1]}|RB:${_RB[0]},${_RB[1]},${_RB[2]},${_RB[3]}|WR:${_WR[0]},${_WR[1]},${_WR[2]},${_WR[3]},${_WR[4]}|TE:${_TE[0]},${_TE[1]}|DST:${_DST[0]},${_DST[1]}`; 
}

internals.shuffleTeam = async (card) => {
  let shuffledTeam;
  let randomQB = internals.shuffle(...internals._VALID_NFL_TEAMS);
  let randomWR = internals.shuffle(...internals._VALID_NFL_TEAMS);
  let randomRB = internals.shuffle(...internals._VALID_NFL_TEAMS);
  let randomTE = internals.shuffle(...internals._VALID_NFL_TEAMS);
  let randomDST = internals.shuffle(...internals._VALID_NFL_TEAMS);

  if(card.prizes) {
    shuffledTeam = {
      _cardId: card._cardId,
      _freePeel: card._freePeel,
      _level: card._level,
      _ownerId: card._ownerId,
      prizes: card.prizes,
      QB: [randomQB.next().value, randomQB.next().value].sort(),
      RB: [randomRB.next().value, randomRB.next().value, randomRB.next().value, randomRB.next().value].sort(),
      WR: [randomWR.next().value, randomWR.next().value, randomWR.next().value, randomWR.next().value, randomWR.next().value].sort(),
      TE: [randomTE.next().value, randomTE.next().value].sort(),
      DST: [randomDST.next().value, randomDST.next().value].sort(),
    }
  } else {
    shuffledTeam = {
      _cardId: card._cardId,
      _freePeel: card._freePeel,
      _level: card._level,
      _ownerId: card._ownerId,
      QB: [randomQB.next().value, randomQB.next().value].sort(),
      RB: [randomRB.next().value, randomRB.next().value, randomRB.next().value, randomRB.next().value].sort(),
      WR: [randomWR.next().value, randomWR.next().value, randomWR.next().value, randomWR.next().value, randomWR.next().value].sort(),
      TE: [randomTE.next().value, randomTE.next().value].sort(),
      DST: [randomDST.next().value, randomDST.next().value].sort(),
    }
  }
  
  

  const teamHash = internals.getTeamHash(shuffledTeam);

  const alreadyExists = await db.validateUniquenessByTeamHash(teamHash);
  if(alreadyExists) return internals.shuffleTeam(card);
  shuffledTeam._teamHash = teamHash;

  return shuffledTeam;
}

internals.peelCard = async (card, peelType) => {
  let newCard = internals._sortObject(await internals.shuffleTeam(card));
  let isSpoiled = await internals.isCardSpoiledV2(peelType, card);
  
  if(isSpoiled === true && card._level.match('Spoiled')) {
    isSpoiled = false;
    await internals.skipCurrentSpoil(peelType);
  }

  if(isSpoiled === true && !card._level.match('Spoiled')) {
    newCard._level = 'Spoiled ' + newCard._level;
  }

  newCard = await api.getCardImage(newCard);
  return newCard;
}

internals.addFreePeelToSupply = async () => {
  let supply = await db.readDocument('supply', 'main');
  supply.freePeels.minted++;
  supply.freePeels.remaining--;
  await db.createOrUpdateDocument('supply', 'main', supply, true);
}

internals.addPaidPeelToSupply = async () => {
  let supply = await db.readDocument('supply', 'main');
  supply.paidPeels.minted++;
  supply.paidPeels.remaining--;
  await db.createOrUpdateDocument('supply', 'main', supply, true);
}

internals.canPeelOrMash = () => {
  const tuesday = 2;
  const wednesday = 3;  
  const currentDate = new Date(new Date().toLocaleDateString('en-us', { timeZone: 'America/New_York'})).getDay();
  if (currentDate === tuesday || currentDate === wednesday) {
    return true
  } else {
    return false;
  };
}

//TODO: Figured out how to better worked with the shared values in this context. 
internals._getArrOfRandomValues = (random, numValues, sharedValues = [] ) => {
  let arr = [];

  for (let i = 0; i < numValues; i++) {
    if(sharedValues[i]){
      arr.push(sharedValues[i]);
      continue;
    }
    arr.push(random.next().value);
  }
  return arr.sort();
}

//This returns all teams that are shared by card1 and card2.
//This works because if the array has it twice it must have come from both cards
internals._getSharedTeams = (arr) => arr.filter((item, index) => arr.indexOf(item) !== index);

internals.mashCards = async (card1, card2) => {
  let randomQBArr = [];
  card1.QB.forEach(team => {randomQBArr.push(team)});
  card2.QB.forEach(team => {randomQBArr.push(team)});
  const sharedQBArr = internals._getSharedTeams(randomQBArr);
  const sharedQBSet = new Set(sharedQBArr);
  randomQBArr = randomQBArr.filter(team => !sharedQBSet.has(team));
  randomQBArr = [...new Set(randomQBArr)];
  const randomQB = internals.shuffle(...randomQBArr);
  
  let randomWRArr = [];
  card1.WR.forEach(team => {randomWRArr.push(team)});
  card2.WR.forEach(team => {randomWRArr.push(team)});
  const sharedWRArr = internals._getSharedTeams(randomWRArr);
  const sharedWRSet = new Set(sharedWRArr);
  randomWRArr = randomWRArr.filter(team => !sharedWRSet.has(team));
  randomWRArr = [...new Set(randomWRArr)];
  const randomWR = internals.shuffle(...randomWRArr);
  
  let randomRBArr = [];
  card1.RB.forEach(team => {randomRBArr.push(team)});
  card2.RB.forEach(team => {randomRBArr.push(team)});
  const sharedRbTeams = internals._getSharedTeams(randomRBArr);
  const sharedRBSet = new Set(sharedRbTeams);
  randomRBArr = randomRBArr.filter( x => !sharedRBSet.has(x) );
  randomRBArr = [...new Set(randomRBArr)];
  const randomRB = internals.shuffle(...randomRBArr);
  
  let randomTEArr = [];
  card1.TE.forEach(team => {randomTEArr.push(team)});
  card2.TE.forEach(team => {randomTEArr.push(team)});
  const sharedTEArr = internals._getSharedTeams(randomTEArr);
  const sharedTESet = new Set(sharedTEArr);
  randomTEArr = randomTEArr.filter(team => !sharedTESet.has(team));
  randomTEArr = [...new Set(randomTEArr)];
  const randomTE = internals.shuffle(...randomTEArr);
  
  let randomDSTArr = [];
  card1.DST.forEach(team => {randomDSTArr.push(team)});
  card2.DST.forEach(team => {randomDSTArr.push(team)});
  const sharedDSTArr = internals._getSharedTeams(randomDSTArr);
  const sharedDSTSet = new Set(sharedDSTArr);
  randomDSTArr = randomDSTArr.filter(team => !sharedDSTSet.has(team));
  randomDSTArr = [...new Set(randomDSTArr)];
  const randomDST = internals.shuffle(...randomDSTArr);

  let mashedCard1;
  let mashedCard2;
  
  if(card1.prizes) {
    mashedCard1 = {
      _cardId: card1._cardId,
      _freePeel: card1._freePeel,
      _level: card1._level,
      _ownerId: card1._ownerId,
      prizes: card1.prizes,
      QB: internals._getArrOfRandomValues(randomQB, 2, sharedQBArr),
      RB: internals._getArrOfRandomValues(randomRB, 4, sharedRbTeams),
      WR: internals._getArrOfRandomValues(randomWR, 5, sharedWRArr),
      TE: internals._getArrOfRandomValues(randomTE, 2, sharedTEArr),
      DST: internals._getArrOfRandomValues(randomDST, 2, sharedDSTArr),
    }
  } else {
    mashedCard1 = {
      _cardId: card1._cardId,
      _freePeel: card1._freePeel,
      _level: card1._level,
      _ownerId: card1._ownerId,
      QB: internals._getArrOfRandomValues(randomQB, 2, sharedQBArr),
      RB: internals._getArrOfRandomValues(randomRB, 4, sharedRbTeams),
      WR: internals._getArrOfRandomValues(randomWR, 5, sharedWRArr),
      TE: internals._getArrOfRandomValues(randomTE, 2, sharedTEArr),
      DST: internals._getArrOfRandomValues(randomDST, 2, sharedDSTArr),
    }
  }
  
  if(card2.prizes) {
    mashedCard2 = {
      _cardId: card2._cardId,
      _freePeel: card2._freePeel,
      _level: card2._level,
      _ownerId: card2._ownerId,
      prizes: card2.prizes,
      QB: internals._getArrOfRandomValues(randomQB, 2, sharedQBArr),
      RB: internals._getArrOfRandomValues(randomRB, 4, sharedRbTeams),
      WR: internals._getArrOfRandomValues(randomWR, 5, sharedWRArr),
      TE: internals._getArrOfRandomValues(randomTE, 2, sharedTEArr),
      DST: internals._getArrOfRandomValues(randomDST, 2, sharedDSTArr),
    }
  } else {
    mashedCard2 = {
      _cardId: card2._cardId,
      _freePeel: card2._freePeel,
      _level: card2._level,
      _ownerId: card2._ownerId,
      QB: internals._getArrOfRandomValues(randomQB, 2, sharedQBArr),
      RB: internals._getArrOfRandomValues(randomRB, 4, sharedRbTeams),
      WR: internals._getArrOfRandomValues(randomWR, 5, sharedWRArr),
      TE: internals._getArrOfRandomValues(randomTE, 2, sharedTEArr),
      DST: internals._getArrOfRandomValues(randomDST, 2, sharedDSTArr),
    }
  }


  const team1Hash = internals.getTeamHash(mashedCard1);
  const team1AlreadyExists = await db.validateUniquenessByTeamHash(team1Hash);
  const team2Hash = internals.getTeamHash(mashedCard2);
  const team2AlreadyExists = await db.validateUniquenessByTeamHash(team2Hash);

  if(team1AlreadyExists || team2AlreadyExists || team1Hash === team2Hash) return internals.mashCards(card1, card2);
  mashedCard1._teamHash = team1Hash;
  mashedCard1 = internals._sortObject(mashedCard1);
  mashedCard2._teamHash = team2Hash;
  mashedCard2 = internals._sortObject(mashedCard2);

  let tempCard = {_level: card1._level.match('Spoiled') && card2._level.match('Spoiled') ? 'Spoiled' : 'Pro'};

  const isSpoiled = await internals.isCardSpoiledV2('paidMash', tempCard );

  //If Both cards are already spoiled and we spoil, we pass the spoil to another user
  if(isSpoiled && mashedCard1._level.includes('Spoiled') && mashedCard2._level.includes('Spoiled')){
      internals.skipCurrentSpoil('paidMashSpoils')
  }

  //if card1 is spoiled already then card 2 will get spoiled
  if(isSpoiled && mashedCard1._level.includes('Spoiled') && !mashedCard2._level.includes('Spoiled')){
    mashedCard2._level = 'Spoiled ' + mashedCard2._level;
  }

  //if card2 is spoiled already then card 1 will get spoiled
  if(isSpoiled && !mashedCard1._level.includes('Spoiled') && mashedCard2._level.includes('Spoiled')){
    mashedCard1._level = 'Spoiled ' + mashedCard1._level;
  }

  //if both cards are not spoiled then we will randomly choose one to be spoiled
  if(isSpoiled && !mashedCard1._level.includes('Spoiled') && !mashedCard2._level.includes('Spoiled')){
    let possibleCards = [1, 2];
    let randomCard = internals.shuffle(...possibleCards);
    const randomPick = randomCard.next().value;
    if(randomPick === 1) mashedCard1._level = 'Spoiled ' + mashedCard1._level;
    if(randomPick === 2) mashedCard2._level = 'Spoiled ' + mashedCard2._level;
  }

  return await api.getMashCardImages(mashedCard1, mashedCard2);
}

internals.addPaidMashToMintStats = async () => {
  let supply = await db.readDocument('supply', 'main');
  supply.paidMashes.minted++;
  supply.paidMashes.remaining--;
  await db.createOrUpdateDocument('supply', 'main', supply, true);
}

internals.getCurrentTransactionNumber = async (type) => {
  const supply = await db.readDocument('supply', 'main');
  if(type === 'freePeel') return supply.freePeels.minted + 1;
  if(type === 'paidPeel') return supply.paidPeels.minted + 1;
  if(type === 'paidMash') return supply.paidMashes.minted + 1;
}

internals.isCardSpoiledV2 = async (type, card) => {
  const PASSPHRASE = ENV.get('PASSPHRASE')
  const isCardAlreadySpoiled = card._level.match('Spoiled');

  let isSpoiled = false;

  if(isCardAlreadySpoiled) {
    await internals.skipCurrentSpoil(type);
    return false;
  }

  if(!isCardAlreadySpoiled){
    const num = await internals.getCurrentTransactionNumber(type);
    const spoils = await db.readDocument('spoil', 'main');

  if (type === 'freePeel') {
    const decryptedFreePeelSpoils = internals.decryptWithAES(spoils.freePeelSpoils, PASSPHRASE);
    const freePeelSpoils = decryptedFreePeelSpoils.split(',').map(x => parseInt(x));
    isSpoiled = freePeelSpoils.includes(num);
  }

  if (type === 'paidPeel') {
    const decryptedPaidPeelSpoils = internals.decryptWithAES(spoils.paidPeelSpoils, PASSPHRASE);
    const paidPeelSpoils = decryptedPaidPeelSpoils.split(',').map(x => parseInt(x));
    isSpoiled = paidPeelSpoils.includes(num);
  }

  if (type === 'paidMash') {
    const decryptedPaidMashSpoils = internals.decryptWithAES(spoils.paidMashSpoils, PASSPHRASE);
    const paidMashSpoils = decryptedPaidMashSpoils.split(',').map(x => parseInt(x));
    isSpoiled = paidMashSpoils.includes(num);
  }

  return isSpoiled;
  
  }
}

internals._getSpoilByType = (type) => {
  if(type === 'freePeel') return 'freePeelSpoils';
  if(type === 'paidPeel') return 'paidPeelSpoils';
  if(type === 'paidMash') return 'paidMashSpoils';
}

//on very rare occasion you will need to skip when both cards being mased are already spoiled. 
internals.skipCurrentSpoil = async (type) => {
  const spoilType = internals._getSpoilByType(type);
  let num = await internals.getCurrentTransactionNumber(type);
  console.log(`...skipping and reassigned current spoil at: ${num}`);
  let spoils = await db.readDocument('spoil', 'main');
  let targetSpoils = internals.decryptWithAES(spoils[spoilType], '24601');
  targetSpoils = targetSpoils.split(',');
  targetSpoils.sort((a, b) => a - b);
  let index = targetSpoils.indexOf(num.toString());
  if(index === -1) return;
  targetSpoils.splice(index, 1);
  let addNewSpoil = true;
  let newSpoilNum = num + 1;
  while(addNewSpoil) {
    const newSpoilDoesNotExist = targetSpoils.indexOf(newSpoilNum.toString()) === -1;
    if (newSpoilDoesNotExist) {
      targetSpoils.push(newSpoilNum.toString());
      targetSpoils = targetSpoils.sort((a, b) => parseInt(a) - parseInt(b));
      addNewSpoil = false;
    }
    else newSpoilNum++;
  }

  spoils[spoilType] = internals.encryptWithAES(targetSpoils.join(','), '24601');
  await db.createOrUpdateDocument('spoil', 'main', spoils, true);
}

internals.convertCardToCardMetadata = async (card) => {
  return cardMetadata = {
    attributes: [
      {
        trait_type: "QB1",
        value: card.QB[0],
      },
      {
        trait_type: "QB2",
        value: card.QB[1],
      },
      {
        trait_type: "RB1",
        value: card.RB[0],
      },
      {
        trait_type: "RB2",
        value: card.RB[1],
      },
      {
        trait_type: "RB3",
        value: card.RB[2],
      },
      {
        trait_type: "RB4",
        value: card.RB[3],
      },
      {
        trait_type: "WR1",
        value: card.WR[0],
      },
      {
        trait_type: "WR2",
        value: card.WR[1],
      },
      {
        trait_type: "WR3",
        value: card.WR[2],
      },
      {
        trait_type: "WR4",
        value: card.WR[3],
      },
      {
        trait_type: "WR5",
        value: card.WR[4],
      },
      {
        trait_type: "TE1",
        value: card.TE[0],
      },
      {
        trait_type: "TE2",
        value: card.TE[1],
      },
      {
        trait_type: "DST1",
        value: card.DST[0],
      },
      {
        trait_type: "DST2",
        value: card.DST[1],
      },
      {
        trait_type: "LEVEL",
        value: card._level,
      },
    ],
    description: "Our 10,000 Spoiled Banana Society Genesis Cards minted on the Ethereum blockchain doubles as your membership and gives you access to the Spoiled Banana Society benefits including playing each year in our SBS Genesis League with no further purchase necessary.",
    image: card._imageUrl,
    name: `Spoiled Banana Society ${card._cardId}`,
  };
}

internals.convertPlayoffCardToCardMetadata = async (card) => {
  return cardMetadata = {
    attributes: [
      {
        trait_type: "QB1",
        value: card.QB[0],
      },
      {
        trait_type: "QB2",
        value: card.QB[1],
      },
      {
        trait_type: "RB1",
        value: card.RB[0],
      },
      {
        trait_type: "RB2",
        value: card.RB[1],
      },
      {
        trait_type: "RB3",
        value: card.RB[2],
      },
      {
        trait_type: "RB4",
        value: card.RB[3],
      },
      {
        trait_type: "WR1",
        value: card.WR[0],
      },
      {
        trait_type: "WR2",
        value: card.WR[1],
      },
      {
        trait_type: "WR3",
        value: card.WR[2],
      },
      {
        trait_type: "WR4",
        value: card.WR[3],
      },
      {
        trait_type: "WR5",
        value: card.WR[4],
      },
      {
        trait_type: "TE1",
        value: card.TE[0],
      },
      {
        trait_type: "TE2",
        value: card.TE[1],
      },
      {
        trait_type: "DST1",
        value: card.DST[0],
      },
      {
        trait_type: "DST2",
        value: card.DST[1],
      },
      {
        trait_type: "LEVEL",
        value: card._level,
      },
    ],
    description: "Our 10,000 Spoiled Banana Society Playoff Season 1 Cards minted on the Ethereum blockchain doubles as your membership and gives you access to the Spoiled Banana Society benefits including playing each year in our SBS Playoffs Season 1 League with no further purchase necessary.",
    image: card._imageUrl,
    name: `Spoiled Banana Society Playoffs Season #1 ${card._cardId}`,
  };
}

internals.convertCardMetadataToCard = async (cardMetadata, cardId, ownerId) => {
  let card = {
    DST: [ cardMetadata.attributes.find(x => x.trait_type === 'DST1').value, cardMetadata.attributes.find(x => x.trait_type === 'DST2').value],
    QB: [ cardMetadata.attributes.find(x => x.trait_type === 'QB1').value, cardMetadata.attributes.find(x => x.trait_type === 'QB2').value],
    RB: [cardMetadata.attributes.find(x => x.trait_type === 'RB1').value, cardMetadata.attributes.find(x => x.trait_type === 'RB2').value, cardMetadata.attributes.find(x => x.trait_type === 'RB3').value, cardMetadata.attributes.find(x => x.trait_type === 'RB4').value],
    TE: [cardMetadata.attributes.find(x => x.trait_type === 'TE1').value, cardMetadata.attributes.find(x => x.trait_type === 'TE2').value],
    WR: [cardMetadata.attributes.find(x => x.trait_type === 'WR1').value, cardMetadata.attributes.find(x => x.trait_type === 'WR2').value, cardMetadata.attributes.find(x => x.trait_type === 'WR3').value, cardMetadata.attributes.find(x => x.trait_type === 'WR4').value, cardMetadata.attributes.find(x => x.trait_type === 'WR5').value],
    _cardId: cardId,
    _freePeel: 1,
    _imageUrl: cardMetadata.image,
    _level: cardMetadata.attributes.find(x => x.trait_type === 'LEVEL').value,
    _ownerId: ownerId ? ownerId : 'unassigned',
    _teamHash: '',
  };
  card._teamHash = internals.getTeamHash(card);

  card = internals.sortObject(card);

  return card;
}

internals.isNumberNegative = (num) => (Math.sign(num) === -1) ? true : false;

/**
 * @param  {} start //example: new Date(2022, 07, 27).getTime();
 * @param  {} end  //example: new Date(2022, 07, 27).getTime();
 * This function returns the amount of time between start and end generally.
 */
internals.getLeagueDurationText = (_start, _end) => {
  
  const JS_DAY_DURATION = 86400000;
  const JS_WEEK_DURATION = 604800000;
  const JS_SEASON_DURATION = 10281600000;

  let start = new Date(_start).getTime();
  let end = new Date(_end).getTime();
  
  if(start > end) throw new Error('Start cannon be later than End');
  const duration = end - start;  

  start = new Date(_start).toDateString();
  end = new Date(_end).toDateString();

  if(duration <= JS_DAY_DURATION) return `Daily(${start})`;
  if(duration > JS_DAY_DURATION && duration <= JS_WEEK_DURATION) return `Weekly(${start} - ${end})`;
  if(duration > JS_DAY_DURATION && duration <= JS_WEEK_DURATION) return `Weekly(${start} - ${end})`;
  if(duration > JS_WEEK_DURATION && duration < JS_SEASON_DURATION) return `Season(${start} - ${end})`;
  if(duration >= JS_SEASON_DURATION) return 'Season - Long';
}

internals.getLeagueSlot = async (duration, prize, place) => {
  const leagueIds = await db.readAllDocumentIds('leagues');
  if(!leagueIds) return 1;
  const matchingLeagues = leagueIds.filter(x => x.search(`${duration}|${prize}|${place}`) != -1)
  if(matchingLeagues.length < 1) return 1;
  let slotIds = [];
  matchingLeagues.forEach(Ids => {
    const slotId = parseInt(Ids.split('|')[3].trim());
    slotIds.push(slotId);
  });
  const maxSlotId = Math.max(...slotIds);
  return maxSlotId + 1;
}

internals.getPreviousLineup = (card, previouslyUsedLineup) => {
  
  const now = db._getTimeStamp();
  
  const previousLineup = {
    starting: {
      QB: [previouslyUsedLineup.starting.QB[0]],
      RB: [previouslyUsedLineup.starting.RB[0], previouslyUsedLineup.starting.RB[1]],
      WR: [previouslyUsedLineup.starting.WR[0], previouslyUsedLineup.starting.WR[1], previouslyUsedLineup.starting.WR[2]],
      TE: [previouslyUsedLineup.starting.TE[0]],
      DST: [previouslyUsedLineup.starting.DST[0]],
    },
    bench: {
      QB: [previouslyUsedLineup.bench.QB[1]],
      RB: [previouslyUsedLineup.bench.RB[2], previouslyUsedLineup.bench.RB[3]],
      WR: [previouslyUsedLineup.bench.WR[3], previouslyUsedLineup.bench.WR[4]],
      TE: [previouslyUsedLineup.bench.TE[1]],
      DST: [previouslyUsedLineup.bench.DST[1]],
    } ,
    _cardId: card._cardId,
    _ownerId: card._ownerId,
    _isLocked: false,  
    _isDefault: true,
    _isSetByCurrentOwner: false,
    _createdAt: now,
    _updatedAt: now,
  }
  return previousLineup;
}

internals.getDefaultLineup = (card) => {
  
  const now = db._getTimeStamp();
  
  const lineup = {
    starting: {
      QB: [card.QB[0]],
      RB: [card.RB[0], card.RB[1]],
      WR: [card.WR[0], card.WR[1], card.WR[2]],
      TE: [card.TE[0]],
      DST: [card.DST[0]],
    },
    bench: {
      QB: [card.QB[1]],
      RB: [card.RB[2], card.RB[3]],
      WR: [card.WR[3], card.WR[4]],
      TE: [card.TE[1]],
      DST: [card.DST[1]],
    } ,
    startingTeamArr: null,
    _cardId: card._cardId,
    _ownerId: card._ownerId,
    _isLocked: false, 
    _isDefault: true,
    _isSetByCurrentOwner: false,
    _createdAt: now,
    _updatedAt: now,
    gameWeek: null,
    prevWeekSeasonScore: null,
    scoreWeek: null,
    scoreSeason: null,
  }

  lineup.startingTeamArr = weekTransition.createTeamStartingArrayForLineup(lineup)
  return lineup;
}

internals.setLineup = (newLineup, card) => {
  return {
    starting: newLineup.starting,
    bench: newLineup.bench,
    startingTeamArr: newLineup.startingTeamArr,
    _cardId: card._cardId,
    _ownerId: card._ownerId,
    _isLocked: false,
    _isDefault: true,
    _isSetByCurrentOwner: true,
    _updatedAt: db._getTimeStamp()
  }
}

internals.setAdminLineup = (newLineup, card) => {
  return {
    starting: newLineup.starting,
    bench: newLineup.bench,
    startingTeamArr: newLineup.startingTeamArr,
    _cardId: card._cardId,
    _ownerId: card.ownerId,
    _isSetByCurrentOwner: false,
    _updatedAt: db._getTimeStamp()
  }
}

internals.setLineupInLeague = async (lineup, league, gameWeek, ownerId, isDefault = false) => {
  const leagueId = league.id;
  const cardId = lineup._cardId;

  const prevLineup = await db.readDocument(`leagues/${leagueId}/cards/${cardId}/lineups`, gameWeek);
  const txId = `systemLineup-${uuidv4()}`;
  if(!prevLineup){
    const transactionObject = {
      txId: txId,
      ownerId: ownerId,
      createdAt: db._getTimeStamp(),
      leagueId: leagueId,
      cardId: cardId,
      type: 'systemLineup',
      isDefault,
      newLineup: lineup,
      oldLineup: prevLineup
    }
  
    await db.createOrUpdateDocument(`transactions`, txId, transactionObject, false);
    await db.createOrUpdateDocument(`owners/${ownerId}/transactions`, txId, transactionObject, false);
    await db.createOrUpdateDocument(`leagues/${leagueId}/cards/${cardId}/lineups`, gameWeek, lineup, false);

    console.log(`...👟   league:${leagueId} cardId:${cardId} gameWeek:${gameWeek} default lineup set`);
  } else {
    console.log(`...🙅🏻‍♂️   league:${leagueId} cardId:${cardId} gameWeek:${gameWeek} lineup already set`);
  }
}

internals.setDefaultLineupAferMashOrPeel = async (lineup, leagueId, gameWeek, ownerId, isDefault = true) => {
  const cardId = lineup._cardId;
  const txId = `systemLineup-${uuidv4()}`;

  const transactionObject = {
    txId: txId,
    ownerId: ownerId,
    createdAt: db._getTimeStamp(),
    leagueId: leagueId,
    cardId: cardId,
    type: 'systemLineup',
    isDefault,
    newLineup: lineup
  }
  
  await db.createOrUpdateDocument(`transactions`, txId, transactionObject, false);
  await db.createOrUpdateDocument(`owners/${ownerId}/transactions`, txId, transactionObject, false);
  await db.createOrUpdateDocument(`leagues/${leagueId}/cards/${cardId}/lineups`, gameWeek, lineup, false);

  console.log(`...👟   league:${leagueId} cardId:${cardId} gameWeek:${gameWeek} default lineup set`);
}

internals.doesOwnerAlreadyHaveCardInLeague = async (ownerId, leagueId) => {
  let isOwnerAlreadyInLeague = false;
  const cardsInLeague = await db.readAllDocuments(`leagues/${leagueId}/cards`);
  let numCards = 0;
  if (cardsInLeague) numCards = cardsInLeague.length 
  for(let i = 0; i < numCards; i++){
    const card = cardsInLeague[i];
    if(card._ownerId === ownerId) isOwnerAlreadyInLeague = true;
  }
  return isOwnerAlreadyInLeague;
}

internals.applyDefaultValues = async (owner, ownerId) => {
  if(!owner.availableCredit){
    const availableCredit = { availableCredit: 0 }
    await db.createOrUpdateDocument('owners', ownerId, availableCredit, true);
  }

  if(!owner.pendingCredit){
    const pendingCredit = { pendingCredit: 0 }
    await db.createOrUpdateDocument('owners', ownerId, pendingCredit, true);
  }

  if(!owner.Leagues) {
    const leagues = [];
    await db.createOrUpdateDocument('owners', ownerId, leagues, true)
  }
};

// utils to check if owner wallet is an admin wallet
internals.checkIfAdminWallet = (ownerId) => {
  let isAdminWallet = false;
  const admin_wallet_addresses = (ENV.get('NETWORK') === 'mainnet') ?  ENV.get('MAINNET_ADMIN_WALLET_ADDRESSES') : ENV.get('RINKEBY_ADMIN_WALLET_ADDRESSES');
  admin_wallet_addresses.map(address => address.toLowerCase());
  if(admin_wallet_addresses.includes(ownerId.toLowerCase())){
    isAdminWallet = true;
  }
  return isAdminWallet;
}

internals.isCardOnLeaderboardFilter = (level, cardLevel) => {
  level = level.toLowerCase();
  cardLevel = cardLevel.toLowerCase();

  if(level === 'pro') return true;
  
  if(level === 'spoiled pro'){
    return (cardLevel.includes('spoiled pro')) ? true : false;
  }
  
  if(level === 'spoiled hall of fame'){
    return (cardLevel.includes('spoiled Hall of fame')) ? true : false;
  }
  
  if(level === 'hall of fame'){
    return (cardLevel ==='hall of fame') ? true : false;
  }

  return false;

}

internals.fetchPointsForPosition = (position, team, scores) => {
  let currentTeam = scores.FantasyPoints.find(x => x.Team === team)
  for(let key in currentTeam){
    if(key === position){
      return currentTeam[key]
    }
  }
}

internals.checkLineupOnFetch = (passedTeam, scores) => {
  const noGo = ['InProgress', 'halftime', 'Final', 'closed'];
  let canTeamStart = false
  let currentTeam = scores.FantasyPoints.find(x => x.Team === passedTeam)
  console.log('Current Team: ', currentTeam)
  for(let i=0; i < noGo.length; i++){
    if(noGo[i] === currentTeam.GameStatus){
      return canTeamStart
    }
  }

  canTeamStart = true
  return canTeamStart
}

internals.checkLineupIsValid = (prevLineup, currentLineup, scores) => {
  const noGo = ['InProgress', 'halftime', 'Final', 'closed'];
  
  let isPrevGo;
  let isCurrentGo;
  let isLineupChange;
  let isMatchingStartingAndBench
  
  //Starting and bench cannot be the same
  
  const _starting = [
    {position: 'QB', index: 0}, 
    {position: 'RB', index: 0}, 
    {position: 'RB', index: 1}, 
    {position: 'WR', index: 0}, 
    {position: 'WR', index: 1}, 
    {position: 'WR', index: 2}, 
    {position: 'TE', index: 0}, 
    {position: 'DST', index: 0}
  ];
  const _bench = [
    {position: 'QB', index: 0}, 
    {position: 'RB', index: 0}, 
    {position: 'RB', index: 1}, 
    {position: 'WR', index: 0}, 
    {position: 'WR', index: 1}, 
    {position: 'TE', index: 0}, 
    {position: 'DST', index: 0}
  ];

  for (let i = 0; i < _starting.length; i++) {
    const position = _starting[i].position;
    const index = _starting[i].index;
    isMatchingStartingAndBench = currentLineup.bench[position].includes(currentLineup.starting[position][index]);
    //isPrevGo = noGo.includes(scores.FantasyPoints.find(x => x.team === prevLineup.starting[position][index]).GameStatus) ? false : true;
    //console.log(`isPrevGo ${prevLineup.starting[position][index]}:`, isPrevGo)
    //isCurrentGo = noGo.includes(scores.FantasyPoints.find(x => x.team === currentLineup.starting[position][index]).GameStatus) ? false : true;
    isLineupChange = prevLineup.starting[position][index] != currentLineup.starting[position][index] ? true : false;
    if(isMatchingStartingAndBench) return false;
    if(!isLineupChange) continue;
    //if(!isPrevGo || !isCurrentGo) return false;

  }

  for (let i = 0; i < _bench.length; i++) {
    const position = _bench[i].position;
    const index = _bench[i].index;
    isMatchingStartingAndBench = currentLineup.starting[position].includes(currentLineup.bench[position][index]);
    //isPrevGo = noGo.includes(scores.FantasyPoints.find(x => x.team === prevLineup.bench[position][index]).GameStatus)? false : true;
    //isCurrentGo = noGo.includes(scores.FantasyPoints.find(x => x.team === currentLineup.bench[position][index]).GameStatus)? false : true;
    isLineupChange = prevLineup.bench[position][index] != currentLineup.bench[position][index] ? true : false;
    if(isMatchingStartingAndBench) return false;
    if(!isLineupChange) continue;
    //if(!isPrevGo || !isCurrentGo) return false;
  }

  return true;
}

internals.getIrrelevantLeagueStrings = (gameweek) => {
  if (gameweek == "2022-REG-01") return [];
  if (gameweek == "2022-REG-02") return ["Weekly(Thu Sep 08 2022 "];
  if (gameweek == "2022-REG-03") return ["Weekly(Thu Sep 08 2022 ", "Weekly(Thu Sep 15 2022 "];
  if (gameweek == "2022-REG-04") return ["Weekly(Thu Sep 08 2022 ", "Weekly(Thu Sep 15 2022 ", "Weekly(Thu Sep 22 2022 "];
  if (gameweek == "2022-REG-05") return ["Weekly(Thu Sep 08 2022 ", "Weekly(Thu Sep 15 2022 ", "Weekly(Thu Sep 22 2022 ", "Weekly(Thu Sep 29 2022 "];
  if (gameweek == "2022-REG-06") return ["Weekly(Thu Sep 08 2022 ", "Weekly(Thu Sep 15 2022 ", "Weekly(Thu Sep 22 2022 ", "Weekly(Thu Sep 29 2022 ", "Weekly(Thu Oct 06 2022 "];
  if (gameweek == "2022-REG-07") return ["Weekly(Thu Sep 08 2022 ", "Weekly(Thu Sep 15 2022 ", "Weekly(Thu Sep 22 2022 ", "Weekly(Thu Sep 29 2022 ", "Weekly(Thu Oct 06 2022 ", "Weekly(Thu Oct 13 2022 "];
  if (gameweek == "2022-REG-08") return ["Weekly(Thu Sep 08 2022 ", "Weekly(Thu Sep 15 2022 ", "Weekly(Thu Sep 22 2022 ", "Weekly(Thu Sep 29 2022 ", "Weekly(Thu Oct 06 2022 ", "Weekly(Thu Oct 13 2022 ", "Weekly(Thu Oct 20 2022 "];
  if (gameweek == "2022-REG-09") return ["Weekly(Thu Sep 08 2022 ", "Weekly(Thu Sep 15 2022 ", "Weekly(Thu Sep 22 2022 ", "Weekly(Thu Sep 29 2022 ", "Weekly(Thu Oct 06 2022 ", "Weekly(Thu Oct 13 2022 ", "Weekly(Thu Oct 20 2022 ", "Weekly(Thu Oct 27 2022 "];
  if (gameweek == "2022-REG-10") return ["Weekly(Thu Sep 08 2022 ", "Weekly(Thu Sep 15 2022 ", "Weekly(Thu Sep 22 2022 ", "Weekly(Thu Sep 29 2022 ", "Weekly(Thu Oct 06 2022 ", "Weekly(Thu Oct 13 2022 ", "Weekly(Thu Oct 20 2022 ", "Weekly(Thu Oct 27 2022 ", "Weekly(Thu Nov 03 2022 "];
  if (gameweek == "2022-REG-11") return ["Weekly(Thu Sep 08 2022 ", "Weekly(Thu Sep 15 2022 ", "Weekly(Thu Sep 22 2022 ", "Weekly(Thu Sep 29 2022 ", "Weekly(Thu Oct 06 2022 ", "Weekly(Thu Oct 13 2022 ", "Weekly(Thu Oct 20 2022 ", "Weekly(Thu Oct 27 2022 ", "Weekly(Thu Nov 03 2022 ", "Weekly(Thu Nov 10 2022 "];
  if (gameweek == "2022-REG-12") return ["Weekly(Thu Sep 08 2022 ", "Weekly(Thu Sep 15 2022 ", "Weekly(Thu Sep 22 2022 ", "Weekly(Thu Sep 29 2022 ", "Weekly(Thu Oct 06 2022 ", "Weekly(Thu Oct 13 2022 ", "Weekly(Thu Oct 20 2022 ", "Weekly(Thu Oct 27 2022 ", "Weekly(Thu Nov 03 2022 ", "Weekly(Thu Nov 10 2022 ", "Weekly(Thu Nov 17 2022 "];
  if (gameweek == "2022-REG-13") return ["Weekly(Thu Sep 08 2022 ", "Weekly(Thu Sep 15 2022 ", "Weekly(Thu Sep 22 2022 ", "Weekly(Thu Sep 29 2022 ", "Weekly(Thu Oct 06 2022 ", "Weekly(Thu Oct 13 2022 ", "Weekly(Thu Oct 20 2022 ", "Weekly(Thu Oct 27 2022 ", "Weekly(Thu Nov 03 2022 ", "Weekly(Thu Nov 10 2022 ", "Weekly(Thu Nov 17 2022 ", "Weekly(Thu Nov 24 2022 "];
  if (gameweek == "2022-REG-14") return ["Weekly(Thu Sep 08 2022 ", "Weekly(Thu Sep 15 2022 ", "Weekly(Thu Sep 22 2022 ", "Weekly(Thu Sep 29 2022 ", "Weekly(Thu Oct 06 2022 ", "Weekly(Thu Oct 13 2022 ", "Weekly(Thu Oct 20 2022 ", "Weekly(Thu Oct 27 2022 ", "Weekly(Thu Nov 03 2022 ", "Weekly(Thu Nov 10 2022 ", "Weekly(Thu Nov 17 2022 ", "Weekly(Thu Nov 24 2022 ", "Weekly(Thu Dec 01 2022 "];
  if (gameweek == "2022-REG-15") return ["Weekly(Thu Sep 08 2022 ", "Weekly(Thu Sep 15 2022 ", "Weekly(Thu Sep 22 2022 ", "Weekly(Thu Sep 29 2022 ", "Weekly(Thu Oct 06 2022 ", "Weekly(Thu Oct 13 2022 ", "Weekly(Thu Oct 20 2022 ", "Weekly(Thu Oct 27 2022 ", "Weekly(Thu Nov 03 2022 ", "Weekly(Thu Nov 10 2022 ", "Weekly(Thu Nov 17 2022 ", "Weekly(Thu Nov 24 2022 ", "Weekly(Thu Dec 01 2022 ", "Weekly(Thu Dec 08 2022 "];
  if (gameweek == "2022-REG-16") return ["Weekly(Thu Sep 08 2022 ", "Weekly(Thu Sep 15 2022 ", "Weekly(Thu Sep 22 2022 ", "Weekly(Thu Sep 29 2022 ", "Weekly(Thu Oct 06 2022 ", "Weekly(Thu Oct 13 2022 ", "Weekly(Thu Oct 20 2022 ", "Weekly(Thu Oct 27 2022 ", "Weekly(Thu Nov 03 2022 ", "Weekly(Thu Nov 10 2022 ", "Weekly(Thu Nov 17 2022 ", "Weekly(Thu Nov 24 2022 ", "Weekly(Thu Dec 01 2022 ", "Weekly(Thu Dec 08 2022 ", "Weekly(Thu Dec 15 2022 "];
  if (gameweek == "2022-REG-17") return ["Weekly(Thu Sep 08 2022 ", "Weekly(Thu Sep 15 2022 ", "Weekly(Thu Sep 22 2022 ", "Weekly(Thu Sep 29 2022 ", "Weekly(Thu Oct 06 2022 ", "Weekly(Thu Oct 13 2022 ", "Weekly(Thu Oct 20 2022 ", "Weekly(Thu Oct 27 2022 ", "Weekly(Thu Nov 03 2022 ", "Weekly(Thu Nov 10 2022 ", "Weekly(Thu Nov 17 2022 ", "Weekly(Thu Nov 24 2022 ", "Weekly(Thu Dec 01 2022 ", "Weekly(Thu Dec 08 2022 ", "Weekly(Thu Dec 15 2022 ", "Weekly(Thu Dec 22 2022 "];
  if (gameweek == "2022-REG-18") return ["Weekly(Thu Sep 08 2022 ", "Weekly(Thu Sep 15 2022 ", "Weekly(Thu Sep 22 2022 ", "Weekly(Thu Sep 29 2022 ", "Weekly(Thu Oct 06 2022 ", "Weekly(Thu Oct 13 2022 ", "Weekly(Thu Oct 20 2022 ", "Weekly(Thu Oct 27 2022 ", "Weekly(Thu Nov 03 2022 ", "Weekly(Thu Nov 10 2022 ", "Weekly(Thu Nov 17 2022 ", "Weekly(Thu Nov 24 2022 ", "Weekly(Thu Dec 01 2022 ", "Weekly(Thu Dec 08 2022 ", "Weekly(Thu Dec 15 2022 ", "Weekly(Thu Dec 22 2022 ", "Weekly(Thu Dec 29 2022 "];
}


internals.isWeeklyPayout = (league) => {
  

  const isCoinPrize = league.prize.coin.isCoinPrize;
  
  //if not a coin prize no weekly payout
  if(!isCoinPrize) return false;
  
  //check duration
  const leagueStart = league.duration.start;
  const leagueEnd = league.duration.end;
  
  const daysBetweenStartAndEnd = DateTime.fromISO(leagueEnd).diff(DateTime.fromISO(leagueStart), 'days').days;
  
  return (daysBetweenStartAndEnd < 7) ? true : false;
}

internals.adjustWeeklyResults = (gameWeek, league, results) => {
  const weeklyResults = results.week;
  const entryFee = league.entry.fee;
  const potBasedUponResults = (weeklyResults.length * entryFee) * 0.9;
  const adjustedWeeklyResults = []
  for(let i = 0; i < weeklyResults.length; i ++){
    const adjustWeeklyResult = weeklyResults[i];
    if(adjustWeeklyResult.paid) adjustWeeklyResult.paid = potBasedUponResults
    adjustedWeeklyResults.push(adjustWeeklyResult);
  }

  return {
    gameWeek, 
    week: adjustedWeeklyResults,
    season: results.season
  };
}

internals.getAwardPrizeId = (gameWeek, cardId, leagueId, prizeCoin, prizeAmount) => {
  return `${gameWeek}-${leagueId}-${cardId}-${prizeCoin}-${prizeAmount}`;
}

internals.getStringsForCurrentWeek2022 = (gameWeek) => {
  if (gameWeek == "2022-REG-01") {
      return ['Season(Thu Sep 08 2022', 'Weekly(Thu Sep 08 2022']
  } else if (gameWeek == "2022-REG-02") {
      return ['Season(Thu Sep 15 2022', 'Weekly(Thu Sep 15 2022']
  } else if (gameWeek == "2022-REG-03") {
      return ['Season(Thu Sep 22 2022', 'Weekly(Thu Sep 22 2022']
  } else if (gameWeek == "2022-REG-04") {
      return ['Season(Thu Sep 29 2022', 'Weekly(Thu Sep 29 2022']
  } else if (gameWeek == "2022-REG-05") {
      return ['Season(Thu Oct 06 2022', 'Weekly(Thu Oct 06 2022']
  } else if (gameWeek == "2022-REG-06") {
      return ['Season(Thu Oct 13 2022', 'Weekly(Thu Oct 13 2022']
  } else if (gameWeek == "2022-REG-07") {
      return ['Season(Thu Oct 20 2022', 'Weekly(Thu Oct 20 2022']
  } else if (gameWeek == "2022-REG-08") {
      return ['Season(Thu Oct 27 2022', 'Weekly(Thu Oct 27 2022']
  } else if (gameWeek == "2022-REG-09") {
      return ['Season(Thu Nov 03 2022', 'Weekly(Thu Nov 03 2022']
  } else if (gameWeek == "2022-REG-10") {
      return ['Season(Thu Nov 10 2022', 'Weekly(Thu Nov 10 2022']
  } else if (gameWeek == "2022-REG-11") {
      return ['Season(Thu Nov 17 2022', 'Weekly(Thu Nov 17 2022']
  } else if (gameWeek == "2022-REG-12") {
      return ['Season(Thu Nov 24 2022', 'Weekly(Thu Nov 24 2022']
  } else if (gameWeek == "2022-REG-13") {
      return ['Season(Thu Dec 01 2022', 'Weekly(Thu Dec 01 2022']
  } else if (gameWeek == "2022-REG-14") {
      return ['Season(Thu Dec 08 2022', 'Weekly(Thu Dec 08 2022']
  } else if (gameWeek == "2022-REG-15") {
      return ['Season(Thu Dec 15 2022', 'Weekly(Thu Dec 15 2022']
  } else if (gameWeek == "2022-REG-16") {
      return ['Season(Thu Dec 22 2022', 'Weekly(Thu Dec 22 2022']
  } else if (gameWeek == "2022-REG-17") {
      return ['Season(Thu Dec 29 2022', 'Weekly(Thu Dec 29 2022']
  } else if (gameWeek == "2022-REG-18") {
      return ['Season(Thu Jan 05 2022', 'Weekly(Thu Jan 05 2022']
  }
}


module.exports = internals;