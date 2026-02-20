//PACKAGES
const express = require('express');
const crypto = require('crypto')

const adminRouter = express.Router();
const db = require('../services/db');
const utils = require('../services/utils'); 
require("firebase-functions/lib/logger/compat");

//SERVICES
const sbs = require('../services/sbs');
const stat = require('../services/stat');
const score = require('../services/score');

adminRouter.get('/', (req, res) => {
  //placeholder
  res.send('...🔐 base admin route')
});


adminRouter.post('/updateLeaguesCards', async (req, res) => {
  const { cardId } = req.body;
  
  if (!cardId) return res.status(400).send('Missing body');
  
  try {
    const leagues = await db.readAllDocuments('leagues');
  
    for (let i=0; i < leagues.length; i++) {
      const leagueId = leagues[i].id;
      const league = leagues[i];
    
      const prevCard = await db.readDocument(`leagues/${leagueId}/cards`, cardId);
      if (!prevCard) continue;
      const currentCard = await db.readDocument('cards', cardId);
      if (!currentCard) continue;
              
      currentCard.joinedAt = prevCard.joinedAt || db._getTimeStamp();
      currentCard.isLocked = prevCard.isLocked || false;
      
      await db.createOrUpdateDocument(`leagues/${leagueId}/cards`, cardId, currentCard, true);
      console.log(`...🃏   Update card:${cardId} for league:${leagueId}`);
      const defaultLineup = utils.getDefaultLineup(currentCard);
      await utils.setDefaultLineupInLeague(defaultLineup, league, sbs.getNFLWeekV2());
    }
    res.status(200).send('Updated succsesfully!');
  } catch (e) {
    res.status(500).send('Something went wrong');
  }
})

adminRouter.post('/updateLineup', async (req, res) => {
  const { lineups, cardId, leagueId } = req.body;
  let { gameWeek } = req.body;

  if (!cardId || !leagueId) return res.status(400).send('Missing cardId or leagueId');

  const card = await db.readDocument('cards', cardId);
  if(!card) return res.status(404).send(`...card:${cardId} cannot be found or does NOT exist`);

  const isCardInLeague = await db.readDocument(`leagues/${leagueId}/cards`, cardId);
  if(!isCardInLeague) return res.status(401).send(`...card:${cardId} has not joined league:${leagueId}`);

  if(!card.QB.includes(lineups.starting.QB[0])) return res.status(400).send(`...${lineups.starting.QB[0]} is not a valid starting QB for cardId:${cardId}`);
  if(!card.RB.includes(lineups.starting.RB[0])) return res.status(400).send(`...${lineups.starting.RB[0]} is not a valid starting RB for cardId:${cardId}`);
  if(!card.RB.includes(lineups.starting.RB[1])) return res.status(400).send(`...${lineups.starting.RB[1]} is not a valid starting RB for cardId:${cardId}`);
  if(!card.WR.includes(lineups.starting.WR[0])) return res.status(400).send(`...${lineups.starting.WR[0]} is not a valid starting WR for cardId:${cardId}`);
  if(!card.WR.includes(lineups.starting.WR[1])) return res.status(400).send(`...${lineups.starting.WR[1]} is not a valid starting WR for cardId:${cardId}`);
  if(!card.WR.includes(lineups.starting.WR[2])) return res.status(400).send(`...${lineups.starting.WR[2]} is not a valid starting WR for cardId:${cardId}`);
  if(!card.TE.includes(lineups.starting.TE[0])) return res.status(400).send(`...${lineups.starting.TE[0]} is not a valid starting TE for cardId:${cardId}`);
  if(!card.DST.includes(lineups.starting.DST[0])) return res.status(400).send(`...${lineups.starting.DST[0]} is not a valid starting DST for cardId:${cardId}`);

  if(!card.QB.includes(lineups.bench.QB[0])) return res.status(400).send(`...${lineups.bench.QB[0]} is not a valid bench QB for cardId:${cardId}`);
  if(!card.RB.includes(lineups.bench.RB[0])) return res.status(400).send(`...${lineups.bench.RB[0]} is not a valid bench RB for cardId:${cardId}`);
  if(!card.RB.includes(lineups.bench.RB[1])) return res.status(400).send(`...${lineups.bench.RB[1]} is not a valid bench RB for cardId:${cardId}`);
  if(!card.WR.includes(lineups.bench.WR[0])) return res.status(400).send(`...${lineups.bench.WR[0]} is not a valid bench WR for cardId:${cardId}`);
  if(!card.WR.includes(lineups.bench.WR[1])) return res.status(400).send(`...${lineups.bench.WR[1]} is not a valid bench WR for cardId:${cardId}`);
  if(!card.TE.includes(lineups.bench.TE[0])) return res.status(400).send(`...${lineups.bench.TE[0]} is not a valid bench TE for cardId:${cardId}`);
  if(!card.DST.includes(lineups.bench.DST[0])) return res.status(400).send(`...${lineups.bench.DST[0]} is not a valid bench DST for cardId:${cardId}`);

  gameWeek = gameWeek || sbs.getNFLWeekV2();
  const oldLineup = await db.readDocument(`leagues/${leagueId}/cards/${cardId}/lineups`, gameWeek);

  const newLineupDocument = utils.setAdminLineup(lineups, card);
  newLineupDocument.scoreSeason = (oldLineup) ? oldLineup.scoreSeason : 0;
  newLineupDocument.scoreWeek = (oldLineup) ? oldLineup.scoreWeek : 0;
  newLineupDocument.prevWeekSeasonScore = (oldLineup) ? oldLineup.prevWeekSeasonScore : 0
  newLineupDocument.gameWeek = gameWeek;

  await db.createOrUpdateDocument(`leagues/${leagueId}/cards/${cardId}/lineups`, gameWeek, newLineupDocument, true);

  res.status(200).send(newLineupDocument)
})

