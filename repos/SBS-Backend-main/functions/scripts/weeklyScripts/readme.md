## Weekly Scripts


WEEK TRANSITION PROCESS

1. First step I usually did was to run the scoring function again to make sure that everything is up to date. At the bottom of the addPrizesToDraftTokens.js you can comment out the where the prize function is kicked off and uncomment that function at the bottom that will read in the scores and then call the scoreDraftTokens endpoint
2. While that runs you can also turn off statsEngine as that only needs to be ran when there are games going on by going to firebase cloud scheduler. You can also turn off the updateRankInTokens cron as well. just make sure you turn them any time a game is going on

2. Go to the scripts/weeklyScripts directory
3. Select addPrizesToDraftTokens.js and scroll to the bottom and ensure that the script is going to run for the correct gameweek
4. If the gameweek is correct, then run `node addPrizesToDraftTokens.js` and that will fetch the leaderboard and pay out all of the draft tokens for that week

5. Next you need to create the documents needed for the coming gameweek which will be running two scripts
6. select createNewWeekForBBB.js and ensure that the two gameweek variables are set correctly for the week you want to run this for
7. run `node createNewWeekForBBB.js` ..... this may take a little bit since we have more draft tokens this year
8. Open up a second terminal in the same location so that you can run the genesis script at the same time
9. Select createNewWeekForScoresAndLineups.js. There is 3 seperate functions in this file that you need to run
10. The first one will be to transition genesis league to a new week. Since there are 10,000 genesis cards you can either run the script as is and loop through all 10,000 of them or do what I used to do and edit the for loop in the script to do intervals of 2000 cards and then I would open 5 different terminals and score each interval seperately
11. run `node createNewWeekForScoresAndLineups.js`


WITHDRAWAL PROCESS

1. Go to the database and use the filter to return all withdrawal requests that have a value of false for field "sentToTeam" and then look through them and check for any of them that aren't bluecheck verified or it says they need a w9 which are both just boolean fields in the withdrawal requests document

2. If any have needsw9 go to their owner document and get their email to send to the guys so they can contact them to get the w9 form, but also double check their owner document to make sure that they have not up actually sent their w9 already as sometimes it is weird with that

3. Once you have verified the withdrawal requests all you have to do now is run `node generateWithdrawalCSV.js`


SEASON END STUFF

1. all of the scripts you need to run can be found in the 2023PlayoffScripts for BBB. You will need to do some refactoring for the new year and update the prize amounts but it should be quick