package models

import (
	"context"
	"fmt"
	"math/rand"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/Spoiled-Banana-Society/sbs-drafts-api/utils"
)

type DraftInfo struct {
	DraftId           string       `json:"draftId"`
	DisplayName       string       `json:"displayName"`
	DraftStartTime    int64        `json:"draftStartTime"`
	PickLength        int64        `json:"pickLength"`
	CurrentDrafter    string       `json:"currentDrafter"`
	CurrentPickNumber int          `json:"pickNumber"`
	CurrentRound      int          `json:"roundNum"`
	PickInRound       int          `json:"pickInRound"`
	DraftOrder        []LeagueUser `json:"draftOrder"`
	ADP								[]PlayerDraftInfo 	`json:"adp"`
}

func CreateDraftInfoForDraft(draftId, draftType string, currentUsers []LeagueUser, leagueInfo *League) (*DraftInfo, error) {
	var pickLength int64
	if strings.ToLower(draftType) == "fast" {
		pickLength = 30
	} else {
		pickLength = 60 * 8
	}

	draftOrder := make([]LeagueUser, len(currentUsers))
	rand.New(rand.NewSource(time.Now().UTC().UnixNano()))
	perm := rand.Perm(len(currentUsers))

	for i, v := range perm {
		draftOrder[i] = currentUsers[v]
	}

	draftStartTime := time.Now().Unix() + 60

	res := &DraftInfo{
		DraftId:           draftId,
		DisplayName:       leagueInfo.DisplayName,
		DraftStartTime:    draftStartTime,
		PickLength:        pickLength,
		CurrentDrafter:    draftOrder[0].OwnerId,
		CurrentPickNumber: 1,
		CurrentRound:      1,
		PickInRound:       1,
		DraftOrder:        draftOrder,
		ADP:							 leagueInfo.ADP,
	}

	return res, nil
}

// func findTheNextSaturday() (time.Time, error) {
// 	now := time.Now()
// 	year := now.Year()
// 	month := now.Month()
// 	day := 6
// 	hour := 18
// 	loc, err := time.LoadLocation("America/Los_Angeles")
// 	if err != nil {
// 		fmt.Println("Error finding the LA timezone or location")
// 		return time.Time{}, err
// 	}

// 	startTime := time.Date(year, month, day, hour, 0, 0, 0, loc)
// 	return startTime, nil

// }

func ReturnDraftInfoForDraft(draftId string) (*DraftInfo, error) {
	var info DraftInfo
	collectionString := fmt.Sprintf("drafts/%s/state", draftId)
	err := utils.Db.ReadDocument(collectionString, "info", &info)
	if err != nil {
		return nil, err
	}

	return &info, nil
}

func (info *DraftInfo) Update(draftId string) error {
	err := utils.Db.CreateOrUpdateDocument(fmt.Sprintf("drafts/%s/state", draftId), "info", info)
	if err != nil {
		return err
	}

	return nil
}

type DraftSummaryObject struct {
	PlayerInfo PlayerStateInfo `json:"playerInfo"`
	PfpInfo    PfpInfo         `json:"pfpInfo"`
}

type DraftSummary struct {
	Summary []DraftSummaryObject `json:"summary"`
}

func ReturnDraftSummaryForDraft(draftId string) (*DraftSummary, error) {
	var sum DraftSummary
	collectionString := fmt.Sprintf("drafts/%s/state", draftId)
	err := utils.Db.ReadDocument(collectionString, "summary", &sum)
	if err != nil {
		return nil, err
	}

	return &sum, nil
}

