package main

import (
	"fmt"
	"log"
	"net/http"
	"os"

	draftActions "github.com/Spoiled-Banana-Society/sbs-drafts-api/draft-actions"
	draftState "github.com/Spoiled-Banana-Society/sbs-drafts-api/draft-state"
	"github.com/Spoiled-Banana-Society/sbs-drafts-api/leagues"
	"github.com/Spoiled-Banana-Society/sbs-drafts-api/owner"
	"github.com/Spoiled-Banana-Society/sbs-drafts-api/utils"
	"github.com/go-chi/chi"
	"github.com/go-chi/chi/middleware"
	"github.com/go-chi/cors"
)

func main() {
	// Validate required environment variables at startup
	env := os.Getenv("ENVIRONMENT")
	if env == "" {
		log.Fatal("ENVIRONMENT environment variable is required")
	}

	// Validate environment-specific required variables
	if env == "prod" {
		if os.Getenv("PROD_GCP_CREDS_LOCATION") == "" {
			log.Fatal("PROD_GCP_CREDS_LOCATION is required when ENVIRONMENT=prod")
		}
		if os.Getenv("PROD_RT_DB_URL") == "" {
			log.Fatal("PROD_RT_DB_URL is required when ENVIRONMENT=prod")
		}
	} else {
		if os.Getenv("TEST_GCP_CREDS_LOCATION") == "" {
			log.Fatal("TEST_GCP_CREDS_LOCATION is required when ENVIRONMENT=dev")
		}
		if os.Getenv("TEST_RT_DB_URL") == "" {
			log.Fatal("TEST_RT_DB_URL is required when ENVIRONMENT=dev")
		}
	}

	// Validate Cloud Tasks variables (required for auto-draft functionality)
	if os.Getenv("GCP_PROJECT_ID") == "" {
		log.Fatal("GCP_PROJECT_ID is required for Cloud Tasks")
	}

	port := "8080"

	if fromEnv := os.Getenv("PORT"); fromEnv != "" {
		port = fromEnv
	}

	utils.NewDatabaseClient(false)

	// Initialize Cloud Tasks client for auto-draft functionality
	if err := utils.InitCloudTasksClient(false); err != nil {
		log.Fatalf("Failed to initialize Cloud Tasks client: %v", err)
	}

	fmt.Printf("Starting up on http://localhost:%s\n", port)

	r := chi.NewRouter()

	r.Use(middleware.Logger)

	// Sep Address 0xbf732e170b17107417568891f31c52e51998669e 2024 season
	// Mainnet Address 0x6b417828051328caef5b4e0bfe8325962ec8fb17 2024 season
	contractAddress := utils.GetenvOrDefault("ETH_CONTRACT_ADDRESS", "0x6b417828051328caef5b4e0bfe8325962ec8fb17")
	infuraKey := os.Getenv("INFURA_API_KEY")
	if infuraKey == "" {
		log.Fatal("INFURA_API_KEY environment variable is required")
	}
	infuraEndpoint := fmt.Sprintf("https://mainnet.infura.io/v3/%s", infuraKey)
	err := utils.CreateEthConnection(contractAddress, infuraEndpoint)
	if err != nil {
		fmt.Println("ERROR creating eth connection: ", err)
		panic(err)
	}

	// CORS: Currently open for testing. TODO: Restrict origins once out of testing phase.
	corConfig := cors.New(cors.Options{
		AllowedOrigins:   []string{"*"},
		AllowedMethods:   []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
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

	dra := &draftActions.DraftActionResources{}
	r.Mount("/draft-actions", dra.Routes())

	lr := &leagues.LeagueResources{}
	r.Mount("/league", lr.Routes())

	or := &owner.OwnerResources{}
	r.Mount("/owner", or.Routes())

	log.Fatal(http.ListenAndServe(":"+port, r))
}
