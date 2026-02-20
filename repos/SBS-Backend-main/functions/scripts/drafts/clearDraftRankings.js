const db = require('../../services/db');

/**
 * At the start of the new season you will want to clear all accounts draft rankings or they will roll over from last year.
 */

const deleteAllOwnerRankings = async () => {
    const ownerIds = await db.readAllDocumentIds(`owners`);
    for(let i = 0; i < ownerIds.length; i++) {
        const ownerId = ownerIds[i];
        await deleteDraftRankingsForOwner(ownerId)
    }
}

const deleteDraftRankingsForOwner = async (ownerId) => {
  return db.deleteDocument(`owners/${ownerId}/drafts`, 'rankings');
}

(async () => {
    // await deleteAllDraftTokens();
    await deleteAllOwnerRankings()
    // await deleteDraftTokensFromOwners()
})()