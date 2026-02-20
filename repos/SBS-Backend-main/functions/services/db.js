/*🚀 uncomment to deploy:Start */
// const admin = require("firebase-admin")
// const { FieldValue } = require("firebase-admin/firestore")
// admin.initializeApp()
// const db = admin.firestore()
// db.settings({ ignoreUndefinedProperties: true })
// require("firebase-functions/lib/logger/compat")
/*🚀 uncomment to deploy:End */

/*💻 uncomment to run locally:Start */
const {initializeApp, cert} = require('firebase-admin/app');
const {getFirestore, FieldValue} = require('firebase-admin/firestore');
const {getStorage} = require('firebase-admin/storage');
const envService = require('./env');
const ENVIRONMENT = envService.get('NODE_ENV');
let serviceAccount = (ENVIRONMENT === 'prod')  ? envService.get('SERVICE_ACOUNT') : require('../configs/sbs-test-env-config.json')
console.log(serviceAccount)
// const serviceAccount = {
//   "type": "service_account",
//   "project_id": "sbs-test-env",
//   "private_key_id": "f157cdcccbb9927d1c07febd9c8420c0a7d6c597",
//   "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvwIBADANBgkqhkiG9w0BAQEFAASCBKkwggSlAgEAAoIBAQClFaLkG74YzVOW\nA2WtX7kirYaEl3wz7SKojtWb85OMEjmy/DqUV3z1HgAPj/af76zhRok89G3a22UV\n7YLHBBU+Cly7nqNIcUH6UdZ42tDSZoz2tQcRGB75Irfyv8E93ExurA9qH4d4QnXi\nj0bje/7TjJ7+gQWII/HusACAcgm4uw+aWa4CWVcxciWAatuWdnjWYCUuQlVuHIHR\nP7EBV03/7cGaqDbAnDruVSwuOBwRSEHqTgWagYkknu5D8wYeeTqnWdsr/h5Dawn4\nZIy57wH/uTfPgrnoY5iCJXJelMrD8bp0B2zoXmax1TxE1Zf4WGfv+TtEx+s9xvQd\nIhHj1AO/AgMBAAECggEAE9U9HB2PIYitdZTT5tfctKNXSV+vrsdbBhge5p0FSWs5\nHl06Jm86VnJzvGrlzMItKWVhgH63IfeAtfkyYHmHmcwB5xKAeGgO7qVdWGildNmY\nLt2By1Z0BidbJSFPdICeeB9YvL2r91E4u27OK+9OJpk60sWqZfg3jR78+HF65IP3\nEvpm7TuhxHUDlZ65DHZTBbaaEp9jPP/Hwy63s8GlZ8zlTryASInPb96DvWBOxLpn\nGU48k3LdU7/t3vqVO4KrthGhSuZqDBYoM5dzcKPk5WISL9UstbXV36HlPevJ4D5p\nIOL9o4L21+g+vbhzFCH9rTothLa24NGimtJQmtjJxQKBgQDinfcwsNn+v7gkv57m\nJJxMti61mAw/zCrJsP38rrS+n80/76vxUC+60gWjE+Rasv4mo/kzBMbeoPHOAyR8\nRFSn4iynq6567WKnqFH6Uy6MEZhZw2M3cMffVNQIb88FC4LvdjrxB5x9thjBFr4W\n0Pf+8haodhWrlGcjg8J2zOrWPQKBgQC6fT0uwoPASp6Cyfz8DisE7cJ43LxXAYTW\nUQt1U9fL83ih7xOEqV6JUo/ky9YmB+j+Ef0rGTwH5CdTkD2Ewrg2eJg+AJa/hpor\nA7EgQe9YSNgIkA29Qap3PUo7dbBeTuYbkWi2pa0KbaWJojng45UW1nM8sn+8KDpL\nx8HqKJodqwKBgQCmZ9CoFHU/N5EEiyEnZiLPwcey2R/FiSqySCF5duCKSdXx6RCd\ndoBV8vrosSax41X1Edtft1ZBDHYDDROxnIt9a/vWc57/7WjQLC1mX8aCXDk/UNZ+\nU3axbBz2xQODdNyE8pB9hVVIinrK7uRO5Mv2jdZNhciL4cGKtqoJipe3EQKBgQCw\nczlFmgRBGBlc1LNK5jjsA+7CntCRXj2K7snxrG/9aJPWXDhSiFKLihPePsOT3l4k\nr26krc6wBL71AQBEMl1MJNSfrbz04O3UDz0zsU8+cEX/7BUj4hLhmZs4IUXMJcjx\ngqbaUm4k9NPxIw6ya4MwRZ5patcTd9iYxRwEa4BO2wKBgQCOI3qlasDPuA8e1wVa\n657D9HcZAC5pAN6JbZF9ta8mWYgvug3LFGcpQCynY3nqIbXRTJCqF9T7xtKLgRwL\n2NYoJqWZa/4PeThOqwpFlo/fG4MxTUbBbyo3sV1iogkDlezNxUVHUQE5xc+WiCvy\nnQQF3amWYkbH7s0rkjVpqXH1DQ==\n-----END PRIVATE KEY-----\n",
//   "client_email": "firebase-adminsdk-p3t3t@sbs-test-env.iam.gserviceaccount.com",
//   "client_id": "114099181158315908122",
//   "auth_uri": "https://accounts.google.com/o/oauth2/auth",
//   "token_uri": "https://oauth2.googleapis.com/token",
//   "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
//   "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-p3t3t%40sbs-test-env.iam.gserviceaccount.com",
//   "universe_domain": "googleapis.com"
// }
console.log(`...🔌   Connected to 'DB' for project_id: ${serviceAccount.project_id}`);
  

