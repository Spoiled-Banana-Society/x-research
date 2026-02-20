//PACKAGES


//SERVICES
const db = require('./db');
const utils = require('./utils');
const sbs = require('./sbs');


const internals = {};

internals.setDefaultLineup = async (gameWeek, start, end) => {
  const league = await db.readDocument('leagues', 'genesis');
  
  for(let i = start; i < end; i++){
    const cardId = `${i}`;
    if(!cardId) continue;
    const prevCard = await db.readDocument(`leagues/${leagueId}/cards`, cardId);
    const currentCard = await db.readDocument('cards', cardId);

    currentCard.joinedAt = prevCard.joinedAt || db._getTimeStamp();
    await db.createOrUpdateDocument(`leagues/${leagueId}/cards`, cardId, currentCard, true);
    console.log(`...🃏   Update card:${cardId} for league:${leagueId}`);

    const isSetAlready = await db.readDocument(`leagues/${leagueId}/cards/${cardId}/lineups`, gameWeek);
    if(isSetAlready) {
      console.log(`...✅   league:${leagueId} card:${cardId} lineup already set`);
      continue;
    }

    const usersPreviousLineup = await db.readDocument(`leagues/${leagueId}/cards/${cardId}/lineups`, sbs.getPreviousNFLWeek(gameWeek));

    let lineup;

    if(!lineup && usersPreviousLineup){
      lineup = usersPreviousLineup;
      console.log(`...🔙   league:${leagueId} card:${cardId} gameWeek:${gameWeek} User previous lineup set`);
    }

    //otherwise get a system generated lineup
    if(!lineup){
      lineup = utils.getDefaultLineup(currentCard); ;
      console.log(`...🤖   league:${leagueId} card:${cardId} gameWeek:${gameWeek} system default lineup set`);
    }

    lineup.scoreWeek = 0;
    await utils.setDefaultLineupInLeague(lineup, league, gameWeek);
  }

}

internals.updateOpponentInfo = async () => {
  const gameWeek = sbs.getNFLWeekV2(); 
  console.log(gameWeek)
  const splitArr = gameWeek.split('-')
  const season = splitArr[0]
  
  const week = splitArr[1]

  const rawGames = await utils._getGamesSportsData(season, week);

  if (!rawGames) return "Games not found"

  const nflSbsMap = utils.getValidNFLTeams();

  // weather condition is deprecated from sportsradar. We can possibly use the metadata to get the weather condition from weather api

  const game = {};
  rawGames.map(dailyGame => {
    const home = nflSbsMap[dailyGame.home.alias];
    const away = nflSbsMap[dailyGame.away.alias];

    game[home] = {
      home,
      away,
      start: dailyGame.scheduled,
      metadata: {
        address: "",
        capacity: dailyGame.venue.Capacity,
        city: dailyGame.venue.City,
        country: dailyGame.venue.Country,
        id: dailyGame.gameId,
        location: {
          lat: dailyGame.venue.GeoLat,
          long: dailyGame.venue.GeoLong,
        },
        name: dailyGame.venue.Name,
        network: dailyGame.broadcast,
        roof_type: dailyGame.venue.Type,
        sr_id: "",
        state: dailyGame.venue.State,
        surface: dailyGame.venue.Type,
      } 
    };
    game[away] = {
      home,
      away,
      start: dailyGame.scheduled,
      metadata: {
        address: "",
        capacity: dailyGame.venue.Capacity,
        city: dailyGame.venue.City,
        country: dailyGame.venue.Country,
        id: dailyGame.gameId,
        location: {
          lat: dailyGame.venue.GeoLat,
          long: dailyGame.venue.GeoLong,
        },
        name: dailyGame.venue.Name,
        network: dailyGame.broadcast,
        roof_type: dailyGame.venue.Type,
        sr_id: "",
        state: dailyGame.venue.State,
        surface: dailyGame.venue.Type,
      } 
    };
  });

  try { 
    await db.createOrUpdateDocument('opponents', gameWeek, game, false);
  } catch (e){
    console.log('Error in updating opponents: ' + e)
    return e;
  }
}

module.exports = internals;