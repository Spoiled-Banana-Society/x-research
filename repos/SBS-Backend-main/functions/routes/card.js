//PACKAGES
require("firebase-functions/lib/logger/compat")
const express = require("express");
const cardRouter = express.Router();
const { v4: uuidv4 } = require('uuid');


//SERVICES
const db = require("../services/db");
const cardContract = require('../services/cardContract');
const sbs = require('../services/sbs');

cardRouter.get("/", (req, res) => {
    res.send("...🃏 base card route")
})

cardRouter.get("/:id", async (req, res) => {
    const cardId = req.params.id
    if (!cardId) return res.status(400).send("Missing card id")
    const card = await db.readDocument("cards", cardId)
    if (card._ownerId === "unassigned") return res.status(404).send(`CardId:${cardId} is not minted or does not exist`)
    res.send(card)
})

cardRouter.get("/:id/gameWeek/:gameWeek", async (req, res) => {
    const cardId = req.params.id
    const gameWeek = req.params.gameWeek || sbs.getNFLWeekV2()
    if (!cardId) return res.status(400).send("Missing card id")
    if (!gameWeek) return res.status(400).send("Missing game week")

    const card = await db.readDocument("cards", cardId)

    if (card._ownerId === "unassigned") return res.status(404).send(`CardId:${cardId} is not minted or does not exist`)
    const level = card._level

    let leaderboard

    if (level === "Hall of Fame") {
        let hof = await db.getLeaderboardV2(gameWeek, "scoreSeason", "Hall of Fame")
        let shof = await db.getLeaderboardV2(gameWeek, "scoreSeason", "Spoiled Hall of Fame")
        leaderboard = [...hof, ...shof]
        leaderboard.sort((a, b) => a.scoreSeason - b.scoreSeason).reverse()
    } else if (level === "Spoiled Pro") {
        let spoiled = await db.getLeaderboardV2(gameWeek, "scoreSeason", "Spoiled Pro")
        let shof = await db.getLeaderboardV2(gameWeek, "scoreSeason", "Spoiled Hall of Fame")
        leaderboard = [...spoiled, ...shof]
        leaderboard.sort((a, b) => a.scoreSeason - b.scoreSeason).reverse()
    }

    // Pro needs to be done for every card
    let proLeaderboard = await db.getLeaderboardV2(gameWeek, "scoreSeason", "Pro")

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
        res.send(results)
    } else {
        ranker(proLeaderboard)
        const proCardInfo = getCardInfo(proLeaderboard, cardId)
        let results = {
            card,
            gameWeek,
            proCardInfo,
        }
        res.send(results)
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


    //CHECK card ownership
    const ownerId = await cardContract.getOwnerByCardId(tpo.cardId);
    if(tpo.ownerId != ownerId) return res.status(400).send(`...owner:${tpo.ownerId} does not own ${tpo.cardId}`);

    //CHECK prize request is valid
    const card = await db.readDocument('cards', tpo.cardId);
    if(!card.prizes[tpo.prizeCoin]) return res.status(400).send(`...prizeCoin:${tpo.prizeCoin} does not exist on this card`);
    if(card.prizes[tpo.prizeCoin] < tpo.prizeTransferAmount) return res.status(400).send(`...prizeTransferAmount:${tpo.prizeTransferAmount} exceeds prize amount:${card.prizes[tpo.prizeCoin]} available to transfer on card:${tpo.cardId}`);
    
    //TRANSFER
    const prizePrevCardAmount = card.prizes[tpo.prizeCoin];
    const prizeNewCardAmount = parseFloat(parseFloat(prizePrevCardAmount - tpo.prizeTransferAmount).toFixed(4));

    const owner = await db.readDocument('owners', tpo.ownerId);


    let ownerPrevAvailableCredit;
    if(tpo.prizeCoin === 'eth'){
        ownerPrevAvailableCredit = owner.AvailableEthCredit != undefined ? owner.AvailableEthCredit : 0;     
    } else {
        ownerPrevAvailableCredit = owner.AvailableCredit != undefined ? owner.AvailableCredit : 0;
    }
    const ownerNewAvailableCredit = parseFloat(parseFloat(ownerPrevAvailableCredit + tpo.prizeTransferAmount).toFixed(4));     
    
    //TRANSACTION
    const prizeTransferTx = {
        id: uuidv4(),
        cardId: tpo.cardId,
        ownerId: tpo.ownerId,
        type: 'prizeTransfer',
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
    
    const availableCreditObject = (tpo.prizeCoin === 'eth') ? {AvailableEthCredit: ownerNewAvailableCredit} : {AvailableCredit: ownerNewAvailableCredit};
    await db.createOrUpdateDocument('transactions', prizeTransferTx.id, prizeTransferTx, false);
    await db.createOrUpdateDocument(`cards/${tpo.cardId}/transactions`, prizeTransferTx.id, prizeTransferTx, false);
    await db.createOrUpdateDocument(`owners/${tpo.ownerId}/transactions`, prizeTransferTx.id, prizeTransferTx, false);
    await db.createOrUpdateDocument('cards', tpo.cardId, {prizes:{[tpo.prizeCoin]: prizeNewCardAmount}}, true);
    await db.createOrUpdateDocument('owners', tpo.ownerId, availableCreditObject, true);

    res.status(201).send(prizeTransferTx);
});

module.exports = cardRouter
