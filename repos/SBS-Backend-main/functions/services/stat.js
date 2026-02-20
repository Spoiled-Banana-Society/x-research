//PACKAGES
require("firebase-functions/lib/logger/compat");

//SERVICES
const sbs = require('../services/sbs');
const db  = require('../services/db');
const sportsDataScore = require('../services/sportsDataScore');
const rollingInsightsScore = require('../services/rollingInsightsScore');
const cardContract = require("../services/cardContract");

const ENV = require('./env');
const { preferences } = require("joi");

const internals = {};

const teams = ['ARI', 'ATL', 'BAL', 'BUF', 'CAR', 'CHI', 'CIN', 'CLE', 'DAL', 'DEN', 'DET', 'GB',  'HOU', 'IND', 'JAX', 'KC',  'LAC', 'LAR', 'LV',  'MIA', 'MIN', 'NE',  'NO',  'NYG', 'NYJ', 'PHI', 'PIT', 'SEA', 'SF',  'TB',  'TEN', 'WAS'];


internals.setScoresFromStats = async (gameWeek) => {
  console.log(gameWeek)
  const stats = await sbs.getStats(gameWeek);
  await sbs.setScores(gameWeek, stats);
}

internals.setScoresFromStatsSportsRadar = async (gameWeek) => {
  console.log(`scoring from stats in ${gameWeek}`)
  const split = gameWeek.split('-');
  const year = split[0];
  const week = split[1];
  console.log(`year: ${year}, week: ${week}`)
  await sportsDataScore.setScoresAndStats(week, year)
  console.log(`finished scoring from stats for ${gameWeek}`)
}

internals.setScoresFromRollingInsights = async (gameWeek) => {
  console.log(`scoring from stats in ${gameWeek}`)
  const split = gameWeek.split('-');
  const year = split[0];
  const week = split[1];
  console.log(`year: ${year}, week: ${week}`)
  await rollingInsightsScore.setScoresAndStats(week, year)
  console.log(`finished scoring from stats for ${gameWeek}`)
}

// (async () => {
//   const year = "2024REG";
//   const week = "06"
//   const gameweek = sbs.getNFLWeekV2()
//   console.log(gameweek)
//   await internals.setScoresFromStatsSportsRadar(gameweek);
//   // await sportsDataScore.setScoresAndStats(week, year)
// })()

internals.getDataFromEndpoint = async (team) => {
  const options = {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
  }
    
  const response = await fetch(`https://api.sportsdata.io/v3/nfl/scores/json/Players/${team}?key=cc1e7d75df054c6c82c4ff2f02ded616`, options);
  let data = await response.json()
  return data
}

