const db = require('../../services/db');

/**
 * NOTE: 
 */


(async () => {
    const drafts = await db.readAllDocuments("drafts")

    const allDraftTokens = await db.readAllDocuments("draftTokens")
    allDraftTokens.forEach(draftToken => {
      if (!draftToken.LeagueId) return
      const _d = drafts.find(d => d.LeagueId === draftToken.LeagueId)
      if (!_d || _d.level) {
        console.log(draftToken.LeagueId)
      }
      else if (_d.Level != draftToken.Level) {
        console.log(`MISMATCHED TOKEN ${draftToken.CardId} IN DRAFT ${_d.LeagueId}`)
      }
    })
})()