package rdbms

import (
	"database/sql"
	"strconv"
	"strings"
	"varys/backend/utils"

	_ "github.com/lib/pq"
)

type Entry struct {
	ID      int      `json:"id"`
	Title   string   `json:"title"`
	Body    string   `json:"body"`
	Tags    []string `json:"tags"`
	Author  string   `json:"author"`
	Created string   `json:"created"`
	Updated string   `json:"updated"`
}

type Tag struct {
	ID   int
	Name string
}

type EntryWord struct {
	ID   int
	Word string
}

type entryTxUtils struct {
	DB *sql.DB
}

func CreateEntryTxUtils(db *sql.DB) entryTxUtils {
	return entryTxUtils{db}
}

func (e *entryTxUtils) AddEntry(tx *sql.Tx, newEntry Entry) (int, error) {
	var entryID int
	stmt, err := tx.Prepare(`
        INSERT INTO Entries (title, body, author)
        VALUES ($1, $2, $3)
        RETURNING id;
        `)
	defer stmt.Close()
	if err != nil {
		return 0, err
	}

	row, err := stmt.Query(newEntry.Title, newEntry.Body, newEntry.Author)
	defer row.Close()
	if err != nil {
		return 0, err
	}
	row.Next()
	if err = row.Scan(&entryID); err != nil {
		return 0, err
	}

	return entryID, err
}

func (e *entryTxUtils) UpdateEntry(tx *sql.Tx, newEntry Entry) error {
	stmt, err := tx.Prepare(`
        UPDATE Entries
        SET title = $2, body = $3, author = $4, updated_timestamp = now()
        WHERE id = $1
    `)
	defer stmt.Close()
	if err != nil {
		return err
	}

	_, err = stmt.Exec(newEntry.ID, newEntry.Title, newEntry.Body, newEntry.Author)
	if err != nil {
		return err
	}

	return err
}

func (e *entryTxUtils) GetEntry(entryID int) (Entry, error) {
	var entry Entry
	stmt, err := e.DB.Prepare(`
        SELECT *
		FROM Entries
        WHERE id = $1
    `)
	defer stmt.Close()
	if err != nil {
		return entry, err
	}

	row, err := stmt.Query(entryID)
	if err != nil {
		return entry, err
	}
	row.Next()
	var dummy string
	err = row.Scan(&entry.ID, &entry.Title, &entry.Body, &entry.Author, &entry.Created, &entry.Updated, &dummy)
	if err != nil {
		return entry, err
	}

	return entry, err
}

func (e *entryTxUtils) AddTags(tx *sql.Tx, tags []string) ([]int, error) {
	numOfTags := len(tags)
	tagIDs := make([]int, numOfTags)
	stmt, err := tx.Prepare(`
        WITH existingRow AS (
            SELECT id
            FROM Tags
            WHERE name = $1
        ), newRow AS (
            INSERT INTO Tags ( name )
            SELECT $1
            WHERE NOT EXISTS (SELECT 1 FROM existingRow)
            RETURNING id
        )
        SELECT id
        FROM newRow
        UNION ALL
        SELECT id
        FROM existingRow
    `)
	defer stmt.Close()
	if err != nil {
		return nil, err
	}

	for index, tag := range tags {
		row, err := stmt.Query(tag)
		if err != nil {
			return nil, err
		}

		row.Next()
		var tagID int
		err = row.Scan(&tagID)
		if err != nil {
			return nil, err
		}
		row.Close()
		tagIDs[index] = tagID

	}

	return tagIDs, nil
}

func (e *entryTxUtils) UpdateTags(tx *sql.Tx, entry Entry) ([]int, error) {
	tagIDs, err := e.AddTags(tx, entry.Tags)
	if err != nil {
		return nil, err
	}
	err = e.MapEntryToTags(tx, entry.ID, tagIDs)
	if err != nil {
		return nil, err
	}

	if len(tagIDs) > 0 {
		err = e.CleanupStaleTags(tx, entry, tagIDs)
	}

	return tagIDs, err
}

func (e *entryTxUtils) CleanupStaleTags(tx *sql.Tx, entry Entry, tagIDs []int) error {
	var placeholders string
	numOfTags := len(tagIDs)
	queryArgs := make([]interface{}, numOfTags+1)
	queryArgs[0] = entry.ID
	// @TODO Use utils.CreateSQLValuesPlaceholders
	for i, tagID := range tagIDs {
		queryArgs[i+1] = tagID
		placeholders += "$" + strconv.Itoa(i+2)
		if i < numOfTags-1 {
			placeholders += ", "
		}
	}

	stmt, err := tx.Prepare(`
        DELETE FROM EntryTag
        WHERE entry_id = $1
        AND tag_id NOT IN (` + placeholders + `);
    `)
	defer stmt.Close()
	if _, err = stmt.Exec(queryArgs...); err != nil {
		return err
	}

	stmt, err = tx.Prepare(`
        DELETE FROM Tags
        WHERE id NOT IN (SELECT tag_id FROM EntryTag);
    `)
	defer stmt.Close()
	if _, err = stmt.Exec(); err != nil {
		return err
	}

	return err
}

