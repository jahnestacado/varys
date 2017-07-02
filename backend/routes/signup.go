package routes

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"varys/backend/storage/postgres"

	"github.com/julienschmidt/httprouter"
)

type signUpBody struct {
	Username string `json:"username"`
	Email    string `json:"email"`
	Password string `json:"password"`
}

func GetSignUpRoute(DB *sql.DB) func(http.ResponseWriter, *http.Request, httprouter.Params) {
	return func(res http.ResponseWriter, req *http.Request, ps httprouter.Params) {
		bodyDecoder := json.NewDecoder(req.Body)
		defer req.Body.Close()
		var body signUpBody
		err := bodyDecoder.Decode(&body)
		if err != nil {
			http.Error(res, err.Error(), 500)
		}
		userUtils := postgres.User(DB)
		err = userUtils.Register(body.Username, body.Password, body.Email)
		if err != nil {
			http.Error(res, err.Error(), 400)
		}

		res.WriteHeader(200)
	}
}