func CreateDraftSummaryForDraft(draftId string, draftOrder []LeagueUser) (*DraftSummary, error) {
	sum := &DraftSummary{
		Summary: make([]DraftSummaryObject, 0),
	}

	pfpMap := make(map[string]PfpInfo, 0)

	for i := 0; i < len(draftOrder); i++ {
		ownerId := draftOrder[i].OwnerId
		owner, err := ReturnOwnerObjectById(ownerId)
		if err != nil {
			fmt.Println("ERROR returning owner from ownerId: ", err)
			return nil, err
		}
		pfpMap[ownerId] = owner.PFP
	}

	pickNum := 1

	for i := 1; i <= 15; i++ {
		round := i
		for j := 1; j <= 10; j++ {
			pickInRound := j
			var drafter string
			if round%2 == 0 {
				drafter = draftOrder[len(draftOrder)-pickInRound].OwnerId
			} else {
				drafter = draftOrder[pickInRound-1].OwnerId
			}

			obj := PlayerStateInfo{
				PickNum:      pickNum,
				OwnerAddress: drafter,
				Round:        round,
			}

			data := DraftSummaryObject{
				PlayerInfo: obj,
				PfpInfo:    pfpMap[drafter],
			}
			sum.Summary = append(sum.Summary, data)
			pickNum++
		}
	}
	return sum, nil
}

func (s *DraftSummary) Update(draftId string) error {
	err := utils.Db.CreateOrUpdateDocument(fmt.Sprintf("drafts/%s/state", draftId), "summary", s)
	if err != nil {
		return err
	}

	return nil
}

type ConnectionList struct {
	List map[string]bool `json:"list"`
}

func CreateNewConnectionList(info DraftInfo) *ConnectionList {
	res := make(map[string]bool)
	for i := 0; i < len(info.DraftOrder); i++ {
		res[info.DraftOrder[i].OwnerId] = false
	}

	return &ConnectionList{
		List: res,
	}
}

func ReturnConnectionListForDraft(draftId string) (*ConnectionList, error) {
	var cl ConnectionList
	collectionString := fmt.Sprintf("drafts/%s/state", draftId)
	err := utils.Db.ReadDocument(collectionString, "connectionList", &cl)
	if err != nil {
		return nil, err
	}

	return &cl, nil
}

func (connList *ConnectionList) Update(draftId string) error {
	err := utils.Db.CreateOrUpdateDocument(fmt.Sprintf("drafts/%s/state", draftId), "connectionList", connList)
	if err != nil {
		return err
	}

	return nil
}

type RosterPlayer struct {
	Team        string `json:"team"`
	PlayerId    string `json:"playerId"`
	DisplayName string `json:"displayName"`
}

type TokenRoster struct {
	DST []RosterPlayer `json:"DST"`
	QB  []RosterPlayer `json:"QB"`
	RB  []RosterPlayer `json:"RB"`
	TE  []RosterPlayer `json:"TE"`
	WR  []RosterPlayer `json:"WR"`
}

type DraftStateRoster struct {
	DST []RosterPlayer `json:"DST"`
	QB  []RosterPlayer `json:"QB"`
	RB  []RosterPlayer `json:"RB"`
	TE  []RosterPlayer `json:"TE"`
	WR  []RosterPlayer `json:"WR"`
	PFP PfpInfo        `json:"PFP"`
}

func NewEmptyRoster(ownerId string) *TokenRoster {
	// var owner Owner
	// err := utils.Db.ReadDocument("owners", ownerId, &owner)
	// if err != nil {
	// 	fmt.Println("ERROR reading owners document ot create empty roster object: ", err)
	// 	return nil, err
	// }

	return &TokenRoster{
		DST: make([]RosterPlayer, 0),
		QB:  make([]RosterPlayer, 0),
		RB:  make([]RosterPlayer, 0),
		TE:  make([]RosterPlayer, 0),
		WR:  make([]RosterPlayer, 0),
	}
}

type RosterState struct {
	Rosters map[string]*DraftStateRoster `json:"rosters"`
}

func CreateEmptyRosterState(info DraftInfo) *RosterState {
	data := make(map[string]*DraftStateRoster)

	for i := 0; i < len(info.DraftOrder); i++ {
		var owner Owner
		err := utils.Db.ReadDocument("owners", info.DraftOrder[i].OwnerId, &owner)
		if err != nil {
			fmt.Println("Error reading owners document: ", err)
			continue
		}

		res := &DraftStateRoster{
			DST: make([]RosterPlayer, 0),
			QB:  make([]RosterPlayer, 0),
			RB:  make([]RosterPlayer, 0),
			TE:  make([]RosterPlayer, 0),
			WR:  make([]RosterPlayer, 0),
			PFP: owner.PFP,
		}

		data[info.DraftOrder[i].OwnerId] = res
	}

	return &RosterState{
		Rosters: data,
	}
}

