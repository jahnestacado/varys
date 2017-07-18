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
const ENTRIES_TABLE = `
    CREATE TABLE IF NOT EXISTS Entries (
        id serial PRIMARY KEY,
        title varchar(254) NOT NULL,
        body text,
        author varchar(80) NOT NULL,
        timestamp timestamp DEFAULT current_timestamp,
        tsv tsvector
    )
`
const TAGS_TABLE = `
    CREATE TABLE IF NOT EXISTS Tags (
        id serial PRIMARY KEY,
        name varchar(80) UNIQUE NOT NULL
    )
`
const ENTRY_TAG_TABLE = `
    CREATE TABLE IF NOT EXISTS EntryTag (
        entry_id integer NOT NULL,
        tag_id integer  NOT NULL,
        PRIMARY KEY(entry_id, tag_id)
    )
`

func CreateSchema(db *sql.DB) error {
	_, err := db.Exec(USERS_TABLE)
	if err != nil {
		return err
	}
	_, err = db.Exec(ENTRIES_TABLE)
	if err != nil {
		return err
	}
	_, err = db.Exec(TAGS_TABLE)
	if err != nil {
		return err
	}
	_, err = db.Exec(ENTRY_TAG_TABLE)
	return err
}
