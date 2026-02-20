const utils = require('../../services/utils');
const db = require('../../services/db');

const cleanUpCards = async () => {
    const cardIds = await db.readAllDocumentIds('draftTokens');
    for(let i = 0; i < cardIds.length; i++) {
        const cardId = cardIds[i];
        // if (parseInt(cardId) <= 10 || cardId == '0') {
        //     console.log(`Card ${cardId} is an actual card and should not be deleted`)
        //     continue
        // }

        const card = await db.readDocument('draftTokens', cardId)
        console.log(cardId)
        console.log(card)

        if (card.LeagueId == "") {
            await db.deleteDocument(`owners/${card.OwnerId}/validDraftTokens`, cardId)
        } else {
            await db.deleteDocument(`owners/${card.OwnerId}/usedDraftTokens`, cardId)
            await db.deleteDocument(`drafts/${card.LeagueId}/cards`, cardId)
        }
        
        await db.deleteDocument(`draftTokens`, cardId)
        await db.deleteDocument('draftTokenMetadata', cardId)
        console.log("Deleted Draft Token ", cardId)
    }
}

const cleanUpLeagues = async () => {
    let leagueIds = await db.readAllDocumentIds('drafts');
    leagueIds = leagueIds.filter(x => x != "draftTracker" && x != "live-draft-3")
    for (let i = 0; i < leagueIds.length; i++) {
        const leagueId = leagueIds[i];
        if (leagueId == 'live-draft-3') {
            console.log('Found the first draft. We are skipping it')
            continue;
        }
        await db.deleteDocument(`drafts/${leagueId}/state`, 'info');
        await db.deleteDocument(`drafts/${leagueId}/state`, 'connectionList')
        await db.deleteDocument(`drafts/${leagueId}/state`, 'rosters')
        await db.deleteDocument(`drafts/${leagueId}/state`, 'summary')
        await db.deleteDocument(`drafts/${leagueId}/state`, 'playerState')
    
        await db.deleteDocument('drafts', leagueId)

        console.log("deleted all state and draft documents for ", leagueId)   
    }
}

const ownersCleanUpDraftTokens = async () => {
    const ownerIds = await db.readAllDocumentIds('owners');
    for(let i = 0; i < ownerIds.length; i++) {
        const ownerId = ownerIds[i];
        const validDraftTokens = await db.readAllDocumentIds(`owners/${ownerId}/validDraftTokens`);
        if (validDraftTokens.length != 0) {
            console.log('found an owner with a validDraftToken: ', ownerId)
            for(let i = 0; i < validDraftTokens.length; i++) {
                const cardId = validDraftTokens[i];
                if(Number(cardId) <= 10 || cardId == '0') {
                    const card = await db.readDocument('draftTokens', cardId)
                    if (card.OwnerId != ownerId) {
                        await db.deleteDocument(`owners/${ownerId}/validDraftTokens`, cardId)
                        console.log(`Deleted card ${cardId} from validDraftTokens from user (is not active owner on draft token): ${ownerId}`)
                        continue;
                    }
                    console.log("This owner has an active card with ID 0 - 10: ", cardId)
                    continue;
                } else {
                    await db.deleteDocument(`owners/${ownerId}/validDraftTokens`, cardId)
                    console.log(`Deleted card ${cardId} from validDraftTokens from user: ${ownerId}`)
                }
            }
        }

        const usedDraftTokens = await db.readAllDocumentIds(`owners/${ownerId}/usedDraftTokens`)
        if (usedDraftTokens.length != 0) {
            console.log("Found an owner with usedDraftTokens")
            for(let i = 0; i < usedDraftTokens.length; i++) {
                const cardId = usedDraftTokens[i];
                if(Number(cardId) <= 10 || cardId == '0') {
                    const card = await db.readDocument('draftTokens', cardId)
                    if(card) {
                        if (card.OwnerId != ownerId) {
                            await db.deleteDocument(`owners/${ownerId}/usedDraftTokens`, cardId)
                            console.log(`Deleted card ${cardId} from usedDraftTokens from user (is not active owner on draft token): ${ownerId}`)
                            continue;
                        }
                    } else {
                        console.log('This card does not ')
                    }
                    console.log(`${ownerId} has an active card with ID 0 - 10: `, cardId)
                    continue;
                } else {
                    await db.deleteDocument(`owners/${ownerId}/usedDraftTokens`, cardId)
                    console.log(`Deleted card ${cardId} from usedDraftTokens from user: ${ownerId}`)
                }
            }
        }
    }
}

