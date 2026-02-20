package models

import (
	"fmt"
	"strings"
	"github.com/Spoiled-Banana-Society/sbs-drafts-api/utils"
)

type PlayerStateInfo struct {
	// unique player Id will probably just be the team and position such as BUFQB
	PlayerId string `json:"playerId"`
	// display name for front end
	DisplayName string `json:"displayName"`
	// team of the player
	Team string `json:"team"`
	// position of player
	Position string `json:"position"`
	// address of the user who drafted this player
	OwnerAddress string `json:"ownerAddress"`
	// number pick that this player was selected.... will default to nil in the database
	PickNum int `json:"pickNum"`
	// the round which this player was drafted in
	Round int `json:"round"`
}

type StateMap struct {
	Players map[string]PlayerStateInfo
}

type PlayerRanking struct {
	PlayerId string  `json:"playerId"`
	Rank     int64   `json:"rank"`
	Score    float64 `json:"score"`
}

type UserRankings struct {
	Ranking []PlayerRanking `json:"ranking"`
}

type StatsObject struct {
	PlayerId        string   `json:"playerId"`
	AverageScore    float64  `json:"averageScore"`
	HighestScore    float64  `json:"highestScore"`
	Top5Finishes    int64    `json:"top5Finishes"`
	ByeWeek         string   `json:"byeWeek"`
	ADP             float64  `json:"adp"`
	PlayersFromTeam []string `json:"playersFromTeam"`
}

type DraftPlayerRanking struct {
	// unique player Id will probably just be the team and position such as BUFQB
	PlayerId string `json:"playerId"`
	// holds the state object for player
	PlayerStateInfo PlayerStateInfo `json:"playerStateInfo"`
	Stats           StatsObject     `json:"stats"`
	Ranking         PlayerRanking   `json:"ranking"`
}

type PlayerDraftInfo struct {
	ADP int64 `json:"adp"`
	ByeWeek string `json:"bye"`
	PlayerId string `json:"playerId"`
}

type PlayerMap struct {
	Players map[string]*PlayerDraftInfo
}

func CreateRankingObject(ranking PlayerRanking, stats StatsObject, info PlayerStateInfo) DraftPlayerRanking {
	return DraftPlayerRanking{
		PlayerId:        info.PlayerId,
		PlayerStateInfo: info,
		Stats:           stats,
		Ranking:         ranking,
	}
}

func GetUserRankings(ownerId string, draftId string) (*UserRankings, error) {
	var r UserRankings
	err := utils.Db.ReadDocument(fmt.Sprintf("owners/%s/drafts", ownerId), "rankings", &r)

	if err != nil {
		if ok := strings.Contains(strings.ToLower(err.Error()), "notfound"); ok {
			// reset error
			err = nil

			var league League
			var adpSlice []PlayerDraftInfo
			if draftId != "" {
				err := utils.Db.ReadDocument("drafts", draftId, &league)
				if err != nil {
					return nil, err
				}

				adpSlice = league.ADP
			} else {
				// get current adp
				adpSlice, err = GetADP()
				if err != nil {
					return nil, err
				}
			}

			playerRanksLength := len(adpSlice)

			// iterate over map and sort by adp
			r = UserRankings{
				Ranking: make([]PlayerRanking, playerRanksLength),
			}

			for i := 0; i < len(adpSlice); i++ {
				player := PlayerRanking{
					PlayerId: adpSlice[i].PlayerId,
					Rank: int64(i + 1),
				}

				r.Ranking[i] = player
			}

			if err != nil {
				return nil, err
			}
		} else {
			return nil, err
		}
	}
	return &r, nil
}

type StatsMap struct {
	Players map[string]StatsObject `json:"players"`
}

func ReturnPlayerStateWithRankings(ownerId string, draftId string) ([]DraftPlayerRanking, error) {
	userRankings, err := GetUserRankings(ownerId, draftId)
	if err != nil {
		return nil, err
	}
	//fmt.Println("Got user rankings: ", userRankings)

	state := make(map[string]PlayerStateInfo)
	err = utils.Db.ReadDocument(fmt.Sprintf("drafts/%s/state", draftId), "playerState", &state)
	if err != nil {
		return nil, err
	}
	if len(state) == 0 {
		fmt.Println("state is empty")
	}

	stats := StatsMap{
		Players: make(map[string]StatsObject),
	}
	err = utils.Db.ReadDocument("playerStats2025", "playerMap", &stats)
	if err != nil {
		return nil, err
	}

	res := make([]DraftPlayerRanking, 0)

	for _, rank := range userRankings.Ranking {
		stateInfo := state[rank.PlayerId]
		if stateInfo.PlayerId == "" {
			fmt.Println("This should not be empty")
		}
		obj := CreateRankingObject(rank, stats.Players[rank.PlayerId], stateInfo)
		res = append(res, obj)
	}

	return res, nil
}
