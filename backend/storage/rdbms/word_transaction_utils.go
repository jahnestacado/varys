package rdbms

import (
	"database/sql"
	"strconv"
	"strings"
	"varys/backend/utils"

	_ "github.com/lib/pq"
)

type EntryWord struct {
	ID   int
	Word string
}

type wordTxUtils struct {
	DB *sql.DB
}

func CreateWordTxUtils(db *sql.DB) wordTxUtils {
	return wordTxUtils{db}
}

func (e *wordTxUtils) GetMatchedWords(matcherType string, substring string) ([]string, error) {
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

func (e *wordTxUtils) UpdateWordPool(tx *sql.Tx, entryID int) error {
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

func (e *wordTxUtils) GetWords(tx *sql.Tx, entryID int) ([]string, error) {
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

func (e *wordTxUtils) GetEntryWords(tx *sql.Tx, entryID int) ([]EntryWord, error) {
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

func (e *wordTxUtils) CleanStaleWords(tx *sql.Tx, entryID int, registeredWords []EntryWord) error {
	staleEntryWords := registeredWords
	entryExistsStmt, err := tx.Prepare(`SELECT EXISTS(SELECT id FROM ENTRIES WHERE id=$1)`)
	if err != nil {
		return err
	}

	row := entryExistsStmt.QueryRow(strconv.Itoa(entryID))
	var entryExists bool
	err = row.Scan(&entryExists)
	if err != nil {
		return err
	}

	if entryExists {
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
