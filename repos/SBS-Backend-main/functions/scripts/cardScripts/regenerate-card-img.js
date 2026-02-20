const db = require('../../services/db');

/**
 * NOTE: REMOVE DRAFT
 */


const TOKEN_ID = 5306;

const regenerateImageForTokenId = async (tokenId) => {
  const token = await db.readDocument("draftTokens", String(tokenId));
  const tokenMetadata = await db.readDocument("draftTokenMetadata", String(tokenId))
  
  const userTokens = await fetch(`https://sbs-drafts-api-w5wydprnbq-uc.a.run.app/owner/${token.OwnerId}/draftToken/all`).then(r => r.json())

  const curToken = userTokens.active.find(t => t._cardId === String(tokenId))

  const body = {
		card: curToken,
	}

	// will need to call the image generation api to update imageUrl
	r = await fetch("https://us-central1-sbs-prod-env.cloudfunctions.net/draft-image-generator", {
    "method": 'POST',
    "body": JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' }
  }).then(r => r.json())

  console.log(r._imageUrl)
  token.ImageUrl = r._imageUrl
  tokenMetadata.Image = r._imageUrl
	
  await db.createOrUpdateDocument("draftTokens", String(tokenId), token)
  await db.createOrUpdateDocument("draftTokenMetadata", String(tokenId), tokenMetadata)

  return {"success": true}
}

// (async () => {
//   await regenerateImageForTokenId(TOKEN_ID)
// })()

module.exports = {
  regenerateImageForTokenId
}