const db = require('../../services/db');
const utils = require('../../services/utils');
const sbs = require('../../services/sbs');

( async () => {
    const gameweek = '2022-REG-10'
    let res = await db.readDocument('scores', gameweek);
    let scores = res.FantasyPoints;
    for(let i = 0; i < scores.length; i++) {
        scores[i].DST = Math.floor(Math.random() * (32 - 1) + 1)
        scores[i].QB = Math.floor(Math.random() * (32 - 1) + 1)
        scores[i].RB = Math.floor(Math.random() * (32 - 1) + 1)
        scores[i].WR = Math.floor(Math.random() * (32 - 1) + 1)
        scores[i].TE = Math.floor(Math.random() * (32 - 1) + 1)
        scores[i].gameStatus = 'inprogress'
    }
    res.FantasyPoints = scores;
    await db.createOrUpdateDocument('scores', gameweek, res, false)
    await utils.sleep(90000);

    await utils.sleep(100000);
    console.log('TIme to close the games.')
    let newScores = await db.readDocument('scores', gameweek);
    let data = newScores.FantasyPoints;
    for(let i = 0; i < data.length; i++) {
        data[i].gameStatus = 'closed';
    }
    newScores.FantasyPoints = data;
    await db.createOrUpdateDocument('scores', gameweek, newScores, false)
    console.log('scores ahve been closed and updated')
    await utils.sleep(25000)

    const transitionDoc = await db.readDocument('weekTransition', gameweek);
    transitionDoc.hasVerifiedScores = true;
    await db.createOrUpdateDocument('weekTransition', gameweek, transitionDoc, true)
    console.log('COMPLETE')
})();