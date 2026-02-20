package models

import (
	"context"
	"fmt"
	"math/rand"
	"strings"
	"time"
	"sort"
	"cloud.google.com/go/firestore"
	"github.com/Spoiled-Banana-Society/sbs-drafts-api/utils"
)

type League struct {
	LeagueId     string       			`json:"leagueId"`
	DisplayName  string       			`json:"displayName"`
	CurrentUsers []LeagueUser 			`json:"currentUsers"`
	NumPlayers   int          			`json:"numPlayers"`
	MaxPlayers   int          			`json:"maxPlayers"`
	StartDate    time.Time    			`json:"startDate"`
	EndDate      time.Time    			`json:"endDate"`
	DraftType    string       			`json:"draftType"`
	Level        string       			`json:"level"`
	IsLocked     bool         			`json:"isFilled"`
	ADP					 []PlayerDraftInfo 	`json:"adp"`
}

type AbbrevLeague struct {
	LeagueId     string       `json:"leagueId"`
	DisplayName  string       `json:"displayName"`
	NumPlayers   int          `json:"numPlayers"`
	MaxPlayers   int          `json:"maxPlayers"`
	DraftType    string       `json:"draftType"`
	IsLocked     bool         `json:"isFilled"`
}


type LeagueUser struct {
	OwnerId string `json:"ownerId"`
	TokenId string `json:"tokenId"`
}

type DraftLeagueTracker struct {
	CurrentLiveDraftCount int   `json:"currentLiveDraftCount"`
	CurrentSlowDraftCount int   `json:"currentScheduledDraftCount"`
	FilledLeaguesCount    int   `json:"filledLeaguesCount"`
	HofLeagueIds          []int `json:"hofLeagueIds"`
	JackpotLeagueIds      []int `json:"jackpotLeagueIds"`
	BatchStart            int   `json:"batchStart"`
	BatchJackpotHit       bool  `json:"batchJackpotHit"`
	BatchHofHitCount      int   `json:"batchHofHitCount"`
}

// GenerateNewBatch creates 1 random Jackpot position and 5 random HOF positions
// within the range [batchStart, batchStart+99], then resets batch counters.
func (tracker *DraftLeagueTracker) GenerateNewBatch(batchStart int) {
	tracker.BatchStart = batchStart
	tracker.BatchJackpotHit = false
	tracker.BatchHofHitCount = 0

	// 1 Jackpot position in [batchStart, batchStart+99]
	tracker.JackpotLeagueIds = []int{batchStart + rand.Intn(100)}

	// 5 unique HOF positions, excluding the Jackpot position
	taken := make(map[int]bool)
	taken[tracker.JackpotLeagueIds[0]] = true

	tracker.HofLeagueIds = make([]int, 0, 5)
	for len(tracker.HofLeagueIds) < 5 {
		pos := batchStart + rand.Intn(100)
		if !taken[pos] {
			taken[pos] = true
			tracker.HofLeagueIds = append(tracker.HofLeagueIds, pos)
		}
	}
}

type BatchProgressResponse struct {
	Current            int `json:"current"`
	Total              int `json:"total"`
	JackpotRemaining   int `json:"jackpotRemaining"`
	HofRemaining       int `json:"hofRemaining"`
	BatchStart         int `json:"batchStart"`
	FilledLeaguesCount int `json:"filledLeaguesCount"`
}

func ReturnBatchProgress() (*BatchProgressResponse, error) {
	var draftTracker DraftLeagueTracker
	err := utils.Db.ReadDocument("drafts", "draftTracker", &draftTracker)
	if err != nil {
		fmt.Println("ERROR in reading draft Tracker: ", err)
		return nil, err
	}

	current := 0
	if draftTracker.BatchStart > 0 {
		current = draftTracker.FilledLeaguesCount - draftTracker.BatchStart + 1
		if current < 0 {
			current = 0
		}
		if current > 100 {
			current = 100
		}
	}

	jackpotRemaining := 0
	if !draftTracker.BatchJackpotHit {
		jackpotRemaining = 1
	}

	hofRemaining := 5 - draftTracker.BatchHofHitCount
	if hofRemaining < 0 {
		hofRemaining = 0
	}

	return &BatchProgressResponse{
		Current:            current,
		Total:              100,
		JackpotRemaining:   jackpotRemaining,
		HofRemaining:       hofRemaining,
		BatchStart:         draftTracker.BatchStart,
		FilledLeaguesCount: draftTracker.FilledLeaguesCount,
	}, nil
}

