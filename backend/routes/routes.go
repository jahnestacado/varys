package routes

import (
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/julienschmidt/httprouter"
)

type Entry struct {
	Title    string   `json:"title"`
	Body     string   `json:"body"`
	ID       int      `json:"id"`
	Keywords []string `json:"keywords"`
}

type Result struct {
	TotalMatches int     `json:"totalMatches"`
	Payload      []Entry `json:"payload"`
}

func search(res http.ResponseWriter, req *http.Request, ps httprouter.Params) {
	entry := Entry{"Hello from GO", "Dummy body text", 1, []string{"*", "first"}}
	fmt.Println(entry)
	ress := Result{1, []Entry{entry}}
	result, err := json.Marshal(ress)
	fmt.Println(result)
	res.Header().Set("Content-Type", "application/json")
	if err != nil {
		res.Write([]byte(err.Error()))
	} else {
		res.Write(result)
	}
}

func RegisterRoutes(router *httprouter.Router) {
	router.GET("/search/:query", search)
}
