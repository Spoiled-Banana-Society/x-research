//✍️ STEP: 1  FILL OUT THE SCRIPT TEMPLATE BELOW

/* DESCRIPTION START:
========================

    📝 General Description:

    Write boring and tedious code that needs to be repeated is dangerous.  This simple script automates the process. 
    Just write the function you want and it will print to console.  Then copy it where you need it. Simple as that. 

    👣 Deployment Steps: node functionGenerationScript.js

    🔗 TaskLink: Trello Link Here

    📅 Date Run in sbs-fantasy-dev:

    📅 Date Run in sbs-fantasy-prod:

========================
DESCRIPTION END */

//🗃️ STEP 2: Add needed Dependencies

const SCRIPT_NAME = 'Function Generator'; //required

//PACKAGES

//SERVICES
//!!DON'T INCLUDE ANYTHING AS THIS WILL CAUSE FIREBASE LOGING TO BE USED WITH WILL MAKE THE COPY PASTA NOT POSSIBLE


//🚀 STEP 3: Write the script.  Include tests for validation where possible
const generateGenesisScoreFunctions = async () => {
  const start = 0;
  const end = 10_000;

  let firebaseFunctionCode = `exports.genesisScore${start}To${start + 100} = functions.runWith(genesisScoreFunctionConfig).pubsub.schedule(genesisScoreFrequency).onRun(async () => {
    return score.scoreLineupsInGenesis(gameWeek, ${start}, ${start + 100});
  });` 

  console.log(firebaseFunctionCode);

  for (let i = start + 100; i < end; i += 100) {
    const _start = i;
    const _end = i + 100;
    firebaseFunctionCode = `exports.genesisScore${_start}To${_end} = functions.runWith(genesisScoreFunctionConfig).pubsub.schedule(genesisScoreFrequency).onRun(async () => {
      return score.scoreLineupsInGenesis(gameWeek, ${_start}, ${_end});
    });` 
    console.log(firebaseFunctionCode)
    
  }

};



(async () => {
    console.log(`...📝   START:${SCRIPT_NAME}`);
    
    await generateGenesisScoreFunctions();

    console.log(`...📝   END:${SCRIPT_NAME}`);
    process.exit(0);
})();
