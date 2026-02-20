package main

import (
	"context"
	"fmt"

	"github.com/Spoiled-Banana-Society/sbs-drafts-api/models"
	"github.com/Spoiled-Banana-Society/sbs-drafts-api/utils"
)

func main() {
	utils.NewDatabaseClient(true)
	data, err := utils.Db.Client.Collection("owners").Documents(context.Background()).GetAll()
	if err != nil {
		fmt.Println("ERROR reading owners documents: ", err)
		panic(err)
	}

	for i := 0; i < len(data); i++ {
		var owner models.Owner
		ownerId := data[i].Ref.ID
		err = data[i].DataTo(&owner)
		if err != nil {
			panic(err)
		}

		draftTokensData, err := utils.Db.Client.Collection(fmt.Sprintf("owners/%s/usedDraftTokens", ownerId)).Documents(context.Background()).GetAll()
		if err != nil {
			continue
		}
		if len(draftTokensData) == 0 {
			continue
		}

		err = owner.UpdateDisplayNameForUser(ownerId, owner.PFP.DisplayName)
		if err != nil {
			fmt.Println("ERROR updating PFP for ", ownerId)
			panic(err)
		}

		fmt.Println("Updated PFP for ", ownerId)
	}
}
