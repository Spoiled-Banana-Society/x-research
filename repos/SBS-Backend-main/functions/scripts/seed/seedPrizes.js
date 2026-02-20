//✍️ STEP: 1  FILL OUT THE SCRIPT TEMPLATE BELOW

const { defineBoolean } = require("firebase-functions/v2/params");

/* DESCRIPTION START:
========================

    📝 General Description:

    Prizes will be stored in the database.  The prizes will help our application keep track of who gets what prize. 

    👣 Deployment Steps: node seedPrizes.js

    🔗 TaskLink: Trello Link Here

    📅 Date Run in sbs-fantasy-dev:

    📅 Date Run in sbs-fantasy-prod:

========================
DESCRIPTION END */

//🗃️ STEP 2: Add needed Dependencies

const SCRIPT_NAME = 'Seed Prizes'; //required

//Packages

//services
const db = require('../../services/db');


//🚀 STEP 3: Write the script.  Include tests for validation where possible
const _seedSeasonTopPrizes = async () => {
  const prizeId = 'season-top';
  const prizeDocument = {
    prizeId,
    places: [
      { "place": 1, "prize": 0,"type": "eth", "other": "bayc #2921"},
      { "place": 2, "prize": 5, "type": 'eth'},
      { "place": 3, "prize": 3, "type": 'eth'},
      { "place": 4, "prize": 1.75, "type": 'eth'},
      { "place": 5, "prize": 1.5, "type": 'eth'},
      { "place": 6, "prize": 1.25, "type": 'eth'},
      { "place": 7, "prize": 1, "type": 'eth'},
      { "place": 8, "prize": 0.8, "type": 'eth'},
      { "place": 9, "prize": 0.65, "type": 'eth'},
      { "place": 10,"prize": .5, "type": 'eth'},
      { "place": 11, "prize": 0.2,"type": "eth"},
      { "place": 10, "prize": 0, "type": "eth" },
      { "place": 11, "prize": 0, "type": "eth" },
      { "place": 12, "prize": 0.2, "type": "eth" },
      { "place": 13, "prize": 0.2, "type": "eth" },
      { "place": 14, "prize": 0.2, "type": "eth" },
      { "place": 15, "prize": 0.2, "type": "eth" },
      { "place": 16, "prize": 0.2, "type": "eth" },
      { "place": 17, "prize": 0.2, "type": "eth" },
      { "place": 18, "prize": 0.2, "type": "eth" },
      { "place": 19, "prize": 0.2, "type": "eth" },
      { "place": 20, "prize": 0.2, "type": "eth" },
      { "place": 21, "prize": 0.2, "type": "eth" },
      { "place": 22, "prize": 0.2, "type": "eth" },
      { "place": 23, "prize": 0.2, "type": "eth" },
      { "place": 24, "prize": 0.2, "type": "eth" },
      { "place": 25, "prize": 0.2, "type": "eth" },
      { "place": 26, "prize": 0, "type": "eth" },
      { "place": 27, "prize": 0.1, "type": "eth" },
      { "place": 28, "prize": 0.1, "type": "eth" },
      { "place": 29, "prize": 0.1, "type": "eth" },
      { "place": 30, "prize": 0.1, "type": "eth" },
      { "place": 31, "prize": 0.1, "type": "eth" },
      { "place": 32, "prize": 0.1, "type": "eth" },
      { "place": 33, "prize": 0.1, "type": "eth" },
      { "place": 34, "prize": 0.1, "type": "eth" },
      { "place": 35, "prize": 0.1, "type": "eth" },
      { "place": 36, "prize": 0.1, "type": "eth" },
      { "place": 37, "prize": 0.1, "type": "eth" },
      { "place": 38, "prize": 0.1, "type": "eth" },
      { "place": 39, "prize": 0.1, "type": "eth" },
      { "place": 40, "prize": 0.1, "type": "eth" },
      { "place": 41, "prize": 0.1, "type": "eth" },
      { "place": 42, "prize": 0.1, "type": "eth" },
      { "place": 43, "prize": 0.1, "type": "eth" },
      { "place": 44, "prize": 0.1, "type": "eth" },
      { "place": 45, "prize": 0.1, "type": "eth" },
      { "place": 46, "prize": 0.1, "type": "eth" },
      { "place": 47, "prize": 0.1, "type": "eth" },
      { "place": 48, "prize": 0.1, "type": "eth" },
      { "place": 49, "prize": 0.1, "type": "eth" },
      { "place": 50, "prize": 0.1, "type": "eth" },
      { "place": 51, "prize": 0.06, "type": "eth" },
      { "place": 52, "prize": 0.06, "type": "eth" },
      { "place": 53, "prize": 0.06, "type": "eth" },
      { "place": 54, "prize": 0.06, "type": "eth" },
      { "place": 55, "prize": 0.06, "type": "eth" },
      { "place": 56, "prize": 0.06, "type": "eth" },
      { "place": 57, "prize": 0.06, "type": "eth" },
      { "place": 58, "prize": 0.06, "type": "eth" },
      { "place": 59, "prize": 0.06, "type": "eth" },
      { "place": 60, "prize": 0.06, "type": "eth" },
      { "place": 61, "prize": 0.06, "type": "eth" },
      { "place": 62, "prize": 0.06, "type": "eth" },
      { "place": 63, "prize": 0.06, "type": "eth" },
      { "place": 64, "prize": 0.06, "type": "eth" },
      { "place": 65, "prize": 0.06, "type": "eth" },
      { "place": 66, "prize": 0.06, "type": "eth" },
      { "place": 67, "prize": 0.06, "type": "eth" },
      { "place": 68, "prize": 0.06, "type": "eth" },
      { "place": 69, "prize": 0.06, "type": "eth" },
      { "place": 70, "prize": 0.06, "type": "eth" },
      { "place": 71, "prize": 0.06, "type": "eth" },
      { "place": 72, "prize": 0.06, "type": "eth" },
      { "place": 73, "prize": 0.06, "type": "eth" },
      { "place": 74, "prize": 0.06, "type": "eth" },
      { "place": 75, "prize": 0.06, "type": "eth" },
      { "place": 76, "prize": 0.06, "type": "eth" },
      { "place": 77, "prize": 0.06, "type": "eth" },
      { "place": 78, "prize": 0.06, "type": "eth" },
      { "place": 79, "prize": 0.06, "type": "eth" },
      { "place": 80, "prize": 0.06, "type": "eth" },
      { "place": 81, "prize": 0.06, "type": "eth" },
      { "place": 82, "prize": 0.06, "type": "eth" },
      { "place": 83, "prize": 0.06, "type": "eth" },
      { "place": 84, "prize": 0.06, "type": "eth" },
      { "place": 85, "prize": 0.06, "type": "eth" },
      { "place": 86, "prize": 0.06, "type": "eth" },
      { "place": 87, "prize": 0.06, "type": "eth" },
      { "place": 88, "prize": 0.06, "type": "eth" },
      { "place": 89, "prize": 0.06, "type": "eth" },
      { "place": 90, "prize": 0.06, "type": "eth" },
      { "place": 91, "prize": 0.06, "type": "eth" },
      { "place": 92, "prize": 0.06, "type": "eth" },
      { "place": 93, "prize": 0.06, "type": "eth" },
      { "place": 94, "prize": 0.06, "type": "eth" },
      { "place": 95, "prize": 0.06, "type": "eth" },
      { "place": 96, "prize": 0.06, "type": "eth" },
      { "place": 97, "prize": 0.06, "type": "eth" },
      { "place": 98, "prize": 0.06, "type": "eth" },
      { "place": 99, "prize": 0.06, "type": "eth" },
    ]
  };
  await db.createOrUpdateDocument('prizes', prizeId, prizeDocument);
  console.log(`...🏆   prize:${prizeId} seeded`);
}

