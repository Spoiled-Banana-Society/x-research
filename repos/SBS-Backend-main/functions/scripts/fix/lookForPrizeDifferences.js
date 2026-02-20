const db = require('../../services/db');
const fs = require('fs');
const utils = require('../../services/utils');

const readInJSONAndCompare = async () => {
    let oldData;
    const path = "./genesisCards.json"
    oldData = fs.readFileSync(path, 'utf8')
    // , (err, data) => {
    //     if (err) {
    //         console.error('Error while reading the file:', err)
    //         return
    //       }
    //       console.log(data)
    //       try {
    //         oldData = JSON.parse(data);
    //         // output the parsed data
    //         console.log(oldData);
    //       } catch (err) {
    //         console.error('Error while parsing JSON data:', err);
    //     }
    // })
    oldData = JSON.parse(oldData)

    for(let i = 0; i < 10000; i++) {
        const cardId = `${i}`;
        const oldCard = oldData[cardId];
        
        
        const newCard = await db.readDocument('cards', cardId)

        if(oldCard.prizes && !newCard.prizes) {
            console.log(`Card ${cardId} has prizes on old card but not on new card`)
        } else if (!oldCard.prizes && newCard.prizes) {
            console.log(`Card ${cardId} has prizes on new card but not on old card`)
        } else if(oldCard.prizes && newCard.prizes) {
            if(oldCard.prizes.ape && newCard.prizes.ape) {
                if(oldCard.prizes.ape != newCard.prizes.ape) {
                    console.log(`Card ${cardId} has mismatched ape value in prizes`)
                }
            } else if(oldCard.prizes.ape && !newCard.prizes.ape) {
                console.log(`Card ${cardId} has ape on old card but not new`)
            } else if(!oldCard.prizes.ape && newCard.prizes.ape) {
                console.log(`Card ${cardId} has ape on new card but not old`)
            }

            if(oldCard.prizes.eth && newCard.prizes.eth) {
                if(oldCard.prizes.eth != newCard.prizes.eth) {
                    console.log(`Card ${cardId} has mismatched eth value in prizes`)
                }
            } else if(oldCard.prizes.eth && !newCard.prizes.eth) {
                console.log(`Card ${cardId} has eth on old card but not new`)
            } else if(!oldCard.prizes.eth && newCard.prizes.eth) {
                console.log(`Card ${cardId} has eth on new card but not old`)
            }           
        }
    }
}

const readInJSONAndCompareOwners = async () => {
    let oldData;
    const path = "./ownersData.json"
    oldData = fs.readFileSync(path, 'utf8')
    // , (err, data) => {
    //     if (err) {
    //         console.error('Error while reading the file:', err)
    //         return
    //       }
    //       console.log(data)
    //       try {
    //         oldData = JSON.parse(data);
    //         // output the parsed data
    //         console.log(oldData);
    //       } catch (err) {
    //         console.error('Error while parsing JSON data:', err);
    //     }
    // })
    oldData = JSON.parse(oldData)
    // console.log(oldData)
    // await utils.sleep(8000)

    const ownerIds = await db.readAllDocumentIds('owners')
    console.log(`Length of old owners: ${Object.keys(oldData).length}, new Owners: ${ownerIds.length}`)

    

    for(let i = 0; i < ownerIds.length; i++) {
        const ownerId = ownerIds[i];
        const oldOwner = oldData[ownerId];
        if(!oldOwner) {
            console.log(`${ownerId} does not have an owners object in the old prod`)
            continue;
        }
        
        const newOwner = await db.readDocument('owners', ownerId)
        if(!newOwner) {
            console.log(`${ownerId} does not have an owners object in the new prod`)
            continue;
        }

        if (oldOwner.availableCredit && !newOwner.AvailableCredit) {
            console.log(`${ownerId} older owner has ape but new owner object does not`)
        } else if (!oldOwner.availableCredit && newOwner.AvailableCredit) {
            console.log(`${ownerId} new owner has ape but old owner object does not`)
        } else if (oldOwner.availableCredit && newOwner.AvailableCredit) {
            if (oldOwner.availableCredit != newOwner.AvailableCredit) {
                console.log(`${ownerId} has a different ape credit`)
            }
        }

        if (oldOwner.availableEthCredit && !newOwner.AvailableEthCredit) {
            console.log(`${ownerId} older owner has eth but new owner object does not`)
        } else if (!oldOwner.availableEthCredit && newOwner.AvailableEthCredit) {
            console.log(`${ownerId} new owner has eth but old owner object does not`)
        } else if (oldOwner.availableEthCredit && newOwner.AvailableEthCredit) {
            if (oldOwner.availableEthCredit != newOwner.AvailableEthCredit) {
                console.log(`${ownerId} has a different eth credit`)
            }
        }
    }
}

const createOwnersArray = async () => {
    const ownersData = {};
    const ownerIds = await db.readAllDocumentIds('owners');
    for(let i = 0; i < ownerIds.length; i++) {
        const ownerId = ownerIds[i];
        
        const owner = await db.readDocument('owners', ownerId);
        ownersData[ownerId] = owner;
    }

    return ownersData
}

const writeOwnersDataToJSON = async (data) => {

    let jsonContent = JSON.stringify(data);
    fs.writeFile("ownersData.json", jsonContent, 'utf8', function (err) {
        if (err) {
            console.log("An error occured while writing JSON Object to File.");
            return console.log(err);
        }
     
        console.log("JSON file has been saved.");
    });
}



(async () => {
    //await readInJSONAndCompare()
    // const data = await createOwnersArray();
    // await writeOwnersDataToJSON(data)
    await readInJSONAndCompareOwners()
})()
