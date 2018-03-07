package routes

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"varys/backend/storage/rdbms"

	"github.com/julienschmidt/httprouter"
)

func CreateMergeRequestPostRoute(db *sql.DB, jwtSecret string) func(http.ResponseWriter, *http.Request, httprouter.Params) {
	return func(res http.ResponseWriter, req *http.Request, ps httprouter.Params) {
		bodyDecoder := json.NewDecoder(req.Body)
		defer req.Body.Close()
		var mergeRequest rdbms.MergeRequest
		err := bodyDecoder.Decode(&mergeRequest)
		if err != nil {
			http.Error(res, err.Error(), 500)
			return
		}

		err, _ = validateRequest(jwtSecret, req, db)
		if err != nil {
			http.Error(res, err.Error(), 401)
			return
		}

		mergeRequestTxUtils := rdbms.CreateMergeRequestTxUtils(db)
		tx, err := db.Begin()
		defer tx.Commit()
		if err != nil {
			http.Error(res, err.Error(), 500)
			return
		}

		mergeRequestID, err := mergeRequestTxUtils.InsertMergeRequest(tx, mergeRequest)
		if err != nil || mergeRequestID == 0 {
			tx.Rollback()
			http.Error(res, err.Error(), 500)
			return
		}

		notitificationTxUtils := rdbms.CreateNotificationTxUtils(db)
		notification := rdbms.Notification{
			SourceID:    mergeRequestID,
			Initiator:   mergeRequest.MergeRequestAuthor,
			Recipient:   mergeRequest.Author,
			Type:        "merge_request",
			Description: mergeRequest.Title,
			Viewed:      false,
		}

		notificationID, err := notitificationTxUtils.InsertNotification(tx, notification)
		if err != nil || notificationID == 0 {
			tx.Rollback()
			http.Error(res, err.Error(), 500)
			return
		}

		res.Write([]byte("null"))
	}
}

type mergeRequestActionInfo struct {
	NotificationID int `json:"notification_id"`
	MergeRequestID int `json:"merge_request_id"`
}

func CreateMergeRequestPostActionRoute(db *sql.DB, jwtSecret string) func(http.ResponseWriter, *http.Request, httprouter.Params) {
	return func(res http.ResponseWriter, req *http.Request, params httprouter.Params) {
		err, claims := validateRequest(jwtSecret, req, db)
		if err != nil {
			http.Error(res, err.Error(), 401)
			return
		}
		bodyDecoder := json.NewDecoder(req.Body)
		defer req.Body.Close()
		var actionInfo mergeRequestActionInfo
		err = bodyDecoder.Decode(&actionInfo)
		if err != nil {
			http.Error(res, err.Error(), 500)
			return
		}

		mergeRequestTxUtils := rdbms.CreateMergeRequestTxUtils(db)
		notitificationTxUtils := rdbms.CreateNotificationTxUtils(db)
		tx, err := db.Begin()
		defer tx.Commit()
		if err != nil {
			http.Error(res, err.Error(), 500)
			return
		}

		actionName := params.ByName("action")
		newNotificationSourceID := actionInfo.MergeRequestID
		if actionName == "accept" {
			deletedMergeRequest, err := mergeRequestTxUtils.DeleteMergeRequest(tx, actionInfo.MergeRequestID)
			if err != nil {
				tx.Rollback()
				http.Error(res, err.Error(), 500)
				return
			}
			entryTxUtils := rdbms.CreateEntryTxUtils(db)

			updatedEntry := rdbms.Entry{
				ID:     deletedMergeRequest.ID,
				Title:  deletedMergeRequest.Title,
				Body:   deletedMergeRequest.Body,
				Author: deletedMergeRequest.Author,
			}
			err = entryTxUtils.UpdateEntry(tx, updatedEntry)
			if err != nil {
				tx.Rollback()
				http.Error(res, err.Error(), 500)
				return
			}

			newNotificationSourceID = deletedMergeRequest.ID
		}

		if actionName == "reject" || actionName == "accept" {
			deletedNotification, err := notitificationTxUtils.DeleteNotification(tx, actionInfo.NotificationID)
			if err != nil {
				tx.Rollback()
				http.Error(res, err.Error(), 500)
				return
			}

			newNotification := rdbms.Notification{
				SourceID:    newNotificationSourceID,
				Initiator:   claims["username"].(string),
				Recipient:   deletedNotification.Initiator,
				Type:        "merge_request_" + actionName,
				Description: deletedNotification.Description,
				Viewed:      false,
			}

			newNotificationID, err := notitificationTxUtils.InsertNotification(tx, newNotification)
			if err != nil || newNotificationID == 0 {
				tx.Rollback()
				http.Error(res, err.Error(), 500)
				return
			}

			res.Write([]byte("null"))
		} else {
			// res.Write([]byte("Unknown action: " + actionName))
			res.WriteHeader(500)
		}
	}
}

