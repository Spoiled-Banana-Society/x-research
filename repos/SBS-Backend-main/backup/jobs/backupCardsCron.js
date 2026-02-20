
import db from "../services/db.js"
import fs from "fs";

(async () => {
  const collectionName = "cards";
  let data = await db.readAllDocuments(collectionName);
  data = JSON.stringify(data);
  fs.writeFileSync('sbs-card-data-12-11-2021.json', data);
  
  process.exit(0);
})();