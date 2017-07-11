package routes

import (
	"varys/backend/utils"

	"database/sql"

	"github.com/julienschmidt/httprouter"
)

func Attach(router *httprouter.Router, db *sql.DB, config utils.Config) {
	router.GET("/search/:query", GetSearchRoute())
	router.POST("/api/v1/signup", GetSignUpRoute(db))
	router.POST("/api/v1/signin", GetSignInRoute(db, config.JWTSecret))
	router.NotFound = GetNotFoundRoute()
}