func CreateMergeRequestDeleteRoute(db *sql.DB, jwtSecret string) func(http.ResponseWriter, *http.Request, httprouter.Params) {
	return func(res http.ResponseWriter, req *http.Request, params httprouter.Params) {
		err, claims := validateRequest(jwtSecret, req, db)
		if err != nil {
			http.Error(res, err.Error(), 401)
			return
		}
		mergeRequestID, err := getNumericParameter(params.ByName("id"), -1)
		if err != nil {
			http.Error(res, err.Error(), 500)
			return
		}
		mergeRequestTxUtils := rdbms.CreateMergeRequestTxUtils(db)
		tx, err := db.Begin()
		defer tx.Commit()
		mergeRequest, err := mergeRequestTxUtils.DeleteMergeRequest(tx, mergeRequestID)
		if err != nil {
			http.Error(res, err.Error(), 500)
			return
		}
		username := claims["username"]
		isUserAdmin := claims["role"] == "admin"
		if username != mergeRequest.MergeRequestAuthor && !isUserAdmin {
			tx.Rollback()
			http.Error(res, err.Error(), 401)
			return
		}

		notitificationTxUtils := rdbms.CreateNotificationTxUtils(db)

		notification, err := notitificationTxUtils.GetNotificationOfMergeRequest(tx, mergeRequest)
		if err != nil {
			http.Error(res, err.Error(), 500)
			return
		}

		_, err = notitificationTxUtils.DeleteNotification(tx, notification.ID)
		if err != nil {
			tx.Rollback()
			http.Error(res, err.Error(), 500)
			return
		}

		res.WriteHeader(200)
	}
}

func CreateMergeRequestGetRoute(db *sql.DB, jwtSecret string) func(http.ResponseWriter, *http.Request, httprouter.Params) {
	return func(res http.ResponseWriter, req *http.Request, params httprouter.Params) {
		err, claims := validateRequest(jwtSecret, req, db)
		if err != nil {
			http.Error(res, err.Error(), 401)
			return
		}

		mergeRequestID, err := getNumericParameter(params.ByName("id"), -1)
		if err != nil {
			http.Error(res, err.Error(), 401)
			return
		}

		mergeRequestTxUtils := rdbms.CreateMergeRequestTxUtils(db)
		tx, err := db.Begin()
		defer tx.Commit()
		if err != nil {
			http.Error(res, err.Error(), 500)
			return
		}

		res.Header().Set("Content-Type", "application/json")
		if mergeRequestID > 0 {
			mergeRequest, err := mergeRequestTxUtils.GetMergeRequest(tx, mergeRequestID)
			if err != nil {
				http.Error(res, err.Error(), 500)
				return
			}

			result, err := json.Marshal(mergeRequest)
			if err != nil {
				res.Write([]byte(err.Error()))
				return
			}
			res.Write(result)

		} else {
			mergeRequests, err := mergeRequestTxUtils.GetMergeRequests(tx, claims["username"].(string))
			if err != nil {
				http.Error(res, err.Error(), 500)
				return
			}

			if mergeRequests != nil {
				result, err := json.Marshal(mergeRequests)
				if err != nil {
					res.Write([]byte(err.Error()))
					return
				}
				res.Write(result)
			} else {
				res.Write([]byte("[]"))
			}
		}

	}
}
