//PACKAGES
const jwt = require('jsonwebtoken');

//SERVICES
const env = require('./env');

const internals = {};

const JWT_SECRET = env.get('JWT_SECRET');

internals.verifyAuthToken = (token) => {
  let result;
  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      result = err.message;
      return result;
    }
    result = decoded;
  });
  return result;
}

module.exports = internals;