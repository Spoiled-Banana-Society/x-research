const db = require('../../services/db');
const utils = require('../../services/utils');
const scoreTriggers = require('../../services/score-triggers');
const teamsArr = ["ARI", "ATL", "BAL", "BUF", "CAR", "CHI", "CIN", "CLE", "DAL", "DEN", "DET", "GB", "HOU", "IND", "JAC", "KC", "LAC", "LA", "MIA", "MIN", "NE", "NO", "NYG", "NYJ", "LV", "PHI", "PIT", "SEA", "SF", "TB", "TEN", "WAS"];

( async () => {
    const gameweek = '2022-REG-17';
    const leagueIds = await db.readAllDocumentIds('leagues');
    const weekStrings = utils.getStringsForCurrentWeek2022(gameweek);
    const customLeagues = leagueIds.filter(x => x != 'genesis' && (x.includes(weekStrings[1]) || x.includes('Season') || x.includes('PROMO')))
    for(let i = 0; i < customLeagues.length; i++) {
        const leagueId = customLeagues[i];
        const league = await db.readDocument('leagues', leagueId);
        if(league.game.currentPlayers < league.game.minPlayers) {
            console.log(`league: ${leagueId} did not reach the minimum number of players`)
            continue;
        }
        const cards = await db.readAllDocumentIds(`leagues/${leagueId}/cards`);
        for(let j = 0; j < cards.length; j++) {
            const cardId = cards[j];
            const lineup = await db.readDocument(`leagues/${leagueId}/cards/${cardId}/lineups`, gameweek);
            if(!lineup.startingTeamArr) {
                const startingArr = [];
                startingArr.push(lineup.starting.DST[0])
                if(!startingArr.includes(lineup.starting.QB[0])) {
                    startingArr.push(lineup.starting.QB[0])
                }
                if(!startingArr.includes(lineup.starting.RB[0])) {
                    startingArr.push(lineup.starting.RB[0])
                }
                if(!startingArr.includes(lineup.starting.RB[1])) {
                    startingArr.push(lineup.starting.RB[1])
                }
                if(!startingArr.includes(lineup.starting.WR[0])) {
                    startingArr.push(lineup.starting.WR[0])
                }
                if(!startingArr.includes(lineup.starting.WR[1])) {
                    startingArr.push(lineup.starting.WR[1])
                }
                if(!startingArr.includes(lineup.starting.WR[2])) {
                    startingArr.push(lineup.starting.WR[2])
                }
                if(!startingArr.includes(lineup.starting.TE[0])) {
                    startingArr.push(lineup.starting.TE[0])
                }
                lineup.startingTeamArr = startingArr;
                await db.createOrUpdateDocument(`leagues/${leagueId}/cards/${cardId}/lineups`, gameweek, lineup, false)
                console.log(`CREATED A STARTING TEAM ARRAY FOR CARD: ${cardId} in league: ${leagueId}`)
                await utils.sleep(1000)
            }
            await scoreTriggers.lineupScoreMachine(leagueId, cardId, gameweek, teamsArr)
            console.log(`Updated Score for card: ${cardId} in league: ${leagueId}`)
        }
    }
})()