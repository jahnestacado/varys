package routes

import (
	"varys/backend/utils"

	"database/sql"

	"github.com/julienschmidt/httprouter"
)

func Attach(router *httprouter.Router, db *sql.DB, config utils.Config) {
	router.GET("/search/:query", GetSearchRoute())
	router.POST("/api/v1/signup", GetSignUpRoute(db, &config))
	router.GET("/api/v1/verify/:username/:token", GetVerifyRoute(db, config.JWTSecret))
	router.POST("/api/v1/signin", GetSignInRoute(db, config.JWTSecret))
	router.NotFound = GetNotFoundRoute()
}
