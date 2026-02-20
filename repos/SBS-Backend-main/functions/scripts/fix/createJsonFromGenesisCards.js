const { handler } = require('firebase-functions/v1');
const db = require('../../services/db');
const fs = require('fs');
const { parse } = require('json2csv');
const utils = require('../../services/utils');
const api = require('../../services/api');

const createGenesisCardsArray = async () => {
    const genesisData = {};
    for(let i = 0; i < 10000; i++) {
        const cardId = `${i}`;
        console.log(cardId)
        const card = await db.readDocument('cards', cardId);
        genesisData[cardId] = card;
    }

    return genesisData
}

const writeGenesisDataToJSON = async (data) => {

    let jsonContent = JSON.stringify(data);
    fs.writeFile("genesisCards.json", jsonContent, 'utf8', function (err) {
        if (err) {
            console.log("An error occured while writing JSON Object to File.");
            return console.log(err);
        }
     
        console.log("JSON file has been saved.");
    });
}

const checkIfRosterNeedsUpdated = (oldCard, newCard) => {
    let needsToUpdateRoster = false

    
    for(let j = 0; j < newCard.DST.length; j++) {
        const team = newCard.DST[j];
        let hasPlayer = false
        for(let z = 0; z < oldCard.DST.length; z++) {
            if (oldCard.DST[z] == team) {
                hasPlayer = true;
            }
        }
        if (!hasPlayer) {
            needsToUpdateRoster = true;
        }
    }

    if(!needsToUpdateRoster) {
        for(let j = 0; j < newCard.QB.length; j++) {
            const team = newCard.QB[j];
            let hasPlayer = false
            for(let z = 0; z < oldCard.QB.length; z++) {
                if (oldCard.QB[z] == team) {
                    hasPlayer = true;
                }
            }
            if (!hasPlayer) {
                needsToUpdateRoster = true;
            }
        }           
    }

    if(!needsToUpdateRoster) {
        for(let j = 0; j < newCard.RB.length; j++) {
            const team = newCard.RB[j];
            let hasPlayer = false
            for(let z = 0; z < oldCard.RB.length; z++) {
                if (oldCard.RB[z] == team) {
                    hasPlayer = true;
                }
            }
            if (!hasPlayer) {
                needsToUpdateRoster = true;
            }
        }           
    }

    if(!needsToUpdateRoster) {
        for(let j = 0; j < newCard.TE.length; j++) {
            const team = newCard.TE[j];
            let hasPlayer = false
            for(let z = 0; z < oldCard.TE.length; z++) {
                if (oldCard.TE[z] == team) {
                    hasPlayer = true;
                }
            }
            if (!hasPlayer) {
                needsToUpdateRoster = true;
            }
        }           
    }

    if(!needsToUpdateRoster) {
        for(let j = 0; j < newCard.WR.length; j++) {
            const team = newCard.WR[j];
            let hasPlayer = false
            for(let z = 0; z < oldCard.WR.length; z++) {
                if (oldCard.WR[z] == team) {
                    hasPlayer = true;
                }
            }
            if (!hasPlayer) {
                needsToUpdateRoster = true;
            }
        }           
    }

    return needsToUpdateRoster
}

const updateRosterOnCard = (oldCard, newCard) => {
    newCard.DST = oldCard.DST;
    newCard.QB = oldCard.QB;
    newCard.RB = oldCard.RB;
    newCard.TE = oldCard.TE;
    newCard.WR = oldCard.WR;


    return newCard
}

const updateLevelOnCard = (oldCard, newCard) => {
    newCard._level = oldCard._level;

    return newCard
}

