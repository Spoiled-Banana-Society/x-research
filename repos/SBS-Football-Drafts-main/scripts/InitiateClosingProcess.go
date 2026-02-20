package main

import (
	"fmt"
	"sync"

	"github.com/Spoiled-Banana-Society/SBS-Football-Drafts/models"
	"github.com/Spoiled-Banana-Society/SBS-Football-Drafts/utils"
)

func main() {
	DraftId := "2024-fast-draft-0"
	// initiate DB
	utils.NewDatabaseClient()

	fmt.Println("initiating closing process in InitiateDraftClosingProcess")

	ros := models.RosterState{
		Rosters: make(map[string]*models.DraftStateRoster),
	}
	collectionString := fmt.Sprintf("drafts/%s/state", DraftId)
	err := utils.Db.ReadDocument(collectionString, "rosters", &ros)
	if err != nil {
		fmt.Printf("Unable to read rosters")
		return
	}
	fmt.Println("Got roster map for closing sequence")

	// league info
	league := models.League{
		CurrentUsers: make([]models.LeagueUser, 0),
	}
	err = utils.Db.ReadDocument("drafts", DraftId, &league)
	if err != nil {
		fmt.Printf("Unable to read draft")
		return
	}
	fmt.Println("got league document for draft in closing sequence")

	var wg sync.WaitGroup

	for i := 0; i < len(league.CurrentUsers); i++ {
		user := league.CurrentUsers[i]
		tokenId := user.TokenId
		var token models.DraftToken
		err := utils.Db.ReadDocument("draftTokens", tokenId, &token)
		if err != nil {
			fmt.Printf("Unable to read draftTokens")
			return
		}
		r := ros.Rosters[user.OwnerId]
		if (len(r.DST) + len(r.QB) + len(r.RB) + len(r.TE) + len(r.WR)) != 15 {
			fmt.Errorf("this users roster does not have a valid lineup: %s and we are returning", user.OwnerId)
			return
		}
		ros := &models.TokenRoster{
			DST: r.DST,
			QB:  r.QB,
			RB:  r.RB,
			TE:  r.TE,
			WR:  r.WR,
		}
		token.Roster = ros
		fmt.Println("Token: ", token)
		wg.Add(1)
		fmt.Printf("Starting Closing process for card %s in %s\r", token.CardId, token.LeagueId)
		go models.AddCardToLeague(&token, &league, &wg)
	}
	wg.Wait()
	models.UpdateLeagueOnDraftClose(league)

	fmt.Printf("Finished closing draft %s. Goodbye", DraftId)
	return
}