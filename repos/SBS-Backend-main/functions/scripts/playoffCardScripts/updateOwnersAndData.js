const db = require('../../services/db');
const playoffCardContract = require('../../services/playoffCardContract');
const cardContract = require('../../services/cardContract');
const utils = require('../../services/utils');
const weekTransition = require('../../services/weekTransition');

const checkMintedCards = async () => {
    for(i = 10000; i < 11751; i++) {
        const cardId = `${i}`;
        console.log(cardId)
        const card = await db.readDocument('playoffCards', cardId);
        const contractCardOwner = await playoffCardContract.getOwnerByCardId(cardId);
        
        console.log(`db owner: ${card._ownerId}, contract owner: ${contractCardOwner}`);
        if(card._ownerId == null) {
            await db.createOrUpdateDocument('playoffCards', cardId, { _ownerId: contractCardOwner }, true);
            continue;
        }
        if(card._ownerId.toLowerCase() != contractCardOwner.toLowerCase()) {
            console.log('Owners did not match so we are updating the owner on card ' + cardId);
            card._ownerId = contractCardOwner;
            if(card._ownerId == 'unassigned') {
                console.log('FOund a card number with its owner unassigned: ' + cardId);
                break;
            }
            await db.createOrUpdateDocument('playoffCards', cardId, { _ownerId: contractCardOwner }, true);
        }
    }
}

const checkOwnersCards = async () => {
    for(i = 11000; i < 12000; i++) {
        const cardId = `${i}`;
        console.log(cardId)
        const card = await db.readDocument('playoffCards', cardId);
        let contractCardOwner;
        try {
            contractCardOwner = await playoffCardContract.getOwnerByCardId(cardId);
        } catch (err) {
            console.log(err);
            break;
        }
        
        console.log(`db owner: ${card._ownerId}, contract owner: ${contractCardOwner}`);
        if(card._ownerId == null) {
            await db.createOrUpdateDocument('playoffCards', cardId, { _ownerId: contractCardOwner }, true);
            continue;
        }
        if(card._ownerId.toLowerCase() != contractCardOwner.toLowerCase()) {
            console.log('Owners did not match so we are updating the owner on card ' + cardId);
            card._ownerId = contractCardOwner;
            await db.createOrUpdateDocument('playoffCards', cardId, { _ownerId: contractCardOwner }, true);
        }

        const owner = await db.readDocument('owners', card._ownerId);
        let noOwner = false;
        if(!owner) {
            console.log('No owner object was found')
            const defaultValues = {
                availableCredit: 0,
                leagues: [],
                pendingCredit: 0,
            }
            await db.createOrUpdateDocument(`owners`, card._ownerId, defaultValues, true);
            await db.createOrUpdateDocument(`owners/${card._ownerId}/playoffCards`, cardId, card, true)
            console.log(`Created an owner object for ${card._ownerId} and added card ${cardId} to his collection`);
            noOwner = true;
        } else {
            await db.createOrUpdateDocument(`owners/${card._ownerId}/playoffCards`, cardId, card, false)

        }

        if(!noOwner) {
            const cardInOwner = await db.readDocument(`owners/${card._ownerId}/playoffCards`, cardId);
            if(!cardInOwner) {
                await db.createOrUpdateDocument(`owners/${card._ownerId}/playoffCards`, cardId, card, true);
                console.log(`Added card to ${card._ownerId}'s collection`);
            }
        }
    } 
}

