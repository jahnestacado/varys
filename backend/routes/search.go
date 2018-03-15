package routes

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"strconv"
	"varys/backend/storage/rdbms"
	"varys/backend/utils"

	"github.com/julienschmidt/httprouter"
)

type RequestedResult struct {
	TotalMatches int           `json:"totalMatches"`
	Payload      []rdbms.Entry `json:"payload"`
}

func CreateSearchGetRoute(DB *sql.DB) func(http.ResponseWriter, *http.Request, httprouter.Params) {
	return func(res http.ResponseWriter, req *http.Request, params httprouter.Params) {
		var matchedEntries []rdbms.Entry
		var requestedEntries RequestedResult
		queryParams := req.URL.Query()
		query := queryParams.Get("query")

		entryTxUtils := rdbms.CreateEntryTxUtils(DB)
		matchedEntries, err := entryTxUtils.GetMatchedEntries(query)
		if err != nil {
			http.Error(res, err.Error(), 500)
			return
		}

		numOfEntries := len(matchedEntries)
		limit, err := getNumericParameter(queryParams.Get("limit"), numOfEntries)
		if err != nil {
			http.Error(res, err.Error(), 500)
			return
		}
		end := utils.Math().Min(limit, numOfEntries)
		requestedEntries = RequestedResult{numOfEntries, matchedEntries[0:end]}
		result, err := json.Marshal(requestedEntries)

		if err != nil {
			res.Write([]byte(err.Error()))
		} else {
			res.Header().Set("Content-Type", "application/json")
			res.Write(result)
		}
	}
}

func getNumericParameter(param string, defaultValue int) (int, error) {
	limit := defaultValue
	var err error
	if param != "" {
		limit, err = strconv.Atoi(param)
	}
	return limit, err
}
