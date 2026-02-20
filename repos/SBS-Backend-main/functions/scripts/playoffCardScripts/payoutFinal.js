const db = require('../../services/db');

const payoutAllPlayoffCards = async () => {
    const leaderboard = await db.getPlayoffLeaderboardV2('2022-PST-04', 'Season', 'Pro');
    for(let i = 0; i < 50; i++) {
        const rank = i + 1;
        const card = await db.readDocument('playoffCards', leaderboard[i].cardId);
        let prize = 0;
        if(rank == 1) {
            prize = 700;
        } else if(rank == 2) {
            prize = 300;
        } else if(rank == 3) {
            prize = 200;
        } else if(rank == 4) {
            prize = 150;
        } else if(rank == 5) {
            prize = 125;
        } else if(rank == 6) {
            prize = 80;
        } else if(rank == 7) {
            prize = 60;
        } else if(rank == 8) {
            prize = 50;
        } else if(rank == 9) {
            prize = 35;
        } else if(rank == 10) {
            prize = 25;
        } else if(rank > 10 && rank < 26) {
            prize = 10;
        } else if(rank > 25 && rank < 51) {
            prize = 5;
        }

        if(card.prizes && card.prizes.ape) {
            card.prizes.ape = parseFloat((Number(card.prizes.ape) + prize).toFixed(4));
        } else {
            card.prizes = {
                ape: prize,
            }
        }

        const tx = {
            type: "prize-winner",
            league: "all playoff Cards 2022-2023",
            id: `allPlayoffWinner-${card._ownerId}`,
            prize: prize,
            rank: rank,
            cardId: card._cardId,
            ownerId: card._ownerId,
        }

        try {
            await db.createOrUpdateDocument('playoffCards', leaderboard[i].cardId, card, false);
            await db.createOrUpdateDocument(`playoffCards/${card._cardId}/transactions`, tx.id, tx, false)
            console.log(`Updated card ${leaderboard[i].cardId} who placed ${rank} and won ${prize} to bring their total ape to ${card.prizes.ape}`)
        } catch (err) {
            console.log(err)
        }
    }
}

const payoutMintedPlayoffCards = async () => {
    const leaderboard = await db.getPlayoffLeaderboardV2('2022-PST-04', 'Season', 'Minted');
    for(let i = 0; i < 100; i++) {
        const rank = i + 1;
        const card = await db.readDocument('playoffCards', leaderboard[i].cardId);
        let prize = 0;
        if(rank == 1) {
            console.log('They win an NFT card ' + leaderboard[i].cardId);
            continue;
        } else if(rank == 2) {
            prize = 4;
        } else if(rank == 3) {
            prize = 2.75;
        } else if(rank == 4) {
            prize = 2;
        } else if(rank == 5) {
            prize = 1.5;
        } else if(rank == 6) {
            prize = 1;
        } else if(rank == 7) {
            prize = 0.8;
        } else if(rank == 8) {
            prize = 0.6;
        } else if(rank == 9) {
            prize = 0.4;
        } else if(rank == 10) {
            prize = 0.3;
        } else if(rank > 10 && rank < 16) {
            prize = 0.2;
        } else if(rank > 15 && rank < 26) {
            prize = 0.1;
        } else if(rank > 25 && rank < 51) {
            prize = 0.06;
        } else if (rank > 50 && rank < 101) {
            prize = 0.05;
        }

        if(card.prizes && card.prizes.eth) {
            card.prizes.eth = parseFloat((Number(card.prizes.eth) + prize).toFixed(4));
        } else {
            card.prizes = {
                eth: prize,
            };
        }

        const tx = {
            type: "prize-winner",
            league: "minted playoff Cards 2022-2023",
            id: `mintedPlayoffWinner-${card._ownerId}`,
            prize: prize,
            rank: rank,
            cardId: card._cardId,
            ownerId: card._ownerId,
        }

        try {
            await db.createOrUpdateDocument('playoffCards', leaderboard[i].cardId, card, false);
            await db.createOrUpdateDocument(`playoffCards/${card._cardId}/transactions`, tx.id, tx, false)
            console.log(`Updated card ${leaderboard[i].cardId} who placed ${rank} and won ${prize} to bring their total eth to ${card.prizes.eth}`)
        } catch (err) {
            console.log(err)
        }
    }
}

const payoutHOFPlayoffCards = async () => {
    const leaderboard = await db.getPlayoffLeaderboardV2('2022-PST-04', 'Season', 'Hall of Fame');
    for(let i = 0; i < 5; i++) {
        const rank = i + 1;
        const card = await db.readDocument('playoffCards', leaderboard[i].cardId);
        let prize = 0;
        if(rank == 1) {
            prize = 250;
        } else if(rank == 2) {
            prize = 100;
        } else if(rank == 3) {
            prize = 75;
        } else if(rank == 4) {
            prize = 50;
        } else if(rank == 5) {
            prize = 25;
        } 

        if(card.prizes && card.prizes.ape) {
            card.prizes.ape = parseFloat((Number(card.prizes.ape) + prize).toFixed(4));
        } else {
            card.prizes = {
                ape: prize,
            }
        }

        const tx = {
            type: "prize-winner",
            league: "HOF playoff Cards 2022-2023",
            id: `hofPlayoffWinner-${card._ownerId}`,
            prize: prize,
            rank: rank,
            cardId: card._cardId,
            ownerId: card._ownerId,
        }

        try {
            await db.createOrUpdateDocument('playoffCards', leaderboard[i].cardId, card, false);
            await db.createOrUpdateDocument(`playoffCards/${card._cardId}/transactions`, tx.id, tx, false)
            console.log(`Updated card ${leaderboard[i].cardId} who placed ${rank} and won ${prize} to bring their total ape to ${card.prizes.ape}`)
        } catch (err) {
            console.log(err)
        }
    }
}


(async () => {
    await payoutAllPlayoffCards();
    await payoutMintedPlayoffCards();
    await payoutHOFPlayoffCards();
})()