const updateLeaguesData = async () => {
    for(i = 10000; i < 12116; i++) {
        const cardId = `${i}`;
        //console.log(cardId);
        const card = await db.readDocument('playoffCards', cardId);
        let contractCardOwner;
        try {
            contractCardOwner = await playoffCardContract.getOwnerByCardId(cardId);
        } catch (err) {
            console.log(err);
            break;
        }
        
        //console.log(`db owner: ${card._ownerId}, contract owner: ${contractCardOwner}`);
        if(card._ownerId == null) {
            card._ownerId = contractCardOwner;
            await db.createOrUpdateDocument('playoffCards', cardId, { _ownerId: contractCardOwner }, true);
        }
        if(card._ownerId.toLowerCase() != contractCardOwner.toLowerCase()) {
            console.log('Owners did not match so we are updating the owner on card ' + cardId);
            card._ownerId = contractCardOwner;
            await db.createOrUpdateDocument('playoffCards', cardId, { _ownerId: contractCardOwner }, true);
        }
        const cardInMinted = await db.readDocument(`leagues/minted-playoffs-2022-2023/cards`, cardId);
        if(!cardInMinted) {
            await db.createOrUpdateDocument(`leagues/minted-playoffs-2022-2023/cards`, cardId, card, true);
            console.log(`Added card to minted league for ${cardId}`);
        }
        const cardInGenesis = await db.readDocument(`leagues/genesis-playoff-league/cards`, cardId);
        if(!cardInGenesis) {
            await db.createOrUpdateDocument(`leagues/genesis-playoff-league/cards`, cardId, card, true);
            console.log(`No card in genesis league for ${cardId} so adding it now`)
        }
        const genesisLineup = await db.readDocument(`leagues/genesis-playoff-league/cards/${cardId}/lineups`, '2022-PST-01');
        if(!genesisLineup) {
            const oldLineup = await db.readDocument(`leagues/genesis-playoff-league/cards/${cardId}/lineups`, '2022-PST-01');
            if(!oldLineup) {
                const gameweek = '2022-PST-01';
                const now = db._getTimeStamp()
                const lineup = {
                    starting: {
                    QB: [card.rosterWithTeams.QB[0]],
                    RB: [card.rosterWithTeams.RB[0], card.rosterWithTeams.RB[1]],
                    WR: [card.rosterWithTeams.WR[0], card.rosterWithTeams.WR[1], card.rosterWithTeams.WR[2]],
                    TE: [card.rosterWithTeams.TE[0]],
                    DST: [card.rosterWithTeams.DST[0]],
                    },
                    bench: {
                    QB: [card.rosterWithTeams.QB[1]],
                    RB: [card.rosterWithTeams.RB[2], card.rosterWithTeams.RB[3]],
                    WR: [card.rosterWithTeams.WR[3], card.rosterWithTeams.WR[4]],
                    TE: [card.rosterWithTeams.TE[1]],
                    DST: [card.rosterWithTeams.DST[1]],
                    } ,
                    _cardId: card._cardId,
                    _ownerId: card._ownerId,
                    _isLocked: false, 
                    _isDefault: true,
                    _isSetByCurrentOwner: false,
                    _createdAt: now,
                    _updatedAt: now,
                    gameWeek: gameweek,
                    prevWeekSeasonScore: 0,
                    scoreWeek: 0,
                    scoreSeason: 0,
                }
                lineup.startingTeamArr = weekTransition.createTeamStartingArrayForLineup(lineup)
                await db.createOrUpdateDocument(`leagues/genesis-playoff-league/cards/${cardId}/lineups`, '2022-PST-01', lineup, true)
                console.log(`Created lineup in genesis league for card ${cardId}`);
            } else {
                oldLineup.gameWeek = '2022-PST-01';
                await db.createOrUpdateDocument(`leagues/genesis-playoff-league/cards/${cardId}/lineups`, '2022-PST-01', oldLineup, true)
                console.log(`Created lineup in genesis league for card ${cardId}`);
            }
        }

        const mintedLineup = await db.readDocument(`leagues/minted-playoffs-2022-2023/cards/${cardId}/lineups`, '2022-PST-01');
        if(!mintedLineup) {
            const oldLineup = await db.readDocument(`leagues/minted-playoffs-2022-2023/cards/${cardId}/lineups`, '2022-PST-01');
            if(!oldLineup) {
                const gameweek = '2022-PST-01';
                const now = db._getTimeStamp()
                const lineup = {
                    starting: {
                    QB: [card.rosterWithTeams.QB[0]],
                    RB: [card.rosterWithTeams.RB[0], card.rosterWithTeams.RB[1]],
                    WR: [card.rosterWithTeams.WR[0], card.rosterWithTeams.WR[1], card.rosterWithTeams.WR[2]],
                    TE: [card.rosterWithTeams.TE[0]],
                    DST: [card.rosterWithTeams.DST[0]],
                    },
                    bench: {
                    QB: [card.rosterWithTeams.QB[1]],
                    RB: [card.rosterWithTeams.RB[2], card.rosterWithTeams.RB[3]],
                    WR: [card.rosterWithTeams.WR[3], card.rosterWithTeams.WR[4]],
                    TE: [card.rosterWithTeams.TE[1]],
                    DST: [card.rosterWithTeams.DST[1]],
                    } ,
                    _cardId: card._cardId,
                    _ownerId: card._ownerId,
                    _isLocked: false, 
                    _isDefault: true,
                    _isSetByCurrentOwner: false,
                    _createdAt: now,
                    _updatedAt: now,
                    gameWeek: gameweek,
                    prevWeekSeasonScore: 0,
                    scoreWeek: 0,
                    scoreSeason: 0,
                }
                lineup.startingTeamArr = weekTransition.createTeamStartingArrayForLineup(lineup)
                await db.createOrUpdateDocument(`leagues/minted-playoffs-2022-2023/cards/${cardId}/lineups`, '2022-PST-01', lineup, true)
                console.log(`NO lineup found in minted leagues so we created one for card ${cardId}`)
            } else {
                oldLineup.gameWeek = '2022-PST-01';
                await db.createOrUpdateDocument(`leagues/minted-playoffs-2022-2023/cards/${cardId}/lineups`, '2022-PST-01', oldLineup, true)
                console.log(`NO lineup found in minted leagues so we created one for card ${cardId}`)
            }
        }

        const genesisObj = await db.readDocument(`genesisPlayoffsLeaderboard/2022-PST-01/cards`, cardId);
        if(!genesisObj) {
            const lineup = await db.readDocument(`leagues/genesis-playoff-league/cards/${cardId}/lineups`, '2022-PST-01')
            const leaderboardObject = {
                card: card,
                lineup: lineup,
                scoreWeek: 0,
                scoreSeason: 0,
                cardId: cardId,
                level: card._level,
                ownerId: null,
            }
            await db.createOrUpdateDocument(`genesisPlayoffsLeaderboard/2022-PST-01/cards`, cardId, leaderboardObject, true);
            console.log(`Created leaderboard object in genesis for card ${cardId}`);
        }

        const mintedObj = await db.readDocument(`mintedPlayoffs2022Leaderboard/2022-PST-01/cards`, cardId);
        if(!mintedObj) {
            const lineup = await db.readDocument(`leagues/minted-playoffs-2022-2023/cards/${cardId}/lineups`, '2022-PST-01')
            const leaderboardObject = {
                card: card,
                lineup: lineup,
                scoreWeek: 0,
                scoreSeason: 0,
                cardId: cardId,
                level: card._level,
                ownerId: null,
            }
            await db.createOrUpdateDocument(`mintedPlayoffs2022Leaderboard/2022-PST-01/cards`, cardId, leaderboardObject, true);
            console.log(`Created leaderboard object in minted for card ${cardId}`);
        }
    }
}

