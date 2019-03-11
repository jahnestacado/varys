package routes

import (
	"varys/backend/storage/rdbms"
	"varys/backend/utils"

	"database/sql"
	"net/http"

	"github.com/julienschmidt/httprouter"
)

func CreateVerifyGetRoute(db *sql.DB) func(http.ResponseWriter, *http.Request, httprouter.Params) {
	return func(res http.ResponseWriter, req *http.Request, params httprouter.Params) {
		jwtSecret := rdbms.GetAppServerConfig(db).JWTSecret
		username := params.ByName("username")
		token := params.ByName("token")
		row := db.QueryRow("SELECT email FROM Users WHERE username=$1", username)
		var email string
		err := row.Scan(&email)
		if err != nil {
			http.Error(res, err.Error(), 404)
			return
		}

		salt := utils.Salt{
			Prefix: username,
			Suffix: email,
		}
		err = utils.ValidateToken(jwtSecret, token, salt)
		if err != nil {
			http.Error(res, err.Error(), 401)
			return
		}

		query := "UPDATE Users SET verified = TRUE WHERE username = $1"
		_, err = db.Exec(query, username)
		if err != nil {
			http.Error(res, err.Error(), 500)
			return
		}

		http.Redirect(res, req, "http://"+req.Host+"/signin", 301)
	}
}
