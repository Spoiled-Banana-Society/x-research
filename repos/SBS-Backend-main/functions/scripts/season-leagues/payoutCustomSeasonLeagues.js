const db = require('../../services/db');
const { getIrrelevantLeagueStrings } = require('../../services/utils');

const getCustomSeasonLeagueIds = async () => {
    let leagueIds = await db.readAllDocumentIds('leagues');
    leagueIds = leagueIds.filter(x => x.indexOf('Season') != -1 || x.indexOf('PROMO') != -1);
    return leagueIds;
}

const payoutCustomSeasonLeagues = async () => {
    const leaguesWithNoResults = [];
    const gameweek = '2022-REG-17';
    let goodLeagues = 0;
    let emptyLeagues = 0;
    let nonCoinLeagues = [];
    let totalPaidOut = 0;
    const problems = [];
    const leagueIds = await getCustomSeasonLeagueIds();
    const totalLeagues = leagueIds.length;
    for(let i = 0; i < leagueIds.length; i++) {
        const leagueId = leagueIds[i];
        
        const league = await db.readDocument('leagues', leagueId);
        if(!league) {
            console.log(`found a league without a document: ${leagueId}`);
            continue;
        } else {
            console.log(leagueId)
        }
        if(league.game.currentPlayers < league.game.minPlayers) {
            emptyLeagues++;
            console.log(`${leagueId} did not reach min number of players`);
            continue;
        }
        if (league.prize.coin.isCoinPrize == false) {
            nonCoinLeagues.push(leagueId);
            console.log(`${leagueId} is not a coin payout league so we are skipping them and will add this to the array of special payout leagues`);
            continue;
        }

        const results = await db.readDocument(`leagues/${leagueId}/results`, gameweek);
        if(!results) {
            leaguesWithNoResults.push(leagueId);
            continue;
        }
        if(league.prize.coin.numPlacesPaid == 1) {
            const winnerCardId = results.season[0].cardId;
            const prize = parseFloat(((league.entry.fee * league.game.currentPlayers) * 0.9).toFixed(4));
            console.log(prize)

            const card = await db.readDocument('cards', winnerCardId);
            if(card.prizes && card.prizes.ape) {
                card.prizes.ape = parseFloat((card.prizes.ape + prize).toFixed(4));
                console.log(`Updated prize amount to ${card.prizes.ape}`)
            } else if (card.prizes && card.prizes.eth && !card.prizes.ape) {
                card.prizes.ape = prize
                console.log(`Updated prize amount to ${card.prizes.ape}`)
            } else {
                card.prizes = { 
                    ape: prize
                }
                console.log(`Updated prize amount to ${card.prizes.ape}`)
            }
            totalPaidOut = parseFloat((totalPaidOut + prize).toFixed(4))
            await db.createOrUpdateDocument('cards', winnerCardId, card, true);
            console.log(`Updated card ${winnerCardId} in db`)
        } else if (league.prize.coin.numPlacesPaid == 3) {
            for(let i = 0; i < 3; i++) {
                const cardId = results.season[i].cardId;
                const percentage = parseFloat((Number(league.prize.coin.placesPaid[i].potPercentage) / 100).toFixed(2));
                const prize = parseFloat((percentage * ((league.entry.fee * league.game.currentPlayers) * 0.9)).toFixed(4));
                console.log(prize)
                const card = await db.readDocument('cards', cardId);
                if(card.prizes && card.prizes.ape) {
                    card.prizes.ape = parseFloat((card.prizes.ape + prize).toFixed(4));
                    console.log(`Updated prize amount to ${card.prizes.ape}`)
                } else if (card.prizes && card.prizes.eth && !card.prizes.ape) {
                    card.prizes.ape = prize
                    console.log(`Updated prize amount to ${card.prizes.ape}`)
                } else {
                    card.prizes = { 
                        ape: prize
                    }
                    console.log(`Updated prize amount to ${card.prizes.ape}`)
                }
                totalPaidOut = parseFloat((totalPaidOut + prize).toFixed(4))
                await db.createOrUpdateDocument('cards', cardId, card, true);
                console.log(`Updated card ${cardId} in db`)
            }
        } else if (league.prize.coin.numPlacesPaid == 5) {
            for(let i = 0; i < 3; i++) {
                const cardId = results.season[i].cardId;
                const percentage = parseFloat((Number(league.prize.coin.placesPaid[i].potPercentage) / 100).toFixed(2));
                const prize = parseFloat((percentage * ((league.entry.fee * league.game.currentPlayers) * 0.9)).toFixed(4));
                console.log(prize)
                const card = await db.readDocument('cards', cardId);
                if(card.prizes && card.prizes.ape) {
                    card.prizes.ape = parseFloat((card.prizes.ape + prize).toFixed(4));
                    console.log(`Updated prize amount to ${card.prizes.ape}`)
                } 
                else if (card.prizes && card.prizes.eth && !card.prizes.ape) {
                    card.prizes.ape = prize
                    console.log(`Updated prize amount to ${card.prizes.ape}`)
                } else {
                    card.prizes = { 
                        ape: prize
                    }
                    console.log(`Updated prize amount to ${card.prizes.ape}`)
                }
                totalPaidOut = parseFloat((totalPaidOut + prize).toFixed(4))
                if(card.prizes.ape < 0) {
                    problems.push(cardId)
                }
                await db.createOrUpdateDocument('cards', cardId, card, true);
                console.log(`Updated card ${cardId} in db`)
            }
        }
        goodLeagues++;
    }

    console.log(`Good Leagues: ${goodLeagues}/${totalLeagues}`)
    console.log(`Empty Leagues: ${emptyLeagues}/${totalLeagues}`)
    console.log(`Non coin leagues: ${nonCoinLeagues.length}/${totalLeagues}`)
    console.log(`Total Paid Out: ${totalPaidOut} ape`)
    console.log(leaguesWithNoResults)
}

(async () => {
    await payoutCustomSeasonLeagues()
})()