const updateGenesisCards = async () => {
    for(let i = 0; i < 10000; i++) {
        const cardId = `${i}`;
        if(i % 1000 == 0) {
            console.log(cardId)
        }
        //console.log(cardId)
        const card = await db.readDocument('playoffCards', cardId);
        const cardInleague = await db.readDocument(`leagues/genesis-playoff-league/cards`, cardId);
        if(!cardInleague) {
            //await db.createOrUpdateDocument(`leagues/genesis-playoff-league/cards`, cardId, card, true);
            console.log(`Added card ${cardId} to genesis league`);
        }
        //await db.createOrUpdateDocument(`leagues/genesis-playoff-league/cards/${cardId}/lineups`, '2022-PST-01', { _ownerId: card._ownerId}, true);
        const cardInOwner = await db.readDocument(`owners/${card._ownerId}/playoffCards`, cardId);
        if(!cardInOwner) {
            //await db.createOrUpdateDocument(`owners/${card._ownerId}/playoffCards`, cardId, card, true);
            console.log(`Added card ${cardId} to owners card collection`);
        }

        const lineup = await db.readDocument(`leagues/genesis-playoff-league/cards/${cardId}/lineups`, '2022-PST-01');
        if(!lineup) {
            console.log('No lineup found for card ' + cardId)
            continue;
        }

        const obj = await db.readDocument('genesisPlayoffsLeaderboard/2022-PST-01/cards', cardId);
        if(!obj) {
            
            const leaderboardObject = {
                card: card,
                lineup: lineup,
                scoreWeek: 0,
                scoreSeason: 0,
                cardId: cardId,
                level: card._level,
                ownerId: null,
            }
            //await db.createOrUpdateDocument(`genesisPlayoffsLeaderboard/2022-PST-01/cards`, cardId, leaderboardObject, true);
            console.log(`Created leaderboard object in genesis for card ${cardId}`);
        }
    }
}

const updateCardsInLeague = async () => {
    for(i = 0; i < 15000; i++) {
        const cardId = `${i}`;
        console.log(cardId);
        const card = await db.readDocument('playoffCards', cardId);
        try {
            await db.createOrUpdateDocument(`leagues/genesis-playoff-league/cards`, cardId, card, false);
            if(Number(cardId) >= 10000) {
                await db.createOrUpdateDocument(`leagues/minted-playoffs-2022-2023/cards`, cardId, card, false);
            }
        } catch (err) {
            console.log(err)
        }
        
    }
}