initializeApp({
  credential: cert(serviceAccount),
});

const db = getFirestore();
db.settings({ ignoreUndefinedProperties: true });

const storage = getStorage();
require("firebase-functions/lib/logger/compat");
/*💻 uncomment to run locally:End */

//SERVICES
const cardContract = require("./cardContract")

const internals = {}

//helper utils
internals._sortObject = (o) => {
    var sorted = {},
        key,
        a = []

    for (key in o) {
        if (o.hasOwnProperty(key)) {
            a.push(key)
        }
    }

    a.sort()

    for (key = 0; key < a.length; key++) {
        sorted[a[key]] = o[a[key]]
    }
    return sorted
}

internals._getNFLWeekStr = async (year, season, week) => `${year}-${season}-week-${week}`

internals._getTimeStamp = () => new Date().toISOString()

//main db utils
internals._returnDocuments = async (snapshot) => {
    let data = []

    if (snapshot.doc) return internals._returnDocument(snapshot.doc)
    snapshot.forEach((doc) => data.push(internals._sortObject(doc.data())))
    return data.length > 0 ? data : null
}

internals._returnDocumentIds = async (snapshot) => {
    let data = []
    if (snapshot.doc) return snapshot.doc.id
    snapshot.forEach((doc) => data.push(doc.id))
    return data.length > 0 ? data : null
}

internals._db = db

internals._returnDocument = async (doc) => (doc.data() ? internals._sortObject(doc.data()) : null)

internals.createOrUpdateDocument = async (collectionPath, document, data, merge = true) => await db.collection(collectionPath).doc(document).set(internals._sortObject(data), { merge })

internals.readDocument = async (collectionPath, document, includeSubCollections = false) => {
    let d = await db.collection(collectionPath).doc(document).get()

    return internals._returnDocument(d)
}

internals.readAllDocuments = async (collectionPath) => internals._returnDocuments(await db.collection(collectionPath).get())

internals.readAllDocumentIds = async (collectionPath) => (await db.collection(collectionPath).listDocuments()).map((doc) => doc.id)

internals.deleteDocument = async (collectionPath, document) => await db.collection(collectionPath).doc(document).delete()

internals.incrementCredit = async (ownerId, amount) => {
    const ownersRef = db.collection("owners").doc(ownerId)
    await ownersRef.update({ availableCredit: FieldValue.increment(amount) })
}

internals.updateOwnersLeagues = async (ownerId, leagueId) => {
    const owner = await db.collection("owners").doc(ownerId).get()
    const ownerLeagues = owner.data().Leagues
    const leagues = ownerLeagues.filter((league) => league.LeagueId !== leagueId)
    await internals.createOrUpdateDocument("owners", ownerId, { leagues })
}

internals.getDocumentSubcollections = async (document) => {
    const subCollections = await db.doc(document).listCollections()
    const subCollectionIds = subCollections.map((col) => col.id)
    return { subCollections, subCollectionIds }
}

internals.getTeamsByWalletId = async (walletId) => internals._returnDocuments(await db.collection("cards").where("_ownerWalletId", "==", walletId).get())

internals.updateDocument = async (collectionName, documentName, data) => await db.collection(collectionName).doc(documentName).update(data, { merge: true })

internals.deleteDocumentWithChildren = async (collectionName, documentName) => await db.recursiveDelete(collectionName, documentName)

internals.recursiveDelete = async (collectionPath, documentPath) => {
    const ref = db.collection(collectionPath).doc(documentPath)
    const bulkWriter = db.bulkWriter() //using bulkwriter defaults here.
    await db.recursiveDelete(ref, bulkWriter)
}

internals.numHallOfFameCards = async () => internals._returnDocumentIds(await db.collection("cards").where("level", "==", "Hall of Fame").get())

