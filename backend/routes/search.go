package routes

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"varys/backend/storage/rdbms"

	"github.com/julienschmidt/httprouter"
)

type Result struct {
	TotalMatches int           `json:"totalMatches"`
	Payload      []rdbms.Entry `json:"payload"`
}

func CreateGetRouteSearch(DB *sql.DB) func(http.ResponseWriter, *http.Request, httprouter.Params) {
	return func(res http.ResponseWriter, req *http.Request, params httprouter.Params) {
		query := params.ByName("query")
		entryTxUtils := rdbms.CreateEntryTxUtils(DB)
		entries, err := entryTxUtils.GetMatchedEntries(query)
		if err != nil {
			http.Error(res, err.Error(), 500)
			return
		}
		result := Result{len(entries), entries}
		r, err := json.Marshal(result)

		if err != nil {
			res.Write([]byte(err.Error()))
		} else {
			res.Header().Set("Content-Type", "application/json")
			res.Write(r)
		}
	}
}