const updateLineupShape = async () => {
    for(let i = 10000; i < 15000; i++) {
        const cardId = `${i}`;
        let lineup = await db.readDocument(`leagues/genesis-playoff-league/cards/${cardId}/lineups`, '2022-PST-01');
        if(!lineup) {
            console.log(`No lineup found for ${cardId}`);
            break;
        }
        if(lineup.startingTeamArr) {
            continue;
        }
        if(!lineup.starting) {
            const card = await db.readDocument('playoffCards', cardId)
            lineup.starting = {
                DST: [ card.rosterWithTeams.DST[0] ],
                QB: [ card.rosterWithTeams.QB[0] ],
                RB: [ card.rosterWithTeams.RB[0], card.rosterWithTeams.RB[1] ],
                TE: [ card.rosterWithTeams.TE[0] ],
                WR: [ card.rosterWithTeams.WR[0], card.rosterWithTeams.WR[1], card.rosterWithTeams.WR[2] ],
            }

            lineup.bench = {
                DST: [ card.rosterWithTeams.DST[1] ],
                QB: [ card.rosterWithTeams.QB[1] ],
                RB: [ card.rosterWithTeams.RB[2], card.rosterWithTeams.RB[3] ],
                TE: [ card.rosterWithTeams.TE[1] ],
                WR: [ card.rosterWithTeams.WR[3], card.rosterWithTeams.WR[4] ],
            }
        }
        console.log(cardId)
        const now = db._getTimeStamp();
        const newLineup = {
            starting: {
                QB: lineup.starting.QB,
                RB: lineup.starting.RB,
                WR: lineup.starting.WR,
                TE: lineup.starting.TE,
                DST: lineup.starting.DST,
            },
            bench: {
                QB: lineup.bench.QB,
                RB: lineup.bench.RB,
                WR: lineup.bench.WR,
                TE: lineup.bench.TE,
                DST: lineup.bench.DST,
            } ,
            _cardId: lineup._cardId,
            _ownerId: lineup._ownerId,
            _isLocked: false, 
            _isDefault: true,
            _isSetByCurrentOwner: false,
            _createdAt: now,
            _updatedAt: now,
            gameWeek: '2022-PST-01',
            prevWeekSeasonScore: 0,
            scoreWeek: 0,
            scoreSeason: 0,
        }
        newLineup.startingTeamArr = weekTransition.createTeamStartingArrayForLineup(lineup);
        try {
            await db.createOrUpdateDocument(`leagues/genesis-playoff-league/cards/${cardId}/lineups`, '2022-PST-01', newLineup, false);
            console.log(`Updated lineup for card ${cardId} in genesis league`);
            if(Number(cardId) >= 10000) {
                await db.createOrUpdateDocument(`leagues/minted-playoffs-2022-2023/cards/${cardId}/lineups`, '2022-PST-01', newLineup, false);
            }
        } catch (err) {
            console.log(err)
        }
    }
}

const updateLeaderboard = async () => {
    const gameweek = '2022-PST-01';
    const cardsNoOwner = [];
    for(let i = 0; i < 5000; i++) {
        const cardId = `${i}`;
        console.log(cardId)
        const card = await db.readDocument('playoffCards', cardId);
        if(card._ownerId == null) {
            if(i < 10000) {
                cardsNoOwner.push(cardId);
            } else {
                const contractOwner = await playoffCardContract.getOwnerByCardId(cardId);
                card._ownerId = contractOwner;
                await db.createOrUpdateDocument('playoffCards', cardId, card, false);
            }
        }

        const lineup = await db.readDocument(`leagues/genesis-playoff-league/cards/${cardId}/lineups`, '2022-PST-01');
        if(lineup._ownerId == null) {
            lineup._ownerId = card._ownerId;
            await db.createOrUpdateDocument(`leagues/genesis-playoff-league/cards/${cardId}/lineups`, '2022-PST-01', lineup, false)
        }

        const leaderboardObject = {
            card: card,
            lineup: lineup,
            scoreWeek: lineup.scoreWeek,
            scoreSeason: lineup.scoreSeason,
            cardId: cardId,
            level: card._level,
            ownerId: card._ownerId,
        }
        try {
            await db.createOrUpdateDocument('genesisPlayoffsLeaderboard/2022-PST-01/cards', cardId, leaderboardObject, false)
            if(Number(cardId) >= 10000) {
                await db.createOrUpdateDocument('mintedPlayoffs2022Leaderboard/2022-PST-01/cards', cardId, leaderboardObject, false)
            }
        } catch (err) {
            console.log(err)
        }
    }
    console.log(cardsNoOwner)
}


(async () => {
    await updateLeaderboard()
})()