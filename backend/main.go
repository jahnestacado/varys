package main

import (
	"log"
	"net/http"

	"varys/backend/routes"
	"varys/backend/storage/postgres"

	"github.com/julienschmidt/httprouter"
	"github.com/rs/cors"
)

func main() {

	DB := postgres.Connect()
	err := postgres.CreateSchema(DB)
	if err != nil {
		log.Fatal(err)
	}

	router := httprouter.New()
	handler := cors.Default().Handler(router)
	routes.Attach(router, DB)

	log.Fatal(http.ListenAndServe(":7676", handler))
}