const _seedSeasonBottomPrizes = async () => {
  const prizeId = 'season-bottom';
  const prizeDocument = {
    prizeId,
    places: [
      {"place": 10000, "prize": 10,"type": "eth" },
      {"place": 9999, "prize": 2,"type": "eth" },
      {"place": 9998, "prize": 1.5,"type": "eth" },
      {"place": 9997, "prize": 1.25,"type": "eth" },
      {"place": 9996, "prize": 1,"type": "eth" },
      {"place": 9995, "prize": 0.8,"type": "eth" },
      {"place": 9994, "prize": 0.6,"type": "eth" },
      {"place": 9993, "prize": 0.5,"type": "eth" },
      {"place": 9992, "prize": 0.4,"type": "eth" },
      {"place": 9991, "prize": 0.25,"type": "eth" },
      {"place": 9990, "prize": 0.15,"type": "eth" },
      {"place":9990,"prize":0,"type":"eth"},
      {"place":9989,"prize":0.15,"type":"eth"},
      {"place":9988,"prize":0.15,"type":"eth"},
      {"place":9987,"prize":0.15,"type":"eth"},
      {"place":9986,"prize":0.15,"type":"eth"},
      {"place":9985,"prize":0.15,"type":"eth"},
      {"place":9984,"prize":0.15,"type":"eth"},
      {"place":9983,"prize":0.15,"type":"eth"},
      {"place":9982,"prize":0.15,"type":"eth"},
      {"place":9981,"prize":0.15,"type":"eth"},
      {"place":9980,"prize":0.15,"type":"eth"},
      {"place":9979,"prize":0.15,"type":"eth"},
      {"place":9978,"prize":0.15,"type":"eth"},
      {"place":9977,"prize":0.15,"type":"eth"},
      {"place":9976,"prize":0.15,"type":"eth"},
      {"place":9975,"prize":0,"type":"eth"},
      {"place":9974,"prize":0.1,"type":"eth"},
      {"place":9973,"prize":0.1,"type":"eth"},
      {"place":9972,"prize":0.1,"type":"eth"},
      {"place":9971,"prize":0.1,"type":"eth"},
      {"place":9970,"prize":0.1,"type":"eth"},
      {"place":9969,"prize":0.1,"type":"eth"},
      {"place":9968,"prize":0.1,"type":"eth"},
      {"place":9967,"prize":0.1,"type":"eth"},
      {"place":9966,"prize":0.1,"type":"eth"},
      {"place":9965,"prize":0.1,"type":"eth"},
      {"place":9964,"prize":0.1,"type":"eth"},
      {"place":9963,"prize":0.1,"type":"eth"},
      {"place":9962,"prize":0.1,"type":"eth"},
      {"place":9961,"prize":0.1,"type":"eth"},
      {"place":9960,"prize":0.1,"type":"eth"},
      {"place":9959,"prize":0.1,"type":"eth"},
      {"place":9958,"prize":0.1,"type":"eth"},
      {"place":9957,"prize":0.1,"type":"eth"},
      {"place":9956,"prize":0.1,"type":"eth"},
      {"place":9955,"prize":0.1,"type":"eth"},
      {"place":9954,"prize":0.1,"type":"eth"},
      {"place":9953,"prize":0.1,"type":"eth"},
      {"place":9952,"prize":0.1,"type":"eth"},
      {"place":9951,"prize":0.1,"type":"eth"},
      {"place":9950,"prize":0,"type":"eth"},
      {"place":9949,"prize":0.06,"type":"eth"},
      {"place":9948,"prize":0.06,"type":"eth"},
      {"place":9947,"prize":0.06,"type":"eth"},
      {"place":9946,"prize":0.06,"type":"eth"},
      {"place":9945,"prize":0.06,"type":"eth"},
      {"place":9944,"prize":0.06,"type":"eth"},
      {"place":9943,"prize":0.06,"type":"eth"},
      {"place":9942,"prize":0.06,"type":"eth"},
      {"place":9941,"prize":0.06,"type":"eth"},
      {"place":9940,"prize":0.06,"type":"eth"},
      {"place":9939,"prize":0.06,"type":"eth"},
      {"place":9938,"prize":0.06,"type":"eth"},
      {"place":9937,"prize":0.06,"type":"eth"},
      {"place":9936,"prize":0.06,"type":"eth"},
      {"place":9935,"prize":0.06,"type":"eth"},
      {"place":9934,"prize":0.06,"type":"eth"},
      {"place":9933,"prize":0.06,"type":"eth"},
      {"place":9932,"prize":0.06,"type":"eth"},
      {"place":9931,"prize":0.06,"type":"eth"},
      {"place":9930,"prize":0.06,"type":"eth"},
      {"place":9929,"prize":0.06,"type":"eth"},
      {"place":9928,"prize":0.06,"type":"eth"},
      {"place":9927,"prize":0.06,"type":"eth"},
      {"place":9926,"prize":0.06,"type":"eth"},
      {"place":9925,"prize":0.06,"type":"eth"},
      {"place":9924,"prize":0.06,"type":"eth"},
      {"place":9923,"prize":0.06,"type":"eth"},
      {"place":9922,"prize":0.06,"type":"eth"},
      {"place":9921,"prize":0.06,"type":"eth"},
      {"place":9920,"prize":0.06,"type":"eth"},
      {"place":9919,"prize":0.06,"type":"eth"},
      {"place":9918,"prize":0.06,"type":"eth"},
      {"place":9917,"prize":0.06,"type":"eth"},
      {"place":9916,"prize":0.06,"type":"eth"},
      {"place":9915,"prize":0.06,"type":"eth"},
      {"place":9914,"prize":0.06,"type":"eth"},
      {"place":9913,"prize":0.06,"type":"eth"},
      {"place":9912,"prize":0.06,"type":"eth"},
      {"place":9911,"prize":0.06,"type":"eth"},
      {"place":9910,"prize":0.06,"type":"eth"},
      {"place":9909,"prize":0.06,"type":"eth"},
      {"place":9908,"prize":0.06,"type":"eth"},
      {"place":9907,"prize":0.06,"type":"eth"},
      {"place":9906,"prize":0.06,"type":"eth"},
      {"place":9905,"prize":0.06,"type":"eth"},
      {"place":9904,"prize":0.06,"type":"eth"},
      {"place":9903,"prize":0.06,"type":"eth"},
      {"place":9902,"prize":0.06,"type":"eth"},
      {"place":9901,"prize":0.06,"type":"eth"},
    ]
  }
  await db.createOrUpdateDocument('prizes', prizeId, prizeDocument);
  console.log(`...🏆   prize:${prizeId} seeded`);
}

