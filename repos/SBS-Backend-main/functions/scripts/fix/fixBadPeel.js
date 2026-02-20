//✍️ STEP: 1  FILL OUT THE SCRIPT TEMPLATE BELOW

/* DESCRIPTION START:
========================

    📝 General Description:

    While nfl week function pointed at the next week early resulting in 18 cards beign able to get free peeled during active week 2 games.  We need to reverse the lineups to what they
    were.  To do this we are taking a data from a backup and restore week 2 lineups for these cards to what they were prior to free peeling. 
    Users will keep their free peel they did but will be given the old score before the free peel.      

    👣 Deployment Steps: node fixBadPeel.js

    🔗 TaskLink: https://trello.com/c/b4Bf9ThN

    📅 Date Run in sbs-fantasy-dev: N/A

    📅 Date Run in sbs-fantasy-prod: 9/20/2022

========================
DESCRIPTION END */

//🗃️ STEP 2: Add needed Dependencies

const SCRIPT_NAME = 'reverse early peels'; //required

//SERVICES
const db = require('../../services/db');
const TX = require('../../services/tx');



//🚀 STEP 3: Write the script.  Include tests for validation where possible

//CONSTANT
const gameWeek = '2022-REG-02';



// const reverseBadMash = async (ownerId, transactionId) => {
//   const tx = await db.readDocument(`/owners/${ownerId}/transactions`, transactionId);
//   const prevCard1 = tx.prevCard1;
//   const prevCard1Id = tx.prevCard1._cardId;
//   const prevCard2 = tx.prevCard2;
//   const prevCard2Id = tx.prevCard2._cardId;

//   await db.createOrUpdateDocument('cards', prevCard1Id, prevCard1, false);
//   await db.createOrUpdateDocument('cards', prevCard2Id, prevCard2, false);

//   //create a reverse transaction object
//   const txData = {
//     type: 'reverseBadMash',
//     _txHash: tx._tx,
//     ownerId: ownerId,
//     isOnChain: false,
//     network: null,
//     metadata: {
//       reversedTx:tx
//     }
//   }

//   //add SBS TX
//   await TX.createSBSTx(txData);
// };

const reverseBadPeel = async (ownerId, cardId, transactionId) => {

  const badTx = await db.readDocument(`owners/${ownerId}/transactions`, transactionId);
  const prevCard = badTx.prevCard;

  //await db.createOrUpdateDocument('cards', cardId, prevCard, false);

  const txData = {
    type: 'reverseBadPeel',
    _txHash: tx._tx,
    ownerId: ownerId,
    isOnChain: false,
    network: null,
    metadata: {
      reversedTx: badTx
    }
  }
  await TX.createSBSTx(txData);
  console.log(`...🔁   owner:${ownerId} cardId:${cardId} txId:${transactionId} reversed`);
}


