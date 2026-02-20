const db = require('../../services/db');
const utils = require('../../services/utils');

// RUN THIS AFTER DRAFTS CLOSE BUT BEFORE FIRST SCORING KICKS OFF

const blankLeaderBoardObj = {
    Card: {},
    CardId: null,
    Level: null,
    OwnerId: null,
    PFP: {},
    PrevWeekSeasonScore: 0,
    Roster: {},
    ScoreSeason: 0,
    ScoreWeek: 0
}

const createBlankObjectForCard = (card, owner) => {
    // copy blank card
    const obj = JSON.parse(JSON.stringify(blankLeaderBoardObj))
    obj.Card = card
    obj.CardId = card.CardId
    obj.Level = card.Level
    obj.OwnerId = card.OwnerId,
    obj.PFP = owner?.PFP || createBlankPFP(),
    obj.Roster = card.Roster

    return obj
}

const createBlankPFP = (owner) => {
    return {
        DisplayName: "",
        ImageUrl: "",
        NftContract: ""
    }
}

(async () => {
    // const oldGameweek = '2024REG-13';
    const newGameweek = '2025REG-01';
    const draftTokenIds = await db.readAllDocumentIds('draftTokens');
    for(let i = 0; i < draftTokenIds.length; i++) {
        const cardId = draftTokenIds[i];
        const card = await db.readDocument('draftTokens', cardId)
        if(!card.LeagueId || card.LeagueId == "") {
            console.log("THIS Card does not have a league id so we are continueing: ", cardId)
            continue;
        }
        console.log(card.OwnerId)
        let owner = await db.readDocument('owners', card.OwnerId)

        const leaderboardObj = createBlankObjectForCard(card, owner)
        leaderboardObj.ScoreWeek = 0;
        leaderboardObj.PrevWeekSeasonScore = leaderboardObj.ScoreSeason;
        if(leaderboardObj.Roster.DST) {
            for(let j = 0; j < leaderboardObj.Roster.DST.length; j++) {
                leaderboardObj.Roster.DST[j].PrevWeekSeasonContribution = 0;
                leaderboardObj.Roster.DST[j].ScoreWeek = 0
                leaderboardObj.Roster.DST[j].ScoreSeason = 0
                leaderboardObj.Roster.DST[j].IsUsedInCardScore = false;
            }
        }
        if(leaderboardObj.Roster.QB) {
            for(let j = 0; j < leaderboardObj.Roster.QB.length; j++) {
                leaderboardObj.Roster.QB[j].PrevWeekSeasonContribution = 0;
                leaderboardObj.Roster.QB[j].ScoreWeek = 0
                leaderboardObj.Roster.QB[j].ScoreSeason = 0
                leaderboardObj.Roster.QB[j].IsUsedInCardScore = false;
                //console.log(leaderboardObj.Roster.QB[j])
            }
        }
        if(leaderboardObj.Roster.RB) {
            for(let j = 0; j < leaderboardObj.Roster.RB.length; j++) {
                leaderboardObj.Roster.RB[j].PrevWeekSeasonContribution = 0;
                leaderboardObj.Roster.RB[j].ScoreWeek = 0
                leaderboardObj.Roster.RB[j].ScoreSeason = 0
                leaderboardObj.Roster.RB[j].IsUsedInCardScore = false;
            }
        }
        if(leaderboardObj.Roster.TE) {
            for(let j = 0; j < leaderboardObj.Roster.TE.length; j++) {
                leaderboardObj.Roster.TE[j].PrevWeekSeasonContribution = 0;
                leaderboardObj.Roster.TE[j].ScoreWeek = 0
                leaderboardObj.Roster.TE[j].ScoreSeason = 0
                leaderboardObj.Roster.TE[j].IsUsedInCardScore = false;
            }
        }
        if(leaderboardObj.Roster.WR) {
            for(let j = 0; j < leaderboardObj.Roster.WR.length; j++) {
                leaderboardObj.Roster.WR[j].PrevWeekSeasonContribution = 0;
                leaderboardObj.Roster.WR[j].ScoreWeek = 0
                leaderboardObj.Roster.WR[j].ScoreSeason = 0
                leaderboardObj.Roster.WR[j].IsUsedInCardScore = false;
            }
        }
        //console.log(leaderboardObj)
        
        await db.createOrUpdateDocument(`draftTokenLeaderboard/${newGameweek}/cards`, cardId, leaderboardObj, false)
        await db.createOrUpdateDocument(`drafts/${card.LeagueId}/scores/${newGameweek}/cards`, cardId, leaderboardObj, false)
        //await utils.sleep(10000)
        console.log(`Created Scores document for card ${cardId} in ${newGameweek} in leaderboard and in ${card.LeagueId}`);

        // throw new Error('stop')
    }
})()