//PACKAGES
const web3 = require('web3');
const { v4: uuidv4 } = require('uuid');
const { FieldValue } = require('firebase-admin/firestore');

//SERVICES
const env = require('./env');
const db = require('./db');
const api = require('./api');
const sbs = require('./sbs');
const utils = require('./utils');

const internals = {};

internals.UpdateDraftToken = async (draftToken) => {
    if (draftToken.Roster.QB.isArray() == false) {
        return "invalid roster"
    } else if (draftToken.Roster.RB.isArray() == false) {
        return "invalid roster"
    } else if (draftToken.Roster.TE.isArray() == false) {
        return "invalid roster"
    } else if (draftToken.Roster.WR.isArray() == false) {
        return "invalid roster"
    } else if (draftToken.Roster.DST.isArray() == false) {
        return "invalid roster"
    } else if (typeof draftToken._draftType != "string") {
        return "draft type is not a string"
    } else if (typeof draftToken._cardId != "string") {
        return "draft type is not a string"
    } else if (typeof draftToken._imageUrl != "string") {
        return "draft type is not a string"
    } else if (typeof draftToken._level != "string") {
        return "draft type is not a string"
    } else if (typeof draftToken._ownerId != "string") {
        return "draft type is not a string"
    } else if (typeof draftToken._leagueId != "string") {
        return "draft type is not a string"
    } else if (typeof draftToken._rank != "string") {
        return "draft type is not a string"
    } else if (typeof draftToken._weekScore != "string") {
        return "draft type is not a string"
    } else if (typeof draftToken._seasonScore != "string") {
        return "draft type is not a string"
    }

    let res = await db.createOrUpdateDocument(`draftTokens`, draftToken._cardId, draftToken)
    res.isEqual



}


// internals.CheckDraftTokenOwnership = async () => {
//     const cardIds = await db.readAllDocumentIds('draftTokens')
//     for(let i = 0; i < cardIds.length; i++) {
//         const cardId = cardIds[i];
//         const card = await db.readDocument('')
//     }
// }