//PACKAGES
require("firebase-functions/lib/logger/compat");


//SERVICES
const utils = require('./utils');
const db = require('./db');

const internals = {};

//TODO: Figure out how to get the NFL week in a much better way for this season.
internals.getNFLWeek = async (year = new Date().getFullYear(), season = 'REG', week) => {
  console.log('...get nfl week!'); 
  if(week === undefined) week = await utils.getNFLWeek(year, season);
  return `${year}-${season}-week-${week}`;
}

internals.addWeeks = (numOfWeeks, date) => {
  const _date = new Date(date);
  _date.setDate(_date.getDate() + numOfWeeks * 7);
  return _date;
}

internals.getNFLWeekV2 = (_date) => {

  const localTime = new Date().toLocaleString("en-US", {
    timeZone: "America/New_York",
    dateStyle: "short"
});

  const year = '20' + localTime.split('/')[2];
  const day = localTime.split('/')[1];
  const month = localTime.split('/')[0];
  const date = _date ?  new Date(_date) : new Date(`${year}-${month}-${day}`);
  

  //convert week to workable time
  const START_WEEK_1 = new Date('2025-09-02');
  const END_WEEK_1 = internals.addWeeks(1, new Date(START_WEEK_1));
  
  const START_WEEK_2 = new Date(END_WEEK_1);
  const END_WEEK_2 = internals.addWeeks(1, new Date(START_WEEK_2));
  
  const START_WEEK_3 = new Date(END_WEEK_2);
  const END_WEEK_3 = internals.addWeeks(1, new Date(START_WEEK_3));
  
  const START_WEEK_4 =new Date(END_WEEK_3)
  const END_WEEK_4 = internals.addWeeks(1, new Date(START_WEEK_4));
  
  const START_WEEK_5 = new Date(END_WEEK_4)
  const END_WEEK_5 = internals.addWeeks(1, new Date(START_WEEK_5));
  
  const START_WEEK_6 = new Date(END_WEEK_5);
  const END_WEEK_6 = internals.addWeeks(1, new Date(START_WEEK_6));
  
  const START_WEEK_7 = new Date(END_WEEK_6);
  const END_WEEK_7 = internals.addWeeks(1, new Date(START_WEEK_7));
  
  const START_WEEK_8 = new Date(END_WEEK_7);
  const END_WEEK_8 = internals.addWeeks(1, new Date(START_WEEK_8));
  
  const START_WEEK_9 = new Date(END_WEEK_8);
  const END_WEEK_9 = internals.addWeeks(1, new Date(START_WEEK_9));
  
  const START_WEEK_10 = new Date(END_WEEK_9);
  const END_WEEK_10 = internals.addWeeks(1, new Date(START_WEEK_10));
  
  const START_WEEK_11 = new Date(END_WEEK_10);
  const END_WEEK_11 = internals.addWeeks(1, new Date(START_WEEK_11));
  
  const START_WEEK_12 = new Date(END_WEEK_11);
  const END_WEEK_12 = internals.addWeeks(1, new Date(START_WEEK_12));
  
  const START_WEEK_13 = new Date(END_WEEK_12);
  const END_WEEK_13 = internals.addWeeks(1, new Date(START_WEEK_13));
  
  const START_WEEK_14 = new Date(END_WEEK_13);
  const END_WEEK_14 = internals.addWeeks(1, new Date(START_WEEK_14));
  
  const START_WEEK_15 = new Date(END_WEEK_14);
  const END_WEEK_15 = internals.addWeeks(1, new Date(START_WEEK_15));
  
  const START_WEEK_16 = new Date(END_WEEK_15);
  const END_WEEK_16 = internals.addWeeks(1, new Date(START_WEEK_16));
  
  const START_WEEK_17 = new Date(END_WEEK_16);
  const END_WEEK_17 = internals.addWeeks(1, new Date(START_WEEK_17));
  
  const START_WEEK_18 = new Date(END_WEEK_17);
  const END_WEEK_18 = internals.addWeeks(1, new Date(START_WEEK_18));

  const START_PLAYOFFS_01 = new Date(END_WEEK_18)
  const END_PLAYOFFS_01 = internals.addWeeks(1, new Date(START_PLAYOFFS_01));

  const START_PLAYOFFS_02 = new Date(END_PLAYOFFS_01)
  const END_PLAYOFFS_02 = internals.addWeeks(1, new Date(START_PLAYOFFS_02));

  const START_PLAYOFFS_03 = new Date(END_PLAYOFFS_02)
  const END_PLAYOFFS_03 = internals.addWeeks(1, new Date(START_PLAYOFFS_03));

  const START_PLAYOFFS_04 = new Date(END_PLAYOFFS_03)
  const END_PLAYOFFS_04 = internals.addWeeks(1, new Date(START_PLAYOFFS_04));
  

  if(date < END_WEEK_1) return '2025REG-01';
  if(date >= START_WEEK_2 && date < END_WEEK_2) return '2025REG-02';
  if(date >= START_WEEK_3 && date < END_WEEK_3) return '2025REG-03';
  if(date >= START_WEEK_4 && date < END_WEEK_4) return '2025REG-04';
  if(date >= START_WEEK_5 && date < END_WEEK_5) return '2025REG-05';
  if(date >= START_WEEK_6 && date < END_WEEK_6) return '2025REG-06';
  if(date >= START_WEEK_7 && date < END_WEEK_7) return '2025REG-07';
  if(date >= START_WEEK_8 && date < END_WEEK_8) return '2025REG-08';
  if(date >= START_WEEK_9 && date < END_WEEK_9) return '2025REG-09';
  if(date >= START_WEEK_10 && date < END_WEEK_10) {
    console.log("somehow I am in here")
    return '2025REG-10';
  }
  if(date >= START_WEEK_11 && date < END_WEEK_11) return '2025REG-11';
  if(date >= START_WEEK_12 && date < END_WEEK_12) return '2025REG-12';
  if(date >= START_WEEK_13 && date < END_WEEK_13) return '2025REG-13';
  if(date >= START_WEEK_14 && date < END_WEEK_14) return '2025REG-14';
  if(date >= START_WEEK_15 && date < END_WEEK_15) return '2025REG-15';
  if(date >= START_WEEK_16 && date < END_WEEK_16) return '2025REG-16';
  if(date >= START_WEEK_17 && date < END_WEEK_17) return '2025REG-17';
  if(date >= START_WEEK_18 && date < END_WEEK_18) return '2025REG-18';
  if(date > START_PLAYOFFS_01 && date < END_PLAYOFFS_01) return '2023PST-01';
  if(date > START_PLAYOFFS_02 && date < END_PLAYOFFS_02) return '2023PST-02';
  if(date > START_PLAYOFFS_03 && date < END_PLAYOFFS_03) return '2023PST-03';
  if(date > START_PLAYOFFS_04) return '2023PST-04';
}