(async () => {
  console.log(`...📝   START:${SCRIPT_NAME}`);

  // const reverseBatch = [
  //   {
  //     ownerId: '0x035004cc583b3570de4e0ef51edc72f7b17ec61a',
  //     cardId: '1049',
  //     transactionId: 'freePeel-78ab2bfe-56ef-470d-8173-3600f750dd70'
  //   },
  //   {
  //     ownerId: '0x07006a4f8a5cdbc646a9c795f7b2c7b7dc1b702d',
  //     cardId: '6867',
  //     transactionId: ''
  //   },
  //   {
  //     ownerId: '0x2279d531567f00d718fd11e2af05d317efa0944f',
  //     cardId: '2353',
  //     transactionId: ''
  //   },
  //   {
  //     ownerId: '0x2279d531567f00d718fd11e2af05d317efa0944f',
  //     cardId: '2361',
  //     transactionId: ''
  //   },
  //   {
  //     ownerId: '0x2279d531567f00d718fd11e2af05d317efa0944f',
  //     cardId: '2368',
  //     transactionId: ''
  //   },
  //   {
  //     ownerId: '0x2279d531567f00d718fd11e2af05d317efa0944f',
  //     cardId: '5827',
  //     transactionId: ''
  //   },
  //   {
  //     ownerId: '0x443fe69528074351db1c9f2c414818b56bdcd0a1',
  //     cardId: '5558',
  //     transactionId: ''
  //   },
  //   {
  //     ownerId: '0xe5409e401add142388dd1be73959dacdee29a5e1',
  //     cardId: '6083',
  //     transactionId: ''
  //   },
  //   {
  //     ownerId: '0x80d64bec34b0bb27cbc8de863c31d8f3ad0ae249',
  //     cardId: '2549',
  //     transactionId: ''
  //   },
  //   {
  //     ownerId: '0x13193b54e46ee36f756b23fc5128687075ba96eb',
  //     cardId: '3270',
  //     transactionId: ''
  //   },
  //   {
  //     ownerId: '0x9eb01292ba8db18effd099e84e4abb65dfd4b1f7',
  //     cardId: '7006',
  //     transactionId: ''
  //   },
  //   {
  //     ownerId: '0x167c69f524b5677ea639b944996fbe26bc4db8f1',
  //     cardId: '9013',
  //     transactionId: ''
  //   },
  //   {
  //     ownerId: '0xd7677d3c6b14b9f38bf79ebc88c1bced04162249',
  //     cardId: '1427',
  //     transactionId: ''
  //   },
  //   {
  //     ownerId: '0xd7677d3c6b14b9f38bf79ebc88c1bced04162249',
  //     cardId: '1885',
  //     transactionId: ''
  //   },
  //   {
  //     ownerId: '0xd7677d3c6b14b9f38bf79ebc88c1bced04162249',
  //     cardId: '3206',
  //     transactionId: ''
  //   },
  //   {
  //     ownerId: '0x856dc660a70e1c74b14e93f7976d18171fc17204',
  //     cardId: '4542',
  //     transactionId: ''
  //   },
  //   {
  //     ownerId: '0xa6f0830fee0888ced178961619bfb12266a3c681',
  //     cardId: '5387',
  //     transactionId: ''
  //   },
  //   {
  //     ownerId: '0x218105325dee1ee1571e5910e5db42397b4f7146',
  //     cardId: '5754',
  //     transactionId: ''
  //   }
  // ]

  // let lineups = [];
  // let lineupsData = [];
  // for (let i = 0; i < reverseBatch.length; i++) {
  //   const ownerId = reverseBatch[i].ownerId;
  //   const cardId = reverseBatch[i].cardId;
  //   const owner = await db.readDocument('owners', ownerId);
  //   let leaguesCardIsIn = owner.leagues.filter(card => card.cardId === cardId); 
  //   if(leaguesCardIsIn.length < 1){
  //     owner.leagues.push({cardId: cardId, leagueId: 'genesis'});
  //     await db.createOrUpdateDocument(`owners`, ownerId, owner, true);
  //     console.log(`...Fix missing genesis league for ${cardId}`);
  //   }


  //   for(let j = 0; j < leaguesCardIsIn.length; j++){
  //     const leagueId = leaguesCardIsIn[j].leagueId;
  //     const lineup = await db.readDocument(`leagues/${leagueId}/cards/${cardId}/lineups`, gameWeek);
  //     lineupsData.push({
  //       lineup, 
  //       leagueId: leagueId
  //     })
  //   }
  //   //await reverseBadPeel(ownerId, cardId, transactionId);
  // }
  
  
  const lineupData = [
    {
      lineup: {
        _cardId: "1049",
        _createdAt: "2022-09-14T19:16:55.703Z",
        _isDefault: true,
        _isLocked: false,
        _isSetByCurrentOwner: true,
        _ownerId: "0x035004cc583b3570de4e0ef51edc72f7b17ec61a",
        _updatedAt: "2022-09-16T00:20:43.312Z",
        bench: {
          RB: [
            "DET",
            "DEN",
          ],
          WR: [
            "PIT",
            "BAL",
          ],
          QB: [
            "DAL",
          ],
          TE: [
            "CLE",
          ],
          DST: [
            "KC",
          ],
        },
        gameWeek: "2022-REG-02",
        scoreSeason: 172.36,
        scoreWeek: 63.66,
        starting: {
          WR: [
            "TEN",
            "DEN",
            "GB",
          ],
          RB: [
            "CIN",
            "TEN",
          ],
          TE: [
            "PHI",
          ],
          DST: [
            "IND",
          ],
          QB: [
            "GB",
          ],
        },
      },
      leagueId: "genesis",
    },
    {
      lineup: {
        _cardId: "6867",
        _createdAt: "2022-09-14T19:37:58.497Z",
        _isDefault: true,
        _isLocked: false,
        _isSetByCurrentOwner: true,
        _ownerId: "0x07006a4f8a5cdbc646a9c795f7b2c7b7dc1b702d",
        _updatedAt: "2022-09-18T13:42:50.766Z",
        bench: {
          RB: [
            "PIT",
            "LV",
          ],
          QB: [
            "DAL",
          ],
          WR: [
            "BAL",
            "CHI",
          ],
          DST: [
            "KC",
          ],
          TE: [
            "NYJ",
          ],
        },
        gameWeek: "2022-REG-02",
        scoreSeason: 232.46,
        scoreWeek: 109.4,
        starting: {
          QB: [
            "CHI",
          ],
          WR: [
            "SEA",
            "SF",
            "LV",
          ],
          RB: [
            "CLE",
            "TEN",
          ],
          DST: [
            "SF",
          ],
          TE: [
            "NO",
          ],
        },
      },
      leagueId: "genesis",
    },
    {
      lineup: {
        _cardId: "2353",
        _createdAt: "2022-09-14T19:21:40.975Z",
        _isDefault: true,
        _isLocked: false,
        _isSetByCurrentOwner: true,
        _ownerId: "0x2279d531567f00d718fd11e2af05d317efa0944f",
        _updatedAt: "2022-09-15T21:46:06.587Z",
        bench: {
          DST: [
            "PHI",
          ],
          WR: [
            "NYG",
            "NE",
          ],
          TE: [
            "NO",
          ],
          RB: [
            "MIA",
            "PHI",
          ],
          QB: [
            "NO",
          ],
        },
        gameWeek: "2022-REG-02",
        scoreSeason: 243.4,
        scoreWeek: 117.04,
        starting: {
          WR: [
            "CAR",
            "ATL",
            "KC",
          ],
          DST: [
            "TB",
          ],
          RB: [
            "LAR",
            "WAS",
          ],
          QB: [
            "NYG",
          ],
          TE: [
            "TEN",
          ],
        },
      },
      leagueId: "genesis",
    },
    {
      lineup: {
        _cardId: "2361",
        _createdAt: "2022-09-14T19:21:42.784Z",
        _isDefault: true,
        _isLocked: false,
        _isSetByCurrentOwner: true,
        _ownerId: "0x2279d531567f00d718fd11e2af05d317efa0944f",
        _updatedAt: "2022-09-15T22:18:27.701Z",
        bench: {
          QB: [
            "SEA",
          ],
          WR: [
            "NO",
            "NE",
          ],
          DST: [
            "KC",
          ],
          RB: [
            "KC",
            "CIN",
          ],
          TE: [
            "SEA",
          ],
        },
        gameWeek: "2022-REG-02",
        scoreSeason: 195.44,
        scoreWeek: 71,
        starting: {
          QB: [
            "TEN",
          ],
          WR: [
            "HOU",
            "IND",
            "PIT",
          ],
          TE: [
            "DAL",
          ],
          DST: [
            "SF",
          ],
          RB: [
            "NO",
            "ARI",
          ],
        },
      },
      leagueId: "genesis",
    },
    {
      lineup: {
        _cardId: "2368",
        _createdAt: "2022-09-14T19:21:44.492Z",
        _isDefault: true,
        _isLocked: false,
        _isSetByCurrentOwner: true,
        _ownerId: "0x2279d531567f00d718fd11e2af05d317efa0944f",
        _updatedAt: "2022-09-15T22:25:15.516Z",
        bench: {
          DST: [
            "LV",
          ],
          RB: [
            "DAL",
            "BUF",
          ],
          QB: [
            "NO",
          ],
          TE: [
            "HOU",
          ],
          WR: [
            "JAX",
            "ATL",
          ],
        },
        gameWeek: "2022-REG-02",
        scoreSeason: 247.26,
        scoreWeek: 115.8,
        starting: {
          WR: [
            "WAS",
            "CIN",
            "LAC",
          ],
          RB: [
            "TEN",
            "NYJ",
          ],
          DST: [
            "NYG",
          ],
          TE: [
            "PIT",
          ],
          QB: [
            "CAR",
          ],
        },
      },
      leagueId: "genesis",
    },
    {
      lineup: {
        _cardId: "5827",
        _createdAt: "2022-09-14T19:34:11.951Z",
        _isDefault: true,
        _isLocked: false,
        _isSetByCurrentOwner: false,
        _ownerId: "0x2279d531567f00d718fd11e2af05d317efa0944f",
        _updatedAt: "2022-09-14T19:34:11.951Z",
        bench: {
          QB: [
            "IND",
          ],
          TE: [
            "SEA",
          ],
          WR: [
            "NYG",
            "NE",
          ],
          DST: [
            "SEA",
          ],
          RB: [
            "CHI",
            "SEA",
          ],
        },
        gameWeek: "2022-REG-02",
        scoreSeason: 284.76,
        scoreWeek: 131.44,
        starting: {
          DST: [
            "LAR",
          ],
          WR: [
            "LAR",
            "SF",
            "LV",
          ],
          QB: [
            "NYG",
          ],
          RB: [
            "LAC",
            "DET",
          ],
          TE: [
            "SF",
          ],
        },
      },
      leagueId: "genesis",
    },
    {
      lineup: {
        _cardId: "5558",
        _createdAt: "2022-09-14T19:33:12.771Z",
        _isDefault: true,
        _isLocked: false,
        _isSetByCurrentOwner: true,
        _ownerId: "0x443fe69528074351db1c9f2c414818b56bdcd0a1",
        _updatedAt: "2022-09-15T11:40:20.028Z",
        bench: {
          RB: [
            "CHI",
            "ATL",
          ],
          WR: [
            "NYG",
            "LAC",
          ],
          QB: [
            "CLE",
          ],
          DST: [
            "NYJ",
          ],
          TE: [
            "HOU",
          ],
        },
        gameWeek: "2022-REG-02",
        scoreSeason: 264.82,
        scoreWeek: 133.44,
        starting: {
          WR: [
            "NO",
            "LAR",
            "PIT",
          ],
          RB: [
            "GB",
            "CAR",
          ],
          DST: [
            "MIN",
          ],
          TE: [
            "PHI",
          ],
          QB: [
            "NO",
          ],
        },
      },
      leagueId: "genesis",
    },
    {
      lineup: {
        _cardId: "6083",
        _createdAt: "2022-09-14T19:35:10.055Z",
        _isDefault: true,
        _isLocked: false,
        _isSetByCurrentOwner: false,
        _ownerId: "0xe5409e401add142388dd1be73959dacdee29a5e1",
        _updatedAt: "2022-09-14T19:35:10.055Z",
        bench: {
          DST: [
            "CHI",
          ],
          RB: [
            "MIA",
            "ARI",
          ],
          WR: [
            "NE",
            "IND",
          ],
          QB: [
            "MIN",
          ],
          TE: [
            "WAS",
          ],
        },
        gameWeek: "2022-REG-02",
        scoreSeason: 192.44,
        scoreWeek: 57.3,
        starting: {
          RB: [
            "TEN",
            "DAL",
          ],
          QB: [
            "TEN",
          ],
          TE: [
            "CHI",
          ],
          WR: [
            "BAL",
            "PHI",
            "LV",
          ],
          DST: [
            "WAS",
          ],
        },
      },
      leagueId: "genesis",
    },
    {
      lineup: {
        _cardId: "2549",
        _createdAt: "2022-09-14T19:22:23.520Z",
        _isDefault: true,
        _isLocked: false,
        _isSetByCurrentOwner: false,
        _ownerId: "0x60979e4323050fc6783c77b097585aa3ce355f2c",
        _updatedAt: "2022-09-14T19:22:23.520Z",
        bench: {
          WR: [
            "PIT",
            "TB",
          ],
          RB: [
            "DAL",
            "TB",
          ],
          DST: [
            "CAR",
          ],
          QB: [
            "NYJ",
          ],
          TE: [
            "TEN",
          ],
        },
        gameWeek: "2022-REG-02",
        scoreSeason: 255.4,
        scoreWeek: 134,
        starting: {
          TE: [
            "LAR",
          ],
          RB: [
            "CAR",
            "CIN",
          ],
          DST: [
            "ATL",
          ],
          WR: [
            "KC",
            "NO",
            "NYJ",
          ],
          QB: [
            "CAR",
          ],
        },
      },
      leagueId: "genesis",
    },
    {
      lineup: {
        _cardId: "3270",
        _createdAt: "2022-09-14T19:25:00.231Z",
        _isDefault: true,
        _isLocked: false,
        _isSetByCurrentOwner: true,
        _ownerId: "0x13193b54e46ee36f756b23fc5128687075ba96eb",
        _updatedAt: "2022-09-15T21:01:57.700Z",
        bench: {
          WR: [
            "LAC",
            "CHI",
          ],
          TE: [
            "NYJ",
          ],
          DST: [
            "HOU",
          ],
          RB: [
            "DAL",
            "NYJ",
          ],
          QB: [
            "NYJ",
          ],
        },
        gameWeek: "2022-REG-02",
        scoreSeason: 247.7,
        scoreWeek: 132.9,
        starting: {
          TE: [
            "ARI",
          ],
          WR: [
            "LAR",
            "DEN",
            "KC",
          ],
          DST: [
            "GB",
          ],
          QB: [
            "JAX",
          ],
          RB: [
            "MIN",
            "LAC",
          ],
        },
      },
      leagueId: "genesis",
    },
    {
      lineup: {
        _cardId: "7006",
        _createdAt: "2022-09-14T19:38:29.656Z",
        _isDefault: true,
        _isLocked: false,
        _isSetByCurrentOwner: true,
        _ownerId: "0x9eb01292ba8db18effd099e84e4abb65dfd4b1f7",
        _updatedAt: "2022-09-15T18:47:04.435Z",
        bench: {
          TE: [
            "CLE",
          ],
          QB: [
            "GB",
          ],
          DST: [
            "NYJ",
          ],
          RB: [
            "ARI",
            "MIA",
          ],
          WR: [
            "ATL",
            "WAS",
          ],
        },
        gameWeek: "2022-REG-02",
        scoreSeason: 269.06,
        scoreWeek: 99.56,
        starting: {
          WR: [
            "PHI",
            "CAR",
            "IND",
          ],
          TE: [
            "NYJ",
          ],
          DST: [
            "ARI",
          ],
          RB: [
            "IND",
            "CLE",
          ],
          QB: [
            "DEN",
          ],
        },
      },
      leagueId: "genesis",
    },
    {
      lineup: {
        _cardId: "9013",
        _createdAt: "2022-09-14T19:45:40.692Z",
        _isDefault: true,
        _isLocked: false,
        _isSetByCurrentOwner: true,
        _ownerId: "0x167c69f524b5677ea639b944996fbe26bc4db8f1",
        _updatedAt: "2022-09-15T12:36:34.395Z",
        bench: {
          WR: [
            "NO",
            "CHI",
          ],
          DST: [
            "CHI",
          ],
          TE: [
            "SF",
          ],
          QB: [
            "ARI",
          ],
          RB: [
            "HOU",
            "NE",
          ],
        },
        gameWeek: "2022-REG-02",
        scoreSeason: 256.42,
        scoreWeek: 103.1,
        starting: {
          RB: [
            "DEN",
            "LAC",
          ],
          QB: [
            "MIN",
          ],
          DST: [
            "NYJ",
          ],
          TE: [
            "PHI",
          ],
          WR: [
            "SF",
            "DEN",
            "LAR",
          ],
        },
      },
      leagueId: "genesis",
    },
    {
      lineup: {
        _cardId: "1427",
        _createdAt: "2022-09-14T19:18:17.572Z",
        _isDefault: true,
        _isLocked: false,
        _isSetByCurrentOwner: false,
        _ownerId: "0x2f5ab230e5b0564c0eecc93674a8b85b781a499f",
        _updatedAt: "2022-09-14T19:18:17.572Z",
        bench: {
          TE: [
            "MIN",
          ],
          RB: [
            "DAL",
            "JAX",
          ],
          WR: [
            "NE",
            "PIT",
          ],
          DST: [
            "LAC",
          ],
          QB: [
            "NE",
          ],
        },
        gameWeek: "2022-REG-02",
        scoreSeason: 182.18,
        scoreWeek: 73.5,
        starting: {
          WR: [
            "ARI",
            "GB",
            "HOU",
          ],
          QB: [
            "IND",
          ],
          DST: [
            "KC",
          ],
          TE: [
            "LV",
          ],
          RB: [
            "ATL",
            "BUF",
          ],
        },
      },
      leagueId: "genesis",
    },
    {
      lineup: {
        _cardId: "1885",
        _createdAt: "2022-09-14T19:19:56.967Z",
        _isDefault: true,
        _isLocked: false,
        _isSetByCurrentOwner: true,
        _ownerId: "0xd7677d3c6b14b9f38bf79ebc88c1bced04162249",
        _updatedAt: "2022-09-17T01:28:44.280Z",
        bench: {
          WR: [
            "CAR",
            "NYG",
          ],
          DST: [
            "SEA",
          ],
          TE: [
            "MIA",
          ],
          QB: [
            "NYG",
          ],
          RB: [
            "MIA",
            "NO",
          ],
        },
        gameWeek: "2022-REG-02",
        scoreSeason: 186.48,
        scoreWeek: 51.56,
        starting: {
          DST: [
            "NE",
          ],
          QB: [
            "CIN",
          ],
          TE: [
            "CHI",
          ],
          RB: [
            "ATL",
            "LV",
          ],
          WR: [
            "BUF",
            "MIN",
            "KC",
          ],
        },
      },
      leagueId: "genesis",
    },
    {
      lineup: {
        _cardId: "3206",
        _createdAt: "2022-09-14T19:24:46.153Z",
        _isDefault: true,
        _isLocked: false,
        _isSetByCurrentOwner: true,
        _ownerId: "0xd7677d3c6b14b9f38bf79ebc88c1bced04162249",
        _updatedAt: "2022-09-17T01:30:06.023Z",
        bench: {
          QB: [
            "NYJ",
          ],
          RB: [
            "NYJ",
            "ARI",
          ],
          WR: [
            "NYG",
            "DET",
          ],
          DST: [
            "BUF",
          ],
          TE: [
            "CLE",
          ],
        },
        gameWeek: "2022-REG-02",
        scoreSeason: 236.48,
        scoreWeek: 85.66,
        starting: {
          DST: [
            "BAL",
          ],
          WR: [
            "PHI",
            "IND",
            "NO",
          ],
          RB: [
            "SF",
            "LAR",
          ],
          QB: [
            "CIN",
          ],
          TE: [
            "CIN",
          ],
        },
      },
      leagueId: "genesis",
    },
    {
      lineup: {
        _cardId: "4542",
        _createdAt: "2022-09-14T19:29:34.697Z",
        _isDefault: true,
        _isLocked: false,
        _isSetByCurrentOwner: true,
        _ownerId: "0x856dc660a70e1c74b14e93f7976d18171fc17204",
        _updatedAt: "2022-09-18T12:06:47.453Z",
        bench: {
          QB: [
            "DET",
          ],
          WR: [
            "IND",
            "CLE",
          ],
          RB: [
            "CHI",
            "BAL",
          ],
          DST: [
            "MIA",
          ],
          TE: [
            "MIA",
          ],
        },
        gameWeek: "2022-REG-02",
        scoreSeason: 237.86,
        scoreWeek: 135.86,
        starting: {
          WR: [
            "CHI",
            "NO",
            "DAL",
          ],
          TE: [
            "DEN",
          ],
          DST: [
            "TB",
          ],
          QB: [
            "SF",
          ],
          RB: [
            "DET",
            "CAR",
          ],
        },
      },
      leagueId: "genesis",
    },
    {
      lineup: {
        _cardId: "5387",
        _createdAt: "2022-09-14T19:32:36.360Z",
        _isDefault: true,
        _isLocked: false,
        _isSetByCurrentOwner: true,
        _ownerId: "0xa6f0830fee0888ced178961619bfb12266a3c681",
        _updatedAt: "2022-09-15T11:38:12.594Z",
        bench: {
          QB: [
            "DEN",
          ],
          WR: [
            "CLE",
            "TB",
          ],
          DST: [
            "HOU",
          ],
          RB: [
            "ATL",
            "LV",
          ],
          TE: [
            "MIN",
          ],
        },
        gameWeek: "2022-REG-02",
        scoreSeason: 241.5,
        scoreWeek: 98.7,
        starting: {
          QB: [
            "PHI",
          ],
          TE: [
            "ARI",
          ],
          DST: [
            "NYG",
          ],
          RB: [
            "LAC",
            "CHI",
          ],
          WR: [
            "CIN",
            "MIN",
            "DAL",
          ],
        },
      },
      leagueId: "genesis",
    },
    {
      lineup: {
        _cardId: "5754",
        _createdAt: "2022-09-14T19:33:55.049Z",
        _isDefault: true,
        _isLocked: false,
        _isSetByCurrentOwner: true,
        _ownerId: "0x218105325dee1ee1571e5910e5db42397b4f7146",
        _updatedAt: "2022-09-16T17:06:36.086Z",
        bench: {
          DST: [
            "ATL",
          ],
          TE: [
            "CHI",
          ],
          RB: [
            "MIA",
            "SEA",
          ],
          WR: [
            "CHI",
            "TB",
          ],
          QB: [
            "NYJ",
          ],
        },
        gameWeek: "2022-REG-02",
        scoreSeason: 240.98,
        scoreWeek: 77.78,
        starting: {
          RB: [
            "NYG",
            "LV",
          ],
          QB: [
            "LAR",
          ],
          WR: [
            "SF",
            "HOU",
            "MIN",
          ],
          DST: [
            "MIA",
          ],
          TE: [
            "ARI",
          ],
        },
      },
      leagueId: "genesis",
    },
  ];

  for(let i = 0; i < lineupData.length; i++){
    const leagueId = lineupData[i].leagueId;
    const cardId = lineupData[i].lineup._cardId;
    const gameWeek = '2022-REG-02';
    const lineup = lineupData[i].lineup;

    await db.createOrUpdateDocument(`leagues/${leagueId}/cards/${cardId}/lineups`, gameWeek, lineup, false);
    console.log(`...league:${leagueId} card:${cardId} gameWeek:${gameWeek}`);
  }

  console.log(`...📝   END:${SCRIPT_NAME}`);
  process.exit(0);
})();
