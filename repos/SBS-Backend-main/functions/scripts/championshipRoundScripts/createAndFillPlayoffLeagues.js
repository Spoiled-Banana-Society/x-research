const db = require('../../services/db');

const createLineup = async (cardId) => {
    const gameweek = '2023REG-14';
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
    lineup.gameWeek = '2023REG-15'
    return lineup;
}

const createProChampionshipRoundOne = async () => {
    const gameweek = '2023REG-15';
    const leaderboard = await db.getLeaderboardV2('2023REG-14', 'season', 'Pro')
    for(let i = 0; i < 100; i++) {
        console.log(`... adding rank ${i + 1} to Pro championship league`)
        const cardId = leaderboard[i].cardId;
        const lineup = await createLineup(cardId);
        // await db.createOrUpdateDocument(`leagues/2023-Pro-Round-1/cards/${cardId}/lineups`, gameweek, { averageScoresThrough14: lineup.averageScoresThrough14, prevWeekSeasonScore: lineup.prevWeekSeasonScore }, true);
        await db.createOrUpdateDocument(`leagues/2023-Pro-Round-1/cards/${cardId}/lineups`, gameweek, lineup, true);

        console.log(`Added Rank: ${i + 1} / card: ${cardId} into the pro championship round with an avg score of ${lineup.averageScoresThrough14}`);

        const card = await db.readDocument('cards', cardId);
        const leaderboardObj = {
            cardId: cardId,
            card: card,
            lineup: lineup,
            scoreWeek: lineup.scoreWeek,
            scoreSeason: lineup.scoreSeason,
            level: card._level,
            ownerId: card._ownerId
        }
        await db.createOrUpdateDocument(`proChampionshipRoundLeaderboard/${gameweek}/cards`, cardId, leaderboardObj, true);
        console.log('Created card document in championship leaderboard')
    }
    console.log('Created the Pro level Round one championship league')
}

const createHofChampionshipRoundOne = async () => {
    const gameweek = '2023REG-15';
    const hof = await db.getLeaderboardV2('2023REG-14', 'season', 'Hall of Fame')
    let shof = await db.getLeaderboardV2('2023REG-14', 'season', 'Spoiled Hall of Fame')
    let leaderboard = [...hof, ...shof]

    // sort by score week or season
    leaderboard.sort((a, b) => a.scoreSeason - b.scoreSeason).reverse()

    for(let i = 0; i < 10; i++) {
        console.log(`... adding rank ${i + 1} to HOF championship league`)
        const cardId = leaderboard[i].cardId;
        const lineup = await createLineup(cardId);
        await db.createOrUpdateDocument(`leagues/2023-HOF-Round-1/cards/${cardId}/lineups`, gameweek, lineup, true);
        console.log(`Added Rank: ${i + 1} / card: ${cardId} into the HOF championship round with an avg score of ${lineup.averageScoresThrough14}`);

        const card = await db.readDocument('cards', cardId);
        const leaderboardObj = {
            cardId: cardId,
            card: card,
            lineup: lineup,
            scoreWeek: lineup.scoreWeek,
            scoreSeason: lineup.scoreSeason,
            level: card._level,
            ownerId: card._ownerId
        }
        await db.createOrUpdateDocument(`hofChampionshipRoundLeaderboard/${gameweek}/cards`, cardId, leaderboardObj, true);
        console.log('Created card document in championship leaderboard')
    }
    console.log('Created the HOF level Round one championship league')
}

const createSpoiledChampionshipRoundOne = async () => {
    const gameWeek = '2023REG-15';
    let spoiled = await db.getLeaderboardV2('2023REG-14', 'season', 'Spoiled Pro')
    let shof = await db.getLeaderboardV2('2023REG-14', 'season', 'Spoiled Hall of Fame')

    // combine hof and shof
    let leaderboard = [...spoiled, ...shof]

    // sort by score week or season
    leaderboard.sort((a, b) => a.scoreSeason - b.scoreSeason).reverse()
    for(let i = 10; i < 15; i++) {
        console.log(`... adding rank ${i + 1} to HOF championship league`)
        const cardId = leaderboard[i].cardId;
        const lineup = await createLineup(cardId);
        //await db.createOrUpdateDocument(`leagues/2023-Spoiled-Round-1/cards/${cardId}/lineups`, gameWeek, lineup, true);
        console.log(`Added Rank: ${i + 1} / card: ${cardId} into the HOF championship round with an avg score of ${lineup.averageScoresThrough14}`);


        const card = await db.readDocument('cards', cardId);
        const leaderboardObj = {
            cardId: cardId,
            card: card,
            lineup: lineup,
            scoreWeek: lineup.scoreWeek,
            scoreSeason: lineup.scoreSeason,
            level: card._level,
            ownerId: card._ownerId
        }
        //await db.createOrUpdateDocument(`spoiledChampionshipRoundLeaderboard/${gameWeek}/cards`, cardId, leaderboardObj, true);
        console.log('Created card document in championship leaderboard')
    }
    console.log('Created the HOF level Round one championship league')
}

