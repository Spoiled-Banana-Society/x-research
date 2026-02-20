const { v4: uuidv4 } = require('uuid');
const db = require('../../services/db');
const axios = require('axios');

// CHANGE THIS EVERY WEEK. THIS SHOULD BE THE WEEK THAT JUST FINISHED
const WEEK_TO_CLOSE_OUT = "2025REG-08"


// WILL NEED TO UPDATE THIS PRIZE ARRAY TO MATCH THE NEW REWARDS ONCE THAT IS FINALIZED
// const prizeArray = [0.100, 0.040, 0.020, 0.015, 0.01];
// TIE FOR 2ND
const prizeArray = [0.103, 0.040, 0.021, 0.015, 0.011];
const AddOverallPrizesForDraftTokens = async (leaderboard, gameweek) => {
    // will need to update this depending on how many cards they want to pay out
    for(let i = 0; i < 5; i++) {
        const obj = leaderboard[i];
        const cardId = obj.Card.CardId;
        const card = await db.readDocument("draftTokens", cardId)
        if (!card) {
            throw('NO card for ', cardId)
        }
        card.Prizes.ETH = parseFloat((card.Prizes.ETH + prizeArray[i]).toFixed(4))

        console.log(`Added ${prizeArray[i]} ETH to Card ${cardId} for finishing this week ${i + 1} overall`)
        await db.createOrUpdateDocument('draftTokens', cardId, card, false)
        await db.createOrUpdateDocument(`drafts/${card.LeagueId}/cards`, cardId, card, false)
        await db.createOrUpdateDocument(`owners/${card.OwnerId}/usedDraftTokens`, cardId, card, false)
        
        obj.Card = card;

        await db.createOrUpdateDocument(`draftTokenLeaderboard/${gameweek}/cards`, cardId, obj, false)
        await db.createOrUpdateDocument(`drafts/${card.LeagueId}/scores/${gameweek}/cards`, cardId, obj, false)
        console.log("Updated card to reflect prizes in all draft token locations and leaderboards for Card ", cardId)
        
        const id = 'BBB-prize-' + uuidv4()
        const tx = {
            Id: id,
            Gameweek: gameweek,
            ScoreObj: obj,
            Prize: {
                Place: i + 1,
                Prize: prizeArray[i],
                Coin: "ETH"
            }
        }

        await db.createOrUpdateDocument(`draftTokens/${cardId}/transactions`, id, tx, false)
        await db.createOrUpdateDocument(`owners/${card.OwnerId}/transactions`, id, tx, false)
        console.log('Created transaction for this prize with id: ', id)
    }
} 

const AddOverallPrizesForDraftTokensSetIds = async (gameweek) => {
    const CARD_IDS = [1700, 3437, 1554, 158, 1875]
    // will need to update this depending on how many cards they want to pay out
    for(let i = 0; i < 5; i++) {
        const obj = await db.readDocument(`draftTokenLeaderboard/${gameweek}/cards`, String(CARD_IDS[i]))
        const cardId = obj.Card.CardId;
        const card = await db.readDocument("draftTokens", cardId)
        if (!card) {
            throw('NO card for ', cardId)
        }
        card.Prizes.ETH = parseFloat((card.Prizes.ETH + prizeArray[i]).toFixed(4))

        console.log(`Added ${prizeArray[i]} ETH to Card ${cardId} for finishing this week ${i + 1} overall`)
        await db.createOrUpdateDocument('draftTokens', cardId, card, false)
        await db.createOrUpdateDocument(`drafts/${card.LeagueId}/cards`, cardId, card, false)
        await db.createOrUpdateDocument(`owners/${card.OwnerId}/usedDraftTokens`, cardId, card, false)
        
        obj.Card = card;

        await db.createOrUpdateDocument(`draftTokenLeaderboard/${gameweek}/cards`, cardId, obj, false)
        await db.createOrUpdateDocument(`drafts/${card.LeagueId}/scores/${gameweek}/cards`, cardId, obj, false)
        console.log("Updated card to reflect prizes in all draft token locations and leaderboards for Card ", cardId)
        
        const id = 'BBB-prize-' + uuidv4()
        const tx = {
            Id: id,
            Gameweek: gameweek,
            ScoreObj: obj,
            Prize: {
                Place: i + 1,
                Prize: prizeArray[i],
                Coin: "ETH"
            }
        }

        await db.createOrUpdateDocument(`draftTokens/${cardId}/transactions`, id, tx, false)
        await db.createOrUpdateDocument(`owners/${card.OwnerId}/transactions`, id, tx, false)
        console.log('Created transaction for this prize with id: ', id)
    }
} 


const GetOverallWeeklyLeaderboard = async (gameweek) => {
    let leaderboard;
    try {
        let result = await db._db.collection(`draftTokenLeaderboard/${gameweek}/cards`).orderBy("ScoreWeek", "desc").get()
        leaderboard = db._returnDocuments(result)
    } catch(err) {
        console.log(err)
    } 


    //console.log(leaderboard)
    return leaderboard
}

(async () => {
    const leaderboard = await GetOverallWeeklyLeaderboard(WEEK_TO_CLOSE_OUT);
    await AddOverallPrizesForDraftTokens(leaderboard, WEEK_TO_CLOSE_OUT)
    // await AddOverallPrizesForDraftTokensSetIds(WEEK_TO_CLOSE_OUT)
})()

// IF YOU WANT TO 
// (async () => {
//     const dataEndpoint = `https://sbs-cloud-functions-api-671861674743.us-central1.run.app/scoreDraftTokens`;
//     let result;

//     let scores = await db.readDocument("scores", WEEK_TO_CLOSE_OUT)

//     const body = {
//         scores: scores.FantasyPoints,
//         gameWeek: WEEK_TO_CLOSE_OUT,
//     }

//     let data = JSON.stringify(body);
//     //data = JSON.parse(data)

//     try {
//         console.log("calling scoring endpoint now")
//         let res = await axios.post(dataEndpoint, body)
//         result = res.json()
//     } catch (err) {
//         console.log(err)
//     }
// })()

