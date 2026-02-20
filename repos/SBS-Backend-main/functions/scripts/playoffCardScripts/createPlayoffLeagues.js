const db = require('../../services/db');
const playoffUtils = require('../../services/playoffUtils');
const utils = require('../../services/utils');



const addGenesisPlayoffCardsToLeague = async () => {
    const gameweek = '2022-PFS-01';
    const leagueId = 'genesis-playoff-league';
    for(let i = 0; i < 10000; i++) {
        const cardId = `${i}`;
        const card = await db.readDocument('playoffCards', cardId);
        const lineup = utils.getDefaultLineup(card);
        lineup.gameWeek = gameweek;
        lineup.scoreSeason = 0;
        lineup.prevWeekSeasonScore = 0;
        lineup.scoreWeek = 0;
        await db.createOrUpdateDocument(`leagues/${leagueId}/cards`, cardId, card, true)
        await db.createOrUpdateDocument(`leagues/${leagueId}/cards/${cardId}/lineups`, gameweek, lineup, true)

        const leaderboardObj = {
            cardId: cardId,
            scoreSeason: 0, 
            scoreWeek: 0,
            lineup: lineup, 
            card: card,
            level: card._level,
            ownerId: card._ownerId
        }
        await db.createOrUpdateDocument(`genesisPlayoffsLeaderboard/2022/${gameweek}/cards`, cardId, leaderboardObj, true)
        console.log(`created lineup and leaderboard entry for card ${cardId} in ${leagueId}`)
    }
}