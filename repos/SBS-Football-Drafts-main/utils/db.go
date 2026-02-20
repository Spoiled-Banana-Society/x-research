package utils

import (
	"context"
	"fmt"
	"os"

	"cloud.google.com/go/firestore"
	secretmanager "cloud.google.com/go/secretmanager/apiv1"
	secretmanagerpb "cloud.google.com/go/secretmanager/apiv1/secretmanagerpb"
	firebase "firebase.google.com/go"
	"google.golang.org/api/option"
)

type DatabaseConn struct {
	Client *firestore.Client
}

var Db *DatabaseConn

type any = interface{}

//var client *db.Client

func NewDatabaseClient() {
	ctx := context.Background()
	creds, err := getFirebaseCreds()
	if err != nil {
		fmt.Println(err)
		panic(err)
	}
	conf := option.WithCredentialsJSON(creds)
	app, err := firebase.NewApp(ctx, nil, conf)
	if err != nil {

		panic(err)
	}

	client, err := app.Firestore(ctx)
	if err != nil {
		panic(err)
	}

	Db = &DatabaseConn{client}
}

func getFirebaseCreds() ([]byte, error) {
	ctx := context.Background()
	client, err := secretmanager.NewClient(ctx)
	if err != nil {
		return nil, err
	}
	defer client.Close()

	env := os.Getenv("ENVIRONMENT")
	fmt.Println("Env: ", env)
	var credsLocation string
	if env == "prod" {
		credsLocation = os.Getenv("PROD_GCP_CREDS_LOCATION")
		fmt.Println("CredsLocation: ", credsLocation)
	} else {
		credsLocation = os.Getenv("TEST_GCP_CREDS_LOCATION")
		fmt.Println("CredsLocation: ", credsLocation)
	}

	req := &secretmanagerpb.AccessSecretVersionRequest{
		Name: credsLocation,
	}

	res, err := client.AccessSecretVersion(ctx, req)
	if err != nil {
		return nil, err
	}

	return res.GetPayload().Data, nil
}

func (db *DatabaseConn) ReadDocument(collection string, documentId string, v any) error {
	ctx := context.Background()
	snapshot, err := db.Client.Collection(collection).Doc(documentId).Get(ctx)
	if err != nil {
		return fmt.Errorf("error when reading document at %s/%s with an error of: %v", collection, documentId, err)
	}

	snapshot.DataTo(v)
	return nil
}

func (db *DatabaseConn) CreateOrUpdateDocument(collection string, documentId string, v any) error {
	ctx := context.Background()
	// data, err := json.Marshal(v)
	// if err != nil {
	// 	return fmt.Errorf("error in marshalling the given object (%v) with error: %v", v, err)
	// }

	_, err := db.Client.Collection(collection).Doc(documentId).Set(ctx, v)
	if err != nil {
		return fmt.Errorf("error in Updating/Creating document at %s/%s: %v", collection, documentId, err)
	}
	return nil
}
