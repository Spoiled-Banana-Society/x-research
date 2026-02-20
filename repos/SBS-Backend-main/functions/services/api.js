const Web3 = require('web3');
require("firebase-functions/lib/logger/compat");
const internals = {};
const fetch = require('node-fetch');
const ENV = require('./env');
const ETHERSCAN_API_KEY = ENV.get('ETHERSCAN_API_KEY');
const NETWORK = ENV.get('NETWORK');
const CARD_IMAGE_CREATOR_ENDPOINT = ENV.get('CARD_IMAGE_CREATOR_ENDPOINT');
const JEFF_SBS_METADATA_API = ENV.get('JEFF_SBS_METADATA_API');
const CARD_CONTRACT_ADDRESS = (NETWORK === 'mainent') ? ENV.get('MAINNET_CARD_CONTRACT_ADDRESS') : ENV.get('TESTNET_CARD_CONTRACT_ADDRESS');
const ETHERSCAN_BASE_URL = ENV.get('ETHERSCAN_BASE_URL');
const PLAYOFFCARD_IMAGE_ENDPOINT = ENV.get('PLAYOFF_CARD_IMAGE_CREATOR_ENDPOINT')

internals.testConnection = () => console.log('...api connection test successful');

internals.get = async (url) => {
  let data;
  try {
    const res = await fetch(url);
    data = await res.json();
  } catch (error) {
    console.error(error);
  }
  return data;
}

internals.eth_getTransactionReceipt = async (txHash) => await internals.get(`${ETHERSCAN_BASE_URL}/api?module=proxy&action=eth_getTransactionReceipt&txhash=${txHash}&apikey=${ETHERSCAN_API_KEY}`);

internals.eth_getTransactionByHash = async (hash) => await internals.get(`${ETHERSCAN_BASE_URL}/api?module=proxy&action=eth_getTransactionByHash&txhash=${hash}&apikey=${ETHERSCAN_API_KEY}`);
  
internals.eth_isTransactionConfirmed = async (hash) => {
  const json = await internals.get(`${ETHERSCAN_BASE_URL}/api?module=transaction&action=gettxreceiptstatus&txhash=${hash}&apikey=${ETHERSCAN_API_KEY}`);
  if(!json.result) console.error(json);
  return json.result.status === '1' ? true : false;
};

internals.getCardImage = async (card) => {
    const body = {card};
    const options = {
      method: 'POST',
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' }
    };
    const res = await fetch("https://us-central1-sbs-prod-env.cloudfunctions.net/genesis-card-image-generator", options);
    const json = await res.json();
    if(!json) console.error(json);
    return json;
}

internals.getPlayoffCardImage = async (card) => {
  const body = {card};
  const options = {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' }
  };
  //console.log(PLAYOFFCARD_IMAGE_ENDPOINT)
  const res = await fetch("https://us-central1-sbs-prod-env.cloudfunctions.net/playoff-card-image-generator", options);
  const json = await res.json();
  if(!json) console.error(json);
  return json;
}

internals.getDraftTokenImage = async (card) => {
  const body = { "card": card };
  const options = {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' }
  };
  console.log(PLAYOFFCARD_IMAGE_ENDPOINT)
  const res = await fetch("https://us-central1-sbs-prod-env.cloudfunctions.net/draft-image-generator", options);
  const json = await res.json();
  if(!json) console.error(json);
  return json;
}

//using promise.all we can call the same API twice concurrently
internals.getMashCardImages = async (card1, card2) => {
  
  const [mashedCard1, mashedCard2] = await Promise.all([
    internals.getCardImage(card1),
    internals.getCardImage(card2),
  ]);

  await Promise.all([
    mashedCard1,
    mashedCard2,
  ]);

  return {mashedCard1, mashedCard2};

}

//using promise.all we can call the same API twice concurrently
internals.getMashPlayoffCardImages = async (card1, card2) => {
  
  const [mashedCard1, mashedCard2] = await Promise.all([
    internals.getPlayoffCardImage(card1),
    internals.getPlayoffCardImage(card2),
  ]);

  await Promise.all([
    mashedCard1,
    mashedCard2,
  ]);

  return {mashedCard1, mashedCard2};

}

internals.jeffMetadataApi = async (cardId) => {
  const url = `${JEFF_SBS_METADATA_API}/${cardId}`;
  const res = await fetch(url);
  const cardMetadata = res.json();
  return cardMetadata;
}
/**
 * This API forces a refresh of metadata in opensea for a particular token.  
 * Remember this API is throttled so you will need to implement a sleep of some sort if used in a loop. 
 * @param  {} tokenId
 */
