package routes

import (
	"database/sql"

	"github.com/julienschmidt/httprouter"
)

func Attach(router *httprouter.Router, DB *sql.DB) {
	router.GET("/search/:query", GetSearchRoute())
	router.PUT("/api/v1/signup", GetSignUpRoute(DB))
	router.NotFound = GetNotFoundRoute()
}
