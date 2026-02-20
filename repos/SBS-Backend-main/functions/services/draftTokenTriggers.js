const db = require('./db');
const sportsDataScore = require('./sportsDataScore');
const axios = require('axios');
const ENV = require('./env');
const api = require('./api');
const utils = require('./utils');
const sbs = require('./sbs');


const internals = {};

// trigger for document at drafts/{draftId}/scores/{gameweek}/cards/{cardId}
/*

    CARD SCORE OBJECT
    {
        CardId: string,
        PrevWeekSeasonScore: float
        Roster: Roster,
        ScoreSeason: float,
        ScoreWeek: float
    }

    DRAFT TOKEN
    {
        CardId: string,
        DraftType: live,
        ImageUrl: string,
        LeagueDisplayName, string,
        LeagueId: string,
        Level: string,
        OwnerId: string,
        Rank: string,
        Roster: roster,
        SeasonScore: string,
        WeekScore: string
    }

    LEADERBOARD OBJECT
    {
        Card: DraftToken,
        CardId: string,
        Level: string,
        CardScore: Card Score Object,
        OwnerId: string,
        ScoreSeason: float,
        ScoreWeek: float,
    }
*/

internals.UpdateDraftTokenInSubcollectionsOnOwnerChange = async (change, context) => {
    const cardId = context.params.tokenId;
    const card = change.after.data();
    const before = change.before.data();
    const TAX_YEAR = new Date().getUTCFullYear().toString();

    console.log('Card before: ', before)
    console.log('card after: ', card)

    if (card.OwnerId == before.OwnerId) {
        console.log("owners are the same so we are skipping")
        return
    }

    try{
        // update in draftTokens
        await db.createOrUpdateDocument('draftTokens', cardId, card, false)

        if (card.LeagueId == "") {
            await db.createOrUpdateDocument(`owners/${card.OwnerId}/validDraftTokens`, cardId, card, false)
            await db.deleteDocument(`owners/${before.OwnerId}/validDraftTokens`, cardId)
        } else {
            // update in owners/ownerId/usedDraftTokens/cardId
            await db.createOrUpdateDocument(`owners/${card.OwnerId}/usedDraftTokens`, cardId, card, false)
            await db.deleteDocument(`owners/${before.OwnerId}/usedDraftTokens`, cardId)
        }
        

        //update in league
        if (card.LeagueId != "") {
            await db.createOrUpdateDocument(`drafts/${card.LeagueId}/cards`, cardId, card, false)
            console.log(`Updated Draft Token ${cardId} in draftTokens, owners, and league`)
            const leaderboardObj = await db.readDocument(`draftTokenLeaderboard/${sbs.getNFLWeekV2()}/cards`, cardId)
            leaderboardObj.Card = card;
            leaderboardObj.OwnerId = card.OwnerId;
            let owner = await db.readDocument('owners', card.OwnerId);
            if (!owner) {
                owner = {
                    AvailableCredit: 0,
                    AvailableEthCredit: 0,
                    BlueCheckEmail: "",
                    HasW9: {
                        [TAX_YEAR]: false
                    },
                    IsBlueCheckVerified: false,
                    Leagues: [],
                    NumWithdrawals: 0,
                    PendingCredit: 0,
                    WithdrawnAmount: {
                        [TAX_YEAR]: 0,
                    },
                    PFP: {
                        DisplayName: card.OwnerId,
                        ImageUrl: "",
                        NftContract: "",
                    },
                }
            }
            leaderboardObj.PFP = owner.PFP;
            const gameweek = sbs.getNFLWeekV2()
            const weekNum = Number(gameweek.split("-")[1]);
            for (let i = weekNum; i > 0; i--) {
                let gameweekStr;
                if (i < 10) {
                    gameweekStr = `2025REG-0${i}`;
                } else {
                    gameweekStr = `2025REG-${i}`
                }
                await db.createOrUpdateDocument(`draftTokenLeaderboard/${gameweekStr}/cards`, cardId, leaderboardObj, false)
                console.log(`Updated draftTokenLeaderboard/${gameweekStr}/cards/${cardId}`)
            }
        }
    } catch (err) {
        console.log(`ERROR updating draft tokens in UpdateDraftTokenOnScoreUpdate for Draft Token ${cardId}: `, err);
    }
}

