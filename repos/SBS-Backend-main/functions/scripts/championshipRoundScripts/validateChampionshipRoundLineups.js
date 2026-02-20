const db = require('../../services/db');

(async () => {
    const gameweek = '2022-REG-15';
    let leagueIds = await db.readAllDocumentIds(`leagues`);
    const problems = [];
    leagueIds = leagueIds.filter(x => x.indexOf('Season') == -1 && x.indexOf('Weekly') == -1 && x.indexOf('PROMO') == -1 && x.indexOf('genesis') == -1);
    for(let i = 0; i < leagueIds.length; i++) {
        const leagueId = leagueIds[i];
        const cardIds = await db.readAllDocumentIds(`leagues/${leagueId}/cards`);
        for(let j = 0; j < cardIds.length; j++) {
            const cardId = cardIds[j];
            const lineup = await db.readDocument(`leagues/${leagueId}/cards/${cardId}/lineups`, gameweek);
            const genesisLineup = await db.readDocument(`leagues/genesis/cards/${cardId}/lineups`, gameweek);
            if(lineup.scoreWeek != genesisLineup.scoreWeek) {
                console.log(`Problem with score mismatch in ${leagueId} on card ${cardId}`)
                problems.push(cardId);
            }
            
        }
    }
    if(problems.length != 0) {
        for(let i = 0; i < problems.length; i++) {
            console.log(problems[i])
        }
    }
})()