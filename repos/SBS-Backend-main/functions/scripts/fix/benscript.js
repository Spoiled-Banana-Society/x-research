/* DESCRIPTION START:
========================

📝 General Description: node benscript.js

========================
DESCRIPTION END */

//🗃️ STEP 2: Add needed Dependencies

const SCRIPT_NAME = "Utility script" //required

//SERVICES
const db = require("../../services/db")
const TX = require("../../services/tx")
const sbs = require("../../services/sbs")
const { v4: uuidv4 } = require("uuid")
const slugify = require("slugify")

//🚀 STEP 3: Write the script.

// check to see who was paid out
const seePrizedUsers = async () => {
    for (let i = 9500; i < 10000; i++) {
        const card = [i].toString()
        const transactions = await db.readAllDocumentIds(`/cards/${card}/transactions`)
        if (transactions) {
            for (let x = 0; x < transactions.length; x++) {
                const transaction = await db.readDocument(`/cards/${card}/transactions`, transactions[x])
                if (transaction && transaction.winner) {
                    console.log(
                        `🍌 ${transaction.createdAt}: (${
                            transaction.winner.owner ?? transaction.winner.ownerId
                        }) Card ${card} was paid ${transaction.winner.coin ?? transaction.winner.prize.type} ${
                            transaction.winner.paid ?? transaction.winner.prize.prize
                        }`
                    )
                }
            }
        }
    }
}

// check to see if a card is participating in a league
const checkLeaguesCardIsIn = async () => {
    const queriedCard = "1679"
    const leagues = await db.readAllDocumentIds("/leagues")
    for (let league in leagues) {
        const cards = await db.readAllDocumentIds(`/leagues/${leagues[league]}/cards`)
        for (let card in cards) {
            if (cards[card] === queriedCard) {
                const queriedLeague = await db.readDocument(`/leagues`, leagues[league])
                console.log(`${queriedCard} participated in ${queriedLeague.id}`)
            }
        }
    }
}

// check to see who transferred winnings
const seePrizeTransfers = async () => {
    for (let i = 0; i < 10_000; i++) {
        const card = [i].toString()
        const transactions = await db.readAllDocumentIds(`/cards/${card}/transactions`)
        if (transactions) {
            for (let x = 0; x < transactions.length; x++) {
                const transaction = await db.readDocument(`/cards/${card}/transactions`, transactions[x])
                if (transaction.createdAt !== undefined && transaction.createdAt.includes("2022-09-29")) {
                    if (transaction.txData && transaction.txData.transferAmount) {
                        console.log(
                            `🍌 Card ${transaction.cardId} transferred ${
                                transaction.txData.transferAmount + " " + transaction.txData.transferCoin
                            }`
                        )
                    }
                }
            }
        }
    }
}

// do manual lineup setup for a specific league
const manualLineup = async () => {
    const cardNumber = "6529"
    const gameWeek = "2022-REG-04"
    const card = await db.readDocument("cards", cardNumber)
    const leagueName = "genesis"
    let currentLineup = await db.createOrUpdateDocument(`leagues/${leagueName}/cards/${cardNumber}/lineups/`, gameWeek)
    console.log(`🃏 ${cardNumber} current roster:`)
    console.log("QB: ", card.QB[0], card.QB[1])
    console.log("RB: ", card.RB[0], card.RB[1], card.RB[2], card.RB[3])
    console.log("WR: ", card.WR[0], card.WR[1], card.WR[2], card.WR[3], card.WR[4])
    console.log("TE: ", card.TE[0], card.TE[1])
    console.log("DT: ", card.DST[0], card.DST[1])

    currentLineup.starting = {
        QB: ["DAL"],
        RB: ["DAL", "HOU"],
        WR: ["CLE", "DAL", "HOU"],
        TE: ["NYG"],
        DST: ["LAR"],
    }

    currentLineup.bench = {
        QB: ["NYJ"],
        RB: ["IND", "LAC"],
        WR: ["JAX", "KC"],
        TE: ["WAS"],
        DST: ["MIA"],
    }

    //💀 comment back in during prod
    //await db.createOrUpdateDocument(`leagues/${leagueName}/cards/${cardNumber}/lineups/`, gameWeek, currentLineup, true)
}

