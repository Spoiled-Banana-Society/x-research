const db = require('../../services/db');
const utils = require('../../services/utils');
const sbs = require('../../services/sbs');
const scoreTriggers = require('../../services/score-triggers');

const cardsWhoTransferred = ['8929', '7326', '7751', '7857'];
// const cards = [4310, 4501, 3177, 6236, 7774, 1460, 4116, 8885, 3476, 9759, 9540, 2271, 8035, 6875, 511, 8916, 174, 8276, 8980, 8082, 652, 6573, 7065, 7777, 8840, 562, 8826, 9319, 30, 9491, 9721, 8631, 1459, 7326, 9598, 7485, 3656, 2352, 7528, 3367, 8957, 9516, 7973, 5850, 9673, 8086, 2303, 8475, 8850, 450, 7857, 3457, 2356, 4473, 2070, 8212, 6326, 3586, 6569, 8161, 7687, 7269, 7531, 5323, 5827, 1293, 8524, 6543, 9351, 7751, 4245, 6523, 2046, 8929, 2369, 4647, 129, 4153, 3960, 6266, 4531, 6894, 1901, 4709, 9186, 1694, 6518, 2111, 8239, 4936, 9860, 271, 6887, 2105, 7841, 144, 2967, 2095, 7567, 7067, 8012, 9860, 3745, 8508, 598, 6276, 259, 3705, 7647, 9013, 7603, 3586, 7687, 4153, 6930, 9117, 8924, 9930, 5268, 2346, 4485];
//const cards = [9276, 8980, 8082, 652, 6573, 7065, 7777, 8840, 562, 8826, 9319, 30, 9491, 9721, 8631, 1459, 7326, 9598, 7485, 3656, 2352, 7528, 3367, 8957, 9516, 7973, 5850, 9673, 8086, 2303, 8475, 8850, 450, 7857, 3457, 2356, 4473, 2070, 8212, 6326, 3586, 6569, 8161, 7687, 7269, 7531, 5323, 5827, 1293, 8524, 6543, 9351, 7751, 4245, 6523, 2046, 8929, 2369, 4647, 129, 4153, 3960, 6266, 4531, 6894, 1901, 4709, 9186, 1694, 6518, 2111, 8239, 4936, 9860, 271, 6887, 2105, 7841, 144, 2967, 2095, 7567, 7067, 8012, 9860, 3745, 8508, 598, 6276, 259, 3705, 7647, 9013, 7603, 3586, 7687, 4153, 6930, 9117, 8924, 9930, 5268, 2346, 4485];
const cards = [6271, 7326, 7857, 7751, 8929, 7067, 3745, 8508, 598, 6276, 259, 3705, 7647, 9013, 7603, 6930, 9117, 8924, 9930, 5268, 2346, 4485];
const needToLookAt = [ 7326, 7857, 7751, 8929, 3745]

(async () => {
    const gameweek = '2022-REG-13';
    const places = await db.readDocument('prizes', 'weekly-top');
    const hofPlaces = await db.readDocument('prizes', 'weekly-hof');
    const hofPrizes = hofPlaces.places;
    const spoiledPlaces = await db.readDocument('prizes', 'weekly-spoiled');
    const spoiledPrizes = spoiledPlaces.places;
    const prizes = places.places;
    for(let i = 0; i < cards.length; i++) {
        const cardId = `${cards[i]}`;
        console.log(cardId)
        let obj = await db.readDocument(`genesisWinnings/${gameweek}/weekAll`, cardId);
        let rank = obj.rank;
        let level = 'Pro'
        if(rank > 100) {
            obj = await db.readDocument(`genesisWinnings/${gameweek}/weekHof`, cardId);
            if(obj) {
                if(obj.rank <= 10) {
                    rank = obj.rank;
                    level = 'hof'
                }
            } else {
                obj = await db.readDocument(`genesisWinnings/${gameweek}/weekSpoiled`, cardId);
                if(obj) {
                    if(obj.rank <= 10) {
                        rank = obj.rank;
                        level = 'spoiled'
                    }
                } else {
                    console.log('We still dont have a good rank for this card')
                    continue;
                }
            }

        }
        let award= 0;
        if(level = 'Pro') {
            award = prizes[rank - 1].prize
        } else if (level = 'hof') {
            award = hofPrizes[rank - 1].prize;
        } else if (level = 'spoiled') {
            award = spoiledPrizes[rank - 1].prize;
        }
        const card = await db.readDocument('cards', cardId);
        if(card.prizes.eth >= award) {
            card.prizes.eth = card.prizes.eth - award;
            await db.createOrUpdateDocument('cards', cardId, card, false)
            console.log('Took away prizes for ' + cardId)
        } else {
            const owner = await db.readDocument('owners', card._ownerId);
            if(owner.availableEthCredit >= award) {
                owner.availableEthCredit = owner.availableEthCredit - award;
                await db.createOrUpdateDocument('owners', card._ownerId, owner, false)
            } else {
                console.log(`COULD NOT TAKE AWAY THIS MONEY FOR ${cardId}`)
            }
        }
    }
})()
