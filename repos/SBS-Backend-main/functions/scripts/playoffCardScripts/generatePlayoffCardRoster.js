const env = require('../../services/env');
const db = require('../../services/db');
const utils = require('../../services/utils');

const _VALID_PLAYOFF_TEAMS = env.get('VALID_PLAYOFF_TEAMS');

const generateTeamHash = (card) => {
    let _QB = card.QB.sort();
    let _RB = card.RB.sort();
    let _WR = card.WR.sort();
    let _TE = card.TE.sort();
    let _DST = card.DST.sort(); 

    return `QB:${_QB[0]},${_QB[1]}|RB:${_RB[0]},${_RB[1]},${_RB[2]},${_RB[3]}|WR:${_WR[0]},${_WR[1]},${_WR[2]},${_WR[3]},${_WR[4]}|TE:${_TE[0]},${_TE[1]}|DST:${_DST[0]},${_DST[1]}`; 
}


const shuffle = function*(...array) {
    let i = array.length;
    while (i--) {
      yield array.splice(Math.floor(Math.random() * (i + 1)), 1)[0];
    }
}

const shuffleTeam = async (cardId) => {
    let shuffledTeam;
    let randomQB = shuffle(..._VALID_PLAYOFF_TEAMS);
    let randomWR = shuffle(..._VALID_PLAYOFF_TEAMS);
    let randomRB = shuffle(..._VALID_PLAYOFF_TEAMS);
    let randomTE = shuffle(..._VALID_PLAYOFF_TEAMS);
    let randomDST = shuffle(..._VALID_PLAYOFF_TEAMS);
  
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
     
      
    const teamHash = generateTeamHash(shuffledTeam);
  
    const alreadyExists = await db.validateUniquenessByPlayoffTeamHash(teamHash);
    if(alreadyExists) return shuffleTeam(card);
    shuffledTeam._teamHash = teamHash;
  
    return shuffledTeam;
}

const generatePlayoffCards = async () => {
    console.log('Generating 10,000 playoff NFT card Rosters');
    for(let i = 10000; i < 15000; i++) {
        const cardId = `${i}`;
        console.log('Generating card: ' + cardId)
        const card = await shuffleTeam(cardId);
        console.log(card)
        try {
            await db.createOrUpdateDocument('playoffCards', cardId, card, true)
            console.log(`SAVED card: ${cardId} to playoffCards collection`)
        } catch (err) {
            console.log(err)
            await utils.sleep(20000)
        }
    }
}

const convertCardToCardMetadata = async (card) => {
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
      description: "Our Spoiled Banana Society Playoff Season 1 Cards minted on the Ethereum blockchain doubles as your membership and gives you access to the Spoiled Banana Society benefits including playing each year in our SBS Playoffs Season 1 League with no further purchase necessary.",
      image: card._imageUrl,
      name: `Spoiled Banana Society Playoffs Season #1 ${card._cardId}`,
    };
}

const setMetaDataForPlayoffCards = async () => {
    console.log('Creating and Saving metadata for Playoff Cards');
    for(let i = 10000; i < 15000; i++) {
        const cardId = `${i}`
        console.log('GETTING card: ' + cardId)
        const card = await db.readDocument('playoffCards', cardId)
        card._imageUrl = null;
        const metadata = await convertCardToCardMetadata(card);
        try {
            await db.createOrUpdateDocument('playoffCardMetadata', cardId, metadata, true)
            console.log(`SAVED: metadata for card: ${card._cardId} has been saved`)
        } catch (err) {
            console.log('ERROR: ' + err)
        }
    }
    console.log('COMPLETE')
    return
}

const changecard300 = async () => {
  console.log('Generating 10,000 playoff NFT card Rosters');
  const cardId = `300`;
  console.log('Generating card: ' + cardId)
  const card = await shuffleTeam(cardId);
  console.log(card)
  card._ownerId = '0xdc8acc858e5e01c0ad690f375ff94abf6dc07357';
  const metadata = await convertCardToCardMetadata(card);
  try {
    await db.createOrUpdateDocument('playoffCards', cardId, card, true)
    await db.createOrUpdateDocument('playoffCardMetadata', cardId, metadata, true)
    console.log(`SAVED card: ${cardId} to playoffCards collection`)
  } catch (err) {
      console.log(err)
      await utils.sleep(20000)
  }

}

(async () => {
    console.log('STARTING generatePlayoffCardRoster script');
    await changecard300()
    console.log('Done')
})();