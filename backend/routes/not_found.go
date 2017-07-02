package routes

import (
	"net/http"
	s "strings"
)

func serveIndex(res http.ResponseWriter, req *http.Request) {
	requestURI := req.RequestURI
	if s.HasPrefix(requestURI, "/static") {
		http.ServeFile(res, req, "../frontend/build"+requestURI)
	} else {
		http.ServeFile(res, req, "../frontend/build/index.html")
	}
}

func GetNotFoundRoute() http.Handler {
	return http.HandlerFunc(serveIndex)
}
