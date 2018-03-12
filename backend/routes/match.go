package routes

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"varys/backend/storage/rdbms"

	"github.com/julienschmidt/httprouter"
)

func CreateMatchGetRoute(DB *sql.DB) func(http.ResponseWriter, *http.Request, httprouter.Params) {
	return func(res http.ResponseWriter, req *http.Request, params httprouter.Params) {
		queryParams := req.URL.Query()
		substring := queryParams.Get("substring")
		matcherType := queryParams.Get("type")
		wordTxUtils := rdbms.CreateWordTxUtils(DB)

		words, err := wordTxUtils.GetMatchedWords(matcherType, substring)
		if err != nil {
			http.Error(res, err.Error(), 500)
			return
		}

		result, err := json.Marshal(words)
		if err != nil {
			res.Write([]byte(err.Error()))
		} else {
			res.Header().Set("Content-Type", "application/json")
			res.Write(result)
		}
	}
}
