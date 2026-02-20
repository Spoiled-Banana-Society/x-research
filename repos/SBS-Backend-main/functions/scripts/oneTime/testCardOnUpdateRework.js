const db = require('../../services/db');
const utils = require('../../services/utils');

(async () => {
    const cardIds = await db.readAllDocumentIds('cards');
    const ownerIds = await db.readAllDocumentIds('owners');
    const teams = utils._SPORTRADAR_VALID_NFL_TEAMS;


    // Change owners to test onOwnerChange
    console.log("Starting to test onOwnerChange")
    const ownerChanges = [];
    for(let i = 0; i < 1; i++) {
        const card = await db.readDocument("cards", `${i}`);
        const prevOwner = card._ownerId;
        if(card._ownerId == ownerIds[i+1]) {
            card._ownerId = ownerIds[i+30];
        } else {
            card._ownerId = ownerIds[i+1];
        }
        await db.createOrUpdateDocument("cards", `${i}`, card, false);
        ownerChanges.push({ cardId: i, oldOwner: prevOwner, newOwner: card._ownerId })
        utils.sleep(5000)
    }

    // // Change Roster to test onRosterChange
    // console.log("Starting to test onRosterChange")
    // const rosterChanges = [];
    // for(let i = 0; i < 1; i++) {
    //     const card = await db.readDocument("cards", `${i*10}`);
    //     const prevDst = card.DST;
    //     if(card.DST[0] == teams[i + 3]) {
    //         card.DST[0] = teams[i + 5];
    //     } else {
    //         card.DST = teams[i+3];
    //     }
    //     await db.createOrUpdateDocument("cards", `${i*10}`, card, false);
    //     rosterChanges.push({ cardId: i*10, oldDST: prevDst, newDST: card.DST })
    //     utils.sleep(5000)
    // }

    // Add free peels to cards to test onFreePeelAddition
    // console.log("Starting to test onFreePeelAddition")
    // const freePeelAdditions = [];
    // for(let i = 0; i < 1; i++) {
    //     const card = await db.readDocument("cards", `${i}`);
    //     const oldPeels = card._freePeel;
    //     card._freePeel = oldPeels + 2;
    //     await db.createOrUpdateDocument("cards", `${i}`, card, false);
    //     freePeelAdditions.push({ cardId: i, oldPeels: oldPeels, newPeels: card._freePeel })
    //     utils.sleep(5000);
    // }

    // // Add ape to card Prizes to test onPrizeChanges
    // console.log("Starting to test onPrizeChanges")
    // const prizeChanges = [];
    // for (let i = 0; i < 1; i++) {
    //     const card = await db.readDocument("cards", `${i}`);
    //     const oldApe = (card.prizes) ? card.prizes.ape : 0;
    //     if(!card.prizes) {
    //         card.prizes = {
    //             ape: 0
    //         }
    //     }
    //     card.prizes.ape = Number(card.prizes.ape) + 5;
    //     await db.createOrUpdateDocument("cards", `${i}`, card, false)
    //     prizeChanges.push({ cardId: i, oldApeAmount: oldApe, newApeAmount: card.prizes.ape });
    //     utils.sleep(5000);
    // }
    console.log(ownerChanges);
    // console.log(rosterChanges);
    // console.log(freePeelAdditions);
    // console.log(prizeChanges);
})();