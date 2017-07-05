package main

import (
	"log"
	"net/http"

	"varys/backend/routes"
	"varys/backend/storage/rdbms"

	"github.com/julienschmidt/httprouter"
	"github.com/rs/cors"
)

func main() {

	db := rdbms.Connect()
	err := rdbms.CreateSchema(db)
	if err != nil {
		log.Fatal(err)
	}

	router := httprouter.New()
	handler := cors.Default().Handler(router)
	routes.Attach(router, db)

	log.Fatal(http.ListenAndServe(":7676", handler))
}
