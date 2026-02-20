const db = require('../../services/db');

const payoutTop100 = async () => {
    const leaderboard = await db.getChampionshipRoundLeaderboard('2024REG-17', 'Season', 'Pro');
    for(let i = 0; i < leaderboard.length; i++) leaderboard[i].rank = i + 1;

    for(let i = 0; i < leaderboard.length; i++) {
        const cardId = leaderboard[i].cardId;
        const obj = leaderboard[i];
        let prize = 0;
        if(obj.rank == 1) {
            console.log('BIG WINNER SO THEY WILL GET AN NFT AND NOT PAID OUT')
            continue;
        } 
        else if (obj.rank == 2) {
           prize = 500;
        } 
        else if (obj.rank == 3) {
            prize = 300;
        } else if (obj.rank == 4) {
            prize = 200;
        } else if (obj.rank == 5) {
            prize = 100;
        } else if (obj.rank == 6) {
            prize = 75;
        } else if (obj.rank == 7) {
            prize = 65;
        } else if (obj.rank == 8) {
            prize = 50;
        } else if (obj.rank == 9) {
            prize = 40;
        } else if (obj.rank == 10) {
            prize = 35;
        } else if (obj.rank >= 11 && obj.rank <= 25) {
            prize = 25;
        }
        console.log(`Paying out card ${cardId} at a rank of ${leaderboard[i].rank}`)
        const card = await db.readDocument('cards', cardId);
        if(card.prizes && card.prizes.ape) {
            card.prizes.ape = parseFloat((card.prizes.ape + prize).toFixed(4));
            console.log(`Updated prize amount to ${card.prizes.ape}`)
        } else if (card.prizes && card.prizes.ape) {
            card.prizes.ape = prize
        } else {
            card.prizes = { 
                ape: prize
            }
            console.log(`Updated prize amount to ${card.prizes.ape}`)
        }
        await db.createOrUpdateDocument('cards', cardId, card, true);
        console.log(`Updated card ${cardId} in db`)
    }
}

const payoutBottom100 = async () => {
    const leaderboard = await db.getChampionshipRoundLeaderboard('2024REG-17', 'Season', 'Bottom');
    for(let i = 0; i < leaderboard.length; i++) leaderboard[i].rank = i + 1;

    for(let i = 0; i < leaderboard.length; i++) {
        const cardId = leaderboard[i].cardId;
        const obj = leaderboard[i];
        let prize = 0;
        if(obj.rank == 1) {
            prize = 500;
        } else if (obj.rank == 2) {
            prize = 150;
        } else if (obj.rank == 3) {
            prize = 100;
        } else if (obj.rank == 4) {
            prize = 80;
        } else if (obj.rank == 5) {
            prize = 70;
        } else if (obj.rank == 6) {
            prize = 50;
        } else if (obj.rank == 7) {
            prize = 40;
        } else if (obj.rank == 8) {
            prize = 35;
        } else if (obj.rank == 9) {
            prize = 30;
        } else if (obj.rank == 10) {
            prize = 25;
        } else if (obj.rank >= 11 && obj.rank <= 25) {
            prize = 20;
        }
        console.log(`Paying out card ${cardId} at a rank of ${leaderboard[i].rank}`)
        const card = await db.readDocument('cards', cardId);
        if(card.prizes && card.prizes.ape) {
            card.prizes.ape = parseFloat((card.prizes.ape + prize).toFixed(4));
            console.log(`Updated prize amount to ${card.prizes.ape}`)
        } else if (card.prizes && card.prizes.ape) {
            card.prizes.ape = prize
        } else {
            card.prizes = { 
                ape: prize
            }
            console.log(`Updated prize amount to ${card.prizes.ape}`)
        }
        await db.createOrUpdateDocument('cards', cardId, card, true);
        console.log(`Updated card ${cardId} in db`)
    }
}

const payoutHOF = async () => {
    const leaderboard = await db.getChampionshipRoundLeaderboard('2024REG-17', 'Season', 'Hall of Fame');
    for(let i = 0; i < leaderboard.length; i++) leaderboard[i].rank = i + 1;

    for(let i = 0; i < leaderboard.length; i++) {
        const cardId = leaderboard[i].cardId;
        const obj = leaderboard[i];
        let prize = 0;
        if(obj.rank == 1) {
            console.log('Wins an NFT');
            continue;
        } else if (obj.rank == 2) {
            prize = 300;
        } else if (obj.rank == 3) {
            prize = 150;
        } else if (obj.rank == 4) {
            prize = 100;
        } else if (obj.rank == 5) {
            prize = 75;
        } else if (obj.rank == 6) {
            prize = 50;
        } else if (obj.rank == 7) {
            prize = 40;
        } else if (obj.rank == 8) {
            prize = 30;
        } else if (obj.rank == 9) {
            prize = 20;
        } else if (obj.rank == 10) {
            prize = 10;
        } else {
            continue;
        }
        console.log(`Paying out card ${cardId} at a rank of ${leaderboard[i].rank}`)
        const card = await db.readDocument('cards', cardId);
        if(card.prizes && card.prizes.ape) {
            card.prizes.ape = parseFloat((card.prizes.ape + prize).toFixed(4));
            console.log(`Updated prize amount to ${card.prizes.ape}`)
        } else if (card.prizes && card.prizes.ape) {
            card.prizes.ape = prize
            console.log(`Updated prize amount to ${card.prizes.ape}`)
        } else {
            card.prizes = { 
                ape: prize
            }
            console.log(`Updated prize amount to ${card.prizes.ape}`)
        }
        await db.createOrUpdateDocument('cards', cardId, card, true);
        console.log(`Updated card ${cardId} in db`)
    }
}

const payoutSpoiled = async () => {
    const leaderboard = await db.getChampionshipRoundLeaderboard('2024REG-17', 'Season', 'Spoiled');
    for(let i = 0; i < leaderboard.length; i++) leaderboard[i].rank = i + 1;

    for(let i = 0; i < leaderboard.length; i++) {
        const cardId = leaderboard[i].cardId;
        const obj = leaderboard[i];
        let prize = 0;
        if(obj.rank == 1) {
            console.log('Wins an NFT');
            continue;
        } else if (obj.rank == 2) {
            prize = 100;
        } else if (obj.rank == 3) {
            prize = 66;
        } else if (obj.rank == 4) {
            prize = 50;
        } else if (obj.rank == 5) {
            prize = 40;
        } else if (obj.rank == 6) {
            prize = 33;
        } else if (obj.rank == 7) {
            prize = 25;
        } else if (obj.rank == 8) {
            prize = 20;
        } else if (obj.rank == 9) {
            prize = 15;
        } else if (obj.rank == 10) {
            prize = 10;
        } else {
            continue;
        }
        console.log(`Paying out card ${cardId} at a rank of ${leaderboard[i].rank}`)
        const card = await db.readDocument('cards', cardId);
        if(card.prizes && card.prizes.ape) {
            card.prizes.ape = parseFloat((card.prizes.ape + prize).toFixed(4));
            console.log(`Updated prize amount to ${card.prizes.ape}`)
        } else if (card.prizes && card.prizes.ape) {
            card.prizes.ape = prize
            console.log(`Updated prize amount to ${card.prizes.ape}`)
        } else {
            card.prizes = { 
                ape: prize
            }
            console.log(`Updated prize amount to ${card.prizes.ape}`)
        }
        await db.createOrUpdateDocument('cards', cardId, card, true);
        console.log(`Updated card ${cardId} in db`)
    }
}

(async () => {
    await payoutTop100();
    await payoutBottom100();
    await payoutHOF();
    await payoutSpoiled();
})()