const _seedSeasonHallOfFamePrizes = async () => {
  const prizeId = 'season-hof';
  const prizeDocument = {
    prizeId,
    places: [
      { "place": 1, "prize": 0,"type": "eth", "other": "MAYC #26946"},
      { "place": 2, "prize":  1.5, "type": "eth", "other": "1 mint mash token"},
      {"place": 3, "prize": 1,"type": "eth" },
      {"place": 4, "prize": 0.75,"type": "eth" },
      {"place": 5, "prize": 0.6,"type": "eth" },
      {"place": 6, "prize": 0.5,"type": "eth" },
      {"place": 7, "prize": 0.4,"type": "eth" },
      {"place": 8, "prize": 0.3,"type": "eth" },
      {"place": 9, "prize": 0.2,"type": "eth" },
      {"place": 10, "prize": 0.1,"type": "eth" },
    ]
  }
  await db.createOrUpdateDocument('prizes', prizeId, prizeDocument);
  console.log(`...🏆   prize:${prizeId} seeded`);
}

const _seedSeasonSpoiledPrizes = async () => {
  const prizeId = 'season-spoiled';
  const prizeDocument = {
    prizeId,
    places: [
      { "place": 1, "prize": 0,"type": "eth", "other": "Otherside #20276"},
      { "place": 2, "prize":  1.5, "type": "eth", "other": "1 minted peel token"},
      { "place": 3, "prize":  1, "type": "eth", "other": "1 minted peel token"},
      {"place": 4, "prize": 0.75,"type": "eth" },
      {"place": 5, "prize": 0.6,"type": "eth" },
      {"place": 6, "prize": 0.5,"type": "eth" },
      {"place": 7, "prize": 0.4,"type": "eth" },
      {"place": 8, "prize": 0.3,"type": "eth" },
      {"place": 9, "prize": 0.2,"type": "eth" },
      {"place": 10, "prize": 0.1,"type": "eth" },
    ]
  }
  await db.createOrUpdateDocument('prizes', prizeId, prizeDocument);
  console.log(`...🏆   prize:${prizeId} seeded`);
}

