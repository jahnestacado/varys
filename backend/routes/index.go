package routes

import (
	"database/sql"

	"github.com/julienschmidt/httprouter"
)

func Attach(router *httprouter.Router, db *sql.DB) {
	router.GET("/search/:query", GetSearchRoute())
	router.POST("/api/v1/signup", GetSignUpRoute(db))
	router.NotFound = GetNotFoundRoute()
}
