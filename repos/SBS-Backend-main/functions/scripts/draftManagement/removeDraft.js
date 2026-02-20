const db = require('../../services/db');

/**
 * NOTE: REMOVE DRAFT
 */


const DRAFT_ID = "2025-fast-draft-1129";
const REFUND_TOKENS = true;

(async () => {
    let readyToRemove = true
    const draft = await db.readDocument("drafts", DRAFT_ID);
    // go through each owner, and remove their drafted token
    await Promise.all(draft.CurrentUsers.map(async o => {
      const userId = o.OwnerId

      const userDraftTokens = await db.readAllDocumentIds(`owners/${userId}/usedDraftTokens`)
      let tokenId
      await Promise.all(userDraftTokens.map(async t => {
        if (!tokenId) {
          const tokenInfo = await db.readDocument(`owners/${userId}/usedDraftTokens`, t)
          if (tokenInfo.LeagueId === DRAFT_ID) {
            tokenId = t
          }
        }
      }))

      if (tokenId) {
        // remove token from used
        await db.deleteDocument(`owners/${userId}/usedDraftTokens`, tokenId)

        // to refund the token, remove it from draft tokens and let the script pick it up again
        if (REFUND_TOKENS) {
          await db.deleteDocument('draftTokens', tokenId)
          await db.deleteDocument('draftTokenMetadata', tokenId)
        }

        console.log(`RESET TOKEN ${tokenId} FOR USER ${userId}`)

      } else {
        console.log(`ISSUE REMOVING FOR USER ${userId}: NO TOKEN FOUND`)
        // set ready to remove to false so that 
        readyToRemove = false
      }
    }))

    if (readyToRemove) {
        console.log(`USER REMOVAL COMPLETE -- REMOVE DRAFT ${DRAFT_ID} MANUALLY`)
    } else {
      console.log("UNABLE TO REMOVE ALL DRAFT TOKENS FOR USERS. SEE PREVIOUS MESSAGES. DO NOT DELETE DRAFT UNLESS YOU ARE SURE USERS HAVE BEEN REFUNDED.")
    }
})()