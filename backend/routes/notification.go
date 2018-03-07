package routes

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"varys/backend/storage/rdbms"

	"github.com/julienschmidt/httprouter"
)

func CreateNotificationPutRoute(db *sql.DB, jwtSecret string) func(http.ResponseWriter, *http.Request, httprouter.Params) {
	return func(res http.ResponseWriter, req *http.Request, params httprouter.Params) {
		notificationID, err := getNumericParameter(params.ByName("id"), -1)
		if err != nil {
			http.Error(res, err.Error(), 500)
			return
		}
		if notificationID > 0 {
			bodyDecoder := json.NewDecoder(req.Body)
			defer req.Body.Close()
			var notification rdbms.Notification
			err := bodyDecoder.Decode(&notification)
			if err != nil {
				http.Error(res, err.Error(), 500)
				return
			}

			err, _ = validateRequest(jwtSecret, req, db)
			if err != nil {
				http.Error(res, err.Error(), 401)
				return
			}

			notificationTxUtils := rdbms.CreateNotificationTxUtils(db)
			tx, err := db.Begin()
			defer tx.Commit()
			if err != nil {
				http.Error(res, err.Error(), 500)
				return
			}

			_, err = notificationTxUtils.InsertNotification(tx, notification)
			if err != nil {
				tx.Rollback()
				http.Error(res, err.Error(), 500)
				return
			}

			res.Write([]byte("null"))
		} else {
			res.WriteHeader(400)
		}
	}
}

func CreateNotificationDeleteRoute(db *sql.DB, jwtSecret string) func(http.ResponseWriter, *http.Request, httprouter.Params) {
	return func(res http.ResponseWriter, req *http.Request, params httprouter.Params) {
		notificationID, err := getNumericParameter(params.ByName("id"), -1)
		if err != nil {
			http.Error(res, err.Error(), 500)
			return
		}

		err, _ = validateRequest(jwtSecret, req, db)
		if err != nil {
			http.Error(res, err.Error(), 401)
			return
		}

		notificationTxUtils := rdbms.CreateNotificationTxUtils(db)
		tx, err := db.Begin()
		defer tx.Commit()
		if err != nil {
			http.Error(res, err.Error(), 500)
			return
		}

		_, err = notificationTxUtils.DeleteNotification(tx, notificationID)
		if err != nil {
			http.Error(res, err.Error(), 500)
			return
		}

		res.Write([]byte("[]"))
	}
}

func CreateNotificationGetRoute(db *sql.DB, jwtSecret string) func(http.ResponseWriter, *http.Request, httprouter.Params) {
	return func(res http.ResponseWriter, req *http.Request, params httprouter.Params) {
		err, claims := validateRequest(jwtSecret, req, db)
		if err != nil {
			http.Error(res, err.Error(), 401)
			return
		}
		notificationTxUtils := rdbms.CreateNotificationTxUtils(db)
		tx, err := db.Begin()
		defer tx.Commit()
		if err != nil {
			http.Error(res, err.Error(), 500)
			return
		}

		notifications, err := notificationTxUtils.GetNotifications(tx, claims["username"].(string))
		if err != nil {
			http.Error(res, err.Error(), 500)
			return
		}

		res.Header().Set("Content-Type", "application/json")
		if notifications != nil {
			result, err := json.Marshal(notifications)
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
