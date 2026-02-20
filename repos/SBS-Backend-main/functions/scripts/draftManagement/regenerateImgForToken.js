const db = require('../../services/db');
const { regenerateImageForTokenId } = require('../cardScripts/regenerate-card-img');

(async () => {
  const allDraftTokens = await db.readAllDocuments("draftTokens")
  console.log(allDraftTokens.length)
  for (let i=0; i < allDraftTokens.length; i++) {
    const draftToken = allDraftTokens[i]
    console.log(draftToken.CardId)
    if (draftToken.LeagueId && draftToken.CardId > "3767") {
      await regenerateImageForTokenId(draftToken.CardId)
    }
  }
})()

