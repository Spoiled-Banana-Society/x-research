const {getFirestore, FieldValue} = require('firebase-admin/firestore');
const {initializeApp, cert} = require('firebase-admin/app');
const envService = require('../../services/env');
const ENVIRONMENT = envService.get('NODE_ENV');
let serviceAccount = (ENVIRONMENT === 'prod')  ? envService.get('SERVICE_ACOUNT') : require('../../configs/sbs-test-env-config.json')
const etherscanKey = envService.get('ETHERSCAN_API_KEY');

const fetch = require('node-fetch');

const secondsCutoff = 1704092400;

const get2024w9Owners = async (db) => {
    const withdrawRequests = await db.collection('withdrawalRequests').get();
    
    const ownersThatNeedW9 = {};
    let doneIteration = false;
    
    await withdrawRequests.forEach(async (doc) => {
        const data = doc.data();
        const owner = data.ownerId;
        const amount = data.amountWithdrawn;
        const dateWithdrawn = data.timestamp._seconds;
        const coinWithdrawn = data.coinWithdrawn;
        const needsW9 = data.needsW9;

        if (dateWithdrawn < secondsCutoff || coinWithdrawn !== 'eth' || doneIteration) {
            return;
        }

        if (needsW9) {
          ownersThatNeedW9[owner] = true;
        }
    });

    Object.keys(ownersThatNeedW9).forEach(async (owner) => {
        const userDoc = await db.collection('owners').doc(owner).get();
        const userData = await userDoc.data();
        console.log(owner, userData.BlueCheckEmail);
    })
}

initializeApp({
  credential: cert(serviceAccount),
});

const db = getFirestore();
db.settings({ ignoreUndefinedProperties: true });

get2024w9Owners(db);