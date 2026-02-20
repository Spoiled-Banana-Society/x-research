const { card } = require('../..');
const db = require('../../services/db');
const weekTransition = require('../../services/weekTransition');

const rankMap = new Map();
rankMap.set('AFC #1', 'KC');
rankMap.set('AFC #2', 'BUF');
rankMap.set('AFC #3', 'CIN');
rankMap.set('AFC #4', 'JAX');
rankMap.set('AFC #5', 'LAC');
rankMap.set('AFC #6', 'BAL');
rankMap.set('AFC #7', 'MIA');

rankMap.set('NFC #1', 'PHI');
rankMap.set('NFC #2', 'SF');
rankMap.set('NFC #3', 'MIN');
rankMap.set('NFC #4', 'TB');
rankMap.set('NFC #5', 'DAL');
rankMap.set('NFC #6', 'NYG');
rankMap.set('NFC #7', 'SEA');

const updateLineups = async () => {
    const leagueId = 'genesis-playoff-league';;
    const gameweek = '2022-PST-01';
    //const cardIds = await db.readAllDocumentIds(`leagues/${leagueId}/cards`);
    //let count = 0;
    //let length = cardIds.length;
    //for(let i = 0; i < 10000; i++) {
        const cardId = `300`;
        console.log(`mapping lineups for card 300 of 10000`);
        //const lineup = await db.readDocument(`leagues/${leagueId}/cards/${cardId}/lineups`, gameweek);
        const card = await db.readDocument('playoffCards', cardId);
        const startingLineup = {
            DST: [
                rankMap.get(card.DST[0])
            ],
            QB: [
                rankMap.get(card.QB[0])
            ],
            RB: [
                rankMap.get(card.RB[0]),
                rankMap.get(card.RB[1])
            ],
            TE: [
                rankMap.get(card.TE[0])
            ],
            WR: [
                rankMap.get(card.WR[0]),
                rankMap.get(card.WR[1]),
                rankMap.get(card.WR[2]),
            ],
        }
        const bench = {
            DST: [
                rankMap.get(card.DST[1])
            ],
            QB: [
                rankMap.get(card.QB[1])
            ],
            RB: [
                rankMap.get(card.RB[2]),
                rankMap.get(card.RB[3])
            ],
            TE: [
                rankMap.get(card.TE[1])
            ],
            WR: [
                rankMap.get(card.WR[3]),
                rankMap.get(card.WR[4]),
            ],
        }
        const now = db._getTimeStamp()
        const lineup = {
            starting: startingLineup,
            bench: bench,
            _cardId: '300',
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
        };
        lineup.startingTeamArr = weekTransition.createTeamStartingArrayForLineup(lineup)
        
        await db.createOrUpdateDocument(`leagues/${leagueId}/cards/${cardId}/lineups`, gameweek, lineup, true);
        console.log(`Updated lineup for card ${cardId} in leagues`)

        const leaderboardObj = await db.readDocument(`genesisPlayoffsLeaderboard/${gameweek}/cards`, cardId);
        leaderboardObj.lineup = lineup;
        await db.createOrUpdateDocument(`genesisPlayoffsLeaderboard/${gameweek}/cards`, cardId, leaderboardObj, false);

        card.rosterWithTeams = {
            QB: [...lineup.starting.QB, ...lineup.bench.QB],
            RB: [...lineup.starting.RB, ...lineup.bench.RB],
            TE: [...lineup.starting.TE, ...lineup.bench.TE],
            WR: [...lineup.starting.WR, ...lineup.bench.WR],
            DST: [...lineup.starting.DST, ...lineup.bench.DST]
        }
        await db.createOrUpdateDocument('playoffCards', cardId, card, true)

        //const mintedLineup = await db.readDocument(`leagues/minted-playoffs-2022-2023/cards/${cardId}/lineups`, gameweek);
        if(Number(cardId) >= 10000) {
            console.log(`We have found a minted card... card ${cardId}`)
            await db.createOrUpdateDocument(`leagues/minted-playoffs-2022-2023/cards/${cardId}/lineups`, gameweek, lineup, true);
            console.log(`Updated lineup for card ${cardId} in leagues`)

            const leaderboardObj = await db.readDocument(`mintedPlayoffs2022Leaderboard/${gameweek}/cards`, cardId);
            leaderboardObj.lineup = lineup;
            await db.createOrUpdateDocument(`mintedPlayoffs2022Leaderboard/${gameweek}/cards`, cardId, leaderboardObj, false);
        }
    //}
}

