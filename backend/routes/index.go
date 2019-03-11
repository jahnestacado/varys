package routes

import (
	"database/sql"
	"varys/backend/storage/rdbms"

	"github.com/julienschmidt/httprouter"
)

func Attach(router *httprouter.Router, db *sql.DB, config rdbms.AppServerConfig) {
	router.GET("/api/v1/search", CreateSearchGetRoute(db))
	router.GET("/api/v1/match", CreateMatchGetRoute(db))

	router.GET("/api/v1/entry/:id", CreateEntryGetRoute(db))
	router.PUT("/api/v1/entry", CreateEntryPutRoute(db))
	router.DELETE("/api/v1/entry/:id", CreateEntryDeleteRoute(db))

	router.GET("/api/v1/notification", CreateNotificationGetRoute(db, config.JWTSecret))
	router.PUT("/api/v1/notification/:id", CreateNotificationPutRoute(db, config.JWTSecret))
	router.DELETE("/api/v1/notification/:id", CreateNotificationDeleteRoute(db, config.JWTSecret))

	router.POST("/api/v1/merge_request", CreateMergeRequestPostRoute(db, config.JWTSecret))
	router.POST("/api/v1/merge_request/:action", CreateMergeRequestPostActionRoute(db, config.JWTSecret))
	router.GET("/api/v1/merge_request/:id", CreateMergeRequestGetRoute(db, config.JWTSecret))
	router.DELETE("/api/v1/merge_request/:id", CreateMergeRequestDeleteRoute(db, config.JWTSecret))

	router.POST("/api/v1/signup", CreateSignUpPostRoute(db))
	router.POST("/api/v1/signin", CreateSignInPostRoute(db))
	router.GET("/api/v1/verify/:username/:token/:timestamp", CreateVerifyGetRoute(db))

	router.GET("/api/v1/config", CreateConfigGetRoute(db))
	router.POST("/api/v1/config", CreateConfigPostRoute(db))

	// this always serves index.html
	router.NotFound = GetNotFoundRoute(db)
}