const createBottomChampionshipRoundOne = async () => {
    const gameweek = '2023REG-15';
    const leaderboard = await db.getLeaderboardV2('2023REG-14', 'season', 'Pro')
    for(let i = 9900; i < 10000; i++) {
        console.log(`... adding rank ${i + 1} to Bottom championship league`)
        const cardId = leaderboard[i].cardId;
        const lineup = await createLineup(cardId);
        console.log(`AVG: ${lineup.averageScoresThrough14}, prevWeekSeasonScore: ${lineup.prevWeekSeasonScore}`);
        await db.createOrUpdateDocument(`leagues/2023-Bottom-Round-1/cards/${cardId}/lineups`, gameweek, lineup, true);
        console.log(`Added Rank: ${i + 1} / card: ${cardId} into the bottom championship round with an avg score of ${lineup.averageScoresThrough14}`);

        const card = await db.readDocument('cards', cardId);
        const leaderboardObj = {
            cardId: cardId,
            card: card,
            lineup: lineup,
            scoreWeek: lineup.scoreWeek,
            scoreSeason: lineup.scoreSeason,
            level: card._level,
            ownerId: card._ownerId
        }
        await db.createOrUpdateDocument(`bottomChampionshipRoundLeaderboard/${gameweek}/cards`, cardId, leaderboardObj, true);
        console.log('Created card document in championship leaderboard')
    }
    console.log('Created the Bottom 100 Round one championship league')
}

const addLastFiveToSpoiled = async () => {
    const data = [
        { cardId: "9774", avgScore: 147.2529 },
        { cardId: "999", avgScore: 145.4957 },
        { cardId: "8616", avgScore: 145.0029 },
        { cardId: "3461", avgScore: 144.9829 },
        { cardId: "994", avgScore: 144.8914 }
    ];

    for(let i = 0; i < data.length; i++) {
        const obj = data[i];
        const cardId = obj.cardId;
        const avgScore = obj.avgScore;

        const gameweek = '2023REG-15';
        const lineupPath = `leagues/genesis/cards/${cardId}/lineups`;
        const lineup = await db.readDocument(`leagues/genesis/cards/${cardId}/lineups`, gameweek);

        console.log(lineupPath + '/' + gameweek)
        lineup.averageScoresThrough14 = avgScore;
        lineup.scoreSeason = parseFloat((avgScore + lineup.scoreWeek).toFixed(4));
        lineup.prevWeekSeasonScore = avgScore;
        //lineup.scoreWeek = 0;
        lineup.gameWeek = '2023REG-15'
        console.log(lineup)
        await db.createOrUpdateDocument(`leagues/2023-Spoiled-Round-1/cards/${cardId}/lineups`, gameweek, lineup, true);

        const card = await db.readDocument('cards', cardId);
        const leaderboardObj = {
            cardId: cardId,
            card: card,
            lineup: lineup,
            scoreWeek: lineup.scoreWeek,
            scoreSeason: lineup.scoreSeason,
            level: card._level,
            ownerId: card._ownerId
        }
        await db.createOrUpdateDocument(`spoiledChampionshipRoundLeaderboard/${gameweek}/cards`, cardId, leaderboardObj, true);
        console.log('Created card document in championship leaderboard')

        const newGameweek = '2023REG-16';

        lineup.gameWeek = newGameweek;
        lineup.prevWeekSeasonScore = lineup.scoreSeason;
        lineup.scoreWeek = 0;

        await db.createOrUpdateDocument(`leagues/2023-Spoiled-Round-1/cards/${cardId}/lineups`, newGameweek, lineup, true);
        leaderboardObj.lineup = lineup;
        leaderboardObj.scoreWeek = 0;

        await db.createOrUpdateDocument(`spoiledChampionshipRoundLeaderboard/${newGameweek}/cards`, cardId, leaderboardObj, true);
        console.log('Created card document in championship leaderboard')

    }
}

(async () => {
    // console.log('Start of creating top 100 championship leagues and leaderboards')
    // await createProChampionshipRoundOne()
    // console.log('Created Top 100 leaderboard')

    // console.log('start of creating hof championship round 1 league')
    // await createHofChampionshipRoundOne();
    // console.log('CREATED hof CHAMPIONSHIP ROUND 1 LEAGUE')

    // console.log('start of creating spoiled championship round 1 league')
    // await createSpoiledChampionshipRoundOne();
    // console.log('CREATED spoiled CHAMPIONSHIP ROUND 1 LEAGUE')

    // console.log('.... CREATING BOTTOM 100 CHAMPIONSHIP ROUND')
    // await createBottomChampionshipRoundOne();
    // console.log('CREATED BOTTOM 100 LEADERBOARD')

    // [1975, 9616, 6561, 6924, 576, 7206, 7573, 7748, 9276, 3692]

    await addLastFiveToSpoiled()

})()