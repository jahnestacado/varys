package rdbms

import "database/sql"

func CreateSchema(db *sql.DB, config PostgresConfig) error {

	const createAppServerConfigTable = `
		CREATE TABLE IF NOT EXISTS AppServerConfig (
			id serial PRIMARY KEY,
			jwt_secret text default md5(random()::text),
			email_address text NOT NULL,
			email_password text NOT NULL,
			smtp_host text NOT NULL,
			smtp_port text NOT NULL,
			host text NOT NULL,
			port text NOT NULL
		)
	`
	const createWordPool = `
        CREATE TABLE IF NOT EXISTS WordPool (
            id serial PRIMARY KEY,
            word varchar(80) UNIQUE NOT NULL
        )
    `
	const createEntryWord = `
        CREATE TABLE IF NOT EXISTS EntryWord (
            word_id integer,
            entry_id integer,
            PRIMARY KEY(word_id, entry_id)
        )
    `
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
	const createSuperAdminUser = `
		INSERT INTO Users (username, password, email, verified, role)
		VALUES ('varys', '$2a$10$aO.UlzGEoZReci/e5jM7P.eUaDcPoMfSkW/UFuR.sKpm5qOQXK0qG', 'varys@westeros.com', true, 'superadmin')
		ON CONFLICT DO NOTHING
	`
	const createEntriesTable = `
        CREATE TABLE IF NOT EXISTS Entries (
            id serial PRIMARY KEY,
            title varchar(254) NOT NULL,
            body text NOT NULL,
            author varchar(80) NOT NULL,
            created_timestamp timestamp DEFAULT current_timestamp,
            updated_timestamp timestamp DEFAULT current_timestamp,
            tsv tsvector
        )
    `
	const createMergeRequestsTable = `
	    CREATE TABLE IF NOT EXISTS MergeRequests (
	        merge_request_id serial PRIMARY KEY,
	        merge_request_author varchar(80) NOT NULL,
			id integer NOT NULL,
	        title varchar(254) NOT NULL,
	        body text NOT NULL,
	        author varchar(80) NOT NULL,
			created_timestamp timestamp DEFAULT current_timestamp,
			updated_timestamp timestamp DEFAULT current_timestamp,
			tags text[]
	    )
	`
	const createNotificationsTable = `
	    CREATE TABLE IF NOT EXISTS Notifications (
			id serial PRIMARY KEY,
			source_id integer NOT NULL,
			initiator varchar(80) NOT NULL,
			recipient varchar(80) NOT NULL,
	        description text,
	        type text NOT NULL,
			created_timestamp timestamp DEFAULT current_timestamp,
			viewed boolean DEFAULT false
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

	const createEnglishSimpleFTSConfig = `CREATE TEXT SEARCH CONFIGURATION english_simple ( COPY = pg_catalog.english );`
	const alterEnglishSimpleFTSMapping = `
        ALTER TEXT SEARCH CONFIGURATION english_simple
        ALTER MAPPING FOR asciihword, asciiword, hword, hword_asciipart, hword_part, word
        WITH english_simple;
    `

	const createEnglishIspellDict = `
        CREATE TEXT SEARCH DICTIONARY english_ispell (
            TEMPLATE = ispell,
            DictFile = english,
            AffFile = english,
            StopWords = english
        );
    `
	const createEnglishSimpleDict = `
        CREATE TEXT SEARCH DICTIONARY english_simple (
            TEMPLATE = simple,
            StopWords = english
        );
    `
	const installUnaccentDict = `CREATE EXTENSION unaccent;`
	const installTrigrams = `CREATE EXTENSION pg_trgm;`
	const dropFTSConstructs = `
        DROP TEXT SEARCH CONFIGURATION IF EXISTS varys_fts CASCADE;
        DROP TEXT SEARCH DICTIONARY IF EXISTS english_ispell CASCADE;
        DROP TEXT SEARCH DICTIONARY IF EXISTS english_simple CASCADE;
        DROP EXTENSION IF EXISTS unaccent CASCADE;
        DROP EXTENSION IF EXISTS pg_trgm CASCADE;
    `
	const createTSVGIN = `CREATE INDEX IF NOT EXISTS tsvGin ON Entries USING gin(tsv);`

	var commands = [20]string{
		createWordPool,
		createEntryWord,
		createUsersTable,
		createSuperAdminUser,
		createEntriesTable,
		createMergeRequestsTable,
		createNotificationsTable,
		createTagsTable,
		createEntryTagTable,
		createTSVGIN,
		dropFTSConstructs,
		installTrigrams,
		installUnaccentDict,
		createEnglishIspellDict,
		createEnglishSimpleDict,
		createVarysFTSConfig,
		createEnglishSimpleFTSConfig,
		alterFTSMapping,
		alterEnglishSimpleFTSMapping,
		createAppServerConfigTable,
	}

	for _, command := range commands {
		_, err := db.Exec(command)
		if err != nil {
			return err
		}
	}

	return nil
}
