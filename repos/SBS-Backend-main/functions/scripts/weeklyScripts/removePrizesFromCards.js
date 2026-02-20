const { v4: uuidv4 } = require('uuid');
const db = require('../../services/db');
const axios = require('axios');

// CHANGE THIS EVERY WEEK. THIS SHOULD BE THE WEEK THAT JUST FINISHED
const WEEK_TO_CLOSE_OUT = "2024REG-14"


// WILL NEED TO UPDATE THIS PRIZE ARRAY TO MATCH THE NEW REWARDS ONCE THAT IS FINALIZED
const prizeArray = [0.040, 0.020, 0.015, 0.01];
const cardIds = [106, 1606, 1642, 4025]
// TIE FOR 2ND
// const prizeArray = [0.100, 0.030, 0.030, 0.015, 0.01];
const RemovePrizesFromCards = async (gameweek) => {
    // will need to update this depending on how many cards they want to pay out
    for(let i = 0; i < 4; i++) {
        const obj = await db.readDocument(`draftTokenLeaderboard/${gameweek}/cards`, String(cardIds[i]))
        const cardId = obj.Card.CardId;
        const card = await db.readDocument("draftTokens", cardId)
        if (!card) {
            throw('NO card for ', cardId)
        }
        card.Prizes.ETH = parseFloat((card.Prizes.ETH - prizeArray[i]).toFixed(4))
        console.log(`New balance ${cardId}: ${card.Prizes.ETH}`)

        if (card.Prizes.ETH < 0) {
            throw Error(`Not enough balance ${cardId}: ${card.Prizes.ETH}`)
        }

        console.log(`Removed ${prizeArray[i]} ETH from Card ${cardId}`)
        await db.createOrUpdateDocument('draftTokens', cardId, card, false)
        await db.createOrUpdateDocument(`drafts/${card.LeagueId}/cards`, cardId, card, false)
        await db.createOrUpdateDocument(`owners/${card.OwnerId}/usedDraftTokens`, cardId, card, false)
        
        obj.Card = card;

        await db.createOrUpdateDocument(`draftTokenLeaderboard/${gameweek}/cards`, cardId, obj, false)
        await db.createOrUpdateDocument(`drafts/${card.LeagueId}/scores/${gameweek}/cards`, cardId, obj, false)
        console.log("Updated card to reflect prizes in all draft token locations and leaderboards for Card ", cardId)
        
        // const id = 'BBB-prize-' + uuidv4()
        // const tx = {
        //     Id: id,
        //     Gameweek: gameweek,
        //     ScoreObj: obj,
        //     Prize: {
        //         Place: i + 1,
        //         Prize: prizeArray[i],
        //         Coin: "ETH"
        //     }
        // }

        // await db.createOrUpdateDocument(`draftTokens/${cardId}/transactions`, id, tx, false)
        // await db.createOrUpdateDocument(`owners/${card.OwnerId}/transactions`, id, tx, false)
        // console.log('Created transaction for this prize with id: ', id)
    }
} 

(async () => {
    await RemovePrizesFromCards(WEEK_TO_CLOSE_OUT)
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

