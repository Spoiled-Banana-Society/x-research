const db = require('../../services/db');
const fs = require('fs');

(async () => {
    const ownerId = "0x80578BB41D7ee99aeb1cf79A8cD15FBe08fcC5a3".toLowerCase();
    const gameweek = '2022-REG-06'
    const owner = await db.readDocument('owners', ownerId);
    const leaguesIn = owner.leagues;
    const lineups = [];
    for(let i = 0; i < leaguesIn.length; i++) {
        const cardId = leaguesIn[i].cardId;
        const leagueId = leaguesIn[i].leagueId;
        if(leagueId != 'genesis' && leagueId != "PROMO-2022-REG-01") {
            if(!leagueId.includes('Season') && !leagueId.includes('Weekly(Thu Oct 13 2022 - Tue Oct 18 2022')) {
                console.log(`This leagueId is not a season long league or a league from this week.... ${leagueId}`)
                continue;
            }
        }
        let lineup = await db.readDocument(`leagues/${leagueId}/cards/${cardId}/lineups`, gameweek);
        if(!lineup) {
            console.log(leagueId)
            lineup = await db.readDocument(`leagues/${leagueId}/cards/${cardId}/lineups`, 'ROUND 1')
            if(!lineup) {
                console.log("cOuldn't find one for this league still ..... " + leagueId)
                continue;
            }
        }

        const league = await db.readDocument('leagues', leagueId)
        lineups.push({ leagueId: league._prettyId, cardId: cardId, bench: lineup.bench, starting: lineup.starting })
    }
    const data = JSON.stringify(lineups)
    fs.writeFileSync('./ownerLineups.json', data )
})();