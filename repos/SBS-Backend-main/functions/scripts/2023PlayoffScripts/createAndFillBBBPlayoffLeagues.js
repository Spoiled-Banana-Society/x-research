const db = require('../../services/db');
const utils = require('../../services/utils');
const axios = require('axios');

const getValidLeagueIds = async () => {
    const leagueIds = await db.readAllDocumentIds('drafts');
    const validLeagueIds = [];
    for(let i = 0; i < leagueIds.length; i++) {
        const leagueId = leagueIds[i];
        if(leagueId == 'draftTracker') {
            console.log('Found draftTracker document');
            continue;
        }
        const scores = await db.readAllDocumentIds(`drafts/${leagueId}/scores`)
        if(scores.length != 0) {
            validLeagueIds.push(leagueId)
        }
    }

    console.log('returning with array of valid league ids: ', validLeagueIds.length)
    return validLeagueIds
}

const getTop2FromEachLeague = async (leagueIds) => {
    const baseURL = "https://sbs-drafts-api-w5wydprnbq-uc.a.run.app";

    const cardsInPlayoffs = [];

    for(let i = 0; i < leagueIds.length; i++) {
        const leagueId = leagueIds[i];
        const path = `${baseURL}/league/0x2f9c2123652cff3717fbd8edb1b256f16e9e4b80/drafts/${leagueId}/leaderboard/ScoreSeason/gameweek/2023REG-14`
        const res = await axios.get(path)
        //console.log(res.data)
        //await utils.sleep(10000)

        const leaderboard = res.data.leaderboard;
        cardsInPlayoffs.push(leaderboard[0]._cardId)
        cardsInPlayoffs.push(leaderboard[1]._cardId)

        //console.log(`Added Cards ${leaderboard[0]._cardId} and ${leaderboard[1]._cardId} from ${leagueId} to playoff CardIds array`)
    }

    console.log(`Added ${cardsInPlayoffs.length} cards to the playoffs from the leagues`)
    return cardsInPlayoffs
}

const getRankedListOfAllPlayoffCards = async (cardsInPlayoffs) => {
    let leaderboard;
    try {
        let result = await db._db.collection(`draftTokenLeaderboard/2023REG-14/cards`).orderBy("ScoreSeason", "desc").get()
        leaderboard = await db._returnDocuments(result)
    } catch(err) {
        console.log(err)
    } 

    const rankedPlayoffCards = [];
    console.log("Got season leaderboard from BBB leaderboard")
    console.log(leaderboard)
    let wildCardsAdded = 0;
    for(let i = 0; i < leaderboard.length; i++) {
        const obj = leaderboard[i];
        if (cardsInPlayoffs.includes(obj.CardId)) {
            rankedPlayoffCards.push(obj)
        } else {
            if(wildCardsAdded == 12) {
                console.log('we have already added 12 wild cards to the playoffs')
                continue;
            }
            rankedPlayoffCards.push(obj)
            wildCardsAdded++;
            console.log("Added Wild card to playoffs ", obj.CardId)
        }
        if(rankedPlayoffCards.length == 260) {
            console.log("we have added 260 teams to playoffs so we are breaking")
            break
        }
    }

    // for(let i = 0; i < rankedPlayoffCards.length; i++) {
    //     console.log(`{ CardId: ${rankedPlayoffCards[i].CardId}, SeasonScore: ${rankedPlayoffCards[i].ScoreSeason}, Rank: ${i + 1}}`)
    // }

    console.log("Finished creating ranked playoff cards list")
    return rankedPlayoffCards
}

const create20PlayoffLeagues = () => {
    let leagueMap = {};
    const date = new Date('2023-12-25');
    const startdate = new Date('2023-12-12')
    for( let i = 0; i < 20; i++) {
        const leagueId = `BBB2023-round1-${i+1}`
        const league = {
            CurrentUsers: [],
            DisplayName: `BBB Round 1 Playoff League ${i+1}`,
            DraftType: "live",
            EndDate: date,
            IsLocked: true,
            LeagueId: leagueId,
            Level: "Pro",
            MaxPlayers: 13,
            NumPlayers: 13,
            StartDate: startdate,
        }

        leagueMap[leagueId] = league;
        //await db.createOrUpdateDocument('drafts', leagueId, league, true)
    }

    return leagueMap;
}

