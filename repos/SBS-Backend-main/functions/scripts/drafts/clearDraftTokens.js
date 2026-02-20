const utils = require('../../services/utils');
const db = require('../../services/db');

const clearDraftTokens = async () => {
    const cardIds = await db.readAllDocumentIds('draftTokens');
    for(let i = 0; i < cardIds.length; i++) {
        const cardId = cardIds[i];
        // if (parseInt(cardId) <= 10 || cardId == '0') {
        //     console.log(`Card ${cardId} is an actual card and should not be deleted`)
        //     continue
        // }

        const card = await db.readDocument('draftTokens', cardId)

        if (!card) {
          return
        }

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

(async () => {
   await clearDraftTokens()
})()



