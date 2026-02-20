const db = require('../../services/db');
const utils = require('../../services/utils');
const scoreTriggers = require('../../services/score-triggers');
const { scoreSeasonLeaguesPart1 } = require('../../services/score-triggers');
const teamsArr = ["ARI", "ATL", "BAL", "BUF", "CAR", "CHI", "CIN", "CLE", "DAL", "DEN", "DET", "GB", "HOU", "IND", "JAC", "KC", "LAC", "LA", "MIA", "MIN", "NE", "NO", "NYG", "NYJ", "LV", "PHI", "PIT", "SEA", "SF", "TB", "TEN", "WAS"];

const scoreLineupsInGenesis = async (min, max) => {
    const gameweek = '2022-REG-17';
    for(let i = min; i < max; i++) {
        const cardId = `${i}`;
        await scoreTriggers.lineupScoreMachine('genesis', cardId, gameweek, teamsArr);
    }
}

( async () => {
    await scoreLineupsInGenesis(0, 1000);
    await scoreLineupsInGenesis(1000, 2000);
    await scoreLineupsInGenesis(2000, 3000);
    await scoreLineupsInGenesis(3000, 4000);
    await scoreLineupsInGenesis(4000, 5000);
    await scoreLineupsInGenesis(5000, 6000);
    await scoreLineupsInGenesis(6000, 7000);
    await scoreLineupsInGenesis(7000, 8000);
    await scoreLineupsInGenesis(8000, 9000);
    await scoreLineupsInGenesis(9000, 10000);
})()

