package routes

import (
	"database/sql"

	"github.com/julienschmidt/httprouter"
)

func Attach(router *httprouter.Router, DB *sql.DB) {
	router.GET("/search/:query", GetSearchRoute())
	router.POST("/api/v1/signup", GetSignUpRoute(DB))
	router.NotFound = GetNotFoundRoute()
}
