//PACKAGES
require("firebase-functions/lib/logger/compat");
const CryptoJS = require('crypto-js');

//SERVICES

const internals = {};

internals.encrypt = (text, passphrase) => {
  console.log('...🔣 ENCRYPT data');
  if(!passphrase) throw new Error('No passphrase sent')
  if(typeof(text) === 'object'){
    text = JSON.stringify(text);
  }
  const cipher = CryptoJS.AES.encrypt(text, passphrase).toString();
  return cipher;
}

internals.decrypt = (cipherText, passphrase) => {
  console.log('...🔠 DECRYPT data');
  if(!passphrase) throw new Error('No passphrase sent')
  const bytes = CryptoJS.AES.decrypt(cipherText, passphrase);
  const originalText = bytes.toString(CryptoJS.enc.Utf8);
  return originalText;
} 

module.exports = internals;