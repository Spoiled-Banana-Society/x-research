package websockets

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"sync"
	"time"

	"github.com/go-chi/chi"
	"github.com/google/uuid"
	"github.com/gorilla/websocket"
)

var (
	// websocketUpgrader is used to upgrade incoming HTTP requests into a persistent websocket connection
	websocketUpgrader = websocket.Upgrader{
		CheckOrigin:      checkOrigin,
		ReadBufferSize:   4096,
		WriteBufferSize:  4096,
		HandshakeTimeout: 500 * time.Second,
	}
)

var (
	ErrEventNotSupported = errors.New("this event type is not supported")
)

func checkOrigin(r *http.Request) bool {
	// origin := r.Header.Get("Origin");

	// switch origin {
	// case "https://localhost:8080":
	// 	return true
	// default:
	// 	return false
	// }
	return true
}

type DraftManager struct {
	Id      string
	clients ClientList
	sync.RWMutex

	//event handlers to handle the event types we have
	handlers map[string]EventHandler

	// map of drafts
	draftMap map[string]*Draft
}

func NewManager(ctx context.Context) *DraftManager {
	m := &DraftManager{
		Id:       fmt.Sprintf("manager-%s", uuid.New().String()),
		clients:  make(ClientList),
		handlers: make(map[string]EventHandler),
		draftMap: make(map[string]*Draft),
	}
	m.setupEventHandlers()
	return m
}

func (m *DraftManager) setupEventHandlers() {
	m.handlers[EventReceivePick] = HandleNewPickMessage
	m.handlers[EventReceiveQueueUpdate] = HandleQueueMessage
}

func (m *DraftManager) routeEvent(event Event, c *Client) error {
	if handler, ok := m.handlers[event.Type]; ok {
		if err := handler(event, c); err != nil {
			return err
		}
		return nil
	} else {
		return ErrEventNotSupported
	}
}

func (m *DraftManager) ReturnManagerId() string {
	return m.Id
}

func (m *DraftManager) CleanUpDraft(w http.ResponseWriter, r *http.Request) {
	draftId := chi.URLParam(r, "draftId")
	fmt.Printf("Clean up draft called for %s\r", draftId)
	if draftId == "" {
		fmt.Println("no draft Id so we are returning")
		w.WriteHeader(400)
		w.Write([]byte("no draft id was passed in the url params"))
		return
	}

	m.RemoveDraftInstanceFromMap(draftId)

	w.Header().Set("Content-Type", "application/json")
	_, err := w.Write([]byte("cleaned up draft"))
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
}

func (m *DraftManager) ServeWS(w http.ResponseWriter, r *http.Request) {
	var requestData ClientInfo
	requestData.Address = r.URL.Query().Get("address")
	requestData.DraftName = r.URL.Query().Get("draftName")
	fmt.Printf("request address: %s, request draft name: %s\n", requestData.Address, requestData.DraftName)
	if requestData.Address == "" || requestData.Address == "null" {
		fmt.Println("no owner address was passed in the url params")
		w.WriteHeader(400)
		w.Write([]byte("no owner address was passed in the url params"))
		return
	}
	if requestData.DraftName == "" || requestData.Address == "null" {
		w.WriteHeader(400)
		w.Write([]byte("no draft name was passed in the url params"))
		return
	}

	conn, err := websocketUpgrader.Upgrade(w, r, nil)
	if err != nil {
		errMes := fmt.Sprintf("Error in upgrading websocket connection for %s with error: %v", requestData.Address, err)
		fmt.Println(errMes)
		w.WriteHeader(400)
		w.Write([]byte(errMes))
		return
	}
	fmt.Println("Successfully upgraded the http connection to a websocket connection for ", requestData.Address)

	// TODO check to see if address belongs in the draft?

	// create new client
	client, err := NewClient(conn, m, requestData)
	if err != nil {
		errMes := fmt.Sprintf("Error in creating client for address: %s with an error of: %v", requestData.Address, err)
		fmt.Println(errMes)
		w.WriteHeader(400)
		w.Write([]byte(errMes))
		conn.Close()
		fmt.Println("Close message sent from backend because of error: ", errMes)
		return
	}
	//m.Lock()
	m.addClient(client)
	//m.Unlock()
	fmt.Println("Successfully created client and added them to the draft object")

	// open up to go routines to read and write messages with client
	go client.readMessages()
	go client.writeMessages()

	fmt.Println("Connection created with server for user ", requestData.Address)
}

func (m *DraftManager) addClient(client *Client) {
	m.Lock()
	defer func() {
		m.Unlock()
	}()

	m.clients[client] = true
}

func (m *DraftManager) removeClient(client *Client) {
	m.Lock()
	defer func() {
		m.Unlock()
	}()

	if _, ok := m.clients[client]; ok {
		//close connection
		client.connection.Close()
		if d, ok := m.draftMap[client.draftRoom.draftId]; ok {
			// remove user from draft
			d.removeUserFromRoom(client.address)
		}
		fmt.Printf("removed %s from %s\r", client.address, client.draftName)
		// remove from client map
		delete(m.clients, client)
	}
}

func (m *DraftManager) getOrCreateDraftInstance(data ClientInfo) (*Draft, error) {
	// m.Lock()
	// defer m.Unlock()
	fmt.Println("inside of getOrCreateDraftInstance")
	if d, ok := m.draftMap[data.DraftName]; ok {
		fmt.Println("inside of first if statement")
		if d.IsCommplete {
			errMes := fmt.Sprintf("This draft is already complete and the draft room is closing for %s", data.DraftName)
			return nil, fmt.Errorf(errMes)
		}
		return d, nil
	}

	fmt.Println("creating new draft")
	draft, err := NewDraft(data.DraftName, m)
	if err != nil {
		fmt.Println("error in creating draft object: ", err)
		return nil, err
	}
	m.Lock()
	m.draftMap[data.DraftName] = draft
	m.Unlock()
	fmt.Println("added draft instance to draft map in manager: ", m.Id)

	return draft, nil
}

func (m *DraftManager) RemoveDraftInstanceFromMap(draftId string) {
	m.Lock()
	defer func() {
		m.Unlock()
	}()

	if _, ok := m.draftMap[draftId]; ok {
		// remove from client map
		if len(m.draftMap[draftId].activeUsers) == 0 {
			delete(m.draftMap, draftId)
		} else {
			fmt.Println("THis draft object should not be removed because there are still active users connected to it")
			return
		}
	} else {
		fmt.Println("Unable to find this draft object in the draft map ")
	}
}

func (m *DraftManager) StartDraftFromAPI(w http.ResponseWriter, r *http.Request) {
	draftId := chi.URLParam(r, "draftId")
	if draftId == "" {
		w.WriteHeader(400)
		w.Write([]byte("no draft name was passed in the url params"))
		return
	}

	draft, err := NewDraft(draftId, m)
	if err != nil {
		fmt.Println("Error creating new draft: ", err)
		w.WriteHeader(400)
		w.Write([]byte(err.Error()))
		return
	}

	m.Lock()
	m.draftMap[draftId] = draft
	m.Unlock()

	data, err := json.Marshal(draft)
	if err != nil {
		fmt.Println("ERROR marshalling draft for resonse: ", err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	_, err = w.Write(data)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
}