type Score struct {
	DST        float64 `json:"DST"`
	QB         float64 `json:"QB"`
	RB         float64 `json:"RB"`
	RB2        float64 `json:"RB2"`
	TE         float64 `json:"TE"`
	WR         float64 `json:"WR"`
	WR2        float64 `json:"WR2"`
	GameStatus string  `json:"GameStatus"`
	Team       string  `json:"Team"`
}

type Scores struct {
	FantasyPoints []Score `json:"FantasyPoints"`
}

type ScoreObject struct {
	PlayerId                   string  `json:"playerId"`
	PrevWeekSeasonContribution float64 `json:"prevWeekSeasonContribution"`
	ScoreSeason                float64 `json:"scoreSeason"`
	ScoreWeek                  float64 `json:"scoreWeek"`
	IsUsedInCardScore          bool    `json:"isUsedInCardScore"`
	Team                       string  `json:"team"`
	Position                   string  `json:"position"`
}

type ScoreRoster struct {
	DST []ScoreObject `json:"DST"`
	QB  []ScoreObject `json:"QB"`
	RB  []ScoreObject `json:"RB"`
	TE  []ScoreObject `json:"TE"`
	WR  []ScoreObject `json:"WR"`
}

type CardScores struct {
	Card                DraftToken  `json:"card"`
	CardId              string      `json:"_cardId"`
	Roster              ScoreRoster `json:"roster"`
	ScoreWeek           float64     `json:"scoreWeek"`
	ScoreSeason         float64     `json:"scoreSeason"`
	PrevWeekSeasonScore float64     `json:"prevWeekSeasonScore"`
	OwnerId             string      `json:"ownerId"`
	Level               string      `json:"level"`
	PFP                 PfpInfo     `json:"pfp"`
}

func CreateLeague(ownerId string, draftNum int, draftType string) (*League, error) {
	loc, err := time.LoadLocation("America/Los_Angeles")
	if err != nil {
		fmt.Println("Error finding the chicago timezone or location")
		return nil, err
	}
	res := &League{
		LeagueId:     fmt.Sprintf("2025-%s-draft-%d", draftType, draftNum),
		DisplayName:  fmt.Sprintf("BBB #%d", (draftNum)),
		CurrentUsers: make([]LeagueUser, 0),
		NumPlayers:   0,
		MaxPlayers:   10,
		StartDate:    time.Date(2025, time.September, 5, 0, 0, 0, 0, loc),
		EndDate:      time.Date(2025, time.December, 31, 0, 0, 0, 0, loc),
		DraftType:    draftType,
		Level:        "Pro",
		IsLocked:     false,
	}

	return res, nil
}

func contains(s []string, e string) bool {
    for _, a := range s {
        if a == e {
            return true
        }
    }
    return false
}

func JoinLeagues(ownerId string, numLeaguesToJoin int, draftType string) ([]DraftToken, error) {
	if time.Now().Unix() > int64(1092090938093) {
		err := fmt.Errorf("the deadline to join a BBB league has passed")
		return nil, err
	}

	data, err := utils.Db.Client.Collection("draftTokens").Where("OwnerId", "==", ownerId).Where("LeagueId", "==", "").Documents(context.Background()).GetAll()
	if err != nil {
		return nil, err
	}

	if len(data) < numLeaguesToJoin {
		err := fmt.Errorf("there does not seem to be enough valid draft tokens needed to enter into this number of leagues: You have %d / %d valid tokens", len(data), numLeaguesToJoin)
		return nil, err
	}

	// read document from db that tracks the amount of filled draft leagues there are for each type
	var counts DraftLeagueTracker
	err = utils.Db.ReadDocument("drafts", "draftTracker", &counts)
	if err != nil {
		fmt.Println("Error in reading the draft tracker document into objects")
		return nil, err
	}

	var currentDraft int
	if s := strings.ToLower(draftType); s == "fast" {
		currentDraft = counts.CurrentLiveDraftCount
	} else {
		currentDraft = counts.CurrentSlowDraftCount
	}

	res := make([]DraftToken, 0)

	for i := 0; i < numLeaguesToJoin; i++ {
		var t DraftToken
		err := data[i].DataTo(&t)
		if err != nil {
			return nil, err
		}

		// if Environment == "prod" {
		// 	cardNum, _ := strconv.ParseInt(t.CardId, 10, 64)
		// 	contractOwner, _ := utils.Contract.GetOwnerOfToken(int(cardNum))
		// 	if strings.ToLower(contractOwner) != strings.ToLower(t.OwnerId) {
		// 		fmt.Println("This owner does not match the contract owner for ", t.CardId)
		// 		return nil, fmt.Errorf("trying to add a card to a league that this owner does not have")
		// 	}
		// }
		currentDraft, err = AddCardToLeague(&t, currentDraft, draftType)
		if err != nil {
			return nil, err
		}
		res = append(res, t)
	}

	return res, nil
}

