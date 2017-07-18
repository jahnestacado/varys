package routes

import (
	"varys/backend/utils"

	"database/sql"

	"github.com/julienschmidt/httprouter"
)

func Attach(router *httprouter.Router, db *sql.DB, config utils.Config) {
	router.GET("/api/v1/search/:query", GetSearchRoute(db))
	router.PUT("/api/v1/entry", GetEntryRoute(db, config.JWTSecret))
	router.POST("/api/v1/signup", GetSignUpRoute(db, &config))
	router.GET("/api/v1/verify/:username/:token", GetVerifyRoute(db, config.JWTSecret))
	router.POST("/api/v1/signin", GetSignInRoute(db, config.JWTSecret))
	router.NotFound = GetNotFoundRoute()
}
