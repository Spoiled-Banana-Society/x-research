# SBS-Backend

## Steps to running locally

1.  Clone the repo
2.  Navigate to the `/functions` folder in the repo. 
3.  Ensure you are running Node version 16.16.0, NPM 8.11.0 and have the firebase cli installed.  Here is instructions for the Firebase CLI: https://firebase.google.com/docs/cli#install-cli-mac-linux
4.  Run `npm install`  4 warnings exist at the time of this writing that are related to web3.  These can be disregarded. 
5.  Run `firebase login`  Ensure you are logged in using the credentials that give you access to the project. 
6.  Run `firebase projects:list`  Ensure you have access to the project.  If not, contact other devs to give you access to the firebase project. 
7.  Make note of which environment variables are being referenced in env.js service and uncomment the code block in db.js for running locally.  Really important you do this as you don't want to be pointed at prod when doing dev work.    
8.  Rnn `npm run serve`  this will run the project locally.  Only the API functions will be emulated.  You may start hitting endpoints using the Postman workspace. 

`firebase deploy -P dev --only functions:api`

`firebase deploy -P prod --only functions:api`

For a detailed demo video of the above, you can view this here:  https://www.loom.com/share/ef6fda76951143d593a9581c87074eb3