internals.refreshOpenseaMetadata = async (tokenId) => {

  let url = `https://api.opensea.io/api/v1/asset/${ENV.get('MAINNET_CARD_CONTRACT_ADDRESS')}/${tokenId}/?force_update=true`;
  let options = {
    method: 'GET',
    headers: {
      'X-API-KEY': ENV.get('MAINNET_OPENSEA_API_KEY')
    }
  };

  if(NETWORK != 'mainnet') {
    url = `https://testnets-api.opensea.io/api/v1/asset/${ENV.get('TESTNET_CARD_CONTRACT_ADDRESS')}/${tokenId}/?force_update=true`;
    options = {};
  }

  const response = await fetch(url, options)
  if(response.ok) console.log(`...🔃   Opensea Metadata refreshed for ${tokenId}`);
  else console.error(`...⛔   Opensea Metadata update failed for ${tokenId}.  ${JSON.stringify(response)}`);
}


/**
 * This API forces a refresh of metadata in opensea for a particular token.  
 * Remember this API is throttled so you will need to implement a sleep of some sort if used in a loop. 
* @param  {} tokenId
*/
internals.refreshPlayoffOpenseaMetadata = async (tokenId) => {
  console.log(NETWORK)
  let url = `https://api.opensea.io/api/v1/asset/${ENV.get('MAINNET_PLAYOFF_CARD_CONTRACT_ADDRESS')}/${tokenId}/?force_update=true`;
  let options = {
    method: 'GET',
    headers: {
      'X-API-KEY': ENV.get('MAINNET_OPENSEA_API_KEY')
    }
  };

  if(NETWORK != 'mainnet') {
    console.log('Made it in here')
    url = `https://testnets-api.opensea.io/api/v1/asset/${ENV.get('GOERLI_PLAYOFF_CARD_CONTRACT_ADDRESS')}/${tokenId}/?force_update=true`;
    options = {};
  }

  const response = await fetch(url, options)
  if(response.ok) console.log(`...🔃   Opensea Metadata refreshed for ${tokenId}`);
  else console.error(`...⛔   Opensea Metadata update failed for ${tokenId}.  ${JSON.stringify(response)}`);
}

/**
 * This API forces a refresh of metadata in opensea for a particular token.  
 * Remember this API is throttled so you will need to implement a sleep of some sort if used in a loop. 
* @param  {} tokenId
*/
internals.refreshDraftTokenOpenseaMetadata = async (tokenId) => {
  console.log(NETWORK)
  let url = `https://api.opensea.io/api/v1/asset/0x82194174d56b6df894460e7754a9cC69a0c1707D/${tokenId}/?force_update=true`;
  let options = {
    method: 'GET',
    headers: {
      'X-API-KEY': ENV.get('MAINNET_OPENSEA_API_KEY')
    }
  };

  // if(NETWORK != 'mainnet') {
  //   console.log('Made it in here')
  //   url = `https://testnets-api.opensea.io/api/v1/asset/${ENV.get('GOERLI_PLAYOFF_CARD_CONTRACT_ADDRESS')}/${tokenId}/?force_update=true`;
  //   options = {};
  // }

  let response;
  try {
    response = await fetch(url, options)
  } catch (err) {
    console.log(err)
  }
  
  if(response.ok) console.log(`...🔃   Opensea Metadata refreshed for ${tokenId}`);
  else console.error(`...⛔   Opensea Metadata update failed for ${tokenId}.  ${JSON.stringify(response)}`);
}


internals.validateOwnershipOfComunityAsset = async (assetOwnerId, allowCommunityList) => {

  let isOwnershipValid = false;

  for(let i = 0; i < allowCommunityList.length; i++){
    const assetContractAddress = allowCommunityList[i];
    const url = `https://api.opensea.io/api/v1/assets?owner=${assetOwnerId}&asset_contract_address=${assetContractAddress}`
    let options = {
      method: 'GET',
      headers: {
        'X-API-KEY': ENV.get('MAINNET_OPENSEA_API_KEY')
      }
    }
    const res = await fetch(url, options);
    const response = await res.json();
    if (!response) return false;
    if(response.assets){
      isOwnershipValid = (response.assets.length < 1) ? false : true;
      if(isOwnershipValid) break;
    }
  }
  return isOwnershipValid;
}

module.exports = internals;
