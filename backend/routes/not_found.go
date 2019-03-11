package routes

import (
	"database/sql"
	"net/http"

	s "strings"
)

func GetNotFoundRoute(DB *sql.DB) http.Handler {
	return http.HandlerFunc(func(res http.ResponseWriter, req *http.Request) {
		requestURI := req.RequestURI
		if s.HasPrefix(requestURI, "/static") {
			http.ServeFile(res, req, "../frontend/build"+requestURI)
		} else {
			http.ServeFile(res, req, "../frontend/build/index.html")
		}
	})
}
