package routes

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"varys/backend/storage/rdbms"
	"varys/backend/utils"

	"github.com/julienschmidt/httprouter"
)

func GetEntryRoute(db *sql.DB, jwtSecret string) func(http.ResponseWriter, *http.Request, httprouter.Params) {
	return func(res http.ResponseWriter, req *http.Request, ps httprouter.Params) {
		bodyDecoder := json.NewDecoder(req.Body)
		defer req.Body.Close()
		var newEntry rdbms.Entry
		err := bodyDecoder.Decode(&newEntry)
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

		if newEntry.ID > 0 {
			if err = updateEntry(db, newEntry); err != nil {
				http.Error(res, err.Error(), 500)
				return
			}
		} else {
			if err = insertEntry(db, newEntry); err != nil {
				http.Error(res, err.Error(), 500)
				return
			}
		}

		res.WriteHeader(200)
	}
}

func insertEntry(db *sql.DB, newEntry rdbms.Entry) error {
	entryUtils := rdbms.CreateEntryWrapper(db)

	tx, err := db.Begin()
	defer tx.Commit()
	if err != nil {
		return err
	}

	entryID, err := entryUtils.AddEntry(tx, newEntry)
	if err != nil || entryID == 0 {
		tx.Rollback()
		return err
	}
	tagIDs, err := entryUtils.AddTags(tx, newEntry.Tags)
	if err != nil {
		tx.Rollback()
		return err
	}

	if err = entryUtils.MapEntryToTags(tx, entryID, tagIDs); err != nil {
		tx.Rollback()
		return err
	}

	if err = entryUtils.UpdateEntryTSV(tx, entryID); err != nil {
		tx.Rollback()
		return err
	}

	return err
}

func updateEntry(db *sql.DB, newEntry rdbms.Entry) error {
	entryUtils := rdbms.CreateEntryWrapper(db)

	tx, err := db.Begin()
	defer tx.Commit()
	if err != nil {
		return err
	}

	if err = entryUtils.UpdateEntry(tx, newEntry); err != nil {
		tx.Rollback()
		return err
	}
	tagIDs, err := entryUtils.UpdateTags(tx, newEntry)
	if err != nil {
		tx.Rollback()
		return err
	}

	if err = entryUtils.MapEntryToTags(tx, newEntry.ID, tagIDs); err != nil {
		tx.Rollback()
		return err
	}

	if err = entryUtils.UpdateEntryTSV(tx, newEntry.ID); err != nil {
		tx.Rollback()
		return err
	}

	return err
}