internals.analyzeData = async () => {
  let teamMap = {};

  for (let i = 0; i < teams.length; i++) {
    const team = teams[i];
    let teamObj = {
        QB: [],
        RB: [],
        TE: [],
        WR: [],
        DST: [],
    }


    let data = await internals.getDataFromEndpoint(team)
    let qbArray = data.filter(x => x.FantasyPosition == 'QB' && x.FantasyPositionDepthOrder != null);
    let sortedQbArray = qbArray.sort((a, b) => a.FantasyPositionDepthOrder - b.FantasyPositionDepthOrder)
    for (let j = 0; j < sortedQbArray.length; j++) {
        if (teamObj.QB.length == 3) {
            break;
        }

        if (sortedQbArray[j].FantasyPositionDepthOrder != null) {
            teamObj.QB.push(sortedQbArray[j].Name)
        }
        
    }

    let rbArray = data.filter(x => x.FantasyPosition == 'RB' && x.FantasyPositionDepthOrder != null);
    let sortedRbArray = rbArray.sort((a, b) => a.FantasyPositionDepthOrder - b.FantasyPositionDepthOrder)
    for (let j = 0; j < sortedRbArray.length; j++) {
        if (teamObj.RB.length == 4) {
            break;
        }
        teamObj.RB.push(sortedRbArray[j].Name)
    }

    let teArray = data.filter(x => x.FantasyPosition == 'TE' && x.FantasyPositionDepthOrder != null);
    let sortedTeArray = teArray.sort((a, b) => a.FantasyPositionDepthOrder - b.FantasyPositionDepthOrder)
    for (let j = 0; j < sortedTeArray.length; j++) {
        if (teamObj.TE.length == 3) {
            break;
        }
        teamObj.TE.push(sortedTeArray[j].Name)
    }

    let wrArray = data.filter(x => x.FantasyPosition == 'WR' && x.FantasyPositionDepthOrder != null);
    let sortedWrArray = wrArray.sort((a, b) => a.FantasyPositionDepthOrder - b.FantasyPositionDepthOrder)
    for (let j = 0; j < sortedWrArray.length; j++) {
        if (teamObj.WR.length == 5) {
            break;
        }
        teamObj.WR.push(sortedWrArray[j].Name)
    }

    teamMap[team] = teamObj
  }

  const statsObject = await db.readDocument("playerStats2025", "playerMap")

  for (let i = 0; i < teams.length; i++) {
    const team = teams[i]

    const teamADP = teamMap[team]
    statsObject.players[`${team}-QB`].playersFromTeam = teamADP.QB
    statsObject.players[`${team}-RB1`].playersFromTeam = teamADP.RB
    statsObject.players[`${team}-RB2`].playersFromTeam = teamADP.RB
    statsObject.players[`${team}-TE`].playersFromTeam = teamADP.TE
    statsObject.players[`${team}-WR1`].playersFromTeam = teamADP.WR
    statsObject.players[`${team}-WR2`].playersFromTeam = teamADP.WR
    statsObject.players[`${team}-DST`].playersFromTeam = [];
  }

  await db.createOrUpdateDocument("playerStats2025", "playerMap", statsObject)

  console.log("Updated playersFromTeam in all objects inside of playerMap as of ", Date.now().toString())
}

/*

map[playerId]
  {
    PlayerId: string,
    PickNums: []int,
    ADP: float
  }

*/

internals.updateADPForStats = async () => {
  let leagueIds = await db.readAllDocumentIds("drafts");
  leagueIds = leagueIds.filter(x => x != "draftTracker");
  const pickMap = {};

  const statsMap = await db.readDocument("playerStats2025", "playerMap");
  const positions = ['QB', 'RB1', 'RB2', 'TE', 'WR1', 'WR2', 'DST']

  for(let i = 0; i < leagueIds.length; i++) {
    const leagueId = leagueIds[i];
    const league = await db.readDocument("drafts", leagueId)
    if (!league || !league.IsLocked) {
      console.log(`${leagueId} has not finished drafting yet so we are skipping it`);
      continue;
    }

    const draftPlayers = await db.readDocument(`drafts/${leagueId}/state`, 'playerState')
    Object.keys(draftPlayers).forEach(playerId => {
      let playerPickArr = pickMap[playerId];
      // if they weren't picked in this draft skip
      if (draftPlayers[playerId].PickNum === 0) {
        return
      }
      pickMap[playerId] = (playerPickArr) ? [...playerPickArr, draftPlayers[playerId].PickNum] : [draftPlayers[playerId].PickNum]
    })
  }

  for (let i = 0; i < teams.length; i++) {
    const team = teams[i];
    for (let j = 0; j < positions.length; j++) {
      const position = positions[j];
      const playerId = `${team}-${position}`
      const picks = pickMap[playerId]
      if (!picks) {
        console.log("No picks for ", playerId)
        continue;
      }
      let sum = 0;
      for (let z = 0; z < picks.length; z++) {
        sum += picks[z]
      }
      statsMap.Players[playerId].ADP = Math.round((sum / picks.length))
    }
  }

  await db.createOrUpdateDocument('playerStats2025', 'playerMap', statsMap)
  console.log("Updated ADP for all players in drafts")
}

