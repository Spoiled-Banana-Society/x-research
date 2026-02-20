(async () => {
    const gameweek = '2022-REG-14';
    const results = [];
    for(let i = 0; i < cards.length; i++) {
      const cardId = cards[i];
      console.log(cardId)
      const lineup = await db.readDocument(`leagues/genesis/cards/${cardId}/lineups`, gameweek);
      if(!lineup) {
        results.push(cardId)
        console.log(`DO NOT HAVE A LINEUP FOR WEEK 14 IN GENESIS FOR #${cardId}`)
      }
      if(lineup.scoreSeason == NaN) {
        results.push(cardId)
      }
      if(!lineup.prevWeekSeasonScore) {
        results.push(cardId)
      }
      const obj = await db.readDocument(`genesisLeaderboard/${gameweek}/cards`, cardId);
      obj.lineup = lineup;
      obj.scoreSeason = lineup.scoreSeason;
      obj.scoreWeek = lineup.scoreWeek;
      await db.createOrUpdateDocument(`genesisLeaderboard/${gameweek}/cards`, cardId, obj, false)
      console.log(`Updated card ${cardId}`)
    }
    console.log('PRINTING THE CARDS THAT ARE FUCKED')
    if(results.length != 0) {
      for(let i = 0; i < results.length; i++) {
        console.log(results[i])
      }
    }
    console.log('COMPLETE')
  })()