func (e *entryTxUtils) GetMatchedEntries(query string) ([]Entry, error) {
	var entries []Entry
	stmt, err := e.DB.Prepare(`
        SELECT id, title, body, author, created_timestamp, updated_timestamp, ts_rank(tsv, to_tsquery('varys_fts', $1)) as rank
        FROM Entries
        WHERE tsv @@ to_tsquery('varys_fts', $1)
        ORDER BY rank DESC;
    `)
	defer stmt.Close()
	if err != nil {
		return nil, err
	}

	rows, err := stmt.Query(query)
	defer rows.Close()
	if err != nil {
		return nil, err
	}

	for rows.Next() {
		var entry Entry
		var dummy string
		err = rows.Scan(&entry.ID, &entry.Title, &entry.Body, &entry.Author, &entry.Created, &entry.Updated, &dummy)
		tags, err := e.GetTags(entry.ID)
		if err != nil {
			return nil, err
		}
		var tagNames []string
		for _, tag := range tags {
			tagNames = append(tagNames, tag.Name)
		}
		entry.Tags = tagNames
		entries = append(entries, entry)
	}

	return entries, err
}

func (e *entryTxUtils) GetMatchedWords(matcherType string, substring string) ([]string, error) {
	var words []string
	matchAllQuery := `
        WITH allWords AS (
            SELECT word
            FROM WordPool
            UNION
            SELECT name
            FROM Tags
        )
        SELECT word
        FROM allWords
        WHERE similarity(word, $1) >= 0.25
        ORDER BY similarity(word, $1) DESC
        LIMIT 30;
    `
	matchTagsQuery := `
        SELECT name
        FROM Tags
        WHERE similarity(name, $1) >= 0.25
        ORDER BY similarity(name, $1) DESC
        LIMIT 30;
    `
	query := matchAllQuery
	if matcherType == "tag" {
		query = matchTagsQuery
	}
	stmt, err := e.DB.Prepare(query)
	defer stmt.Close()
	if err != nil {
		return nil, err
	}

	rows, err := stmt.Query(substring)
	defer rows.Close()
	if err != nil {
		return nil, err
	}

	for rows.Next() {
		var word string
		err = rows.Scan(&word)
		if err != nil {
			return nil, err
		}

		words = append(words, word)
	}

	return words, err
}

func (e *entryTxUtils) GetTags(entryID int) ([]Tag, error) {
	var tags []Tag
	stmt, err := e.DB.Prepare(`
        SELECT id, name
        FROM Tags
        INNER JOIN EntryTag
        ON EntryTag.entry_id = $1 AND Tags.id = EntryTag.tag_id
    `)
	defer stmt.Close()
	if err != nil {
		return tags, err
	}

	rows, err := stmt.Query(entryID)
	defer rows.Close()
	if err != nil {
		return tags, err
	}

	for rows.Next() {
		var tag Tag
		err = rows.Scan(&tag.ID, &tag.Name)
		if err != nil {
			return tags, err
		}
		tags = append(tags, tag)
	}

	return tags, err
}

func (e *entryTxUtils) MapEntryToTags(tx *sql.Tx, entryID int, tagIDs []int) error {
	stmt, err := tx.Prepare(`
        INSERT INTO EntryTag (entry_id, tag_id)
        SELECT $1, $2
        WHERE NOT EXISTS (SELECT * FROM EntryTag WHERE entry_id = $1 AND tag_id = $2)
    `)
	if err != nil {
		return err
	}
	defer stmt.Close()
	for _, tagID := range tagIDs {
		if _, err := stmt.Exec(entryID, tagID); err != nil {
			return err
		}
	}
	return nil
}

func (e *entryTxUtils) UpdateEntryTSV(tx *sql.Tx, entryID int) error {
	stmt, err := tx.Prepare(`
        UPDATE Entries
        SET tsv = SETWEIGHT(to_tsvector('varys_fts', title), 'A') || ' '
        || SETWEIGHT(to_tsvector(
                    'varys_fts',
                    (
                        SELECT string_agg(name, ', ')
                        FROM Tags
                        INNER JOIN EntryTag
                        ON EntryTag.entry_id = $1 AND Tags.id = EntryTag.tag_id
                    )
                ),
            'B'
        ) || ' '
        || SETWEIGHT(to_tsvector('varys_fts', body), 'C') || ' '
        || SETWEIGHT(to_tsvector('varys_fts', author), 'D')
        WHERE ID = $1;
    `)
	defer stmt.Close()
	if err != nil {
		return err
	}
	_, err = stmt.Exec(entryID)

	return err
}

