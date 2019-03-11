package rdbms

import (
	"database/sql"
	"fmt"
	"log"
)

func Connect(config PostgresConfig) *sql.DB {
	db, err := sql.Open("postgres", "user='"+config.User+"' password='"+config.Password+"' dbname='"+config.DBName+"' sslmode='disable'")
	if err != nil {
		log.Fatal(err)
	} else {
		fmt.Println("connected to database", config.DBName)
	}
	return db
}
