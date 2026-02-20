const { readAllDocumentIds } = require("../../services/db");
const db = require("../../services/db");

(async () => {
    const leagueIds = await db.readAllDocumentIds('leagues')
    const res = [];
    for (let i = 0; i < leagueIds.length; i++) {
        const cardIds = await db.readAllDocumentIds(`leagues/${leagueIds[i]}/cards`);
        for (let j = 0; j < cardIds.length; j++) {
            const cardId = cardIds[j];
            const card = await db.readDocument(`cards`, cardId);
            await db.createOrUpdateDocument(`leagues/${leagueIds[i]}/cards`, cardId, card, false)
            console.log(`Updated card: ${cardId} in ${leagueIds[i]}`)
        }
    }
})();