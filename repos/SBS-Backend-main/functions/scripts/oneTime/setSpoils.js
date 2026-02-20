require("firebase-functions/lib/logger/compat");
const utils = require("../../services/utils");
const db = require("../../services/db");


(async () => {
  
  const phasephrase = '24601';
  let cards = [];
  for (let i = 0; i < 1_000; i++) cards.push(i);
  let randomSpoil = utils.shuffle(...cards);

  let freePeelSpoils = [];
  const numFreePeelSpoils = 100;
  for (let i = 0; i < numFreePeelSpoils; i++) freePeelSpoils.push(randomSpoil.next().value);
  freePeelSpoils = freePeelSpoils.sort((a, b) => a - b);
  console.log('freePeelSpoils:')
  console.log(freePeelSpoils.length);
  console.log(freePeelSpoils.toString());
  console.log('==========================');

  let paidPeelSpoils = [];
  const numPaidPeelSpoils = 150;
  for (let i = 0; i < numPaidPeelSpoils; i++) paidPeelSpoils.push(randomSpoil.next().value);
  paidPeelSpoils = paidPeelSpoils.sort((a, b) => a - b);
  console.log('paidPeelSpoils:')
  console.log(paidPeelSpoils.length);
  console.log(paidPeelSpoils.toString());
  console.log('==========================');

  let paidMashSpoils = [];
  const numPaidMashSpoils = 250;
  for (let i = 0; i < numPaidMashSpoils; i++) paidMashSpoils.push(randomSpoil.next().value);
  paidMashSpoils = paidMashSpoils.sort((a, b) => a - b);
  console.log('paidMashSpoils:')
  console.log(paidMashSpoils.length);
  console.log(paidMashSpoils.toString());
  console.log('==========================');

  const spoilObject = {
    //freePeelSpoils: utils.encryptWithAES(freePeelSpoils.toString(), phasephrase),
    paidPeelSpoils: utils.encryptWithAES(paidPeelSpoils.toString(), phasephrase),
    //paidMashSpoils: utils.encryptWithAES(paidMashSpoils.toString(), phasephrase)
  }

  //await db.createOrUpdateDocument('spoil', 'main', spoilObject, true);
  process.exit(0);
})();