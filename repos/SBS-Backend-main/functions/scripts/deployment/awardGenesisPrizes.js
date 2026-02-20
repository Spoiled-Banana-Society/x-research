//✍️ STEP: 1  FILL OUT THE SCRIPT TEMPLATE BELOW

/* DESCRIPTION START:
========================

    📝 General Description:

    The intent of the script is to demo use of the script template.  Why we need this script will be included here and 
    an other relevant details. 

    👣 Deployment Steps: node awardGenesisPrizes.js

    🔗 TaskLink: Trello Link Here

    📅 Date Run in sbs-fantasy-dev:

    📅 Date Run in sbs-fantasy-prod:

========================
DESCRIPTION END */

//🗃️ STEP 2: Add needed Dependencies

const SCRIPT_NAME = 'Award Genesis Prizes'; //required

//Packages

//services
const db = require('../../services/db');



const addPrizesToLeaderboard = (leaderboard, prizes) => {
  const leaderboardWithPrizes = [];
  for(let i = 0; i < leaderboard.length; i++){
    const player = leaderboard[i];
    player.prize = (player.prize != null) ? player.prize : prizes.places.find(p => p.place === player.rank);
    leaderboardWithPrizes.push(player)    ;
  }
  return leaderboardWithPrizes;
}

//🚀 STEP 3: Write the script.  Include tests for validation where possible
const run = async () => {
  const gameWeek = '2023REG-16';

  // const seasonTopPrizes = await db.readDocument('prizes', 'season-top');
  // const seasonBottomPrizes = await db.readDocument('prizes', 'season-bottom');
  // const seasonHofPrizes = await db.readDocument('prizes', 'season-hof');
  // const seasonSpoiledPrizes = await  db.readDocument('prizes', 'season-spoiled');
  const weeklyTopPrizes = await db.readDocument('prizes', 'weekly-top' );
  const weeklyHofPrizes = await db.readDocument('prizes', 'weekly-hof');
  const weeklySpoiledPrizes = await db.readDocument('prizes', 'weekly-spoiled');
  
  // const seasonHofScores = await db.getLeaderboardV2(gameWeek, 'season', 'Hall of Fame');
  // const seasonSpoiledHofScores = await db.getLeaderboardV2(gameWeek, 'season', 'Spoiled Hall of Fame');
  // const seasonSpoiledProScores = await db.getLeaderboardV2(gameWeek, 'season', 'Spoiled Pro');
  const weeklyHofScores = await db.getLeaderboardV2(gameWeek, 'week', 'Hall of Fame');
  const weeklySpoiledHofScores = await db.getLeaderboardV2(gameWeek, 'week', 'Spoiled Hall of Fame');
  const weeklySpoiledProScores = await db.getLeaderboardV2(gameWeek, 'week', 'Spoiled Pro');

  // let seasonLeaderboard = await db.getLeaderboardV2(gameWeek, 'season', 'Pro');
  // let seasonHofLeaderboard = [...seasonHofScores, ...seasonSpoiledHofScores].sort((a, b) => b.scoreSeason - a.scoreSeason);
  // let seasonSpoiledLeaderboard = [...seasonSpoiledHofScores, ...seasonSpoiledProScores].sort((a, b) => b.scoreSeason - a.scoreSeason);
  let weeklyTopLeaderboard = await db.getLeaderboardV2(gameWeek, 'week', 'Pro');
  let weeklyHofLeadboard = [...weeklyHofScores, ...weeklySpoiledHofScores].sort((a, b) => b.scoreWeek - a.scoreWeek);
  let weeklySpoiledLeaderboard = [...weeklySpoiledHofScores, ...weeklySpoiledProScores].sort((a, b) => b.scoreWeek - a.scoreWeek);
  for(let i = 0; i < seasonLeaderboard.length; i++) seasonLeaderboard[i].rank = i + 1;
  for(let i = 0; i < seasonHofLeaderboard.length; i++) seasonHofLeaderboard[i].rank = i + 1;
  for(let i = 0; i < seasonSpoiledLeaderboard.length; i++) seasonSpoiledLeaderboard[i].rank = i + 1;
  for(let i = 0; i < weeklyTopLeaderboard.length; i++) weeklyTopLeaderboard[i].rank = i + 1;
  for(let i = 0; i < weeklyHofLeadboard.length; i++) weeklyHofLeadboard[i].rank = i + 1;
  for(let i = 0; i < weeklySpoiledLeaderboard.length; i++)weeklySpoiledLeaderboard[i].rank = i + 1;

  // seasonLeaderboard = addPrizesToLeaderboard(seasonLeaderboard, seasonTopPrizes);
  // seasonLeaderboard = addPrizesToLeaderboard(seasonLeaderboard, seasonBottomPrizes);
  // seasonHofLeaderboard = addPrizesToLeaderboard(seasonHofLeaderboard, seasonHofPrizes);
  // seasonSpoiledLeaderboard = addPrizesToLeaderboard(seasonSpoiledLeaderboard, seasonSpoiledPrizes);
  weeklyTopLeaderboard = addPrizesToLeaderboard(weeklyTopLeaderboard, weeklyTopPrizes);
  weeklyHofLeadboard = addPrizesToLeaderboard(weeklyHofLeadboard, weeklyHofPrizes)
  weeklySpoiledLeaderboard = addPrizesToLeaderboard(weeklySpoiledLeaderboard, weeklySpoiledPrizes);

  for(let i = 0; i < seasonLeaderboard.length; i++){
    const player = seasonLeaderboard[i];
    const cardId = seasonLeaderboard[i].cardId;
    const boardType = 'seasonAll'
    await db.createOrUpdateDocument(`genesisWinnings/${gameWeek}/${boardType}`, cardId, player);
    console.log(`...${boardType}:${i}`)
  }

  for(let i = 0; i < seasonHofLeaderboard.length; i++){
    const player = seasonHofLeaderboard[i];
    const cardId = seasonHofLeaderboard[i].cardId;
    const boardType = 'seasonHof'
    await db.createOrUpdateDocument(`genesisWinnings/${gameWeek}/${boardType}`, cardId, player);
    console.log(`...${boardType}:${i}`)
  }

  for(let i = 0; i < seasonSpoiledLeaderboard.length; i++){
    const player = seasonSpoiledLeaderboard[i];
    const cardId = seasonSpoiledLeaderboard[i].cardId;
    const boardType = 'seasonSpoiled'
    await db.createOrUpdateDocument(`genesisWinnings/${gameWeek}/${boardType}`, cardId, player);
    console.log(`...${boardType}:${i}`)
  }

  for(let i = 0; i < weeklyTopLeaderboard.length; i++){
    const player = weeklyTopLeaderboard[i];
    const cardId = weeklyTopLeaderboard[i].cardId;
    const boardType = 'weekAll'
    await db.createOrUpdateDocument(`genesisWinnings/${gameWeek}/${boardType}`, cardId, player);
    console.log(`...${boardType}:${i}`)
  }

  for(let i = 0; i < weeklyHofLeadboard.length; i++){
    const player = weeklyHofLeadboard[i];
    const cardId = weeklyHofLeadboard[i].cardId;
    const boardType = 'weekHof'
    await db.createOrUpdateDocument(`genesisWinnings/${gameWeek}/${boardType}`, cardId, player);
    console.log(`...${boardType}:${i}`)
  }


  for(let i = 0; i < weeklySpoiledLeaderboard.length; i++){
    const player = weeklySpoiledLeaderboard[i];
    const cardId = weeklySpoiledLeaderboard[i].cardId;
    const boardType = 'weekSpoiled'
    await db.createOrUpdateDocument(`genesisWinnings/${gameWeek}/${boardType}`, cardId, player);
    console.log(`...${boardType}:${i}`)
  }
  
};



(async () => {
    console.log(`...📝   START:${SCRIPT_NAME}`);
    
    await run();

    console.log(`...📝   END:${SCRIPT_NAME}`);
    process.exit(0);
})();
