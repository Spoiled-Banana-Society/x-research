const db = require('../../services/db');
const sbs = require('../../services/sbs');
const utils = require('../../services/utils');


const fixOwnerLeaguesForOwner = async (ownerId) => {
    const owner = await db.readDocument('owners', ownerId);
    const ownedCards = await db.readAllDocumentIds(`owners/${ownerId}/cards`)
    owner.leagues = [];
    for(let i = 0; i < ownedCards.length; i++) {
        owner.leagues.push({ cardId: ownedCards[i], leagueId: 'genesis' })
    }
    let leagueIds = await db.readAllDocumentIds('leagues');
    leagueIds = leagueIds.filter(item => item != 'genesis');

    for(let i = 0; i < leagueIds.length; i++) {
        const leagueType = (leagueIds[i].split('('))[0];
        if(leagueType == "Weekly") {
            const splitArr = leagueIds[i].split('-');
            if(splitArr[0] != 'Weekly(Thu Oct 20 2022 ') {
                console.log('found a week league not from this week')
                console.log(leagueIds[i])
                continue;
            }
        }
        console.log('Looking through ' + leagueIds[i])
        const leagueCards = await db.readAllDocumentIds(`leagues/${leagueIds[i]}/cards`)
        let cardIsInLeague = false;
        let cardinleague;
        for(let j = 0; j < ownedCards.length; j++) {
            if(leagueCards.includes(ownedCards[j])) {
                cardIsInLeague = true;
                cardinleague = ownedCards[j];
                console.log('found card ' + ownedCards[j] + ' in league')
            }
        }
        if(cardIsInLeague) {
            owner.leagues.push({ cardId: cardinleague, leagueId: leagueIds[i] })
        }
    }
    await db.createOrUpdateDocument('owners', ownerId, owner, false)
    return owner;
}

(async () => {
    const gameweek = sbs.getNFLWeekV2();
    console.log(gameweek)
    await utils.sleep(5000)
    for (let i = 5020; i < 10000; i++) {
        const cardId = `${i}`;
        console.log(`start updating all card subcollections for card ${cardId}`)
        const card = await db.readDocument('cards', cardId);
        let owner = await db.readDocument('owners', card._ownerId);
        if(!owner) {
            console.log(`Card ${cardId} owner did return an owner address at owners/${card._ownerId}`)
            continue;
        }
        if(!owner.leagues) {
            console.log(`Fixing owner.leagues for ${card._ownerId}`)
            owner = await fixOwnerLeaguesForOwner(card._ownerId);
        }
        // Update Leagues Cards subcollection
        const leagues = owner.leagues;
        const leaguesCardIsIn = leagues.filter(x => x.cardId == cardId)
        for(let i = 0; i < leaguesCardIsIn.length; i++) {
            const leagueId = leaguesCardIsIn[i].leagueId;
            await db.createOrUpdateDocument(`leagues/${leagueId}/cards`, cardId, card, false)
            console.log(`Updated card: ${cardId} in ${leagueId}`)
        }

        // Update Owners subcollection
        await db.createOrUpdateDocument(`owners/${card._ownerId}/cards`, cardId, card, false);

        // Update genesis leaderboard
        const leaderBoardObject = await db.readDocument(`genesisLeaderboard/${gameweek}/cards`, cardId)
        leaderBoardObject.card = card;

        await db.createOrUpdateDocument(`genesisLeaderboard/${gameweek}/cards`, cardId, leaderBoardObject, false)
        console.log(`Updated all card subcollections for card ${cardId}`)
    }
})();