type RosterPlayerInfo struct {
	// unique player Id will probably just be the team and position such as BUFQB
	PlayerId string `json:"playerId"`
	// holds the state object for player
	PlayerStateInfo PlayerStateInfo `json:"playerStateInfo"`
	Stats           StatsObject     `json:"stats"`
}

type FullInfoRoster struct {
	DST []RosterPlayerInfo `json:"DST"`
	QB  []RosterPlayerInfo `json:"QB"`
	RB  []RosterPlayerInfo `json:"RB"`
	TE  []RosterPlayerInfo `json:"TE"`
	WR  []RosterPlayerInfo `json:"WR"`
	PFP PfpInfo            `json:"PFP"`
}

func ReturnRostersForDraft(draftId string) (*map[string]FullInfoRoster, error) {
	var data RosterState
	collectionString := fmt.Sprintf("drafts/%s/state", draftId)
	err := utils.Db.ReadDocument(collectionString, "rosters", &data)
	if err != nil {
		return nil, err
	}

	state := make(map[string]PlayerStateInfo)
	err = utils.Db.ReadDocument(fmt.Sprintf("drafts/%s/state", draftId), "playerState", &state)
	if err != nil {
		return nil, err
	}

	stats := StatsMap{
		Players: make(map[string]StatsObject),
	}
	err = utils.Db.ReadDocument("playerStats2025", "playerMap", &stats)
	if err != nil {
		return nil, err
	}

	res := make(map[string]FullInfoRoster, 0)

	for key, roster := range data.Rosters {
		newRoster := FullInfoRoster{
			DST: make([]RosterPlayerInfo, 0),
			QB:  make([]RosterPlayerInfo, 0),
			RB:  make([]RosterPlayerInfo, 0),
			TE:  make([]RosterPlayerInfo, 0),
			WR:  make([]RosterPlayerInfo, 0),
			PFP: roster.PFP,
		}
		for i := 0; i < len(roster.DST); i++ {
			obj := roster.DST[i]
			newRoster.DST = append(newRoster.DST, RosterPlayerInfo{
				PlayerId:        obj.PlayerId,
				PlayerStateInfo: state[obj.PlayerId],
				Stats:           stats.Players[obj.PlayerId],
			})
		}
		for i := 0; i < len(roster.QB); i++ {
			obj := roster.QB[i]
			newRoster.QB = append(newRoster.QB, RosterPlayerInfo{
				PlayerId:        obj.PlayerId,
				PlayerStateInfo: state[obj.PlayerId],
				Stats:           stats.Players[obj.PlayerId],
			})
		}
		for i := 0; i < len(roster.RB); i++ {
			obj := roster.RB[i]
			newRoster.RB = append(newRoster.RB, RosterPlayerInfo{
				PlayerId:        obj.PlayerId,
				PlayerStateInfo: state[obj.PlayerId],
				Stats:           stats.Players[obj.PlayerId],
			})
		}
		for i := 0; i < len(roster.TE); i++ {
			obj := roster.TE[i]
			newRoster.TE = append(newRoster.TE, RosterPlayerInfo{
				PlayerId:        obj.PlayerId,
				PlayerStateInfo: state[obj.PlayerId],
				Stats:           stats.Players[obj.PlayerId],
			})
		}
		for i := 0; i < len(roster.WR); i++ {
			obj := roster.WR[i]
			newRoster.WR = append(newRoster.WR, RosterPlayerInfo{
				PlayerId:        obj.PlayerId,
				PlayerStateInfo: state[obj.PlayerId],
				Stats:           stats.Players[obj.PlayerId],
			})
		}
		res[key] = newRoster
	}

	return &res, nil
}

