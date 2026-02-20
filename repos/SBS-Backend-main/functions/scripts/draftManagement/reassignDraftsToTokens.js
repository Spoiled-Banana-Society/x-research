const db = require('../../services/db');

/**
 * NOTE: 
 */


(async () => {
    const allDrafts = await db.readAllDocuments("drafts")
    const draftersSeen = {}
    const badUsers = {}
    const userLeaguesNeedAssign = {}
    const userAvailableDraftTokens = []

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
          // console.log(`ISSUE WITH USER ${ownerId} - ${tokenId}: TOKEN IS IN DRAFT BUT HAS NO DRAFT TOKEN`)
          issue = true
        }
        else if (draftToken.LeagueId !== d.LeagueId) {
          // console.log(`ISSUE WITH DRAFT TOKEN ${tokenId}: LEAGUE ID IS NOT THE SAME ${draftToken.LeagueId} vs ${d.LeagueId}`)
          issue = true
        }

        if (issue) {
          draftersSeen[tokenId] = (draftersSeen[tokenId] || 0) + 1
          badUsers[ownerId] = (badUsers[ownerId] || 0) + 1

          if (!userLeaguesNeedAssign[ownerId]) {
            userLeaguesNeedAssign[ownerId] = []
          }
          userLeaguesNeedAssign[ownerId].push({
            tokenId,
            draftId: d.LeagueId
          })
        }
      }))
    }))

    await Promise.all(Object.keys(badUsers).map(async ownerId => {
      const _unusedTokensRef = db._db.collection(`draftTokens`)
      const snapshot = await _unusedTokensRef.where('OwnerId', '==', ownerId).where("LeagueId", '==', "").get()

      let cnt = 0
      snapshot.forEach(doc => {
        cnt += 1
        const data = doc.data()
        if (!userAvailableDraftTokens[ownerId]) {
          userAvailableDraftTokens[ownerId] = []
        }
        userAvailableDraftTokens[ownerId].push(data.CardId)

        if (data.CardId !== doc.id) {
          throw Error(`DRAFT TOKEN MESSSED UP!!! DOC ID ${doc.id} vs CARD ID ${data.CardId}`)
        }
      });

      console.log(`OWNER ${ownerId}: NEEDS ${badUsers[ownerId]} TOKENS. HAS ${cnt} TOKENS.`)
    }))

    const userToFix = "0x0bb29fdcd7d73a2b6af9452be92223b8e72e3eac"
    const restrictedDraftsToAssign = []
    // let userSendTo
    let userSendTo = "0xcba6682db2c545958399b97eed19a9ea94ede6ce"

    // sending to different user logic
    if (!userSendTo) {
      userSendTo = userToFix
    } else {
      if (!userAvailableDraftTokens[userSendTo]) {
        const _unusedTokensRef = db._db.collection(`draftTokens`)
        const snapshot = await _unusedTokensRef.where('OwnerId', '==', userSendTo).where("LeagueId", '==', "").get()
        let cnt = 0
        snapshot.forEach(doc => {
          cnt += 1
          const data = doc.data()
          if (!userAvailableDraftTokens[userSendTo]) {
            userAvailableDraftTokens[userSendTo] = []
          }
          userAvailableDraftTokens[userSendTo].push(data.CardId)

          if (data.CardId !== doc.id) {
            throw Error(`DRAFT TOKEN MESSSED UP!!! DOC ID ${doc.id} vs CARD ID ${data.CardId}`)
          }
        });
      }
    }

    const availableTokens = userAvailableDraftTokens[userSendTo]

    console.log(`FIXING ${userToFix} \n\n`)
    console.log(userLeaguesNeedAssign[userToFix])
    console.log(`TOKENS WILL BE ASSIGNED TO ${userSendTo}`)
    console.log(availableTokens)

    // they need enough tokens
    if ((restrictedDraftsToAssign.length ? restrictedDraftsToAssign.length : userLeaguesNeedAssign[userToFix].length) > availableTokens.length) {
      throw Error("NOT ENOUGH TOKENS TO FIX -- MANUALLY ASSIGN")
    }

    for (let i = 0; i < userLeaguesNeedAssign[userToFix].length; i++) {
      const draftInfo = userLeaguesNeedAssign[userToFix][i]
      const draftId = draftInfo.draftId
      const tokenId = draftInfo.tokenId

      // if list is empty we just assign all. otherwise assign only to drafts in the list
      if (!restrictedDraftsToAssign.length || restrictedDraftsToAssign.indexOf(draftId) >= 0) {
        const draft = await db.readDocument("drafts", draftId);

        const replacementTokenId = String(availableTokens[i])

        let userIdx = null
        draft.CurrentUsers.forEach((userItem, i) => {
          if (userItem.TokenId === tokenId) {
            userIdx = i

            if (userItem.OwnerId !== userToFix) {
              throw Error(`DOUBLE CHECK DRAFT ${draftId} FOR USER ${userToFix}`)
            }
          }
        })

        if (userIdx === null) {
          throw Error("UH OH MISSING USER IN DRAFT")
        }

        console.log(`ASSIGNING ${availableTokens[i]}`)
        draft.CurrentUsers[userIdx] = {
          "OwnerId": userToFix,
          "TokenId": replacementTokenId
        }

        // TODO SAVE DRAFT
        await db.createOrUpdateDocument("drafts", draftId, draft)

        const draftCard = await db.readDocument(`drafts/${draftId}/cards`, tokenId);
        if (!draftCard) {
          throw Error("CANNOT FIND DRAFT CARD. BAD!")
        }

        draftCard.CardId = replacementTokenId
        // make sure card has all of the info
        draftCard.LeagueId = draft.LeagueId
        draftCard.LeagueDisplayName = draft.DisplayName
        draftCard.DraftType = draft.DraftType
        draftCard.Level = draft.Level

        await db.createOrUpdateDocument(`drafts/${draftId}/cards`, replacementTokenId, draftCard)
        // TODO WRITE OLD CARD TO NEW ID
        // TODO DELETE OTHER CARD
        db.deleteDocument(`drafts/${draftId}/cards`, tokenId)
        console.log(`DELETED DRAFT CARD ${tokenId}`)


        // WRITE TO USERS USED DRAFT TOKENS (TO BE SAFE)
        // assign to new user
        draftCard.OwnerId = userSendTo

        await db.createOrUpdateDocument(`owners/${userSendTo}/usedDraftTokens`, replacementTokenId, draftCard)

        // DELETE VALID DRAFT TOKEN (TO BE SAFE)
        await db.deleteDocument(`owners/${userToFix}/validDraftTokens`, replacementTokenId)

        // UPDATE GLOABL DRAFT TOKEN
        await db.createOrUpdateDocument(`draftTokens`, replacementTokenId, draftCard)

        await fetch(`http://localhost:7070/draft/${draftId}/cards/${replacementTokenId}`)
      }
      
    }
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