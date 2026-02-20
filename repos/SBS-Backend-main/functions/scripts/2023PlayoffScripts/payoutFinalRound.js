const db = require('../../services/db');
const utils = require('../../services/utils');
const axios = require('axios');



const payoutProFinalLeague = async () => {
    const prizeArray = [0, 1.5, 0.500, 0.250, 0.200, 0.150, 0.100, 0.080];
    const leagueId = 'BBB2023-final-round';
    const baseURL = "https://sbs-drafts-api-w5wydprnbq-uc.a.run.app";
    const path = `${baseURL}/league/0x2f9c2123652cff3717fbd8edb1b256f16e9e4b80/drafts/${leagueId}/leaderboard/ScoreWeek/gameweek/2023REG-17`
    const res = await axios.get(path)
    const rankedCardIds = [];

    const leaderboard = res.data.leaderboard;
    for(let i = 0; i < leaderboard.length; i++) {
        const cardId = leaderboard[i]._cardId;
        rankedCardIds.push(cardId)
    }

    for(let i = 0; i < rankedCardIds.length; i++) {
        const cardId = rankedCardIds[i];
        console.log(cardId)
        const card = await db.readDocument('draftTokens', cardId);
        card.Prizes.ETH = parseFloat((card.Prizes.ETH + prizeArray[i]).toFixed(4))
        await db.createOrUpdateDocument('draftTokens', cardId, card, false)
        await db.createOrUpdateDocument(`owners/${card.OwnerId}/usedDraftTokens`, cardId, card, false)
        await db.createOrUpdateDocument(`draftTokenLeaderboard/2023REG-17/cards`, cardId, { Card: card }, true)
        console.log(`Paid out ${cardId} ${prizeArray[i]} ETH to make a total of ${card.Prizes.ETH}`)
    }
}

const getHOFPlayoffsCummulativeScore = async () => {
    const prizeArray = [0.5, 0.2, 0.125, 0.1, 0.075, 0.05, 0.025];
    const leagueId = 'BBB-hof-playoffs'; 
    const baseURL = "https://sbs-drafts-api-w5wydprnbq-uc.a.run.app";
    const path = `${baseURL}/league/0x2f9c2123652cff3717fbd8edb1b256f16e9e4b80/drafts/${leagueId}/leaderboard/ScoreWeek/gameweek/2023REG-17`
    const res = await axios.get(path)
    const rankedCardIds = ['990', '1105', '1264', '679', '887', '89', '672'];

    // const leaderboard = res.data.leaderboard;
    // console.log(leaderboard.length)
    // for(let i = 0; i < leaderboard.length; i++) {
    //     const cardId = leaderboard[i]._cardId;
    //     rankedCardIds.push(cardId)
    // }

    for(let i = 0; i < rankedCardIds.length; i++) {
        const cardId = rankedCardIds[i];
        console.log(cardId)
        const card = await db.readDocument('draftTokens', cardId);
        card.Prizes.ETH = parseFloat((card.Prizes.ETH + prizeArray[i]).toFixed(4))
        await db.createOrUpdateDocument('draftTokens', cardId, card, false)
        await db.createOrUpdateDocument(`owners/${card.OwnerId}/usedDraftTokens`, cardId, card, false)
        await db.createOrUpdateDocument(`draftTokenLeaderboard/2023REG-17/cards`, cardId, { Card: card }, true)
        console.log(`Paid out ${cardId} ${prizeArray[i]} ETH to make a total of ${card.Prizes.ETH}`)
    }
}




(async () => {
    await payoutProFinalLeague()
    console.log('paid out Pro playoff BBB league')
    await getHOFPlayoffsCummulativeScore()
    console.log('Paid out HOF playoff BBB league')
})()