// manual withdraw for wallet address
const manualWithdraw = async () => {
    // necessary variables. double check them all
    const ownerId = "0x70b450e3bfdf5899e397e864b6ffb6ee534ab13e".toLowerCase()
    const amount = 80
    const type = "ape" //ape or eth
    const ticketNo = "N/A"

    if (!ownerId) return console.log(`💩 OwnerId ${ownerAccount} does not exist.`)

    const selectedOwner = await db.readDocument("owners/", ownerId)
    if (!selectedOwner) return console.log(`💩 Selected owner does not exist.`)

    const withdrawEth = async (ownerId, selectedOwner, amount, type) => {
        if (!selectedOwner.availableEthCredit)
            return console.log(`💩 Balance of ${type} is at 0 or undefined. ETH: ${selectedOwner.availableEthCredit}`)
        if (selectedOwner.availableEthCredit < amount)
            return console.log(
                `💩 Requested amount: ${amount} is lower than actual balance: ${ownerAccount.availableEthCredit}`
            )

        const prevAmount = selectedOwner.availableEthCredit

        selectedOwner.availableEthCredit = selectedOwner.availableEthCredit - amount
        await db.createOrUpdateDocument(`owners/`, ownerId, selectedOwner)

        let txData = {
            ownerId,
            meta: {
                timestamp: new Date().toLocaleString("en-us", { timeZone: "America/New_York" }) + " EST",
                transactedDuring: sbs.getNFLWeekV2(),
                ticketNo,
            },
            transaction: {
                prevAmount,
                newAmount: selectedOwner.availableEthCredit,
                amountTransacted: amount,
                coinType: type,
            },
        }
        const identifier = `script-withdrawal-${type}-${
            new Date().toLocaleString("en-us", { timeZone: "America/New_York" }) + " EST"
        }-${uuidv4()}`
        await db.createOrUpdateDocument(`owners/${ownerId}/transactions`, slugify(identifier), txData, false)
        console.log(`${amount} ${type} successfully withdrawn from ${ownerId}.`)
    }

    const withdrawApe = async (ownerId, selectedOwner, amount, type) => {
        if (!selectedOwner.availableCredit)
            return console.log(`💩 Balance of ${type} is at 0 or undefined. ETH: ${selectedOwner.availableCredit}`)
        if (selectedOwner.availableCredit < amount)
            return console.log(
                `💩 Requested amount: ${amount} is lower than actual balance: ${ownerAccount.availableCredit}`
            )

        const prevAmount = selectedOwner.availableCredit

        selectedOwner.availableCredit = selectedOwner.availableCredit - amount
        await db.createOrUpdateDocument(`owners/`, ownerId, selectedOwner)

        let txData = {
            ownerId,
            meta: {
                timestamp: new Date().toLocaleString("en-us", { timeZone: "America/New_York" }) + " EST",
                transactedDuring: sbs.getNFLWeekV2(),
                ticketNo,
            },
            transaction: {
                prevAmount,
                newAmount: selectedOwner.availableCredit,
                amountTransacted: amount,
                coinType: type,
            },
        }
        const identifier = `script-withdrawal-${type}-${
            new Date().toLocaleString("en-us", { timeZone: "America/New_York" }) + " EST"
        }-${uuidv4()}`
        await db.createOrUpdateDocument(`owners/${ownerId}/transactions`, slugify(identifier), txData, false)
        console.log(`${amount} ${type} successfully withdrawn from ${ownerId}.`)
    }

    //💀 comment back in during prod
    type === "eth"
        ? await withdrawEth(ownerId, selectedOwner, amount, type)
        : await withdrawApe(ownerId, selectedOwner, amount, type)
}

// assign correct gameweek for leagues
const assignCorrectGameWeeks = async () => {
    const gameWeek = "2022-REG-06"
    const league = "genesis"
    for (let i = 0; i < 10_000; i++) {
        if (i === 2500) console.log("📣 2500 mark")
        if (i === 5000) console.log("📣 5000 mark")
        if (i === 7500) console.log("📣 7500 mark")
        if (i === 9000) console.log("📣 9000 mark")
        const card = i.toString()
        const lineup = await db.readDocument(`leagues/${league}/cards/${card}/lineups`, gameWeek)
        if (lineup.gameWeek) {
            if (lineup.gameWeek !== gameWeek) {
                try {
                    lineup.gameWeek = gameWeek
                    await db.createOrUpdateDocument(`leagues/${league}/cards/${card}/lineups`, gameWeek, lineup)
                    console.log(`🍌 Updated gameweek for Card ${card}`)
                } catch (error) {
                    console.log(`💩 Failed updating for Card ${card}`)
                }
            }
        } else {
            try {
                lineup.gameWeek = gameWeek
                //await db.createOrUpdateDocument(`leagues/${league}/cards/${card}/lineups`, gameWeek, lineup)
                console.log(`⛔ Gameweek did not exist for Card ${card}, so one was created and assigned`)
            } catch (error) {
                console.log(`⛔ Gameweek did not exist and could not create one for Card ${card}`)
            }
        }
    }
}