internals.UpdateDraftTokenOnScoreUpdate = async (change, context) => {
    const draftId = context.params.draftId;
    const gameweek = context.params.gameweek;
    const cardId = context.params.cardId;
    const before = change.before.data();
    const newCardScoreObject = change.after.data();

    if (before.ScoreWeek == newCardScoreObject.ScoreWeek) {
        console.log("week score has not changed so we are returning")
        return
    }

    const draftToken = await db.readDocument('draftTokens', cardId);
    if (!draftToken) {
        console.log(`No draft token returned for ${cardId} so we are returning`);
        return
    }

    draftToken.SeasonScore = newCardScoreObject.ScoreSeason.toFixed(2);
    draftToken.WeekScore = newCardScoreObject.ScoreWeek.toFixed(2);

    try{
        // update in draftTokens
        await db.createOrUpdateDocument('draftTokens', cardId, draftToken, false)

        // update in owners/ownerId/usedDraftTokens/cardId
        await db.createOrUpdateDocument(`owners/${draftToken.OwnerId}/usedDraftTokens`, cardId, draftToken, false)

        //update in league
        await db.createOrUpdateDocument(`drafts/${draftId}/cards`, cardId, draftToken, false)

        console.log(`Updated Draft Token ${cardId} in draftTokens, owners, and league`)
    } catch (err) {
        console.log(`ERROR updating draft tokens in UpdateDraftTokenOnScoreUpdate for Draft Token `, cardId);
    }

    // const leaderboardObject = {
    //     Card: draftToken,
    //     CardId: cardId,
    //     Level: draftToken.Level,
    //     CardScore: newCardScoreObject,
    //     OwnerId: draftToken.OwnerId,
    //     ScoreSeason: newCardScoreObject.ScoreSeason,
    //     ScoreWeek: newCardScoreObject.ScoreWeek
    // }

    // try {
    //     await db.createOrUpdateDocument(`draftTokensLeaderboard/${gameweek}/cards`, cardId, leaderboardObject, false);
    //     await db.createOrUpdateDocument(`drafts/${draftId}/leaderboard/${gameweek}/cards`, cardId, leaderboardObject, false);
    //     console.log("Updated the leaderboard object for Draft Token ", cardId)
    // } catch (err) {
    //     console.log(`Error updating leaderboard object for Draft Token `, cardId)
    //     return
    // }

    const metadata = await db.readDocument('draftTokenMetadata', cardId)
    for(let i = 0; i < metadata.Attributes.length; i++) {
        if(metadata.Attributes[i].Trait_Type == "WEEK-SCORE") {
            metadata.Attributes[i].Value = draftToken.WeekScore;
        } else if (metadata.Attributes[i].Trait_Type == "SEASON-SCORE") {
            metadata.Attributes[i].Value = draftToken.SeasonScore;
        }
    }

    console.log("Finished Running UpdateDraftTokenOnScoreUpdate for Draft Token ", cardId);
    return
}


// trigger at scores/gameweek

internals.ScoreDraftTokensOnScoreUpdate = async (change, context) => {
    const gameweek = context.params.gameweek;
    const scores = change.after.data();

    console.log('Calling function to score draftTokens on scores update')
    try {
        await sportsDataScore.ScoreDraftTokens(gameweek, scores)
        console.log("Finishing scoring draft Tokens on scores update")
    } catch (err) {
        console.log(`ERROR Scoring draft tokens on scores update: `, err)
    }
}

// trigger at draftTokens/cardId

