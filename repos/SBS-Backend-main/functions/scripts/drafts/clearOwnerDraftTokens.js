const utils = require('../../services/utils');
const db = require('../../services/db');

const ownersCleanUpDraftTokens = async () => {
    const ownerIds = await db.readAllDocumentIds('owners');
    for(let i = 0; i < ownerIds.length; i++) {
        const ownerId = ownerIds[i];
        const validDraftTokens = await db.readAllDocumentIds(`owners/${ownerId}/validDraftTokens`);
        if (validDraftTokens.length != 0) {
            console.log('found an owner with a validDraftToken: ', ownerId)
            for(let i = 0; i < validDraftTokens.length; i++) {
                const cardId = validDraftTokens[i]
                await db.deleteDocument(`owners/${ownerId}/validDraftTokens`, cardId) 
            }
        }

        console.log(`Deleted unused draft tokens for owner ${ownerId}`)

        const usedDraftTokens = await db.readAllDocumentIds(`owners/${ownerId}/usedDraftTokens`)
        if (usedDraftTokens.length != 0) {
            for(let i = 0; i < usedDraftTokens.length; i++) {
                const cardId = usedDraftTokens[i]
                await db.deleteDocument(`owners/${ownerId}/usedDraftTokens`, cardId)
            }

            console.log(`Deleted used draft tokens for owner ${ownerId}`)
        }
    }
}


(async () => {
   await ownersCleanUpDraftTokens()
})()



