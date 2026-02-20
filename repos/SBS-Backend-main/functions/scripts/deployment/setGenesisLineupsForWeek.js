const db = require('../../services/db');

const createLineupAndUpdateGenesisCard = async (cardId) => {
    const card = await db.readDocument('cards', cardId);
    const week10Lineup = await db.readDocument(`leagues/genesis/cards/${cardId}/lineups`, '2022-REG-17')

    week10Lineup.gameWeek = '2023REG-01';
    week10Lineup.prevWeekSeasonScore = 0;
    week10Lineup.scoreSeason = 0;
    week10Lineup.scoreWeek = 0;

    await db.createOrUpdateDocument(`leagues/genesis/cards/${cardId}/lineups`, '2023REG-01', week10Lineup, false);
    await db.createOrUpdateDocument('leagues/genesis/cards', cardId, card, false)
    await db.createOrUpdateDocument(`owners/${card._ownerId}/cards`, cardId, card, false)  
    
    const leaderboardObj = await db.readDocument('genesisLeaderboard/2022-REG-17/cards', cardId)
    leaderboardObj.card = card;
    leaderboardObj.scoreSeason = 0;
    leaderboardObj.scoreWeek = 0;
    leaderboardObj.lineup = week10Lineup;

    await db.createOrUpdateDocument('genesisLeaderboard/2023REG-01/cards', cardId, leaderboardObj, false)
    console.log(`Updated Card ${cardId} in leagues and leaderboard`)
}

(async () => {
    for(let i = 6253; i < 10000; i++) {
        const cardId = `${i}`;
        await createLineupAndUpdateGenesisCard(cardId)
    }
    console.log('done')
})()