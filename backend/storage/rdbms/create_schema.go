package rdbms

import (
	"database/sql"
	"varys/backend/utils"

	_ "github.com/lib/pq"
)

func CreateSchema(db *sql.DB, config utils.Postgres) error {
	// Should create also admin user

	const createSchema = `CREATE SCHEMA IF NOT EXISTS Varys;`
	var setSearchPath = `ALTER DATABASE ` + config.DBName + ` SET search_path TO Varys;`

	const createUsersTable = `
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
	const createEntriesTable = `
        CREATE TABLE IF NOT EXISTS Entries (
            id serial PRIMARY KEY,
            title varchar(254) NOT NULL,
            body text,
            author varchar(80) NOT NULL,
            timestamp timestamp DEFAULT current_timestamp,
            tsv tsvector
        )
    `
	const createTagsTable = `
        CREATE TABLE IF NOT EXISTS Tags (
            id serial PRIMARY KEY,
            name varchar(80) UNIQUE NOT NULL
        )
    `
	const createEntryTagTable = `
        CREATE TABLE IF NOT EXISTS EntryTag (
            entry_id integer NOT NULL,
            tag_id integer  NOT NULL,
            PRIMARY KEY(entry_id, tag_id)
        )
    `

	const createVarysFTSConfig = `CREATE TEXT SEARCH CONFIGURATION varys_fts ( COPY = pg_catalog.english );`
	const alterFTSMapping = `
        ALTER TEXT SEARCH CONFIGURATION varys_fts
        ALTER MAPPING FOR asciiword, asciihword, hword_asciipart,
                          word, hword, hword_part
        WITH unaccent, english_ispell, english_stem;
    `
	const createEngIspellDict = `
        CREATE TEXT SEARCH DICTIONARY english_ispell (
            TEMPLATE = ispell,
            DictFile = english,
            AffFile = english,
            StopWords = english
        );
    `
	const installUnaccentDict = `CREATE EXTENSION unaccent;`
	const dropFTSConstructs = `
        DROP TEXT SEARCH CONFIGURATION IF EXISTS varys_fts;
        DROP TEXT SEARCH DICTIONARY IF EXISTS english_ispell;
        DROP EXTENSION IF EXISTS unaccent;
    `
	const createTSVGIN = `CREATE INDEX IF NOT EXISTS tsvGin ON Entries USING gin(tsv);`

	var commands = [12]string{
		createSchema,
		setSearchPath,
		createUsersTable,
		createEntriesTable,
		createTagsTable,
		createEntryTagTable,
		createTSVGIN,
		dropFTSConstructs,
		installUnaccentDict,
		createEngIspellDict,
		createVarysFTSConfig,
		alterFTSMapping,
	}

	for _, command := range commands {
		_, err := db.Exec(command)
		if err != nil {
			return err
		}
	}

	return nil
}
