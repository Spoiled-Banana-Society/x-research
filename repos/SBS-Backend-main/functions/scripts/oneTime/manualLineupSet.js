//✍️ STEP: 1  FILL OUT THE SCRIPT TEMPLATE BELOW

/* DESCRIPTION START:
========================

    📝 General Description:

    The intent of the script is to demo use of the script template.  Why we need this script will be included here and 
    an other relevant details. 

    👣 Deployment Steps: node manualLineupSet.js
    
    1.  Ensure we are pointed at prod 
    2.  Write script pointed at week 1
    3.  repoint the scoring crons at 2022-REG-01
    4.  run the crons for a few minutes. 
    5.  turn off the cron
    6.  repoint cron at current week 2022-REG-02
    7.  run the cron
    8.  check leaderboards. 

    If leaderboards are in a good state, save them in a snapshot. (get a backup of just the leaderboard collection each night we have a game so this can be easily restored if needed)

    🔗 TaskLink: Trello Link Here

    📅 Date Run in sbs-fantasy-dev:

    📅 Date Run in sbs-fantasy-prod:

========================
DESCRIPTION END */

//🗃️ STEP 2: Add needed Dependencies

const SCRIPT_NAME = 'Manual Lineup Set'; //required

//Packages

//services
const db = require('../../services/db');


const emptyLineup = {
  _cardId: "0",
  _createdAt: "2022-08-31T00:19:22.620Z",
  _isDefault: true,
  _isLocked: false,
  _isSetByCurrentOwner: false,
  _ownerId: "0x5df5e699dd79a32243df958082a5e39234589f3d",
  _updatedAt: "2022-08-31T00:19:22.620Z",
  bench: {
    QB: [
      "SF",
    ],
    RB: [
      "KC",
      "NO",
    ],
    TE: [
      "NO",
    ],
    WR: [
      "PIT",
      "WAS",
    ],
    DST: [
      "LAR",
    ],
  },
  gameWeek: "2022-REG-01",
  scoreSeason: 0,
  scoreWeek: 0,
  starting: {
    DST: [
      "KC",
    ],
    RB: [
      "CHI",
      "GB",
    ],
    TE: [
      "DAL",
    ],
    WR: [
      "DET",
      "LAR",
      "NE",
    ],
    QB: [
      "DET",
    ],
  },
};


//🚀 STEP 3: Write the script.  Include tests for validation where possible
const run = async (data) => {
  const gameWeek = '2022-REG-01';
  //const leagueId = 'genesis';

  for (let i = 0; i < data.length; i++) {
    const cardId = data[i].cardId;
    const card = await db.readDocument('cards', cardId)
    const ownerId = card._ownerId;
    const owner = await db.readDocument('owners', ownerId);
    const leagueCardIsEntered = owner.leagues.filter(l => l.cardId === cardId);

    const lineup = {
      _cardId: data[i].cardId,
      _createdAt: db._getTimeStamp(),
      _isDefault: true,
      _isLocked: false,
      _isSetByCurrentOwner: false,
      _ownerId: ownerId,
      _updatedAt: db._getTimeStamp(),
      bench: {
        QB: [data[i].bench.DST[0]],
        RB: [
          data[i].bench.RB[0],
          data[i].bench.RB[1]
        ],
        TE: [
          data[i].bench.TE[0],
        ],
        WR: [
          data[i].bench.WR[0],
          data[i].bench.WR[0],
        ],
        DST: [
          data[i].bench.DST[0],
        ],
      },
      gameWeek: gameWeek,
      scoreSeason: 0,
      scoreWeek: 0,
      starting: {
        DST: [
          data[i].starting.DST[0],
        ],
        RB: [
          data[i].starting.RB[0],
          data[i].starting.RB[1],
        ],
        TE: [
          data[i].starting.TE[0],
        ],
        WR: [
          data[i].starting.WR[0],
          data[i].starting.WR[1],
          data[i].starting.WR[2],
        ],
        QB: [
          data[i].starting.QB[0]
        ],
      },

    };

    for(let j = 0; j < leagueCardIsEntered.length; j++){
      const leagueId = leagueCardIsEntered[j].leagueId;
      await db.createOrUpdateDocument(`leagues/${leagueId}/cards/${cardId}/lineups`, gameWeek, lineup, false);
      console.log(`...👇   league:${leagueId} card:${cardId} gameWeek:${gameWeek} manual lineup set ${i} of ${data.length}`)
    }    
  }
};


