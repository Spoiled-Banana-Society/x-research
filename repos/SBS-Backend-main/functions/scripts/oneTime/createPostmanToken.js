//✍️ STEP: 1  FILL OUT THE SCRIPT TEMPLATE BELOW

/* DESCRIPTION START:
========================

    📝 General Description:

    Postman uses a token that does not expire so its easier to test stuff. 
    This script will generate a new token if needed. 

    👣 Deployment Steps: node createPostmanToken.js

    🔗 TaskLink: N/A

    📅 Date Run in sbs-fantasy-dev: N/A

    📅 Date Run in sbs-fantasy-prod: N/A

========================
DESCRIPTION END */

//🗃️ STEP 2: Add needed Dependencies

const SCRIPT_NAME = 'Generate New Postman Token'; //required
//Packages
const jwt = require('jsonwebtoken');

//services
const db = require('../../services/db');
const ENV = require('../../services/env');
const ENVIRONMENT = 'dev';  //change based upon what environment you are needing to use the token.


//🚀 STEP 3: Write the script.  Include tests for validation where possible
const generateNewToken = async (environment) => {
  const JWT_SECRET = (environment === 'prod') ? ENV.get('JWT_SECRET') : 'dev';
  const payload = JSON.stringify({name: 'sbs'});
  const TOKEN = jwt.sign(payload, JWT_SECRET);
  console.log(`...📫   NEW POSTMAN TOKEN GENERATED!: ${TOKEN}`);
};



(async () => {
    console.log(`...📝   START:${SCRIPT_NAME}`);
    
    await generateNewToken(ENVIRONMENT);

    console.log(`...📝   END:${SCRIPT_NAME}`);
    process.exit(0);
})();
