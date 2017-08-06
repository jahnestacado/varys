package rdbms

import (
	"varys/backend/utils"

	_ "github.com/lib/pq"
)

func CreateDatabase(config utils.Postgres) error {
	varysDBName := config.DBName
	config.DBName = "postgres"
	db := Connect(config)

	rows, err := db.Query(`SELECT datname FROM pg_catalog.pg_database WHERE lower(datname) = lower('` + varysDBName + `');`)
	if err != nil {
		return err
	}
	defer rows.Close()
	varysDBExists := rows.Next()
	if !varysDBExists {
		_, err = db.Exec(`CREATE DATABASE ` + varysDBName + `;`)
	}

	return err
}