func AddCardToLeague(token *DraftToken, currentFilledDraftNum int, draftType string) (int, error) {
	currentDraftNum := currentFilledDraftNum + 1
	var draftId string
	var l League

	// find the right league to add the card to ensuring that this owner does not already have a token in that league
	for {
		draftId = fmt.Sprintf("2025-%s-draft-%d", draftType, currentDraftNum)
		err := utils.Db.ReadDocument("drafts", draftId, &l)
		if err != nil {
			s := err.Error()
			if res := strings.Contains(s, "code = NotFound"); res {
				league, err := CreateLeague(token.OwnerId, currentDraftNum, draftType)
				if err != nil {
					return -1, err
				}
				l = *league
				err = utils.Db.CreateOrUpdateDocument("drafts", l.LeagueId, &league)
				if err != nil {
					return -1, err
				}
			} else {
				return -1, err
			}
		}

		leagueRef := utils.Db.Client.Collection("drafts").Doc(l.LeagueId)
		fmt.Println(leagueRef)
		err = utils.Db.Client.RunTransaction(context.Background(), func(ctx context.Context, tx *firestore.Transaction) error {
			doc, err := tx.Get(leagueRef) // tx.Get, NOT ref.Get!
			if err != nil {
				return err
			}

			var league League
			err = doc.DataTo(&league)
			if err != nil {
				return err
			}
			fmt.Println("league inside of tx: ", league)

			if league.NumPlayers == 10 {
				fmt.Printf("%s is now locked so we are returning an error string to trigger the for loop to continue\r", l.LeagueId)
				return fmt.Errorf("try the next leagueId")
			}
			isValid := true
			for j := 0; j < len(l.CurrentUsers); j++ {
				if l.CurrentUsers[j].OwnerId == token.OwnerId {
					isValid = false
				}
			}
			if !isValid {
				fmt.Printf("%s is already in %s so we are continuing", token.OwnerId, l.LeagueId)
				return fmt.Errorf("try the next leagueId")
			}

			league.CurrentUsers = append(league.CurrentUsers, LeagueUser{OwnerId: token.OwnerId, TokenId: token.CardId})
			league.NumPlayers++
			l = league
			return tx.Set(leagueRef, &league)
		})
		if err != nil {
			if err.Error() != "try the next leagueId" {
				return -1, err
			}
		} else {
			break
		}
		currentDraftNum++
	}

	token.LeagueId = l.LeagueId
	token.DraftType = draftType
	token.LeagueDisplayName = l.DisplayName

	// add card to league
	err := token.updateInUseDraftTokenInDatabase(draftId)
	if err != nil {
		return -1, err
	}

	_, err = utils.Db.Client.Collection(fmt.Sprintf("owners/%s/validDraftTokens", token.OwnerId)).Doc(token.CardId).Delete(context.Background())
	if err != nil {
		return -1, err
	}

	if l.NumPlayers == 10 {
		err := CreateLeagueDraftStateUponFilling(draftId, draftType)
		if err != nil {
			fmt.Println("error creating draft state upon league filling: ", err)
			RemoveUserFromDraftWithRTBUpdate(token.CardId, token.OwnerId, l.LeagueId, false)
			fmt.Printf("Removed user from draft after it failed to complete the draft state for %v with error: %v", token, err)
			return -1, err
		}
	}
	ref := utils.Db.RTdb.NewRef(fmt.Sprintf("drafts/%s", l.LeagueId))

	if err := ref.Set(context.TODO(), map[string]interface{}{"numPlayers": l.NumPlayers}); err != nil {
		fmt.Println("ERROR in setting real time database when user joins league: ", err)
		return -1, err
	}

	return currentDraftNum, nil
}

