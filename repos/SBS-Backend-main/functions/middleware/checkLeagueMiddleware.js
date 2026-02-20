//PACKAGES
const Joi = require('joi');
require("firebase-functions/lib/logger/compat");

//SERVICES

//JOI SCHEMA
const leagueSchema = Joi.object({
  _templateName: Joi.string().required(),
  leagueName: Joi.string().optional(),
  useCustomLeagueName: Joi.boolean().required(),
  gameWeek: Joi.string().required(),
  metadata: Joi.object({
    creatorAddress: Joi.string().required()
  }).required(),
  duration: Joi.object({
    start: Joi.string().isoDate().required(),
    end: Joi.string().isoDate().required()
  }).required(),
  game: Joi.object({
    type: Joi.string().valid('highest', 'lowest', 'other').required(),
    description: Joi.string().required(),
    minPlayers: Joi.number().required(),
    maxPlayers: Joi.number().required(),
    isPlayoff: Joi.boolean().required(),
    isOneCardPerOwner: Joi.boolean().required(),
    isRegenerating: Joi.boolean().required(),
    isAllowList: Joi.boolean().required(),
    isCommunityGated: Joi.boolean().required(),
    regenerationBatchSize: Joi.number().required(),
    allowList: Joi.array().items(Joi.string()).required(),
    communityList: Joi.array().items(Joi.string()).required(),
  }),
  entry: Joi.object({
    isEntryFee: Joi.boolean().required(),
    coin: Joi.string().valid('$APE').required(),
    fee: Joi.number().required(),
    royaltyPercentage: Joi.number().min(0).max(100).required(),
    levels: Joi.array().items(Joi.string().valid('Pro', 'Hall of Fame', 'Spoiled Pro', 'Spoiled Hall of Fame')),
  }).required(),
  prize: Joi.object({
    coin: Joi.object({
      isCoinPrize: Joi.boolean().required(),
      pot: Joi.number().positive().required(),
      numPlacesPaid: Joi.number().integer().required(),
      placesPaid: Joi.array().items(Joi.object({
        rank: Joi.number().positive().required(),
        potPercentage: Joi.number().positive().required()
      })).length(Joi.ref('..numPlacesPaid')),
    }).required(),
    other: Joi.object({
      isOther: Joi.boolean().required(),
      description: Joi.string().optional()
    }).optional()
  })
})
// .options({
//   allowUnknown: true
// });  //TODO: Once this shape is fairly constant, we remove this and lock this down to prevent issues


//MIDDLEWARE
module.exports = async (req, res, next) => {
  console.log('...checkLeagueMiddleware called');
  
  try{
    const league = await leagueSchema.validateAsync(req.body);
    console.log(`...✅   new league from template:${league._templateName} passed checkLeagueMiddleware`);
    next();
  } catch(err) {
    console.error(`...❌   new league from template failed checkLeagueMiddleware`)
    res.status(400).send(err.details[0].message);
  }

};
