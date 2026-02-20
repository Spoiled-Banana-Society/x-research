const db = require('../../services/db');
const axios = require('axios');

const ScoreDraftTokens = async (scores, gameWeek) => {
    const dataEndpoint = `https://sbs-cloud-functions-api-671861674743.us-central1.run.app/scoreDraftTokens`;
    let result;

    const body = {
        scores: scores.FantasyPoints,
        gameWeek: gameWeek,
    }

    let data = JSON.stringify(body);
    //data = JSON.parse(data)

    try {
        console.log("calling scoring endpoint now")
        let res = await axios.post(dataEndpoint, body)
        result = res.json()
    } catch (err) {
        console.log(err)
    }
    
        
    console.log(result)
}

( async () => {
  const gameWeek = "2025REG-03"
  const scores = await db.readDocument("scores", gameWeek)

  await ScoreDraftTokens(scores, gameWeek)
})()