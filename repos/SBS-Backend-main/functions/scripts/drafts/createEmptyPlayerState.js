const dbLookups = require('../../utils/dbLookups');
const db = require('../../services/db');
const getPlayerDataForTeams = require("../SportsData/getPlayerInfoForTeams")
const getTeamsData = require("../SportsData/getTeamsData")

const positions = ['QB', 'RB', 'WR', 'TE', 'DST'];
const teams = ['ARI', 'ATL', 'BAL', 'BUF', 'CAR', 'CHI', 'CIN', 'CLE', 'DAL', 'DEN', 'DET', 'GB',  'HOU', 'IND', 'JAX', 'KC',  
    'LAC', 'LAR', 'LV',  'MIA', 'MIN', 'NE',  'NO',  'NYG', 'NYJ', 'PHI', 'PIT', 'SEA', 'SF',  'TB',  'TEN', 'WAS'];
const byes = {
    'ARI': 8,
    'ATL': 5,
    'BAL': 7,
    'BUF': 7,
    'CAR': 14,
    'CHI': 5,
    'CIN': 10,
    'CLE': 9,
    'DAL': 10,
    'DEN': 12,
    'DET': 8,
    'GB': 5,
    'HOU': 6,
    'IND': 11,
    'JAX': 8,
    'KC': 10,
    'LAC': 12,
    'LAR': 8,
    'LV': 8,
    'MIA': 12,
    'MIN': 6,
    'NE': 14,
    'NO': 11,
    'NYG': 14,
    'NYJ': 9,
    'PHI': 9,
    'PIT': 5,
    'SEA': 8,
    'SF': 14,
    'TB': 9,
    'TEN': 10,
    'WAS': 12
}

const makeEmptyTeamPlayers = () => {
    const s = {}
    teams.forEach(t => {
        s[t] = {}
        positions.forEach(p => {
            s[t][p] = []
        })
    })

    return s
}

/**
 * Create defaultPlayerDraftState and playerMap in playerStats<SEASON> collection.
 * 
 * Run this at the start of a new season to get the base data structs in firestore. Run after byes are available to get bye weeks and rosters.
 * NOTE: this will overwrite ADP. Do not run this script if you need to preserve ADP.
 */
const createEmptyPlayerState = async () => {
    const playerDraftState = {};
    const playerMap = {};

    // const teamPlayersLookup = await getPlayerDataForTeams.fetchAll()
    // once we have players swap these
    const teamPlayersLookup = makeEmptyTeamPlayers()
    // const teamInfoLookup = await getTeamsData.fetchAll()

    for (i = 0; i < teams.length; i++) {
        const team = teams[i];
        for (j = 0; j < positions.length; j++) {
            let position = positions[j];
            let playerId;
            if (position == 'RB' || position == 'WR') {
                playerId = `${team}-${position}1`;
                // add to defaultPlayerDraftState
                playerDraftState[playerId] = {
                    playerId: playerId,
                    displayName: `${team} ${position}1`,
                    team: team, 
                    position: position,
                    ownerAddress: "",
                    pickNum: 0,
                    round: 0,
                }
                // add to playerMap
                playerMap[playerId] = {
                    ADP: 0,
                    ByeWeek: String(byes[team]),
                    PlayerId: playerId,
                    PlayersFromTeam: teamPlayersLookup[team][position]
                }

                playerId = `${team}-${position}2`;
                // add to defaultPlayerDraftState
                playerDraftState[playerId] = {
                    playerId: playerId,
                    displayName: `${team} ${position}2`,
                    team: team, 
                    position: position,
                    ownerAddress: "",
                    pickNum: 0,
                    round: 0,
                }
                // add to playerMap
                playerMap[playerId] = {
                    ADP: 0,
                    ByeWeek: String(byes[team]),
                    PlayerId: playerId,
                    PlayersFromTeam: teamPlayersLookup[team][position]
                }
            } else {
                playerId = `${team}-${position}`;
                // add to defaultPlayerDraftState
                playerDraftState[playerId] = {
                    playerId: playerId,
                    displayName: `${team} ${position}`,
                    team: team, 
                    position: position,
                    ownerAddress: "",
                    pickNum: 0,
                    round: 0,
                }
                try {
                    // add to playerMap
                    playerMap[playerId] = {
                        ADP: 0,
                        ByeWeek: String(byes[team]),
                        PlayerId: playerId,
                        PlayersFromTeam: position === "DST" ? null : teamPlayersLookup[team][position]
                    }
                } catch (e) {
                    console.log(team)
                    console.log(position)
                    console.log(teamPlayersLookup[team])
                    throw Error(e)
                }
                
            }


        }
    }

    await db.createOrUpdateDocument(dbLookups.getPlayerStatsBase(), 'defaultPlayerDraftState', playerDraftState, false)

    // nest playerMap under Players (just how it is)
    await db.createOrUpdateDocument(dbLookups.getPlayerStatsBase(), 'playerMap', {Players: playerMap}, false)
}

(async () => {
    await createEmptyPlayerState()
})()



