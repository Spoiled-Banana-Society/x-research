const seasonInfo = require("../constants/season")

const getPlayerStatsBase = () => {
  return `playerStats${seasonInfo.SEASON}`
}

module.exports = {
  getPlayerStatsBase
}