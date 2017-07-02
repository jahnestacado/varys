package postgres

import (
	"database/sql"
	"fmt"
	"log"

	_ "github.com/lib/pq"
)

func Connect() *sql.DB {
	db, err := sql.Open("postgres", "user='varys-dev' password='12345' dbname='varys-dev'")
	if err != nil {
		log.Fatal(err)
	} else {
		fmt.Println("connected to PostgresDB")
	}
	return db
}
