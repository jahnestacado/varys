package rdbms

import (
	"database/sql"

	_ "github.com/lib/pq"
)

// Should create also admin user

const USERS_TABLE = `
    CREATE TABLE IF NOT EXISTS Users (
        user_id serial PRIMARY KEY,
        email varchar(254) UNIQUE,
        username varchar(80) UNIQUE,
        password varchar(255),
        verified boolean DEFAULT false,
        type text DEFAULT 'member',
        joined timestamp DEFAULT current_timestamp
    )
`

func CreateSchema(db *sql.DB) error {
	_, err := db.Exec(USERS_TABLE)
	return err
}
