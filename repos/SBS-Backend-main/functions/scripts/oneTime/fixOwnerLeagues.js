const { readAllDocumentIds } = require("../../services/db");
const db = require("../../services/db");
const cardContract = require('../../services/cardContract');
const { all } = require("../../routes/league");


async function checkIfUpdateIsNecessary(ownerId, cardId, leagueId) {
    let owner = await db.readDocument('owners', ownerId);
    if(!owner) {
        console.log(`${ownerId} does not exist for card: ${cardId}`)
        owner = {
            availableCredit: 0,
            leagues: [],
            pendingCredit: 0
        }
    }
    if (!owner.leagues) {
        console.log(`leagues array not there for ${ownerId}`)
        owner.leagues = [];
    }
    const leaguesIn = owner.leagues;
    const checkArr = leaguesIn.filter( item => item.leagueId == leagueId && item.cardId == cardId);
    if (checkArr.length == 0) {
        console.log(`Card: ${cardId} was not found in ${ownerId}'s leagues array for ${leagueId} adding it to their leagues array now`)
        leaguesIn.push({ leagueId: leagueId, cardId: cardId });
        owner.leagues = leaguesIn;
        console.log(owner.leagues)
        await db.createOrUpdateDocument('owners', ownerId, owner, false)
    } else if (checkArr.length > 1) {
        console.log(`Found more than one entry for ${cardId} in ${leagueId} for ${ownerId}`)
        owner.leagues = owner.leagues.filter(item => item.cardId != cardId && item.leagueId == leagueId)
        owner.leagues.push({ cardId: cardId, leagueId: leagueId })
        await db.createOrUpdateDocument('owners', ownerId, owner, false)
    }
}

(async () => {
    /*const ownerIds = await db.readAllDocumentIds('owners');
    for (let i = 0; i < ownerIds.length; i++) {
        let owner = await db.readDocument('owners', ownerIds[i]);
        if (!owner) {
            owner = {
                availableCredit: 0,
                leagues: [],
                pendingCredit: 0
            }
        }
        if (!owner.leagues) {
            owner.leagues = [];
        }
        for (let j = 0; j < owner.leagues.length; j++) {
            const item = owner.leagues[j];
            const card = await db.readDocument(`leagues/${item.leagueId}/cards`, item.cardId);
            if (!card) {
                console.log(`Card: ${item.cardId} was not found in ${item.leagueId} so we are removing it from ${ownerIds[i]}'s leagues array`)
                const leaguesIn = owner.leagues;
                owner.leagues = leaguesIn.filter(el => item.leagueId != el.leagueId && item.cardId != el.cardId)
                await db.createOrUpdateDocument('owners', ownerIds[i], owner, false)
            } else {
                if (item.leagueId == "genesis") {
                    if (ownerIds[i] != card._ownerId) {
                        console.log(`Card: ${item.cardId} is no longer owned by ${ownerIds[i]} so we are removing it from their leagues array`)
                        const leaguesIn = owner.leagues;
                        owner.leagues = leaguesIn.filter(el => item.leagueId != el.leagueId && item.cardId != el.cardId)
                        await db.createOrUpdateDocument('owners', ownerIds[i], owner, false)
                    }
                }
            }
        }
    }*/


    // loop through and all cards to 
    // const leagueIds = await db.readAllDocumentIds('leagues')
    // const res = [];
    // for (let i = 0; i < leagueIds.length; i++) {
    //     const cardIds = await db.readAllDocumentIds(`leagues/${leagueIds[i]}/cards`);
    //     for (let j = 0; j < cardIds.length; j++) {
    //         const cardId = cardIds[j];
    //         const card = await db.readDocument(`leagues/${leagueIds[i]}/cards`, cardId);
    //         if (card) {
    //             const cardOwner = await cardContract.getOwnerByCardId(cardId);
    //             if (cardOwner == card._ownerId) {
    //                 await checkIfUpdateIsNecessary(card._ownerId, cardId, leagueIds[i])
    //             } else {
    //                 // week 1 lineup
    //                 let gameweek = '2022-REG-01';
    //                 let lineup = await db.readDocument(`leagues/${leagueIds[i]}/cards/${cardId}/lineups`, gameweek);
    //                 if (lineup) {
    //                     if(lineup._ownerId == cardOwner) {
    //                         await checkIfUpdateIsNecessary(lineup._ownerId, cardId, leagueIds[i])
    //                     }
    //                 }
    //                 gameweek = '2022-REG-02';
    //                 lineup = await db.readDocument(`leagues/${leagueIds[i]}/cards/${cardId}/lineups`, gameweek);
    //                 if (lineup) {
    //                     if(lineup._ownerId == cardOwner) {
    //                         await checkIfUpdateIsNecessary(lineup._ownerId, cardId, leagueIds[i])
    //                     }
    //                 }
    //                 gameweek = '2022-REG-03';
    //                 lineup = await db.readDocument(`leagues/${leagueIds[i]}/cards/${cardId}/lineups`, gameweek);
    //                 if (lineup) {
    //                     if(lineup._ownerId == cardOwner) {
    //                         await checkIfUpdateIsNecessary(lineup._ownerId, cardId, leagueIds[i])
    //                     }
    //                 }
    //                 gameweek = '2022-REG-04';
    //                 lineup = await db.readDocument(`leagues/${leagueIds[i]}/cards/${cardId}/lineups`, gameweek);
    //                 if (lineup) {
    //                     if(lineup._ownerId == cardOwner) {
    //                         await checkIfUpdateIsNecessary(lineup._ownerId, cardId, leagueIds[i])
    //                     }
    //                 }
    //                 gameweek = '2022-REG-05';
    //                 lineup = await db.readDocument(`leagues/${leagueIds[i]}/cards/${cardId}/lineups`, gameweek);
    //                 if (lineup) {
    //                     if(lineup._ownerId == cardOwner) {
    //                         await checkIfUpdateIsNecessary(lineup._ownerId, cardId, leagueIds[i])
    //                     }
    //                 }
    //                 gameweek = '2022-REG-06';
    //                 lineup = await db.readDocument(`leagues/${leagueIds[i]}/cards/${cardId}/lineups`, gameweek);
    //                 if (lineup) {
    //                     if(lineup._ownerId == cardOwner) {
    //                         await checkIfUpdateIsNecessary(lineup._ownerId, cardId, leagueIds[i])
    //                     }
    //                 }
    //             }
    //         }
    //     }
    // }


    const allOwnerIds = await db.readAllDocumentIds('owners');
    for (let i = 0; i < allOwnerIds.length; i++) {
        const ownerId = allOwnerIds[i];
        const cards = await db.readAllDocumentIds(`owners/${ownerId}/cards`);
        for (let j = 0; j < cards.length; j++) {
            const cardId = cards[j];
            const card = await db.readDocument('cards', cardId)
            if (card._ownerId == ownerId) {
                await db.createOrUpdateDocument(`owners/${ownerId}/cards`, cardId, card, false)
            } else {
                console.log(`${ownerId} no longer owner ${cardId} so we are not going to update it`)
            }
        }
    }
    console.log(res)
})();