const db = require('../../services/db');
const { regenerateImageForTokenId } = require('../cardScripts/regenerate-card-img');

/**
 * NOTE: 
 */


(async () => {
    const allDraftTokens = await db.readAllDocuments("draftTokens")
    for (let i=0; i<allDraftTokens.length; i++) {
      const d = allDraftTokens[i]
      if (d.LeagueId && !d.Roster.QB) {
        const draft = await db.readDocument("drafts", d.LeagueId)

        if (draft.IsLocked) {
          console.log("FIXING")
          console.log(d.LeagueId)
          console.log(d.CardId)
          console.log(d.OwnerId)

          const originalOwnerObj = draft.CurrentUsers.find(u => u.TokenId === d.CardId)
          console.log(originalOwnerObj.OwnerId)
          const rosters = await db.readDocument(`drafts/${d.LeagueId}/state`, "rosters")
          const roster = rosters.Rosters[originalOwnerObj.OwnerId]

          if (!roster) {
            console.log("uh oh pasecitio")
            throw Error('stop')
          } else {
            d.Roster.QB = roster.QB
            d.Roster.RB = roster.RB
            d.Roster.WR = roster.WR
            d.Roster.TE = roster.TE
            d.Roster.DST = roster.DST

            await db.createOrUpdateDocument("draftTokens", d.CardId, d)
            await db.createOrUpdateDocument("draftTokenLeaderboard/2025REG-01/cards", d.CardId, d)
            await db.createOrUpdateDocument(`drafts/${d.LeagueId}/cards`, d.CardId, d)

            // regenerate metadata
            await fetch(`http://localhost:7070/draft/${d.LeagueId}/cards/${d.CardId}`)

            // regenerate image
            await regenerateImageForTokenId(d.CardId)

          }

          
        }
      }
    }
})()