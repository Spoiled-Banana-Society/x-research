const db = require('../../services/db');

const NEW_W9_FORMAT = {
  '2025': false
};

const BLANK_OWNER = {
  "AvailableCredit": 0,
  "AvailableEthCredit": 0,
  "BlueCheckEmail": "",
  "HasW9": NEW_W9_FORMAT,
  "IsBlueCheckVerified": false,
  "Leagues": [],
  "NumWithdrawals": 0,
  "PFP": {
    "DisplayName": "",
    "ImageUrl": "",
    "NftContract": ""
  },
  "PendingCredit": 0,
  "WithdrawnAmount": {}
};

// RUN THIS TO UPDATE ALL OWNERS TO NEW FORMAT
(async () => {
  const ownerIds = await db.readAllDocumentIds('owners')

  for (let i = 0; i < ownerIds.length; i++) {
    const ownerId = ownerIds[i]
    console.log(ownerId)
    let owner = await db.readDocument('owners', ownerId)
    if (owner) {
      owner.HasW9 = NEW_W9_FORMAT
    } else {
      console.log("CREATING BLANK OWNER")
      owner = {
        ...BLANK_OWNER
      }
    }
    
    await db.createOrUpdateDocument('owners', ownerId, owner)
  }
})()