package main

import (
	"log"
	"net/http"

	"varys/backend/routes"

	"github.com/julienschmidt/httprouter"
)

func main() {
	router := httprouter.New()
	router.NotFound = http.FileServer(http.Dir("../frontend/build/"))
	routes.RegisterRoutes(router)

	log.Fatal(http.ListenAndServe(":7676", router))
}
