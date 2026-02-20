const dbLookups = require('../../utils/dbLookups');
const db = require('../../services/db');
// const getPlayerDataForTeams = require("../SportsData/getPlayerInfoForTeams")
const getPlayerDataForTeams = require("../RollingInsights/getPlayerInfoForTeams")
const getTeamsData = require("../SportsData/getTeamsData")

const positions = ['QB', 'RB', 'WR', 'TE', 'DST'];
const teams = ['ARI', 'ATL', 'BAL', 'BUF', 'CAR', 'CHI', 'CIN', 'CLE', 'DAL', 'DEN', 'DET', 'GB',  'HOU', 'IND', 'JAX', 'KC',  'LAC', 'LAR', 'LV',  'MIA', 'MIN', 'NE',  'NO',  'NYG', 'NYJ', 'PHI', 'PIT', 'SEA', 'SF',  'TB',  'TEN', 'WAS'];

/**
 * Create defaultPlayerDraftState and playerMap in playerStats<SEASON> collection.
 * 
 * Run this at the start of a new season to get the base data structs in firestore. Run after byes are available to get bye weeks and rosters.
 * NOTE: this will overwrite ADP. Do not run this script if you need to preserve ADP.
 */
const updatePlayersPlayerStats = async () => {
    const playerDraftState = {};
    let playerMap = await db.readDocument(dbLookups.getPlayerStatsBase(), 'playerMap');
    playerMap = playerMap.Players
    const teamPlayersLookup = await getPlayerDataForTeams.fetchAll()

    for (i = 0; i < teams.length; i++) {
        const team = teams[i];
        for (j = 0; j < positions.length; j++) {
            let position = positions[j];
            let playerId;
            if (position == 'RB' || position == 'WR') {
                playerId = `${team}-${position}1`;
                // add to playerMap
                playerMap[playerId] = {
                    ADP: playerMap[playerId].ADP,
                    ByeWeek: playerMap[playerId].ByeWeek,
                    PlayerId: playerId,
                    PlayersFromTeam: teamPlayersLookup[team][position]
                }

                playerId = `${team}-${position}2`;
                // add to playerMap
                playerMap[playerId] = {
                    ADP: playerMap[playerId].ADP,
                    ByeWeek: playerMap[playerId].ByeWeek,
                    PlayerId: playerId,
                    PlayersFromTeam: teamPlayersLookup[team][position]
                }
            } else {
                playerId = `${team}-${position}`;
                try {
                    // add to playerMap
                    playerMap[playerId] = {
                        ADP: playerMap[playerId].ADP,
                        ByeWeek: playerMap[playerId].ByeWeek,
                        PlayerId: playerId,
                        PlayersFromTeam: position === "DST" ? null : teamPlayersLookup[team][position]
                    }
                } catch(e) {
                    console.log("ERROR IN UPDATE")
                    console.log(playerId)
                    throw Error(e)
                }
            }


        }
    }

    // nest playerMap under Players (just how it is)
    await db.createOrUpdateDocument(dbLookups.getPlayerStatsBase(), 'playerMap', {Players: playerMap}, false)
}

(async () => {
    await updatePlayersPlayerStats()
})()



