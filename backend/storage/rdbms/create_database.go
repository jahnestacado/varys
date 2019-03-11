package rdbms

import _ "github.com/lib/pq"

func CreateDatabase(config PostgresConfig) error {
	initConfig := PostgresConfig{
		User:     config.User,
		Password: config.Password,
		DBName:   "postgres",
	}
	db := Connect(initConfig)
	defer db.Close()

	rows, err := db.Query(`SELECT datname FROM pg_catalog.pg_database WHERE lower(datname) = lower('` + config.DBName + `');`)
	if err != nil {
		return err
	}
	defer rows.Close()
	varysDBExists := rows.Next()

	if !varysDBExists {
		_, err = db.Exec(`CREATE DATABASE ` + config.DBName + `;`)
	}

	return err
}
