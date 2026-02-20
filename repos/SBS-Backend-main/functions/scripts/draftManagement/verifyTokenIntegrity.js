const db = require('../../services/db');

/**
 * NOTE: 
 */


(async () => {
    const allDrafts = await db.readAllDocuments("drafts")
    const draftersSeen = {}
    const badUsers = {}

    await Promise.all(allDrafts.map(async d => {
      const draftUsers = d.CurrentUsers
      if (!draftUsers || draftUsers === "undefined") {
        return
      }

      return await Promise.all(draftUsers.map(async u => {
        let issue = false
        const tokenId = u.TokenId
        const draftToken = await db.readDocument("draftTokens", tokenId)

        const ownerId = draftToken.OwnerId

        if (!draftToken) {
          console.log(`ISSUE WITH USER ${ownerId} - ${tokenId}: TOKEN IS IN DRAFT BUT HAS NO DRAFT TOKEN`)
          issue = true
        }
        else if (draftToken.LeagueId !== d.LeagueId) {
          console.log(`ISSUE WITH DRAFT TOKEN ${tokenId}: LEAGUE ID IS NOT THE SAME ${draftToken.LeagueId} vs ${d.LeagueId}`)
          issue = true
        }

        if (issue) {
          draftersSeen[tokenId] = (draftersSeen[tokenId] || 0) + 1
          badUsers[ownerId] = (badUsers[ownerId] || 0) + 1
        }
      }))
    }))

    Object.keys(badUsers).forEach(async ownerId => {
      const _unusedTokensRef = db._db.collection(`draftTokens`)
      const snapshot = await _unusedTokensRef.where('OwnerId', '==', ownerId).where("LeagueId", '==', "").get()

      let cnt = 0
      snapshot.forEach(doc => {
        cnt += 1
      });

      console.log(`OWNER ${ownerId}: NEEDS ${badUsers[ownerId]} TOKENS. HAS ${cnt} TOKENS.`)
    })

    console.log(draftersSeen)
    console.log(badUsers)

    // const draft = await db.readDocument("drafts", DRAFT_ID);
    // // go through each owner, and remove their drafted token
    // await Promise.all(draft.CurrentUsers.map(async o => {
    //   const userId = o.OwnerId

    //   const userDraftTokens = await db.readAllDocumentIds(`owners/${userId}/usedDraftTokens`)
    //   let tokenId
    //   await Promise.all(userDraftTokens.map(async t => {
    //     if (!tokenId) {
    //       const tokenInfo = await db.readDocument(`owners/${userId}/usedDraftTokens`, t)
    //       if (tokenInfo.LeagueId === DRAFT_ID) {
    //         tokenId = t
    //       }
    //     }
    //   }))

    //   if (tokenId) {
    //     // remove token from used
    //     await db.deleteDocument(`owners/${userId}/usedDraftTokens`, tokenId)

    //     // to refund the token, remove it from draft tokens and let the script pick it up again
    //     if (REFUND_TOKENS) {
    //       await db.deleteDocument('draftTokens', tokenId)
    //       await db.deleteDocument('draftTokenMetadata', tokenId)
    //     }

    //     console.log(`RESET TOKEN ${tokenId} FOR USER ${userId}`)

    //   } else {
    //     console.log(`ISSUE REMOVING FOR USER ${userId}: NO TOKEN FOUND`)
    //     // set ready to remove to false so that 
    //     readyToRemove = false
    //   }
    // }))

    // if (readyToRemove) {
    //     console.log(`USER REMOVAL COMPLETE -- REMOVE DRAFT ${DRAFT_ID} MANUALLY`)
    // } else {
    //   console.log("UNABLE TO REMOVE ALL DRAFT TOKENS FOR USERS. SEE PREVIOUS MESSAGES. DO NOT DELETE DRAFT UNLESS YOU ARE SURE USERS HAVE BEEN REFUNDED.")
    // }
})()