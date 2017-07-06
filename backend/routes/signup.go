package routes

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"varys/backend/storage/rdbms"

	"github.com/julienschmidt/httprouter"
)

func GetSignUpRoute(DB *sql.DB) func(http.ResponseWriter, *http.Request, httprouter.Params) {
	return func(res http.ResponseWriter, req *http.Request, ps httprouter.Params) {
		bodyDecoder := json.NewDecoder(req.Body)
		defer req.Body.Close()
		var body rdbms.UserInfo
		err := bodyDecoder.Decode(&body)
		if err != nil {
			http.Error(res, err.Error(), 500)
		}
		userUtils := rdbms.User(DB)
		err = userUtils.Register(body.Username, body.Password, body.Email)
		if err != nil {
			http.Error(res, err.Error(), 400)
		}

		res.WriteHeader(200)
	}
}
