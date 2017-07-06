package routes

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"varys/backend/storage/rdbms"
	"varys/backend/utils"

	"github.com/julienschmidt/httprouter"
)

type signInBody struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

type session struct {
	Username string `json:"username"`
	Email    string `json:"email"`
	Token    string `json:"token"`
}

func GetSignInRoute(db *sql.DB) func(http.ResponseWriter, *http.Request, httprouter.Params) {
	return func(res http.ResponseWriter, req *http.Request, ps httprouter.Params) {
		bodyDecoder := json.NewDecoder(req.Body)
		defer req.Body.Close()
		var body signInBody
		err := bodyDecoder.Decode(&body)
		if err != nil {
			http.Error(res, err.Error(), 500)
			return
		}
		userUtils := rdbms.User(db)
		info, err := userUtils.Login(body.Username, body.Password)
		if err != nil {
			http.Error(res, err.Error(), 401)
			return
		}

		token, err := utils.CreateToken(body.Username)
		result, err := json.Marshal(session{info.Username, info.Email, token})
		if err != nil {
			http.Error(res, err.Error(), 500)
			return
		}

		res.Header().Set("Content-Type", "application/json")
		res.Write(result)
	}
}