internals.getPreviousNFLWeek = (gameWeek = sbs.getNFLWeekV2()) => {
    switch (gameWeek) {
        case "2025REG-02":
            return "2025REG-01"
        case "2025REG-03":
            return "2025REG-02"
        case "2025REG-04":
            return "2025REG-03"
        case "2025REG-05":
            return "2025REG-04"
        case "2025REG-06":
            return "2025REG-05"
        case "2025REG-07":
            return "2025REG-06"
        case "2025REG-08":
            return "2025REG-07"
        case "2025REG-09":
            return "2025REG-08"
        case "2025REG-10":
            return "2025REG-09"
        case "2025REG-11":
            return "2025REG-10"
        case "2025REG-12":
            return "2025REG-11"
        case "2025REG-13":
            return "2025REG-12"
        case "2025REG-14":
            return "2025REG-13"
        case "2025REG-15":
            return "2025REG-14"
        case "2025REG-16":
            return "2025REG-15"
        case "2025REG-17":
            return "2025REG-16"
        case "2025REG-18":
            return "2025REG-17"
    }
}

//TODO: Find a better way to get this
internals.getCurrentSeasonGameWeeks = (gameWeek) => {
  if(gameWeek === '2021-REG-01') return ['2021-REG-01'];
  if(gameWeek === '2021-REG-02') return ['2021-REG-01', '2021-REG-02'];
  if(gameWeek === '2021-REG-03') return ['2021-REG-01', '2021-REG-02', '2021-REG-03'];
  if(gameWeek === '2021-REG-04') return ['2021-REG-01', '2021-REG-02', '2021-REG-03', '2021-REG-04'];
  if(gameWeek === '2021-REG-05') return ['2021-REG-01', '2021-REG-02', '2021-REG-03', '2021-REG-04', '2021-REG-05'];
  if(gameWeek === '2021-REG-06') return ['2021-REG-01', '2021-REG-02', '2021-REG-03', '2021-REG-04', '2021-REG-05', '2021-REG-06'];
  if(gameWeek === '2021-REG-07') return ['2021-REG-01', '2021-REG-02', '2021-REG-03', '2021-REG-04', '2021-REG-05', '2021-REG-06', '2021-REG-07'];
  if(gameWeek === '2021-REG-08') return ['2021-REG-01', '2021-REG-02', '2021-REG-03', '2021-REG-04', '2021-REG-05', '2021-REG-06', '2021-REG-07', '2021-REG-08'];
  if(gameWeek === '2021-REG-09') return ['2021-REG-01', '2021-REG-02', '2021-REG-03', '2021-REG-04', '2021-REG-05', '2021-REG-06', '2021-REG-07', '2021-REG-08', '2021-REG-09'];
  if(gameWeek === '2021-REG-10') return ['2021-REG-01', '2021-REG-02', '2021-REG-03', '2021-REG-04', '2021-REG-05', '2021-REG-06', '2021-REG-07', '2021-REG-08', '2021-REG-09', '2021-REG-10'];
  if(gameWeek === '2021-REG-11') return ['2021-REG-01', '2021-REG-02', '2021-REG-03', '2021-REG-04', '2021-REG-05', '2021-REG-06', '2021-REG-07', '2021-REG-08', '2021-REG-09', '2021-REG-10', '2021-REG-11'];
  if(gameWeek === '2021-REG-12') return ['2021-REG-01', '2021-REG-02', '2021-REG-03', '2021-REG-04', '2021-REG-05', '2021-REG-06', '2021-REG-07', '2021-REG-08', '2021-REG-09', '2021-REG-10', '2021-REG-11', '2021-REG-12'];
  if(gameWeek === '2021-REG-13') return ['2021-REG-01', '2021-REG-02', '2021-REG-03', '2021-REG-04', '2021-REG-05', '2021-REG-06', '2021-REG-07', '2021-REG-08', '2021-REG-09', '2021-REG-10', '2021-REG-11', '2021-REG-12', '2021-REG-13'];
  if(gameWeek === '2021-REG-14') return ['2021-REG-01', '2021-REG-02', '2021-REG-03', '2021-REG-04', '2021-REG-05', '2021-REG-06', '2021-REG-07', '2021-REG-08', '2021-REG-09', '2021-REG-10', '2021-REG-11', '2021-REG-12', '2021-REG-13', '2021-REG-14'];
  if(gameWeek === '2021-REG-15') return ['2021-REG-01', '2021-REG-02', '2021-REG-03', '2021-REG-04', '2021-REG-05', '2021-REG-06', '2021-REG-07', '2021-REG-08', '2021-REG-09', '2021-REG-10', '2021-REG-11', '2021-REG-12', '2021-REG-13', '2021-REG-14', '2021-REG-15'];
  if(gameWeek === '2021-REG-16') return ['2021-REG-01', '2021-REG-02', '2021-REG-03', '2021-REG-04', '2021-REG-05', '2021-REG-06', '2021-REG-07', '2021-REG-08', '2021-REG-09', '2021-REG-10', '2021-REG-11', '2021-REG-12', '2021-REG-13', '2021-REG-14', '2021-REG-15', '2021-REG-16'];
  
  if(gameWeek === '2022-REG-01') return ['2022-REG-01'];
  if(gameWeek === '2022-REG-02') return ['2022-REG-01', '2022-REG-02'];
  if(gameWeek === '2022-REG-03') return ['2022-REG-01', '2022-REG-02', '2022-REG-03'];
  if(gameWeek === '2022-REG-04') return ['2022-REG-01', '2022-REG-02', '2022-REG-03', '2022-REG-04'];
  if(gameWeek === '2022-REG-05') return ['2022-REG-01', '2022-REG-02', '2022-REG-03', '2022-REG-04', '2022-REG-05'];
  if(gameWeek === '2022-REG-06') return ['2022-REG-01', '2022-REG-02', '2022-REG-03', '2022-REG-04', '2022-REG-05', '2022-REG-06'];
  if(gameWeek === '2022-REG-07') return ['2022-REG-01', '2022-REG-02', '2022-REG-03', '2022-REG-04', '2022-REG-05', '2022-REG-06', '2022-REG-07'];
  if(gameWeek === '2022-REG-08') return ['2022-REG-01', '2022-REG-02', '2022-REG-03', '2022-REG-04', '2022-REG-05', '2022-REG-06', '2022-REG-07', '2022-REG-08'];
  if(gameWeek === '2022-REG-09') return ['2022-REG-01', '2022-REG-02', '2022-REG-03', '2022-REG-04', '2022-REG-05', '2022-REG-06', '2022-REG-07', '2022-REG-08', '2022-REG-09'];
  if(gameWeek === '2022-REG-10') return ['2022-REG-01', '2022-REG-02', '2022-REG-03', '2022-REG-04', '2022-REG-05', '2022-REG-06', '2022-REG-07', '2022-REG-08', '2022-REG-09', '2022-REG-10'];
  if(gameWeek === '2022-REG-11') return ['2022-REG-01', '2022-REG-02', '2022-REG-03', '2022-REG-04', '2022-REG-05', '2022-REG-06', '2022-REG-07', '2022-REG-08', '2022-REG-09', '2022-REG-10', '2022-REG-11'];
  if(gameWeek === '2022-REG-12') return ['2022-REG-01', '2022-REG-02', '2022-REG-03', '2022-REG-04', '2022-REG-05', '2022-REG-06', '2022-REG-07', '2022-REG-08', '2022-REG-09', '2022-REG-10', '2022-REG-11', '2022-REG-12'];
  if(gameWeek === '2022-REG-13') return ['2022-REG-01', '2022-REG-02', '2022-REG-03', '2022-REG-04', '2022-REG-05', '2022-REG-06', '2022-REG-07', '2022-REG-08', '2022-REG-09', '2022-REG-10', '2022-REG-11', '2022-REG-12', '2022-REG-13'];
  if(gameWeek === '2022-REG-14') return ['2022-REG-01', '2022-REG-02', '2022-REG-03', '2022-REG-04', '2022-REG-05', '2022-REG-06', '2022-REG-07', '2022-REG-08', '2022-REG-09', '2022-REG-10', '2022-REG-11', '2022-REG-12', '2022-REG-13', '2022-REG-14'];
  if(gameWeek === '2022-REG-15') return ['2022-REG-01', '2022-REG-02', '2022-REG-03', '2022-REG-04', '2022-REG-05', '2022-REG-06', '2022-REG-07', '2022-REG-08', '2022-REG-09', '2022-REG-10', '2022-REG-11', '2022-REG-12', '2022-REG-13', '2022-REG-14', '2022-REG-15'];
  if(gameWeek === '2022-REG-16') return ['2022-REG-01', '2022-REG-02', '2022-REG-03', '2022-REG-04', '2022-REG-05', '2022-REG-06', '2022-REG-07', '2022-REG-08', '2022-REG-09', '2022-REG-10', '2022-REG-11', '2022-REG-12', '2022-REG-13', '2022-REG-14', '2022-REG-15', '2022-REG-16'];
  
} 