func (e *entryTxUtils) UpdateWordPool(tx *sql.Tx, entryID int) error {
	words, err := e.GetWords(tx, entryID)
	if err != nil {
		return err
	}

	numOfArgs := len(words)
	insertToWordPoolQuery := make([]interface{}, numOfArgs)
	for i, word := range words {
		insertToWordPoolQuery[i] = word
	}

	placeholders := utils.CreateSQLValuesPlaceholders(numOfArgs, 1, 0)
	stmt, err := tx.Prepare(`
        INSERT INTO WordPool (word)
        VALUES ` + placeholders + `
        ON CONFLICT (word) DO NOTHING
        RETURNING id;
    `)
	if err != nil {
		return err
	}
	defer stmt.Close()
	rows, err := stmt.Query(insertToWordPoolQuery...)
	if err != nil {
		return err
	}
	defer rows.Close()
	var wordIDs []int
	var wordID int
	for rows.Next() {
		err = rows.Scan(&wordID)
		if err != nil {
			return err
		}
		wordIDs = append(wordIDs, wordID)
	}

	numOfWordIds := len(wordIDs)
	insertToEntryWordQuery := make([]interface{}, numOfWordIds*2)
	for i, wordID := range wordIDs {
		insertToEntryWordQuery[i*2] = wordID
		insertToEntryWordQuery[i*2+1] = entryID
	}

	if numOfWordIds > 0 {
		placeholders = utils.CreateSQLValuesPlaceholders(numOfWordIds*2, 2, 0)
		stmt, err = tx.Prepare(`
	    INSERT INTO EntryWord (word_id, entry_id)
	    VALUES ` + placeholders + `
	    ON CONFLICT (word_id, entry_id) DO NOTHING;
	`)
		if err != nil {
			return err
		}
		_, err = stmt.Exec(insertToEntryWordQuery...)
	}

	return err
}

func (e *entryTxUtils) GetWords(tx *sql.Tx, entryID int) ([]string, error) {
	stmt, err := tx.Prepare(`
        SELECT tsvector_to_array(
            to_tsvector('english_simple', title) || ' '
            || to_tsvector('english_simple', body) || ' '
            || to_tsvector('english_simple', author)
        )
        FROM Entries
        WHERE ID = $1;
    `)
	if err != nil {
		return nil, err
	}
	defer stmt.Close()
	rows, err := stmt.Query(entryID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var wordsString string
	if rows.Next() {
		err = rows.Scan(&wordsString)
	}

	strLen := len(wordsString)
	if strLen > 2 {
		wordsString = wordsString[1 : strLen-1]
	} else {
		wordsString = ""
	}

	return strings.Split(wordsString, ","), err
}

func (e *entryTxUtils) GetEntryWords(tx *sql.Tx, entryID int) ([]EntryWord, error) {
	stmt, err := tx.Prepare(`
        SELECT id, word
        FROM WordPool
        WHERE id IN (SELECT word_id FROM EntryWord WHERE entry_id = $1);
    `)
	if err != nil {
		return nil, err
	}
	defer stmt.Close()

	rows, err := stmt.Query(entryID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var entryWords []EntryWord
	var entryWord EntryWord
	for rows.Next() {
		err = rows.Scan(&entryWord.ID, &entryWord.Word)
		if err != nil {
			return nil, err
		}
		entryWords = append(entryWords, entryWord)
	}

	return entryWords, err
}

func (e *entryTxUtils) CleanStaleWords(tx *sql.Tx, entryID int, registeredWords []EntryWord) error {
	staleEntryWords := registeredWords
	var err error
	if entryID > 0 {
		newWords, err := e.GetWords(tx, entryID)
		if err != nil {
			return err
		}
		for _, entryWord := range registeredWords {
			if isReferencedWord, _ := utils.Contains(newWords, entryWord.Word); !isReferencedWord {
				staleEntryWords = append(staleEntryWords, entryWord)
			}
		}
	}
	numOfStaleWords := len(staleEntryWords)
	if numOfStaleWords > 0 {
		placeholders := utils.CreateSQLSetPlaceholders(numOfStaleWords, 1)
		stmt, err := tx.Prepare(`
            DELETE
            FROM EntryWord
            WHERE entry_id = $1 AND word_id IN` + placeholders + `;
            `)
		if err != nil {
			return err
		}
		defer stmt.Close()
		var args []interface{}
		args = append(args, entryID)
		var staleEntryIDs []interface{}

		for _, staleEntryWord := range staleEntryWords {
			args = append(args, staleEntryWord.ID)
			staleEntryIDs = append(staleEntryIDs, staleEntryWord.ID)
		}
		_, err = stmt.Exec(args...)
		if err != nil {
			return err
		}

		placeholders = utils.CreateSQLSetPlaceholders(numOfStaleWords, 0)
		stmt, err = tx.Prepare(`
            DELETE
            FROM WordPool
            WHERE id NOT IN (SELECT word_id FROM EntryWord WHERE word_id NOT IN ` + placeholders + `)
            `)
		if err != nil {
			return err
		}
		_, err = stmt.Exec(staleEntryIDs...)
	}

	return err
}