const _seedWeeklyPrizes = async () => {
  const prizeId = 'weekly-top';
  const prizeDocument = {
    prizeId,
    places: [
      {"place":1,"prize":1,"type":"eth"},
      {"place":2,"prize":0.25,"type":"eth"},
      {"place":3,"prize":0.2,"type":"eth"},
      {"place":4,"prize":0.15,"type":"eth"},
      {"place":5,"prize":0.1,"type":"eth"},
      {"place":6,"prize":0.09,"type":"eth"},
      {"place":7,"prize":0.08,"type":"eth"},
      {"place":8,"prize":0.07,"type":"eth"},
      {"place":9,"prize":0.06,"type":"eth"},
      {"place":10,"prize":0.05,"type":"eth"},
      {"place":11,"prize":0.03,"type":"eth"},
      {"place":12,"prize":0.03,"type":"eth"},
      {"place":13,"prize":0.03,"type":"eth"},
      {"place":14,"prize":0.03,"type":"eth"},
      {"place":15,"prize":0.03,"type":"eth"},
      {"place":16,"prize":0.03,"type":"eth"},
      {"place":17,"prize":0.03,"type":"eth"},
      {"place":18,"prize":0.03,"type":"eth"},
      {"place":19,"prize":0.03,"type":"eth"},
      {"place":20,"prize":0.03,"type":"eth"},
      {"place":21,"prize":0.03,"type":"eth"},
      {"place":22,"prize":0.03,"type":"eth"},
      {"place":23,"prize":0.03,"type":"eth"},
      {"place":24,"prize":0.03,"type":"eth"},
      {"place":25,"prize":0.03,"type":"eth"},
      {"place":26,"prize":0.025,"type":"eth"},
      {"place":27,"prize":0.025,"type":"eth"},
      {"place":28,"prize":0.025,"type":"eth"},
      {"place":29,"prize":0.025,"type":"eth"},
      {"place":30,"prize":0.025,"type":"eth"},
      {"place":31,"prize":0.025,"type":"eth"},
      {"place":32,"prize":0.025,"type":"eth"},
      {"place":33,"prize":0.025,"type":"eth"},
      {"place":34,"prize":0.025,"type":"eth"},
      {"place":35,"prize":0.025,"type":"eth"},
      {"place":36,"prize":0.025,"type":"eth"},
      {"place":37,"prize":0.025,"type":"eth"},
      {"place":38,"prize":0.025,"type":"eth"},
      {"place":39,"prize":0.025,"type":"eth"},
      {"place":40,"prize":0.025,"type":"eth"},
      {"place":41,"prize":0.025,"type":"eth"},
      {"place":42,"prize":0.025,"type":"eth"},
      {"place":43,"prize":0.025,"type":"eth"},
      {"place":44,"prize":0.025,"type":"eth"},
      {"place":45,"prize":0.025,"type":"eth"},
      {"place":46,"prize":0.025,"type":"eth"},
      {"place":47,"prize":0.025,"type":"eth"},
      {"place":48,"prize":0.025,"type":"eth"},
      {"place":49,"prize":0.025,"type":"eth"},
      {"place":50,"prize":0.025,"type":"eth"},
      {"place":51,"prize":0.02,"type":"eth"},
      {"place":52,"prize":0.02,"type":"eth"},
      {"place":53,"prize":0.02,"type":"eth"},
      {"place":54,"prize":0.02,"type":"eth"},
      {"place":55,"prize":0.02,"type":"eth"},
      {"place":56,"prize":0.02,"type":"eth"},
      {"place":57,"prize":0.02,"type":"eth"},
      {"place":58,"prize":0.02,"type":"eth"},
      {"place":59,"prize":0.02,"type":"eth"},
      {"place":60,"prize":0.02,"type":"eth"},
      {"place":61,"prize":0.02,"type":"eth"},
      {"place":62,"prize":0.02,"type":"eth"},
      {"place":63,"prize":0.02,"type":"eth"},
      {"place":64,"prize":0.02,"type":"eth"},
      {"place":65,"prize":0.02,"type":"eth"},
      {"place":66,"prize":0.02,"type":"eth"},
      {"place":67,"prize":0.02,"type":"eth"},
      {"place":68,"prize":0.02,"type":"eth"},
      {"place":69,"prize":0.02,"type":"eth"},
      {"place":70,"prize":0.02,"type":"eth"},
      {"place":71,"prize":0.02,"type":"eth"},
      {"place":72,"prize":0.02,"type":"eth"},
      {"place":73,"prize":0.02,"type":"eth"},
      {"place":74,"prize":0.02,"type":"eth"},
      {"place":75,"prize":0.02,"type":"eth"},
      {"place":76,"prize":0.02,"type":"eth"},
      {"place":77,"prize":0.02,"type":"eth"},
      {"place":78,"prize":0.02,"type":"eth"},
      {"place":79,"prize":0.02,"type":"eth"},
      {"place":80,"prize":0.02,"type":"eth"},
      {"place":81,"prize":0.02,"type":"eth"},
      {"place":82,"prize":0.02,"type":"eth"},
      {"place":83,"prize":0.02,"type":"eth"},
      {"place":84,"prize":0.02,"type":"eth"},
      {"place":85,"prize":0.02,"type":"eth"},
      {"place":86,"prize":0.02,"type":"eth"},
      {"place":87,"prize":0.02,"type":"eth"},
      {"place":88,"prize":0.02,"type":"eth"},
      {"place":89,"prize":0.02,"type":"eth"},
      {"place":90,"prize":0.02,"type":"eth"},
      {"place":91,"prize":0.02,"type":"eth"},
      {"place":92,"prize":0.02,"type":"eth"},
      {"place":93,"prize":0.02,"type":"eth"},
      {"place":94,"prize":0.02,"type":"eth"},
      {"place":95,"prize":0.02,"type":"eth"},
      {"place":96,"prize":0.02,"type":"eth"},
      {"place":97,"prize":0.02,"type":"eth"},
      {"place":98,"prize":0.02,"type":"eth"},
      {"place":99,"prize":0.02,"type":"eth"},
      {"place":100,"prize":0.02,"type":"eth"},
    ]
  }
  await db.createOrUpdateDocument('prizes', prizeId, prizeDocument);
  console.log(`...🏆   prize:${prizeId} seeded`);
}