internals.getStats = async (gameWeek) => {
  console.log(`...📣   START get ${gameWeek} stats from sportradar API`);
    const year = gameWeek.split('-')[0];
    const season = gameWeek.split('-')[1];
    const week = gameWeek.split('-')[2]; 

    const games = await utils.getGames(year, season, week);
    const stats = await utils.getStatsAndPoints(games);
    stats.offense = await utils.rankPlayers(stats.offense);
    stats.defense = await utils.rankDefense(stats.defense);
    const gameStats = {stats}
    await db.createOrUpdateDocument('stats', gameWeek, gameStats);
    console.log(`...📣   END get ${gameWeek} stats from sportradar API`);
    return gameStats;
};

internals.getEmptyScoresDocument = () => {
  let scores = {};
  scores.FantasyPoints = [];
  const nflTeams = utils.getSportRadarNFLTeams();

  for(let i = 0; i < nflTeams.length; i ++ ){
    const team = nflTeams[i];
    scores.FantasyPoints.push({
      team: team, 
      gameStatus: null,
      QB: 0,
      RB: 0,
      WR: 0,
      TE: 0,
      DST: 0,
    });
  }
  return scores;
}

//TODO: Make this simpler to follow and run. 
internals.setScores = async (nflWeekStr, stats) => {
  console.log('...🔢   START CALC FANTASY SCORE FROM STATS');

  const prevScores = await db.readDocument('scores', nflWeekStr) || internals.getEmptyScoresDocument();
  const split = nflWeekStr.split('-');
  let nflTeams;
  if(split[1] == 'PST') {
    nflTeams = ['KC', 'BUF', 'CIN', 'LAC', 'BAL', 'JAC', 'MIA', 'PHI', 'SF', 'MIN', 'DAL', 'NYG', 'SEA', 'TB'];
  } else {
    nflTeams = utils.getSportRadarNFLTeams();
  }
  let scores = {};
  scores.FantasyPoints = [];
  for (let i = 0; i < nflTeams.length; i++) {
    console.log(nflTeams[i])
    scores.FantasyPoints.push({
      team: nflTeams[i],
      gameStatus: utils.getGameStatusByTeam(stats, nflTeams[i]),
      QB: utils.getPlayerScore(stats, nflTeams[i], 'QB', prevScores),
      RB: utils.getPlayerScore(stats, nflTeams[i], 'RB', prevScores),
      WR: utils.getPlayerScore(stats, nflTeams[i], 'WR', prevScores),
      TE: utils.getPlayerScore(stats, nflTeams[i], 'TE', prevScores),
      DST: utils.getPlayerScore(stats, nflTeams[i], 'DST', prevScores),
    });
  }
  console.log('...🔢   END CALC FANTASY SCORE FROM STATS');
  await db.createOrUpdateDocument('scores', nflWeekStr, scores);
  return scores;
}

