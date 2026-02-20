const ri = require('../../services/rollingInsightsScore');

( async () => {
  await ri.setScoresAndStats("08", "2025REG")
})()