const updateMintedLineups = async () => {
    const genesisLeagueId = 'genesis-playoff-league';
    const mintedLeagueId = 'minted-playoffs-2022-2023';
    const gameweek = '2022-PST-01';
    //const cardIds = await db.readAllDocumentIds(`leagues/${mintedLeagueId}/cards`);
    let count = 0;
    let length = 15000;
    for(let i = 12308; i < 15000; i++) {
        const cardId = `${i}`;
        console.log(`mapping lineups for card ${i} of ${length}`);
        //const lineup = await db.readDocument(`leagues/${leagueId}/cards/${cardId}/lineups`, gameweek);
        const card = await db.readDocument('playoffCards', cardId);
        
        const startingLineup = {
            DST: [
                rankMap.get(card.DST[0])
            ],
            QB: [
                rankMap.get(card.QB[0])
            ],
            RB: [
                rankMap.get(card.RB[0]),
                rankMap.get(card.RB[1])
            ],
            TE: [
                rankMap.get(card.TE[0])
            ],
            WR: [
                rankMap.get(card.WR[0]),
                rankMap.get(card.WR[1]),
                rankMap.get(card.WR[2]),
            ],
        }
        const bench = {
            DST: [
                rankMap.get(card.DST[1])
            ],
            QB: [
                rankMap.get(card.QB[1])
            ],
            RB: [
                rankMap.get(card.RB[2]),
                rankMap.get(card.RB[3])
            ],
            TE: [
                rankMap.get(card.TE[1])
            ],
            WR: [
                rankMap.get(card.WR[3]),
                rankMap.get(card.WR[4]),
            ],
        }
        card.rosterWithTeams = {
            QB: [...startingLineup.QB, ...bench.QB],
            RB: [...startingLineup.RB, ...bench.RB],
            TE: [...startingLineup.TE, ...bench.TE],
            WR: [...startingLineup.WR, ...bench.WR],
            DST: [...startingLineup.DST, ...bench.DST]
        }
        await db.createOrUpdateDocument('playoffCards', cardId, card, true)
        if(card._ownerId == null) {
            console.log('No owner so continuing')
            continue;
        }
        const now = db._getTimeStamp()
        const lineup = {
            starting: startingLineup,
            bench: bench,
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
        };
        lineup.startingTeamArr = weekTransition.createTeamStartingArrayForLineup(lineup)
        
        await db.createOrUpdateDocument(`leagues/${genesisLeagueId}/cards/${cardId}/lineups`, gameweek, lineup, true);
        console.log(`Updated lineup for card ${cardId} in leagues`)

        let leaderboardObj = await db.readDocument(`genesisPlayoffsLeaderboard/${gameweek}/cards`, cardId);
        if(leaderboardObj) {
            leaderboardObj.lineup = lineup;
        } else {
            leaderboardObj = {
                card: card,
                lineup: lineup,
                scoreWeek: 0,
                scoreSeason: 0,
                cardId: cardId,
                level: card._level,
                ownerId: card._ownerId,
            }
        }
        await db.createOrUpdateDocument(`genesisPlayoffsLeaderboard/${gameweek}/cards`, cardId, leaderboardObj, false);

        

        //const mintedLineup = await db.readDocument(`leagues/minted-playoffs-2022-2023/cards/${cardId}/lineups`, gameweek);
        if(Number(cardId) >= 10000) {
            console.log(`We have found a minted card... card ${cardId}`)
            await db.createOrUpdateDocument(`leagues/minted-playoffs-2022-2023/cards/${cardId}/lineups`, gameweek, lineup, true);
            console.log(`Updated lineup for card ${cardId} in leagues`)

            let leaderboardObj = await db.readDocument(`mintedPlayoffs2022Leaderboard/${gameweek}/cards`, cardId);
            if(leaderboardObj) {
                leaderboardObj.lineup = lineup;
            } else {
                leaderboardObj = {
                    card: card,
                    lineup: lineup,
                    scoreWeek: 0,
                    scoreSeason: 0,
                    cardId: cardId,
                    level: card._level,
                    ownerId: card._ownerId,
                }
            }
            await db.createOrUpdateDocument(`mintedPlayoffs2022Leaderboard/${gameweek}/cards`, cardId, leaderboardObj, false);
        }
    }
}


const updateMintedCards = async () => {
    for(let i = 10000; i < 15000; i++) {
        const cardId = `${i}`;
        console.log(cardId)
        const card = await db.readDocument('playoffCards', cardId);
        if(card.rosterWithTeams) {
            continue;
        }
        card.rosterWithTeams = {
            QB: [ rankMap.get(card.QB[0]), rankMap.get(card.QB[1])],
            RB: [ rankMap.get(card.RB[0]), rankMap.get(card.RB[1]), rankMap.get(card.RB[2]), rankMap.get(card.RB[3])],
            TE: [ rankMap.get(card.TE[0]), rankMap.get(card.TE[1])],
            WR: [rankMap.get(card.WR[0]), rankMap.get(card.WR[1]), rankMap.get(card.WR[2]), rankMap.get(card.WR[3]), rankMap.get(card.WR[4])],
            DST: [rankMap.get(card.DST[0]), rankMap.get(card.DST[1])]
        }
        await db.createOrUpdateDocument('playoffCards', cardId, card, true)
    }
}

(async () => {
    await updateLineups();
    //await updateMintedLineups();
    //await updateMintedCards();
})();