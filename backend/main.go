package main

import (
	"log"
	"net/http"

	"github.com/julienschmidt/httprouter"
	"github.com/rs/cors"

	"varys/backend/routes"
	"varys/backend/storage/rdbms"
	"varys/backend/utils"
)

const defaultMode = "dev"

func main() {
	env := utils.Env()
	mode := env.Get("VARYS_MODE", defaultMode, false)

	postgresConfig := rdbms.GetPostgresConfig()
	err := rdbms.CreateDatabase(postgresConfig)
	if err != nil {
		log.Fatal(err)
	}
	db := rdbms.Connect(postgresConfig)
	err = rdbms.CreateSchema(db, postgresConfig)
	if err != nil {
		log.Fatal(err)
	}

	_, err = rdbms.InitAppServerConfig(db)
	if err != nil {
		log.Fatalf(err.Error())
	}

	config := rdbms.GetAppServerConfig(db)

	router := httprouter.New()
	routes.Attach(router, db, config)
	if mode == "dev" {
		preflight := cors.New(cors.Options{
			AllowedOrigins: []string{"*"},
			AllowedMethods: []string{"GET", "PUT", "POST", "DELETE"},
			AllowedHeaders: []string{"content-type", "jwt"},
		})
		handler := preflight.Handler(router)
		log.Fatal(http.ListenAndServe(config.Host+":"+config.Port, handler))
	} else {
		log.Fatal(http.ListenAndServe(config.Host+":"+config.Port, router))
	}
}
