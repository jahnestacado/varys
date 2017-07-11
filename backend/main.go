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
	handler := cors.Default().Handler(router)
	routes.Attach(router, db, config)

	log.Fatal(http.ListenAndServe(config.Hostname+":"+config.Port, handler))
}
