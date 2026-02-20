const db = require('../../services/db');
const utils = require('../../services/utils');
const score = require('../../services/score');
const { parse } = require('path');

(async () => {
    const gameweek = '2022-REG-17';
    const prevWeek = '2022-REG-16';
    const weekStrings = utils.getStringsForCurrentWeek2022(gameweek);
    let leagues = await db.readAllDocumentIds('leagues');
    const problems = [];
    const problemLeagues = [];
    leagues = leagues.filter(x => x.indexOf('Season') != -1 || x.indexOf('PROMO') != -1 || x.indexOf(weekStrings[1]) != -1)
    leagues = leagues.filter(x => x != 'genesis');
    for(let i = 0; i < leagues.length; i++) {
        const leagueId = leagues[i];
        console.log(leagueId)
        const league = await db.readDocument('leagues', leagueId);
        if(league.game.currentPlayers < league.game.minPlayers) {
            console.log(`this league did not reach minimum players`);
            continue;
        }
        const cardIds = await db.readAllDocumentIds(`leagues/${leagueId}/cards`);
        for(let j = 0; j < cardIds.length; j++) {
            const cardId = cardIds[j];
            console.log(cardId)
            const lineup = await db.readDocument(`leagues/${leagueId}/cards/${cardId}/lineups`, gameweek);
            if(!lineup) {
                console.log('no lineup found')
                //problems.push({ cardId: cardId, leagueId: leagueId, error: "no lineup was found for week 14" });
                continue;
            }
            if(cardId != lineup._cardId) {
                console.log(`Card ${cardId} in ${leagueId} has the wrong lineup`)
                problems.push(cardId)
                problemLeagues.push(leagueId)
            }
            if(!lineup.prevWeekSeasonScore) {
                console.log('..... Did not have prevWeekSeasonScore')
                problems.push(cardId);
                problemLeagues.push(leagueId)
            }
            const prevLineup = await db.readDocument(`leagues/${leagueId}/cards/${cardId}/lineups`, prevWeek);
            if(prevLineup.scoreSeason != lineup.prevWeekSeasonScore) {
                problems.push(cardId);
                problemLeagues.push(leagueId);
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