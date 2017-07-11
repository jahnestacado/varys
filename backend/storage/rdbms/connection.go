package rdbms

import (
	"database/sql"
	"fmt"
	"log"
	"varys/backend/utils"

	_ "github.com/lib/pq"
)

func Connect(config utils.Postgres) *sql.DB {
	db, err := sql.Open("postgres", "user='"+config.User+"' password='"+config.Password+"' dbname='"+config.DBName+"'")
	if err != nil {
		log.Fatal(err)
	} else {
		fmt.Println("connected to database")
	}
	return db
}