// assign scoreSeason and scoreWeek for genesis league
const assignScoresGenesis = async () => {
    const gameWeek = "2022-REG-06"
    const prevWeek = "2022-REG-05"
    const league = "genesis"
    for (let i = 0; i < 10_000; i++) {
        if (i === 2500) console.log("📣 2500 mark")
        if (i === 5000) console.log("📣 5000 mark")
        if (i === 7500) console.log("📣 7500 mark")
        if (i === 9000) console.log("📣 9000 mark")
        const card = i.toString()
        const lineup = await db.readDocument(`leagues/${league}/cards/${card}/lineups`, gameWeek)
        if (lineup.scoreWeek === null || lineup.scoreWeek === undefined) {
            lineup.scoreWeek = 0
            await db.createOrUpdateDocument(`leagues/${league}/cards/${card}/lineups`, gameWeek, lineup)
            console.log(`⛔ scoreWeek did not exist for Card ${card}, so one was created and assigned`)
        }
        if (!lineup.scoreSeason || lineup.scoreSeason === 0) {
            const lastWeekLineup = await db.readDocument(`leagues/${league}/cards/${card}/lineups`, prevWeek)
            lineup.scoreSeason = lastWeekLineup.scoreSeason
            await db.createOrUpdateDocument(`leagues/${league}/cards/${card}/lineups`, gameWeek, lineup)
            console.log(`⚽ scoreSeason was incorrect for ${card}, so it was copied from ${prevWeek}`)
        }
    }
}

const assignCustomLeagueValues = async () => {
    const gameWeek = "2022-REG-06"
    const prevWeek = "2022-REG-05"
    const leagueIds = await db.readAllDocumentIds("leagues")
    for (let x = 0; x < leagueIds.length; x++) {
        const league = leagueIds[x]
        if (league === "genesis") return console.log("Finished looping custom leagues.")
        const selectedLeague = await db.readDocument("leagues", league)
        if (new Date(selectedLeague.duration.end).getTime() > new Date().getTime()) {
            const participatingCards = await db.readAllDocumentIds(`leagues/${league}/cards`)
            for (let card in participatingCards) {
                const lineup = await db.readDocument(
                    `leagues/${league}/cards/${participatingCards[card]}/lineups`,
                    gameWeek
                )

                if (!lineup.scoreSeason || lineup.scoreSeason === null || lineup.scoreSeason === undefined) {
                    lineup.scoreSeason = 0
                    await db.createOrUpdateDocument(
                        `leagues/${league}/cards/${participatingCards[card]}/lineups`,
                        gameWeek,
                        lineup
                    )
                    console.log(`💀 Card ${participatingCards[card]} in ${leagueIds[x]} is missing a scoreSeason.`)
                }

                // if (lineup.scoreSeason === 0) {
                //     console.log(`⛔ Card ${participatingCards[card]} in ${leagueIds[x]} has a scoreSeason of 0.`)
                // }

                // 💀 Assigns season score
                // if (leagueIds[x].includes("Season")) {
                //     if (!lineup.scoreSeason) {
                //         const lastWeekLineup = await db.readDocument(
                //             `leagues/${league}/cards/${participatingCards[card]}/lineups`,
                //             prevWeek
                //         )
                //         if (lastWeekLineup) {
                //             lineup.scoreSeason = lastWeekLineup.scoreSeason
                //         } else {
                //             lineup.scoreSeason = 0
                //         }
                //         await db.createOrUpdateDocument(
                //             `leagues/${league}/cards/${participatingCards[card]}/lineups`,
                //             gameWeek,
                //             lineup
                //         )
                //         console.log(`⛔ scoreSeason created for ${participatingCards[card]} in ${leagueIds[x]}`)
                //     }
                // }

                // 💀 Assigns score week
                // if (lineup.scoreWeek === null || lineup.scoreWeek === undefined) {
                //     lineup.scoreWeek = 0
                //     await db.createOrUpdateDocument(
                //         `leagues/${league}/cards/${participatingCards[card]}/lineups`,
                //         gameWeek,
                //         lineup
                //     )
                //     console.log(`⛔ scoreWeek created for ${participatingCards[card]} in ${leagueIds[x]}`)
                // }

                // 💀 Assigns game week
                // if (!lineup.gameWeek || lineup.gameWeek !== gameWeek) {
                //     lineup.gameWeek = gameWeek
                //     await db.createOrUpdateDocument(
                //         `leagues/${league}/cards/${participatingCards[card]}/lineups`,
                //         gameWeek,
                //         lineup
                //     )
                //     console.log(`📅 gameWeek created for ${participatingCards[card]} in ${leagueIds[x]}`)
                // }
            }
        }
    }
}

;(async () => {
    console.log(`...📝   START:${SCRIPT_NAME}`)
    console.log(`...📝   END:${SCRIPT_NAME}`)
    process.exit(0)
})()
