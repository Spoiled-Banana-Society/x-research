
const sbsUtils = require("./services/sbs");
const utils = require("./services/utils");
const db = require("./services/db");
const web3Utils = require("./services/card");
const dstScoring = require("./services/scoring");
const fs = require("fs");

//Create a script that leaves only leaves week 16 and 17 scores only
//Get all week 16 scored
//Get all week 17 scored
let card;
let indexOfScore;


(async () => {

    for(let i = 0; i < 10_000; i++) {
        card = await db.readDocument("cards", i.toString());
        for(let j = 1; j < 16; j++) {
            delete card[`2021-REG-week-${j}-weeklyPts`];
            delete card[`2021-REG-week-${j}-seasonPts`];
            indexOfScore = card.scores.findIndex(score => Object.keys(score).includes(`2021-REG-week-${j}`));
            card.scores.splice(indexOfScore, 1);
        }
        await db.createOrUpdateDocument("cards", i.toString(), card, false);
    }

    process.exit(0);
})();

