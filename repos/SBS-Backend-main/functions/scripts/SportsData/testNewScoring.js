const stat = require('../../services/stat');
const db = require('../../services/db');
const utils = require('../../services/utils');

const teams = ['ARI', 'ATL', 'BAL', 'BUF', 'CAR', 'CHI', 'CIN', 'CLE', 'DAL', 'DEN', 'DET', 'GB',  'HOU', 'IND', 'JAX', 'KC',  'LAC', 'LAR', 'LV',  'MIA', 'MIN', 'NE',  'NO',  'NYG', 'NYJ', 'PHI', 'PIT', 'SEA', 'SF',  'TB',  'TEN', 'WAS'];
const oldTeams = ["ARI", "ATL", "BAL", "BUF", "CAR", "CHI", "CIN", "CLE", "DAL", "DEN", "DET", "GB", "HOU", "IND", "JAC", "KC", "LAC", "LA", "MIA", "MIN", "NE", "NO", "NYG", "NYJ", "LV", "PHI", "PIT", "SEA", "SF", "TB", "TEN", "WAS"]


const scoreGameweekWithSportsRader = async (gameweek) => {
    console.log(gameweek)
    await stat.setScoresFromStatsSportsRadar(gameweek)
    return
}  

const createMapFromOldScores = (scores) => {
    const data = {};
    for(let i = 0; i < scores.FantasyPoints.length; i++) {
        const obj = scores.FantasyPoints[i];
        if (obj.team == 'JAC') {
            obj.team = 'JAX';
        } else if (obj.team == 'LA') {
            obj.team = 'LAR';
        }
        data[obj.team] = obj
    }
    //console.log(data['BUF']);

    return data

}

const compareScoresForGameweek = async (gameweek, scoresMap) => {
    const newScores = await db.readDocument('scores', gameweek);
    for(let i = 0; i < newScores.FantasyPoints; i++) {
        const newData = newScores.FantasyPoints[i];
        const oldData = scoresMap[newData.Team];
        if (!oldData) {
            console.log(`Old data is null for ${newData.Team}`)
            continue;
        }
        if (newData.QB != oldData.QB) {
            console.log(`Scores do not match up for QB for ${newData.Team} in ${gameweek}`)
        }
        if (newData.RB != oldData.RB) {
            console.log(`Scores do not match up for RB for ${newData.Team} in ${gameweek}`)
        }
        if (newData.TE != oldData.TE) {
            console.log(`Scores do not match up for TE for ${newData.Team} in ${gameweek}`)
        }
        if (newData.WR != oldData.WR) {
            console.log(`Scores do not match up for WR for ${newData.Team} in ${gameweek}`)
        }
        if (newData.DST != oldData.DST) {
            console.log(`Scores do not match up for DST for ${newData.Team} in ${gameweek}`)
        }
    }
}


(async () => {
    const oldGameweeks = ["2022-REG-01", "2022-REG-02", "2022-REG-03", "2022-REG-04", "2022-REG-05", "2022-REG-06", "2022-REG-07", "2022-REG-08", "2022-REG-09", "2022-REG-10", "2022-REG-11", "2022-REG-12", "2022-REG-13", "2022-REG-14", "2022-REG-15", "2022-REG-16", "2022-REG-17", "2022-REG-18"];

    console.log("starting to loop through gameweeks")
    for(let i = 4; i < oldGameweeks.length; i++) {
        const oldGameweek = oldGameweeks[i];
        const week = (oldGameweek.split('-'))[2];
        const newGameweek = `2022REG-${week}`;
        console.log(`old Gameweek: ${oldGameweek}, new Gameweek: ${newGameweek}`)
        await scoreGameweekWithSportsRader(newGameweek);
        console.log('done scoring for ', newGameweek);

        const oldScores = await db.readDocument('scores', oldGameweek)
        const scoreMap = createMapFromOldScores(oldScores);
        await compareScoresForGameweek(newGameweek, scoreMap)
        console.log(`done comparing ${oldGameweek}`)
        await utils.sleep(10000)
    }
    
    console.log('complete')
})()