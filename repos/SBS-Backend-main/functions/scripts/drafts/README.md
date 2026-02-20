# Setting up a new year

Make sure you env is set correctly between test and prod.

### Create new data structures in db
1. Change SEASON and LAST SEASON in functions/constants/season.js
2. Search and replace all instances of playerStatsYYYY with new season (or set it up so that they are DRY but in lots of repos)
2. Run functions/scripts/drafts/createEmptyPlayerState.js to create new player state data
3. Run functions/scripts/drafts/updateRankingsToNew.js to add rankings (change array of rankings first)
4. Clear rankings from owners Run functions/scripts/drafts/clearDraftRankings.js

### Draft Tokens

We need to clear out all draftTokens for the new season. Note that draft tokens can be recreated from the smart contract if necessary.

1. Clear all owners valid and used draft tokens. Run functions/drafts/clearOwnerDraftTokens.js
2. Clear draftTokens and draftTokenMetadata. Run functions/drafts/clearDraftTokens.js

We can leave the drafts alone. They inheriently use the year, however, you should go in a reset /drafts/draftTracker manually

### Launch Smart Contract

Smart contract found at functions/drafts/baseContract.sol

Deploy it and find and replace all areas that the contract address is hardcoded.

You will also need to setup a thirdweb webhook for the new contract 