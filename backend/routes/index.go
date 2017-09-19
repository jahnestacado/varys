package routes

import (
	"varys/backend/utils"

	"database/sql"

	"github.com/julienschmidt/httprouter"
)

func Attach(router *httprouter.Router, db *sql.DB, config utils.Config) {
	router.GET("/api/v1/search", CreateSearchGetRoute(db))
	router.GET("/api/v1/match", CreateMatchGetRoute(db))
	router.PUT("/api/v1/entry", CreateEntryPutRoute(db, config.JWTSecret))
	router.DELETE("/api/v1/entry", CreateEntryDeleteRoute(db, config.JWTSecret))
	router.POST("/api/v1/signup", CreateSignUpPostRoute(db, &config))
	router.GET("/api/v1/verify/:username/:token/:timestamp", CreateVerifyGetRoute(db, config.JWTSecret))
	router.POST("/api/v1/signin", CreateSignInPostRoute(db, config.JWTSecret))
	router.NotFound = GetNotFoundRoute()
}
