const { INGRESS_SETTINGS_OPTIONS } = require('firebase-functions/v1');
const api = require('../../services/api');
const db = require('../../services/db');
const utils = require('../../services/utils');

// (async () => {
//     const randomNums = [];
//     for(let i = 0; i < 100; i++) {
//         let max;
//         let min;
//         if (i < 20) {
//             min = 0;
//             max = 500;
//         } else if (i >= 20 && i < 40) {
//             min = 500;
//             max = 1000;
//         } else if (i >= 40 && i < 60) {
//             min = 1000;
//             max = 1500;
//         } else if (i >= 60 && i < 80) {
//             min = 1500;
//             max = 2000;
//         } else if (i >= 80) {
//             min = 2000;
//             max = 2500;
//         }
//         let notUnique = true;
//         let num = Math.floor(Math.random() * (max - min) + min)
//         while(notUnique) {
//             if(randomNums.includes(`${num}`)) {
//                 num = Math.floor(Math.random() * (max - min) + min)
//             } else {
//                 notUnique = false;
//             }
//         }
//         randomNums.push(`${num}`);
//     }
    
//     for(let i = 0; i < randomNums.length; i++) {
//         const cardId = randomNums[i];
//         console.log(cardId)
//         const card = await db.readDocument('playoffCards', cardId);
//         card._level = 'Hall Of Fame';
//         const metadata = await utils.convertPlayoffCardToCardMetadata(card)
//         await db.createOrUpdateDocument('playoffCards', cardId, card, false)
//         await db.createOrUpdateDocument('playoffCardMetadata', cardId, metadata, false)

//     }
// })()

(async () => {
    const hofCards = [];
    const hallOfFameIds = [];
    let numOfHOF = 0;
    for(let i = 0; i < 50; i++) {
        const index = Math.floor(Math.random() * (9999 - 0) + 0);
        hallOfFameIds.push(`${index}`);
    }
    for(let i = 0; i < 50; i++) {
        const index = Math.floor(Math.random() * (14999 - 10000) + 10000);
        hallOfFameIds.push(`${index}`)
    }
    for(let i = 0; i < 15000; i++) {
        const cardId = `${i}`;
        console.log(cardId)
        const card = await db.readDocument('playoffCards', cardId);
        if(hallOfFameIds.includes(cardId)) {
            card._level = 'Hall of Fame';
            console.log('set level to hall of fame')
        }
        if(card._level.toLowerCase() == 'hall of fame') {
            hofCards.push(cardId);
            console.log(cardId)
        }
        
        if(card._level.toLowerCase() == 'hall of fame') {
            const newCard = await api.getPlayoffCardImage(card);
            const metadata = await utils.convertPlayoffCardToCardMetadata(newCard);
            await db.createOrUpdateDocument('playoffCards', cardId, newCard, true)
            await db.createOrUpdateDocument('playoffCardMetadata', cardId, metadata, true)
            console.log(`updated image and set card ${cardId} to Hall of Fame`);
            numOfHOF++;
            console.log(`Created ${numOfHOF}/100 HOF cards`)
        }
        
    }

    console.log(hofCards)
})();

// (async () => {
//     const hallOfFameIds = [];
//     for(let i = 0; i < 50; i++) {
//         const index = Math.floor(Math.random() * (9999 - 0) + 0);
//         hallOfFameIds.push(`${index}`);
//     }
//     for(let i = 0; i < 50; i++) {
//         const index = Math.floor(Math.random() * (14999 - 10000) + 10000);
//         hallOfFameIds.push(`${index}`)
//     }

//     console.log(hallOfFameIds.length);
//     for(let i = 0; i < hallOfFameIds.length; i++) {
//         console.log(hallOfFameIds[i])
//     }
// })()