internals.UpdateDraftTokenMetadata = async (change, context) => {
    const cardId = context.params.cardId;
    const newToken = change.after.data();
    const oldToken = change.before.data();

    await db.createOrUpdateDocument('draftTokens', newToken.CardId, newToken, false)

    // update in owners/ownerId/usedDraftTokens/cardId
    await db.createOrUpdateDocument(`owners/${newToken.OwnerId}/usedDraftTokens`, newToken.CardId, newToken, false)

    //update in league
    if (newToken.LeagueId != "") {
        await db.createOrUpdateDocument(`drafts/${newToken.LeagueId}/cards`, newToken.CardId, newToken, false)
    }

    let needsToRun = false
    if(parseFloat(newToken.SeasonScore) != parseFloat(oldToken.SeasonScore)) {
        needsToRun = true;
    } else if (parseFloat(newToken.WeekScore) != parseFloat(oldToken.WeekScore)) {
        needsToRun = true;
    } else if (parseInt(newToken.Rank) != parseInt(oldToken.Rank)) {
        needsToRun = true;
    } else if (parseInt(newToken.LeagueRank) != parseInt(oldToken.LeagueRank)) {
        needsToRun = true;
    }

    if(!needsToRun) {
        console.log("THIS DOES NOT NEED TO UPDATE THE METADATA SO WE ARE RETURNING")
        return
    }

    const metadata = await db.readDocument('draftTokenMetadata', cardId)
    if(!metadata) {
        throw(`ERROR there is not metadata found for ${cardId}`)
    }

    for(let i = 0; i < metadata.Attributes.length; i++) {
        const attr = metadata.Attributes[i];
        if(attr.Type == "SEASON-SCORE"){
            attr.Value = newToken.SeasonScore;
        } else if (attr.Type == "WEEK-SCORE") {
            attr.Value = newToken.WeekScore;
        } else if (attr.Type == "RANK") {
            attr.Value = newToken.Rank;
        } else if (attr.Type == "LEAGUE-RANK") {
            attr.Value = newToken.LeagueRank;
        }

        metadata.Attributes[i] = attr
    }

    await db.createOrUpdateDocument('draftTokenMetadata', cardId, metadata, false)
    console.log(`Updated Draft Token ${cardId} metadata to be ${metadata}`)

    let url = `https://api.opensea.io/api/v1/asset/0x82194174d56b6df894460e7754a9cC69a0c1707D/${cardId}/?force_update=true`;
    let options = {
        method: 'GET',
        headers: {
            'X-API-KEY': ENV.get('MAINNET_OPENSEA_API_KEY')
        }
    };

    let res = await fetch(url, options)
    console.log(`Forced update in opensea: ${res}`)
    return
}

// trigger at drafts/{draftId}
internals.updateMetadataOnDraftClose = async (change, context) => {
    const draftId = context.params.tokenId;
    const before = change.before.data();
    const after = change.after.data();

    if (!before.IsLocked && after.IsLocked) {
        await utils.sleep(2000)
        for(let i = 0; i < after.CurrentUsers[i].length; i++) {
            const cardId = after.CurrentUsers[i].TokenId;
            await api.refreshDraftTokenOpenseaMetadata(cardId)
            console.log('updated card in draft and forced opensea update')
        }
        console.log(`Forced opensea metadata after ${draftId} completed`)
    }

    
    return
}

