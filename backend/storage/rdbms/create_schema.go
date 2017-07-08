package rdbms

import (
	"database/sql"

	_ "github.com/lib/pq"
)

// Should create also admin user

const USERS_TABLE = `
    CREATE TABLE IF NOT EXISTS Users (
        user_id serial PRIMARY KEY,
        email varchar(254) UNIQUE NOT NULL,
        username varchar(80) UNIQUE NOT NULL,
        password varchar(80) NOT NULL,
        verified boolean DEFAULT false,
        role text DEFAULT 'user',
        member_since timestamp DEFAULT current_timestamp
    )
`

func CreateSchema(db *sql.DB) error {
	_, err := db.Exec(USERS_TABLE)
	return err
}