internals.updateDraftTokenFromTransfer = async (draftTokenId, addressTo="") => {
  let previousRecord
  let owner = addressTo
  owner = owner.toLowerCase()

  if (!owner) {
    console.log(`ISSUE GETTING ADDRESS FROM EVENT`)

    owner = await cardContract.getOwnerByCardId(draftTokenId)
    owner = owner.toLowerCase()

    if (owner) {
      console.log(`GOT FROM INFURA -- OK`)
    } else {
      console.log(`UNABLE TO GET FROM INFURA AND CANNOT PROCESS`)
      return
    }
  }
  // check all contract transfer events to make sure that the token is currently in the correct spot.

  token = await db.readDocument(`draftTokens`, String(draftTokenId))
  // Token was never recorded
  if (!token) {
    console.log(`Missing token for ${owner}: ${draftTokenId}`)
    const resp = await fetch(`https://sbs-drafts-api-w5wydprnbq-uc.a.run.app/owner/${owner.toLowerCase()}/draftToken/mint`, {
      "method": "POST",
      "body": JSON.stringify({
        "MinId": draftTokenId,
        "MaxId": draftTokenId
      }),
      headers: {'Content-Type': 'application/json'}
    })
  } else {
    // token has been used already -- transfer the ownership
    if (token.LeagueId) {
      console.log("IN TRANSFER USED TOKEN")

      const pastOwner = token.OwnerId.toLowerCase()

      // set new owner and update draft token
      token.OwnerId = owner
      await db.createOrUpdateDocument(`draftTokens`, String(draftTokenId), token)
      await db.createOrUpdateDocument(`owners/${owner}/usedDraftTokens`, String(draftTokenId), token)

      // if previous owner has in usedDraftTokens delete it
      if (pastOwner !== owner) {
        previousRecord = await db.readDocument(`owners/${pastOwner}/usedDraftTokens`, String(draftTokenId))
        if (previousRecord) await db.deleteDocument(`owners/${pastOwner}/usedDraftTokens`, String(draftTokenId))
      }

      // get card in draft
      const draftCard = await db.readDocument(`drafts/${token.LeagueId}/cards`, String(draftTokenId))
      draftCard.OwnerId = owner
      await db.createOrUpdateDocument(`drafts/${token.LeagueId}/cards`, String(draftTokenId), draftCard)

      console.log(`USED TOKEN ${draftTokenId} TRANSFERED FROM ${pastOwner} to ${owner}`)
    } else {
      console.log("IN UN-USED TOKEN")
      // token has not been used yet
      const pastOwner = token.OwnerId.toLowerCase()

      // set new owner and update draft token
      token.OwnerId = owner
      await db.createOrUpdateDocument(`draftTokens`, String(draftTokenId), token)
      await db.createOrUpdateDocument(`owners/${owner}/validDraftTokens`, String(draftTokenId), token)

      // grab past used draft token record and give to new owner
      if (pastOwner !== owner) {
        previousRecord = await db.readDocument(`owners/${pastOwner}/validDraftTokens`, String(draftTokenId))
        if (previousRecord) await db.deleteDocument(`owners/${pastOwner}/validDraftTokens`, String(draftTokenId))
      }
      
      console.log(`UNUSED TOKEN ${draftTokenId} TRANSFERED FROM ${pastOwner} to ${owner}`)
    }
  }

  console.log(`getting to end of function for draft token ${draftTokenId}`)
  return "success"
}

 const checkToken = async (i) => {
  let previousRecord
  let owner = await cardContract.getOwnerByCardId(i)
  owner = owner.toLowerCase()

  // smart contract returning junk
  if (!owner) {
    console.log(`SMART CONTRACT RETURNED NO OWNER FOR ${i}`)
    
    owner = await cardContract.getOwnerByCardId(i)
    owner = owner.toLowerCase()
  } 
  
  if (!owner) {
    console.log(`CRASH AND BURN ON ${i}`)
  } else {
    // check all contract transfer events to make sure that the token is currently in the correct spot.
    let inAvailable, inUsed
    try {
      inAvailable = await db.readDocument(`owners/${owner}/validDraftTokens`, String(i))
    } catch (e) {
      console.log(e)
      inAvailable = null
    }

    try {
      inUsed = await db.readDocument(`owners/${owner}/usedDraftTokens`, String(i))
    } catch (e) {
      console.log(e)
      inUsed = null
    }

    if (!inAvailable && !inUsed) {
      token = await db.readDocument(`draftTokens`, String(i))
      // Token was never recorded
      if (!token) {
        console.log(`Missing token for ${owner}: ${i}`)
        const resp = await fetch(`https://sbs-drafts-api-w5wydprnbq-uc.a.run.app/owner/${owner.toLowerCase()}/draftToken/mint`, {
          "method": "POST",
          "body": JSON.stringify({
            "MinId": i,
            "MaxId": i
          }),
          headers: {'Content-Type': 'application/json'}
        })
      } else {
        // token has been used already -- transfer the ownership
        if (token.LeagueId) {
          const pastOwner = token.OwnerId.toLowerCase()

          // set new owner and update draft token
          token.OwnerId = owner
          await db.createOrUpdateDocument(`draftTokens`, String(i), token)
          await db.createOrUpdateDocument(`owners/${owner}/usedDraftTokens`, String(i), token)

          // grab past used draft token record and give to new owner
          if (pastOwner !== owner) {
            previousRecord = await db.readDocument(`owners/${pastOwner}/usedDraftTokens`, String(i))
            if (previousRecord) await db.deleteDocument(`owners/${pastOwner}/usedDraftTokens`, String(i))
          }

          // get card in draft
          const draftCard = await db.readDocument(`drafts/${token.LeagueId}/cards`, String(i))
          draftCard.OwnerId = owner
          await db.createOrUpdateDocument(`drafts/${token.LeagueId}/cards`, String(i), draftCard)

          console.log(`USED TOKEN ${i} TRANSFERED FROM ${pastOwner} to ${owner}`)
        } else {
          // token has not been used yet
          const pastOwner = token.OwnerId.toLowerCase()

          // set new owner and update draft token
          token.OwnerId = owner
          await db.createOrUpdateDocument(`draftTokens`, String(i), token)
          await db.createOrUpdateDocument(`owners/${owner}/validDraftTokens`, String(i), token)

          // grab past used draft token record and give to new owner
          if (pastOwner !== owner) {
            previousRecord = await db.readDocument(`owners/${pastOwner}/validDraftTokens`, String(i))
            if (previousRecord) await db.deleteDocument(`owners/${pastOwner}/validDraftTokens`, String(i))
          }
          
          console.log(`UNUSED TOKEN ${i} TRANSFERED FROM ${pastOwner} to ${owner}`)
        }
      } 
    }
  }

  return
}

