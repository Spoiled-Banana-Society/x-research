const db = require('../../services/db');
const { regenerateImageForTokenId } = require('../cardScripts/regenerate-card-img');

/**
 * NOTE: REMOVE DRAFT
 */


const JACKPOT_DRAFT_IDS = [
  "2025-fast-draft-1106"
];

const HOF_DRAFT_IDS = [
  "2025-fast-draft-1064",
  "2025-fast-draft-1067"
];

const STANDARD_DRAFT_IDS = [
  "2025-fast-draft-524",
  "2025-fast-draft-729"
];

(async () => {
    const t = ["Hall of Fame", "Jackpot", "Pro"]
    const ids = [HOF_DRAFT_IDS, JACKPOT_DRAFT_IDS, STANDARD_DRAFT_IDS]

    for (let i=0; i<t.length; i++) {
      const level = t[i]
      const draftIds = ids[i]

      for (let dtId = 0; dtId < draftIds.length; dtId++) {
        const id = draftIds[dtId]
        const draft = await db.readDocument("drafts", id)

        console.log(id)

        draft.Level = level
        await db.createOrUpdateDocument("drafts", id, draft)

        for (let oIdx = 0; oIdx < draft.CurrentUsers.length; oIdx++) {
          const ownerObj = draft.CurrentUsers[oIdx]
          const draftTokenId = ownerObj.TokenId
          console.log(draftTokenId)

          const dt = await db.readDocument("draftTokens", draftTokenId)
          dt.Level = level

          await db.createOrUpdateDocument("draftTokens", draftTokenId, dt)

          const dtMeta = await db.readDocument("draftTokenMetadata", draftTokenId)
          let index = -1
          dtMeta.Attributes.forEach((att, i) => {
            if (att.Trait_Type === "LEVEL" || att.Trait_Level === "LEVEL") {
              index = i
            }
          })

          if (index >= 0) {
            dtMeta.Attributes[index] = {
              Trait_Type: "LEVEL",
              Value: level
            }
          }

          await db.createOrUpdateDocument("draftTokenMetadata", draftTokenId, dtMeta)

          // make new image
          await regenerateImageForTokenId(draftTokenId)
        }

      }
    }
})()