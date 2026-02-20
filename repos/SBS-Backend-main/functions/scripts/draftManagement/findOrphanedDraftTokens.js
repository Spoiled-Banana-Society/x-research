const db = require('../../services/db');

/**
 * NOTE: 
 */


(async () => {
    const allDraftTokens = await db.readAllDocuments("draftTokens")
    allDraftTokens.forEach(d => {
      if (d.LeagueId && !d.Roster.QB) {
        console.log(d.LeagueId)
        console.log(d.CardId)
      }
    })
})()