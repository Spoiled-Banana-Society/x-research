const db = require('../../services/db');
const utils = require('../../services/utils');
const score = require('../../services/score');
const { parse } = require('path');

(async () => {
    let leagues = await db.readAllDocumentIds('leagues');
    const problems = [];
    const problemLeagues = [];
    //leagues = leagues.filter(x => x.indexOf('Season') != -1 || x.indexOf('PROMO') != -1)
    leagues = ['genesis']
    for(let i = 0; i < leagues.length; i++) {
        const leagueId = leagues[i];
        console.log(leagueId)
        const league = await db.readDocument('leagues', leagueId);
        // if(league.game.currentPlayers < league.game.minPlayers) {
        //     console.log(`this league did not reach minimum players`);
        //     continue;
        // }
        //const cardIds = await db.readAllDocumentIds(`leagues/${leagueId}/cards`);
        //const startIdx = Math.floor(cardIds.length / 2);
        //console.log(startIdx)
        for(let j = 4750; j < 5000; j++) {
            let seasonScore = 0;
            const cardId = `${j}`;
            if(j % 1000 == 0) {
                console.log(cardId)
            }
            
            const lineupPath = `leagues/${leagueId}/cards/${cardId}/lineups`;
            const oneLineup = await db.readDocument(lineupPath, '2022-REG-01');
            if(oneLineup) {
                seasonScore = parseFloat((seasonScore + oneLineup.scoreWeek).toFixed(2));
            }
            const twoLineup = await db.readDocument(lineupPath, '2022-REG-02');
            if(twoLineup) {
                seasonScore = parseFloat((seasonScore + twoLineup.scoreWeek).toFixed(2));
            }
            const threeLineup = await db.readDocument(lineupPath, '2022-REG-03');
            if(threeLineup) {
                seasonScore = parseFloat((seasonScore + threeLineup.scoreWeek).toFixed(2));
            }
            const fourLineup = await db.readDocument(lineupPath, '2022-REG-04');
            if(fourLineup) {
                seasonScore = parseFloat((seasonScore + fourLineup.scoreWeek).toFixed(2));
            }
            const fiveLineup = await db.readDocument(lineupPath, '2022-REG-05');
            if(fiveLineup) {
                seasonScore = parseFloat((seasonScore + fiveLineup.scoreWeek).toFixed(2));
            }
            const sixLineup = await db.readDocument(lineupPath, '2022-REG-06');
            if(sixLineup) {
                seasonScore = parseFloat((seasonScore + sixLineup.scoreWeek).toFixed(2));
            }
            const sevenLineup = await db.readDocument(lineupPath, '2022-REG-07');
            if(sevenLineup) {
                seasonScore = parseFloat((seasonScore + sevenLineup.scoreWeek).toFixed(2));
            }
            const eightLineup = await db.readDocument(lineupPath, '2022-REG-08');
            if(eightLineup) {
                seasonScore = parseFloat((seasonScore + eightLineup.scoreWeek).toFixed(2));
            }
            const nineLineup = await db.readDocument(lineupPath, '2022-REG-09');
            if(nineLineup) {
                seasonScore = parseFloat((seasonScore + nineLineup.scoreWeek).toFixed(2));
            }
            const tenLineup = await db.readDocument(lineupPath, '2022-REG-10');
            if(tenLineup) {
                seasonScore = parseFloat((seasonScore + tenLineup.scoreWeek).toFixed(2));
            }
            const elevenLineup = await db.readDocument(lineupPath, '2022-REG-11');
            if(elevenLineup) {
                seasonScore = parseFloat((seasonScore + elevenLineup.scoreWeek).toFixed(2));
            }
            const twelveLineup = await db.readDocument(lineupPath, '2022-REG-12');
            if(twelveLineup) {
                seasonScore = parseFloat((seasonScore + twelveLineup.scoreWeek).toFixed(2));
            }
            const thirteenLineup = await db.readDocument(lineupPath, '2022-REG-13');
            if(thirteenLineup) {
                seasonScore = parseFloat((seasonScore + thirteenLineup.scoreWeek).toFixed(2));
            }
            const fourteenLineup = await db.readDocument(lineupPath, '2022-REG-14');
            if(fourteenLineup) {
                seasonScore = parseFloat((seasonScore + fourteenLineup.scoreWeek).toFixed(2));
            }
            const fifteenLineup = await db.readDocument(lineupPath, '2022-REG-15');
            if(fifteenLineup) {
                seasonScore = parseFloat((seasonScore + fifteenLineup.scoreWeek).toFixed(2));
            }
            const sixteenLineup = await db.readDocument(lineupPath, '2022-REG-16');
            if(sixteenLineup) {
                seasonScore = parseFloat((seasonScore + sixteenLineup.scoreWeek).toFixed(2));
            }
            const lineup = await db.readDocument(lineupPath, '2022-REG-17');
            seasonScore = parseFloat((seasonScore + lineup.scoreWeek).toFixed(2));

            if(seasonScore != lineup.scoreSeason) {
                console.log(`lineup season score: ${lineup.scoreSeason},  calculated season score: ${seasonScore}`);
                problemLeagues.push(leagueId);
                problems.push(cardId)
            }
            // if(lineup.scoreSeason != parseFloat((lineup.prevWeekSeasonScore + lineup.scoreWeek).toFixed(2))) {
            //     console.log(`Could be a wrong score on card ${cardId} in ${leagueId}`)
            //     problems.push(cardId)
            // }

            

            //const seasonScore = await score.calcSeasonScore(`leagues/${leagueId}/cards/${cardId}/lineups`, lineup.scoreWeek, gameweek)
            // if(seasonScore != lineup.scoreSeason) {
            //     //console.log(`seasonScore: ${seasonScore}, lineup.scoreSeason: ${lineup.scoreSeason}`);
            //     lineup.scoreSeason = parseFloat(seasonScore.toFixed(2));
            //     lineup.prevWeekSeasonScore = parseFloat((seasonScore - lineup.scoreWeek).toFixed(2));
            //     //await db.createOrUpdateDocument(`leagues/${leagueId}/cards/${cardId}/lineups`, gameweek, lineup, false)
            //     //console.log(`UPDATED SEASON SCORE AND PREVWEEKSEASON SCORE ${lineup.scoreSeason} and ${lineup.prevWeekSeasonScore} with a week score of ${lineup.scoreWeek}`);
            //     problems.push({ cardId: cardId, lineupScore: lineup.scoreSeason, calcScore: seasonScore });

            // }
            
        }
    }
    if(problems.length != 0) {
        for(let i = 0; i < problems.length; i++) {
            console.log(` leagueId: ${problemLeagues[i]}, cardId: ${problems[i]}`)
        }
    }
    console.log('COMPLETE')
})()