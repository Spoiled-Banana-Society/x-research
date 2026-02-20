package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"

	"github.com/Spoiled-Banana-Society/SBS-Football-Drafts/utils"
	"github.com/Spoiled-Banana-Society/SBS-Football-Drafts/websockets"
	"github.com/go-chi/chi"
	"github.com/joho/godotenv"
)

func main() {
	rootCtx := context.Background()
	ctx, cancel := context.WithCancel(rootCtx)
	defer cancel()

	if err := godotenv.Load(".env"); err != nil {
		fmt.Println("ERROR loading in .env file: ", err)
		return
	}

	port := "8000"

	if fromEnv := os.Getenv("PORT"); fromEnv != "" {
		port = fromEnv
	}

	//set up redis connections
	utils.CreateRedisClient()

	// create expo notifications client
	utils.CreateExpoPushClient()

	// set up db connection
	utils.NewDatabaseClient()
	defer func() {
		err := utils.Db.Client.Close()
		if err != nil {
			fmt.Println("Error closing db client in main: ", err)
		}
		err = utils.PubConn.Close()
		if err != nil {
			fmt.Println("Error closing publish redis connection in main: ", err)
		}
		err = utils.SubConn.Close()
		if err != nil {
			fmt.Println("Error closing sub redis connection in main: ", err)
		}
	}()

	r := chi.NewRouter()

	manager := websockets.NewManager(ctx)

	r.Handle("/", http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		fmt.Printf("Connected to server instance %s\r", manager.Id)
	}))
	r.Handle("/ws", http.HandlerFunc(manager.ServeWS))
	r.Post("/draft/{draftId}/createDraft", http.HandlerFunc(manager.StartDraftFromAPI))
	r.Post("/draft/{draftId}/cleanUpDraft", manager.CleanUpDraft)

	err := http.ListenAndServe(fmt.Sprintf(":%s", port), r)
	if err != nil {
		log.Fatal("ListenAndServe: ", err)
	}
}