internals.onDraftCompletionAndCardCreation = async (change, context) => {
    const draftId = context.params.draftId;
    const oldLeague = change.before.data();
    const newLeague = change.after.data();

    if(!(oldLeague.IsLocked == false && newLeague.IsLocked == true)) {
        console.log("This draft league did not just go from unlocked to locked so we are returning")
        return
    }

    await utils.sleep(30000)

    const cardIds = await db.readAllDocumentIds(`drafts/${draftId}/cards`);
    for (let i = 0; i < cardIds.length; i++) {
        const cardId = cardIds[i];
        const token = await db.readDocument(`drafts/${draftId}/cards`, cardId)
        const dstArray = [];
        const qbArray = [];
        const rbArray = [];
        const teArray = [];
        const wrArray = [];

        for(let j = 0; j < token.Roster.DST.length; j++) {
            let obj = {
                PlayerId: token.Roster.DST[j].PlayerId,
                PrevWeekSeasonContribution: 0,
                ScoreSeason: 0,
                ScoreWeek: 0,
                IsUsedInCardScore: false,
                Team: token.Roster.DST[j].Team,
                Position: 'DST'
            }
            dstArray.push(obj)
        }
        for(let j = 0; j < token.Roster.QB.length; j++) {
            let obj = {
                PlayerId: token.Roster.QB[j].PlayerId,
                PrevWeekSeasonContribution: 0,
                ScoreSeason: 0,
                ScoreWeek: 0,
                IsUsedInCardScore: false,
                Team: token.Roster.QB[j].Team,
                Position: 'QB'
            }
            qbArray.push(obj)
        }
        for(let j = 0; j < token.Roster.RB.length; j++) {
            let obj = {
                PlayerId: token.Roster.RB[j].PlayerId,
                PrevWeekSeasonContribution: 0,
                ScoreSeason: 0,
                ScoreWeek: 0,
                IsUsedInCardScore: false,
                Team: token.Roster.RB[j].Team,
                Position: 'RB'
            }
            rbArray.push(obj)
        }
        for(let j = 0; j < token.Roster.TE.length; j++) {
            let obj = {
                PlayerId: token.Roster.TE[j].PlayerId,
                PrevWeekSeasonContribution: 0,
                ScoreSeason: 0,
                ScoreWeek: 0,
                IsUsedInCardScore: false,
                Team: token.Roster.TE[j].Team,
                Position: 'TE'
            }
            teArray.push(obj)
        }
        for(let j = 0; j < token.Roster.WR.length; j++) {
            let obj = {
                PlayerId: token.Roster.WR[j].PlayerId,
                PrevWeekSeasonContribution: 0,
                ScoreSeason: 0,
                ScoreWeek: 0,
                IsUsedInCardScore: false,
                Team: token.Roster.WR[j].Team,
                Position: 'WR'
            }
            wrArray.push(obj)
            //console.log(obj)
        }

        const scoreRoster = {
            DST: dstArray,
            QB: qbArray,
            RB: rbArray,
            TE: teArray,
            WR: wrArray
        }

        const owner = await db.readDocument('owners', token.OwnerId)


        const obj = {
            Card: token,
            CardId: token.CardId,
            Roster: scoreRoster,
            ScoreWeek: 0,
            ScoreSeason: 0,
            PrevWeekSeasonScore: 0,
            OwnerId: token.OwnerId,
            Level: token.Level,
            PFP: (owner.PFP) ? owner.PFP : { DisplayName: "", ImageUrl: "", NftContract: "" }
        }

        let gameweek = sbs.getNFLWeekV2()
        const split = gameweek.split('-')
        if (Number(split[1]) < 4) {
            gameweek = "2023REG-04"
        }

        await db.createOrUpdateDocument(`drafts/${token.LeagueId}/scores/${gameWeek}/cards`, token.CardId, obj, false)
        await db.createOrUpdateDocument(`draftTokenLeaderboard/${gameWeek}/cards`, token.CardId, obj, false)
    }
}

internals.UpdateRankInCardAndMetadata = async () => {
    const gameweek = sbs.getNFLWeekV2();
    // const gameweek = "2025REG-08"
    const dataEndpoint = `https://sbs-cloud-functions-api-671861674743.us-central1.run.app/updateRanks`;
    
    const body = {
        gameWeek: gameweek,
    }

    try {
        console.log("calling scoring endpoint now")
        let res = await axios.post(dataEndpoint, body)
        result = res.json()
    } catch (err) {
        console.log(err)
    }
    
    console.log("Done running UpdateRankInCardMetadata")
}

internals.OnPrizeChange = async (change, context) => {
    const gameweek = sbs.getNFLWeekV2()
    const before = change.before.data();
    const after = change.after.data();
    const cardId = context.params.cardId;

    if(before.Prizes.ETH == after.Prizes.ETH) {
        console.log("This card does not show a change in prizes so we are returning")
        return
    }

    const leaderboardObj = await db.readDocument(`draftTokenLeaderboard/${gameweek}/cards`, cardId)
    if(leaderboardObj) {
        leaderboardObj.Card = after;
        await db.createOrUpdateDocument(`draftTokenLeaderboard/${gameweek}/cards`, cardId, leaderboardObj, true)
        await db.createOrUpdateDocument(`drafts/${after.LeagueId}/scores/${gameweek}/cards`, cardId, leaderboardObj, true)
    } else {
        console.log('no leaderboard object for ', cardId)
    }

    
    await db.createOrUpdateDocument(`owners/${after.OwnerId}/usedDraftTokens`, cardId, after, false)
    await db.createOrUpdateDocument(`drafts/${after.LeagueId}/cards`, cardId, after, false)
    console.log("Updated card in draftTokenLeaderboard and league leaderboard for Card ", cardId)
    return
}



module.exports = internals
