const env = require('./env');
const db = require('./db');
const utils = require('./utils');
const api = require('./api');

const _VALID_PLAYOFF_TEAMS = env.get('VALID_PLAYOFF_TEAMS');

const internals = {};

internals.generateTeamHash = (card) => {
    let _QB = card.QB.sort();
    let _RB = card.RB.sort();
    let _WR = card.WR.sort();
    let _TE = card.TE.sort();
    let _DST = card.DST.sort(); 

    return `QB:${_QB[0]},${_QB[1]}|RB:${_RB[0]},${_RB[1]},${_RB[2]},${_RB[3]}|WR:${_WR[0]},${_WR[1]},${_WR[2]},${_WR[3]},${_WR[4]}|TE:${_TE[0]},${_TE[1]}|DST:${_DST[0]},${_DST[1]}`; 
}

internals._sortObject = (o) => {
    let sorted = {},
      key,
      a = [];
  
    for (key in o) {
      if (o.hasOwnProperty(key)) {
        a.push(key);
      }
    }
  
    a.sort();
  
    for (key = 0; key < a.length; key++) {
      sorted[a[key]] = o[a[key]];
    }
    return sorted;
};


internals.shuffle = function*(...array) {
    let i = array.length;
    while (i--) {
      yield array.splice(Math.floor(Math.random() * (i + 1)), 1)[0];
    }
}

internals.shuffleTeam = async (cardId) => {
    let shuffledTeam;
    let randomQB = internals.shuffle(..._VALID_PLAYOFF_TEAMS);
    let randomWR = internals.shuffle(..._VALID_PLAYOFF_TEAMS);
    let randomRB = internals.shuffle(..._VALID_PLAYOFF_TEAMS);
    let randomTE = internals.shuffle(..._VALID_PLAYOFF_TEAMS);
    let randomDST = internals.shuffle(..._VALID_PLAYOFF_TEAMS);
  
    shuffledTeam = {
        _cardId: cardId,
        _freePeel: 0,
        _level: "Pro",
        _ownerId: null,
        QB: [randomQB.next().value, randomQB.next().value].sort(),
        RB: [randomRB.next().value, randomRB.next().value, randomRB.next().value, randomRB.next().value].sort(),
        WR: [randomWR.next().value, randomWR.next().value, randomWR.next().value, randomWR.next().value, randomWR.next().value].sort(),
        TE: [randomTE.next().value, randomTE.next().value].sort(),
        DST: [randomDST.next().value, randomDST.next().value].sort(),
    }
     
      
    const teamHash = internals.generateTeamHash(shuffledTeam);
  
    const alreadyExists = await db.validateUniquenessByPlayoffTeamHash(teamHash);
    if(alreadyExists) return internals.shuffleTeam(card);
    shuffledTeam._teamHash = teamHash;
  
    return shuffledTeam;
}


internals.convertPlayoffCardToCardMetadata = async (card) => {
    return cardMetadata = {
      attributes: [
        {
          trait_type: "QB1",
          value: card.QB[0],
        },
        {
          trait_type: "QB2",
          value: card.QB[1],
        },
        {
          trait_type: "RB1",
          value: card.RB[0],
        },
        {
          trait_type: "RB2",
          value: card.RB[1],
        },
        {
          trait_type: "RB3",
          value: card.RB[2],
        },
        {
          trait_type: "RB4",
          value: card.RB[3],
        },
        {
          trait_type: "WR1",
          value: card.WR[0],
        },
        {
          trait_type: "WR2",
          value: card.WR[1],
        },
        {
          trait_type: "WR3",
          value: card.WR[2],
        },
        {
          trait_type: "WR4",
          value: card.WR[3],
        },
        {
          trait_type: "WR5",
          value: card.WR[4],
        },
        {
          trait_type: "TE1",
          value: card.TE[0],
        },
        {
          trait_type: "TE2",
          value: card.TE[1],
        },
        {
          trait_type: "DST1",
          value: card.DST[0],
        },
        {
          trait_type: "DST2",
          value: card.DST[1],
        },
        {
          trait_type: "LEVEL",
          value: card._level,
        },
      ],
      description: "Our 10,000 Spoiled Banana Society Playoff Season 1 Cards minted on the Ethereum blockchain doubles as your membership and gives you access to the Spoiled Banana Society benefits including playing each year in our SBS Playoffs Season 1 League with no further purchase necessary.",
      image: card._imageUrl,
      name: `Spoiled Banana Society Playoffs Season #1 ${card._cardId}`,
    };
}

internals.peelCard = async (card, peelType) => {
  console.log(card);
  let newCard = internals._sortObject(await internals.shuffleTeam(card._cardId));
  console.log(newCard);
  // need to make a new function for playoff card images once I have those
  newCard = await api.getPlayoffCardImage(newCard);
  return newCard;
}

internals._getSharedTeams = (arr) => arr.filter((item, index) => arr.indexOf(item) !== index);

