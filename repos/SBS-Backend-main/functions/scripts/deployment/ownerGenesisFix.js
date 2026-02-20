//✍️ STEP: 1  FILL OUT THE SCRIPT TEMPLATE BELOW

/* DESCRIPTION START:
========================

    📝 General Description:

    As I was troubleshooting, I realized we had a major issue in that not all owners were not showin in the genesis league inside the owner object. 
    If an owner has  cards, they should be in the genesis league.  This reference in the owner object must be correct as its the only way 
    we can find the cards an owner has to know what to update in a peel and mash situation that is already entered into a league. 

    👣 Deployment Steps: node ownerGenesisFix.js

    🔗 TaskLink: Trello Link Here

    📅 Date Run in sbs-fantasy-dev: 9/6/2022

    📅 Date Run in sbs-fantasy-prod:

========================
DESCRIPTION END */

//🗃️ STEP 2: Add needed Dependencies

const SCRIPT_NAME = "Owner Genesis Fix" //required

//Packages

//services
const db = require("../../services/db")
const cardContract = require("../../services/cardContract")
const utils = require("../../services/utils")
const sbs = require("../../services/sbs")

//🚀 STEP 3: Write the script.  Include tests for validation where possible
const ownerGenesisFix = async () => {
    let ownerId
    const maxTokenId = parseInt(await cardContract.numTokensMinted())
    for (let i = 0; i < maxTokenId; i++) {
        const cardId = `${i}`
        console.log(`...🃏   updating cardId:${cardId}`)
        ownerId = await cardContract.getOwnerByCardId(cardId)
        const owner = (await db.readDocument("owners", ownerId)) || {}
        const genesisLeagueObject = {
            cardId: cardId,
            leagueId: "genesis",
        }

        owner.league = owner.league || []
        if (!owner.Leagues) {
            owner.Leagues = []
        }

        const isGenesisLeagueIncluded = await owner.Leagues.find((league) => league.leagueId === "genesis" && league.cardId === cardId)
        if (!isGenesisLeagueIncluded) {
            owner.Leagues.push(genesisLeagueObject)
            console.log(`...➕   Add genesis league for owner of cardId:${cardId}`)
        }

        const newOwnerObject = owner
        await db.createOrUpdateDocument(`owners`, ownerId, newOwnerObject, true)
        console.log(`...🔥   OwnerId:${ownerId} updated`)
    }
}

const updateCardsInLeagues = async () => {
    //grab all leagueIds
    const leaugeIds = await db.readAllDocumentIds("leagues")

    //iterate through each leagues cards.
    for (let i = 0; i < leaugeIds.length; i++) {
        const leagueId = leaugeIds[i]
        if (!leagueId) continue
        const league = await db.readDocument("leagues", leagueId)
        const cardsPlayingInLeague = await db.readAllDocumentIds(`leagues/${leagueId}/cards`)
        for (let j = 0; j < cardsPlayingInLeague.length; j++) {
            const cardId = cardsPlayingInLeague[j]
            if (!cardId) continue
            const prevCard = await db.readDocument(`leagues/${leagueId}/cards`, cardId)
            const currentCard = await db.readDocument("cards", cardId)
            if (prevCard._teamHash != currentCard._teamHash) {
                currentCard.joinedAt = prevCard.joinedAt || db._getTimeStamp()
                currentCard.isLocked = prevCard.isLocked || false
                await db.createOrUpdateDocument(`leagues/${leagueId}/cards`, cardId, currentCard, true)
                console.log(`...🃏   Update card:${cardId} for league:${leagueId}`)
                const defaultLineup = utils.getDefaultLineup(currentCard)
                await utils.setDefaultLineupInLeague(defaultLineup, league, sbs.getNFLWeekV2())
            } else {
                console.log(`...✅   card:${cardId} in league:${leagueId} is valid`)
            }
        }
    }

    //update card data from cards object in place.
}

const newLeagueWeek = async () => {
    //grab all leagueIds
    const leaugeIds = await db.readAllDocumentIds("leagues")

    const getPreviousWeek = () => {
        switch (sbs.getNFLWeekV2()) {
            case "2022-REG-02":
                return "2022-REG-01"
            case "2022-REG-03":
                return "2022-REG-02"
            case "2022-REG-04":
                return "2022-REG-03"
            case "2022-REG-05":
                return "2022-REG-04"
            case "2022-REG-06":
                return "2022-REG-05"
            case "2022-REG-07":
                return "2022-REG-06"
            case "2022-REG-08":
                return "2022-REG-07"
            case "2022-REG-09":
                return "2022-REG-08"
            case "2022-REG-10":
                return "2022-REG-09"
            case "2022-REG-11":
                return "2022-REG-10"
            case "2022-REG-12":
                return "2022-REG-11"
            case "2022-REG-13":
                return "2022-REG-12"
            case "2022-REG-14":
                return "2022-REG-13"
            case "2022-REG-15":
                return "2022-REG-14"
            case "2022-REG-16":
                return "2022-REG-15"
            case "2022-REG-17":
                return "2022-REG-16"
        }
    }

    //iterate through each leagues cards.
    for (let i = 0; i < leaugeIds.length; i++) {
        const leagueId = leaugeIds[i]
        if (!leagueId) continue
        const league = await db.readDocument("leagues", leagueId)
        const cardsPlayingInLeague = await db.readAllDocumentIds(`leagues/${leagueId}/cards`)
        for (let j = 0; j < cardsPlayingInLeague.length; j++) {
            const cardId = cardsPlayingInLeague[j]
            if (!cardId) continue
            const prevCard = await db.readDocument(`leagues/${leagueId}/cards`, cardId)
            const currentCard = await db.readDocument("cards", cardId)

            currentCard.joinedAt = prevCard.joinedAt || db._getTimeStamp()
            currentCard.isLocked = prevCard.isLocked || false
            await db.createOrUpdateDocument(`leagues/${leagueId}/cards`, cardId, currentCard, true)
            console.log(`...🃏   Update card:${cardId} for league:${leagueId}`)

            const getPreviousWeekData = await db.readDocument(`leagues/${leagueId}/cards/${cardId}/lineups`, getPreviousWeek)
            const previousLineup = utils.getPreviousLineup(currentCard, getPreviousWeekData)
            // const defaultLineup = utils.getDefaultLineup(currentCard);
            await utils.setDefaultLineupInLeague(previousLineup, league, sbs.getNFLWeekV2())
        }
    }
    // NEED TO TEST BEFORE DEPLOYING TO PROD!
    //update card data from cards object in place.
}

;(async () => {
    console.log(`...📝   START:${SCRIPT_NAME}`)

    // await ownerGenesisFix();
    // await updateCardsInLeagues();
    await newLeagueWeek()

    console.log(`...📝   END:${SCRIPT_NAME}`)
    process.exit(0)
})()