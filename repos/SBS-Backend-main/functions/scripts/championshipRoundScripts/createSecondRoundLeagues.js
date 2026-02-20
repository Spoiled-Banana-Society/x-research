const db = require('../../services/db');

const createLineup = async (cardId) => {
    const gameweek = '2023REG-15';
    const lineupPath = `leagues/genesis/cards/${cardId}/lineups`;
    console.log(lineupPath + '/' + gameweek)
    const lineup = await db.readDocument(lineupPath, gameweek);
    let sum = 0;
    for(let j = 1; j < 15; j++) {
        let lineupGameweek;
        if(j < 10) {
            lineupGameweek = `2023REG-0${j}`;
        } else {
            lineupGameweek = `2023REG-${j}`;
        }
        console.log(lineupPath + '/' + lineupGameweek)
        const weekLineup = await db.readDocument(lineupPath, lineupGameweek);
        sum = sum + weekLineup.scoreWeek;
    }
    const avgScore = parseFloat((sum / 14).toFixed(4));
    lineup.averageScoresThrough14 = avgScore;
    lineup.scoreSeason = avgScore;
    lineup.prevWeekSeasonScore = avgScore;
    lineup.scoreWeek = 0;
    return lineup;
}

const createProChampionshipRoundTwo = async () => {
    const gameweek = '2023REG-16';
    const prevWeek = '2023REG-15';
    const leaderboard = await db.getChampionshipRoundLeaderboard(prevWeek, 'season', 'Pro')
    for(let i = 0; i < 50; i++) {
        console.log(`... adding rank ${i + 1} to Pro championship league`)
        const cardId = leaderboard[i].cardId;
        const lineup = await db.readDocument(`leagues/2023-Pro-Round-1/cards/${cardId}/lineups`, prevWeek);
        if(!lineup.averageScoresThrough14) {
            console.log('PANIC THERE WAS NO AVERAGE SCORES THROUGH 14 FOR THIS CARD ' + cardId);
            continue;
        }
        const prevWeekScore = lineup.scoreWeek;
        lineup.prevWeekSeasonScore = lineup.scoreSeason;
        lineup.scoreWeek = 0;
        lineup.gameWeek = gameweek;
        await db.createOrUpdateDocument(`leagues/2023-Pro-Round-2/cards/${cardId}/lineups`, gameweek, lineup, true);
        console.log(`Added Rank: ${i + 1} / card: ${cardId} into the pro championship round 2 with an total score of ${lineup.scoreSeason}`);

        const card = await db.readDocument('cards', cardId);
        const leaderboardObj = {
            cardId: cardId,
            card: card,
            lineup: lineup,
            scoreWeek: lineup.scoreWeek,
            scoreSeason: lineup.scoreSeason,
            week14Score: prevWeekScore,
            level: card._level,
            ownerId: card._ownerId
        }
        await db.createOrUpdateDocument(`proChampionshipRoundLeaderboard/${gameweek}/cards`, cardId, leaderboardObj, true);
        console.log('Created card document in championship leaderboard')
    }
    console.log('Created the Pro level Round two championship league')
}

const createHofChampionshipRoundTwo = async () => {
    const gameweek = '2023REG-16';
    const prevWeek = '2023REG-15';
    const leaderboard = await db.getChampionshipRoundLeaderboard(prevWeek, 'Season', 'Hall of Fame');

    for(let i = 0; i < 10; i++) {
        console.log(`... adding rank ${i + 1} to HOF championship league`)
        const cardId = leaderboard[i].cardId;
        const lineup = await db.readDocument(`leagues/2023-HOF-Round-1/cards/${cardId}/lineups`, prevWeek);
        if(!lineup.averageScoresThrough14) {
            console.log('PANIC THERE WAS NO AVERAGE SCORES THROUGH 14 FOR THIS CARD ' + cardId);
            continue;
        }
        const prevWeekScore = lineup.scoreWeek;
        lineup.prevWeekSeasonScore = lineup.scoreSeason;
        lineup.scoreWeek = 0;
        lineup.gameWeek = gameweek;
        await db.createOrUpdateDocument(`leagues/2023-HOF-Round-2/cards/${cardId}/lineups`, gameweek, lineup, true);
        console.log(`Added Rank: ${i + 1} / card: ${cardId} into the pro championship round 2 with an total score of ${lineup.scoreSeason}`);

        const card = await db.readDocument('cards', cardId);
        const leaderboardObj = {
            cardId: cardId,
            card: card,
            lineup: lineup,
            scoreWeek: lineup.scoreWeek,
            scoreSeason: lineup.scoreSeason,
            week14Score: prevWeekScore,
            level: card._level,
            ownerId: card._ownerId
        }
        await db.createOrUpdateDocument(`hofChampionshipRoundLeaderboard/${gameweek}/cards`, cardId, leaderboardObj, true);
        console.log('Created card document in HOF championship leaderboard')
    }
    console.log('Created the HOF level Round one championship league')
}

