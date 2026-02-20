const db = require('../../services/db');

(async () => {
    const res = await db.readDocument('playerStats2025', 'playerMap');
    const newPlayerMap = {}
    
    const playerMap = res.players;
    for (let [key, value] of Object.entries(playerMap)) {
        newPlayerMap[key] = {
            ADP: 0,
            byeWeek: value.byeWeek,
            playerId: key,
            playersFromTeam: value.playersFromTeam,
        }
    }

    console.log(newPlayerMap)
    await db.createOrUpdateDocument('playerStats2025', 'playerMap', { players: newPlayerMap }, false)
})()

(async () => {
    const ownerIds = await db.readAllDocumentIds('promoCodes')
    for (let i = 0; i < ownerIds.length; i++) {
        const ownerId = ownerIds[i];
        await db.deleteDocument('promoCodes', ownerId)
    }
})()