internals.mashCards = async (card1, card2) => {
  let randomQBArr = [];
  card1.QB.forEach(team => {randomQBArr.push(team)});
  card2.QB.forEach(team => {randomQBArr.push(team)});
  const sharedQBArr = internals._getSharedTeams(randomQBArr);
  const sharedQBSet = new Set(sharedQBArr);
  randomQBArr = randomQBArr.filter(team => !sharedQBSet.has(team));
  randomQBArr = [...new Set(randomQBArr)];
  const randomQB = internals.shuffle(...randomQBArr);
  
  let randomWRArr = [];
  card1.WR.forEach(team => {randomWRArr.push(team)});
  card2.WR.forEach(team => {randomWRArr.push(team)});
  const sharedWRArr = internals._getSharedTeams(randomWRArr);
  const sharedWRSet = new Set(sharedWRArr);
  randomWRArr = randomWRArr.filter(team => !sharedWRSet.has(team));
  randomWRArr = [...new Set(randomWRArr)];
  const randomWR = internals.shuffle(...randomWRArr);
  
  let randomRBArr = [];
  card1.RB.forEach(team => {randomRBArr.push(team)});
  card2.RB.forEach(team => {randomRBArr.push(team)});
  const sharedRbTeams = internals._getSharedTeams(randomRBArr);
  const sharedRBSet = new Set(sharedRbTeams);
  randomRBArr = randomRBArr.filter( x => !sharedRBSet.has(x) );
  randomRBArr = [...new Set(randomRBArr)];
  const randomRB = internals.shuffle(...randomRBArr);
  
  let randomTEArr = [];
  card1.TE.forEach(team => {randomTEArr.push(team)});
  card2.TE.forEach(team => {randomTEArr.push(team)});
  const sharedTEArr = internals._getSharedTeams(randomTEArr);
  const sharedTESet = new Set(sharedTEArr);
  randomTEArr = randomTEArr.filter(team => !sharedTESet.has(team));
  randomTEArr = [...new Set(randomTEArr)];
  const randomTE = internals.shuffle(...randomTEArr);
  
  let randomDSTArr = [];
  card1.DST.forEach(team => {randomDSTArr.push(team)});
  card2.DST.forEach(team => {randomDSTArr.push(team)});
  const sharedDSTArr = internals._getSharedTeams(randomDSTArr);
  const sharedDSTSet = new Set(sharedDSTArr);
  randomDSTArr = randomDSTArr.filter(team => !sharedDSTSet.has(team));
  randomDSTArr = [...new Set(randomDSTArr)];
  const randomDST = internals.shuffle(...randomDSTArr);

  let mashedCard1;
  let mashedCard2;
  
  if(card1.prizes) {
    mashedCard1 = {
      _cardId: card1._cardId,
      _freePeel: card1._freePeel,
      _level: card1._level,
      _ownerId: card1._ownerId,
      prizes: card1.prizes,
      QB: internals._getArrOfRandomValues(randomQB, 2, sharedQBArr),
      RB: internals._getArrOfRandomValues(randomRB, 4, sharedRbTeams),
      WR: internals._getArrOfRandomValues(randomWR, 5, sharedWRArr),
      TE: internals._getArrOfRandomValues(randomTE, 2, sharedTEArr),
      DST: internals._getArrOfRandomValues(randomDST, 2, sharedDSTArr),
    }
  } else {
    mashedCard1 = {
      _cardId: card1._cardId,
      _freePeel: card1._freePeel,
      _level: card1._level,
      _ownerId: card1._ownerId,
      QB: internals._getArrOfRandomValues(randomQB, 2, sharedQBArr),
      RB: internals._getArrOfRandomValues(randomRB, 4, sharedRbTeams),
      WR: internals._getArrOfRandomValues(randomWR, 5, sharedWRArr),
      TE: internals._getArrOfRandomValues(randomTE, 2, sharedTEArr),
      DST: internals._getArrOfRandomValues(randomDST, 2, sharedDSTArr),
    }
  }
  
  if(card2.prizes) {
    mashedCard2 = {
      _cardId: card2._cardId,
      _freePeel: card2._freePeel,
      _level: card2._level,
      _ownerId: card2._ownerId,
      prizes: card2.prizes,
      QB: internals._getArrOfRandomValues(randomQB, 2, sharedQBArr),
      RB: internals._getArrOfRandomValues(randomRB, 4, sharedRbTeams),
      WR: internals._getArrOfRandomValues(randomWR, 5, sharedWRArr),
      TE: internals._getArrOfRandomValues(randomTE, 2, sharedTEArr),
      DST: internals._getArrOfRandomValues(randomDST, 2, sharedDSTArr),
    }
  } else {
    mashedCard2 = {
      _cardId: card2._cardId,
      _freePeel: card2._freePeel,
      _level: card2._level,
      _ownerId: card2._ownerId,
      QB: internals._getArrOfRandomValues(randomQB, 2, sharedQBArr),
      RB: internals._getArrOfRandomValues(randomRB, 4, sharedRbTeams),
      WR: internals._getArrOfRandomValues(randomWR, 5, sharedWRArr),
      TE: internals._getArrOfRandomValues(randomTE, 2, sharedTEArr),
      DST: internals._getArrOfRandomValues(randomDST, 2, sharedDSTArr),
    }
  }


  const team1Hash = internals.generateTeamHash(mashedCard1);
  const team1AlreadyExists = await db.validateUniquenessByPlayoffTeamHash(team1Hash);
  const team2Hash = internals.generateTeamHash(mashedCard2);
  const team2AlreadyExists = await db.validateUniquenessByPlayoffTeamHash(team2Hash);

  if(team1AlreadyExists || team2AlreadyExists || team1Hash === team2Hash) return internals.mashCards(card1, card2);
  mashedCard1._teamHash = team1Hash;
  mashedCard1 = internals._sortObject(mashedCard1);
  mashedCard2._teamHash = team2Hash;
  mashedCard2 = internals._sortObject(mashedCard2);

  return await api.getMashPlayoffCardImages(mashedCard1, mashedCard2);
}

module.exports = internals;