package main

import (
	"log"
	"net/http"
	"varys/backend/utils"

	"varys/backend/routes"
	"varys/backend/storage/rdbms"

	"github.com/julienschmidt/httprouter"
	"github.com/rs/cors"
)

func main() {
	config, err := utils.GetConfig("config.json")
	if err != nil {
		log.Fatal(err)
	}

	db := rdbms.Connect(config.Postgres)
	err = rdbms.CreateSchema(db)
	if err != nil {
		log.Fatal(err)
	}

	router := httprouter.New()
	routes.Attach(router, db, config)
	if config.Mode == "dev" {
		preflight := cors.New(cors.Options{
			AllowedOrigins: []string{"*"},
			AllowedMethods: []string{"GET", "PUT", "POST", "DELETE"},
			AllowedHeaders: []string{"content-type", "jwt"},
		})
		handler := preflight.Handler(router)
		log.Fatal(http.ListenAndServe(config.Hostname+":"+config.Port, handler))
	} else {
		log.Fatal(http.ListenAndServe(config.Hostname+":"+config.Port, router))
	}
}
