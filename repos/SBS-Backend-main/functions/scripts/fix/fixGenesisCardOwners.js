const db = require('../../services/db');
const api = require('../../services/api')
const cardContract = require("../../services/cardContract")

const CheckIfCardIsOwnedByThisOwner = async (ownerId, card) => {
    const cardId = card._cardId;
    //const card = await db.readDocument('cards', cardId)
    const contractOwner = await cardContract.getOwnerByCardId(cardId);
    if(contractOwner.toLowerCase() == ownerId) {
        return true
    } else {
        return false
    }
}

const cleanUpCardOwnedByWrongOwner = async (ownerId, cardId) => {
    let owner = await db.readDocument('owners', ownerId);
    if(!owner) {
        owner = {
            AvailableCredit: 0,
            AvailableEthCredit: 0,
            BlueCheckEmail: "",
            HasW9: false,
            IsBlueCheckVerified: false,
            Leagues: [],
            NumWithdrawals: 0,
            PendingCredit: 0,
            WithdrawnAmount: {
                "2023": 0,
            }
        }

        await db.createOrUpdateDocument('owners', ownerId, owner, false);
    } else {
        let leagues = [];
        let leaguesCardIsIn = owner.Leagues;
        if(leaguesCardIsIn) {
            for(let i = 0; i < leaguesCardIsIn.length; i++) {
                const obj = leaguesCardIsIn[i];
                if (obj.CardId != cardId) {
                    leagues.push(obj)
                }
            }
            owner.Leagues = leagues;
            await db.createOrUpdateDocument('owners', ownerId, owner, false)
        }
        
    }

    await db.deleteDocument(`owners/${ownerId}/cards`, cardId);
    console.log(`Card ${cardId} has been cleaned up for ${ownerId}`);
}

const checkOrAddCardToLeagues = async (ownerId, card) => {
    const cardId = card._cardId;
    let owner = await db.readDocument('owners', ownerId);
    if(!owner) {
        owner = {
            AvailableCredit: 0,
            AvailableEthCredit: 0,
            BlueCheckEmail: "",
            HasW9: false,
            IsBlueCheckVerified: false,
            Leagues: [],
            NumWithdrawals: 0,
            PendingCredit: 0,
            WithdrawnAmount: {
                "2023": 0,
            }
        }

        await db.createOrUpdateDocument('owners', ownerId, owner, false);
    }

    let includedAlready = false
    for(let i = 0; i < owner.Leagues.length; i++) {
        let obj = owner.Leagues[i];
        if(obj.CardId == cardId) {
            if(obj.LeagueId == 'genesis') {
                includedAlready = true;
            }
        }
    }

    if(!includedAlready) {
        owner.Leagues.push({ CardId: cardId, LeagueId: 'genesis' })
        await db.createOrUpdateDocument('owners', ownerId, owner, false);
        console.log(`Added card ${cardId} to owners leagues`)
    }
}

const addCardsToOwners = async () => {
    for(let i = 0; i < 10000; i++) {
        const cardId = `${i}`;
        const card = await db.readDocument('cards', cardId);
        await db.createOrUpdateDocument('leagues/genesis/cards', cardId, card, false)
        await db.createOrUpdateDocument(`owners/${card._ownerId}/cards`, cardId, card, false);
        await db.createOrUpdateDocument('genesisLeaderboard/2023REG-01/cards', cardId, { card: card }, true)
        await checkOrAddCardToLeagues(card._ownerId, card)
        console.log("updated card ", cardId)
    }
}

(async () => {
    const ownerIds = await db.readAllDocumentIds('owners');
    for(let i = 0; i < ownerIds.length; i++) {
        const ownerId = ownerIds[i];
        const cardIds = await db.readAllDocumentIds(`owners/${ownerId}/cards`);
        if(!cardIds) {
            console.log("This owner does not own any genesis cards: ", ownerId)
            continue;
        }
        for(let j = 500; j < cardIds.length; j++) {
            const cardId = cardIds[j];
            console.log(cardId)
            const card = await db.readDocument(`owners/${ownerId}/cards`, cardId);
            if(!card) {
                await db.deleteDocument(`owners/${ownerId}/cards/${cardId}/defaultLineup`, 'lineup')
                continue;
            }
            let ownsCard = await CheckIfCardIsOwnedByThisOwner(ownerId, card)
            if(!ownsCard) {
                await cleanUpCardOwnedByWrongOwner(ownerId, cardId)
            }
        }
    }

    await addCardsToOwners()
})()

