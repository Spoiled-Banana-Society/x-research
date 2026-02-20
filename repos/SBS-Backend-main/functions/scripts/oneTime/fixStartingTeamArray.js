const db = require('../../services/db');
const utils = require('../../services/utils');
const scoreTriggers = require('../../services/score-triggers');
const env = require('../../services/env');
const score = require('../../services/score');
const teamsArr = ["ARI", "ATL", "BAL", "BUF", "CAR", "CHI", "CIN", "CLE", "DAL", "DEN", "DET", "GB", "HOU", "IND", "JAC", "KC", "LAC", "LA", "MIA", "MIN", "NE", "NO", "NYG", "NYJ", "LV", "PHI", "PIT", "SEA", "SF", "TB", "TEN", "WAS"];


const checkLineups = async (min, max) => {
    const gameweek = '2022-REG-14';
    const shapeProbs = [];
    const wrongCards = [];
    const leagueId = 'genesis';
    const results = [];
    for(let i = min; i < max; i++) {
        const cardId = `${i}`;
        console.log(cardId);
        const lineupPath = `leagues/${leagueId}/cards/${cardId}/lineups`;
        const lineup = await db.readDocument(lineupPath, gameweek);
        if(!lineup.startingTeamArr) {
            shapeProbs.push(cardId)
            continue;
        }
        if(!lineup.prevWeekSeasonScore) {
            shapeProbs.push(cardId)
            continue;
        }

        if(lineup._cardId != cardId) {
            wrongCards.push(cardId)
        }
        
        const seasonScore = await score.calcSeasonScore(lineupPath, lineup.scoreWeek, gameweek);
        if(seasonScore != lineup.scoreSeason) {
            results.push(cardId)
        }

    }
    console.log(results)
    console.log(shapeProbs)
    console.log(wrongCards)
}

(async () => {
    //await checkLineups(0, 1000);
    //await checkLineups(1000, 2000);
    //await checkLineups(2000, 3000);
    //await checkLineups(3000, 4000);
    //await checkLineups(4000, 5000);
    //await checkLineups(5000, 6000);
    //await checkLineups(6000, 7000);
    //await checkLineups(7000, 8000);

    //await checkLineups(8000, 9000);
    await checkLineups(9000, 10000);
    
})()


