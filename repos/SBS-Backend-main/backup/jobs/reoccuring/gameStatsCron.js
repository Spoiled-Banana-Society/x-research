import utils from '../../services/utils.js';
import db from '../../services/db.js';

//This cron intent it only to get the stats for the current just the previous nfl week. 
//DWH will involve using the this logic but with arguments to calculate performance.


//The game stats cron will pull data from the sportradar api and store it in the database
(async () => {

  
  //Get week of game stats
  const year = new Date().getFullYear();
  const season = utils.getNFLSeason(year);
  const week = await utils.getNFLWeek(season);
  const nflWeekStr = `${year}-${season}-week-${week}`;

  //Get Stats
  const games = await utils.getGames(year, season, week);
  const stats = await utils.getFantasyStats(games);
  stats.offense = await utils.rankPlayers(stats.offense);
  stats.defense = await utils.rankDefense(stats.defense);
  const gameStats = {year, season, week, stats}
  await db.createOrUpdateDocument('stats', nflWeekStr, gameStats);
  console.log("...🏈  stats successfully Set!");


  //Calc Scores
  const nflTeams = utils.getAllNFLTeams();
  let teamStats = {};
  teamStats.FantasyPoints = [];
  for (let i = 0; i < nflTeams.length; i++) {
    teamStats.FantasyPoints.push({
      team: nflTeams[i],
      QB: utils.getPlayerScore(gameStats, nflTeams[i], 'QB'),
      RB: utils.getPlayerScore(gameStats, nflTeams[i], 'RB'),
      WR: utils.getPlayerScore(gameStats, nflTeams[i], 'WR'),
      TE: utils.getPlayerScore(gameStats, nflTeams[i], 'TE'),
      DST: utils.getPlayerScore(gameStats, nflTeams[i], 'DST'),
    });
  }
  await db.createOrUpdateDocument('scores', nflWeekStr, teamStats);
  console.log("...🏆 scores by NFL Team successfully Set!");

  //Set Card Scores  

  //const teamStats = await db.readDocument('fantasyScoreByNFLTeam', nflWeekStr);

  //take teamStats and add weekly and season score to all the teams
  //const cardIds = await db.readAllDocumentIds('cards');
  //await utils.scoreCards(nflWeekStr, teamStats, cardIds);

  process.exit(0);
})();