func RemoveUserFromDraftWithRTBUpdate(tokenId, ownerId, draftId string, withRTBUpdate bool) (bool, error) {
	var l League

	leagueRef := utils.Db.Client.Collection("drafts").Doc(draftId)
	err := utils.Db.Client.RunTransaction(context.Background(), func(ctx context.Context, tx *firestore.Transaction) error {
		doc, err := tx.Get(leagueRef)
		if err != nil {
			return err
		}

		var league League
		if err := doc.DataTo(&league); err != nil {
			return err
		}

		if league.NumPlayers == 10 {
			fmt.Printf("%s is now locked so we are returning an error string to trigger the for loop to continue\r", l.LeagueId)
			return fmt.Errorf("you cannot leave this draft as it already has 10 members")
		}

		isInLeague := false
		newCurrentUsers := make([]LeagueUser, 0)
		fmt.Printf("Requested Ownerid: %s, requested tokenId: %s\r", ownerId, tokenId)
		fmt.Printf("League Data: %v", league)
		for i := 0; i < len(league.CurrentUsers); i++ {
			fmt.Printf("OwnerId: %s, TokenId: %s\r", league.CurrentUsers[i].OwnerId, league.CurrentUsers[i].TokenId)
			if league.CurrentUsers[i].OwnerId == ownerId && league.CurrentUsers[i].TokenId == tokenId {
				isInLeague = true
			} else {
				newCurrentUsers = append(newCurrentUsers, league.CurrentUsers[i])
			}
		}
		if !isInLeague {
			return fmt.Errorf("this user was not found to be in the current User array of the draft league")
		}

		league.CurrentUsers = newCurrentUsers
		league.NumPlayers--
		l = league
		return tx.Set(leagueRef, &league)
	})
	if err != nil {
		return false, err
	}

	var token DraftToken
	err = utils.Db.ReadDocument("draftTokens", tokenId, &token)
	if err != nil {
		return false, err
	}

	err = token.RemoveTokenFromLeague()
	if err != nil {
		return false, err
	}

	if withRTBUpdate {
		ref := utils.Db.RTdb.NewRef(fmt.Sprintf("drafts/%s", l.LeagueId))
		if err := ref.Set(context.TODO(), map[string]interface{}{"numPlayers": l.NumPlayers}); err != nil {
			fmt.Println("Error in updating real time database when player leaves draft: ", err)
			return false, err
		}
	}

	return true, nil
}

func GetCardFromLeagueAndOwner(draftId, ownerId string) (*DraftToken, error) {
	var league League

	err := utils.Db.ReadDocument("drafts", draftId, &league)
	if err != nil {
		fmt.Println("ERROR reading draft document: ", err)
		return nil, err
	}

	tokenId := ""
	for i := 0; i < len(league.CurrentUsers); i++ {
		obj := league.CurrentUsers[i]
		if strings.EqualFold(obj.OwnerId, ownerId) {
			tokenId = obj.TokenId
		}
	}

	if tokenId == "" {
		fmt.Println("could not find this user in the leagues current users so we are returning")
		return nil, fmt.Errorf("could not find this user in the leagues current users so we are returning")
	}

	var token DraftToken
	err = utils.Db.ReadDocument(fmt.Sprintf("drafts/%s/cards", strings.ToLower(draftId)), tokenId, &token)
	if err != nil {
		fmt.Println("ERROR reading token from inside of league: ", err)
		return nil, err
	}

	return &token, nil

}

func ReturnNumberOfFilledLeagues() (int, error) {
	var draftTracker DraftLeagueTracker
	err := utils.Db.ReadDocument("drafts", "draftTracker", &draftTracker)
	if err != nil {
		fmt.Println("ERROR in reading draft Tracker: ", err)
		return -1, err
	}

	return (draftTracker.FilledLeaguesCount - 1), nil
}

