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

func CreateEntryPutRoute(db *sql.DB) func(http.ResponseWriter, *http.Request, httprouter.Params) {
	return func(res http.ResponseWriter, req *http.Request, ps httprouter.Params) {
		jwtSecret := rdbms.GetAppServerConfig(db).JWTSecret
		bodyDecoder := json.NewDecoder(req.Body)
		defer req.Body.Close()
		var entry rdbms.Entry
		err := bodyDecoder.Decode(&entry)
		if err != nil {
			http.Error(res, err.Error(), 500)
			return
		}

		err, _ = validateRequest(jwtSecret, req, db)
		if err != nil {
			http.Error(res, err.Error(), 401)
			return
		}

		entryTxUtils := rdbms.CreateEntryTxUtils(db)
		tx, err := db.Begin()
		defer tx.Commit()
		if err != nil {
			http.Error(res, err.Error(), 500)
			return
		}

		// @TODO Below code is insufficient. We also need to check if the ID exists in the Database
		if entry.ID > 0 {
			if err = entryTxUtils.UpdateEntry(tx, entry); err != nil {
				http.Error(res, err.Error(), 500)
				return
			}
		} else {
			if err = entryTxUtils.InsertEntry(tx, entry); err != nil {
				http.Error(res, err.Error(), 500)
				return
			}
		}

		res.Write([]byte("null"))
	}
}

func CreateEntryGetRoute(db *sql.DB) func(http.ResponseWriter, *http.Request, httprouter.Params) {
	return func(res http.ResponseWriter, req *http.Request, params httprouter.Params) {
		entryID, err := getNumericParameter(params.ByName("id"), -1)
		entryTxUtils := rdbms.CreateEntryTxUtils(db)
		tagsTxUtils := rdbms.CreateTagsTxUtils(db)

		entry, err := entryTxUtils.GetEntry(entryID)
		if err != nil {
			http.Error(res, err.Error(), 500)
			return
		}

		tags, err := tagsTxUtils.GetTags(entryID)
		if err != nil {
			http.Error(res, err.Error(), 500)
			return
		}

		for _, tag := range tags {
			entry.Tags = append(entry.Tags, tag.Name)
		}
		result, err := json.Marshal(entry)
		if err != nil {
			res.Write([]byte(err.Error()))
		} else {
			res.Header().Set("Content-Type", "application/json")
			res.Write(result)
		}
	}
}

func CreateEntryDeleteRoute(db *sql.DB) func(http.ResponseWriter, *http.Request, httprouter.Params) {
	return func(res http.ResponseWriter, req *http.Request, params httprouter.Params) {
		entryID, err := getNumericParameter(params.ByName("id"), -1)
		jwtSecret := rdbms.GetAppServerConfig(db).JWTSecret

		err, claims := validateRequest(jwtSecret, req, db)
		if err != nil {
			http.Error(res, err.Error(), 401)
			return
		}

		entryTxUtils := rdbms.CreateEntryTxUtils(db)
		tx, err := db.Begin()
		defer tx.Commit()
		if err != nil {
			http.Error(res, err.Error(), 500)
			return
		}

		err = entryTxUtils.DeleteEntry(tx, entryID, claims)
		if err != nil {
			http.Error(res, err.Error(), 500)
			return
		}

		res.Write([]byte("null"))
	}
}

// @TODO Move below function to separate file
func validateRequest(jwtSecret string, req *http.Request, db *sql.DB) (error, map[string]interface{}) {
	token := req.Header.Get("JWT")
	claims, err := utils.GetClaimsFromToken(token)
	if err != nil {
		return err, claims
	}

	row := db.QueryRow("SELECT password, role FROM Users WHERE username=$1", claims["username"])

	var userInfo rdbms.UserInfo
	err = row.Scan(&userInfo.Password, &userInfo.Role)

	if err != nil {
		return err, claims
	}

	salt := utils.Salt{
		Prefix: userInfo.Password,
		Suffix: userInfo.Role,
	}
	err = utils.ValidateToken(jwtSecret, token, salt)
	fmt.Println("userInfo", jwtSecret, err, userInfo, claims)

	return err, claims
}