const createSpoiledChampionshipRoundTwo = async () => {
    const data = ["9774", "999", "8616", "3461", "994"];
    const gameWeek = '2023REG-16';
    const prevWeek = '2023REG-15';
    let leaderboard = await db.getChampionshipRoundLeaderboard(prevWeek, 'season', 'Spoiled');

    for(let i = 0; i < 15; i++) {
        console.log(`... adding rank ${i + 1} to Spoiled championship league`)
        const cardId = leaderboard[i].cardId;
        if(!data.includes(cardId)) {
            console.log('found card that was already in spoiled: ', cardId)
            continue;
        }
        const lineup = await db.readDocument(`leagues/2023-Spoiled-Round-1/cards/${cardId}/lineups`, prevWeek);
        if(!lineup.averageScoresThrough14) {
            console.log('PANIC THERE WAS NO AVERAGE SCORES THROUGH 14 FOR THIS CARD ' + cardId);
            continue;
        }
        const prevWeekScore = lineup.scoreWeek;
        lineup.prevWeekSeasonScore = lineup.scoreSeason;
        lineup.scoreWeek = 0;
        lineup.gameWeek = gameWeek;
        await db.createOrUpdateDocument(`leagues/2023-Spoiled-Round-2/cards/${cardId}/lineups`, gameWeek, lineup, true);
        console.log(`Added Rank: ${i + 1} / card: ${cardId} into the HOF championship round with an avg score of ${lineup.averageScoresThrough14}`);


        const card = await db.readDocument('cards', cardId);
        const leaderboardObj = {
            cardId: cardId,
            card: card,
            lineup: lineup,
            scoreWeek: lineup.scoreWeek,
            scoreSeason: lineup.scoreSeason,
            week14Score: prevWeekScore,
            level: card._level,
            ownerId: card._ownerId
        }
        await db.createOrUpdateDocument(`spoiledChampionshipRoundLeaderboard/${gameWeek}/cards`, cardId, leaderboardObj, true);
        console.log('Created card document in championship leaderboard')
    }
    console.log('Created the HOF level Round two championship league')
}

const createBottomChampionshipRoundTwo = async () => {
    const gameweek = '2023REG-16';
    const prevWeek = '2023REG-15';
    const leaderboard = await db.getChampionshipRoundLeaderboard('2023REG-15', 'season', 'Bottom')
    for(let i = 0; i < 50; i++) {
        console.log(`... adding rank ${i + 1} to Bottom championship league`)
        const cardId = leaderboard[i].cardId;
        const lineup = await db.readDocument(`leagues/2023-Bottom-Round-1/cards/${cardId}/lineups`, prevWeek)
        if(!lineup.averageScoresThrough14) {
            console.log(`ERROR WE DO NOT HAVE AN AVERAGE SCORE FOR THIS LINEUP`)
            continue;
        }
        const prevWeekScore = lineup.scoreWeek;
        lineup.prevWeekSeasonScore = lineup.scoreSeason;
        lineup.scoreWeek = 0;
        lineup.gameWeek = gameweek;
        console.log(`AVG: ${lineup.averageScoresThrough14}, prevWeekSeasonScore: ${lineup.prevWeekSeasonScore}`);
        await db.createOrUpdateDocument(`leagues/2023-Bottom-Round-2/cards/${cardId}/lineups`, gameweek, lineup, true);
        console.log(`Added Rank: ${i + 1} / card: ${cardId} into the bottom championship round with an avg score of ${lineup.averageScoresThrough14}`);

        const card = await db.readDocument('cards', cardId);
        const leaderboardObj = {
            cardId: cardId,
            card: card,
            lineup: lineup,
            scoreWeek: lineup.scoreWeek,
            scoreSeason: lineup.scoreSeason,
            week14Score: prevWeekScore,
            level: card._level,
            ownerId: card._ownerId
        }
        await db.createOrUpdateDocument(`bottomChampionshipRoundLeaderboard/${gameweek}/cards`, cardId, leaderboardObj, true);
        console.log('Created card document in championship leaderboard')
    }
    console.log('Created the Bottom 100 Round one championship league')
}

(async () => {
    //await createBottomChampionshipRoundTwo();
    //await createHofChampionshipRoundTwo();
    //await createProChampionshipRoundTwo();
    await createSpoiledChampionshipRoundTwo();
})() 