internals.validateUniquenessByTeamHash = async (cardHash) => internals._returnDocuments(await db.collection("cards").where("_teamHash", "==", cardHash).get())

internals.validateUniquenessByPlayoffTeamHash = async (cardHash) => internals._returnDocuments(await db.collection("playoffCards").where("_teamHash", "==", cardHash).get())

internals.cardsByOwnerId = async (ownerId) => internals._returnDocuments(await db.collection("cards").where("_ownerId", "==", ownerId).get())

internals.flushCollection = async (path) => {
    let batch = db.batch()

    await db
        .collection(path)
        .listDocuments()
        .then(async (val) => {
            val.map((val) => {
                batch.delete(val)
            })

            await batch.commit()
        })
}

//hacks
internals.getLeaderboard = async (type, level, year, season, week, offset, pageSize, sort, numTokens) => {
    const nflWeekStr = await internals._getNFLWeekStr(year, season, week)
    let data = []
    let orderBy
    let ref
    let snapshot

    if (sort === "middle" && level != "hof") {
        offset = +Math.round(parseInt(numTokens) / 2 + 38)
        sort = "desc"
    } else {
        sort = sort === "top" ? "desc" : "asc"
    }

    //season leaderboard all
    if (type === "season" && level === "all") {
        orderBy = `${nflWeekStr}-seasonPts`

        ref = db.collection("cards").orderBy(orderBy, sort).limit(pageSize).offset(offset)
    }

    //season leaderboard Hall of Fame
    if (type === "season" && level != "all") {
        orderBy = `${nflWeekStr}-seasonPts`

        ref = db.collection("cards").where("level", "==", level).orderBy(orderBy, sort).limit(pageSize).offset(offset)
    }

    //week leaderboard all
    if (type === "week" && level === "all") {
        orderBy = `${nflWeekStr}-weeklyPts`

        ref = db.collection("cards").orderBy(orderBy, sort).limit(pageSize).offset(offset)
    }

    //week leaderboard Hall of Fame
    if (type === "week" && level != "all") {
        orderBy = `${nflWeekStr}-weeklyPts`

        ref = db.collection("cards").where("level", "==", level).orderBy(orderBy, sort).limit(pageSize).offset(offset)
    }

    snapshot = await ref.get()
    snapshot.forEach((doc) => {
        data.push(internals._sortObject(doc.data()))
        //console.log(doc.id, '=>', doc.data());
    })
    //console.log('...🔥 firebase getSeasonLeaderboard');
    return data
}

internals.numWeek16Scores = async () => {
    let docIdsArr = []

    const ref = db.collection("cards").where("2021-REG-week-16-weeklyPts", ">", 0)

    const snapshot = await ref.get()
    snapshot.forEach((doc) => {
        docIdsArr.push(doc.id)
    })

    return docIdsArr
}

internals.bucketFileCount = async (bucketName) => {
    const files = await storage.bucket(bucketName).getFiles()
    return files[0].length
}

internals.getCardUrl = async (cardId) => {
    const cardMetadata = await internals.readDocument("cardMetadata", `${cardId}`)
    const fileName = cardMetadata.image.split("ipfs://")[1] + ".png"
    return `https://storage.googleapis.com/sbs-fantasy-dev-card-images/${fileName}`
}

internals.updateSBSTotalSupply = async () => {
    const total_supply = parseInt(await cardContract.numTokensMinted())
    await internals.createOrUpdateDocument("SBSTotalSupply", "main", { total_supply: total_supply }, true)
    console.log(`...⬆️   SBSTotalSupply Updated to ${total_supply}`)
}

internals.setGenesisLineups = async () => {
    const ownersRef = await db.collection("owners").get()
    const owners = []

    ownersRef.forEach((doc) => {
        owners.push(doc.id)
    })

    await Promise.all(
        owners.map(async (owner) => {
            const cardRef = await db.collection("owners").doc(owner).collection("cards").get()

            cardRef.forEach(async (cardDoc) => {
                const card = cardDoc.data()
                if (card) {
                    if (card.QB && card.RB && card.WR && card.TE && card.DST) {
                        let defaultLineup = {
                            lineups: {
                                starting: {
                                    QB: [
                                        {
                                            team: card.QB[0],
                                        },
                                    ],
                                    RB: [
                                        {
                                            team: card.RB[0],
                                        },
                                        {
                                            team: card.RB[1],
                                        },
                                    ],
                                    WR: [
                                        {
                                            team: card.WR[0],
                                        },
                                        {
                                            team: card.WR[1],
                                        },
                                        {
                                            team: card.WR[2],
                                        },
                                    ],
                                    TE: [
                                        {
                                            team: card.TE[0],
                                        },
                                    ],
                                    DST: [
                                        {
                                            team: card.DST[0],
                                        },
                                    ],
                                },
                                bench: {
                                    QB: [{ team: card.QB[1] }],
                                    RB: [
                                        {
                                            team: card.RB[2],
                                        },
                                        {
                                            team: card.RB[3],
                                        },
                                    ],
                                    WR: [
                                        {
                                            team: card.WR[3],
                                        },
                                        {
                                            team: card.WR[4],
                                        },
                                    ],
                                    TE: [
                                        {
                                            team: card.TE[1],
                                        },
                                    ],
                                    DST: [
                                        {
                                            team: card.DST[1],
                                        },
                                    ],
                                },
                            },
                        }
                        await db.collection("owners").doc(owner).collection("cards").doc(cardDoc.id).set(defaultLineup, { merge: true })
                    }
                }
            })
        })
    )
}

