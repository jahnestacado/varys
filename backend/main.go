backend/main.gopackage main

import (
	"log"
	"net/http"

	"varys/backend/routes"

	"github.com/julienschmidt/httprouter"
	"github.com/rs/cors"
)

func main() {
	router := httprouter.New()
	router.NotFound = http.FileServer(http.Dir("../frontend/build/"))
	routes.RegisterRoutes(router)
	handler := cors.Default().Handler(router)

	log.Fatal(http.ListenAndServe(":7676", handler))
}
