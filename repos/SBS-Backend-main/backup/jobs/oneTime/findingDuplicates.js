const sbsUtils = require("./services/sbs");
const utils = require("./services/utils");
const db = require("./services/db");
const web3Utils = require("./services/web3");
const fs = require("fs");

(async () => {

    /* finding duplicates */

    let card1;
    let card2;
    let cards;
    const arrOfPotentialDuplicates = [
      {card1:5000, card2:4448},
      {card1:5001, card2:4449},
      {card1:5002, card2:4450},
      {card1:5003, card2:4451},
      {card1:5004, card2:4452},
      {card1:5005, card2:4453},
      {card1:5006, card2:4454},
      {card1:5007, card2:4455},
      {card1:5008, card2:4456},
      {card1:5009, card2:4457},
      {card1:5010, card2:4459},
      {card1:5011, card2:4460},
      {card1:5012, card2:4461},
      {card1:5013, card2:4462},
      {card1:5014, card2:4463},
      {card1:5015, card2:4464},
      {card1:5016, card2:4465},
      {card1:5017, card2:4466},
      {card1:5018, card2:4467},
      {card1:5019, card2:4468},
      {card1:5020, card2:4470},
      {card1:5021, card2:4471},
      {card1:5022, card2:4472},
      {card1:5023, card2:4473},
      {card1:5024, card2:4474},
      {card1:5025, card2:4475},
      {card1:5026, card2:4476},
      {card1:5027, card2:4477},
      {card1:5028, card2:4478},
      {card1:5029, card2:4479},
      {card1:5030, card2:4481},
      {card1:5031, card2:4482},
      {card1:5032, card2:4483},
      {card1:5033, card2:4484},
      {card1:5034, card2:4485},
      {card1:5035, card2:4486},
      {card1:5036, card2:4487},
      {card1:5037, card2:4488},
      {card1:5038, card2:4489},
      {card1:5039, card2:4490},
      {card1:5040, card2:4492},
      {card1:5041, card2:4493},
      {card1:5042, card2:4494},
      {card1:5043, card2:4495},
      {card1:5044, card2:4496},
      {card1:5045, card2:4497},
      {card1:5046, card2:4498},
      {card1:5047, card2:4499},
      {card1:5048, card2:4500},
      {card1:5049, card2:4501},
      {card1:5050, card2:4503},
      {card1:5051, card2:4504},
      {card1:5052, card2:4505},
      {card1:5053, card2:4506},
      {card1:5054, card2:4507},
      {card1:5055, card2:4508},
      {card1:5056, card2:4509},
      {card1:5057, card2:4510},
      {card1:5058, card2:4511},
      {card1:5059, card2:4512},
      {card1:5060, card2:4514},
      {card1:5061, card2:4515},
      {card1:5062, card2:4516},
      {card1:5063, card2:4517},
      {card1:5064, card2:4518},
      {card1:5065, card2:4519},
      {card1:5066, card2:4520},
      {card1:5067, card2:4521},
      {card1:5068, card2:4522},
      {card1:5069, card2:4523},
      {card1:5070, card2:4525},
      {card1:5071, card2:4526},
      {card1:5072, card2:4527},
      {card1:5073, card2:4528},
      {card1:5074, card2:4529},
      {card1:5075, card2:4530},
      {card1:5076, card2:4531},
      {card1:5077, card2:4532},
      {card1:5078, card2:4533},
      {card1:5079, card2:4534},
      {card1:5080, card2:4536},
      {card1:5081, card2:4537},
      {card1:5082, card2:4538},
      {card1:5083, card2:4539},
      {card1:5084, card2:4540},
      {card1:5085, card2:4541},
      {card1:5086, card2:4542},
      {card1:5087, card2:4543},
      {card1:5088, card2:4544},
      {card1:5089, card2:4545},
      {card1:5090, card2:4547},
      {card1:5091, card2:4548},
      {card1:5092, card2:4549},
      {card1:5093, card2:4550},
      {card1:5094, card2:4551},
      {card1:5095, card2:4552},
      {card1:5096, card2:4553},
      {card1:5097, card2:4554},
      {card1:5098, card2:4555},
      {card1:5099, card2:4556},
      {card1:5100, card2:4559},
      {card1:5101, card2:4560},
      {card1:5102, card2:4561},
      {card1:5103, card2:4562},
      {card1:5104, card2:4563},
      {card1:5105, card2:4564},
      {card1:5106, card2:4565},
      {card1:5107, card2:4566},
      {card1:5108, card2:4567},
      {card1:5109, card2:4568},
      {card1:5110, card2:4570},
      {card1:5111, card2:4571},
      {card1:5112, card2:4572},
      {card1:5113, card2:4573},
      {card1:5114, card2:4574},
      {card1:5115, card2:4575},
      {card1:5116, card2:4576},
      {card1:5117, card2:4577},
      {card1:5118, card2:4578},
      {card1:5119, card2:4579},
      {card1:5120, card2:4581},
      {card1:5121, card2:4582},
      {card1:5122, card2:4583},
      {card1:5123, card2:4584},
      {card1:5124, card2:4585},
      {card1:5125, card2:4586},
    ];
  
    let allConfirmedDuplicates = [];
  
    for(let i = 0; i < arrOfPotentialDuplicates.length; i++){
      cards = arrOfPotentialDuplicates[i];
      card1 = await db.readDocument("cards", cards.card1.toString());
      card2 = await db.readDocument("cards", cards.card2.toString());
    
      let isDuplicate = false;
      let duplicateCount = 0;
    
      for (let i = 0; i < card1.attributes.length; i++) {
      
        if (card1.attributes[i].value === card2.attributes[i].value) {
          isDuplicate = true;
          duplicateCount++;
          console.log(`${card1.attributes[i].value} : ${card2.attributes[i].value}`);
        }
    
      }
    
      if(isDuplicate && duplicateCount == 16) {
        allConfirmedDuplicates.push(cards);
        console.log(`token ${card1._tokenId} is a duplicate of ${card2._tokenId}`);
      } else {
        console.log("no duplicates");
      }
    }
    console.log('------------------------------------');
    console.log(`Duplicate list count:${allConfirmedDuplicates.length}`);
    console.log('------------------------------------');
    console.log(allConfirmedDuplicates);
  
    process.exit(0);


})();