internals.getTokenCommunitiesByGroupId = async (groupId) => internals._returnDocuments(await db.collection("tokenCommunities").where("groupId", "==", groupId).get())

internals.getLeaderboardV2 = async (gameWeek, orderBy, level) => {
    const scoreType = orderBy === "week" ? "scoreWeek" : "scoreSeason"

    if (level.toLowerCase() === "hall of fame") {
        let results = await db.collection(`genesisLeaderboard/${gameWeek}/cards`).where("level", "==", "Hall of Fame").orderBy(scoreType, "desc").get()
        return internals._returnDocuments(results)
    }

    if (level.toLowerCase() === "spoiled hall of fame") {
        let results = await db.collection(`genesisLeaderboard/${gameWeek}/cards`).where("level", "==", "Spoiled Hall of Fame").orderBy(scoreType, "desc").get()
        return internals._returnDocuments(results)
    }

    let leaderboard = await db.collection(`genesisLeaderboard/${gameWeek}/cards`).orderBy(scoreType, "desc").get()

    if (level.toLowerCase() === "spoiled pro") {
        leaderboard = await db.collection(`genesisLeaderboard/${gameWeek}/cards`).where("level", "==", "Spoiled Pro").orderBy(scoreType, "asc").get()
    }

    return internals._returnDocuments(leaderboard)
}

internals.getPlayoffLeaderboardV2 = async (gameWeek, orderBy, level) => {
    const scoreType = orderBy.toLowerCase() === "week" ? "scoreWeek" : "scoreSeason"

    if (level.toLowerCase() === "hall of fame") {
        let results = await db.collection(`genesisPlayoffsLeaderboard/${gameWeek}/cards`).where("level", "==", "Hall of Fame").orderBy(scoreType, "desc").get()
        return internals._returnDocuments(results)
    }

    if(level.toLowerCase() === "minted") {
        let results = await db.collection(`mintedPlayoffs2022Leaderboard/${gameWeek}/cards`).orderBy(scoreType, "desc").get()
        return internals._returnDocuments(results);
    }

    let leaderboard = await db.collection(`genesisPlayoffsLeaderboard/${gameWeek}/cards`).orderBy(scoreType, "desc").get()

    return internals._returnDocuments(leaderboard)
}

internals.getChampionshipRoundLeaderboard = async (gameWeek, orderBy, level) => {
    const scoreType = orderBy === "week" ? "scoreWeek" : "scoreSeason";

    if(level.toLowerCase() == "hall of fame") {
        let results = await db.collection(`hofChampionshipRoundLeaderboard/${gameWeek}/cards`).orderBy(scoreType, "desc").get();
        return internals._returnDocuments(results)
    }

    if(level.toLowerCase() == "spoiled") {
        let results = await db.collection(`spoiledChampionshipRoundLeaderboard/${gameWeek}/cards`).orderBy(scoreType, "desc").get();
        return internals._returnDocuments(results)
    }
    if(level.toLowerCase() == "bottom") {
        let results = await db.collection(`bottomChampionshipRoundLeaderboard/${gameWeek}/cards`).orderBy(scoreType, "asc").get();
        return internals._returnDocuments(results)
    }

    let results = await db.collection(`proChampionshipRoundLeaderboard/${gameWeek}/cards`).orderBy(scoreType, "desc").get();
    return internals._returnDocuments(results)

}

internals.getGenesisWinnings = async (gameWeek, boardType) => {
    let results = await db.collection(`genesisWinnings/${gameWeek}/${boardType}`).orderBy("rank").get()
    return internals._returnDocuments(results)
}

internals.getGenesisPrizeWinners = async (gameWeek, boardType) => {
    let results = await db.collection(`genesisWinnings/${gameWeek}/${boardType}`).where("prize", "!=", null).get()
    return internals._returnDocuments(results)
}

internals.getAllPrizeWinners = async () => {
  const results = await db.collection('cards').where('prizes.eth', '!=', null).get();
  return internals._returnDocuments(results);
}

module.exports = internals;
