package models

import (
	"fmt"

	"github.com/Spoiled-Banana-Society/SBS-Football-Drafts/utils"
)

type Prizes struct {
	ETH float64 `json:"ETH"`
}

type DraftToken struct {
	Roster            *TokenRoster `json:"roster"`
	DraftType         string       `json:"_draftType"`
	CardId            string       `json:"_cardId"`
	ImageUrl          string       `json:"_imageUrl"`
	Level             string       `json:"_level"`
	OwnerId           string       `json:"_ownerId"`
	LeagueId          string       `json:"_leagueId"`
	LeagueDisplayName string       `json:"_leagueDisplayName"`
	Rank              string       `json:"_rank"`
	LeagueRank        string       `json:"_leagueRank"`
	WeekScore         string       `json:"_weekScore"`
	SeasonScore       string       `json:"_seasonScore"`
	Prizes            Prizes       `json:"prizes"`
}

type Metadata struct {
	Description string          `json:"description"`
	Name        string          `json:"name"`
	Image       string          `json:"image"`
	Attributes  []AttributeType `json:"attributes"`
}

type AttributeType struct {
	Trait_Type string `json:"trait_type"`
	Value      string `json:"value"`
}

func (dt *DraftToken) ConvertToMetadata() *Metadata {
	return &Metadata{
		Description: "Banana Best Ball, the first ever Web3 Fantasy Football Draft tournament on chain.",
		Name:        fmt.Sprintf("BBB pass #%s", dt.CardId),
		Image:       dt.ImageUrl,
		Attributes:  CreateTokenAttributes(dt),
	}
}

func CreateTokenAttributes(dt *DraftToken) []AttributeType {
	res := make([]AttributeType, 0)
	for i := 0; i < len(dt.Roster.QB); i++ {
		obj := AttributeType{
			Trait_Type: fmt.Sprintf("QB%d", i+1),
			Value:      dt.Roster.QB[i].DisplayName,
		}
		res = append(res, obj)
	}
	for i := 0; i < len(dt.Roster.RB); i++ {
		obj := AttributeType{
			Trait_Type: fmt.Sprintf("RB%d", i+1),
			Value:      dt.Roster.RB[i].DisplayName,
		}
		res = append(res, obj)
	}
	for i := 0; i < len(dt.Roster.TE); i++ {
		obj := AttributeType{
			Trait_Type: fmt.Sprintf("TE%d", i+1),
			Value:      dt.Roster.TE[i].DisplayName,
		}
		res = append(res, obj)
	}
	for i := 0; i < len(dt.Roster.WR); i++ {
		obj := AttributeType{
			Trait_Type: fmt.Sprintf("WR%d", i+1),
			Value:      dt.Roster.WR[i].DisplayName,
		}
		res = append(res, obj)
	}
	for i := 0; i < len(dt.Roster.DST); i++ {
		obj := AttributeType{
			Trait_Type: fmt.Sprintf("DST%d", i+1),
			Value:      dt.Roster.DST[i].DisplayName,
		}
		res = append(res, obj)
	}

	levelTrait := AttributeType{
		Trait_Type: "LEVEL",
		Value:      dt.Level,
	}
	res = append(res, levelTrait)
	fmt.Println("added level attribute")

	weekScoreTrait := AttributeType{
		Trait_Type: "WEEK-SCORE",
		Value:      dt.WeekScore,
	}
	res = append(res, weekScoreTrait)
	fmt.Println("added week score attribute")

	seasonScoreTrait := AttributeType{
		Trait_Type: "SEASON-SC0RE",
		Value:      dt.SeasonScore,
	}
	res = append(res, seasonScoreTrait)
	fmt.Println("added season score attribute")

	rankTrait := AttributeType{
		Trait_Type: "RANK",
		Value:      dt.Rank,
	}
	res = append(res, rankTrait)
	fmt.Println("added rank attribute")

	leagueTrait := AttributeType{
		Trait_Type: "LEAGUE-NAME",
		Value:      dt.LeagueDisplayName,
	}
	res = append(res, leagueTrait)
	fmt.Println("added league name attribute")

	leagueRankTrait := AttributeType{
		Trait_Type: "LEAGUE-RANK",
		Value:      dt.LeagueRank,
	}
	res = append(res, leagueRankTrait)
	fmt.Println("added league rank attribute")

	prizesTrait := AttributeType{
		Trait_Type: "PRIZES",
		Value:      fmt.Sprintf("%f ETH", dt.Prizes.ETH),
	}
	res = append(res, prizesTrait)
	fmt.Println("added prizes attribute")

	return res
}

func (token *DraftToken) GetDraftTokenFromDraftById(tokenId, draftId string) error {
	err := utils.Db.ReadDocument(fmt.Sprintf("drafts/%s/cards", draftId), tokenId, token)
	if err != nil {
		return err
	}
	return nil
}
