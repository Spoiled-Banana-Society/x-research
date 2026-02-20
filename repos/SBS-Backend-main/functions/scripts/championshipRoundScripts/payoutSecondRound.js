const db = require('../../services/db');

const payoutTopLeagueAfterRound2 = async () => {
    const prizeAmount = 20;
    const leaderboard = await db.getChampionshipRoundLeaderboard('2023REG-16', 'Season', 'Pro');
    for(let i = 0; i < leaderboard.length; i++) leaderboard[i].rank = i + 1;

    // pay out people with ranks in the range of x >= 51 && x <= 100
    for(let i = 0; i < leaderboard.length; i++) {
        const cardId = leaderboard[i].cardId;
        if(leaderboard[i].rank > 25 && leaderboard[i].rank <= 50) {
            console.log(`Paying out card ${cardId} at a rank of ${leaderboard[i].rank}`)
            const card = await db.readDocument('cards', cardId);
            if(card.prizes && card.prizes.ape) {
                card.prizes.ape = parseFloat((card.prizes.ape + prizeAmount).toFixed(4));
                console.log(`Updated prize amount to ${card.prizes.ape}`)
            } else {
                card.prizes = { 
                    ape: prizeAmount
                }
                console.log(`Updated prize amount to ${card.prizes.ape}`)
            }
            await db.createOrUpdateDocument('cards', cardId, card, true);
            console.log(`Updated card ${cardId} in db`)
        }
    }
}

const payoutBottomLeagueAfterRound2 = async () => {
    const prizeAmount = 15;
    const leaderboard = await db.getChampionshipRoundLeaderboard('2023REG-16', 'Season', 'Bottom');
    //console.log(leaderboard)
    for(let i = 0; i < leaderboard.length; i++) leaderboard[i].rank = i + 1;

    // pay out people with ranks in the range of x >= 51 && x <= 100
    for(let i = 0; i < leaderboard.length; i++) {
        const cardId = leaderboard[i].cardId;
        console.log(leaderboard[i].rank)
        if(leaderboard[i].rank > 25 && leaderboard[i].rank <= 50) {
            console.log(`Paying out card ${cardId} at a rank of ${leaderboard[i].rank}`)
            const card = await db.readDocument('cards', cardId);
            if(card.prizes && card.prizes.ape) {
                card.prizes.ape = parseFloat((card.prizes.ape + prizeAmount).toFixed(4));
                console.log(`Updated prize amount to ${card.prizes.ape}`)
            } else {
                card.prizes = { 
                    ape: prizeAmount
                }
                console.log(`Updated prize amount to ${card.prizes.ape}`)
            }
            await db.createOrUpdateDocument('cards', cardId, card, true);
            console.log(`Updated card ${cardId} in db`)
        }
    }
}

(async () => {
    console.log('starting')
    await payoutTopLeagueAfterRound2();
    // console.log('halfway')
    await payoutBottomLeagueAfterRound2();
    console.log('done')
})();