const readInJSONAndCompare = async () => {
    let oldData;
    const path = "./genesisCards.json"
    oldData = fs.readFileSync(path, 'utf8')
    // , (err, data) => {
    //     if (err) {
    //         console.error('Error while reading the file:', err)
    //         return
    //       }
    //       console.log(data)
    //       try {
    //         oldData = JSON.parse(data);
    //         // output the parsed data
    //         console.log(oldData);
    //       } catch (err) {
    //         console.error('Error while parsing JSON data:', err);
    //     }
    // })
    oldData = JSON.parse(oldData)

    for(let i = 0; i < 10000; i++) {
        const cardId = `${i}`;
        const oldCard = oldData[cardId];
        
        
        const newCard = await db.readDocument('cards', cardId)

        if(newCard._freePeel) {
            if (newCard._freePeel != oldCard._freePeel) {
                console.log(`Updated free peels in card: ${cardId} from oldCard: ${oldCard._freePeel}, newCard: ${newCard._freePeel}`)
                newCard._freePeel = oldCard._freePeel;
                await db.createOrUpdateDocument('cards', cardId, newCard, false);
                await db.createOrUpdateDocument(`owners/${newCard._ownerId}/cards`, cardId, newCard, false);
                await db.createOrUpdateDocument('leagues/genesis/cards', cardId, newCard, false);
            }
        }
        // let needsUpdateRoster = checkIfRosterNeedsUpdated(oldCard, newCard)
        
        // let needsToUpdateLevel = false;
        // if(oldCard._level != newCard._level) {
        //     needsToUpdateLevel = true;
        // }

        // if(needsToUpdateLevel && needsUpdateRoster) {
        //     let result = updateLevelOnCard(oldCard, newCard);
        //     result = updateRosterOnCard(oldCard, result)

        //     console.log(`Updated roster and level for Card ${cardId}: ${result}`);
        //     await db.createOrUpdateDocument('cards', cardId, result, false)
        // } else if (needsToUpdateLevel && !needsUpdateRoster) {
        //     let result = updateLevelOnCard(oldCard, newCard);

        //     console.log(`updated level for Card ${cardId}: ${result}`)
        //     await db.createOrUpdateDocument('cards', cardId, result, false)
        // } else if (!needsToUpdateLevel && needsUpdateRoster) {
        //     let result = updateRosterOnCard(oldCard, newCard);

        //     console.log(`Updated roster on Card ${cardId}: ${result}`)
        //     await db.createOrUpdateDocument('cards', cardId, result, false)
        // }

    }
}

