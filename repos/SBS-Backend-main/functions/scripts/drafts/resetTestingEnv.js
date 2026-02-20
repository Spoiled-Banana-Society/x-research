const db = require('../../services/db');

const deleteAllDraftTokens = async () => {
    const data = await db.readAllDocumentIds('draftTokens');
    for(let i = 0; i < data.length; i++) {
        const tokenId = data[i];
        const t = await db.readDocument('draftTokens', tokenId)
        console.log(t)
        await db.deleteDocument('draftTokens', tokenId);
        await db.deleteDocument('draftTokenMetadata', tokenId)
    }
    console.log('deleted all draft tokens in draftTokens')
}

const deleteDraftLeague = async (leagueId) => {
    const cardIds = await db.readAllDocumentIds(`drafts/${leagueId}/cards`);
    for(let i = 0; i < cardIds.length; i++) {
        const cardId = cardIds[i];
        await db.deleteDocument(`drafts/${leagueId}/cards`, cardId)
    }

    await db.deleteDocument(`drafts/${leagueId}/state`, 'info');
    await db.deleteDocument(`drafts/${leagueId}/state`, 'connectionList')
    await db.deleteDocument(`drafts/${leagueId}/state`, 'rosters')
    await db.deleteDocument(`drafts/${leagueId}/state`, 'summary')
    await db.deleteDocument(`drafts/${leagueId}/state`, 'playerState')
    await db.deleteDocument(`drafts/${leagueId}/state`, 'draftQueues')
    await db.deleteDocument(`drafts/${leagueId}/state`, 'sort')

    // all of the nested crap
    const scoreIds = await db.readAllDocumentIds(`drafts/${leagueId}/scores`);
    if (scoreIds.length != 0) {
        for(let i = 0; i < scoreIds.length; i++) {
            const cards = await db.readAllDocumentIds(`drafts/${leagueId}/scores/${scoreIds[i]}/cards`);
            if (cards.length != 0) {
                for(let j = 0; j < cards.length; j ++) {
                    await db.deleteDocument(`drafts/${leagueId}/scores/${scoreIds[i]}/cards`, cards[j])
                }
            }
            await db.deleteDocument(`drafts/${leagueId}/scores`, scoreIds[i])
        }
    }
    await db.deleteDocument(`drafts/${leagueId}/state`, 'scores')
    await db.deleteDocument('drafts', leagueId)
    console.log('deleted ', leagueId)
}

const copyDraft = async (draft) => {
    db.readDocument
}

const deleteAllDraftLeagues = async () => {
    const data = await db.readAllDocumentIds('drafts');
    const draftIds = data.filter(x => x != "draftTracker");
    for(let i = 0; i < draftIds.length; i++) {
        const draftId = draftIds[i];
        await deleteDraftLeague(draftId)
        console.log("deleted everything for ", draftId)
    }
    console.log('deleted all drafts')
}

const copyAndDeleteAllDraftLeagues = async () => {
    const data = await db.readAllDocuments('drafts');
    const draftIds = data.filter(x => x != "draftTracker");
    for(let i = 0; i < draftIds.length; i++) {
        const draftId = draftIds[i];
        await copyDraft(draftId)
    }
}

const deleteDraftTokensFromOwners = async () => {
    const ownerIds = await db.readAllDocumentIds('owners')
    for(let i = 0; i < ownerIds.length; i++) {
        const ownerId = ownerIds[i];
        const usedTokenIds = await db.readAllDocumentIds(`owners/${ownerId}/usedDraftTokens`)
        if (usedTokenIds) {
            for(let j = 0; j < usedTokenIds.length; j++) {
                const tokenId = usedTokenIds[j];
                await db.deleteDocument(`owners/${ownerId}/usedDraftTokens`, tokenId)
            }
            console.log('deleted used draft tokens')
        } else {
            console.log("no used tokens for this owner")
        }

        const validTokenIds = await db.readAllDocumentIds(`owners/${ownerId}/validDraftTokens`)
        if (validTokenIds) {
            for(let j = 0; j < validTokenIds.length; j++) {
                const tokenId = validTokenIds[j];
                await db.deleteDocument(`owners/${ownerId}/validDraftTokens`, tokenId)
            } 
            console.log('deleted valid draft tokens')
        } else {
            console.log("no valid tokens for this owner")
        }
    }
}

(async () => {
    // await deleteAllDraftTokens();
    await deleteAllDraftLeagues()
    // await deleteDraftTokensFromOwners()
})()