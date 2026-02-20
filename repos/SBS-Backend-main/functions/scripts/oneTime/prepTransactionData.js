
const { readDocument } = require('../../services/db');
const db = require('../../services/db');
const api = require('../../services/api');
const { v4: uuidv4 } = require('uuid');

(async () => {
  
  //Retore Transactions from dev 
  const txIds = await api.get('https://us-central1-sbs-fantasy-dev.cloudfunctions.net/api/transaction');
  
  for(let i = 0; i < txIds.length; i++){
    const txId = txIds[i];
    let tx = await api.get(`https://us-central1-sbs-fantasy-dev.cloudfunctions.net/api/transaction/${txId}`);
    if(!tx._ownerId){
      tx._ownerId = tx.owner.toLowerCase();
    }
    tx._ownerId = tx._ownerId.toLowerCase();
    await db.createOrUpdateDocument('transactions', txId, tx, true);
    console.log(`...${i} of ${txIds.length} restored completed for ${tx._ownerId}`);
  }


  //Write all transactions from nested locations in target environment.  running this first in prod. 
  // const owners = await db.readAllDocumentIds('owners');

  // for(let i = 0; i < owners.length; i++){
  //   console.log(`...owner:${i} of ${owners.length}`);
  //   const ownerId = owners[i];
  //   const ownerTxs = await db.readAllDocumentIds(`owners/${ownerId}/transactions`);
  //   if(!ownerTxs) continue;
  //   for(let j = 0; j < ownerTxs.length; j++){
  //     console.log(`...tx:${j} of ${ownerTxs.length} `);
  //     const txHash = ownerTxs[j];
  //     let _txHash = txHash;
  //     if(txHash === 'undefined'){
  //       _txHash = `undefined-${uuidv4()}`;
  //       console.log(`...undefinedTx:${_txHash}`);
  //     }
  //     const tx = await db.readDocument(`owners/${ownerId}/transactions`, txHash);
  //     await db.createOrUpdateDocument('transactions', _txHash, tx, true);
  //   }
  // }



  process.exit(0);
})();