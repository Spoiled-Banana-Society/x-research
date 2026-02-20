//✍️ STEP: 1  FILL OUT THE SCRIPT TEMPLATE BELOW

/* DESCRIPTION START:
========================

    📝 General Description:

    Add a Genesis league that all cards will be a part of. 

    👣 Deployment Steps: node addGenesisLeague.js

    🔗 TaskLink: https://trello.com/c/UjIfOoWJ

    📅 Date Run in sbs-fantasy-dev: 8/29/2022

    📅 Date Run in sbs-fantasy-prod:

========================
DESCRIPTION END */

//🗃️ STEP 2: Add needed Dependencies

const SCRIPT_NAME = 'Add Genesis League'; //required

//services
const db = require('../../services/db');
const utils = require('../../services/utils');
const sbs = require('../../services/sbs');

//🚀 STEP 3: Write the script.  Include tests for validation where possible
const createGenesisLeague = async () => {
    const leagueId = 'genesis';
    const genesisLeague = {
    _isActive: true,
    _prettyId: "Genesis League",
    _status: "published",
    _templateName: "Genesis League",
    duration: {
        start: "2022-09-08T04:00:00.000Z",
        end: "2023-01-09T04:00:00.000Z"
    },
    entry: {
        royaltyPercentage: 0,
        fee: 0,
        isEntryFee: false,
        coin: "$APE",
        levels: [
            "Pro",
            "Hall of Fame",
            "Spoiled Pro",
            "Spoiled Hall of Fame"
        ]
    },
    game: {
        isRegenerating: false,
        regenerationBatchSize: 0,
        maxPlayers: 10_000,
        description: "General league description",
        allowList: [],
        currentPlayers: 10_000,
        communityList: [],
        isCommunityGated: false,
        isAllowList: false,
        type: "highest",
        isPlayoff: false,
        minPlayers: 10_000
    },
    id: "genesis",
    metadata: {
        createdAt: db._getTimeStamp(),
        updatedAt: db._getTimeStamp(),
        creatorAddress: "0x212ced80749a72154c2cb00cb36129bba032fa49"
    },
    prize: { //TODO: Input the actual eth prizes here at the genesis league level
        coin: {
            placesPaid: [],
            numPlacesPaid: 0,
            pot: 0,
            isCoinPrize: false
        }
    }
    };

    
    await db.createOrUpdateDocument('leagues', leagueId, genesisLeague, true);
    console.log('...🐒   Genesis League Created')
}

const addCardsToGenesisLeague = async () => {
    const gameWeek = sbs.getNFLWeekV2();
    const leagueId = 'genesis';
    const league = await db.readDocument('leagues', leagueId);
    const now = db._getTimeStamp();
    for(let i = 0; i < 10_000; i++){
        const cardId = `${i}`;
        const card = await db.readDocument('cards', cardId);
        card.isLocked = false;
        card.joinedAt = now;
        card.updatedAt = now;
        card.score = 0; 
        const defaultLineup = utils.getDefaultLineup(card);
        await db.createOrUpdateDocument(`leagues/${leagueId}/cards`, cardId, card, true); //TODO: create a league trigger that on create will set the lineup, edit join to not have to lift this.
        console.log(`...➕   card:${cardId} added to the genesis league`);
        await utils.setDefaultLineupInLeague(defaultLineup, league, gameWeek);
    }
};

(async () => {
    console.log(`...📝   START:${SCRIPT_NAME}`);
    await createGenesisLeague();
    await addCardsToGenesisLeague();
    console.log(`...📝   END:${SCRIPT_NAME}`);
    process.exit(0);
})();
