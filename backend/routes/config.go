package routes

import (
	"encoding/json"
	"errors"
	"varys/backend/storage/rdbms"

	"database/sql"
	"net/http"

	"github.com/julienschmidt/httprouter"
)

func CreateConfigGetRoute(db *sql.DB) func(http.ResponseWriter, *http.Request, httprouter.Params) {
	return func(res http.ResponseWriter, req *http.Request, params httprouter.Params) {
		appServerConfig := rdbms.GetAppServerConfig(db)
		if err := isAuthorizedRequest(db, req, appServerConfig); err != nil {
			http.Error(res, err.Error(), 401)
			return
		}
		config, err := json.Marshal(appServerConfig)
		if err != nil {
			res.Write([]byte(err.Error()))
		} else {
			res.Header().Set("Content-Type", "application/json")
			res.Write(config)
		}

	}
}

func CreateConfigPostRoute(db *sql.DB) func(http.ResponseWriter, *http.Request, httprouter.Params) {
	return func(res http.ResponseWriter, req *http.Request, params httprouter.Params) {
		appServerConfig := rdbms.GetAppServerConfig(db)
		if err := isAuthorizedRequest(db, req, appServerConfig); err != nil {
			http.Error(res, err.Error(), 401)
			return
		}
		bodyDecoder := json.NewDecoder(req.Body)
		defer req.Body.Close()
		var config rdbms.AppServerConfig
		err := bodyDecoder.Decode(&config)
		if err != nil {
			http.Error(res, err.Error(), 500)
			return
		}

		_, err = rdbms.SetAppServerConfig(db, config.SMTP)
		if err != nil {
			res.Write([]byte(err.Error()))
		} else {
			res.Header().Set("Content-Type", "application/json")
			res.Write([]byte("null"))
		}

	}
}

func isAuthorizedRequest(db *sql.DB, req *http.Request, appServerConfig rdbms.AppServerConfig) error {
	var err error
	validationErr, claims := validateRequest(appServerConfig.JWTSecret, req, db)
	if validationErr != nil || !isSuperAdminUser(claims) {
		err = errors.New("Invalid user role. Superadmin rights required")
	}
	return err
}

func isSuperAdminUser(claims map[string]interface{}) bool {
	return claims["role"] == "superadmin"
}
