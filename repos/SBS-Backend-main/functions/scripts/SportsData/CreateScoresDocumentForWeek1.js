const db = require('../../services/db');
const utils = require("../../services/utils");
const sbs = require("../../services/sbs");
const crypto = require('crypto')

const teams = ["ARI", "ATL", "BAL", "BUF", "CAR", "CHI", "CIN", "CLE", "DAL", "DEN", "DET", "GB", "HOU", "IND", "JAX", "KC", "LAC", "LAR", "MIA", "MIN", "NE", "NO", "NYG", "NYJ", "LV", "PHI", "PIT", "SEA", "SF", "TB", "TEN", "WAS"];

const createEmptyScoreDocument = async () => {
    const scoresArr = [];
    for(let i = 0; i < teams.length; i++) {
        const score = {
            DST: 0,
            QB: 0,
            RB: 0,
            RB2: 0,
            TE: 0,
            WR: 0,
            WR2: 0,
            GameStatus: "",
            Team: teams[i]
        }
        console.log(score)
        scoresArr.push(score)
    }

    let res = {
        FantasyPoints: scoresArr
    }
    console.log(res)
    await db.createOrUpdateDocument('scores', '2024REG-01', res, false)
}

(async () => {
    await createEmptyScoreDocument()
})()

// const triggersConfig = {
//     EXPO_PUBLIC_WEB3AUTH_CLIENT_ID: 'BGdh_ZlTUAI1CdnGCabpWILIoZm4jNlfvvEhDNGMFy7uiVisTcbXbYMnv8qZj98mICqQF_bOt4j2rQP47onyi9A',
//     EXPO_PUBLIC_WEB3AUTH_PROJECT_ID: 'a2f6b3e4efba7158a38f93b735e6a315',
//     EXPO_PUBLIC_FIREBASE_API_KEY: 'AIzaSyCn1rcJUC4EzNzN8F4JDfOSQc6cC3ZbzcQ',
//     EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN: 'sbs-triggers-fantasy.firebaseapp.com',
//     EXPO_PUBLIC_FIREBASE_DATABASE_URL: 'https://sbs-triggers-fantasy-default-rtdb.firebaseio.com',
//     EXPO_PUBLIC_FIREBASE_PROJECT_ID: 'sbs-triggers-fantasy',
//     EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET: 'sbs-triggers-fantasy.appspot.com',
//     EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: '991530757352',
//     EXPO_PUBLIC_FIREBASE_APP_ID: '1:991530757352:web:228050834e572cd7f2ed5d',
//     EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID: 'G-G0YYDNZNV6'
// }

// const algorithm = 'aes-256-ctr';
// const secretKey = 'sbs-secret-sbs-dkfjofijdfd';
// const secretIv = 'sbs';
// const key = crypto.createHash('sha256').update(secretKey, 'utf-8').digest('base64').substring(0, 32)
// const iv = crypto.createHash('sha256').update(secretIv, 'utf-8').digest('base64').substring(0, 16)


// const encrypt = (buffer) => {
//     // Create a new cipher using the algorithm, key, and iv
//     const cipher = crypto.createCipheriv(algorithm, key, iv);
//     // Create the new (encrypted) buffer
//     const result = cipher.update(buffer, 'utf8', 'base64') + cipher.final('base64');
//     return Buffer.from(result).toString('base64');
// }

// const decrypt = (encryptedMessage) => {
//     const buff = Buffer.from(encryptedMessage, 'base64');
//     encryptedMessage = buff.toString ('utf-8');
//     var decryptor = crypto.createDecipheriv(algorithm, key, iv);
//     return decryptor.update(encryptedMessage, 'base64', 'utf8') + decryptor.final('utf8');
//     // Create a decipher
//     // const decipher = crypto.createDecipheriv(algorithm, key, iv);
//     // // Actually decrypt it
//     // const result = Buffer.concat([decipher.update(encrypted), decipher.final()]);
//     // return result.toString();
//  };

// const testEncryption = async () => {
//     const stringifyData = JSON.stringify(triggersConfig)


//     const res = encrypt(stringifyData)
//     return res.toString()
// }

// (async () => {
//     const encryptedConfig = await testEncryption()
//     console.log(encryptedConfig)

//     const res = decrypt(encryptedConfig)
//     console.log(JSON.parse(res))

// })()