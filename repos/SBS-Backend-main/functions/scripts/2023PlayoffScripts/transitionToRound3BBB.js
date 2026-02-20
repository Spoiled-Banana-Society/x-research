const db = require('../../services/db');
const utils = require('../../services/utils');
const axios = require('axios');

const findCardsMovingToRoundTwo = async () => {
    const cardsInPlayoffs = [];
    //const cardsEliminated = [];
    const baseURL = "https://sbs-drafts-api-w5wydprnbq-uc.a.run.app";

    for(let i = 1; i <= 4; i++) {
        const leagueId = `BBB2023-round2-${i}`;
        const path = `${baseURL}/league/0x2f9c2123652cff3717fbd8edb1b256f16e9e4b80/drafts/${leagueId}/leaderboard/ScoreSeason/gameweek/2023REG-16`
        const res = await axios.get(path)
        //console.log(res.data)
        //await utils.sleep(10000)

        const leaderboard = res.data.leaderboard;
        cardsInPlayoffs.push(leaderboard[0]._cardId)
        cardsInPlayoffs.push(leaderboard[1]._cardId)

        // for(let j = 2; j < 13; j++) {
        //     cardsEliminated.push(leaderboard[j]._cardId)
        // }
    }

    return cardsInPlayoffs
}

const payoutElimatedCard = async (card) => {
    const prizeAmount = 0.02;
    // for(let i = 0; i < cardsToPayout.length; i++) {
    //     const cardId = cardsToPayout[i];
    //     const card = await db.readDocument('draftTokens', cardId);

        card.Prizes.ETH = parseFloat((card.Prizes.ETH + prizeAmount).toFixed(4))
        await db.createOrUpdateDocument('draftTokens', card.CardId, card, false)
        await db.createOrUpdateDocument(`owners/${card.OwnerId}/usedDraftTokens`, card.CardId, card, false)
        await db.createOrUpdateDocument(`drafts/${card.LeagueId}/cards`, card.CardId, card, false)
        await db.createOrUpdateDocument(`draftTokenLeaderboard/2023REG-17/cards`, card.CardId, { Card: card }, true)
        await db.createOrUpdateDocument(`drafts/${card.LeagueId}/scores/2023REG-17/cards`, card.CardId, { Card: card }, true)

        console.log(`Paid out Card ${card.CardId} to have a total of ${card.Prizes.ETH} ETH`)
    // }

    // console.log("finished paying out eliminated cards")
}

const createRankedPlayoffCardsList = async (cardsInPlayoffs) => {
    let leaderboard;
    try {
        let result = await db._db.collection(`draftTokenLeaderboard/2023REG-16/cards`).orderBy("ScoreWeek", "desc").get()
        leaderboard = await db._returnDocuments(result)
    } catch(err) {
        console.log(err)
    } 
    console.log('length of data: ', leaderboard.length)

    const rankedPlayoffCards = [];
    for(let i = 0; i < leaderboard.length; i++) {
        const data = leaderboard[i];
        if(cardsInPlayoffs.includes(data.CardId)) {
            rankedPlayoffCards.push(data)
        } else {
            //await payoutElimatedCard(data.Card)
        }
    }

    console.log("Ranked array length: ", rankedPlayoffCards.length)
    return rankedPlayoffCards
}

const createFinalRoundPlayoffLeague = () => {
    let leagueMap = {};
    const date = new Date('2024-01-2');
    const startdate = new Date('2023-12-26')
    const leagueId = `BBB2023-final-round`
    const league = {
        CurrentUsers: [],
        DisplayName: `BBB Final Round Playoff League`,
        DraftType: "live",
        EndDate: date,
        IsLocked: true,
        LeagueId: leagueId,
        Level: "Pro",
        MaxPlayers: 10,
        NumPlayers: 10,
        StartDate: startdate,
    }

    return league
}

