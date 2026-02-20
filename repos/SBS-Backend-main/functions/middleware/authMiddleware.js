//PACKAGES
require("firebase-functions/lib/logger/compat");

//SERVICES
const auth = require('../services/auth');

module.exports = async (req, res, next) => {
  const body = req.body;
  const authHeader = req.headers['authorization']
  if(body) {
    if(authHeader == 'Bearer bluecheck' && body.isBlueCheckVerified != undefined && body.email != undefined) {
      return next();
    }
    if(authHeader == 'Bearer bluecheck' && body.needsToCancel != undefined) {
      return next();
    }
  }
  const token = authHeader && authHeader.split(' ')[1]
  if (token == null) return res.sendStatus(401)

  const result = auth.verifyAuthToken(token);
  
  if(result === 'invalid signature') return res.status(403).send('Unauthroized: Invalid Token Signature');
  if(result.name && result.name.toLowerCase() === 'sbs') return next();
  else {
    res.status(403).send('Unauthorized');
  }
};