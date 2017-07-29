package routes

import (
	"varys/backend/utils"

	"database/sql"

	"github.com/julienschmidt/httprouter"
)

func Attach(router *httprouter.Router, db *sql.DB, config utils.Config) {
	router.GET("/api/v1/search/:query", CreateGetRouteSearch(db))
	router.PUT("/api/v1/entry", CreatePutRouteEntry(db, config.JWTSecret))
	router.DELETE("/api/v1/entry", CreateDeleteRouteEntry(db, config.JWTSecret))
	router.POST("/api/v1/signup", CreatePostRouteSignUp(db, &config))
	router.GET("/api/v1/verify/:username/:token", CreateGetRouteVerify(db, config.JWTSecret))
	router.POST("/api/v1/signin", CreatePostRouteSignIn(db, config.JWTSecret))
	router.NotFound = GetNotFoundRoute()
}
