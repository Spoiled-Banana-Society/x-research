const db = require('../../services/db');
const sbs = require('../../services/sbs');
const utils = require('../../services/utils');

(async () => {
    const gameweek = '2022-REG-10'
    const leagueIds = await db.readAllDocumentIds('leagues');
    const weekStrings = utils.getStringsForCurrentWeek2022(gameweek);
    const weeklyLeagues = leagueIds.filter(x => x.includes(weekStrings[1]));
    let ties = [];
    for(let i = 0; i < weeklyLeagues.length; i++) {
        const leagueId = weeklyLeagues[i];
        const league = await db.readDocument('leagues', leagueId);
        if(league.game.currentPlayers < league.game.minPlayers) {
            console.log('skipping non full league: ' + leagueId);
            continue;
        }
        const cardIds = await db.readAllDocumentIds(`leagues/${leagueId}/cards`);
        let scores = [];
        
        for(let j = 0; j < cardIds.length; j++) {
            const cardId = cardIds[j];
            const lineup = await db.readDocument(`leagues/${leagueId}/cards/${cardId}/lineups`, gameweek);
            if(scores.includes(lineup.scoreWeek)) {
                ties.push(leagueId)
                break;
            }
            scores.push(lineup.scoreWeek);
        }
    }
    if(ties.length != 0) {
        for(let i = 0; i < ties.length; i++) {
            console.log(ties[i])
        }
    }
    process.exit(1)
})()