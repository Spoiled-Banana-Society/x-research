const db = require('../../services/db');
const scoreTriggers = require('../../services/score-triggers');
const sbs = require('../../services/sbs');
const utils = require('../../services/utils');


const teams = ['KC', 'BUF', 'CIN', 'LAC', 'BAL', 'JAC', 'MIA', 'PHI', 'SF', 'MIN', 'DAL', 'NYG', 'SEA', 'TB'];


const forceScoring = async (min, max) => {
    const gameweek = '2022-PST-04';
    //const noLineups = [];
    for(let i = min; i < max; i++) {
        const cardId = `${i}`;
        console.log(cardId)
        try {
            await scoreTriggers.playoffLineupScoreMachine(cardId, gameweek, teams)
        } catch (err) {
            console.log(err)

        }
    }
}

(async () => {
    //await forceScoring(0, 1000);
    //await forceScoring(1000, 2000);
    //await forceScoring(2000, 3000);
    //await forceScoring(3000, 4000);
    //await forceScoring(4000, 5000);
    //await forceScoring(5000, 6000);
    //await forceScoring(6000, 7000);
    //await forceScoring(7000, 8000);
    //await forceScoring(8000, 9000);
    //await forceScoring(9000, 10000);
    //await forceScoring(10000, 11000);
    await forceScoring(11000, 12000);
    //await forceScoring(12000, 12393);
})()



