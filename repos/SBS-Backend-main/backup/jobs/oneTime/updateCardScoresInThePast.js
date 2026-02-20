const nflWeekStr = "2021-REG-week-16";
const max = await web3Utils.numTokensMinted();
let card; 
let lastTouched;

for(let i = 0; i < max; i++) {
  card = await db.readDocument('cards', i.toString());
  lastTouched = card.lastTouched ? card.lastTouched : null;
  
  const prevNflWeekIndex = card.scores.findIndex(x => x[nflWeekStr]);
  card.scores[prevNflWeekIndex][nflWeekStr].lastTouched = lastTouched;
  
  delete card.lastTouched;
  
  await db.createOrUpdateDocument('cards', i.toString(), card, false);
}