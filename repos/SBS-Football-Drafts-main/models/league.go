package models

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"sync"
	"time"

	"github.com/Spoiled-Banana-Society/SBS-Football-Drafts/utils"
)

type ImageGeneratorRequest struct {
	Card DraftToken `json:"card"`
}

type League struct {
	LeagueId     string       `json:"leagueId"`
	DisplayName  string       `json:"displayName"`
	CurrentUsers []LeagueUser `json:"currentUsers"`
	NumPlayers   int          `json:"numPlayers"`
	MaxPlayers   int          `json:"maxPlayers"`
	StartDate    time.Time    `json:"startDate"`
	EndDate      time.Time    `json:"endDate"`
	DraftType    string       `json:"draftType"`
	Level        string       `json:"level"`
	IsLocked     bool         `json:"isFilled"`
	ADP					 []PlayerDraftInfo 	`json:"adp"`
}

func AddCardToLeague(token *DraftToken, l *League, wg *sync.WaitGroup) error {
	defer wg.Done()
	if (len(token.Roster.DST) + len(token.Roster.QB) + len(token.Roster.RB) + len(token.Roster.TE) + len(token.Roster.WR)) != 15 {
		errMes := fmt.Sprintf("Error adding card to league: It appears the roster may be empty for %s with tokenId %s", token.OwnerId, token.CardId)
		fmt.Println(errMes)
		return fmt.Errorf(errMes)
	}

	token.SeasonScore = "0"
	token.WeekScore = "0"

	reqBody := ImageGeneratorRequest{
		Card: *token,
	}

	body, err := json.Marshal(reqBody)
	if err != nil {
		return err
	}

	// will need to call the image generation api to update imageUrl
	r, err := http.NewRequest("POST", "https://us-central1-sbs-prod-env.cloudfunctions.net/draft-image-generator", bytes.NewBuffer(body))
	if err != nil {
		fmt.Println("Error creating post request object")
		return (err)
	}

	r.Header.Add("Content-Type", "application/json")

	client := &http.Client{}
	res, err := client.Do(r)
	if err != nil {
		fmt.Println("error completing the post request to update the card to have a new card image url: ", err)
		return (err)
	}

	defer res.Body.Close()
	// need to call opensea api to update metadata

	var UpdatedDraftToken DraftToken

	err = json.NewDecoder(res.Body).Decode(&UpdatedDraftToken)
	if err != nil {
		fmt.Println("error decoding the resonse from the image generator api:  ", err)
		return err
	}

	metadata := UpdatedDraftToken.ConvertToMetadata()
	err = utils.Db.CreateOrUpdateDocument("draftTokenMetadata", UpdatedDraftToken.CardId, metadata)
	if err != nil {
		errMes := fmt.Sprintf("error updating metadata for %s in %s: %v", UpdatedDraftToken.CardId, UpdatedDraftToken.LeagueId, err)
		fmt.Println(errMes)
		return fmt.Errorf(errMes)
	}
	fmt.Println("Converted card to metadata and updated with this object: ", *metadata)

	err = utils.Db.CreateOrUpdateDocument(fmt.Sprintf("drafts/%s/cards", l.LeagueId), UpdatedDraftToken.CardId, UpdatedDraftToken)
	if err != nil {
		errMes := fmt.Sprintf("Error creating card document in draft: %v", err)
		fmt.Println(errMes)
		return fmt.Errorf(errMes)
	}

	err = utils.Db.CreateOrUpdateDocument("draftTokens", UpdatedDraftToken.CardId, UpdatedDraftToken)
	if err != nil {
		errMes := fmt.Sprintf("Error creating card document in draft: %v", err)
		fmt.Println(errMes)
		return fmt.Errorf(errMes)
	}

	err = utils.Db.CreateOrUpdateDocument(fmt.Sprintf("owners/%s/usedDraftTokens", UpdatedDraftToken.OwnerId), UpdatedDraftToken.CardId, UpdatedDraftToken)
	if err != nil {
		errMes := fmt.Sprintf("Error creating card document in draft for owners subcollection: %v", err)
		fmt.Println(errMes)
		return fmt.Errorf(errMes)
	}

	// will need to call the image generation api to update imageUrl
	// r, err = http.NewRequest("GET", fmt.Sprintf("https://api.opensea.io/api/v1/asset/0x82194174d56b6df894460e7754a9cC69a0c1707D/%s/?force_update=true", UpdatedDraftToken.CardId), nil)
	// if err != nil {
	// 	fmt.Println("Error creating post request object")
	// 	return (err)
	// }

	// r.Header.Add("Content-Type", "application/json")
	// r.Header.Add("X-API-KEY", "4c8ceceb2a39468dbcf05434e1310aa5")

	// client = &http.Client{}
	// res, err = client.Do(r)
	// if err != nil {
	// 	fmt.Println("error completing the post request to update the card to have a new card image url: ", err)
	// 	return (err)
	// }
	// fmt.Println("Updated opensea metadata")

	// defer res.Body.Close()
	fmt.Println("updated card in in DraftTokens: ", UpdatedDraftToken.CardId)
	return nil
}

func UpdateLeagueOnDraftClose(l League) error {
	l.IsLocked = true
	err := utils.Db.CreateOrUpdateDocument("drafts", l.LeagueId, l)
	if err != nil {
		fmt.Println("ERROR updating league to set it to locked: ", err)
		return err
	}
	return nil
}