func ReturnUnfilledLeagues() ([]AbbrevLeague, error) {
	var draftTracker DraftLeagueTracker
	err := utils.Db.ReadDocument("drafts", "draftTracker", &draftTracker)
	if err != nil {
		fmt.Println("ERROR in reading draft Tracker: ", err)
		return nil, err
	}

	var allUnfilledDrafts []AbbrevLeague
	nextDraftNum := draftTracker.FilledLeaguesCount + 1
	for {
		var draftInfo AbbrevLeague

		err := utils.Db.ReadDocument("drafts", fmt.Sprintf("%d-fast-draft-%d", 2025, nextDraftNum), &draftInfo)

		if err != nil {
			break
		} else {
			allUnfilledDrafts = append(allUnfilledDrafts, draftInfo)
		}

		nextDraftNum += 1
	}

	return allUnfilledDrafts, nil
}

func ReturnLeagues(unfilled bool) ([]AbbrevLeague, error) {
	var draftTracker DraftLeagueTracker
	err := utils.Db.ReadDocument("drafts", "draftTracker", &draftTracker)
	if err != nil {
		fmt.Println("ERROR in reading draft Tracker: ", err)
		return nil, err
	}

	var allLeagues []AbbrevLeague
	nextDraftNum := 1
	
	for {
		var draftInfo AbbrevLeague

		err := utils.Db.ReadDocument("drafts", fmt.Sprintf("%d-fast-draft-%d", 2025, nextDraftNum), &draftInfo)

		if err != nil {
			if (nextDraftNum > draftTracker.FilledLeaguesCount) {
				// only break if we are past the current drafts
				break
			}
		} else {
			// if we are stopping before showing unfilled leagues break here
			if !unfilled && draftInfo.NumPlayers < draftInfo.MaxPlayers {
				break
			}

			allLeagues = append(allLeagues, draftInfo)
		}

		nextDraftNum += 1
	}

	return allLeagues, nil
}

type AllDraftTokensLeaderborad struct {
	Leaderboard  []CardScores `json:"leaderboard"`
	OwnersTokens []CardScores `json:"ownersTokens"`
}

func ReturnAllDraftTokenLeaderboard(gameweek, orderBy, ownerId, level string) (AllDraftTokensLeaderborad, error) {
	if gameweek == "" || orderBy == "" {
		fmt.Println("either the gameweek or order by was an empty string")
		return AllDraftTokensLeaderborad{}, fmt.Errorf("either the gameweek or order by was an empty string")
	}
	leaderboard := make([]CardScores, 0)
	ownersTokens := make([]CardScores, 0)
	allDraftTokens :=  make(map[string]DraftToken)

	//data, err := utils.Db.Client.Collection(fmt.Sprintf("draftTokenLeaderboard/%s/cards", gameweek)).Documents(context.Background()).GetAll()
	var data []*firestore.DocumentSnapshot
	var err error

	if level != "Pro" {
		data, err = utils.Db.Client.Collection(fmt.Sprintf("draftTokenLeaderboard/%s/cards", gameweek)).Where("Level", "==", level).OrderBy(orderBy, firestore.Direction(1)).Documents(context.Background()).GetAll()
		if err != nil {
			fmt.Println("ERROR reading all draft token card scores in the draftTokenLeaderboard collection: ", err)
			return AllDraftTokensLeaderborad{}, err
		}
	} else {
		data, err = utils.Db.Client.Collection(fmt.Sprintf("draftTokenLeaderboard/%s/cards", gameweek)).OrderBy(orderBy, firestore.Direction(1)).Documents(context.Background()).GetAll()
		if err != nil {
			fmt.Println("ERROR reading all draft token card scores in the draftTokenLeaderboard collection: ", err)
			return AllDraftTokensLeaderborad{}, err
		}
	}

	// make map of all tokens
	_allDraftTokens, err := utils.Db.Client.Collection("draftTokens").Documents(context.Background()).GetAll()
	for i := (len(_allDraftTokens) - 1); i >= 0; i-- {
		var token DraftToken
		err = _allDraftTokens[i].DataTo(&token)

		allDraftTokens[token.CardId] = token
	}

	for i := (len(data) - 1); i >= 0; i-- {
		var tokenScore CardScores
		err = data[i].DataTo(&tokenScore)
		if err != nil {
			fmt.Println("Error reading token score data from snapshot into data object: ", err)
			return AllDraftTokensLeaderborad{}, err
		}

		// use true card in leaderboard so we know it is using most up to date information
		tokenScore.Card = allDraftTokens[tokenScore.Card.CardId]

		//leaderboard[99-i] = tokenScore
		leaderboard = append(leaderboard, tokenScore)

		if strings.EqualFold(tokenScore.OwnerId, ownerId) {
			fmt.Println("Found a token for this user")
			ownersTokens = append(ownersTokens, tokenScore)
		}
	}

	return AllDraftTokensLeaderborad{Leaderboard: leaderboard, OwnersTokens: ownersTokens}, nil
}

