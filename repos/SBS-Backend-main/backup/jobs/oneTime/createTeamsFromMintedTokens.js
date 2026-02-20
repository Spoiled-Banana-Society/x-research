import db from "../../services/db.js";
import utils from "../../services/utils.js";
import web3Utils from "../../services/web3.js";

(async () => {
  const tokenIndexStart = 10;
  const tokenIndexEnd = 20;
  const collectionName = "cards";
  let team = {};
  let validNFLTeams = utils.validNFLTeams();
  let randomQB = shuffle(...validNFLTeams);
  let randomRB = shuffle(...validNFLTeams);
  let randomWR = shuffle(...validNFLTeams);
  let randomTE = shuffle(...validNFLTeams);
  let randomDEF = shuffle(...validNFLTeams);
  let QB1;
  let QB2;
  let RB1;
  let RB2;
  let RB3;
  let RB4;
  let WR1;
  let WR2;
  let WR3;
  let WR4;
  let WR5;
  let TE1;
  let TE2;
  let DST1;
  let DST2;



  //This shuffle generator is started and never stops
  function* shuffle(...array) {
    let i = array.length;

    while (i--) {
      yield array.splice(Math.floor(Math.random() * (i + 1)), 1)[0];
    }
  }

  const createTeamFromMintedToken = async (tokenId, team) => {
    let newTeamData = {
      _tokenId: tokenId,
      _ownerWalletId: await web3Utils.getOwnerByCardId(tokenId),
      level: "Pro",
      name: `Card ${tokenId}`,
      image: "",
      decription: `Card ${tokenId} Description`,
      attributes: [
        {
          trait_type: "QB1", 
          value: team.QB1
        },
        {
          trait_type: "QB2", 
          value: team.QB2
        },
        {
          trait_type: "RB1", 
          value: team.RB1
        },
        {
          trait_type: "RB2",
          value: team.RB2
        },
        {
          trait_type: "RB3",
          value: team.RB3
        },
        {
          trait_type: "RB4",
          value: team.RB4
        },
        {
          trait_type: "WR1",
          value: team.WR1
        },
        {
          trait_type: "WR2",
          value: team.WR2
        },
        {
          trait_type: "WR3",
          value: team.WR3
        },
        {
          trait_type: "WR4",
          value: team.WR4
        },
        {
          trait_type: "WR5",
          value: team.WR5
        },
        {
          trait_type: "TE1",
          value: team.TE1
        },
        {
          trait_type: "TE2",
          value: team.TE2
        },
        {
          trait_type: "DST1",
          value: team.DST1
        },
        {
          trait_type: "DST2",
          value: team.DST2
        },
        {
          trait_type: "LEVEL",
          value: "Pro"
        }
      ],
      // QB1: team.QB1,
      // QB2: team.QB2,
      // RB1: team.RB1,
      // RB2: team.RB2,
      // RB3: team.RB3,
      // RB4: team.RB4,
      // WR1: team.WR1,
      // WR2: team.WR2,
      // WR3: team.WR3,
      // WR4: team.WR4,
      // WR5: team.WR5,
      // TE1: team.TE1,
      // TE2: team.TE2,
      // DST1: team.DST1,
      // DST2: team.DST2,
      startingLineup: [
        {
          positionId: "QB1",
          positionLabel: "QB",
          teamId: team.QB1,
          teamPosition: `${team.QB1} QB`,
          starting: true,
        },
        {
          positionId: "QB2",
          positionLabel: "QB",
          teamId: team.QB2,
          teamPosition: `${team.QB2} QB`,
          starting: false,
        },
        {
          positionId: "RB1",
          positionLabel: "RB",
          teamId: team.RB1,
          teamPosition: `${team.RB1} RB`,
          starting: true,
        },
        {
          positionId: "RB2",
          positionLabel: "RB",
          teamId: team.RB2,
          teamPosition: `${team.RB2} RB`,
          starting: true,
        },
        {
          positionId: "RB3",
          positionLabel: "RB",
          teamId: team.RB3,
          teamPosition: `${team.RB3} RB`,
          starting: false,
        },
        {
          positionId: "RB4",
          positionLabel: "RB",
          teamId: team.RB4,
          teamPosition: `${team.RB4} RB`,
          starting: false,
        },
        {
          positionId: "WR1",
          positionLabel: "WR",
          teamId: team.WR1,
          teamPosition: `${team.WR1} WR`,
          starting: true,
        },
        {
          positionId: "WR2",
          positionLabel: "WR",
          teamId: team.WR2,
          teamPosition: `${team.WR2} WR`,
          starting: true,
        },
        {
          positionId: "WR3",
          positionLabel: "WR",
          teamId: team.WR3,
          teamPosition: `${team.WR3} WR`,
          starting: true,
        },
        {
          positionId: "WR4",
          positionLabel: "WR",
          teamId: team.WR4,
          teamPosition: `${team.WR4} WR`,
          starting: false,
        },
        {
          positionId: "WR5",
          positionLabel: "WR",
          teamId: team.WR5,
          teamPosition: `${team.WR5} WR`,
          starting: false,
        },
        {
          positionId: "TE1",
          positionLabel: "TE",
          teamId: team.TE1,
          teamPosition: `${team.TE1} TE`,
          starting: true,
        },
        {
          positionId: "TE2",
          positionLabel: "TE",
          teamId: team.TE2,
          teamPosition: `${team.TE2} TE`,
          starting: false,
        },
        {
          positionId: "DST1",
          positionLabel: "DST",
          teamId: team.DST1,
          teamPosition: `${team.DST1} DST`,
          starting: true,
        },
        {
          positionId: "DST2",
          positionLabel: "DST",
          teamId: team.DST2,
          teamPosition: `${team.DST2} DST`,
          starting: false,
        },
      ],
    };
    

    //Don't create/update team if it already exists
    let existingTeamData = await db.readDocument('cards', tokenId.toString());

    //update owner if new owner exists.
    //let documentData = newTeamData; //🚨 Warning this overwrite data use only for dev purposes only
    let documentData = Object.entries(existingTeamData).length != 0 ? existingTeamData : newTeamData

    //This validates ownership
    //TODO: add error handling for now walletId
    //documentData.ownerWalletId = await web3Utils.getOwnerByCardId(tokenId);

    await db.createOrUpdateDocument(
      collectionName,
      tokenId.toString(),
      documentData
    );
  };

  for (let i = tokenIndexStart; i < tokenIndexEnd; i++) {
    QB1 = randomQB.next().value;
    QB2 = randomQB.next().value;

    RB1 = randomRB.next().value;
    RB2 = randomRB.next().value;
    RB3 = randomRB.next().value;
    RB4 = randomRB.next().value;

    WR1 = randomWR.next().value;
    WR2 = randomWR.next().value;
    WR3 = randomWR.next().value;
    WR4 = randomWR.next().value;
    WR5 = randomWR.next().value;

    TE1 = randomTE.next().value;
    TE2 = randomTE.next().value;

    DST1 = randomDEF.next().value;
    DST2 = randomDEF.next().value;

    if (!QB1 || !QB2) {
      randomQB = shuffle(...validNFLTeams);
      QB1 = randomQB.next().value;
      QB2 = randomQB.next().value;
    }

    if (!RB1 || !RB2 || !RB3 || !RB4) {
      randomRB = shuffle(...validNFLTeams);
      RB1 = randomRB.next().value;
      RB2 = randomRB.next().value;
      RB3 = randomRB.next().value;
      RB4 = randomRB.next().value;
    }

    if (!WR1 || !WR2 || !WR3 || !WR4 || !WR5) {
      randomWR = shuffle(...validNFLTeams);
      WR1 = randomWR.next().value;
      WR2 = randomWR.next().value;
      WR3 = randomWR.next().value;
      WR4 = randomWR.next().value;
      WR5 = randomWR.next().value;
    }

    if (!TE1 || !TE2) {
      randomTE = shuffle(...validNFLTeams);
      TE1 = randomTE.next().value;
      TE2 = randomTE.next().value;
    }

    if (!DST1 || !DST2) {
      randomDEF = shuffle(...validNFLTeams);
      DST1 = randomDEF.next().value;
      DST2 = randomDEF.next().value;
    }

    team = {
      QB1,
      QB2,
      RB1,
      RB2,
      RB3,
      RB4,
      WR1,
      WR2,
      WR3,
      WR4,
      WR5,
      TE1,
      TE2,
      DST1,
      DST2,
    };

    await createTeamFromMintedToken(i, team);
  }

  console.log("...🏈  teams successfully created");
  process.exit(0);
})();