func GetDefaultPlayerState() (map[string]PlayerStateInfo, error) {
	data := make(map[string]PlayerStateInfo)

	err := utils.Db.ReadDocument("playerStats2025", "defaultPlayerDraftState", &data)
	if err != nil {
		return nil, err
	}

	return data, nil
}

func (rs *RosterState) Update(draftId string) error {
	err := utils.Db.CreateOrUpdateDocument(fmt.Sprintf("drafts/%s/state", draftId), "rosters", rs)
	if err != nil {
		return err
	}

	return nil
}

func MakeLeagueHOF(draftId string, league *League) error {
	cards, err := utils.Db.Client.Collection(fmt.Sprintf("drafts/%s/cards", draftId)).Documents(context.Background()).GetAll()
	if err != nil {
		fmt.Println("Error in reading all of the draft tokens in this league: ", err)
		return err
	}
	for i := 0; i < len(cards); i++ {
		snap := cards[i]
		var token DraftToken
		err = snap.DataTo(&token)
		if err != nil {
			fmt.Println("Error reading data into draft Token object: ", err)
			return err
		}
		token.Level = "Hall of Fame"
		err = token.updateInUseDraftTokenInDatabase(draftId)
		if err != nil {
			fmt.Println("error updating token in MakeLeagueHOF: ", err)
			return err
		}
	}
	return nil
}

func MakeLeagueJackpot(draftId string, league *League) error {
	cards, err := utils.Db.Client.Collection(fmt.Sprintf("drafts/%s/cards", draftId)).Documents(context.Background()).GetAll()
	if err != nil {
		fmt.Println("Error in reading all of the draft tokens in this league: ", err)
		return err
	}
	for i := 0; i < len(cards); i++ {
		snap := cards[i]
		var token DraftToken
		err = snap.DataTo(&token)
		if err != nil {
			fmt.Println("Error reading data into draft Token object: ", err)
			return err
		}
		token.Level = "Jackpot"
		err = token.updateInUseDraftTokenInDatabase(draftId)
		if err != nil {
			fmt.Println("error updating token in Jackpot: ", err)
			return err
		}
	}
	return nil
}

type Players struct {
	Players map[string]PlayerStateInfo `json:"players"`
}

