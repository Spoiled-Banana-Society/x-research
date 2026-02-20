const formidable = require('formidable-serverless'); 
const path = require('path');
const {Storage} = require('@google-cloud/storage');
const gc = new Storage({
  keyFilename: path.join(__dirname, '../serviceAccount.json'),
  projectId: 'sbs-fantasy-prod'
});


module.exports = async (req, res, next) => {
  console.log('...upload File middleware called');

  const form = new formidable.IncomingForm();

  const fileName = req.query.fileName;
  if(!fileName) return res.status(400).send('fileName is required');

  form.parse(req, async function(err, fields, files) {
      const bucketName = 'sbs-fantasy-prod.appspot.com';
      const filePath = files.w9.path;
      const destFileName = `1099/${fileName}.${files.w9.name.split('.')[1]}`;

      await gc.bucket(bucketName)
            .upload(filePath, { destination: destFileName })
            .catch(err => console.error(`Something went wrong with file upload: ${err}`));
  });
  
  next();
};