internals.checkForMissingTokens = async () => {
  const tokenNum = await cardContract.numTokensMinted()
  for (let i=0; i<Math.round(tokenNum / 4); i++) {
    if (i % 10 === 0) {
      await new Promise(r => setTimeout(r, 1000));
    }
    await checkToken(i)
  }
}

internals.checkForMissingTokens2H = async () => {
  const tokenNum = await cardContract.numTokensMinted()
  for (let i=Math.round(tokenNum/4); i<Math.round((tokenNum/4) * 2); i++) {
    if (i % 10 === 0) {
      await new Promise(r => setTimeout(r, 1000));
    }
    await checkToken(i)
  }
}

internals.checkForMissingTokens3H = async () => {
  const tokenNum = await cardContract.numTokensMinted()
  for (let i=Math.round((tokenNum/4) * 2); i<Math.round((tokenNum/4) * 3); i++) {
    if (i % 10 === 0) {
      await new Promise(r => setTimeout(r, 1000));
    }
    await checkToken(i)
  }
}

internals.checkForMissingTokens4H = async () => {
  const tokenNum = await cardContract.numTokensMinted()
  for (let i=Math.round((tokenNum/4) * 3); i<=tokenNum; i++) {
    if (i % 10 === 0) {
      await new Promise(r => setTimeout(r, 1000));
    }
    await checkToken(i)
  }
}

internals.checkForMissingTokensLastBit = async () => {
  const tokenNum = await cardContract.numTokensMinted()
  for (let i=tokenNum-100; i<=tokenNum; i++) {
    if (i % 10 === 0) {
      await new Promise(r => setTimeout(r, 1000));
    }
    await checkToken(i)
  }
}

// internals.checkForMissingTokens2H = async () => {
//   const tokenNum = await cardContract.numTokensMinted()
//   for (let i=Math.round(tokenNum/2); i<tokenNum; i++) {
//     if (i % 10 === 0) {
//       await new Promise(r => setTimeout(r, 1000));
//     }
    
//     let owner = await cardContract.getOwnerByCardId(i)
//     owner = owner.toLowerCase()