const switchDraftThreeToOne = async () => {
    const oldLeagueId = 'live-draft-3';
    const league = await db.readDocument('drafts', oldLeagueId);

    league.LeagueId = 'live-draft-1';
    await db.createOrUpdateDocument('drafts', league.LeagueId, league, false);

    const connList = await db.readDocument('drafts/live-draft-3/state', 'connectionList')
    const playerState = await db.readDocument('drafts/live-draft-3/state', 'playerState')
    const rosters = await db.readDocument('drafts/live-draft-3/state', 'rosters')
    const summary = await db.readDocument('drafts/live-draft-3/state', 'summary')
    const info = await db.readDocument('drafts/live-draft-3/state', 'info')

    await db.createOrUpdateDocument('drafts/live-draft-1/state', 'connectionList', connList, false)
    await db.createOrUpdateDocument('drafts/live-draft-1/state', 'playerState', playerState, false);
    await db.createOrUpdateDocument('drafts/live-draft-1/state', 'rosters', rosters, false)
    await db.createOrUpdateDocument('drafts/live-draft-1/state', 'summary', summary, false)
    await db.createOrUpdateDocument('drafts/live-draft-1/state', 'info', info, false)

    for(let i = 0; i < league.CurrentUsers; i++) {
        const user = league.CurrentUsers[i];
        const ownerId = user.OwnerId;
        const tokenId = user.TokenId;

        const card = await db.readDocument('draftTokens', tokenId)
        card.LeagueId = 'live-draft-1';

        await db.createOrUpdateDocument('draftTokens', tokenId, card, false)
        await db.createOrUpdateDocument(`drafts/live-draft-1/cards`, tokenId, card, false)
        await db.createOrUpdateDocument(`owners/${ownerId}/usedDraftTokens`, tokenId, card, false)
    }
}

const cleanMetadataToBBB = async () => {
    const cardIds = await db.readAllDocumentIds('draftTokenMetadata');
    for(let i = 0; i < cardIds.length; i++) {
        const cardId = cardIds[i];
        const metadata = await db.readDocument('draftTokenMetadata', cardId);
        metadata.Name = `BBB Pass #${cardId}`
        metadata.Description = "Banana Best Ball, the first ever Web3 Fantasy Football Draft tournament on chain."
        //console.log(metadata)
        await db.createOrUpdateDocument('draftTokenMetadata', cardId, metadata, false)
    }
}

const cleanUpRankings = async () => {
    const ownerIds = await db.readAllDocumentIds('owners');
    for(let i = 0; i < ownerIds.length; i++) {
        const ownerId = ownerIds[i];
        
        let data = await db.readDocument(`owners/${ownerId}/drafts`, 'rankings')
        if(!data) {
            continue;
        }
        console.log(ownerId)
        if(data.ranking) {
            data = {
                Ranking: data.ranking
            }
        }
        const rankings = data.Ranking;
        for(let j = 0; j < rankings.length; j++) {
            const obj = rankings[j];
            data.Ranking[j].Rank = j + 1;
        }
        await db.createOrUpdateDocument(`owners/${ownerId}/drafts`, 'rankings', data, false)
        console.log(`Updated rankings for ${ownerId}`)
    }
}

const cleanupAllForNewSeason = async () => {
    // get rid of all draftTokens
    await cleanUpCards()
}

(async () => {
   await ownersCleanUpDraftTokens()
})()



