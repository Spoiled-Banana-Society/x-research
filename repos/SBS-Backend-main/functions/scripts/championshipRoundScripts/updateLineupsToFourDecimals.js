const db = require('../../services/db');

(async () => {
    const gameweek = '2022-REG-15';
    let leagueIds = await db.readAllDocumentIds(`leagues`);
    leagueIds = leagueIds.filter(x => x.indexOf('Season') == -1 && x.indexOf('Weekly') == -1 && x.indexOf('PROMO') == -1 && x.indexOf('genesis') == -1);
    for(let i = 0; i < leagueIds.length; i++) {
        const leagueId = leagueIds[i];
        const cardIds = await db.readAllDocumentIds(`leagues/${leagueId}/cards`);
        for(let j = 0; j < cardIds.length; j++) {
            const cardId = cardIds[j];
            const lineup = await db.readDocument(`leagues/${leagueId}/cards/${cardId}/lineups`, gameweek);
            lineup.scoreSeason = parseFloat((lineup.scoreWeek + lineup.prevWeekSeasonScore).toFixed(4));
            console.log(`Season score: ${lineup.scoreSeason} for card ${cardId}`)
            await db.createOrUpdateDocument(`leagues/${leagueId}/cards/${cardId}/lineups`, gameweek, lineup, false)
        }
    }
})()