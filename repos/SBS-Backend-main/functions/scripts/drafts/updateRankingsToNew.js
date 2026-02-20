const db = require('../../services/db');
const seasonInfo = require("../../constants/season")

let newRankingsTeams = ['CIN-WR1', 'PHI-RB1', 'MIN-WR1', 'ATL-RB1', 'DAL-WR1', 'DET-RB1', 'LAR-WR1', 'LV-RB1', 'NYG-WR1', 'DET-WR1', 'HOU-WR1', 'JAX-WR1', 'SF-RB1', 'BAL-RB1', 'LV-TE', 'ATL-WR1', 'PHI-WR1', 'MIA-RB1', 'LAC-WR1', 'IND-RB1', 'TB-RB1', 'ARI-TE', 'GB-RB1', 'NYJ-WR1', 'ARI-WR1', 'MIA-WR1', 'WAS-WR1', 'SEA-WR1', 'KC-WR1', 'CIN-RB1', 'LAR-RB1', 'BUF-QB', 'TB-WR1', 'BAL-QB', 'NYJ-RB1', 'CAR-WR1', 'CHI-WR1', 'BUF-RB1', 'WAS-QB', 'LAC-RB1', 'DEN-WR1', 'PIT-WR1', 'BAL-WR1', 'PHI-QB', 'HOU-RB1', 'SF-TE', 'CIN-QB', 'TEN-WR1', 'DEN-RB1', 'CAR-RB1', 'SEA-RB1', 'NO-RB1', 'NE-RB1', 'NO-WR1', 'SF-WR1', 'CLE-WR1', 'ARI-RB1', 'DET-TE', 'CLE-RB1', 'LV-WR1', 'GB-WR1', 'PIT-RB1', 'NE-WR1', 'TEN-RB1', 'BUF-WR1', 'CHI-RB1', 'KC-QB', 'MIN-RB1', 'MIN-TE', 'WAS-RB1', 'TB-QB', 'KC-RB1', 'IND-WR1', 'ARI-QB', 'MIA-TE', 'CHI-QB', 'NYG-RB1', 'DEN-QB', 'KC-TE', 'NYJ-QB', 'BAL-TE', 'SF-QB', 'DEN-TE', 'DET-QB', 'CHI-TE', 'JAX-RB1', 'DAL-QB', 'DAL-RB1', 'LAC-QB', 'NE-QB', 'IND-TE', 'GB-QB', 'CLE-TE', 'HOU-QB', 'MIN-QB', 'CIN-WR2', 'DET-RB2', 'LAR-WR2', 'KC-WR2', 'JAX-WR2', 'PHI-WR2', 'DET-WR2', 'GB-TE', 'BUF-TE', 'DEN-DST', 'PHI-DST', 'PIT-DST', 'BAL-DST', 'MIN-DST', 'KC-DST', 'DAL-WR2', 'MIA-WR2', 'MIN-WR2', 'CHI-WR2', 'TB-WR2', 'WAS-WR2', 'SF-WR2', 'GB-WR2', 'SEA-WR2', 'ATL-WR2', 'BAL-WR2', 'DEN-WR2', 'HOU-WR2', 'LAC-WR2', 'IND-WR2', 'BUF-WR2', 'NO-WR2', 'NE-WR2', 'LV-WR2', 'NYG-RB2', 'PIT-RB2', 'LAC-RB2', 'SEA-RB2', 'MIN-RB2', 'NE-RB2', 'DAL-RB2', 'TEN-RB2', 'JAX-RB2', 'HOU-DST', 'DET-DST', 'BUF-DST', 'NYJ-DST', 'LAR-DST', 'LAC-DST', 'SEA-DST', 'SF-DST', 'GB-DST', 'CLE-DST', 'DAL-DST', 'TB-DST', 'CHI-DST', 'NYG-DST', 'NE-DST', 'ARI-DST', 'MIA-DST', 'WAS-DST', 'ATL-DST', 'IND-DST', 'JAX-QB', 'DAL-TE', 'ARI-RB2', 'PHI-TE', 'SF-RB2', 'TB-RB2', 'ATL-TE', 'ATL-QB', 'BUF-RB2', 'ATL-RB2', 'MIA-QB', 'CLE-WR2', 'JAX-TE', 'WAS-RB2', 'CAR-WR2', 'TEN-QB', 'CAR-QB', 'NYJ-RB2', 'LAR-QB', 'NYG-WR2', 'WAS-TE', 'PIT-TE', 'LV-QB', 'SEA-QB', 'CAR-RB2', 'CHI-RB2', 'NE-TE', 'CIN-TE', 'IND-QB', 'ARI-WR2', 'NYJ-TE', 'TB-TE', 'CLE-RB2', 'MIA-RB2', 'NO-RB2', 'IND-RB2', 'PHI-RB2', 'HOU-TE', 'BAL-RB2', 'GB-RB2', 'LAR-RB2', 'TEN-WR2', 'TEN-TE', 'PIT-WR2', 'HOU-RB2', 'CAR-TE', 'NYG-QB', 'NO-QB', 'KC-RB2', 'LAR-TE', 'NO-TE', 'NYG-TE', 'SEA-TE', 'DEN-RB2', 'CIN-RB2', 'LAC-TE', 'CLE-QB', 'LV-RB2', 'NYJ-WR2', 'PIT-QB', 'CIN-DST', 'NO-DST', 'JAX-DST', 'LV-DST', 'CAR-DST', 'TEN-DST'];

const THIS_YEAR = `playerStats${seasonInfo.SEASON}`;
const LAST_YEAR = `playerStats${seasonInfo.LAST_SEASON}`;

/**
 * NOTE: Make sure that QB and TE DO NOT include a number. Should be PHI-QB. NOT PHI-QB1
 */


(async () => {
    let oldRankings = await db.readDocument(THIS_YEAR, "rankings");

    if (!oldRankings) {
        oldRankings = await db.readDocument(LAST_YEAR, "rankings");
    }

    if (!oldRankings) {
        throw Error("Cant get this or last years rankings")
    }

    const playerMap = await db.readDocument(THIS_YEAR, "playerMap")

    const oldData = oldRankings.ranking;
    for(let i = 0; i < oldData.length; i++) {
        oldData[i].playerId = newRankingsTeams[i]

        playerMap.Players[newRankingsTeams[i]].ADP = i + 1
    }
    oldRankings.ranking = oldData;

    await db.createOrUpdateDocument(THIS_YEAR, 'rankings', oldRankings, false)
    await db.createOrUpdateDocument(THIS_YEAR, "playerMap", playerMap, false)
})()