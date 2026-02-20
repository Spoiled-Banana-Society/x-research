//✍️ STEP: 1  FILL OUT THE SCRIPT TEMPLATE BELOW

/* DESCRIPTION START:
========================

    📝 General Description:

    Add script to add special promotional league.

    👣 Deployment Steps: node addPromoLeague.js

    🔗 TaskLink: https://trello.com/c/yrLs3Y5b

    📅 Date Run in sbs-fantasy-dev: CANNOT BE RUN IN DEV.  not enough cards

    📅 Date Run in sbs-fantasy-prod:

========================
DESCRIPTION END */

//🗃️ STEP 2: Add needed Dependencies

const SCRIPT_NAME = 'Add Promo League'; //required

//Packages

//services
const db = require('../../services/db');
const utils = require('../../services/utils');
const sbs = require('../../services/sbs');


//🚀 STEP 3: Write the script.  Include tests for validation where possible
const addPromoLeague = async (leagueId) => {
    
    const league = {
        "_isActive": true,
        "_prettyId": "Week 1 Promo League",
        "_status": "published",
        "_templateName": "Week 1 Promo League",
        "duration": {
            "start": "2022-09-08T04:00:00.000Z",
            "end": "2022-09-14T04:00:00.000Z"
        },
        "entry": {
            "levels": [
                "Pro",
                "Hall of Fame",
                "Spoiled Pro",
                "Spoiled Hall of Fame"
            ],
            "fee": 0,
            "coin": "$APE",
            "isEntryFee": false,
            "royaltyPercentage": 0
        },
        "game": {
            "allowList": [],
            "communityList": [],
            "isPlayoff": false,
            "isRegenerating": false,
            "isCommunityGated": false,
            "isAllowList": true,
            "description": "Promo League",
            "maxPlayers": 69,
            "minPlayers": 69,
            "currentPlayers": 69,
            "type": "highest",
            "regenerationBatchSize": 0
        },
        "id": "PROMO-2022-REG-01",
        "metadata": {
            "createdAt": "2022-09-01T22:52:13.369Z",
            "creatorAddress": "0x212ced80749a72154c2cb00cb36129bba032fa49",
            "updatedAt": "2022-09-01T22:52:13.369Z"
        },
        "prize": {
            "coin": {
                "isCoinPrize": false,
                "numPlacesPaid": 0,
                "placesPaid": [],
                "pot": 0
            }
        },
        "useCustomLeagueName": true
    }

    await db.createOrUpdateDocument('leagues', leagueId, league, true);
    console.log(`...🐒   ${leagueId} Created`);

};

const addPlayersToPromoLeague = async (leagueId) => {
    const gameWeek = sbs.getNFLWeekV2();
    const league = await db.readDocument('leagues', leagueId);
    const now = db._getTimeStamp();

    for (let i = 0; i < 250; i++) {
        const cardId = [i].toString();
        const card = await db.readDocument('cards', cardId);
        card.isLocked = false;
        card.joinedAt = now;
        card.updatedAt = now;
        card.score = 0;
        const defaultLineup = utils.getDefaultLineup(card);
        await db.createOrUpdateDocument(`leagues/${leagueId}/cards`, cardId, card, true);

        const ownerId = card._ownerId;
        const owner = await db.readDocument('owners', ownerId);

        const promoLeague = {
            cardId,
            leagueId,
        }
        owner.Leagues.push(promoLeague)
        await db.createOrUpdateDocument(`owners`, ownerId, owner, true);
        console.log(`...➕   card:${cardId} added to the test league`);
        try {
            await utils.setDefaultLineupInLeague(defaultLineup, leagueId, gameWeek);
        } catch (error) {
            console.log(error)
            continue
        }
    }
};

(async () => {
    console.log(`...📝   START:${SCRIPT_NAME}`);
    const leagueId = 'Weekly(Sun Dec 18 2022 - Sun Dec 25 2022)|Special Prize|See details|3'
    //await addPromoLeague(leagueId);
    await addPlayersToPromoLeague(leagueId);
    console.log(`...📝   END:${SCRIPT_NAME}`);
    process.exit(0);
})();
