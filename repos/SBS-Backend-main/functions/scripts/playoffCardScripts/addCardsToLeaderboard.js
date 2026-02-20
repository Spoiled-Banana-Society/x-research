const db = require('../../services/db');
const weekTransition = require('../../services/weekTransition');


(async () => {
    for(let i = 0; i < 10000; i++) {
        const cardId = `${i}`;
        const card = await db.readDocument('playoffCards', cardId);

        const gameweek = '2022-PST-01';
        const now = db._getTimeStamp()
        const lineup = {
            starting: {
                QB: [card.QB[0]],
                RB: [card.RB[0], card.RB[1]],
                WR: [card.WR[0], card.WR[1], card.WR[2]],
                TE: [card.TE[0]],
                DST: [card.DST[0]],
            },
            bench: {
                QB: [card.QB[1]],
                RB: [card.RB[2], card.RB[3]],
                WR: [card.WR[3], card.WR[4]],
                TE: [card.TE[1]],
                DST: [card.DST[1]],
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

        await db.createOrUpdateDocument(`leagues/genesis-playoff-league/cards`, cardId, card, true);
        await db.createOrUpdateDocument(`leagues/genesis-playoff-league/cards/${cardId}/lineups`, gameweek, lineup, true);
        console.log(`Added Card: ${cardId} to playoffs league and created a default lineup`)

        const leaderboardObject = {
            card: card,
            lineup: lineup,
            scoreWeek: 0,
            scoreSeason: 0,
            cardId: cardId,
            level: card._level,
            ownerId: null,
        }
        await db.createOrUpdateDocument(`genesisPlayoffsLeaderboard/${gameweek}/cards`, cardId, leaderboardObject, true)
        console.log(`Created playoffs leaderboard object for card: ${cardId}`)

        if(Number(cardId) >= 10000) {
            await db.createOrUpdateDocument(`leagues/genesis-playoff-league/cards`, cardId, card, true);
            await db.createOrUpdateDocument(`leagues/genesis-playoff-league/cards/${cardId}/lineups`, gameweek, lineup, true);
            console.log(`Added Card: ${cardId} to playoffs league and created a default lineup`)

            const leaderboardObject = {
                card: card,
                lineup: lineup,
                scoreWeek: 0,
                scoreSeason: 0,
                cardId: cardId,
                level: card._level,
                ownerId: null,
            }
            await db.createOrUpdateDocument(`genesisPlayoffsLeaderboard/${gameweek}/cards`, cardId, leaderboardObject, true)
            console.log(`Created playoffs leaderboard object for card: ${cardId}`)
        }
    }
})()
