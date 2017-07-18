package routes

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"net/http"
	"varys/backend/storage/rdbms"
	"varys/backend/utils"

	"github.com/julienschmidt/httprouter"
)

func GetEntryRoute(db *sql.DB, jwtSecret string) func(http.ResponseWriter, *http.Request, httprouter.Params) {
	return func(res http.ResponseWriter, req *http.Request, ps httprouter.Params) {
		bodyDecoder := json.NewDecoder(req.Body)
		defer req.Body.Close()
		var body rdbms.Entry
		err := bodyDecoder.Decode(&body)
		if err != nil {
			http.Error(res, err.Error(), 500)
			return
		}

		token := req.Header.Get("JWT")
		claims, err := utils.GetClaimsFromToken(token)
		if err != nil {
			http.Error(res, err.Error(), 400)
			return
		}

		rows, err := db.Query("SELECT password, role FROM Users WHERE username = $1", claims["username"])
		defer rows.Close()
		rows.Next()

		var userInfo rdbms.UserInfo
		err = rows.Scan(&userInfo.Password, &userInfo.Role)
		if err != nil {
			http.Error(res, err.Error(), 404)
			return
		}

		salt := utils.Salt{
			Prefix: userInfo.Password,
			Suffix: userInfo.Role,
		}
		err = utils.ValidateToken(jwtSecret, token, salt)
		if err != nil {
			http.Error(res, err.Error(), 401)
			return
		}

		entryUtils := rdbms.CreateEntryWrapper(db)
		entryID, err := entryUtils.AddEntry(body.Title, body.Body, body.Author)
		fmt.Println(err)
		if err != nil || entryID == 0 {
			http.Error(res, "Could not insert entry!", 500)
			return
		}
		tagIDs, err := entryUtils.AddTags(body.Tags)
		if err != nil {
			http.Error(res, err.Error(), 500)
			return
		}

		fmt.Println(len(tagIDs), tagIDs)
		err = entryUtils.MapEntryToTags(entryID, tagIDs)
		if err != nil {
			http.Error(res, err.Error(), 500)
			return
		}

		res.WriteHeader(200)
	}
}
