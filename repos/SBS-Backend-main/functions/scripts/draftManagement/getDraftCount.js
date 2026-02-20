const db = require('../../services/db');
const { regenerateImageForTokenId } = require('../cardScripts/regenerate-card-img');

(async () => {
  let cnt = 0
  const allDrafts = await db.readAllDocuments("drafts")
  for (let i=0; i < allDrafts.length; i++) {
    const draft = allDrafts[i]
    if (draft.IsLocked) {
      cnt += 1
    }
  }

  console.log(`Total leagues: ${cnt}`)
})()