//     // smart contract returning junk
//     if (!owner) {
//       console.log(`SMART CONTRACT RETURNED NO OWNER FOR ${i}`)
//       await new Promise(r => setTimeout(r, 2000));
//       owner = await cardContract.getOwnerByCardId(i)
//       owner = owner.toLowerCase()
//     } 
    
//     if (!owner) {
//       console.log(`CRASH AND BURN ON ${i}`)
//     } else {
//       // check all contract transfer events to make sure that the token is currently in the correct spot.
//       let inAvailable, inUsed
//       try {
//         inAvailable = await db.readDocument(`owners/${owner}/validDraftTokens`, String(i))
//       } catch (e) {
//         console.log(e)
//         inAvailable = null
//       }

//       try {
//         inUsed = await db.readDocument(`owners/${owner}/usedDraftTokens`, String(i))
//       } catch (e) {
//         console.log(e)
//         inUsed = null
//       }

//       if (!inAvailable && !inUsed) {
//         token = await db.readDocument(`draftTokens`, String(i))
//         // Token was never recorded
//         if (!token) {
//           if (String(i) === "1512") {
//             console.log("\n\n\nRED ALERT -- DRAFT TOKEN 1512 SEEN IN MINT OF SCRIPT \n\n\n")
//           }
//           console.log(`Missing token for ${owner}: ${i}`)
//           const resp = await fetch(`https://sbs-drafts-api-w5wydprnbq-uc.a.run.app/owner/${owner.toLowerCase()}/draftToken/mint`, {
//             "method": "POST",
//             "body": JSON.stringify({
//               "MinId": i,
//               "MaxId": i
//             }),
//             headers: {'Content-Type': 'application/json'}
//           })
//         } else {
//           if (String(i) === "1512") {
//             console.log("\n\n\nRED ALERT -- DRAFT TOKEN 1512 SEEN IN TRANSFER OF SCRIPT \n\n\n")
//           }
//           // token has been used already -- transfer the ownership
//           if (token.LeagueId) {
//             const pastOwner = token.OwnerId.toLowerCase()
//             console.log(`IN TRANSFER USED TOKEN ${i}: ${pastOwner} => ${owner}`)

//             // set new owner and update draft token
//             token.OwnerId = owner
//             await db.createOrUpdateDocument(`draftTokens`, String(i), token)
//             await db.createOrUpdateDocument(`owners/${owner}/usedDraftTokens`, String(i), token)

//             // grab past used draft token record and give to new owner
//             if (pastOwner !== owner) {
//               previousRecord = await db.readDocument(`owners/${pastOwner}/usedDraftTokens`, String(i))
//               if (previousRecord) await db.deleteDocument(`owners/${pastOwner}/usedDraftTokens`, String(i))
//             }
//             // get card in draft
//             const draftCard = await db.readDocument(`drafts/${token.LeagueId}/cards`, String(i))
//             draftCard.OwnerId = owner
//             await db.createOrUpdateDocument(`drafts/${token.LeagueId}/cards`, String(i), draftCard)

//             console.log(`USED TOKEN ${i} TRANSFERED FROM ${pastOwner} to ${owner}`)
//           } else {
//             console.log("IN UN-USED TOKEN")
//             // token has not been used yet
//             const pastOwner = token.OwnerId.toLowerCase()
//             console.log(`IN TRANSFER UN-USED TOKEN ${i}: ${pastOwner} => ${owner}`)

//             // set new owner and update draft token
//             token.OwnerId = owner
//             await db.createOrUpdateDocument(`draftTokens`, String(i), token)
//             await db.createOrUpdateDocument(`owners/${owner}/validDraftTokens`, String(i), token)

//             // if owners are different delete old one
//             if (pastOwner !== owner) {
//               previousRecord = await db.readDocument(`owners/${pastOwner}/validDraftTokens`, String(i))
//               if (previousRecord) await db.deleteDocument(`owners/${pastOwner}/validDraftTokens`, String(i))
//             }
            
//             console.log(`UNUSED TOKEN ${i} TRANSFERED FROM ${pastOwner} to ${owner}`)
//           }
//         } 
//       }
//     }
//   }
// }

module.exports = internals;