
//app dependencies
const db = require('../services/db');
const utils = require('../services/utils');

//check that the start lineup is allowed
module.exports = async (req, res, next) => {
  console.log('...checkPlayIsValid middleware called');

  const prevStartingLineup = req.res.locals.currentTeam.startingLineup;
  const currentStartingLineup = utils.cleanCardObject(req.body.startingLineup);
  let prev;
  let current;
  let isValidPlay
  let positionId;

  //checks that the teams and positions belong to the card
  const validPostionIds = utils.getAllNFLPositionIds();
  for (let i = 0; i < validPostionIds.length; i++) {
    positionId = validPostionIds[i];
    prev = prevStartingLineup.filter(player => player.positionId === positionId);
    current = currentStartingLineup.filter(player => player.positionId === positionId);

    if(current.length != 1 || isValidPlay === false){
      console.log('...checkPlayIsValid middleware failed');
      return res.status(400).send(`Invalid starting lineup for position ${positionId}.  prev: ${JSON.stringify(prev[0])} current:${JSON.stringify(current[0])}`);
    }
  }

  //check there is a enough players in the starting lineup for each position
  const startingQB = currentStartingLineup.filter(player => player.starting == true && player.positionLabel == "QB")
  const startingRB = currentStartingLineup.filter(player => player.starting == true && player.positionLabel == "RB")
  const startingWR = currentStartingLineup.filter(player => player.starting == true && player.positionLabel == "WR")
  const startingTE = currentStartingLineup.filter(player => player.starting == true && player.positionLabel == "TE")
  const startingDEF = currentStartingLineup.filter(player => player.starting == true && player.positionLabel == "DST")

  if(startingQB.length != 1) return res.status(400).send(`${startingQB.length} is an invalid number of starting QBs`);
  if(startingRB.length != 2) return res.status(400).send(`${startingRB.length} is an invalid number of starting RBs`);
  if(startingWR.length != 3) return res.status(400).send(`${startingWR.length} is an invalid number of starting WRs`);
  if(startingTE.length != 1) return res.status(400).send(`${startingTE.length} is an invalid number of starting TEs`);
  if(startingDEF.length != 1)return res.status(400).send(`${startingDEF.length} is an invalid number of starting DSTs`);


  //Check that a player change is not currently in a started or ended game
  //TODO: Add Reference to an environmental variable for current NFL week String
  const gameStatusData = await db.readDocument('scores', '2021-REG-week-18');
 
  let _scores;
  let currentTeam;
  let prevTeam;
  let currentPlayingErrorMessage;
  for (let i = 0; i < currentStartingLineup.length; i++) {
    currentTeam = currentStartingLineup[i];
    _scores = gameStatusData.FantasyPoints.find(x => x.team === currentTeam.teamId);
    prevTeam = prevStartingLineup.find(x => utils.translateTeam(x.teamId) === currentTeam.teamId && x.positionLabel === currentTeam.positionLabel);

    

    if(_scores.gameStatus != 'none' && currentTeam.starting != prevTeam.starting ) {
      currentPlayingErrorMessage = `Player ${currentStartingLineup[i].teamPosition} is an active or finished game and cannot be changed.`;
      isValidPlay = false;
      break;
    }
  }
    
  if(isValidPlay === false) return res.status(400).send(currentPlayingErrorMessage);

  next();
};