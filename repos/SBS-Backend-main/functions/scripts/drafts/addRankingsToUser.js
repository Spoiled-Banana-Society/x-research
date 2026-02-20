const db = require('../../services/db');
const utils = require("../../services/utils");
const sbs = require("../../services/sbs");

const tenUsersArray = [ "0x0aed01c695227b42a82cca49f532b8dc7e4c657d", "0x15f76bc8510b6573d4db6dbfe95eb337ac482578", "0x2478db4ff66440225a1e68f94ca9f5612e222cf7", "0x2d15c9d5887569a1d4b9759fc9cd5ff7113d012c", "0x39f65373dbca28dec9333592f2845c8383f1b83c", "0x4069378cd075bc1fd31e41317fd3b1b6aa6ec0d4", "0x465092bbe4ca9675c1cf9c7bf2620b2eefc77e25", "0x4bba1a63817f1388c8ad625c29f04fd92eea4e33", "0x555417d2fbe7c838cac1f892bdbaeef0a3d1fb91", "0x2f9c2123652cff3717fbd8edb1b256f16e9e4b80"];

const setDefaultRankings = async (address, rankings) => {
    const ownerId = address;
    try {
        await db.createOrUpdateDocument(`owners/${ownerId}/drafts`, 'rankings', rankings, false)
    } catch (err) {
        throw(err)
    }
    console.log(`added rankings to owner object for ${ownerId}`)
    return
}

(async () => {
    const rankings = await db.readDocument('playerStats2025', 'rankings')
    for (let i = 0; i < tenUsersArray.length; i++) {
        const ownerId = tenUsersArray[i];
        await setDefaultRankings(ownerId, rankings)
    }
    console.log('added rankigns to all users')
})()