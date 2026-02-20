const db = require('../../services/db');
const utils = require("../../services/utils");
const sbs = require("../../services/sbs");


const tenUsersArray = ["0x27fE00A5a1212e9294b641BA860a383783016C67", "0x2e64Db49fc597a731091471607F6CD0251d7EAFb", "0xc0A871A275C4262021235Ae88E79ffD2556dCB8E", "0x6fbc575c7471482c792fe3658130d93aa8b9fdaf", "0x85fe0fa6d8531a6d730dddc416ad6ae8a910b6db", "0x39f65373dbca28dec9333592f2845c8383f1b83c", "0x9bd4859eda84cfad51db01b59d711d84a40c18bd", "0x465092bbe4ca9675c1cf9c7bf2620b2eefc77e25", "0x4bba1a63817f1388c8ad625c29f04fd92eea4e33", "0x555417d2fbe7c838cac1f892bdbaeef0a3d1fb91", "0x1594f8a18b21e0d29a387b91fa7b039f089fd29c"];

const fillDraftLeague = async (startingTokenId) => {
    let tokenId = startingTokenId
    for(let i = 0; i < tenUsersArray.length; i++) {
        const user = tenUsersArray[i % 10].toLowerCase();
        const response = await fetch(`https://sbs-drafts-api-ajuy5qy3wa-uc.a.run.app/owner/${user}/draftToken/mint`, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: `{
                "minId": ${tokenId},
                "maxId": ${tokenId},
                "promoCode": ""
            }`
        }); 
        if(!response.ok) {
            return response.body
        }

        const res = await fetch(`https://sbs-drafts-api-ajuy5qy3wa-uc.a.run.app/league/fast/owner/${user}`, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: `{
                "numLeaguesToJoin": 1
            }`
        })
        if(!res.ok) {
            return res.body
        }

        console.log("did shit for ", user)
        tokenId++
        await utils.sleep(1000)
    }
    return "everything worked"
}

const deleteDraftLeagueAndCleanUp = async (leagueId) => {
    const league = await db.readDocument('drafts', leagueId)
    const currentUsers = league.CurrentUsers;

    
    for(let i = 0; i < currentUsers.length; i++) {
        const ownerId = currentUsers[i].OwnerId;
        const tokenId = currentUsers[i].TokenId;

        // delete token from draftTokens
        await db.deleteDocument('draftTokens', tokenId)

        //delete token from owners
        await db.deleteDocument(`owners/${ownerId}/usedDraftTokens`, tokenId)

        // delete token from league
        await db.deleteDocument(`drafts/${leagueId}/cards`, tokenId)

        console.log(`Deleted Card ${tokenId} in all 3 locations`)
    }

    // delete state

    await db.deleteDocument(`drafts/${leagueId}/state`, 'info');
    await db.deleteDocument(`drafts/${leagueId}/state`, 'connectionList')
    await db.deleteDocument(`drafts/${leagueId}/state`, 'rosters')
    await db.deleteDocument(`drafts/${leagueId}/state`, 'summary')
    await db.deleteDocument(`drafts/${leagueId}/state`, 'playerState')

    await db.deleteDocument('drafts', leagueId)

}


(async () => {
    let res = await fillDraftLeague(7080)
    // for(let i = 3009; i < 3018; i++) {
    //     const leagueId = `live-draft-${i}`;
    //     //await deleteDraftLeagueAndCleanUp(leagueId)
    //     const cardIds = await db.readAllDocumentIds(`drafts/${leagueId}/cards`)
    //     for(let j = 0; j < cardIds.length; j++) {
    //         const cardId = cardIds[j];
    //         await db.deleteDocument(`drafts/${leagueId}/cards`, cardId)
    //         await db.deleteDocument('draftTokens', cardId)
    //     }
    // }
    //await deleteDraftLeagueAndCleanUp('live-draft-3002')
    console.log(res)
})()


