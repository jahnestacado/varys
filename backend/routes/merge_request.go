package routes

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"varys/backend/storage/rdbms"

	"github.com/julienschmidt/httprouter"
)

func CreateMergeRequestPutRoute(db *sql.DB, jwtSecret string) func(http.ResponseWriter, *http.Request, httprouter.Params) {
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

		if err = submitMergeRequest(db, mergeRequest); err != nil {
			http.Error(res, err.Error(), 500)
			return
		}

		res.WriteHeader(200)
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
		isUserInvolvedInMergeRequest := username == mergeRequest.Author || username != mergeRequest.MergeRequestAuthor
		isUserAdmin := claims["role"] == "admin"
		if !isUserInvolvedInMergeRequest && !isUserAdmin {
			tx.Rollback()
			http.Error(res, err.Error(), 401)
			return
		}

		res.WriteHeader(200)
	}
}

func CreateMergeRequestGetRoute(db *sql.DB, jwtSecret string) func(http.ResponseWriter, *http.Request, httprouter.Params) {
	return func(res http.ResponseWriter, req *http.Request, ps httprouter.Params) {
		err, claims := validateRequest(jwtSecret, req, db)
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

		mergeRequests, err := mergeRequestTxUtils.GetMergeRequests(tx, claims["username"].(string))
		if err != nil {
			http.Error(res, err.Error(), 500)
			return
		}

		res.Header().Set("Content-Type", "application/json")
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

func submitMergeRequest(db *sql.DB, mergeRequest rdbms.MergeRequest) error {
	mergeRequestTxUtils := rdbms.CreateMergeRequestTxUtils(db)

	tx, err := db.Begin()
	defer tx.Commit()
	if err != nil {
		return err
	}

	mergeRequestID, err := mergeRequestTxUtils.InsertMergeRequest(tx, mergeRequest)
	if err != nil || mergeRequestID == 0 {
		tx.Rollback()
		return err
	}

	return err
}
