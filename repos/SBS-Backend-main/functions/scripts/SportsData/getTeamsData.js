const utils = require("../../services/utils");

/**
 * Use to fetch team data from Sports Data
 * 
 * @returns teamsMap
 * key: team abbreviation (BAL)
 * value: {
    "Key": "ATL",
    "TeamID": 2,
    "PlayerID": 2,
    "City": "Atlanta",
    "Name": "Falcons",
    "Conference": "NFC",
    "Division": "South",
    "FullName": "Atlanta Falcons",
    "StadiumID": 45,
    "ByeWeek": 12,
    "GlobalTeamID": 2,
    "HeadCoach": "Raheem Morris",
    "PrimaryColor": "000000",
    "SecondaryColor": "A71930",
    "TertiaryColor": "A5ACAF",
    "QuaternaryColor": "FFFFFF",
    "WikipediaLogoURL": "https:\/\/upload.wikimedia.org\/wikipedia\/en\/c\/c5\/Atlanta_Falcons_logo.svg",
    "WikipediaWordMarkURL": "https:\/\/upload.wikimedia.org\/wikipedia\/commons\/e\/ec\/Atlanta_Falcons_wordmark.svg",
    "OffensiveCoordinator": "Zac Robinson",
    "DefensiveCoordinator": "Jimmy Lake",
    "SpecialTeamsCoach": "Marquice Williams",
    "OffensiveScheme": "3WR",
    "DefensiveScheme": "3-4"
  },
 * 
 */
const fetchAll = async () => {
    const teamsMap = {};
    const response = await fetch("https://api.sportsdata.io/v3/nfl/scores/json/TeamsBasic?key=cc1e7d75df054c6c82c4ff2f02ded616", {
        method: 'GET',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        }
    });

    const data = await response.json();
    for (let i = 0; i < data.length; i++) {
        const obj = data[i];
        teamsMap[obj.Key] = obj
    }

    return teamsMap
}

module.exports = {
    fetchAll
}