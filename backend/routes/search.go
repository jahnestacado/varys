package routes

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
	"varys/backend/storage/cache"
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
		limit, err := strconv.Atoi(queryParams.Get("limit"))
		if err != nil {
			http.Error(res, err.Error(), 500)
			return
		}
		offset, err := strconv.Atoi(queryParams.Get("offset"))
		if err != nil {
			http.Error(res, err.Error(), 500)
			return
		}

		cachedEntries, exists := cache.GetCachedEntries(query)
		if exists {
			matchedEntries = cachedEntries.Entries
		} else {
			entryTxUtils := rdbms.CreateEntryTxUtils(DB)
			matchedEntries, err = entryTxUtils.GetMatchedEntries(query)
			if err != nil {
				http.Error(res, err.Error(), 500)
				return
			}

			cache.SetCachedEntries(query, matchedEntries)
		}

		numOfEntries := len(matchedEntries)
		fmt.Print(numOfEntries)
		start := offset * limit
		end := utils.Math().Min(start+limit, numOfEntries)
		requestedEntries = RequestedResult{numOfEntries, matchedEntries[start:end]}
		r, err := json.Marshal(requestedEntries)

		if err != nil {
			res.Write([]byte(err.Error()))
		} else {
			res.Header().Set("Content-Type", "application/json")
			res.Write(r)
		}
	}
}
