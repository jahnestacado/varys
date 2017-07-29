package routes

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"varys/backend/storage/rdbms"
	"varys/backend/utils"

	"github.com/julienschmidt/httprouter"
)

func CreatePutRouteEntry(db *sql.DB, jwtSecret string) func(http.ResponseWriter, *http.Request, httprouter.Params) {
	return func(res http.ResponseWriter, req *http.Request, ps httprouter.Params) {
		bodyDecoder := json.NewDecoder(req.Body)
		defer req.Body.Close()
		var newEntry rdbms.Entry
		err := bodyDecoder.Decode(&newEntry)
		if err != nil {
			http.Error(res, err.Error(), 500)
			return
		}

		err, _ = validateRequest(jwtSecret, req, db)
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

func CreateDeleteRouteEntry(db *sql.DB, jwtSecret string) func(http.ResponseWriter, *http.Request, httprouter.Params) {
	return func(res http.ResponseWriter, req *http.Request, ps httprouter.Params) {
		bodyDecoder := json.NewDecoder(req.Body)
		defer req.Body.Close()
		var targetEntry rdbms.Entry
		err := bodyDecoder.Decode(&targetEntry)
		if err != nil {
			http.Error(res, err.Error(), 500)
			return
		}

		err, claims := validateRequest(jwtSecret, req, db)
		if err != nil {
			http.Error(res, err.Error(), 401)
			return
		}

		tx, err := db.Begin()
		defer tx.Commit()
		if err != nil {
			http.Error(res, err.Error(), 500)
			return
		}

		stmt, err := tx.Prepare(`
            WITH deletedRow AS (
                DELETE FROM Entries
                WHERE id = $1
                RETURNING *
            )
            SELECT author
            FROM deletedRow;
        `)
		if err != nil {
			http.Error(res, err.Error(), 500)
			return
		}
		defer stmt.Close()

		row, err := stmt.Query(targetEntry.ID)
		if err != nil {
			http.Error(res, err.Error(), 500)
			return
		}

		row.Next()
		var entryAuthor string
		if err = row.Scan(&entryAuthor); err != nil {
			http.Error(res, err.Error(), 500)
			return
		}
		row.Close()

		if claims["username"] != entryAuthor && claims["role"] != "admin" {
			tx.Rollback()
			http.Error(res, err.Error(), 401)
			return
		}

		tagIDs := []int{0}
		entryUtils := rdbms.CreateEntryWrapper(db)
		err = entryUtils.CleanupStaleTags(tx, targetEntry, tagIDs)
		if err != nil {
			http.Error(res, err.Error(), 500)
			return
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

func validateRequest(jwtSecret string, req *http.Request, db *sql.DB) (error, map[string]interface{}) {
	token := req.Header.Get("JWT")
	claims, err := utils.GetClaimsFromToken(token)
	if err != nil {
		return err, claims
	}

	rows, err := db.Query("SELECT password, role FROM Users WHERE username = $1", claims["username"])
	defer rows.Close()
	rows.Next()

	var userInfo rdbms.UserInfo
	err = rows.Scan(&userInfo.Password, &userInfo.Role)
	if err != nil {
		return err, claims
	}

	salt := utils.Salt{
		Prefix: userInfo.Password,
		Suffix: userInfo.Role,
	}
	err = utils.ValidateToken(jwtSecret, token, salt)

	return err, claims
}
