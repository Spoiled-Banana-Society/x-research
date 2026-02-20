const scoreTriggers = require('../../services/score-triggers');
const db = require('../../services/db');
const utils = require('../../services/utils');
const teamsArr = ["ARI", "ATL", "BAL", "BUF", "CAR", "CHI", "CIN", "CLE", "DAL", "DEN", "DET", "GB", "HOU", "IND", "JAC", "KC", "LAC", "LA", "MIA", "MIN", "NE", "NO", "NYG", "NYJ", "LV", "PHI", "PIT", "SEA", "SF", "TB", "TEN", "WAS"];


(async () => {
    const gameweek = '2022-REG-17';
    const results = [];
    let leagueIds = await db.readAllDocumentIds(`leagues`);
    leagueIds = leagueIds.filter(x => x.indexOf('3') != -1 && x.indexOf('Season') == -1 && x.indexOf('Weekly') == -1 && x.indexOf('PROMO') == -1 && x.indexOf('genesis') == -1);
    for(let i = 0; i < leagueIds.length; i++) {
        const leagueId = leagueIds[i];
        const split = leagueId.split('-');
        if(split[3] != '3') {
            console.log(leagueId + 'is not round 3 so we dont care');
            continue;
        }
        console.log(leagueId);
        const cardIds = await db.readAllDocumentIds(`leagues/${leagueId}/cards`);
        for(let j = 0; j < cardIds.length; j++) {
            const cardId = cardIds[j];
            console.log(cardId);
            const lineup = await db.readDocument(`leagues/${leagueId}/cards/${cardId}/lineups`, gameweek);
            if(!lineup) {
                console.log('no lineup found for card in league');
                await utils.sleep(20000);
                continue;
            }
            const genesisLineup = await db.readDocument(`leagues/genesis/cards/${cardId}/lineups`, gameweek);
            if(!genesisLineup) {
                console.log('no genesis lineup found for card ' + cardId);
                continue;
            }
            lineup.starting = genesisLineup.starting;
            lineup.bench = genesisLineup.bench;
            lineup.startingTeamArr = genesisLineup.startingTeamArr;
            lineup.scoreWeek = genesisLineup.scoreWeek;
            lineup.scoreSeason = parseFloat((lineup.prevWeekSeasonScore + lineup.scoreWeek).toFixed(4));
            console.log('score season: ' + lineup.scoreSeason);
            await db.createOrUpdateDocument(`leagues/${leagueId}/cards/${cardId}/lineups`, gameweek, lineup, true)
            console.log(`Updated card ${cardId} in ${leagueId}`)
            await utils.sleep(100);
            try {
                await scoreTriggers.lineupScoreMachine(leagueId, cardId, gameweek, teamsArr)
            } catch (err) {
                console.log(err)
            }
            const splitArr = leagueId.split('-');
            const level = splitArr[1];
            if(level.toLowerCase() == 'pro') {
                const obj = await db.readDocument(`proChampionshipRoundLeaderboard/${gameweek}/cards`, cardId);
                const lineup = await db.readDocument(`leagues/${leagueId}/cards/${cardId}/lineups`, gameweek);
                if(!lineup) {
                    continue;
                }
                obj.scoreWeek = lineup.scoreWeek;
                obj.scoreSeason = lineup.scoreSeason;
                obj.lineup = lineup;
                await db.createOrUpdateDocument(`proChampionshipRoundLeaderboard/${gameweek}/cards`, cardId, obj, false);
                console.log('Updated Pro championship round leaderboard for card ' + cardId)

            } else if (level.toLowerCase() == 'hof') {
                const obj = await db.readDocument(`hofChampionshipRoundLeaderboard/${gameweek}/cards`, cardId);
                const lineup = await db.readDocument(`leagues/${leagueId}/cards/${cardId}/lineups`, gameweek);
                if(!lineup) {
                    continue;
                }
                obj.scoreWeek = lineup.scoreWeek;
                obj.scoreSeason = lineup.scoreSeason;
                obj.lineup = lineup;
                await db.createOrUpdateDocument(`hofChampionshipRoundLeaderboard/${gameweek}/cards`, cardId, obj, false);
                console.log('Updated hof championship round leaderboard for card ' + cardId)

            } else if (level.toLowerCase() == 'spoiled') {
                const obj = await db.readDocument(`spoiledChampionshipRoundLeaderboard/${gameweek}/cards`, cardId);
                const lineup = await db.readDocument(`leagues/${leagueId}/cards/${cardId}/lineups`, gameweek);
                if(!lineup) {
                    continue;
                }
                obj.scoreWeek = lineup.scoreWeek;
                obj.scoreSeason = lineup.scoreSeason;
                obj.lineup = lineup;
                await db.createOrUpdateDocument(`spoiledChampionshipRoundLeaderboard/${gameweek}/cards`, cardId, obj, false);
                console.log('Updated spoiled championship round leaderboard for card ' + cardId)

            } else if (level.toLowerCase() == 'bottom') {
                const obj = await db.readDocument(`bottomChampionshipRoundLeaderboard/${gameweek}/cards`, cardId);
                const lineup = await db.readDocument(`leagues/${leagueId}/cards/${cardId}/lineups`, gameweek);
                if(!lineup) {
                    continue;
                }
                obj.scoreWeek = lineup.scoreWeek;
                obj.scoreSeason = lineup.scoreSeason;
                obj.lineup = lineup;
                await db.createOrUpdateDocument(`bottomChampionshipRoundLeaderboard/${gameweek}/cards`, cardId, obj, false);
                console.log('Updated bottom championship round leaderboard for card ' + cardId)
            }
        }
    }

    console.log(results)
})()