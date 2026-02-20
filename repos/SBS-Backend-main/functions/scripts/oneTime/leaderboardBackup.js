const sbsUtils = require("../../services/sbs");
const utils = require("../../services/utils");
const db = require("../../services/db");
const web3Utils = require("../services/web3-utils");
const dstScoring = require("../services/dst-scoring-utils");
const fs = require("fs");
const {Storage} = require('@google-cloud/storage');
const gc = new Storage({
    keyFilename: 'serviceAccount.json',
    projectId: 'sbs-fantasy-prod'
  });

  (async () => {

    
    const nflWeek = 17;
    const numTokens = await web3Utils.numTokensMinted();


    let leaderboard;
    let documentName;
    let basicLeaderboard = [];
    let rank = 1;
    let chunk = 6000;

    leaderboard = await db.getLeaderboard('week', 'all', 2021, 'REG', nflWeek, chunk, 1000, 'top', numTokens);

    leaderboard.forEach(card => {
        basicLeaderboard.push({
            _tokenId: card._tokenId,
            weeklyPts: card[`2021-REG-week-${nflWeek}-weeklyPts`],
            seasonPts: card[`2021-REG-week-${nflWeek}-seasonPts`],
            level: card.level,
            rank 
        })
        rank++;
    
    });
        
    documentName = `_2021_REG_${nflWeek}_top_${chunk}`;
    await db.createOrUpdateDocument('leaderboard', documentName, basicLeaderboard);
    console.log(`...${documentName} backed up`);
    

  })();



  // const test = {    "scores": [
  //   {
  //       "2021-REG-week-16": {
  //           "startingLineup": [
  //               {
  //                   "teamId": "DEN",
  //                   "positionId": "QB1",
  //                   "pts": 7.12,
  //                   "positionLabel": "QB",
  //                   "teamPosition": "DEN QB",
  //                   "starting": false
  //               },
  //               {
  //                   "positionId": "QB2",
  //                   "positionLabel": "QB",
  //                   "pts": 18.06,
  //                   "teamPosition": "HOU QB",
  //                   "teamId": "HOU",
  //                   "starting": true
  //               },
  //               {
  //                   "positionLabel": "RB",
  //                   "teamPosition": "ARI RB",
  //                   "starting": true,
  //                   "pts": 26.7,
  //                   "positionId": "RB1",
  //                   "teamId": "ARI"
  //               },
  //               {
  //                   "teamPosition": "CAR RB",
  //                   "pts": 3.9,
  //                   "starting": false,
  //                   "positionId": "RB2",
  //                   "teamId": "CAR",
  //                   "positionLabel": "RB"
  //               },
  //               {
  //                   "positionLabel": "RB",
  //                   "pts": 13.7,
  //                   "teamId": "GB",
  //                   "positionId": "RB3",
  //                   "starting": true,
  //                   "teamPosition": "GB RB"
  //               },
  //               {
  //                   "teamId": "KC",
  //                   "positionId": "RB4",
  //                   "positionLabel": "RB",
  //                   "teamPosition": "KC RB",
  //                   "starting": false,
  //                   "pts": 13.4
  //               },
  //               {
  //                   "pts": 12.1,
  //                   "starting": true,
  //                   "positionId": "WR1",
  //                   "teamPosition": "SEA WR",
  //                   "teamId": "SEA",
  //                   "positionLabel": "WR"
  //               },
  //               {
  //                   "teamPosition": "DEN WR",
  //                   "positionLabel": "WR",
  //                   "teamId": "DEN",
  //                   "positionId": "WR2",
  //                   "pts": 9,
  //                   "starting": false
  //               },
  //               {
  //                   "starting": false,
  //                   "pts": 11.6,
  //                   "positionId": "WR3",
  //                   "positionLabel": "WR",
  //                   "teamPosition": "CAR WR",
  //                   "teamId": "CAR"
  //               },
  //               {
  //                   "teamId": "NYG",
  //                   "positionLabel": "WR",
  //                   "teamPosition": "NYG WR",
  //                   "pts": 6.8,
  //                   "positionId": "WR4",
  //                   "starting": true
  //               },
  //               {
  //                   "positionId": "WR5",
  //                   "teamId": "HOU",
  //                   "starting": true,
  //                   "teamPosition": "HOU WR",
  //                   "positionLabel": "WR",
  //                   "pts": 15
  //               },
  //               {
  //                   "positionId": "TE1",
  //                   "pts": 4.1,
  //                   "teamId": "SF",
  //                   "teamPosition": "SF TE",
  //                   "starting": true,
  //                   "positionLabel": "TE"
  //               },
  //               {
  //                   "starting": false,
  //                   "teamPosition": "LAC TE",
  //                   "pts": 9.4,
  //                   "teamId": "LAC",
  //                   "positionLabel": "TE",
  //                   "positionId": "TE2"
  //               },
  //               {
  //                   "pts": 0,
  //                   "starting": true,
  //                   "positionLabel": "DST",
  //                   "teamId": "CLE",
  //                   "positionId": "DST1",
  //                   "teamPosition": "CLE DST"
  //               },
  //               {
  //                   "teamId": "DET",
  //                   "starting": false,
  //                   "positionId": "DST2",
  //                   "pts": 7,
  //                   "teamPosition": "DET DST",
  //                   "positionLabel": "DST"
  //               }
  //           ]
  //       }
  //   },
  //   {
  //       "2021-REG-week-17": {
  //           "startingLineup": [
  //               {
  //                   "teamPosition": "DEN QB",
  //                   "pts": 15.9,
  //                   "teamId": "DEN",
  //                   "positionLabel": "QB",
  //                   "positionId": "QB1",
  //                   "starting": false
  //               },
  //               {
  //                   "pts": 9.92,
  //                   "starting": true,
  //                   "positionLabel": "QB",
  //                   "teamId": "HOU",
  //                   "positionId": "QB2",
  //                   "teamPosition": "HOU QB"
  //               },
  //               {
  //                   "teamPosition": "ARI RB",
  //                   "pts": 13.2,
  //                   "starting": true,
  //                   "positionLabel": "RB",
  //                   "positionId": "RB1",
  //                   "teamId": "ARI"
  //               },
  //               {
  //                   "teamId": "CAR",
  //                   "positionLabel": "RB",
  //                   "positionId": "RB2",
  //                   "starting": false,
  //                   "teamPosition": "CAR RB",
  //                   "pts": 15.8
  //               },
  //               {
  //                   "positionId": "RB3",
  //                   "starting": true,
  //                   "positionLabel": "RB",
  //                   "pts": 22.3,
  //                   "teamId": "GB",
  //                   "teamPosition": "GB RB"
  //               },
  //               {
  //                   "positionId": "RB4",
  //                   "teamId": "KC",
  //                   "pts": 25.7,
  //                   "starting": false,
  //                   "positionLabel": "RB",
  //                   "teamPosition": "KC RB"
  //               },
  //               {
  //                   "starting": true,
  //                   "teamId": "SEA",
  //                   "pts": 30.9,
  //                   "teamPosition": "SEA WR",
  //                   "positionLabel": "WR",
  //                   "positionId": "WR1"
  //               },
  //               {
  //                   "positionId": "WR2",
  //                   "teamId": "DEN",
  //                   "pts": 9,
  //                   "teamPosition": "DEN WR",
  //                   "starting": false,
  //                   "positionLabel": "WR"
  //               },
  //               {
  //                   "positionLabel": "WR",
  //                   "starting": false,
  //                   "pts": 5.9,
  //                   "teamId": "CAR",
  //                   "positionId": "WR3",
  //                   "teamPosition": "CAR WR"
  //               },
  //               {
  //                   "positionLabel": "WR",
  //                   "teamPosition": "NYG WR",
  //                   "positionId": "WR4",
  //                   "teamId": "NYG",
  //                   "starting": true,
  //                   "pts": 2.2
  //               },
  //               {
  //                   "positionLabel": "WR",
  //                   "positionId": "WR5",
  //                   "starting": true,
  //                   "teamId": "HOU",
  //                   "pts": 19.6,
  //                   "teamPosition": "HOU WR"
  //               },
  //               {
  //                   "starting": true,
  //                   "positionId": "TE1",
  //                   "pts": 4.5,
  //                   "positionLabel": "TE",
  //                   "teamPosition": "SF TE",
  //                   "teamId": "SF"
  //               },
  //               {
  //                   "positionId": "TE2",
  //                   "positionLabel": "TE",
  //                   "teamPosition": "LAC TE",
  //                   "pts": 5.2,
  //                   "teamId": "LAC",
  //                   "starting": false
  //               },
  //               {
  //                   "starting": true,
  //                   "teamPosition": "CLE DST",
  //                   "teamId": "CLE",
  //                   "pts": 5,
  //                   "positionLabel": "DST",
  //                   "positionId": "DST1"
  //               },
  //               {
  //                   "starting": false,
  //                   "positionId": "DST2",
  //                   "positionLabel": "DST",
  //                   "teamPosition": "DET DST",
  //                   "teamId": "DET",
  //                   "pts": -3
  //               }
  //           ]
  //       }
  //   },
  //   {
  //       "2021-REG-week-18": {}
  //   }
  // ]
  // };