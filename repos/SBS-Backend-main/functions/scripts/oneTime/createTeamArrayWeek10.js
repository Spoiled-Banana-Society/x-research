const db = require('../../services/db');
const utils = require('../../services/utils');
const sbs = require('../../services/sbs');
const scoreTriggers = require('../../services/score-triggers');


const changes = ["ARI", "ATL", "BAL", "BUF", "CAR", "CHI", "CIN", "CLE", "DAL", "DEN", "DET", "GB", "HOU", "IND", "JAC", "KC", "LAC", "LA", "MIA", "MIN", "NE", "NO", "NYG", "NYJ", "LV", "PHI", "PIT", "SEA", "SF", "TB", "TEN", "WAS"];

(async () => {
    const gameweek = '2022-REG-11'
    console.log('current week: ' + gameweek)
    const prevGameweek = '2022-REG-10'
    console.log('prev week: ' + prevGameweek)
    const leagues = await db.readAllDocumentIds('leagues');
    for(let i = 0; i < leagues.length; i++) {
        const leagueId = leagues[i];
        console.log(leagueId)
        const cards = await db.readAllDocumentIds(`leagues/${leagues[i]}/cards`)
        for(let j = 0; j < cards.length; j++) {
            const cardId = cards[j];
            const lineupPath = `leagues/${leagueId}/cards/${cardId}/lineups`;
            const lineup = await db.readDocument(lineupPath, gameweek);
            if(!lineup) {
                continue;
            }
            // const startingArr = [];
            // startingArr.push(lineup.starting.DST[0])
            // if(!startingArr.includes(lineup.starting.QB[0])) {
            //     startingArr.push(lineup.starting.QB[0])
            // }
            // if(!startingArr.includes(lineup.starting.RB[0])) {
            //     startingArr.push(lineup.starting.RB[0])
            // }
            // if(!startingArr.includes(lineup.starting.RB[1])) {
            //     startingArr.push(lineup.starting.RB[1])
            // }
            // if(!startingArr.includes(lineup.starting.WR[0])) {
            //     startingArr.push(lineup.starting.WR[0])
            // }
            // if(!startingArr.includes(lineup.starting.WR[1])) {
            //     startingArr.push(lineup.starting.WR[1])
            // }
            // if(!startingArr.includes(lineup.starting.WR[2])) {
            //     startingArr.push(lineup.starting.WR[2])
            // }
            // if(!startingArr.includes(lineup.starting.TE[0])) {
            //     startingArr.push(lineup.starting.TE[0])
            // }
            // const splitArr = leagueId.split('(');
            // if(splitArr[0] == 'Weekly') {
            //     lineup.prevWeekSeasonScore = 0;
            // } else {
            //     const prevLineup = await db.readDocument(lineupPath, prevGameweek);
            //     if(!prevLineup) {
            //         console.log(leagueId);
            //         console.log('didnt have lineup for week 10 in this league')
            //         lineup.prevWeekSeasonScore = 0;
            //     } else {
            //         lineup.prevWeekSeasonScore = prevLineup.scoreSeason;
            //     }
                
            // }
            // lineup.startingTeamArr = startingArr;
            // await db.createOrUpdateDocument(lineupPath, gameweek, lineup, false)

            await scoreTriggers.lineupScoreMachine(leagueId, cardId, gameweek, changes)
        }
    }
})();