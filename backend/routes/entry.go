package routes

import (
	"database/sql"
	"encoding/json"
	"errors"
	"net/http"
	"varys/backend/storage/cache"
	"varys/backend/storage/rdbms"
	"varys/backend/utils"

	"github.com/julienschmidt/httprouter"
)

func CreateEntryPutRoute(db *sql.DB, jwtSecret string) func(http.ResponseWriter, *http.Request, httprouter.Params) {
	return func(res http.ResponseWriter, req *http.Request, ps httprouter.Params) {
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

		// @TODO Below code is insufficient. We also need to check if the ID exists in the Database
		if entry.ID > 0 {
			if err = updateEntry(db, entry); err != nil {
				http.Error(res, err.Error(), 500)
				return
			}
			cache.DeleteCachedEntries(func(cachedEntries []rdbms.Entry, key string, index int) bool {
				return cachedEntries[index].ID == entry.ID
			})
		} else {
			if err = insertEntry(db, entry); err != nil {
				http.Error(res, err.Error(), 500)
				return
			}
			cache.DeleteCachedEntries(func(cachedEntries []rdbms.Entry, key string, index int) bool {
				entryTxUtils := rdbms.CreateEntryTxUtils(db)
				matchedEntries, err := entryTxUtils.GetMatchedEntries(key)
				if err != nil {
					http.Error(res, err.Error(), 500)
					return false
				}
				numOfEntries := len(matchedEntries)
				numOfCachedEntries := len(cachedEntries)

				return numOfEntries != numOfCachedEntries
			})
		}

		res.Write([]byte("null"))
	}
}

func CreateEntryGetRoute(db *sql.DB) func(http.ResponseWriter, *http.Request, httprouter.Params) {
	return func(res http.ResponseWriter, req *http.Request, params httprouter.Params) {
		entryID, err := getNumericParameter(params.ByName("id"), -1)
		entryTxUtils := rdbms.CreateEntryTxUtils(db)
		entry, err := entryTxUtils.GetEntry(entryID)
		if err != nil {
			http.Error(res, err.Error(), 500)
			return
		}

		tags, err := entryTxUtils.GetTags(entryID)
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

func CreateEntryDeleteRoute(db *sql.DB, jwtSecret string) func(http.ResponseWriter, *http.Request, httprouter.Params) {
	return func(res http.ResponseWriter, req *http.Request, params httprouter.Params) {
		entryID, err := getNumericParameter(params.ByName("id"), -1)

		err, claims := validateRequest(jwtSecret, req, db)
		if err != nil {
			http.Error(res, err.Error(), 401)
			return
		}

		err = deleteEntry(db, entryID, claims)
		if err != nil {
			http.Error(res, err.Error(), 500)
			return
		}

		res.Write([]byte("null"))
	}
}

func deleteEntry(db *sql.DB, entryID int, claims map[string]interface{}) error {
	tx, err := db.Begin()
	defer tx.Commit()
	if err != nil {
		return err
	}

	entryTxUtils := rdbms.CreateEntryTxUtils(db)
	entryWords, err := entryTxUtils.GetEntryWords(tx, entryID)
	if err != nil {
		return err
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
		return err
	}
	defer stmt.Close()

	row, err := stmt.Query(entryID)
	if err != nil {
		return err
	}

	row.Next()
	var entryAuthor string
	if err = row.Scan(&entryAuthor); err != nil {
		return err
	}
	row.Close()

	if claims["username"] != entryAuthor && claims["role"] != "admin" {
		tx.Rollback()
		return errors.New("Unauthorized action for user: " + claims["username"].(string) + " with role: " + claims["role"].(string))
	}

	tagIDs := []int{0}
	err = entryTxUtils.CleanupStaleTags(tx, entryID, tagIDs)
	if err != nil {
		return err
	}
	cache.DeleteCachedEntries(func(cachedEntries []rdbms.Entry, key string, index int) bool {
		return cachedEntries[index].ID == entryID
	})

	if err = entryTxUtils.CleanStaleWords(tx, entryID, entryWords); err != nil {
		tx.Rollback()
		return err
	}

	return err
}

func insertEntry(db *sql.DB, entry rdbms.Entry) error {
	entryTxUtils := rdbms.CreateEntryTxUtils(db)

	tx, err := db.Begin()
	defer tx.Commit()
	if err != nil {
		return err
	}

	entryID, err := entryTxUtils.AddEntry(tx, entry)
	if err != nil || entryID == 0 {
		tx.Rollback()
		return err
	}

	tagIDs, err := entryTxUtils.AddTags(tx, entry.Tags)
	if err != nil {
		tx.Rollback()
		return err
	}

	if err = entryTxUtils.MapEntryToTags(tx, entryID, tagIDs); err != nil {
		tx.Rollback()
		return err
	}

	if err = entryTxUtils.UpdateEntryTSV(tx, entryID); err != nil {
		tx.Rollback()
		return err
	}

	if err = entryTxUtils.UpdateWordPool(tx, entryID); err != nil {
		tx.Rollback()
		return err
	}

	return err
}

func updateEntry(db *sql.DB, entry rdbms.Entry) error {
	entryTxUtils := rdbms.CreateEntryTxUtils(db)

	tx, err := db.Begin()
	defer tx.Commit()
	if err != nil {
		return err
	}

	registeredEntryWords, err := entryTxUtils.GetEntryWords(tx, entry.ID)
	if err != nil {
		return err
	}

	if err = entryTxUtils.UpdateEntry(tx, entry); err != nil {
		tx.Rollback()
		return err
	}
	tagIDs, err := entryTxUtils.UpdateTags(tx, entry)
	if err != nil {
		tx.Rollback()
		return err
	}

	if err = entryTxUtils.MapEntryToTags(tx, entry.ID, tagIDs); err != nil {
		tx.Rollback()
		return err
	}

	if err = entryTxUtils.UpdateEntryTSV(tx, entry.ID); err != nil {
		tx.Rollback()
		return err
	}

	if err = entryTxUtils.UpdateWordPool(tx, entry.ID); err != nil {
		tx.Rollback()
		return err
	}

	if err = entryTxUtils.CleanStaleWords(tx, entry.ID, registeredEntryWords); err != nil {
		tx.Rollback()
		return err
	}

	return err
}

// @TODO Move below function to separate file
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
