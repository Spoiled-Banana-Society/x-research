const db = require("../../services/db")

/*
    {
        availableCredit: float
        availableEthCredit: float
        blueCheckEmail: string,
        hasW9: bool
        isBlueCheckVerified: bool
        leagues: [ { leagueId: string, cardId: string} ]
        numWithdrawals: int
        pendingCredit: float
        withdrawnAmount: map[string]float
    }
*/

const updateOwnerObjects = async () => {
    // const ownerIds = await db.readAllDocumentIds('owners')
    // for(let i = 0; i < ownerIds.length; i++) {
    //     const ownerId = ownerIds[i];
        const ownerId = '0x66ffabb9cf069bfbbfe1d24f4b9fd2a881a077cd';
        let split = ownerId.split('x');
        if (split[0] != '0') {
            console.log(`${ownerId} does not seem like a valid address`)
            //continue
        }
        let obj = await db.readDocument('owners', ownerId)
        if (!obj) {
            obj = {
                AvailableCredit: 0,
                AvailableEthCredit: 0,
                BlueCheckEmail: "",
                HasW9: false,
                IsBlueCheckVerified: false,
                Leagues: [],
                NumWithdrawals: 0,
                PendingCredit: 0,
                WithdrawnAmount: {
                    "2023": 0,
                },
                PFP: {
                    ImageUrl: "",
                    NftContract: "", 
                    DisplayName: "",
                }
            }

            await db.createOrUpdateDocument('owners', ownerId, obj, false)
            console.log("created owner object for ", ownerId)
            //continue
        } else {
            obj.PFP = {
                ImageUrl: "",
                NftContract: "",
                DisplayName: ""
            }
            await db.createOrUpdateDocument('owners', ownerId, obj, false)
            console.log("updated owner object for ", ownerId)
        }

        
    //}
}

const revertOwnerObjects = async () => {
    // const ownerIds = await db.readAllDocumentIds('owners')
    // for(let i = 0; i < ownerIds.length; i++) {
    //     const ownerId = ownerIds[i];
        // let split = ownerId.split('x');
        // if (split[0] != '0') {
        //     console.log(`${ownerId} does not seem like a valid address`)
        //     continue
        // }
        const ownerId = '0x66ffabb9cf069bfbbfe1d24f4b9fd2a881a077cd';
        let obj = await db.readDocument('owners', ownerId)
        if (!obj) {
            obj = {
                AvailableCredit: 0,
                AvailableEthCredit: 0,
                BlueCheckEmail: "",
                HasW9: false,
                IsBlueCheckVerified: false,
                Leagues: [],
                NumWithdrawals: 0,
                PendingCredit: 0,
                WithdrawnAmount: {
                    "2023": 0,
                }
            }

            await db.createOrUpdateDocument('owners', ownerId, obj, false)
            console.log("created owner object for ", ownerId)
            //continue
        } else {
            obj = {
                AvailableCredit: obj.AvailableCredit,
                AvailableEthCredit: obj.AvailableEthCredit,
                BlueCheckEmail: obj.BlueCheckEmail,
                HasW9: obj.HasW9,
                IsBlueCheckVerified: obj.IsBlueCheckVerified,
                Leagues: obj.Leagues,
                NumWithdrawals: obj.NumWithdrawals,
                PendingCredit: obj.PendingCredit,
                WithdrawnAmount: {
                    "2023": obj.WithdrawnAmount['2023'],
                }
            }
            await db.createOrUpdateDocument('owners', ownerId, obj, false)
            console.log("updated owner object for ", ownerId)
        }

        
    //}
}

const revertPFPChangesInLeaderboard = async () => {

}


(async () => {
    await updateOwnerObjects()
})()