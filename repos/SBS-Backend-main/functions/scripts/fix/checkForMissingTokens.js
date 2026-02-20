const cardContract = require("../../services/cardContract");
const db = require('../../services/db');

const checkForMissingTokens = async () => {
  const tokenNum = await cardContract.numTokensMinted()
  for (let i=0; i<tokenNum / 2; i++) {
    let owner = await cardContract.getOwnerByCardId(i)
    owner = owner.toLowerCase()

    // check all contract transfer events to make sure that the token is currently in the correct spot.

    let inAvailable, inUsed
    try {
      inAvailable = await db.readDocument(`owners/${owner}/validDraftTokens`, String(i))
    } catch (e) {
      console.log(e)
      inAvailable = null
    }

    try {
      inUsed = await db.readDocument(`owners/${owner}/usedDraftTokens`, String(i))
    } catch (e) {
      console.log(e)
      inUsed = null
    }

    if (i % 100 === 0) {
      // sleep for 2 seconds so we don't overwhelm infura
      await new Promise(r => setTimeout(r, 1000));
    }

    if (!inAvailable && !inUsed) {
      token = await db.readDocument(`draftTokens`, String(i))
      // Token was never recorded
      if (!token) {
        console.log(`Missing token for ${owner}: ${i}`)
        const resp = await fetch(`https://sbs-drafts-api-w5wydprnbq-uc.a.run.app/owner/${owner.toLowerCase()}/draftToken/mint`, {
          "method": "POST",
          "body": JSON.stringify({
            "MinId": i,
            "MaxId": i
          }),
          headers: {'Content-Type': 'application/json'}
        })
      } else {
        // token has been used already -- transfer the ownership
        if (token.LeagueId) {
          console.log("IN TRANSFER USED TOKEN")
          console.log(i)
          console.log(token.OwnerId)
          console.log(owner)

          const pastOwner = token.OwnerId.toLowerCase()

          // set new owner and update draft token
          token.OwnerId = owner
          await db.createOrUpdateDocument(`draftTokens`, String(i), token)

          // grab past used draft token record and give to new owner
          previousRecord = await db.readDocument(`owners/${pastOwner}/usedDraftTokens`, String(i))
          previousRecord.OwnerId = owner
          await db.createOrUpdateDocument(`owners/${owner}/usedDraftTokens`, String(i), previousRecord)
          await db.deleteDocument(`owners/${pastOwner}/usedDraftTokens`, String(i))

          // get card in draft
          const draftCard = await db.readDocument(`drafts/${previousRecord.LeagueId}/cards`, String(i))
          draftCard.OwnerId = owner
          await db.createOrUpdateDocument(`drafts/${previousRecord.LeagueId}/cards`, String(i), draftCard)

          console.log(`USED TOKEN ${i} TRANSFERED FROM ${pastOwner} to ${owner}`)
        } else {
          console.log("IN UN-USED TOKEN")
          console.log(token.LeagueId)
          console.log(token.OwnerId)
          console.log(owner)
          // token has not been used yet
          const pastOwner = token.OwnerId.toLowerCase()

          // set new owner and update draft token
          token.OwnerId = owner
          await db.createOrUpdateDocument(`draftTokens`, String(i), token)

          // grab past used draft token record and give to new owner
          previousRecord = await db.readDocument(`owners/${pastOwner}/validDraftTokens`, String(i))
          previousRecord.OwnerId = owner
          await db.createOrUpdateDocument(`owners/${owner}/validDraftTokens`, String(i), previousRecord)
          await db.deleteDocument(`owners/${pastOwner}/validDraftTokens`, String(i))
          console.log(`UNUSED TOKEN ${i} TRANSFERED FROM ${pastOwner} to ${owner}`)
        }
      } 
    }
  }
}


(async () => {
  // await deleteAllDraftTokens();
  await checkForMissingTokens()
  // await deleteDraftTokensFromOwners()
})()