const fillFinalRoundPlayoffLeague = async (rankedPlayoffCards, league) => {
    const leagueId = "BBB2023-final-round";

    for(let i = 0; i < rankedPlayoffCards.length; i++) {
        const data = rankedPlayoffCards[i];
        const cardId = data.CardId;
        const ownerId = data.OwnerId;
        const card = data.Card;

        league.CurrentUsers.push({ OwnerId: ownerId, TokenId: cardId })
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
        await db.createOrUpdateDocument(`drafts/${leagueId}/scores/2023REG-17/cards`, cardId, data, true)
        await db.createOrUpdateDocument(`draftTokenLeaderboard/2023REG-17/cards`, cardId, data, false)

        const week16Data = data
        for(let j = 4; j < 16; j++) {
            let gameweek;
            if(j < 10) {
                gameweek = `2023REG-0${j}`;
            } else {
                gameweek = `2023REG-${j}`;
            }
            const scoresDoc = await db.readDocument(`draftTokenLeaderboard/${gameweek}/cards`, cardId)
            if(!scoresDoc) {
                throw('NO SCORES DOC FOR ', gameweek)
            }

            // scoresDoc.Card.LeagueId = week15Data.Card.LeagueId;
            // scoresDoc.Card.LeagueDisplayName = week15Data.Card.LeagueDisplayName;
            // scoresDoc.Card.Level = week15Data.Level;
            // scoresDoc.Level = week15Data.Level;

            await db.createOrUpdateDocument(`drafts/${week16Data.Card.LeagueId}/scores/${gameweek}/cards`, cardId, scoresDoc, false)
            //console.log(scoresDoc)
            //await utils.sleep(10000)
        }
    }

    await db.createOrUpdateDocument('drafts', leagueId, league, true)
        
}

const transitionToRound3HOF = async () => {
    const oldGameweek = '2023REG-16';
    const newGameweek = '2023REG-17';
    const draftTokenIds = await db.readAllDocumentIds(`drafts/BBB-hof-playoffs/cards`);
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
            }
        }
        if(leaderboardObj.Roster.QB) {
            for(let j = 0; j < leaderboardObj.Roster.QB.length; j++) {
                leaderboardObj.Roster.QB[j].PrevWeekSeasonContribution = leaderboardObj.Roster.QB[j].ScoreSeason;
                leaderboardObj.Roster.QB[j].ScoreWeek = 0
                leaderboardObj.Roster.QB[j].IsUsedInCardScore = false;
                //console.log(leaderboardObj.Roster.QB[j])
            }
        }
        if(leaderboardObj.Roster.RB) {
            for(let j = 0; j < leaderboardObj.Roster.RB.length; j++) {
                leaderboardObj.Roster.RB[j].PrevWeekSeasonContribution = leaderboardObj.Roster.RB[j].ScoreSeason;
                leaderboardObj.Roster.RB[j].ScoreWeek = 0
                leaderboardObj.Roster.RB[j].IsUsedInCardScore = false;
            }
        }
        if(leaderboardObj.Roster.TE) {
            for(let j = 0; j < leaderboardObj.Roster.TE.length; j++) {
                leaderboardObj.Roster.TE[j].PrevWeekSeasonContribution = leaderboardObj.Roster.TE[j].ScoreSeason;
                leaderboardObj.Roster.TE[j].ScoreWeek = 0
                leaderboardObj.Roster.TE[j].IsUsedInCardScore = false;
            }
        }
        if(leaderboardObj.Roster.WR) {
            for(let j = 0; j < leaderboardObj.Roster.WR.length; j++) {
                leaderboardObj.Roster.WR[j].PrevWeekSeasonContribution = leaderboardObj.Roster.WR[j].ScoreSeason;
                leaderboardObj.Roster.WR[j].ScoreWeek = 0
                leaderboardObj.Roster.WR[j].IsUsedInCardScore = false;
            }
        }

        //console.log(leaderboardObj)
        
        await db.createOrUpdateDocument(`draftTokenLeaderboard/${newGameweek}/cards`, cardId, leaderboardObj, false)
        //await db.createOrUpdateDocument(`drafts/BBB-hof-playoffs/cards`, cardId, )
        await db.createOrUpdateDocument(`drafts/BBB-hof-playoffs/scores/${newGameweek}/cards`, cardId, leaderboardObj, false)
        //await utils.sleep(10000)
        console.log(`Created Scores document for card ${cardId} in ${newGameweek} in leaderboard and in ${card.LeagueId}`);
    }
}

(async () => {
    const cardsInPlayoffs = await findCardsMovingToRoundTwo()
    const rankedCards = await createRankedPlayoffCardsList(cardsInPlayoffs);
    const league = createFinalRoundPlayoffLeague()
    await fillFinalRoundPlayoffLeague(rankedCards, league)
    //await transitionToRound3HOF()
})()