func CreateLeagueDraftStateUponFilling(draftId string, draftType string) error {
	var leagueInfo League
	err := utils.Db.ReadDocument("drafts", draftId, &leagueInfo)
	if err != nil {
		fmt.Println("Error in reading the league document")
		return err
	}

	var counts DraftLeagueTracker
	err = utils.Db.ReadDocument("drafts", "draftTracker", &counts)
	if err != nil {
		fmt.Println("Error in reading the draft tracker document into objects")
		return err
	}

	// fetch the most recent adp to save with the draft
	adp, err := GetADP()
	if err != nil {
		fmt.Println("Error creating ADP for draft")
		return err
	}
	leagueInfo.ADP = adp

	if s := strings.ToLower(draftType); s == "fast" {
		counts.CurrentLiveDraftCount++
		counts.FilledLeaguesCount++
	} else {
		counts.CurrentSlowDraftCount++
		counts.FilledLeaguesCount++
	}

	// Initialize first batch or roll over to a new batch every 100 drafts
	if counts.BatchStart == 0 || counts.FilledLeaguesCount > counts.BatchStart+99 {
		counts.GenerateNewBatch(counts.FilledLeaguesCount)
		fmt.Printf("Generated new batch starting at %d\n", counts.FilledLeaguesCount)
	}

	leagueInfo.DisplayName = fmt.Sprintf("BBB #%d", counts.FilledLeaguesCount)
	for i := 0; i < len(counts.HofLeagueIds); i++ {
		if counts.HofLeagueIds[i] == counts.FilledLeaguesCount {
			leagueInfo.Level = "Hall of Fame"
			MakeLeagueHOF(draftId, &leagueInfo)
			counts.BatchHofHitCount++
			break
		}
	}
	for i := 0; i < len(counts.JackpotLeagueIds); i++ {
		if counts.JackpotLeagueIds[i] == counts.FilledLeaguesCount {
			leagueInfo.Level = "Jackpot"
			MakeLeagueJackpot(draftId, &leagueInfo)
			counts.BatchJackpotHit = true
			break
		}
	}

	err = utils.Db.CreateOrUpdateDocument("drafts", draftId, &leagueInfo)
	if err != nil {
		return err
	}

	err = utils.Db.CreateOrUpdateDocument("drafts", draftId, &leagueInfo)
	if err != nil {
		return err
	}

	for i := 0; i < len(leagueInfo.CurrentUsers); i++ {
		rosterObj := NewEmptyRoster(leagueInfo.CurrentUsers[i].OwnerId)
		token := DraftToken{
			Roster: rosterObj,
		}
		err = utils.Db.ReadDocument("draftTokens", leagueInfo.CurrentUsers[i].TokenId, &token)
		if err != nil {
			return err
		}

		if token.LeagueId == "" {
			token.LeagueId = draftId
			token.DraftType = draftType
		}

		token.LeagueDisplayName = leagueInfo.DisplayName
		err = token.updateInUseDraftTokenInDatabase(draftId)
		if err != nil {
			return err
		}
		fmt.Println("Updated display name on card ", leagueInfo.CurrentUsers[i].TokenId)

		// add queues
		var emptyQueue DraftQueue
		err = UpdateQueueForDraft(draftId, leagueInfo.CurrentUsers[i].OwnerId, emptyQueue)
		if err != nil {
			return err
		}
	}

	

	err = utils.Db.CreateOrUpdateDocument("drafts", "draftTracker", counts)
	if err != nil {
		return err
	}

	if len(leagueInfo.CurrentUsers) != 10 {
		return fmt.Errorf("there is not 10 users in this league so we can not make a draft state for an unfilled league")
	}

	info, err := CreateDraftInfoForDraft(draftId, leagueInfo.DraftType, leagueInfo.CurrentUsers, &leagueInfo)
	if err != nil {
		return err
	}
	if err := info.Update(draftId); err != nil {
		return err
	}

	data, err := GetDefaultPlayerState()
	if err != nil {
		return err
	}
	fmt.Println("Data returned from get default player state")

	err = utils.Db.CreateOrUpdateDocument(fmt.Sprintf("drafts/%s/state", draftId), "playerState", &data)
	if err != nil {
		return err
	}

	summary, err := CreateDraftSummaryForDraft(draftId, info.DraftOrder)
	if err != nil {
		fmt.Println("ERROR creating draft summary for draft: ", err)
		return err
	}

	if err := summary.Update(draftId); err != nil {
		return err
	}
	connList := CreateNewConnectionList(*info)
	if err := connList.Update(draftId); err != nil {
		return err
	}
	rosterMap := CreateEmptyRosterState(*info)
	if err := rosterMap.Update(draftId); err != nil {
		return err
	}

	env := os.Getenv("ENVIRONMENT")
	var baseUrl string
	if env == "prod" {
		baseUrl = os.Getenv("PROD_DRAFT_SERVER_BASE_URL")
	} else if env == "test" {
		baseUrl = os.Getenv("TEST_DRAFT_SERVER_BASE_URL")
	} else {
		baseUrl = "https://sbs-drafts-server-ajuy5qy3wa-uc.a.run.app"
	}

	r, err := http.NewRequest("POST", fmt.Sprintf("%s/draft/%s/createDraft", baseUrl, draftId), nil)
	if err != nil {
		fmt.Println("Error creating post request object")
		return (err)
	}

	r.Header.Add("Content-Type", "application/json")

	client := &http.Client{}
	res, err := client.Do(r)
	if err != nil {
		fmt.Println("error completing the post request to update the card to have a new card image url: ", err)
		return err
	}

	ref := utils.Db.RTdb.NewRef(fmt.Sprintf("drafts/%s", leagueInfo.LeagueId))

	if err := ref.Set(context.TODO(), map[string]interface{}{"numPlayers": leagueInfo.NumPlayers}); err != nil {
		fmt.Println("ERROR in setting real time database when user joins league: ", err)
		return err
	}

	defer res.Body.Close()

	return nil

}
