package main

import (
	"fmt"
	"log"
	"net/http"
	"os"

	draftState "github.com/Spoiled-Banana-Society/sbs-drafts-api/draft-state"
	"github.com/Spoiled-Banana-Society/sbs-drafts-api/leagues"
	"github.com/Spoiled-Banana-Society/sbs-drafts-api/owner"
	"github.com/Spoiled-Banana-Society/sbs-drafts-api/utils"
	"github.com/go-chi/chi"
	"github.com/go-chi/chi/middleware"
	"github.com/go-chi/cors"
	"github.com/joho/godotenv"
)

func main() {
	if err := godotenv.Load(".env"); err != nil {
		fmt.Println("ERROR loading in .env file: ", err)
		return
	}

	port := "7070"

	if fromEnv := os.Getenv("PORT"); fromEnv != "" {
		port = fromEnv
	}

	utils.NewDatabaseClient(false)

	fmt.Printf("Starting up on http://localhost:%s\n", port)

	r := chi.NewRouter()

	r.Use(middleware.Logger)

	// Sep Address 0xbf732e170b17107417568891f31c52e51998669e 2024 season
	// Mainnet Address 0x6b417828051328caef5b4e0bfe8325962ec8fb17 2024 season
	// Mainnet TEST address 
	err := utils.CreateEthConnection("0x2BfF6f4284774836d867CEd2e9B96c27aAee55B7", "https://mainnet.infura.io/v3/f9f6b00522504ea0adaf3fd63d1a1992")
	if err != nil {
		fmt.Println("ERROR creating eth connection: ", err)
		panic(err)
	}

	corConfig := cors.New(cors.Options{
		AllowedOrigins: []string{"*"},
		// AllowOriginFunc:  func(r *http.Request, origin string) bool { return true },
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type", "X-CSRF-Token"},
		ExposedHeaders:   []string{"Link"},
		AllowCredentials: true,
		MaxAge:           300,
	})
	r.Use(corConfig.Handler)

	r.Get("/", func(w http.ResponseWriter, r *http.Request) {
		w.Write([]byte("Hello World"))
	})

	dr := &draftState.DraftResources{}
	r.Mount("/draft", dr.Routes())

	lr := &leagues.LeagueResources{}
	r.Mount("/league", lr.Routes())

	or := &owner.OwnerResources{}
	r.Mount("/owner", or.Routes())

	log.Fatal(http.ListenAndServe(":"+port, r))
}
