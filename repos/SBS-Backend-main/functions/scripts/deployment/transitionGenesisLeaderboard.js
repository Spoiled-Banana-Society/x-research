const db = require('../../services/db');

(async () => {
    const gameweek = '2022-REG-17';
    const prevWeek = '2022-REG-16';
    for(let i = 0; i < 10000; i++) {
        const cardId = `${i}`;
        const obj = await db.readDocument(`genesisLeaderboard/${prevWeek}/cards`, cardId);
        obj.scoreWeek = 0;
        await db.createOrUpdateDocument(`genesisLeaderboard/${gameweek}/cards`, cardId, obj, false);
        console.log(`Created week 17 leaderboard for card ${cardId}`)
    }
})()