const putPlayoffCardsIntoLeagues = async (leagueMap, rankedCards) => {
    const baseId = "BBB2023-round1-";
    let leagueNum = 1;
    let isCountingUp = true;
    let justFlipped = false;
    for(let i = 0; i < rankedCards.length; i++) {
        const data = rankedCards[i];
        const cardId = data.CardId;
        const ownerId = data.OwnerId;
        const card = data.Card;

        const leagueId = `${baseId}${leagueNum}`;
        let league = leagueMap[leagueId];
        league.CurrentUsers.push({ OwnerId: ownerId, TokenId: cardId })
        leagueMap[leagueId] = league;
        console.log(`Added ${cardId} with rank ${i + 1} to ${leagueId}`)

        card.LeagueId = league.LeagueId;
        card.LeagueDisplayName = league.DisplayName;
        card.Level = 'Pro';
        data.Card = card;
        data.ScoreWeek = 0;
        data.PrevWeekSeasonScore = data.ScoreSeason;
        if(data.Roster.DST) {
            for(let j = 0; j < data.Roster.DST.length; j++) {
                data.Roster.DST[j].PrevWeekSeasonContribution = data.Roster.DST[j].ScoreSeason;
                data.Roster.DST[j].ScoreWeek = 0
                data.Roster.DST[j].IsUsedInCardScore = false;
            }
        }
        if(data.Roster.QB) {
            for(let j = 0; j < data.Roster.QB.length; j++) {
                data.Roster.QB[j].PrevWeekSeasonContribution = data.Roster.QB[j].ScoreSeason;
                data.Roster.QB[j].ScoreWeek = 0
                data.Roster.QB[j].IsUsedInCardScore = false;
                //console.log(data.Roster.QB[j])
            }
        }
        if(data.Roster.RB) {
            for(let j = 0; j < data.Roster.RB.length; j++) {
                data.Roster.RB[j].PrevWeekSeasonContribution = data.Roster.RB[j].ScoreSeason;
                data.Roster.RB[j].ScoreWeek = 0
                data.Roster.RB[j].IsUsedInCardScore = false;
            }
        }
        if(data.Roster.TE) {
            for(let j = 0; j < data.Roster.TE.length; j++) {
                data.Roster.TE[j].PrevWeekSeasonContribution = data.Roster.TE[j].ScoreSeason;
                data.Roster.TE[j].ScoreWeek = 0
                data.Roster.TE[j].IsUsedInCardScore = false;
            }
        }
        if(data.Roster.WR) {
            for(let j = 0; j < data.Roster.WR.length; j++) {
                data.Roster.WR[j].PrevWeekSeasonContribution = data.Roster.WR[j].ScoreSeason;
                data.Roster.WR[j].ScoreWeek = 0
                data.Roster.WR[j].IsUsedInCardScore = false;
            }
        }

        await db.createOrUpdateDocument(`drafts/${leagueId}/cards`, cardId, card, true)
        await db.createOrUpdateDocument('draftTokens', cardId, card, false)
        await db.createOrUpdateDocument(`owners/${card.OwnerId}/usedDraftTokens`, cardId, card, false)
        await db.createOrUpdateDocument(`drafts/${leagueId}/scores/2023REG-15/cards`, cardId, data, true)
        await db.createOrUpdateDocument(`draftTokenLeaderboard/2023REG-15/cards`, cardId, data, false)

        if(leagueNum == 1 || leagueNum == 20) {
            if(i == 0) {
                leagueNum++;
            } else {
                if (justFlipped) {
                    justFlipped = false;
                    if(isCountingUp) {
                        leagueNum++;
                    } else {
                        leagueNum--;
                    }
                } else {
                    isCountingUp = !isCountingUp;
                    justFlipped = true
                }
            }
        } else {    
            if(isCountingUp) {
                leagueNum++;
            } else {
                leagueNum--;
            }
        }
        
    }

    for(let i = 0; i < 20; i++) {
        const leagueId = `${baseId}${i+1}`
        const league = leagueMap[leagueId];
        await db.createOrUpdateDocument('drafts', leagueId, league, true)
        console.log("created document for ", leagueId)
    }
}

