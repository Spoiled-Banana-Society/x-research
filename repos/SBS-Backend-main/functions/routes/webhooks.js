require("firebase-functions/lib/logger/compat");
const Web3 = require('web3');

const express = require('express');
const stat = require('../services/stat');
const webhooks = express.Router();

const SKIP = false

webhooks.post('/draftToken/transfer', async (req, res) => {
  const event = req.body;

  if (SKIP) {
    console.log("skipping events for now")
  } else {
    // iterate over events
    const web3 = new Web3()
    await Promise.all(event.data.map(async e => {
      let addressTo
      console.log(e.data)
      const tokenId = web3.eth.abi.decodeParameter("uint256", e.data.topics[3])
      try {
        addressTo = web3.eth.abi.decodeParameter("address", e.data.topics[2])
        const addressFrom = web3.eth.abi.decodeParameter("address", e.data.topics[1])
        console.log(`addressTo ${addressTo}`)
        console.log(`addressFrom ${addressFrom}`)
      } catch (e) {
        console.log("unable to parse")
        console.log(e)
      }
      
      if (tokenId) {
        console.log('into transfer')
        await stat.updateDraftTokenFromTransfer(tokenId, addressTo)
      }
    }))
  }
  
  // return response so that webhook knows that it is complete
  return res.send();
});

module.exports = webhooks;

// (async () => {
//   const web3 = new Web3()
//   const e = {
//     data: {
//       chain_id: '11155111',
//       block_number: 8334112,
//       block_hash: '0x870ea89f63c2ed89f6c9090d13af764f4d21223a7d48272050a69dea588b8f3d',
//       block_timestamp: 1747338396,
//       transaction_hash: '0x9c2bca50f8af115fbc1b8ab0bfa35e5b9d9859f8265ae3a154ac2d7bd49bdb81',
//       transaction_index: 165,
//       log_index: 472,
//       address: '0xbf732e170b17107417568891f31c52e51998669e',
//       data: '0x',
//       topics: [
//         '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef',
//         '0x0000000000000000000000000000000000000000000000000000000000000000',
//         '0x00000000000000000000000027fe00a5a1212e9294b641ba860a383783016c67',
//         '0x000000000000000000000000000000000000000000000000000000000000001f'
//       ]
//     },
//     status: 'new',
//     type: 'event',
//     id: '9c882b7b0438bbbcbb1c784c62c32effdf193504627a6f5471f1e50f6f4ec6be'
//   }

//   const decodedLogs = web3.eth.abi.decodeParameter("uint256", e.data.topics[3])
//   console.log(decodedLogs)
// })()