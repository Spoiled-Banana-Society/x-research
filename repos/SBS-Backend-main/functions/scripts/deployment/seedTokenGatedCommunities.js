//✍️ STEP: 1  FILL OUT THE SCRIPT TEMPLATE BELOW

/* DESCRIPTION START:
========================

    📝 General Description:

    This script adds all communities we are currently using to token gate. 

    👣 Deployment Steps: node seedTokenGatedCommunities.js

    🔗 TaskLink: N/A

    📅 Date Run in sbs-fantasy-dev: 8-29-2022

    📅 Date Run in sbs-fantasy-prod:

========================
DESCRIPTION END */

//🗃️ STEP 2: Add needed Dependencies

const SCRIPT_NAME = 'Seed Token Gated Communities'; //required

//Packages
//const fs = require('fs');

//services
const db = require('../../services/db');
const slugify = require('slugify')

//🚀 STEP 3: Write the script.  Include tests for validation where possible
const addCommunities = async () => {
  const communities = [
    { 
      contractAddress: ["0xbc4ca0eda7647a8ab7c2061c2e118a18a936f13d", "0x60e4d786628fea6478f785a6d7e704777c86a7c6"],
      name: "BAYC/MAYC",
      id: slugify("BAYC/MAYC NFTs", { lower: true })
    },
    {
      contractAddress: ["0x6e9da81ce622fb65abf6a8d8040e460ff2543add", "0x950b9476a4de757bb134483029ac4ec17e739e3a", "0xd7b397edad16ca8111ca4a3b832d0a5e3ae2438c", "0xedb61f74b0d09b2558f1eeb79b247c1f363ae452"],
      name: "Gutter NFTs",
      id: slugify("Gutter NFTs", { lower: true })
    },
    {
      contractAddress: ["0xef0182dc0574cd5874494a120750fd222fdb909a", "0x63f421b24cea6765b326753f6d4e558c21ea8f76"],
      name: "Rumble Kongz/Rookies",
      id: slugify("Rumble Kongz/Rookies NFTs", { lower: true })
    },
    { 
      contractAddress: "0xbc4ca0eda7647a8ab7c2061c2e118a18a936f13d",
      name: "Bored Ape Yacht Club",
      id: slugify("Bored Ape Yacht Club", { lower: true })
    },
    {
      contractAddress: "0x60e4d786628fea6478f785a6d7e704777c86a7c6",
      name: "Mutant Ape Yacht Club",
      id: slugify("Mutant Ape Yacht Club", { lower: true })
    },
    {
      contractAddress: "0x6e9da81ce622fb65abf6a8d8040e460ff2543add",
      name: "Gutter Dogs",
      id: slugify("Gutter Dogs", { lower: true })
    },
    {
      contractAddress: "0x950b9476a4de757bb134483029ac4ec17e739e3a",
      name: "Gutter Birds",
      id: slugify("Gutter Birds", { lower: true })
    },
    {
      contractAddress: "0xd7b397edad16ca8111ca4a3b832d0a5e3ae2438c",
      name: "Gutter Rats",
      id: slugify("Gutter Rats", { lower: true })
    },
    {
      contractAddress: "0xedb61f74b0d09b2558f1eeb79b247c1f363ae452",
      name: "Gutter Cats",
      id: slugify("Gutter Cats", { lower: true })
    },
    {
      contractAddress: "0xef0182dc0574cd5874494a120750fd222fdb909a",
      name: "Rumble Kongz",
      id: slugify("Rumble Kongz", { lower: true })
    },
    {
      contractAddress: "0x63f421b24cea6765b326753f6d4e558c21ea8f76",
      name: "Rookies",
      id: slugify("Rookies", { lower: true })
    },

    {
      contractAddress: "0x0cfb5d82be2b949e8fa73a656df91821e2ad99fd",
      name: "10ktf",
      id: slugify("10ktf", { lower: true })
    },
    {
      contractAddress: "0x0f4b28d46cab209bc5fa987a92a26a5680538e45",
      name: "Nonconformist Ducks",
      id: slugify("Nonconformist Ducks", { lower: true })
    },
    {
      contractAddress: "0x3290f349a0642229b46b7102d2024b34fe8bd3cc",
      name: "Diamond Hands",
      id: slugify("Diamond Hands", { lower: true })
    },
    {
      contractAddress: "0x345974220a845ddeceed011e8e6106b59724b661",
      name: "Non Fungible Heroes",
      id: slugify("Non Fungible Heroes", { lower: true })
    },
    {
      contractAddress: "0x34c4eba1966b502dfcf0868b6f271d85cc8a2312",
      name: "Moon Ape Lab",
      id: slugify("Moon Ape Lab", { lower: true })
    },
    {
      contractAddress: "0x3eacf2d8ce91b35c048c6ac6ec36341aae002fb9",
      name: "Goatz",
      id: slugify("Goatz", { lower: true })
    },
    {
      contractAddress: "0x4ca4d3b5b01207ffce9bea2db9857d4804aa89f3",
      name: "Paradise Trippies",
      id: slugify("Paradise Trippies", { lower: true })
    },
    {
      contractAddress: "0x8a1658607793276301a2769bf49b16d98ac16fd8",
      name: "Crypto Hippos",
      id: slugify("Crypto Hippos", { lower: true })
    },
    {
      contractAddress: "0xb159f1a0920a7f1d336397a52d92da94b1279838",
      name: "RSOP",
      id: slugify("RSOP", { lower: true })
    },
    {
      contractAddress: "0xe3f92992bb4f0f0d173623a52b2922d65172601d",
      name: "Knights of Degen",
      id: slugify("Knights of Degen", { lower: true })
    },
    {
      contractAddress: "0xecdd2f733bd20e56865750ebce33f17da0bee461",
      name: "Crypto Dads",
      id: slugify("Crypto Dads", { lower: true })
    },
    {
      contractAddress: "0xf23e1aa97de9ca4fb76d2fa3fafcf4414b2afed0",
      name: "Last Slice",
      id: slugify("Last Slice", { lower: true })
    },
    {
      contractAddress: "0xb1469271ff094d7fb2710b0a69a80a01ec5dbf24",
      name: "Deez Nuts",
      id: slugify("Deez Nuts", { lower: true })
    },
    {
      contractAddress: "0xfd43d1da000558473822302e1d44d81da2e4cc0d",
      name: "Love, Death & Robots",
      id: slugify("Love, Death & Robots", { lower: true })
    },

  ];
  for (let i = 0; i < communities.length; i++) {
    const community = communities[i];
    await db.createOrUpdateDocument('tokenCommunities', community.id, community, false);
    console.log(`...➕   ADD ${community.name}`);
  }
  // let addresses = []
  // await communities.forEach((project) => {
  //   addresses = []
  //   const communityName = project.name
  //   addresses.push(project.contractAddress)
  //   db.createOrUpdateDocument('tokenCommunities', project.id, project, true);
  //   console.log(`...➕   ADD ${communityName}`);
  // })
};

(async () => {
    console.log(`...📝   START:${SCRIPT_NAME}`);
    
    await addCommunities();

    console.log(`...📝   END:${SCRIPT_NAME}`);
    process.exit(0);
})();
