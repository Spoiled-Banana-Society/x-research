const db = require('../../services/db');
const utils = require('../../services/utils');

(async () => {
    // const weekStrings = utils.getStringsForCurrentWeek2022('2022-REG-16');
    let apeInOwners = 0;
    let ethInOwners = 0;
    const ownerIds = await db.readAllDocumentIds('owners');
    for (let i = 0; i < ownerIds.length; i++) {
        const owner = await db.readDocument('owners', ownerIds[i]);
        if(!owner) {
            //console.log(`${ownerIds[i]} does not have an owner object`)
            continue;
        }
        if(isNaN(Number(owner.availableCredit))) {
            //console.log("Not a number: " + owner.availableCredit)
            continue
        }
        apeInOwners = parseFloat((apeInOwners + Number(owner.availableCredit)).toFixed(4));

        if(isNaN(Number(owner.availableEthCredit))) {
            //console.log("Not a number: " + owner.availableEthCredit)
            continue
        }
        ethInOwners = parseFloat((ethInOwners + Number(owner.availableEthCredit)).toFixed(4));
    }
    console.log('FInished looking through owners')
    console.log(`Owners summary.... ape: ${apeInOwners}, eth: ${ethInOwners}`);

    // let totalApeInLeagues = 0;
    // let leagueIds = await db.readAllDocumentIds('leagues');
    
    // leagueIds = leagueIds.filter(leagueId => leagueId != 'genesis' && (leagueId.indexOf('Season') != -1 || leagueId.indexOf(weekStrings[1]) != -1 || leagueId.indexOf('PROMO') != -1));
    const paymentInfo = [];
    // for(let i = 0; i < leagueIds.length; i++) {
    //     const league = await db.readDocument('leagues', leagueIds[i]);
    //     if (Number(league.game.minPlayers) > Number(league.game.currentPlayers)) {
    //         console.log("This league is epmty or not full so they have been refunded")
    //         continue;
    //     }
    //     const entryFee = Number(league.entry.fee);
    //     console.log("entry fee: " + entryFee)
    //     const numPlayers = Number(league.game.currentPlayers)
    //     console.log("current players: " + numPlayers)
    //     totalApeInLeagues = parseFloat((totalApeInLeagues + (entryFee * numPlayers)).toFixed(4))
    //     console.log(totalApeInLeagues) 
    //     paymentInfo.push({ leagueId: leagueIds[i], totalPlayers: numPlayers, entryFee: entryFee, leaguePot: (entryFee * numPlayers) })
    // }

    // console.log('Done looking through custom leagues')
    // console.log(`Total ape in leagues: ${totalApeInLeagues}`)

    let totalEthInWithdrawals = 0;
    let totalApeInWithdrawals = 0;
    const txs = await db.readAllDocumentIds('withdrawalRequests');
    for(let i = 0; i < txs.length; i++) {
        const txId = txs[i];
        const tx = await db.readDocument('withdrawalRequests', txId);
        if(tx.sentToTeam == false) {
            if(tx.coinWithdrawn == 'eth') {
                totalEthInWithdrawals = parseFloat((totalEthInWithdrawals + tx.amountWithdrawn).toFixed(4));
                //console.log(totalEthInWithdrawals);
            } else if (tx.coinWithdrawn == 'ape') {
                totalApeInWithdrawals = parseFloat((totalApeInWithdrawals + tx.amountWithdrawn).toFixed(4));
                //console.log(totalApeInWithdrawals);
            }
        }
    }

    console.log(`Total ape in withdrawals: ${totalApeInWithdrawals}`)

    let cardsApe = 0;
    let cardsEth = 0;
    for(let i = 0; i < 10000; i++) {
        const cardId = `${i}`;
        const card = await db.readDocument('cards', cardId);
        if(card.prizes) {
            if(card.prizes.eth && card.prizes.eth > 0) {
                cardsEth = parseFloat((card.prizes.eth + cardsEth).toFixed(4));
            }
            if(card.prizes.ape && card.prizes.ape > 0) {
                cardsApe = parseFloat((cardsApe + card.prizes.ape).toFixed(4))
            }
        }
    }

    console.log(`Total ape on genesis cards: ${cardsApe}`);
    console.log(`Total Eth on genesis Cards: ${cardsEth}`);

    let playoffCardsApe = 0;
    let playoffCardsEth = 0;

    for(let i = 0; i < 12393; i++) {
        const cardId = `${i}`;
        const card = await db.readDocument('playoffCards', cardId);
        if(card.prizes) {
            if(card.prizes.eth && card.prizes.eth > 0) {
                playoffCardsEth = parseFloat((card.prizes.eth + playoffCardsEth).toFixed(4));
            }
            if(card.prizes.ape && card.prizes.ape > 0) {
                playoffCardsApe = parseFloat((playoffCardsApe + card.prizes.ape).toFixed(4))
            }
        }
    }

    console.log(`Total ape on playoff cards: ${playoffCardsApe}`);
    console.log(`Total Eth on playoff Cards: ${playoffCardsEth}`);

    // console.log(paymentInfo)
    //console.log("ape in leagues: " + totalApeInLeagues)
    console.log(`ape in Owners: ${apeInOwners}`);
    console.log(`ape in withdrawals: ${totalApeInWithdrawals}`);
    console.log(`eth in owners: ${ethInOwners}`);
    console.log(`eth in withdrawals: ${totalEthInWithdrawals}`);

    console.log(`Total ape: ${parseFloat((apeInOwners + totalApeInWithdrawals + cardsApe + playoffCardsApe).toFixed(4))}`)
    console.log(`Total eth: ${parseFloat((ethInOwners + totalEthInWithdrawals + playoffCardsEth + cardsEth).toFixed(4))}`)


})();