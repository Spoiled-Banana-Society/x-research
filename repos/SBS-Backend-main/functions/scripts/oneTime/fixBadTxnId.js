const { exist } = require('joi');
const { readDocument, createOrUpdateDocument } = require('../../services/db');
const db = require('../../services/db');

const ids = ["refundEntryFee-0xef9b402a00286b2b951782c41586882534316758-Season(Thu Sep 29 2022 - Tue Jan 03 2023)|Prize-10.8-$APE|Top-1-Paid|267-1", "refundEntryFee-0x8dedadba810ff164513e1702e3737a1fbe9647f6-Weekly(Thu Sep 29 2022 - Tue Oct 04 2022)|Prize-1.8-$APE|Top-1-Paid|273-1","refundEntryFee-0xef9b402a00286b2b951782c41586882534316758-Weekly(Thu Sep 29 2022 - Tue Oct 04 2022)|Prize-10.8-$APE|Top-3-Paid|48-1", "refundEntryFee-0x67989a8a01180818b8210f136a9ff316f0a94ab3-Weekly(Thu Sep 29 2022 - Tue Oct 04 2022)|Prize-10.8-$APE|Top-3-Paid|48-1", "refundEntryFee-0x9319af3c0a6f00eb14e04eb39b7251577140216c-Weekly(Thu Sep 29 2022 - Tue Oct 04 2022)|Prize-10.8-$APE|Top-3-Paid|48-1", "refundEntryFee-0xef9b402a00286b2b951782c41586882534316758-Weekly(Thu Sep 29 2022 - Tue Oct 04 2022)|Prize-108-$APE|Top-3-Paid|51-10", "refundEntryFee-0x293326425ec4fbda62b851efabf4eefae7871222-Weekly(Thu Sep 29 2022 - Tue Oct 04 2022)|Prize-54-$APE|Top-3-Paid|49-5", "refundEntryFee-0xef9b402a00286b2b951782c41586882534316758-Weekly(Thu Sep 29 2022 - Tue Oct 04 2022)|Prize-54-$APE|Top-3-Paid|49-5", "refundEntryFee-0xf8f9adfefd26d509af754c34eba429541babbe39-Weekly(Thu Sep 29 2022 - Tue Oct 04 2022)|Prize-54-$APE|Top-3-Paid|49-5", "refundEntryFee-0x67989a8a01180818b8210f136a9ff316f0a94ab3-Weekly(Thu Sep 29 2022 - Tue Oct 04 2022)|Prize-54-$APE|Top-3-Paid|49-5", "refundEntryFee-0x1398678864b787a37e609e1883370884fc8d30e2-Weekly(Thu Sep 29 2022 - Tue Oct 04 2022)|Prize-54-$APE|Top-3-Paid|49-5", "refundEntryFee-0xd7b5e73a434f047e9918dbf2be4375f15784188a-Weekly(Thu Sep 29 2022 - Tue Oct 04 2022)|Prize-54-$APE|Top-3-Paid|49-5"];

(async () => {
    console.log("Hello")
    console.log(ids.length);
    for (let i = 0; i < ids.length; i++) {
        const splitId = ids[i].split('-')
        const ownerId = splitId[1];
        console.log(ownerId)
        await db.deleteDocument('transactions', ids[i])
        await db.deleteDocument(`owners/${ownerId}/transactions`, ids[i])
    }
    process.exit(1)
})();