(async () => {
  console.log(`...📝   START:${SCRIPT_NAME}`);

  const data = [
    {
      cardId: '6656',
      starting: {
        QB: ['KC'],
        RB: ['LAC', 'NYG'],
        WR: ['ARI', 'MIA', 'NO'],
        TE: ['GB'],
        DST: ['NYG']
      },
      bench: {
        QB: ['MIN'],
        RB: ['BAL', 'HOU'],
        WR: ['NYG', 'NYJ'],
        TE: ['NO'],
        DST: ['PHI']
      }
    },
    {
      cardId: '9561',
      starting: {
        QB: ['KC'],
        RB: ['PIT', 'NYG'],
        WR: ['LV', 'MIA', 'MIN'],
        TE: ['LV'],
        DST: ['CIN']
      },
      bench: {
        QB: ['NO'],
        RB: ['JAX', 'MIA'],
        WR: ['TEN', 'ARI'],
        TE: ['NYJ'],
        DST: ['SF']
      }
    },
    {
      cardId: '2066',
      starting: {
        QB: ['SEA'],
        RB: ['GB', 'DEN'],
        WR: ['CIN', 'SF', 'PHI'],
        TE: ['LV'],
        DST: ['LAC']
      },
      bench: {
        QB: ['TEN'],
        RB: ['ARI', 'SF'],
        WR: ['NYG', 'JAX'],
        TE: ['NE'],
        DST: ['NE']
      }
    },
    {
      cardId: '5032',
      starting: {
        QB: ['LAR'],
        RB: ['ARI', 'ATL'],
        WR: ['LAC', 'PHI', 'TB'],
        TE: ['DAL'],
        DST: ['HOU']
      },
      bench: {
        QB: ['NYG'],
        RB: ['KC', 'NE'],
        WR: ['NYJ', 'ARI'],
        TE: ['CHI'],
        DST: ['LAR']
      }
    },
    {
      cardId: '7205',
      starting: {
        QB: ['LAR'],
        RB: ['DET', 'NO'],
        WR: ['ATL', 'DAL', 'LAC'],
        TE: ['CIN'],
        DST: ['NO']
      },
      bench: {
        QB: ['SF'],
        RB: ['BAL', 'DAL'],
        WR: ['NE', 'TEN'],
        TE: ['TB'],
        DST: ['ARI']
      }
    },
    {
      cardId: '291',
      starting: {
        QB: ['DET'],
        RB: ['CIN', 'DEN'],
        WR: ['DAL', 'LAR', 'MIN'],
        TE: ['GB'],
        DST: ['DET']
      },
      bench: {
        QB: ['HOU'],
        RB: ['HOU', 'WAS'],
        WR: ['KC', 'PHI'],
        TE: ['CHI'],
        DST: ['PHI']
      }
    },
    {
      cardId: '3459',
      starting: {
        QB: ['DAL'],
        RB: ['DET', 'MIN'],
        WR: ['BUF', 'CIN', 'KC'],
        TE: ['CIN'],
        DST: ['GB']
      },
      bench: {
        QB: ['HOU'],
        RB: ['JAX', 'PHI'],
        WR: ['ARI', 'PIT'],
        TE: ['NE'],
        DST: ['KC']
      }
    },
    {
      cardId: '6615',
      starting: {
        QB: ['BUF'],
        RB: ['CAR', 'MIN'],
        WR: ['ARI', 'CAR', 'CLE'],
        TE: ['KC'],
        DST: ['SEA']
      },
      bench: {
        QB: ['PHI'],
        RB: ['DEN', 'TB'],
        WR: ['JAX', 'SEA'],
        TE: ['DET'],
        DST: ['LAR']
      }
    },
    {
      cardId: '8278',
      starting: {
        QB: ['PHI'],
        RB: ['ARI', 'NYG'],
        WR: ['ARI', 'SF', 'LAC'],
        TE: ['SEA'],
        DST: ['DEN']
      },
      bench: {
        QB: ['CHI'],
        RB: ['NYJ', 'WAS'],
        WR: ['PIT', 'DET'],
        TE: ['IND'],
        DST: ['SF']
      }
    },
    {
      cardId: "2666",
      starting: {
        QB: ["LAC"],
        RB: ["LAC", "TEN"],
        WR: ["MIN", "CIN", "LAR"],
        TE: ["ATL"],
        DST: ["CAR"],
      },
      bench: {
        QB: ["ATL"],
        RB: ["BUF", "DAL"],
        WR: ["ARI", "TB"],
        TE: ["NYJ"],
        DST: ["DEN"],
      },
    },
    {
      cardId: "5547",
      starting: {
        QB: ["LAC"],
        RB: ["MIN", "TEN"],
        WR: ["CHI", "MIN", "LAR"],
        TE: ["LAC"],
        DST: ["HOU"],
      },
      bench: {
        QB: ["NYG"],
        RB: ["NO", "DEN"],
        WR: ["PIT", "SEA"],
        TE: ["NE"],
        DST: ["NO"],
      },
    },
    {
      cardId: "3721",
      starting: {
        QB: ["SF"],
        RB: ["ARI", "PIT"],
        WR: ["BUF", "CHI", "NO"],
        TE: ["BAL"],
        DST: ["CHI"],
      },
      bench: {
        QB: ["IND"],
        RB: ["LAR", "KC"],
        WR: ["GB", "TEN"],
        TE: ["DAL"],
        DST: ["TEN"],
      },
    },
    {
      cardId: "8685",
      starting: {
        QB: ["MIN"],
        RB: ["NYG", "DAL"],
        WR: ["BUF", "LAC", "SF"],
        TE: ["ARI"],
        DST: ["IND"],
      },
      bench: {
        QB: ["ATL"],
        RB: ["LAR", "BUF"],
        WR: ["PIT", "NYJ"],
        TE: ["MIN"],
        DST: ["DAL"],
      },
    },
    {
      cardId: "2364",
      starting: {
        QB: ["BUF"],
        RB: ["IND", "NO"],
        WR: ["LV", "TB", "DEN"],
        TE: ["KC"],
        DST: ["GB"],
      },
      bench: {
        QB: ["SEA"],
        RB: ["JAX", "SF"],
        WR: ["ARI", "CAR"],
        TE: ["JAX"],
        DST: ["MIA"],
      },
    },
    {
      cardId: "9425",
      starting: {
        QB: ["PIT"],
        RB: ["NYG", "PIT"],
        WR: ["CIN", "MIN", "LAR"],
        TE: ["KC"],
        DST: ["CIN"],
      },
      bench: {
        QB: ["WAS"],
        RB: ["PHI", "TB"],
        WR: ["MIA", "CLE"],
        TE: ["PHI"],
        DST: ["MIN"],
      },
    },
    {
      cardId: "6944",
      starting: {
        QB: ["KC"],
        RB: ["IND", "NO"],
        WR: ["IND", "LAR", "MIN"],
        TE: ["ARI"],
        DST: ["WAS"],
      },
      bench: {
        QB: ["LAR"],
        RB: ["MIA", "NYG"],
        WR: ["GB", "NO"],
        TE: ["LAC"],
        DST: ["LV"],
      },
    },
    {
      cardId: "6615",
      starting: {
        QB: ["BUF"],
        RB: ["CAR", "DEN"],
        WR: ["ARI", "CAR", "CLE"],
        TE: ["DET"],
        DST: ["LAR"],
      },
      bench: {
        QB: ["PHI"],
        RB: ["MIN", "TB"],
        WR: ["JAX", "SEA"],
        TE: ["KC"],
        DST: ["SEA"],
      },
    },
  ]


  await run(data);

  console.log(`...📝   END:${SCRIPT_NAME}`);
  process.exit(0);
})();