//TODO: Make this smart enough to skip score cards that are not currently in play
internals.setCardScores = async (nflWeekStr, scores, startCard, endCard) => {
  
  let card;
  let updatedCard;
  let startingLineup
  let indexOfNFLWeek;
  let team;
  let position;
  let pts;
  let totalWeeklyPoints;
  let prevSeasonPts;
  let totalSeasonPoints;

  for(let i = startCard; i <= endCard; i++){
    const tokenId = i.toString();
    pts = 0;
    totalWeeklyPoints = 0;
    totalSeasonPoints = 0;
    card = await db.readDocument('cards', tokenId);
    updatedCard = card;
    startingLineup = card.startingLineup;
    updatedCard.scores = (card.scores) ?  await utils.filterOutExtraObjects(card.scores, nflWeekStr) : [];

    updatedCard.scores.push({
      [nflWeekStr]: {
        startingLineup: []
      }
    });

    indexOfNFLWeek = updatedCard.scores.findIndex(score => Object.keys(score).includes(nflWeekStr) );

    startingLineup.forEach(player => {
      
      team = player.teamId;
      position = player.positionLabel;
      pts = utils.getPointsFromScore(scores, team, position)
      
      updatedCard.scores[indexOfNFLWeek][nflWeekStr].startingLineup.push({
          positionId: player.positionId,
          positionLabel: player.positionLabel,
          starting: player.starting,
          teamId: player.teamId,
          teamPosition: `${player.teamId} ${player.positionLabel}`,
          pts: parseFloat(pts.toFixed(2))
      });

      if(player.starting) totalWeeklyPoints += pts;
  });

  prevSeasonPts = (nflWeekStr === '2021-REG-week-16') ? 0 : card[`${utils.getPrevNFLWeek(nflWeekStr)}-seasonPts`];

  if(isNaN(prevSeasonPts)) prevSeasonPts = 0;

  totalSeasonPoints = parseFloat((prevSeasonPts + totalWeeklyPoints).toFixed(2));

  updatedCard[`${nflWeekStr}-weeklyPts`] = parseFloat(totalWeeklyPoints.toFixed(2));
  updatedCard[`${nflWeekStr}-seasonPts`] = parseFloat(totalSeasonPoints.toFixed(2));

  //cleaning up data.  Can be removed when no longer needed. 
  if(updatedCard[nflWeekStr]) delete updatedCard[nflWeekStr];

    await db.createOrUpdateDocument('cards', tokenId, updatedCard);
  }

  console.log(`...set score on cards ${startCard} to ${endCard}!`)
}

internals.rollCard = async (card) => {
  
  console.log('...special shit to roll the card!');
  return card;
}


module.exports = internals;

