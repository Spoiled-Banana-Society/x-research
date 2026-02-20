//✍️ STEP: 1  FILL OUT THE SCRIPT TEMPLATE BELOW

/* DESCRIPTION START:
========================

    📝 General Description:

    Find all the cards that were affected by the bad peel/mash that happened on 9/13.

    👣 Deployment Steps: node findAffectedBadPeelMash.js

    🔗 TaskLink: N/A

    📅 Date Run in sbs-fantasy-dev: //TODO: Run some point

    📅 Date Run in sbs-fantasy-prod: N/A

========================
DESCRIPTION END */

//🗃️ STEP 2: Add needed Dependencies

const SCRIPT_NAME = 'Find affected cards'; //required

//Packages

//services
const db = require('../../services/db');
const cardContract = require('../../services/cardContract');

// see what leagues they are in
// calculate their highest possible score with their previous card

//🚀 STEP 3: Write the script. Include tests for validation where possible
const findBadCards = async () => {

  const affectedWallets = [
    // '0xb472698319e30d265b8c83ae1d66695af8c0b5e7',
    // '0xb472698319e30d265b8c83ae1d66695af8c0b5e7',
    // '0xe7cf57685c31704ab644d4004cd9d63df4bd40ab',
    // '0x0c6a75871d77ce9f8e8c862c0a88033ea5987e6c',
    // '0x0c6a75871d77ce9f8e8c862c0a88033ea5987e6c',
    // '0xc3e1e5216f1a31bac61d07dc35aef75dc98788ab',
    // '0xf25b4825e9f4a79896d66dd737052265f34c8ce3',
    // '0x68f720bfe21979eeb850792bbd178d4accd66856',
    // '0xe0d52a1880ff0ed35eac55bfef7c6c0d5b017113',
    // '0xe0d52a1880ff0ed35eac55bfef7c6c0d5b017113',
    // '0x234b5479dc64a080117624184faca50bf350db98',
    // '0x6533791d188bacb7b7fde0de258678208af48abe',
    // '0xca9a8fd726236e258c27e780f0b3631aaa25b38d',
    // '0xca9a8fd726236e258c27e780f0b3631aaa25b38d',
    // '0x1398678864b787a37e609e1883370884fc8d30e2',
    // '0xa57cda6b07a144eb6bc91bbb25e1e0364f1ad2fb',
    // '0x1c6bb2c33ae8a28e08f96b8839bccb3a0e2b9b69',
    // '0x08a71d4acbde2edb540ac3f7324016bf49dc381a',
    // '0xa05bca6f6d9c0bc2c3a597ac3f800eaf502aca66',
    // '0xa05bca6f6d9c0bc2c3a597ac3f800eaf502aca66',
    // '0xa05bca6f6d9c0bc2c3a597ac3f800eaf502aca66',
    // '0x0bb29fdcd7d73a2b6af9452be92223b8e72e3eac',
    // '0x6a68e7e32ee88485f11cde93c3cf5f4d107905b8',
    // '0x418fd25daa74b16f0a574cacb91f4bbaafa934d6',
    // '0xac68de28df324bc948f794e7e0064e44de7366fe',
    // '0xb5fbef2ddc90128dad206c2599fc0bd15680a224',
    // '0xb5fbef2ddc90128dad206c2599fc0bd15680a224',
    // '0x94ccbc21601e4ebb4b2164d7b1f45df056c1ca91',
    // '0x4974daf5a7768f7c989fbe987b3cf8710f728c54',
    // '0x94ccbc21601e4ebb4b2164d7b1f45df056c1ca91',
    // '0x167c69f524b5677ea639b944996fbe26bc4db8f1',
    // '0x117300561021503230d69dbfb426d3aee722d7d1',
    // '0xd8dc2ca51e0e53f6ad9b582a7e6c9a6b63258960',
    // '0xa2a633241988c5b40b2c9daa9c606b5792bbcbe0',
    // '0xd8dc2ca51e0e53f6ad9b582a7e6c9a6b63258960',
    // '0xa2a633241988c5b40b2c9daa9c606b5792bbcbe0',
    // '0x5425e50f9790b89797ff6ca97a9218b72e7f2053',
    // '0x5425e50f9790b89797ff6ca97a9218b72e7f2053',
    // '0x5425e50f9790b89797ff6ca97a9218b72e7f2053',
    // '0xd4b32d6e276b1864131fb9b434abf38a1de980c5',
    // '0x7692ceca59b99c97de07e2adf4f69a8226643789',
    // '0x7692ceca59b99c97de07e2adf4f69a8226643789',
    // '0xd4cfc0d5b169def6e3ba9c3592691951dc047dd3',
    // '0x1884e47c3b735a9c8ec44325dc15b5c299d03613',
    // '0xe942ae7e957d64b53887879c048dd17e91e036d6',
    // '0x0dc06ee211512d5283f0df1454823b1d87dfb661',
    // '0x54339ac9c4e197b2c24a969bcc59c51939350cb2',
    // '0x0621f9db527e567fa9a9d3f55ca3e53992b7dedb',
    // '0x414088b0938d94e4d8f6c4f1ffd1e30d40626ad6',
    // '0xd0319e4e46ea516eb6ec325ce61b068d7e1f4c5a',
    // '0xd0319e4e46ea516eb6ec325ce61b068d7e1f4c5a',
    // '0xd0319e4e46ea516eb6ec325ce61b068d7e1f4c5a',
    // '0xbd57f2737098f1ca178fb72fc8ef90b53438fb21',
    // '0xF8F9adFeFD26D509Af754C34EbA429541BABbE39',
    // '0x9a6609b22172108a10675F8a754696ed177a4075',
    // '0x6533791D188baCb7B7FDe0de258678208Af48abe',
    // '0x566D97DEC401d837997dc6cA58E2b637B959d9B5',
    // '0x1398678864B787A37E609E1883370884FC8D30E2',
    // '0xD4A14393416a321b74168e259A9592982C88Ae72',
    // '0x8468D4B698FE112F9aa1fa86278A21eA0997c3Fe',
    // '0x1398678864B787A37E609E1883370884FC8D30E2',
    // '0xEf9B402A00286B2b951782C41586882534316758'
  ]

  const affectedCards = [
    // '3605',
    // '99',
    // '6954',
    // '2260',
    // '4783',
    // '7024',
    // '1309',
    // '3260',
    // '6184',
    // '1522',
    // '6323',
    // '5807',
    // '6413',
    // '2049',
    // '6339',
    // '1626',
    // '5658',
    // '6571',
    // '7151',
    // '5550',
    // '3617',
    // '1922',
    // '2352',
    // '8870',
    // '2157',
    // '38',
    // '5969',
    // '6429',
    // '6419',
    // '6442',
    // '5979',
    // '7128',
    // '5655',
    // '4175',
    // '3126',
    // '4419',
    // '8899',
    // '47',
    // '8799',
    // '3465',
    // '3468',
    // '5523',
    // '4561',
    // '2168',
    // '2167',
    // '1695',
    // '427',
    // '6899',
    // '5160',
    // '3064',
    // '279',
    // '3338',
    // '2842',
    // '2902',
    // '4210',
    // '4853',
    '8037',
  ]

  const leagueIds = await db.readAllDocumentIds('leagues')
  for(let i = 0; i < leagueIds.length; i++){
    for(let y = 0; y < affectedCards.length; y++){
      const participatingLeagues = await db.readDocument(`leagues/${leagueIds[i]}/cards`, affectedCards[y])
      if(participatingLeagues){
        console.log(`🍌 Card #${affectedCards[y]} is participating in ${leagueIds[i]}`)
      }
    }
  }
}

// loop leagues
// loop participating cards
// 

(async () => {
    console.log(`...📝   START:${SCRIPT_NAME}`);
    
    await findBadCards();

    console.log(`...📝   END:${SCRIPT_NAME}`);
    process.exit(0);
})();