const cardIds = [
    "30",
    "33",
    "107",
    "108",
    "117",
    "136",
    "159",
    "168",
    "208",
    "226",
    "239",
    "283",
    "285",
    "292",
    "315",
    "371",
    "408",
    "416",
    "417",
    "481",
    "488",
    "520",
    "573",
    "665",
    "724",
    "725",
    "753",
    "857",
    "858",
    "906",
    "913",
    "919",
    "929",
    "1040",
    "1055",
    "1083",
    "1193",
    "1194",
    "1231",
    "1232",
    "1233",
    "1236",
    "1237",
    "1239",
    "1241",
    "1276",
    "1290",
    "1291",
    "1329",
    "1330",
    "1408",
    "1554",
    "1555",
    "1560",
    "1586",
    "1587",
    "1588",
    "1606",
    "1610",
    "1613",
    "1614",
    "1615",
    "1616",
    "1618",
    "1623",
    "1624",
    "1643",
    "1658",
    "1673",
    "1675",
    "1687",
    "1749",
    "1802",
    "1804",
    "1945",
    "1947",
    "1978",
    "1979",
    "1983",
    "2023",
    "2102",
    "2105",
    "2191",
    "2218",
    "2219",
    "2220",
    "2227",
    "2228",
    "2246",
    "2247",
    "2248",
    "2249",
    "2280",
    "2282",
    "2294",
    "2313",
    "2320",
    "2331",
    "2337",
    "2344",
    "2385",
    "2432",
    "2445",
    "2449",
    "2452",
    "2485",
    "2486",
    "2523",
    "2524",
    "2609",
    "2623",
    "2720",
    "2721",
    "2835",
    "2925",
    "2968",
    "2993",
    "3139",
    "3140",
    "3141",
    "3147",
    "3148",
    "3203",
    "3292",
    "3293",
    "3294",
    "3299",
    "3301",
    "3302",
    "3360",
    "3363",
    "3379",
    "3396",
    "3441",
    "3488",
    "3506",
    "3607",
    "3640",
    "3642",
    "3644",
    "3645",
    "3657",
    "3703",
    "3744",
    "3783",
    "3840",
    "3859",
    "3876",
    "3884",
    "3908",
    "4141",
    "4305",
    "4317",
    "4353",
    "4417",
    "4438",
    "4439",
    "4440",
    "4469",
    "4516",
    "4558",
    "4563",
    "4617",
    "4624",
    "4628",
    "4683",
    "4765",
    "4777",
    "4840",
    "4866",
    "4904",
    "4908",
    "4916",
    "5021",
    "5092",
    "5094",
    "5189",
    "5251",
    "5260",
    "5263",
    "5309",
    "5313",
    "5322",
    "5375",
    "5403",
    "5448",
    "5531",
    "5631",
    "5651",
    "5666",
    "5700",
    "5721",
    "5722",
    "5723",
    "5725",
    "5731",
    "5733",
    "5771",
    "5803",
    "5812",
    "5844",
    "5937",
    "6015",
    "6019",
    "6028",
    "6029",
    "6085",
    "6126",
    "6320",
    "6337",
    "6342",
    "6430",
    "6518",
    "6547",
    "6554",
    "6576",
    "6648",
    "6673",
    "6711",
    "6716",
    "6717",
    "6720",
    "6746",
    "6772",
    "6784",
    "6796",
    "6799",
    "6923",
    "7002",
    "7037",
    "7038",
    "7071",
    "7073",
    "7104",
    "7182",
    "7253",
    "7270",
    "7272",
    "7283",
    "7573",
    "7803",
    "7818",
    "7889",
    "8102",
    "8243",
    "8587",
    "8616",
    "8820",
    "8829",
    "8837",
    "8897",
    "8914",
    "8925",
    "8926",
    "8986",
    "9098",
    "9151",
    "9225",
    "9243",
    "9359",
    "9360",
    "9444",
    "9833",
    "9840",
    "9875",
    "9877",
    "9930",
    "9932",
    "9936",
    "9937",
];

const updateCardInGenesisLeague = async () => {
    for(let i = 0; i < cardIds.length; i++) {
        const cardId = cardIds[i];
        const card = await db.readDocument('cards', cardId);

        const leaderboardObj = await db.readDocument('genesisLeaderboard/2023REG-01/cards', cardId);
        leaderboardObj.card = card;
        await db.createOrUpdateDocument('genesisLeaderboard/2023REG-01/cards', cardId, leaderboardObj, false)

        // await db.createOrUpdateDocument(`owners/${card._ownerId}/cards`, cardId, card, false);
        // await db.createOrUpdateDocument('leagues/genesis/cards', cardId, card, false)
        console.log(cardId)

        //const lineupCard = await db.readDocument('leagues/genesis/cards', cardId)
        // const updatedCard = await api.getCardImage(card)

        // const metadata = await utils.convertCardToCardMetadata(updatedCard)

        // await db.createOrUpdateDocument('cards', cardId, updatedCard, false)
        // await db.createOrUpdateDocument('cardMetadata', cardId, metadata, false)
        // console.log("Updated Card ", cardId)

        // try {
        //     await db.createOrUpdateDocument('leagues/genesis/cards', cardId, card, false);
        //     console.log('UPdated card in leagues: ', cardId);
        // } catch (err) {
        //     console.log(err)
        // }
        // const defaultLineup = utils.getDefaultLineup(card)
        // defaultLineup.gameWeek = '2023REG-01';
        // defaultLineup.scoreWeek = 0;
        // defaultLineup.scoreSeason = 0;
        // defaultLineup.prevWeekSeasonScore = 0;
        // try {
        //     await db.createOrUpdateDocument(`leagues/genesis/cards/${cardId}/lineups`, '2023REG-01', defaultLineup, false)
        //     console.log('updated lineup: Card ', cardId)
        // } catch (err) {
        //     console.log(err);
        // }
    }
}

(async () => {
    //console.log(cardIds.length)
    await updateCardInGenesisLeague()
})()