adminRouter.post('/score/week/:gameWeek/fetch', async (req, res) => {
  const gameWeek = req.params.gameWeek || sbs.getNFLWeekV2();
  await stat.setScoresFromStats(gameWeek);
  res.send(`...📝   Score set for ${gameWeek}`);
});

adminRouter.post('/score/week/:gameWeek/league', async (req, res) => {
  const gameWeek = req.params.gameWeek || sbs.getNFLWeekV2();
  await score.scoreLeagues(gameWeek);
  res.send(`...🥇   Leagues score set for ${gameWeek}`);
});

adminRouter.post('/score/week/:gameWeek/genesis', async (req, res) => {
  const gameWeek = req.params.gameWeek || sbs.getNFLWeekV2();
  await score.scoreLineupsInGenesis(gameWeek, 0, 55);
  res.send(`...🥇   genesis score set for ${gameWeek}`);
});

adminRouter.get('/genesisWinnings/week/:gameWeek/', async (req, res) => {
  const gameWeek = req.params.gameWeek || sbs.getNFLWeekV2();
  const boardType = req.query.boardType || weekAll;
  const board = await db.getGenesisWinnings(gameWeek, boardType);
  res.send(board);
})

const triggersConfig = {
  EXPO_PUBLIC_WEB3AUTH_CLIENT_ID: 'BGdh_ZlTUAI1CdnGCabpWILIoZm4jNlfvvEhDNGMFy7uiVisTcbXbYMnv8qZj98mICqQF_bOt4j2rQP47onyi9A',
  EXPO_PUBLIC_WEB3AUTH_PROJECT_ID: 'a2f6b3e4efba7158a38f93b735e6a315',
  EXPO_PUBLIC_FIREBASE_API_KEY: 'AIzaSyCn1rcJUC4EzNzN8F4JDfOSQc6cC3ZbzcQ',
  EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN: 'sbs-triggers-fantasy.firebaseapp.com',
  EXPO_PUBLIC_FIREBASE_DATABASE_URL: 'https://sbs-triggers-fantasy-default-rtdb.firebaseio.com',
  EXPO_PUBLIC_FIREBASE_PROJECT_ID: 'sbs-triggers-fantasy',
  EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET: 'sbs-triggers-fantasy.appspot.com',
  EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: '991530757352',
  EXPO_PUBLIC_FIREBASE_APP_ID: '1:991530757352:web:228050834e572cd7f2ed5d',
  EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID: 'G-G0YYDNZNV6'
}

const algorithm = 'aes-256-ctr';
const secretKey = 'sbs-secret-sbs-dkfjofijdfd';
const secretIv = 'sbs';
const key = crypto.createHash('sha256').update(secretKey, 'utf-8').digest('base64').substring(0, 32)
const iv = crypto.createHash('sha256').update(secretIv, 'utf-8').digest('base64').substring(0, 16)

const encrypt = (buffer) => {
    // Create a new cipher using the algorithm, key, and iv
    const cipher = crypto.createCipheriv(algorithm, key, iv);
    // Create the new (encrypted) buffer
    const result = cipher.update(buffer, 'utf8', 'base64') + cipher.final('base64');
    return Buffer.from(result).toString('base64');
}

adminRouter.get('/getEncrypted/env/:env', async (req, res) => {
  const environment = req.params.env || "triggers";
  let stringifyData = (environment.toLocaleLowerCase() == 'prod') ? {} : JSON.stringify(triggersConfig)
  const result = encrypt(stringifyData)
  res.status(200).send(result.toString())
})



adminRouter.get('/getEncrypted', async (req, res) => {
  const data = await db.readDocument('phrases', 'fields')
  res.status(200).send(data)
})



module.exports = adminRouter;