package routes

import (
	"database/sql"

	"github.com/julienschmidt/httprouter"
)

func Attach(router *httprouter.Router, db *sql.DB) {
	router.GET("/search/:query", GetSearchRoute())
	router.POST("/api/v1/signup", GetSignUpRoute(db))
	router.POST("/api/v1/signin", GetSignInRoute(db))
	router.NotFound = GetNotFoundRoute()
}