const _seedWeeklyHallOfFamePrizes = async () => {
  const prizeId = 'weekly-hof';
  const prizeDocument = {
    prizeId,
    places: [
      { "place": 1, "prize": 0.25,"type": "eth"},
      { "place": 2, "prize": 0.125, "type": "eth"},
      {"place": 3, "prize": 0.10, "type": "eth" },
      {"place": 4, "prize": 0.09,"type": "eth" },
      {"place": 5, "prize": 0.08,"type": "eth" },
      {"place": 6, "prize": 0.07,"type": "eth" },
      {"place": 7, "prize": 0.06,"type": "eth" },
      {"place": 8, "prize": 0.05,"type": "eth" },
      {"place": 9, "prize": 0.04,"type": "eth" },
      {"place": 10, "prize": 0.03,"type": "eth" },
    ]
  }
  await db.createOrUpdateDocument('prizes', prizeId, prizeDocument);
  console.log(`...🏆   prize:${prizeId} seeded`);
}

const _seedWeeklySpoiledPrizes = async () => {
  const prizeId = 'weekly-spoiled';
  const prizeDocument = {
    prizeId,
    places: [
      { "place": 1, "prize": 0.2,"type": "eth"},
      { "place": 2, "prize": 0.10, "type": "eth"},
      {"place": 3, "prize": 0.08, "type": "eth" },
      {"place": 4, "prize": 0.07,"type": "eth" },
      {"place": 5, "prize": 0.06,"type": "eth" },
      {"place": 6, "prize": 0.05,"type": "eth" },
      {"place": 7, "prize": 0.045,"type": "eth" },
      {"place": 8, "prize": 0.04,"type": "eth" },
      {"place": 9, "prize": 0.035,"type": "eth" },
      {"place": 10, "prize": 0.03,"type": "eth" },
    ]
  }
  await db.createOrUpdateDocument('prizes', prizeId, prizeDocument);
  console.log(`...🏆   prize:${prizeId} seeded`);
}

const run = async () => {
  await _seedSeasonTopPrizes();
  await _seedSeasonBottomPrizes();
  await _seedSeasonHallOfFamePrizes();
  await _seedSeasonSpoiledPrizes();
  await _seedWeeklyPrizes();
  await _seedWeeklyHallOfFamePrizes();
  await _seedWeeklySpoiledPrizes();
};

(async () => {
  console.log(`...📝   START:${SCRIPT_NAME}`);

  await run();

  console.log(`...📝   END:${SCRIPT_NAME}`);
  process.exit(0);
})();
