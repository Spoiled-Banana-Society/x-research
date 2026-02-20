//✍️ STEP: 1  FILL OUT THE SCRIPT TEMPLATE BELOW

/* DESCRIPTION START:
========================

    📝 General Description:

    The intent of the script is to demo use of the script template.  Why we need this script will be included here and
    an other relevant details.

    👣 Deployment Steps: node lineupFix.js

    🔗 TaskLink: Trello Link Here

    📅 Date Run in sbs-fantasy-dev:

    📅 Date Run in sbs-fantasy-prod:

========================
DESCRIPTION END */

//🗃️ STEP 2: Add needed Dependencies

const SCRIPT_NAME = 'Lineup Fix'; //required

//Packages

//services
const db = require('../../services/db');
const score = require('../../services/score');


//🚀 STEP 3: Write the script.  Include tests for validation where possible
const run = async () => {

//   const data = [
// '3605:genesis',
// '99:genesis',
// '6954:genesis',
// '2260:genesis',
// '4783:genesis',
// '7024:genesis',
// '1309:genesis',
// '3260:genesis',
// '6184:genesis',
// '1522:genesis',
// '6323:genesis',
// '5807:genesis',
// '6413:genesis',
// '2049:genesis',
// '6339:genesis',
// '1626:genesis',
// '5658:genesis',
// '6571:genesis',
// '7151:genesis',
// '5550:genesis',
// '3617:genesis',
// '1922:genesis',
// '2352:genesis',
// '8870:genesis',
// '2157:genesis',
// '38:genesis',
// '5969:genesis',
// '6429:genesis',
// '6419:genesis',
// '6442:genesis',
// '5979:genesis',
// '7128:genesis',
// '5655:genesis',
// '4175:genesis',
// '3126:genesis',
// '4419:genesis',
// '8899:genesis',
// '47:genesis',
// '8799:genesis',
// '3465:genesis',
// '3468:genesis',
// '5523:genesis',
// '4561:genesis',
// '2168:genesis',
// '2167:genesis',
// '1695:genesis',
// //'427:genesis',
// '6899:genesis',
// '5160:genesis',
// '3064:genesis',
// '279:genesis',
// '3338:genesis',
// '2842:genesis',
// '2902:genesis',
// '4210:genesis',
// '2352:Season(Thu Sep 08 2022 - Tue Jan 03 2023)|Prize-1.8-$APE|Top-1-Paid|82',
// '3064:Season(Thu Sep 08 2022 - Tue Jan 03 2023)|Special Prize|See details|19',
// '3064:Season(Thu Sep 08 2022 - Tue Jan 03 2023)|Special Prize|See details|4',
// '38:Season(Thu Sep 08 2022 - Tue Jan 03 2023)|Special Prize|See details|43',
// //'427:Season(Thu Sep 08 2022 - Tue Jan 03 2023)|Special Prize|See details|5',
// '2260:Season(Thu Sep 08 2022 - Tue Oct 04 2022)|Prize-450-$APE|Top-5-Paid|1'
//   ];

  let lineups = [
    {
      _cardId: "3605",
      _createdAt: "2022-08-31T00:32:29.045Z",
      _isDefault: true,
      _isLocked: false,
      _isSetByCurrentOwner: false,
      _ownerId: "0x60f7a206a9a38b1a8e20a64c4319d843f10a5b5b",
      _updatedAt: "2022-08-31T00:32:29.045Z",
      bench: {
        DST: [
          "NO",
        ],
        QB: [
          "TEN",
        ],
        WR: [
          "PHI",
          "SF",
        ],
        TE: [
          "NE",
        ],
        RB: [
          "HOU",
          "SF",
        ],
      },
      gameWeek: "2022-REG-01",
      scoreSeason: "0.00",
      scoreWeek: 0,
      starting: {
        TE: [
          "CAR",
        ],
        WR: [
          "DET",
          "IND",
          "LAR",
        ],
        QB: [
          "NYG",
        ],
        RB: [
          "ATL",
          "CIN",
        ],
        DST: [
          "NE",
        ],
      },
      leagueId: "genesis",
    },
    {
      _cardId: "99",
      _createdAt: "2022-08-31T00:19:48.785Z",
      _isDefault: true,
      _isLocked: false,
      _isSetByCurrentOwner: true,
      _ownerId: "0x31f09c232b026c26183891e39346ce39f905f8d1",
      _updatedAt: "2022-09-08T04:56:24.203Z",
      bench: {
        DST: [
          "LAR",
        ],
        TE: [
          "NYG",
        ],
        WR: [
          "CLE",
          "BAL",
        ],
        QB: [
          "NO",
        ],
        RB: [
          "BUF",
          "PHI",
        ],
      },
      gameWeek: "2022-REG-01",
      scoreSeason: "0.00",
      scoreWeek: 0,
      starting: {
        TE: [
          "IND",
        ],
        QB: [
          "SF",
        ],
        WR: [
          "ARI",
          "TB",
          "DET",
        ],
        RB: [
          "ARI",
          "LAC",
        ],
        DST: [
          "WAS",
        ],
      },
      leagueId: "genesis",
    },
    {
      _cardId: "6954",
      _createdAt: "2022-08-31T00:44:25.220Z",
      _isDefault: true,
      _isLocked: false,
      _isSetByCurrentOwner: false,
      _ownerId: "0xf010b74a64ab9632a507c8df0e1d06c480475208",
      _updatedAt: "2022-08-31T00:44:25.220Z",
      bench: {
        TE: [
          "SEA",
        ],
        DST: [
          "NO",
        ],
        QB: [
          "DEN",
        ],
        RB: [
          "MIN",
          "TB",
        ],
        WR: [
          "HOU",
          "PIT",
        ],
      },
      gameWeek: "2022-REG-01",
      scoreSeason: "0.00",
      scoreWeek: 0,
      starting: {
        WR: [
          "CAR",
          "DET",
          "GB",
        ],
        QB: [
          "ARI",
        ],
        TE: [
          "DET",
        ],
        DST: [
          "KC",
        ],
        RB: [
          "CIN",
          "CLE",
        ],
      },
      leagueId: "genesis",
    },
    {
      _cardId: "2260",
      _createdAt: "2022-08-31T00:27:42.121Z",
      _isDefault: true,
      _isLocked: false,
      _isSetByCurrentOwner: true,
      _ownerId: "0xb472698319e30d265b8c83ae1d66695af8c0b5e7",
      _updatedAt: "2022-09-08T04:10:58.770Z",
      bench: {
        DST: [
          "MIN",
        ],
        TE: [
          "CAR",
        ],
        WR: [
          "NE",
          "ATL",
        ],
        RB: [
          "JAX",
          "HOU",
        ],
        QB: [
          "CLE",
        ],
      },
      gameWeek: "2022-REG-01",
      scoreSeason: "0.00",
      scoreWeek: 0,
      starting: {
        DST: [
          "MIA",
        ],
        WR: [
          "ARI",
          "SF",
          "JAX",
        ],
        RB: [
          "TEN",
          "LAC",
        ],
        QB: [
          "TB",
        ],
        TE: [
          "TEN",
        ],
      },
      leagueId: "genesis",
    },
    {
      _cardId: "4783",
      _createdAt: "2022-08-31T00:36:40.926Z",
      _isDefault: true,
      _isLocked: false,
      _isSetByCurrentOwner: false,
      _ownerId: "0xe9db48dc1a903609326b55fe54b0aea5c2b9c816",
      _updatedAt: "2022-08-31T00:36:40.926Z",
      bench: {
        RB: [
          "IND",
          "MIA",
        ],
        QB: [
          "MIA",
        ],
        WR: [
          "SEA",
          "WAS",
        ],
        DST: [
          "LAR",
        ],
        TE: [
          "LAR",
        ],
      },
      gameWeek: "2022-REG-01",
      scoreSeason: "0.00",
      scoreWeek: 0,
      starting: {
        TE: [
          "HOU",
        ],
        DST: [
          "GB",
        ],
        WR: [
          "ARI",
          "MIA",
          "NYG",
        ],
        QB: [
          "IND",
        ],
        RB: [
          "ARI",
          "GB",
        ],
      },
      leagueId: "genesis",
    },
    {
      _cardId: "7024",
      _createdAt: "2022-08-31T00:44:40.366Z",
      _isDefault: true,
      _isLocked: false,
      _isSetByCurrentOwner: true,
      _ownerId: "0xe7cf57685c31704ab644d4004cd9d63df4bd40ab",
      _updatedAt: "2022-09-02T12:11:42.917Z",
      bench: {
        QB: [
          "CHI",
        ],
        TE: [
          "TB",
        ],
        DST: [
          "GB",
        ],
        WR: [
          "NYG",
          "JAX",
        ],
        RB: [
          "NE",
          "PHI",
        ],
      },
      gameWeek: "2022-REG-01",
      scoreSeason: "0.00",
      scoreWeek: 0,
      starting: {
        RB: [
          "CIN",
          "LV",
        ],
        WR: [
          "SF",
          "SEA",
          "PHI",
        ],
        TE: [
          "LAC",
        ],
        DST: [
          "DEN",
        ],
        QB: [
          "BUF",
        ],
      },
      leagueId: "genesis",
    },
    {
      _cardId: "1309",
      _createdAt: "2022-08-31T00:24:14.478Z",
      _isDefault: true,
      _isLocked: false,
      _isSetByCurrentOwner: true,
      _ownerId: "0x0c6a75871d77ce9f8e8c862c0a88033ea5987e6c",
      _updatedAt: "2022-09-06T00:09:06.898Z",
      bench: {
        DST: [
          "SEA",
        ],
        QB: [
          "TB",
        ],
        TE: [
          "PIT",
        ],
        WR: [
          "NYG",
          "CLE",
        ],
        RB: [
          "BUF",
          "CHI",
        ],
      },
      gameWeek: "2022-REG-01",
      scoreSeason: "0.00",
      scoreWeek: 0,
      starting: {
        TE: [
          "CIN",
        ],
        WR: [
          "TEN",
          "CHI",
          "MIA",
        ],
        DST: [
          "WAS",
        ],
        RB: [
          "MIN",
          "SF",
        ],
        QB: [
          "LAC",
        ],
      },
      leagueId: "genesis",
    },
    {
      _cardId: "3260",
      _createdAt: "2022-08-31T00:31:14.497Z",
      _isDefault: true,
      _isLocked: false,
      _isSetByCurrentOwner: true,
      _ownerId: "0x0c6a75871d77ce9f8e8c862c0a88033ea5987e6c",
      _updatedAt: "2022-09-07T05:09:31.829Z",
      bench: {
        RB: [
          "CHI",
          "WAS",
        ],
        QB: [
          "CLE",
        ],
        TE: [
          "HOU",
        ],
        DST: [
          "LV",
        ],
        WR: [
          "DEN",
          "ARI",
        ],
      },
      gameWeek: "2022-REG-01",
      scoreSeason: "0.00",
      scoreWeek: 0,
      starting: {
        DST: [
          "NYJ",
        ],
        RB: [
          "CAR",
          "MIA",
        ],
        TE: [
          "WAS",
        ],
        QB: [
          "LAC",
        ],
        WR: [
          "SF",
          "PHI",
          "MIA",
        ],
      },
      leagueId: "genesis",
    },
    {
      _cardId: "6184",
      _createdAt: "2022-08-31T00:41:37.483Z",
      _isDefault: true,
      _isLocked: false,
      _isSetByCurrentOwner: true,
      _ownerId: "0xf8f9adfefd26d509af754c34eba429541babbe39",
      _updatedAt: "2022-09-08T11:24:29.347Z",
      bench: {
        TE: [
          "HOU",
        ],
        WR: [
          "IND",
          "WAS",
        ],
        RB: [
          "KC",
          "LV",
        ],
        DST: [
          "SEA",
        ],
        QB: [
          "NYG",
        ],
      },
      gameWeek: "2022-REG-01",
      scoreSeason: "0.00",
      scoreWeek: 0,
      starting: {
        TE: [
          "NE",
        ],
        RB: [
          "BAL",
          "DET",
        ],
        QB: [
          "NO",
        ],
        DST: [
          "ATL",
        ],
        WR: [
          "PHI",
          "LAC",
          "LV",
        ],
      },
      leagueId: "genesis",
    },
    {
      _cardId: "1522",
      _createdAt: "2022-08-31T00:25:01.698Z",
      _isDefault: true,
      _isLocked: false,
      _isSetByCurrentOwner: true,
      _ownerId: "0xf25b4825e9f4a79896d66dd737052265f34c8ce3",
      _updatedAt: "2022-09-07T15:22:52.572Z",
      bench: {
        RB: [
          "BUF",
          "NYG",
        ],
        WR: [
          "CAR",
          "CLE",
        ],
        QB: [
          "LAR",
        ],
        TE: [
          "NE",
        ],
        DST: [
          "TB",
        ],
      },
      gameWeek: "2022-REG-01",
      scoreSeason: "0.00",
      scoreWeek: 0,
      starting: {
        WR: [
          "PHI",
          "TEN",
          "DAL",
        ],
        RB: [
          "NO",
          "DAL",
        ],
        DST: [
          "MIA",
        ],
        QB: [
          "CIN",
        ],
        TE: [
          "LAC",
        ],
      },
      leagueId: "genesis",
    },
    {
      _cardId: "6323",
      _createdAt: "2022-08-31T00:42:06.468Z",
      _isDefault: true,
      _isLocked: false,
      _isSetByCurrentOwner: true,
      _ownerId: "0xf8f9adfefd26d509af754c34eba429541babbe39",
      _updatedAt: "2022-09-08T13:56:33.585Z",
      bench: {
        RB: [
          "KC",
          "HOU",
        ],
        WR: [
          "GB",
          "NYJ",
        ],
        DST: [
          "SEA",
        ],
        TE: [
          "NYG",
        ],
        QB: [
          "TEN",
        ],
      },
      gameWeek: "2022-REG-01",
      scoreSeason: "0.00",
      scoreWeek: 0,
      starting: {
        DST: [
          "NE",
        ],
        RB: [
          "TB",
          "LAR",
        ],
        WR: [
          "LAR",
          "CAR",
          "KC",
        ],
        TE: [
          "CHI",
        ],
        QB: [
          "PHI",
        ],
      },
      leagueId: "genesis",
    },
    {
      _cardId: "5807",
      _createdAt: "2022-08-31T00:40:17.834Z",
      _isDefault: true,
      _isLocked: false,
      _isSetByCurrentOwner: true,
      _ownerId: "0xe0d52a1880ff0ed35eac55bfef7c6c0d5b017113",
      _updatedAt: "2022-09-08T17:28:43.061Z",
      bench: {
        DST: [
          "BUF",
        ],
        QB: [
          "SEA",
        ],
        TE: [
          "SEA",
        ],
        WR: [
          "KC",
          "ATL",
        ],
        RB: [
          "LAR",
          "TEN",
        ],
      },
      gameWeek: "2022-REG-01",
      scoreSeason: "0.00",
      scoreWeek: 0,
      starting: {
        WR: [
          "NYG",
          "BAL",
          "HOU",
        ],
        QB: [
          "ARI",
        ],
        DST: [
          "BAL",
        ],
        TE: [
          "ATL",
        ],
        RB: [
          "DEN",
          "LAC",
        ],
      },
      leagueId: "genesis",
    },
    {
      _cardId: "6413",
      _createdAt: "2022-08-31T00:42:25.619Z",
      _isDefault: true,
      _isLocked: false,
      _isSetByCurrentOwner: true,
      _ownerId: "0xe0d52a1880ff0ed35eac55bfef7c6c0d5b017113",
      _updatedAt: "2022-09-08T17:29:14.788Z",
      bench: {
        TE: [
          "NYJ",
        ],
        RB: [
          "NYJ",
          "SF",
        ],
        WR: [
          "LAR",
          "WAS",
        ],
        QB: [
          "MIA",
        ],
        DST: [
          "CLE",
        ],
      },
      gameWeek: "2022-REG-01",
      scoreSeason: "0.00",
      scoreWeek: 0,
      starting: {
        TE: [
          "DAL",
        ],
        WR: [
          "ARI",
          "CAR",
          "DAL",
        ],
        QB: [
          "ATL",
        ],
        DST: [
          "CIN",
        ],
        RB: [
          "LV",
          "NYG",
        ],
      },
      leagueId: "genesis",
    },
    {
      _cardId: "2049",
      _createdAt: "2022-08-31T00:26:57.915Z",
      _isDefault: true,
      _isLocked: false,
      _isSetByCurrentOwner: true,
      _ownerId: "0x234b5479dc64a080117624184faca50bf350db98",
      _updatedAt: "2022-09-06T19:12:21.650Z",
      bench: {
        TE: [
          "NYG",
        ],
        WR: [
          "ATL",
          "JAX",
        ],
        QB: [
          "LV",
        ],
        RB: [
          "MIA",
          "SEA",
        ],
        DST: [
          "PHI",
        ],
      },
      gameWeek: "2022-REG-01",
      scoreSeason: "0.00",
      scoreWeek: 0,
      starting: {
        TE: [
          "LAR",
        ],
        DST: [
          "LAR",
        ],
        WR: [
          "MIN",
          "GB",
          "SF",
        ],
        QB: [
          "DAL",
        ],
        RB: [
          "DAL",
          "NO",
        ],
      },
      leagueId: "genesis",
    },
    {
      _cardId: "6339",
      _createdAt: "2022-08-31T00:42:09.724Z",
      _isDefault: true,
      _isLocked: false,
      _isSetByCurrentOwner: false,
      _ownerId: "0x7282c0a6b9eef356767444c791a72ae4f39ebe70",
      _updatedAt: "2022-08-31T00:42:09.724Z",
      bench: {
        RB: [
          "PHI",
          "SF",
        ],
        DST: [
          "WAS",
        ],
        TE: [
          "NYJ",
        ],
        WR: [
          "HOU",
          "LAR",
        ],
        QB: [
          "NE",
        ],
      },
      gameWeek: "2022-REG-01",
      scoreSeason: "0.00",
      scoreWeek: 0,
      starting: {
        TE: [
          "NE",
        ],
        RB: [
          "HOU",
          "NO",
        ],
        WR: [
          "ATL",
          "CAR",
          "DET",
        ],
        DST: [
          "PIT",
        ],
        QB: [
          "DAL",
        ],
      },
      leagueId: "genesis",
    },
    {
      _cardId: "1626",
      _createdAt: "2022-08-31T00:25:24.041Z",
      _isDefault: true,
      _isLocked: false,
      _isSetByCurrentOwner: false,
      _ownerId: "0xca9a8fd726236e258c27e780f0b3631aaa25b38d",
      _updatedAt: "2022-08-31T00:25:24.041Z",
      bench: {
        DST: [
          "DAL",
        ],
        TE: [
          "KC",
        ],
        WR: [
          "PHI",
          "SEA",
        ],
        QB: [
          "NYG",
        ],
        RB: [
          "NYG",
          "PHI",
        ],
      },
      gameWeek: "2022-REG-01",
      scoreSeason: "0.00",
      scoreWeek: 0,
      starting: {
        WR: [
          "ARI",
          "ATL",
          "LV",
        ],
        QB: [
          "LV",
        ],
        DST: [
          "CLE",
        ],
        TE: [
          "DEN",
        ],
        RB: [
          "DEN",
          "GB",
        ],
      },
      leagueId: "genesis",
    },
    {
      _cardId: "5658",
      _createdAt: "2022-08-31T00:39:45.880Z",
      _isDefault: true,
      _isLocked: false,
      _isSetByCurrentOwner: false,
      _ownerId: "0xca9a8fd726236e258c27e780f0b3631aaa25b38d",
      _updatedAt: "2022-08-31T00:39:45.880Z",
      bench: {
        DST: [
          "TEN",
        ],
        RB: [
          "NO",
          "WAS",
        ],
        WR: [
          "MIA",
          "WAS",
        ],
        TE: [
          "TEN",
        ],
        QB: [
          "NE",
        ],
      },
      gameWeek: "2022-REG-01",
      scoreSeason: "0.00",
      scoreWeek: 0,
      starting: {
        WR: [
          "ARI",
          "DAL",
          "JAX",
        ],
        TE: [
          "LAR",
        ],
        RB: [
          "BAL",
          "CHI",
        ],
        DST: [
          "CHI",
        ],
        QB: [
          "CIN",
        ],
      },
      leagueId: "genesis",
    },
    {
      _cardId: "6571",
      _createdAt: "2022-08-31T00:42:59.021Z",
      _isDefault: true,
      _isLocked: false,
      _isSetByCurrentOwner: true,
      _ownerId: "0x1398678864b787a37e609e1883370884fc8d30e2",
      _updatedAt: "2022-09-02T16:24:47.924Z",
      bench: {
        QB: [
          "JAX",
        ],
        TE: [
          "NYJ",
        ],
        WR: [
          "CLE",
          "PIT",
        ],
        DST: [
          "SEA",
        ],
        RB: [
          "KC",
          "BAL",
        ],
      },
      gameWeek: "2022-REG-01",
      scoreSeason: "0.00",
      scoreWeek: 0,
      starting: {
        DST: [
          "IND",
        ],
        RB: [
          "TEN",
          "IND",
        ],
        WR: [
          "MIA",
          "DAL",
          "LAC",
        ],
        TE: [
          "DEN",
        ],
        QB: [
          "MIN",
        ],
      },
      leagueId: "genesis",
    },
    {
      _cardId: "7151",
      _createdAt: "2022-08-31T00:45:07.130Z",
      _isDefault: true,
      _isLocked: false,
      _isSetByCurrentOwner: true,
      _ownerId: "0xa57cda6b07a144eb6bc91bbb25e1e0364f1ad2fb",
      _updatedAt: "2022-09-02T17:50:52.240Z",
      bench: {
        DST: [
          "LAR",
        ],
        TE: [
          "NO",
        ],
        WR: [
          "ATL",
          "DEN",
        ],
        RB: [
          "DET",
          "CHI",
        ],
        QB: [
          "NE",
        ],
      },
      gameWeek: "2022-REG-01",
      scoreSeason: "0.00",
      scoreWeek: 0,
      starting: {
        WR: [
          "SF",
          "TB",
          "MIA",
        ],
        DST: [
          "IND",
        ],
        RB: [
          "NYJ",
          "CLE",
        ],
        TE: [
          "DEN",
        ],
        QB: [
          "LAC",
        ],
      },
      leagueId: "genesis",
    },
    {
      _cardId: "5550",
      _createdAt: "2022-08-31T00:39:22.840Z",
      _isDefault: true,
      _isLocked: false,
      _isSetByCurrentOwner: false,
      _ownerId: "0x0e2c8b5e179deae55fd6e0781e53e7f96e76dbfe",
      _updatedAt: "2022-08-31T00:39:22.840Z",
      bench: {
        RB: [
          "MIA",
          "WAS",
        ],
        QB: [
          "TEN",
        ],
        DST: [
          "TEN",
        ],
        TE: [
          "SF",
        ],
        WR: [
          "GB",
          "SEA",
        ],
      },
      gameWeek: "2022-REG-01",
      scoreSeason: "0.00",
      scoreWeek: 0,
      starting: {
        WR: [
          "ARI",
          "ATL",
          "CAR",
        ],
        QB: [
          "DET",
        ],
        RB: [
          "BUF",
          "DAL",
        ],
        TE: [
          "GB",
        ],
        DST: [
          "CHI",
        ],
      },
      leagueId: "genesis",
    },
    {
      _cardId: "3617",
      _createdAt: "2022-08-31T00:32:31.662Z",
      _isDefault: true,
      _isLocked: false,
      _isSetByCurrentOwner: false,
      _ownerId: "0x60f7a206a9a38b1a8e20a64c4319d843f10a5b5b",
      _updatedAt: "2022-08-31T00:32:31.662Z",
      bench: {
        QB: [
          "NYJ",
        ],
        WR: [
          "LAC",
          "NO",
        ],
        RB: [
          "MIA",
          "NYJ",
        ],
        TE: [
          "JAX",
        ],
        DST: [
          "SF",
        ],
      },
      gameWeek: "2022-REG-01",
      scoreSeason: "0.00",
      scoreWeek: 0,
      starting: {
        TE: [
          "HOU",
        ],
        QB: [
          "HOU",
        ],
        WR: [
          "BAL",
          "CLE",
          "IND",
        ],
        DST: [
          "PHI",
        ],
        RB: [
          "GB",
          "LV",
        ],
      },
      leagueId: "genesis",
    },
    {
      _cardId: "1922",
      _createdAt: "2022-08-31T00:26:30.739Z",
      _isDefault: true,
      _isLocked: false,
      _isSetByCurrentOwner: true,
      _ownerId: "0xa05bca6f6d9c0bc2c3a597ac3f800eaf502aca66",
      _updatedAt: "2022-09-02T01:41:47.470Z",
      bench: {
        DST: [
          "SEA",
        ],
        RB: [
          "LV",
          "NE",
        ],
        TE: [
          "TEN",
        ],
        QB: [
          "PIT",
        ],
        WR: [
          "GB",
          "NYG",
        ],
      },
      gameWeek: "2022-REG-01",
      scoreSeason: "0.00",
      scoreWeek: 0,
      starting: {
        DST: [
          "LAR",
        ],
        WR: [
          "BAL",
          "MIN",
          "LAC",
        ],
        TE: [
          "NYJ",
        ],
        RB: [
          "HOU",
          "JAX",
        ],
        QB: [
          "MIN",
        ],
      },
      leagueId: "genesis",
    },
    {
      _cardId: "2352",
      _createdAt: "2022-08-31T00:28:01.507Z",
      _isDefault: true,
      _isLocked: false,
      _isSetByCurrentOwner: true,
      _ownerId: "0xa05bca6f6d9c0bc2c3a597ac3f800eaf502aca66",
      _updatedAt: "2022-09-02T01:43:06.305Z",
      bench: {
        DST: [
          "HOU",
        ],
        QB: [
          "CAR",
        ],
        WR: [
          "MIA",
          "WAS",
        ],
        TE: [
          "LAC",
        ],
        RB: [
          "BAL",
          "TEN",
        ],
      },
      gameWeek: "2022-REG-01",
      scoreSeason: "0.00",
      scoreWeek: 0,
      starting: {
        TE: [
          "SF",
        ],
        DST: [
          "TEN",
        ],
        WR: [
          "CHI",
          "JAX",
          "LAR",
        ],
        QB: [
          "SF",
        ],
        RB: [
          "DAL",
          "CLE",
        ],
      },
      leagueId: "genesis",
    },
    {
      _cardId: "8870",
      _createdAt: "2022-08-31T00:51:15.852Z",
      _isDefault: true,
      _isLocked: false,
      _isSetByCurrentOwner: true,
      _ownerId: "0xa05bca6f6d9c0bc2c3a597ac3f800eaf502aca66",
      _updatedAt: "2022-09-07T13:07:12.683Z",
      bench: {
        WR: [
          "SEA",
          "ARI",
        ],
        RB: [
          "MIA",
          "BAL",
        ],
        DST: [
          "DET",
        ],
        TE: [
          "IND",
        ],
        QB: [
          "JAX",
        ],
      },
      gameWeek: "2022-REG-01",
      scoreSeason: "0.00",
      scoreWeek: 0,
      starting: {
        QB: [
          "IND",
        ],
        RB: [
          "NO",
          "CAR",
        ],
        TE: [
          "TB",
        ],
        WR: [
          "SF",
          "DAL",
          "NYG",
        ],
        DST: [
          "MIN",
        ],
      },
      leagueId: "genesis",
    },
    {
      _cardId: "2157",
      _createdAt: "2022-08-31T00:27:20.611Z",
      _isDefault: true,
      _isLocked: false,
      _isSetByCurrentOwner: true,
      _ownerId: "0x7460a50782c5baf08b1356e0c9d2ddb381219c53",
      _updatedAt: "2022-09-08T04:12:00.281Z",
      bench: {
        TE: [
          "PHI",
        ],
        WR: [
          "ATL",
          "JAX",
        ],
        RB: [
          "DAL",
          "LAR",
        ],
        QB: [
          "CIN",
        ],
        DST: [
          "BAL",
        ],
      },
      gameWeek: "2022-REG-01",
      scoreSeason: "0.00",
      scoreWeek: 0,
      starting: {
        RB: [
          "GB",
          "DET",
        ],
        QB: [
          "LAR",
        ],
        WR: [
          "MIA",
          "BUF",
          "SF",
        ],
        DST: [
          "NO",
        ],
        TE: [
          "NE",
        ],
      },
      leagueId: "genesis",
    },
    {
      _cardId: "38",
      _createdAt: "2022-08-31T00:19:33.790Z",
      _isDefault: true,
      _isLocked: false,
      _isSetByCurrentOwner: true,
      _ownerId: "0x6a68e7e32ee88485f11cde93c3cf5f4d107905b8",
      _updatedAt: "2022-09-07T22:42:36.925Z",
      bench: {
        TE: [
          "SEA",
        ],
        QB: [
          "DAL",
        ],
        RB: [
          "KC",
          "DEN",
        ],
        WR: [
          "PIT",
          "JAX",
        ],
        DST: [
          "TB",
        ],
      },
      gameWeek: "2022-REG-01",
      scoreSeason: "0.00",
      scoreWeek: 0,
      starting: {
        DST: [
          "WAS",
        ],
        QB: [
          "LAC",
        ],
        WR: [
          "TB",
          "IND",
          "LV",
        ],
        TE: [
          "DET",
        ],
        RB: [
          "PHI",
          "NE",
        ],
      },
      leagueId: "genesis",
    },
    {
      _cardId: "5969",
      _createdAt: "2022-08-31T00:40:52.373Z",
      _isDefault: true,
      _isLocked: false,
      _isSetByCurrentOwner: true,
      _ownerId: "0xf8f9adfefd26d509af754c34eba429541babbe39",
      _updatedAt: "2022-09-03T05:16:33.616Z",
      bench: {
        QB: [
          "ATL",
        ],
        WR: [
          "KC",
          "SF",
        ],
        RB: [
          "DET",
          "CAR",
        ],
        TE: [
          "CHI",
        ],
        DST: [
          "BUF",
        ],
      },
      gameWeek: "2022-REG-01",
      scoreSeason: "0.00",
      scoreWeek: 0,
      starting: {
        DST: [
          "CHI",
        ],
        TE: [
          "HOU",
        ],
        RB: [
          "SEA",
          "LAR",
        ],
        QB: [
          "SEA",
        ],
        WR: [
          "NYJ",
          "ARI",
          "MIN",
        ],
      },
      leagueId: "genesis",
    },
    {
      _cardId: "6429",
      _createdAt: "2022-08-31T00:42:29.049Z",
      _isDefault: true,
      _isLocked: false,
      _isSetByCurrentOwner: true,
      _ownerId: "0xac68de28df324bc948f794e7e0064e44de7366fe",
      _updatedAt: "2022-09-08T16:09:40.286Z",
      bench: {
        TE: [
          "CAR",
        ],
        DST: [
          "NYG",
        ],
        RB: [
          "ARI",
          "WAS",
        ],
        WR: [
          "NE",
          "ATL",
        ],
        QB: [
          "PHI",
        ],
      },
      gameWeek: "2022-REG-01",
      scoreSeason: "0.00",
      scoreWeek: 0,
      starting: {
        RB: [
          "DET",
          "CLE",
        ],
        WR: [
          "WAS",
          "KC",
          "MIA",
        ],
        TE: [
          "LV",
        ],
        DST: [
          "ARI",
        ],
        QB: [
          "MIN",
        ],
      },
      leagueId: "genesis",
    },
    {
      _cardId: "6419",
      _createdAt: "2022-08-31T00:42:27.045Z",
      _isDefault: true,
      _isLocked: false,
      _isSetByCurrentOwner: true,
      _ownerId: "0x80578bb41d7ee99aeb1cf79a8cd15fbe08fcc5a3",
      _updatedAt: "2022-09-08T12:51:47.877Z",
      bench: {
        QB: [
          "PIT",
        ],
        TE: [
          "LAC",
        ],
        RB: [
          "CLE",
          "NE",
        ],
        DST: [
          "JAX",
        ],
        WR: [
          "CHI",
          "CLE",
        ],
      },
      gameWeek: "2022-REG-01",
      scoreSeason: "0.00",
      scoreWeek: 0,
      starting: {
        DST: [
          "DEN",
        ],
        TE: [
          "NO",
        ],
        QB: [
          "DAL",
        ],
        RB: [
          "HOU",
          "JAX",
        ],
        WR: [
          "LV",
          "NO",
          "IND",
        ],
      },
      leagueId: "genesis",
    },
    {
      _cardId: "6442",
      _createdAt: "2022-08-31T00:42:31.662Z",
      _isDefault: true,
      _isLocked: false,
      _isSetByCurrentOwner: true,
      _ownerId: "0x80578bb41d7ee99aeb1cf79a8cd15fbe08fcc5a3",
      _updatedAt: "2022-09-08T12:49:24.672Z",
      bench: {
        WR: [
          "BAL",
          "DET",
        ],
        DST: [
          "GB",
        ],
        QB: [
          "MIA",
        ],
        RB: [
          "LV",
          "ATL",
        ],
        TE: [
          "GB",
        ],
      },
      gameWeek: "2022-REG-01",
      scoreSeason: "0.00",
      scoreWeek: 0,
      starting: {
        DST: [
          "DEN",
        ],
        RB: [
          "TB",
          "BUF",
        ],
        WR: [
          "MIA",
          "TEN",
          "LV",
        ],
        TE: [
          "PIT",
        ],
        QB: [
          "LAR",
        ],
      },
      leagueId: "genesis",
    },
    {
      _cardId: "5979",
      _createdAt: "2022-08-31T00:40:54.434Z",
      _isDefault: true,
      _isLocked: false,
      _isSetByCurrentOwner: true,
      _ownerId: "0x94ccbc21601e4ebb4b2164d7b1f45df056c1ca91",
      _updatedAt: "2022-09-02T23:42:40.176Z",
      bench: {
        RB: [
          "NE",
          "JAX",
        ],
        DST: [
          "LV",
        ],
        TE: [
          "SEA",
        ],
        WR: [
          "TEN",
          "WAS",
        ],
        QB: [
          "NO",
        ],
      },
      gameWeek: "2022-REG-01",
      scoreSeason: "0.00",
      scoreWeek: 0,
      starting: {
        QB: [
          "TB",
        ],
        DST: [
          "SF",
        ],
        TE: [
          "CIN",
        ],
        WR: [
          "DAL",
          "LAC",
          "LV",
        ],
        RB: [
          "TEN",
          "WAS",
        ],
      },
      leagueId: "genesis",
    },
    {
      _cardId: "7128",
      _createdAt: "2022-08-31T00:45:02.180Z",
      _isDefault: true,
      _isLocked: false,
      _isSetByCurrentOwner: false,
      _ownerId: "0x4974daf5a7768f7c989fbe987b3cf8710f728c54",
      _updatedAt: "2022-08-31T00:45:02.180Z",
      bench: {
        TE: [
          "PIT",
        ],
        QB: [
          "HOU",
        ],
        RB: [
          "LAR",
          "NYJ",
        ],
        DST: [
          "SEA",
        ],
        WR: [
          "SF",
          "WAS",
        ],
      },
      gameWeek: "2022-REG-01",
      scoreSeason: "0.00",
      scoreWeek: 0,
      starting: {
        DST: [
          "JAX",
        ],
        TE: [
          "NYJ",
        ],
        QB: [
          "CHI",
        ],
        WR: [
          "LV",
          "NE",
          "PIT",
        ],
        RB: [
          "BAL",
          "IND",
        ],
      },
      leagueId: "genesis",
    },
    {
      _cardId: "5655",
      _createdAt: "2022-08-31T00:39:45.252Z",
      _isDefault: true,
      _isLocked: false,
      _isSetByCurrentOwner: true,
      _ownerId: "0x94ccbc21601e4ebb4b2164d7b1f45df056c1ca91",
      _updatedAt: "2022-09-02T23:41:53.576Z",
      bench: {
        QB: [
          "WAS",
        ],
        RB: [
          "NE",
          "SF",
        ],
        WR: [
          "NYG",
          "SEA",
        ],
        TE: [
          "NE",
        ],
        DST: [
          "DET",
        ],
      },
      gameWeek: "2022-REG-01",
      scoreSeason: "0.00",
      scoreWeek: 0,
      starting: {
        WR: [
          "ATL",
          "BAL",
          "GB",
        ],
        DST: [
          "LAC",
        ],
        QB: [
          "ARI",
        ],
        RB: [
          "DEN",
          "NYG",
        ],
        TE: [
          "SF",
        ],
      },
      leagueId: "genesis",
    },
    {
      _cardId: "4175",
      _createdAt: "2022-08-31T00:34:29.879Z",
      _isDefault: true,
      _isLocked: false,
      _isSetByCurrentOwner: true,
      _ownerId: "0xa32ed307082ed846785df731aeed50a3dc486630",
      _updatedAt: "2022-09-08T19:46:06.575Z",
      bench: {
        DST: [
          "NE",
        ],
        TE: [
          "NYG",
        ],
        QB: [
          "JAX",
        ],
        WR: [
          "DET",
          "NE",
        ],
        RB: [
          "NE",
          "TB",
        ],
      },
      gameWeek: "2022-REG-01",
      scoreSeason: "0.00",
      scoreWeek: 0,
      starting: {
        QB: [
          "MIA",
        ],
        TE: [
          "ARI",
        ],
        RB: [
          "BUF",
          "MIA",
        ],
        WR: [
          "ATL",
          "CAR",
          "LAR",
        ],
        DST: [
          "KC",
        ],
      },
      leagueId: "genesis",
    },
    {
      _cardId: "3126",
      _createdAt: "2022-08-31T00:30:45.919Z",
      _isDefault: true,
      _isLocked: false,
      _isSetByCurrentOwner: true,
      _ownerId: "0x117300561021503230d69dbfb426d3aee722d7d1",
      _updatedAt: "2022-09-02T02:13:02.257Z",
      bench: {
        WR: [
          "NO",
          "NE",
        ],
        RB: [
          "SEA",
          "WAS",
        ],
        TE: [
          "DEN",
        ],
        DST: [
          "NYJ",
        ],
        QB: [
          "NYJ",
        ],
      },
      gameWeek: "2022-REG-01",
      scoreSeason: "0.00",
      scoreWeek: 0,
      starting: {
        WR: [
          "BAL",
          "LAC",
          "PHI",
        ],
        DST: [
          "LAC",
        ],
        QB: [
          "NO",
        ],
        TE: [
          "CLE",
        ],
        RB: [
          "LAR",
          "PIT",
        ],
      },
      leagueId: "genesis",
    },
    {
      _cardId: "4419",
      _createdAt: "2022-08-31T00:35:22.272Z",
      _isDefault: true,
      _isLocked: false,
      _isSetByCurrentOwner: false,
      _ownerId: "0xd8dc2ca51e0e53f6ad9b582a7e6c9a6b63258960",
      _updatedAt: "2022-08-31T00:35:22.272Z",
      bench: {
        QB: [
          "MIA",
        ],
        RB: [
          "MIA",
          "NYG",
        ],
        WR: [
          "TB",
          "TEN",
        ],
        DST: [
          "SF",
        ],
        TE: [
          "JAX",
        ],
      },
      gameWeek: "2022-REG-01",
      scoreSeason: "0.00",
      scoreWeek: 0,
      starting: {
        TE: [
          "DAL",
        ],
        QB: [
          "BUF",
        ],
        RB: [
          "GB",
          "LV",
        ],
        DST: [
          "ARI",
        ],
        WR: [
          "BUF",
          "LAR",
          "PHI",
        ],
      },
      leagueId: "genesis",
    },
    {
      _cardId: "8899",
      _createdAt: "2022-08-31T00:51:22.116Z",
      _isDefault: true,
      _isLocked: false,
      _isSetByCurrentOwner: false,
      _ownerId: "0xa2a633241988c5b40b2c9daa9c606b5792bbcbe0",
      _updatedAt: "2022-08-31T00:51:22.116Z",
      bench: {
        WR: [
          "PHI",
          "SEA",
        ],
        DST: [
          "LAR",
        ],
        QB: [
          "NYJ",
        ],
        RB: [
          "DET",
          "TB",
        ],
        TE: [
          "MIN",
        ],
      },
      gameWeek: "2022-REG-01",
      scoreSeason: "0.00",
      scoreWeek: 0,
      starting: {
        TE: [
          "BUF",
        ],
        DST: [
          "GB",
        ],
        RB: [
          "ARI",
          "DAL",
        ],
        WR: [
          "CHI",
          "DET",
          "MIA",
        ],
        QB: [
          "BAL",
        ],
      },
      leagueId: "genesis",
    },
    {
      _cardId: "47",
      _createdAt: "2022-08-31T00:19:36.158Z",
      _isDefault: true,
      _isLocked: false,
      _isSetByCurrentOwner: false,
      _ownerId: "0xd8dc2ca51e0e53f6ad9b582a7e6c9a6b63258960",
      _updatedAt: "2022-08-31T00:19:36.158Z",
      bench: {
        DST: [
          "BUF",
        ],
        WR: [
          "DET",
          "NO",
        ],
        QB: [
          "SF",
        ],
        RB: [
          "NO",
          "PHI",
        ],
        TE: [
          "JAX",
        ],
      },
      gameWeek: "2022-REG-01",
      scoreSeason: "0.00",
      scoreWeek: 0,
      starting: {
        TE: [
          "CLE",
        ],
        QB: [
          "JAX",
        ],
        DST: [
          "ATL",
        ],
        WR: [
          "ARI",
          "BAL",
          "CAR",
        ],
        RB: [
          "GB",
          "HOU",
        ],
      },
      leagueId: "genesis",
    },
    {
      _cardId: "8799",
      _createdAt: "2022-08-31T00:51:00.529Z",
      _isDefault: true,
      _isLocked: false,
      _isSetByCurrentOwner: false,
      _ownerId: "0xa2a633241988c5b40b2c9daa9c606b5792bbcbe0",
      _updatedAt: "2022-08-31T00:51:00.529Z",
      bench: {
        RB: [
          "NO",
          "TB",
        ],
        WR: [
          "NO",
          "WAS",
        ],
        QB: [
          "DEN",
        ],
        DST: [
          "TEN",
        ],
        TE: [
          "CAR",
        ],
      },
      gameWeek: "2022-REG-01",
      scoreSeason: "0.00",
      scoreWeek: 0,
      starting: {
        RB: [
          "IND",
          "MIN",
        ],
        DST: [
          "NYJ",
        ],
        TE: [
          "ATL",
        ],
        WR: [
          "IND",
          "KC",
          "LV",
        ],
        QB: [
          "CAR",
        ],
      },
      leagueId: "genesis",
    },
    {
      _cardId: "3465",
      _createdAt: "2022-08-31T00:31:58.673Z",
      _isDefault: true,
      _isLocked: false,
      _isSetByCurrentOwner: false,
      _ownerId: "0x0e2c8b5e179deae55fd6e0781e53e7f96e76dbfe",
      _updatedAt: "2022-08-31T00:31:58.673Z",
      bench: {
        QB: [
          "LV",
        ],
        RB: [
          "NE",
          "PHI",
        ],
        WR: [
          "LAC",
          "NYG",
        ],
        DST: [
          "TEN",
        ],
        TE: [
          "DET",
        ],
      },
      gameWeek: "2022-REG-01",
      scoreSeason: "0.00",
      scoreWeek: 0,
      starting: {
        QB: [
          "CAR",
        ],
        WR: [
          "CAR",
          "CIN",
          "DAL",
        ],
        DST: [
          "DAL",
        ],
        RB: [
          "ARI",
          "CIN",
        ],
        TE: [
          "BUF",
        ],
      },
      leagueId: "genesis",
    },
    {
      _cardId: "3468",
      _createdAt: "2022-08-31T00:31:59.282Z",
      _isDefault: true,
      _isLocked: false,
      _isSetByCurrentOwner: false,
      _ownerId: "0x0e2c8b5e179deae55fd6e0781e53e7f96e76dbfe",
      _updatedAt: "2022-08-31T00:31:59.282Z",
      bench: {
        TE: [
          "NE",
        ],
        DST: [
          "WAS",
        ],
        RB: [
          "NYG",
          "SEA",
        ],
        WR: [
          "JAX",
          "MIA",
        ],
        QB: [
          "PHI",
        ],
      },
      gameWeek: "2022-REG-01",
      scoreSeason: "0.00",
      scoreWeek: 0,
      starting: {
        RB: [
          "CLE",
          "NO",
        ],
        TE: [
          "CAR",
        ],
        WR: [
          "BAL",
          "BUF",
          "CLE",
        ],
        DST: [
          "DEN",
        ],
        QB: [
          "DEN",
        ],
      },
      leagueId: "genesis",
    },
    {
      _cardId: "5523",
      _createdAt: "2022-08-31T00:39:17.049Z",
      _isDefault: true,
      _isLocked: false,
      _isSetByCurrentOwner: false,
      _ownerId: "0x0e2c8b5e179deae55fd6e0781e53e7f96e76dbfe",
      _updatedAt: "2022-08-31T00:39:17.049Z",
      bench: {
        TE: [
          "NYG",
        ],
        WR: [
          "LV",
          "NYG",
        ],
        DST: [
          "SF",
        ],
        QB: [
          "NE",
        ],
        RB: [
          "GB",
          "SEA",
        ],
      },
      gameWeek: "2022-REG-01",
      scoreSeason: "0.00",
      scoreWeek: 0,
      starting: {
        QB: [
          "DET",
        ],
        DST: [
          "DEN",
        ],
        TE: [
          "LAC",
        ],
        RB: [
          "ARI",
          "BUF",
        ],
        WR: [
          "GB",
          "IND",
          "KC",
        ],
      },
      leagueId: "genesis",
    },
    {
      _cardId: "4561",
      _createdAt: "2022-08-31T00:35:52.471Z",
      _isDefault: true,
      _isLocked: false,
      _isSetByCurrentOwner: false,
      _ownerId: "0xd4b32d6e276b1864131fb9b434abf38a1de980c5",
      _updatedAt: "2022-08-31T00:35:52.471Z",
      bench: {
        WR: [
          "IND",
          "JAX",
        ],
        QB: [
          "CAR",
        ],
        TE: [
          "NYJ",
        ],
        DST: [
          "TEN",
        ],
        RB: [
          "LV",
          "PHI",
        ],
      },
      gameWeek: "2022-REG-01",
      scoreSeason: "0.00",
      scoreWeek: 0,
      starting: {
        TE: [
          "BAL",
        ],
        QB: [
          "ARI",
        ],
        WR: [
          "BAL",
          "GB",
          "HOU",
        ],
        RB: [
          "ATL",
          "DET",
        ],
        DST: [
          "NYG",
        ],
      },
      leagueId: "genesis",
    },
    {
      _cardId: "2168",
      _createdAt: "2022-08-31T00:27:22.861Z",
      _isDefault: true,
      _isLocked: false,
      _isSetByCurrentOwner: false,
      _ownerId: "0x7692ceca59b99c97de07e2adf4f69a8226643789",
      _updatedAt: "2022-08-31T00:27:22.861Z",
      bench: {
        WR: [
          "NYG",
          "SEA",
        ],
        DST: [
          "NE",
        ],
        TE: [
          "DET",
        ],
        QB: [
          "SF",
        ],
        RB: [
          "NYJ",
          "WAS",
        ],
      },
      gameWeek: "2022-REG-01",
      scoreSeason: "0.00",
      scoreWeek: 0,
      starting: {
        TE: [
          "CAR",
        ],
        RB: [
          "KC",
          "NE",
        ],
        DST: [
          "CLE",
        ],
        WR: [
          "BAL",
          "HOU",
          "MIN",
        ],
        QB: [
          "NYG",
        ],
      },
      leagueId: "genesis",
    },
    {
      _cardId: "2167",
      _createdAt: "2022-08-31T00:27:22.665Z",
      _isDefault: true,
      _isLocked: false,
      _isSetByCurrentOwner: false,
      _ownerId: "0x7692ceca59b99c97de07e2adf4f69a8226643789",
      _updatedAt: "2022-08-31T00:27:22.665Z",
      bench: {
        QB: [
          "TB",
        ],
        DST: [
          "SEA",
        ],
        TE: [
          "CAR",
        ],
        RB: [
          "LAR",
          "TEN",
        ],
        WR: [
          "NYG",
          "TEN",
        ],
      },
      gameWeek: "2022-REG-01",
      scoreSeason: "0.00",
      scoreWeek: 0,
      starting: {
        DST: [
          "DEN",
        ],
        QB: [
          "DET",
        ],
        TE: [
          "ATL",
        ],
        RB: [
          "DET",
          "JAX",
        ],
        WR: [
          "CIN",
          "DEN",
          "KC",
        ],
      },
      leagueId: "genesis",
    },
    {
      _cardId: "1695",
      _createdAt: "2022-08-31T00:25:39.036Z",
      _isDefault: true,
      _isLocked: false,
      _isSetByCurrentOwner: false,
      _ownerId: "0xd4cfc0d5b169def6e3ba9c3592691951dc047dd3",
      _updatedAt: "2022-08-31T00:25:39.036Z",
      bench: {
        WR: [
          "KC",
          "NYJ",
        ],
        DST: [
          "TB",
        ],
        RB: [
          "JAX",
          "PIT",
        ],
        TE: [
          "NYJ",
        ],
        QB: [
          "PIT",
        ],
      },
      gameWeek: "2022-REG-01",
      scoreSeason: "0.00",
      scoreWeek: 0,
      starting: {
        RB: [
          "DAL",
          "GB",
        ],
        WR: [
          "ARI",
          "CIN",
          "CLE",
        ],
        DST: [
          "ARI",
        ],
        QB: [
          "NO",
        ],
        TE: [
          "HOU",
        ],
      },
      leagueId: "genesis",
    },
    {
      _cardId: "6899",
      _createdAt: "2022-08-31T00:44:12.076Z",
      _isDefault: true,
      _isLocked: false,
      _isSetByCurrentOwner: true,
      _ownerId: "0xe942ae7e957d64b53887879c048dd17e91e036d6",
      _updatedAt: "2022-09-02T19:45:07.807Z",
      bench: {
        WR: [
          "NYG",
          "DET",
        ],
        TE: [
          "WAS",
        ],
        DST: [
          "HOU",
        ],
        QB: [
          "NE",
        ],
        RB: [
          "NYJ",
          "WAS",
        ],
      },
      gameWeek: "2022-REG-01",
      scoreSeason: "0.00",
      scoreWeek: 0,
      starting: {
        DST: [
          "CLE",
        ],
        RB: [
          "CIN",
          "PIT",
        ],
        TE: [
          "CLE",
        ],
        QB: [
          "CIN",
        ],
        WR: [
          "GB",
          "SF",
          "LAC",
        ],
      },
      leagueId: "genesis",
    },
    {
      _cardId: "5160",
      _createdAt: "2022-08-31T00:38:00.223Z",
      _isDefault: true,
      _isLocked: false,
      _isSetByCurrentOwner: true,
      _ownerId: "0x0dc06ee211512d5283f0df1454823b1d87dfb661",
      _updatedAt: "2022-09-05T01:01:34.761Z",
      bench: {
        DST: [
          "WAS",
        ],
        WR: [
          "JAX",
          "MIA",
        ],
        RB: [
          "DAL",
          "TEN",
        ],
        QB: [
          "NO",
        ],
        TE: [
          "DAL",
        ],
      },
      gameWeek: "2022-REG-01",
      scoreSeason: "0.00",
      scoreWeek: 0,
      starting: {
        WR: [
          "NYG",
          "NYJ",
          "NO",
        ],
        DST: [
          "SEA",
        ],
        TE: [
          "LV",
        ],
        QB: [
          "NYG",
        ],
        RB: [
          "NYJ",
          "NYG",
        ],
      },
      leagueId: "genesis",
    },
    {
      _cardId: "3064",
      _createdAt: "2022-08-31T00:30:32.902Z",
      _isDefault: true,
      _isLocked: false,
      _isSetByCurrentOwner: false,
      _ownerId: "0x54339ac9c4e197b2c24a969bcc59c51939350cb2",
      _updatedAt: "2022-08-31T00:30:32.902Z",
      bench: {
        DST: [
          "TB",
        ],
        TE: [
          "SEA",
        ],
        WR: [
          "NE",
          "TEN",
        ],
        QB: [
          "PIT",
        ],
        RB: [
          "GB",
          "SEA",
        ],
      },
      gameWeek: "2022-REG-01",
      scoreSeason: "0.00",
      scoreWeek: 0,
      starting: {
        WR: [
          "CIN",
          "GB",
          "MIA",
        ],
        TE: [
          "NYJ",
        ],
        QB: [
          "NYG",
        ],
        DST: [
          "LAC",
        ],
        RB: [
          "CHI",
          "DEN",
        ],
      },
      leagueId: "genesis",
    },
    {
      _cardId: "279",
      _createdAt: "2022-08-31T00:20:30.744Z",
      _isDefault: true,
      _isLocked: false,
      _isSetByCurrentOwner: true,
      _ownerId: "0x0621f9db527e567fa9a9d3f55ca3e53992b7dedb",
      _updatedAt: "2022-09-02T01:23:59.753Z",
      bench: {
        RB: [
          "JAX",
          "BUF",
        ],
        WR: [
          "CLE",
          "PIT",
        ],
        TE: [
          "TB",
        ],
        DST: [
          "KC",
        ],
        QB: [
          "NYJ",
        ],
      },
      gameWeek: "2022-REG-01",
      scoreSeason: "0.00",
      scoreWeek: 0,
      starting: {
        DST: [
          "TB",
        ],
        WR: [
          "PHI",
          "MIN",
          "NO",
        ],
        QB: [
          "DAL",
        ],
        RB: [
          "NYG",
          "LAC",
        ],
        TE: [
          "ATL",
        ],
      },
      leagueId: "genesis",
    },
    {
      _cardId: "3338",
      _createdAt: "2022-08-31T00:31:31.338Z",
      _isDefault: true,
      _isLocked: false,
      _isSetByCurrentOwner: false,
      _ownerId: "0x414088b0938d94e4d8f6c4f1ffd1e30d40626ad6",
      _updatedAt: "2022-08-31T00:31:31.338Z",
      bench: {
        RB: [
          "JAX",
          "NE",
        ],
        DST: [
          "LAC",
        ],
        TE: [
          "PIT",
        ],
        WR: [
          "LV",
          "NE",
        ],
        QB: [
          "NYJ",
        ],
      },
      gameWeek: "2022-REG-01",
      scoreSeason: "0.00",
      scoreWeek: 0,
      starting: {
        WR: [
          "CLE",
          "DET",
          "IND",
        ],
        RB: [
          "ATL",
          "CIN",
        ],
        QB: [
          "ARI",
        ],
        TE: [
          "CLE",
        ],
        DST: [
          "ARI",
        ],
      },
      leagueId: "genesis",
    },
    {
      _cardId: "2842",
      _createdAt: "2022-08-31T00:29:45.766Z",
      _isDefault: true,
      _isLocked: false,
      _isSetByCurrentOwner: false,
      _ownerId: "0xd0319e4e46ea516eb6ec325ce61b068d7e1f4c5a",
      _updatedAt: "2022-08-31T00:29:45.766Z",
      bench: {
        QB: [
          "DAL",
        ],
        DST: [
          "LAR",
        ],
        WR: [
          "GB",
          "WAS",
        ],
        RB: [
          "GB",
          "NYG",
        ],
        TE: [
          "NYJ",
        ],
      },
      gameWeek: "2022-REG-01",
      scoreSeason: "0.00",
      scoreWeek: 0,
      starting: {
        DST: [
          "BUF",
        ],
        TE: [
          "CAR",
        ],
        WR: [
          "BAL",
          "CIN",
          "DEN",
        ],
        QB: [
          "ATL",
        ],
        RB: [
          "CIN",
          "DET",
        ],
      },
      leagueId: "genesis",
    },
    {
      _cardId: "2902",
      _createdAt: "2022-08-31T00:29:58.309Z",
      _isDefault: true,
      _isLocked: false,
      _isSetByCurrentOwner: false,
      _ownerId: "0xd0319e4e46ea516eb6ec325ce61b068d7e1f4c5a",
      _updatedAt: "2022-08-31T00:29:58.309Z",
      bench: {
        RB: [
          "PHI",
          "PIT",
        ],
        QB: [
          "PHI",
        ],
        WR: [
          "NE",
          "NO",
        ],
        DST: [
          "LAC",
        ],
        TE: [
          "MIN",
        ],
      },
      gameWeek: "2022-REG-01",
      scoreSeason: "0.00",
      scoreWeek: 0,
      starting: {
        TE: [
          "ARI",
        ],
        DST: [
          "DET",
        ],
        RB: [
          "DAL",
          "GB",
        ],
        QB: [
          "NYJ",
        ],
        WR: [
          "ATL",
          "DET",
          "IND",
        ],
      },
      leagueId: "genesis",
    },
    {
      _cardId: "4210",
      _createdAt: "2022-08-31T00:34:37.552Z",
      _isDefault: true,
      _isLocked: false,
      _isSetByCurrentOwner: false,
      _ownerId: "0xd0319e4e46ea516eb6ec325ce61b068d7e1f4c5a",
      _updatedAt: "2022-08-31T00:34:37.552Z",
      bench: {
        RB: [
          "NYG",
          "WAS",
        ],
        WR: [
          "NE",
          "WAS",
        ],
        DST: [
          "SEA",
        ],
        TE: [
          "TB",
        ],
        QB: [
          "NYJ",
        ],
      },
      gameWeek: "2022-REG-01",
      scoreSeason: "0.00",
      scoreWeek: 0,
      starting: {
        QB: [
          "LAC",
        ],
        WR: [
          "ATL",
          "BAL",
          "KC",
        ],
        DST: [
          "LAR",
        ],
        RB: [
          "CAR",
          "CIN",
        ],
        TE: [
          "CHI",
        ],
      },
      leagueId: "genesis",
    },
    {
      _cardId: "2352",
      _createdAt: "2022-09-07T12:20:14.201Z",
      _isDefault: true,
      _isLocked: false,
      _isSetByCurrentOwner: true,
      _ownerId: "0xa05bca6f6d9c0bc2c3a597ac3f800eaf502aca66",
      _updatedAt: "2022-09-07T12:20:50.819Z",
      bench: {
        TE: [
          "LAC",
        ],
        QB: [
          "CAR",
        ],
        WR: [
          "CHI",
          "WAS",
        ],
        DST: [
          "HOU",
        ],
        RB: [
          "BAL",
          "CLE",
        ],
      },
      gameWeek: "2022-REG-01",
      scoreSeason: 0,
      scoreWeek: 0,
      starting: {
        TE: [
          "SF",
        ],
        QB: [
          "SF",
        ],
        WR: [
          "MIA",
          "JAX",
          "LAR",
        ],
        RB: [
          "DAL",
          "TEN",
        ],
        DST: [
          "TEN",
        ],
      },
      leagueId: "Season(Thu Sep 08 2022 - Tue Jan 03 2023)|Prize-1.8-$APE|Top-1-Paid|82",
    },
    {
      _cardId: "3064",
      _createdAt: "2022-09-08T20:36:02.102Z",
      _isDefault: true,
      _isLocked: false,
      _isSetByCurrentOwner: true,
      _ownerId: "0x54339ac9c4e197b2c24a969bcc59c51939350cb2",
      _updatedAt: "2022-09-08T20:37:19.666Z",
      bench: {
        DST: [
          "TB",
        ],
        WR: [
          "NE",
          "TEN",
        ],
        RB: [
          "CHI",
          "SEA",
        ],
        TE: [
          "SEA",
        ],
        QB: [
          "PIT",
        ],
      },
      gameWeek: "2022-REG-01",
      scoreSeason: 0,
      scoreWeek: 0,
      starting: {
        DST: [
          "LAC",
        ],
        TE: [
          "NYJ",
        ],
        QB: [
          "NYG",
        ],
        RB: [
          "GB",
          "DEN",
        ],
        WR: [
          "CIN",
          "GB",
          "MIA",
        ],
      },
      leagueId: "Season(Thu Sep 08 2022 - Tue Jan 03 2023)|Special Prize|See details|19",
    },
    {
      _cardId: "3064",
      _createdAt: "2022-09-08T20:30:13.480Z",
      _isDefault: true,
      _isLocked: false,
      _isSetByCurrentOwner: true,
      _ownerId: "0x54339ac9c4e197b2c24a969bcc59c51939350cb2",
      _updatedAt: "2022-09-08T20:31:09.220Z",
      bench: {
        DST: [
          "TB",
        ],
        QB: [
          "PIT",
        ],
        WR: [
          "NE",
          "TEN",
        ],
        TE: [
          "SEA",
        ],
        RB: [
          "GB",
          "SEA",
        ],
      },
      gameWeek: "2022-REG-01",
      scoreSeason: 0,
      scoreWeek: 0,
      starting: {
        RB: [
          "CHI",
          "DEN",
        ],
        TE: [
          "NYJ",
        ],
        WR: [
          "CIN",
          "GB",
          "MIA",
        ],
        DST: [
          "LAC",
        ],
        QB: [
          "NYG",
        ],
      },
      leagueId: "Season(Thu Sep 08 2022 - Tue Jan 03 2023)|Special Prize|See details|4",
    },
    {
      _cardId: "38",
      _createdAt: "2022-09-04T23:46:44.609Z",
      _isDefault: true,
      _isLocked: false,
      _isSetByCurrentOwner: true,
      _ownerId: "0x6a68e7e32ee88485f11cde93c3cf5f4d107905b8",
      _updatedAt: "2022-09-04T23:48:13.134Z",
      bench: {
        DST: [
          "TB",
        ],
        QB: [
          "DAL",
        ],
        TE: [
          "SEA",
        ],
        WR: [
          "PIT",
          "JAX",
        ],
        RB: [
          "NE",
          "KC",
        ],
      },
      gameWeek: "2022-REG-01",
      scoreSeason: 0,
      scoreWeek: 0,
      starting: {
        DST: [
          "WAS",
        ],
        RB: [
          "DEN",
          "PHI",
        ],
        TE: [
          "DET",
        ],
        QB: [
          "LAC",
        ],
        WR: [
          "IND",
          "TB",
          "LV",
        ],
      },
      leagueId: "Season(Thu Sep 08 2022 - Tue Jan 03 2023)|Special Prize|See details|43",
    },
    {
      _cardId: "2260",
      _createdAt: "2022-09-08T18:18:47.991Z",
      _isDefault: true,
      _isLocked: false,
      _isSetByCurrentOwner: true,
      _ownerId: "0xb472698319e30d265b8c83ae1d66695af8c0b5e7",
      _updatedAt: "2022-09-08T18:26:04.866Z",
      bench: {
        WR: [
          "NE",
          "ATL",
        ],
        QB: [
          "CLE",
        ],
        TE: [
          "CAR",
        ],
        RB: [
          "JAX",
          "HOU",
        ],
        DST: [
          "MIA",
        ],
      },
      gameWeek: "2022-REG-01",
      scoreSeason: 0,
      scoreWeek: 0,
      starting: {
        WR: [
          "SF",
          "ARI",
          "JAX",
        ],
        TE: [
          "TEN",
        ],
        QB: [
          "TB",
        ],
        DST: [
          "MIN",
        ],
        RB: [
          "TEN",
          "LAC",
        ],
      },
      leagueId: "Season(Thu Sep 08 2022 - Tue Oct 04 2022)|Prize-450-$APE|Top-5-Paid|1",
    },
  ];

  for(let i = 0; i < lineups.length; i++){
    const cardId = lineups[i]._cardId;
    const leagueId = lineups[i].leagueId;
    const lineup = lineups[i];
    delete lineup.leagueId;
    const gameWeek = '2022-REG-01';

    await score.lineup(leagueId, cardId, gameWeek)

    // const documentPathToLineups = `leagues/${leagueId}/cards/${cardId}/lineups/`;
    // await db.createOrUpdateDocument(documentPathToLineups, gameWeek, lineup, true);
    // console.log(`...✅   cardId:${cardId} leagueId:${leagueId} ${i} of ${lineups.length}`);
  }


  // for(let i = 0; i < data.length; i++){
  //   const leagueId = data[i].split(':')[1];
  //   const cardId = data[i].split(':')[0];
  //   const documentPathToLineups = `leagues/${leagueId}/cards/${cardId}/lineups/`;

  //   //grab lineup from gameWeek 1
  //   const prevLineup = await db.readDocument(documentPathToLineups, '2022-REG-01');
  //   prevLineup.leagueId = leagueId;
  //   lineups.push(prevLineup);
  //   //prevLineup.scoreWeek = 0;
  //   //await db.createOrUpdateDocument(documentPathToLineups, '2022-REG-02', prevLineup, true);
  // }

};



(async () => {
    console.log(`...📝   START:${SCRIPT_NAME}`);

    await run();

    console.log(`...📝   END:${SCRIPT_NAME}`);
    process.exit(0);
})();
