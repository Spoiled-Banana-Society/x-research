const db = require('../../services/db');

/**
 * NOTE: 
 */


(async () => {
    const allDrafts = await db.readAllDocuments("drafts")
    allDrafts.forEach(d => {
      if (!d.IsLocked) {
        console.log(d.LeagueId)
      }
    })
})()