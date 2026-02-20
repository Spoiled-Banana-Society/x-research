//PACKAGES
require("firebase-functions/lib/logger/compat")
const express = require("express");
const cardRouter = express.Router();
const { v4: uuidv4 } = require('uuid');


//SERVICES
const db = require("../services/db");
const playoffCardContract = require('../services/playoffCardContract');
const sbs = require('../services/sbs');

cardRouter.get("/", (req, res) => {
    res.send("...🃏 base card route")
})

cardRouter.get("/:id", async (req, res) => {
    const cardId = req.params.id
    if (!cardId) return res.status(400).send("Missing card id")
    const card = await db.readDocument("playoffCards", cardId)
    if (card._ownerId === "unassigned") return res.status(404).send(`CardId:${cardId} is not minted or does not exist`)
    res.send(card)
})

cardRouter.get("/:id/gameWeek/:gameWeek", async (req, res) => {
    const cardId = req.params.id
    const gameWeek = req.params.gameWeek || sbs.getNFLWeekV2()
    if (!cardId) return res.status(400).send("Missing card id")
    if (!gameWeek) return res.status(400).send("Missing game week")

    const card = await db.readDocument("playoffCards", cardId)

    if (card._ownerId === null) return res.status(404).send(`CardId:${cardId} is not minted or does not exist`)
    const level = card._level

    let leaderboard

    if (level === "Hall of Fame") {
        leaderboard = await db.getPlayoffLeaderboardV2(gameWeek, "scoreSeason", "Hall of Fame")
    } 

    // Pro needs to be done for every card
    let proLeaderboard = await db.getPlayoffLeaderboardV2(gameWeek, "scoreSeason", "Pro")

    const ranker = (leaderboard) => {
        // rank document
        for (let i = 0; i < leaderboard.length; i++) {
            leaderboard[i].rank = i + 1
        }
        return leaderboard
    }

    const getCardInfo = (leaderboard, queriedCardId) => {
        // filter owners
        const cardInfo = leaderboard.filter((card) => card.card._cardId === queriedCardId)
        return cardInfo
    }

    if (leaderboard) {
        ranker(leaderboard)
        ranker(proLeaderboard)
        const levelCardInfo = getCardInfo(leaderboard, cardId)
        const proCardInfo = getCardInfo(proLeaderboard, cardId)
        let results = {
            card,
            gameWeek,
            levelCardInfo,
            proCardInfo,
        }
        return res.status(200).send(results)
    } else {
        ranker(proLeaderboard)
        const proCardInfo = getCardInfo(proLeaderboard, cardId)
        let results = {
            card,
            gameWeek,
            proCardInfo,
        }
        return res.status(200).send(results)
    }
})

cardRouter.post("/prizeTransfer", async (req, res) => {
    const tpo = req.body;
    console.log(tpo)
    //CHECK request body
    if(!tpo.cardId) return res.status(400).send('...Missing cardId from transferPrizeObject');
    tpo.cardId = tpo.cardId.toString();
    
    if(!tpo.ownerId) return res.status(400).send('...Missing ownerId from transferPrizeObject');
    tpo.ownerId = tpo.ownerId.toLowerCase();
    
    if(!tpo.prizeCoin) return res.status(400).send('...Missing prizeCoin from transferPrizeObject');
    tpo.prizeCoin = tpo.prizeCoin.toLowerCase();

    if(!tpo.prizeTransferAmount) return res.status(400).send('...Missing prizeTransferAmount from transferPrizeObject');
    tpo.prizeTransferAmount = parseFloat(tpo.prizeTransferAmount);
    if(tpo.prizeTransferAmount < 0) return res.status(400).send('...prizeTransferAmount cannot be a negative number');

// NEED TO UPDATE THIS WHEN I CAN MAKE A CARD CONTRACT SERVICE FOR PLAYOFF CARDS
    //CHECK card ownership
    if(Number(tpo.cardId) >= 10000) {
        const ownerId = await playoffCardContract.getOwnerByCardId(tpo.cardId);
        if(tpo.ownerId != ownerId) return res.status(400).send(`...owner:${tpo.ownerId} does not own ${tpo.cardId}`);
    }
    //CHECK prize request is valid
    const card = await db.readDocument('playoffCards', tpo.cardId);
    if(!card.prizes[tpo.prizeCoin]) return res.status(400).send(`...prizeCoin:${tpo.prizeCoin} does not exist on this card`);
    if(card.prizes[tpo.prizeCoin] < tpo.prizeTransferAmount) return res.status(400).send(`...prizeTransferAmount:${tpo.prizeTransferAmount} exceeds prize amount:${card.prizes[tpo.prizeCoin]} available to transfer on card:${tpo.cardId}`);
    
    //TRANSFER
    const prizePrevCardAmount = card.prizes[tpo.prizeCoin];
    const prizeNewCardAmount = parseFloat(parseFloat(prizePrevCardAmount - tpo.prizeTransferAmount).toFixed(4));

    const owner = await db.readDocument('owners', tpo.ownerId);


    let ownerPrevAvailableCredit;
    if(tpo.prizeCoin === 'eth'){
        ownerPrevAvailableCredit = owner.availableEthCredit != undefined ? owner.availableEthCredit : 0;     
    } else {
        ownerPrevAvailableCredit = owner.availableCredit != undefined ? owner.availableCredit : 0;
    }
    const ownerNewAvailableCredit = parseFloat(parseFloat(ownerPrevAvailableCredit + tpo.prizeTransferAmount).toFixed(4));     
    
    //TRANSACTION
    const prizeTransferTx = {
        id: uuidv4(),
        cardId: tpo.cardId,
        ownerId: tpo.ownerId,
        type: 'playoffCard-prizeTransfer',
        createdAt: db._getTimeStamp(),
        txData: {
            gameWeek: sbs.getNFLWeekV2(),
            prizePrevCardAmount,
            prizeNewCardAmount,
            transferAmount: tpo.prizeTransferAmount,
            transferCoin: tpo.prizeCoin,
            ownerPrevAvailableCredit, 
            ownerNewAvailableCredit,
        }
    }
    
    const availableCreditObject = (tpo.prizeCoin === 'eth') ? {availableEthCredit: ownerNewAvailableCredit} : {availableCredit: ownerNewAvailableCredit};
    await db.createOrUpdateDocument('transactions', prizeTransferTx.id, prizeTransferTx, false);
    await db.createOrUpdateDocument(`playoffCards/${tpo.cardId}/transactions`, prizeTransferTx.id, prizeTransferTx, false);
    await db.createOrUpdateDocument(`owners/${tpo.ownerId}/transactions`, prizeTransferTx.id, prizeTransferTx, false);
    await db.createOrUpdateDocument('playoffCards', tpo.cardId, {prizes:{[tpo.prizeCoin]: prizeNewCardAmount}}, true);
    await db.createOrUpdateDocument('owners', tpo.ownerId, availableCreditObject, true);

    res.status(201).send(prizeTransferTx);
});

module.exports = cardRouter
