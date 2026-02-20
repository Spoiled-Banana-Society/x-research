const stats = require('../../services/stat')

const teams = ['ARI', 'ATL', 'BAL', 'BUF', 'CAR', 'CHI', 'CIN', 'CLE', 'DAL', 'DEN', 'DET', 'GB',  'HOU', 'IND', 'JAX', 'KC',  'LAC', 'LAR', 'LV',  'MIA', 'MIN', 'NE',  'NO',  'NYG', 'NYJ', 'PHI', 'PIT', 'SEA', 'SF',  'TB',  'TEN', 'WAS'];


const getDataFromEndpoint = async (team) => {
    const options = {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
    }
      
    const response = await fetch(`https://api.sportsdata.io/v3/nfl/scores/json/Players/${team}?key=cc1e7d75df054c6c82c4ff2f02ded616`, options);
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

const fetchAll = async () => {
    let teamMap = {};

    for (let i = 0; i < teams.length; i++) {
        const team = teams[i];
        console.log("Team: ", team)
        let teamObj = {
            QB: [],
            RB: [],
            TE: [],
            WR: [],
            DST: [],
        }


        let data = await getDataFromEndpoint(team)
        let qbArray = data.filter(x => x.FantasyPosition == 'QB' && x.FantasyPositionDepthOrder != null);
        let sortedQbArray = qbArray.sort((a, b) => getDepthOrder(a) - getDepthOrder(b))
        for (let j = 0; j < sortedQbArray.length; j++) {
            if (teamObj.QB.length == 3) {
                break;
            }

            if (sortedQbArray[j].DepthOrder == null) {
            } else {            
                teamObj.QB.push(sortedQbArray[j].Name)
            }
            
        }

        let rbArray = data.filter(x => x.FantasyPosition == 'RB');
        let sortedRbArray = rbArray.sort((a, b) => getDepthOrder(a) - getDepthOrder(b))
        for (let j = 0; j < sortedRbArray.length; j++) {
            if (teamObj.RB.length == 4) {
                break;
            }
            teamObj.RB.push(sortedRbArray[j].Name)
        }

        let teArray = data.filter(x => x.FantasyPosition == 'TE');
        let sortedTeArray = teArray.sort((a, b) => getDepthOrder(a) - getDepthOrder(b))
        for (let j = 0; j < sortedTeArray.length; j++) {
            if (teamObj.TE.length == 3) {
                break;
            }
            teamObj.TE.push(sortedTeArray[j].Name)
        }

        let wrArray = data.filter(x => x.FantasyPosition == 'WR');
        let sortedWrArray = wrArray.sort((a, b) => getDepthOrder(a) - getDepthOrder(b))
        for (let j = 0; j < sortedWrArray.length; j++) {
            if (teamObj.WR.length == 5) {
                break;
            }
            teamObj.WR.push(sortedWrArray[j].Name)
        }

        teamMap[team] = teamObj
    }

    
    // for (let [key, value] of Object.entries(teamMap)) {
    //     console.log(` key: ${key}, QBs: ${value.QB}, RBs: ${value.RB}, TEs: ${value.TE}, WRs: ${value.WR}, DST: ${value.DST} ` )
    // }
    return teamMap
}

module.exports = {
    fetchAll
}