const createHOFPlayoffLeague = async () => {
    const baseURL = "https://sbs-drafts-api-w5wydprnbq-uc.a.run.app";
    const date = new Date('2023-12-25');
    const startdate = new Date('2023-12-12')
    const league = {
        CurrentUsers: [],
        DisplayName: `BBB Hall of Fame Playoff League`,
        DraftType: "live",
        EndDate: date,
        IsLocked: true,
        LeagueId: 'BBB-hof-playoffs',
        Level: "Hall of Fame",
        MaxPlayers: 7,
        NumPlayers: 7,
        StartDate: startdate,
    }

    let leagues = ['live-draft-113', 'live-draft-14', 'live-draft-140', 'live-draft-63', 'live-draft-73', 'live-draft-86', 'live-draft-98'];
    const cardIds = [];
    
    for(let i = 0; i < leagues.length; i++) {
        const leagueId = leagues[i]
        console.log(leagueId)
        const path = `${baseURL}/league/0x2f9c2123652cff3717fbd8edb1b256f16e9e4b80/drafts/${leagueId}/leaderboard/ScoreSeason/gameweek/2023REG-14`
        const res = await axios.get(path)
        //console.log(res.data)
        //await utils.sleep(10000)

        const leaderboard = res.data.leaderboard;
        const winningCardId = leaderboard[0]._cardId;
        cardIds.push(winningCardId)

        const leaderboardObj = await db.readDocument(`draftTokenLeaderboard/2023REG-15/cards`, winningCardId);
        if(!leaderboardObj) {
            throw("no leaderboard object found for Card ", winningCardId)
        }

        league.CurrentUsers.push({ OwnerId: leaderboardObj.OwnerId, TokenId: winningCardId });
        const card = leaderboardObj.Card;

        //card.LeagueId = league.LeagueId;
        //card.LeagueDisplayName = league.DisplayName;
        card.Level = "Hall of Fame"
        leaderboardObj.Card = card;
        // leaderboardObj.ScoreWeek = 0;
        // leaderboardObj.PrevWeekSeasonScore = leaderboardObj.ScoreSeason;
        // if(leaderboardObj.Roster.DST) {
        //     for(let j = 0; j < leaderboardObj.Roster.DST.length; j++) {
        //         leaderboardObj.Roster.DST[j].PrevWeekSeasonContribution = leaderboardObj.Roster.DST[j].ScoreSeason;
        //         leaderboardObj.Roster.DST[j].ScoreWeek = 0
        //         leaderboardObj.Roster.DST[j].IsUsedInCardScore = false;
        //     }
        // }
        // if(leaderboardObj.Roster.QB) {
        //     for(let j = 0; j < leaderboardObj.Roster.QB.length; j++) {
        //         leaderboardObj.Roster.QB[j].PrevWeekSeasonContribution = leaderboardObj.Roster.QB[j].ScoreSeason;
        //         leaderboardObj.Roster.QB[j].ScoreWeek = 0
        //         leaderboardObj.Roster.QB[j].IsUsedInCardScore = false;
        //         //console.log(leaderboardObj.Roster.QB[j])
        //     }
        // }
        // if(leaderboardObj.Roster.RB) {
        //     for(let j = 0; j < leaderboardObj.Roster.RB.length; j++) {
        //         leaderboardObj.Roster.RB[j].PrevWeekSeasonContribution = leaderboardObj.Roster.RB[j].ScoreSeason;
        //         leaderboardObj.Roster.RB[j].ScoreWeek = 0
        //         leaderboardObj.Roster.RB[j].IsUsedInCardScore = false;
        //     }
        // }
        // if(leaderboardObj.Roster.TE) {
        //     for(let j = 0; j < leaderboardObj.Roster.TE.length; j++) {
        //         leaderboardObj.Roster.TE[j].PrevWeekSeasonContribution = leaderboardObj.Roster.TE[j].ScoreSeason;
        //         leaderboardObj.Roster.TE[j].ScoreWeek = 0
        //         leaderboardObj.Roster.TE[j].IsUsedInCardScore = false;
        //     }
        // }
        // if(leaderboardObj.Roster.WR) {
        //     for(let j = 0; j < leaderboardObj.Roster.WR.length; j++) {
        //         leaderboardObj.Roster.WR[j].PrevWeekSeasonContribution = leaderboardObj.Roster.WR[j].ScoreSeason;
        //         leaderboardObj.Roster.WR[j].ScoreWeek = 0
        //         leaderboardObj.Roster.WR[j].IsUsedInCardScore = false;
        //     }
        // }

        //await db.createOrUpdateDocument('draftTokens', winningCardId, card, false)
        //await db.createOrUpdateDocument(`owners/${card.OwnerId}/usedDraftTokens`, winningCardId, card, false)
        await db.createOrUpdateDocument(`drafts/${league.LeagueId}/cards`, winningCardId, card, true)
        await db.createOrUpdateDocument(`drafts/${league.LeagueId}/scores/2023REG-15/cards`, winningCardId, leaderboardObj, true);
        //await db.createOrUpdateDocument('draftTokenLeaderboard/2023REG-15/cards', winningCardId, leaderboardObj, false)

        console.log(`Added Card ${winningCardId} to hof playoff league from ${leagueId}`)
    }

   await db.createOrUpdateDocument('drafts', league.LeagueId, league, true)

    console.log("Created HOF playoff league for BBB")
    console.log(cardIds)

}


// (async () => {
//     const leagueIds = await getValidLeagueIds()
//     const cardsInPlayoffs = await getTop2FromEachLeague(leagueIds)
//     const rankedCards = await getRankedListOfAllPlayoffCards(cardsInPlayoffs)
//     let leagueMap = create20PlayoffLeagues();
//     await putPlayoffCardsIntoLeagues(leagueMap, rankedCards)
// })()

(async () => {
    await createHOFPlayoffLeague()
})()
