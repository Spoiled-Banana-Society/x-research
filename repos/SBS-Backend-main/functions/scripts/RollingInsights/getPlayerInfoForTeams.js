const stats = require('../../services/stat')

const teams = ['ARI', 'ATL', 'BAL', 'BUF', 'CAR', 'CHI', 'CIN', 'CLE', 'DAL', 'DEN', 'DET', 'GB',  'HOU', 'IND', 'JAX', 'KC',  'LAC', 'LAR', 'LV',  'MIA', 'MIN', 'NE',  'NO',  'NYG', 'NYJ', 'PHI', 'PIT', 'SEA', 'SF',  'TB',  'TEN', 'WAS'];

const fullNameToTeamName = {
    "Arizona Cardinals": "ARI",
    "Atlanta Falcons": "ATL",
    "Baltimore Ravens": "BAL",
    "Buffalo Bills": "BUF",
    "Carolina Panthers": "CAR",
    "Chicago Bears": "CHI",
    "Cincinnati Bengals": "CIN",
    "Cleveland Browns": "CLE",
    "Dallas Cowboys": "DAL",
    "Denver Broncos": "DEN",
    "Detroit Lions": "DET",
    "Green Bay Packers": "GB",
    "Houston Texans": "HOU",
    "Indianapolis Colts": "IND",
    "Jacksonville Jaguars": "JAX",
    "Kansas City Chiefs": "KC",
    "Los Angeles Chargers": "LAC",
    "Los Angeles Rams": "LAR",
    "Las Vegas Raiders": "LV",
    "Miami Dolphins": "MIA",
    "Minnesota Vikings": "MIN",
    "New England Patriots": "NE",
    "New Orleans Saints": "NO",
    "New York Giants": "NYG",
    "New York Jets": "NYJ",
    "Philadelphia Eagles": "PHI",
    "Pittsburgh Steelers": "PIT",
    "Seattle Seahawks": "SEA",
    "San Francisco 49ers": "SF",
    "Tampa Bay Buccaneers": "TB",
    "Tennessee Titans": "TEN",
    "Washington Commanders": "WAS", 
}

const getDepthChartDataFromEndpoint = async (team) => {
    const options = {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
    }
      
    const response = await fetch(`http://rest.datafeeds.rolling-insights.com/api/v1/depth-charts/NFL?RSC_token=44b29fbc16ba1b201e5b25a0bd26877abee8ad009bd13b9efd8ee892661f44fc`, options);
    let data = await response.json()
    return data
}

const getAllPlayersFromEndpoint = async (team) => {
    const options = {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
    }
      
    const response = await fetch(`http://rest.datafeeds.rolling-insights.com/api/v1/depth-charts/NFL?RSC_token=44b29fbc16ba1b201e5b25a0bd26877abee8ad009bd13b9efd8ee892661f44fc`, options);
    let data = await response.json()
    return data
}

const getDepthOrder = (p) => {
    if (p.FantasyPositionDepthOrder) {
        return p.FantasyPositionDepthOrder
    }
    else {
        if (p.DepthOrder) return p.DepthOrder

        return 100
    }
}

const flattenAPIMap = (m) => {
    const a = []
    Object.keys(m).forEach(k => {
        a.push(m[k].player)
    })

    return a
}

const fetchAll = async () => {
    let teamMap = {};

    let data = await getDepthChartDataFromEndpoint()

    Object.keys(data.data.NFL).forEach(teamFullName => {
        const teamAbbrev = fullNameToTeamName[teamFullName]
        if (!teamAbbrev) {
            console.log(teamFullName)
            throw Error(`Unable to find team ${teamFullName}`)
        }

        let teamObj = {
            QB: [],
            RB: [],
            TE: [],
            WR: [],
            DST: [],
        }


        teamObj.QB = flattenAPIMap(data.data.NFL[teamFullName]["QB"])
        teamObj.RB = flattenAPIMap(data.data.NFL[teamFullName]["RB"])
        teamObj.TE = flattenAPIMap(data.data.NFL[teamFullName]["TE"])

        const wr1s = flattenAPIMap(data.data.NFL[teamFullName]["WR1"])
        const wr2s = flattenAPIMap(data.data.NFL[teamFullName]["WR2"])
        const wr3s = flattenAPIMap(data.data.NFL[teamFullName]["WR3"])
        // fill first 6 WRs
        teamObj.WR.push(wr1s[0])
        teamObj.WR.push(wr2s[0])
        teamObj.WR.push(wr3s[0])
        teamObj.WR.push(wr1s[1])
        teamObj.WR.push(wr2s[1])
        teamObj.WR.push(wr3s[1])

        teamMap[teamAbbrev] = teamObj
    })
    
    // for (let [key, value] of Object.entries(teamMap)) {
    //     console.log(` key: ${key}, QBs: ${value.QB}, RBs: ${value.RB}, TEs: ${value.TE}, WRs: ${value.WR}, DST: ${value.DST} ` )
    // }
    return teamMap
}

module.exports = {
    fetchAll
}