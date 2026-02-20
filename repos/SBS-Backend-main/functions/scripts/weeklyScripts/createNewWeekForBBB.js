const db = require('../../services/db');
const utils = require('../../services/utils');

(async () => {
    const oldGameweek = '2025REG-08';
    const newGameweek = '2025REG-09';
    const draftTokenIds = await db.readAllDocumentIds('draftTokens');
    for(let i = 0; i < draftTokenIds.length; i++) {
        const cardId = draftTokenIds[i];
        const card = await db.readDocument('draftTokens', cardId)
        if(card.LeagueId == "") {
            console.log("THIS Card does not have a league id so we are continueing: ", cardId)
            continue;
        }

        const leaderboardObj = await db.readDocument(`draftTokenLeaderboard/${oldGameweek}/cards`, cardId)
        if(!leaderboardObj){
            console.log(card)
            continue;
        }
        leaderboardObj.ScoreWeek = 0;
        leaderboardObj.PrevWeekSeasonScore = leaderboardObj.ScoreSeason;
        if(leaderboardObj.Roster.DST) {
            for(let j = 0; j < leaderboardObj.Roster.DST.length; j++) {
                leaderboardObj.Roster.DST[j].PrevWeekSeasonContribution = leaderboardObj.Roster.DST[j].ScoreSeason;
                leaderboardObj.Roster.DST[j].ScoreWeek = 0
                leaderboardObj.Roster.DST[j].IsUsedInCardScore = false;
                leaderboardObj.Roster.DST[j].Position = 'DST'
            }
        }
        if(leaderboardObj.Roster.QB) {
            for(let j = 0; j < leaderboardObj.Roster.QB.length; j++) {
                leaderboardObj.Roster.QB[j].PrevWeekSeasonContribution = leaderboardObj.Roster.QB[j].ScoreSeason;
                leaderboardObj.Roster.QB[j].ScoreWeek = 0
                leaderboardObj.Roster.QB[j].IsUsedInCardScore = false;
                leaderboardObj.Roster.QB[j].Position = 'QB'
                //console.log(leaderboardObj.Roster.QB[j])
            }
        }
        if(leaderboardObj.Roster.RB) {
            for(let j = 0; j < leaderboardObj.Roster.RB.length; j++) {
                leaderboardObj.Roster.RB[j].PrevWeekSeasonContribution = leaderboardObj.Roster.RB[j].ScoreSeason;
                leaderboardObj.Roster.RB[j].ScoreWeek = 0
                leaderboardObj.Roster.RB[j].IsUsedInCardScore = false;
                leaderboardObj.Roster.RB[j].Position = 'RB'
            }
        }
        if(leaderboardObj.Roster.TE) {
            for(let j = 0; j < leaderboardObj.Roster.TE.length; j++) {
                leaderboardObj.Roster.TE[j].PrevWeekSeasonContribution = leaderboardObj.Roster.TE[j].ScoreSeason;
                leaderboardObj.Roster.TE[j].ScoreWeek = 0
                leaderboardObj.Roster.TE[j].IsUsedInCardScore = false;
                leaderboardObj.Roster.TE[j].Position = 'TE'
            }
        }
        if(leaderboardObj.Roster.WR) {
            for(let j = 0; j < leaderboardObj.Roster.WR.length; j++) {
                leaderboardObj.Roster.WR[j].PrevWeekSeasonContribution = leaderboardObj.Roster.WR[j].ScoreSeason;
                leaderboardObj.Roster.WR[j].ScoreWeek = 0
                leaderboardObj.Roster.WR[j].IsUsedInCardScore = false;
                leaderboardObj.Roster.WR[j].Position = 'WR'
            }
        }

        //console.log(leaderboardObj)
        
        await db.createOrUpdateDocument(`draftTokenLeaderboard/${newGameweek}/cards`, cardId, leaderboardObj, false)
        await db.createOrUpdateDocument(`drafts/${card.LeagueId}/scores/${newGameweek}/cards`, cardId, leaderboardObj, false)
        //await utils.sleep(10000)
        console.log(`Created Scores document for card ${cardId} in ${newGameweek} in leaderboard and in ${card.LeagueId}`);
    }
})()