func ReturnDraftLeagueLeaderboard(gameweek, ownerId, draftId, orderBy string) (AllDraftTokensLeaderborad, error) {
	if gameweek == "" || ownerId == "" || draftId == "" || orderBy == "" {
		fmt.Println("either the gameweek, ownerId, or draftid was an empty string")
		return AllDraftTokensLeaderborad{}, fmt.Errorf("either the gameweek, ownerId, or draftid was an empty string")
	}
	leaderboard := make([]CardScores, 0)
	ownersTokens := make([]CardScores, 0)

	//data, err := utils.Db.Client.Collection(fmt.Sprintf("draftTokenLeaderboard/%s/cards", gameweek)).Documents(context.Background()).GetAll()
	data, err := utils.Db.Client.Collection(fmt.Sprintf("drafts/%s/scores/%s/cards", draftId, gameweek)).OrderBy(orderBy, firestore.Direction(1)).Documents(context.Background()).GetAll()
	if err != nil {
		fmt.Println("ERROR reading all draft token card scores in the draftTokenLeaderboard collection: ", err)
		return AllDraftTokensLeaderborad{}, err
	}
	fmt.Println("Length of response: ", len(data))

	for i := len(data) - 1; i >= 0; i-- {
		var tokenScore CardScores
		err = data[i].DataTo(&tokenScore)
		if err != nil {
			fmt.Println("Error reading token score data from snapshot into data object: ", err)
			return AllDraftTokensLeaderborad{}, err
		}
		fmt.Println("Token: ", tokenScore)
		//leaderboard[9-i] = tokenScore
		leaderboard = append(leaderboard, tokenScore)
		if strings.EqualFold(tokenScore.OwnerId, ownerId) {
			fmt.Println("Found a token for this user")
			ownersTokens = append(ownersTokens, tokenScore)
		}

		fmt.Println("CardScore: ", tokenScore)
	}

	return AllDraftTokensLeaderborad{Leaderboard: leaderboard, OwnersTokens: ownersTokens}, nil
}

func GetADP() ([]PlayerDraftInfo, error) {
	var playerMap PlayerMap
	err := utils.Db.ReadDocument("playerStats2025", "playerMap", &playerMap)
	if err != nil {
		return nil, err
	}

	playerRanksLength := len(playerMap.Players)
	
	adp := make([]PlayerDraftInfo, playerRanksLength)
	withAdp := make([]PlayerDraftInfo, 0)
	noAdp := make([]PlayerDraftInfo, 0)

	// split into players that have an adp an those that don't
	for _, p := range playerMap.Players {
		// ADP of 0 indicates unranked
		if p.ADP > 0 {
			withAdp = append(withAdp, *p)
		} else {
			noAdp = append(noAdp, *p)
		}
	}

	// sort players with adp
	sort.Slice(withAdp, func(i, j int) bool {return withAdp[i].ADP < withAdp[j].ADP})

	adpCtn := 1

	for i := 0; i < len(withAdp); i++ {
		withAdpRank := PlayerDraftInfo{
			PlayerId: withAdp[i].PlayerId,
			ADP: int64(adpCtn),
		}

		adp[adpCtn - 1] = withAdpRank

		adpCtn += 1
	}

	for i := 0; i < len(noAdp); i++ {
		noAdpRank := PlayerDraftInfo{
			PlayerId: noAdp[i].PlayerId,
			ADP: int64(adpCtn),
		}

		adp[adpCtn - 1] = noAdpRank

		adpCtn += 1
	}

	if err != nil {
		return nil, err
	}

	return adp, nil
}
