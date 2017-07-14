package routes

import (
	"fmt"
	"varys/backend/utils"

	"database/sql"
	"net/http"

	"github.com/julienschmidt/httprouter"
)

func GetVerifyRoute(db *sql.DB, jwtSecret string) func(http.ResponseWriter, *http.Request, httprouter.Params) {
	return func(res http.ResponseWriter, req *http.Request, params httprouter.Params) {
		username := params.ByName("username")
		token := params.ByName("token")
		fmt.Println(username, token)
		salt := utils.Salt{
			Prefix: "username",
			Suffix: "email",
		}
		err := utils.ValidateToken(jwtSecret, token, salt)
		if err != nil {
			http.Error(res, err.Error(), 401)
			return
		}

		query := "UPDATE users SET verified = TRUE WHERE username = $1"
		_, err = db.Exec(query, username)
		if err != nil {
			http.Error(res, err.Error(), 500)
			return
		}

		http.Redirect(res, req, "http://"+req.Host+"/signin", 301)
	}
}
