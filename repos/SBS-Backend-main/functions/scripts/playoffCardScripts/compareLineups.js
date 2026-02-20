const db = require('../../services/db');

const getDefaultLineup = (card) => {
    const starting = {
        QB: [card.rosterWithTeams.QB[0]],
        RB: [card.rosterWithTeams.RB[0], card.rosterWithTeams.RB[1]],
        WR: [card.rosterWithTeams.WR[0], card.rosterWithTeams.WR[1], card.rosterWithTeams.WR[2]],
        TE: [card.rosterWithTeams.TE[0]],
        DST: [card.rosterWithTeams.DST[0]],
    };
    const bench = {
        QB: [card.rosterWithTeams.QB[1]],
        RB: [card.rosterWithTeams.RB[2], card.rosterWithTeams.RB[3]],
        WR: [card.rosterWithTeams.WR[3], card.rosterWithTeams.WR[4]],
        TE: [card.rosterWithTeams.TE[1]],
        DST: [card.rosterWithTeams.DST[1]],
    }
    const lineup = {
        starting: starting,
        bench: bench
    }
    return lineup
}

const checkIfLineupsAreEqual = (pfsLineup, pstLineup) => {
    let isEqual = true;
    if(pfsLineup.starting.QB[0] != pstLineup.starting.QB[0]) {
        isEqual = false;
    } else if (pfsLineup.starting.RB[0] != pstLineup.starting.RB[0]) {
        isEqual = false;
    } else if (pfsLineup.starting.RB[1] != pstLineup.starting.RB[1]) {
        isEqual = false;
    } else if (pfsLineup.starting.TE[0] != pstLineup.starting.TE[0]) {
        isEqual = false;
    } else if (pfsLineup.starting.WR[0] != pstLineup.starting.WR[0]) {
        isEqual = false;
    } else if (pfsLineup.starting.WR[1] != pstLineup.starting.WR[1]) {
        isEqual = false;
    } else if (pfsLineup.starting.WR[2] != pstLineup.starting.WR[2]) {
        isEqual = false;
    } else if (pfsLineup.starting.DST[0] != pstLineup.starting.DST[0]) {
        isEqual = false;
    }

    return isEqual;
}

const checkLineupsInParts = async (min, max) => {
    const gameweek = '2022-PST-01';
    const oldGameweek = '2022-PFS-01';
    const changesMade = [];
    const cardsWithNoLineups = [];
    console.log(`checking lineups from ${min} to ${max}`)
    for(let i = min; i < max; i++) {
        const cardId = `${i}`;
        const card = await db.readDocument('playoffCards', cardId);
        const defaultLineup = getDefaultLineup(card);
        
        const oldLineup = await db.readDocument(`leagues/genesis-playoff-league/cards/${cardId}/lineups`, oldGameweek);
        const newLineup = await db.readDocument(`leagues/genesis-playoff-league/cards/${cardId}/lineups`, gameweek);
        if(!oldLineup && !newLineup) {
            cardsWithNoLineups.push(cardId);
            continue;
        }
        if(!oldLineup && newLineup) {
            continue;
        }
        const areEqual = checkIfLineupsAreEqual(oldLineup, newLineup);
        if(areEqual == true) {
            continue;
        } else {
            const isOldDefault = checkIfLineupsAreEqual(oldLineup, defaultLineup);
            const isNewDefault = checkIfLineupsAreEqual(newLineup, defaultLineup);
            if(isNewDefault && isOldDefault) {
                continue;
            } else if (isNewDefault && !isOldDefault) {
                oldLineup.gameWeek = gameweek;
                await db.createOrUpdateDocument(`leagues/genesis-playoff-league/cards/${cardId}/lineups`, gameweek, oldLineup, false);
                console.log(`Updated lineup for card ${cardId} because we found a default new lineup and set old lineup`)
                changesMade.push(cardId)
            } else if (!isNewDefault && isOldDefault) {
                continue;
            }
        }
    }
}

(async () => {
    //await checkLineupsInParts(0, 2000)
    //await checkLineupsInParts(2000, 4000)
    //await checkLineupsInParts(4000, 6000)
    //await checkLineupsInParts(6000, 8000)
    //await checkLineupsInParts(8000, 10000)
    //await checkLineupsInParts(10000, 11000)
    await checkLineupsInParts(11000, 11700)
})()

