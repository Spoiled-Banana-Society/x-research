package utils

import (
	"fmt"
	"strings"

	expo "github.com/oliveroneill/exponent-server-sdk-golang/sdk"
)

type UserNotificationToken struct {
	OwnerId   string `json:"ownerId"`
	PushToken string `json:"pushToken"`
}

var pushClient *expo.PushClient

func CreateExpoPushClient() {
	pushClient = expo.NewPushClient(nil)
	// pushClient = expo.NewPushClient(&expo.ClientConfig{
	// 	Host:        "",
	// 	APIURL:      "",
	// 	AccessToken: "2XP4X3U3Z7",
	// 	HTTPClient:  http.DefaultClient,
	// })
}

func SendNotification(pushToken string, title string, body string, data map[string]string) error {
	token, err := expo.NewExponentPushToken(pushToken)
	if err != nil {
		return err
	}

	fmt.Println("about to publish message for ", pushToken)
	response, pushErr := pushClient.Publish(
		&expo.PushMessage{
			To:       []expo.ExponentPushToken{token},
			Body:     body,
			Sound:    "default",
			Title:    title,
			Priority: expo.DefaultPriority,
			Data:     data,
		},
	)

	if pushErr != nil {
		fmt.Println("response id: ")
		return pushErr
	}

	if response.ValidateResponse() != nil {
		fmt.Println(response.PushMessage.To, "failed")
		return fmt.Errorf("failed to send message")
	}

	fmt.Println("validated push notification for ", response.ID)

	return nil
}

func AlertUserOfDraftStart(draftId string, leagueName string, ownerId string, tokenId string) {
	var ownerData UserNotificationToken
	err := Db.ReadDocument("notificationTokens", ownerId, &ownerData)
	if err != nil {
		s := err.Error()
		if res := strings.Contains(s, "code = NotFound"); res {
			fmt.Printf("%s does not have a push token so they must be using web version\r", ownerId)
			return
		} else {
			fmt.Println("Error finding push token for user: ", err)
		}
	}

	data := map[string]string{
		"draftId":    draftId,
		"leagueName": leagueName,
		"tokenId":    tokenId,
	}

	err = SendNotification(ownerData.PushToken, "Draft Starting", fmt.Sprintf("%s draft is starting now", leagueName), data)
	if err != nil {
		fmt.Println("Error sending notification: ", err)
		return
	}
	fmt.Printf("Alerted %s that the draft for %s has started now\r", ownerId, leagueName)
}

func AlertUserItIsTheirTurn(draftId, leagueName, ownerId, tokenId string) {
	var ownerData UserNotificationToken
	err := Db.ReadDocument("notificationTokens", ownerId, &ownerData)
	if err != nil {
		s := err.Error()
		if res := strings.Contains(s, "code = NotFound"); res {
			fmt.Printf("%s does not have a push token so they must be using web version\r", ownerId)
			return
		} else {
			fmt.Println("Error finding push token for user: ", err)
		}
	}

	data := map[string]string{
		"draftId":    draftId,
		"leagueName": leagueName,
		"tokenId":    tokenId,
	}

	err = SendNotification(ownerData.PushToken, "It is your pick!", fmt.Sprintf("It is your pick now in %s", leagueName), data)
	if err != nil {
		fmt.Println("Error sending notification: ", err)
		return
	}
	fmt.Printf("Alered %s that their pick in %s has started now\r", ownerId, leagueName)
}
