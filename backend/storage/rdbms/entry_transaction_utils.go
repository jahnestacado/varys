package rdbms

import (
	"database/sql"
	"errors"

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

type entryTxUtils struct {
	DB *sql.DB
}

func CreateEntryTxUtils(db *sql.DB) entryTxUtils {
	return entryTxUtils{db}
}

func (e *entryTxUtils) InsertEntry(tx *sql.Tx, entry Entry) error {
	tagsTxUtils := CreateTagsTxUtils(e.DB)
	wordTxUtils := CreateWordTxUtils(e.DB)

	entryID, err := e.insertEntry(tx, entry)
	if err != nil || entryID == 0 {
		tx.Rollback()
		return err
	}

	tagIDs, err := tagsTxUtils.InsertTags(tx, entry.Tags)
	if err != nil {
		tx.Rollback()
		return err
	}

	if err = tagsTxUtils.MapEntryToTags(tx, entryID, tagIDs); err != nil {
		tx.Rollback()
		return err
	}

	if err = e.UpdateEntryTSV(tx, entryID); err != nil {
		tx.Rollback()
		return err
	}

	if err = wordTxUtils.UpdateWordPool(tx, entryID); err != nil {
		tx.Rollback()
		return err
	}

	return err
}

func (e *entryTxUtils) UpdateEntry(tx *sql.Tx, entry Entry) error {
	tagsTxUtils := CreateTagsTxUtils(e.DB)
	wordTxUtils := CreateWordTxUtils(e.DB)

	registeredEntryWords, err := wordTxUtils.GetEntryWords(tx, entry.ID)
	if err != nil {
		return err
	}

	if err = e.updateOrCreateEntry(tx, entry); err != nil {
		tx.Rollback()
		return err
	}
	tagIDs, err := tagsTxUtils.UpdateTags(tx, entry)
	if err != nil {
		tx.Rollback()
		return err
	}

	if err = tagsTxUtils.MapEntryToTags(tx, entry.ID, tagIDs); err != nil {
		tx.Rollback()
		return err
	}

	if err = e.UpdateEntryTSV(tx, entry.ID); err != nil {
		tx.Rollback()
		return err
	}

	if err = wordTxUtils.UpdateWordPool(tx, entry.ID); err != nil {
		tx.Rollback()
		return err
	}

	if err = wordTxUtils.CleanStaleWords(tx, entry.ID, registeredEntryWords); err != nil {
		tx.Rollback()
		return err
	}

	return err
}

func (e *entryTxUtils) DeleteEntry(tx *sql.Tx, entryID int, claims map[string]interface{}) error {
	tagsTxUtils := CreateTagsTxUtils(e.DB)
	wordTxUtils := CreateWordTxUtils(e.DB)

	entryWords, err := wordTxUtils.GetEntryWords(tx, entryID)
	if err != nil {
		return err
	}

	stmt, err := tx.Prepare(`
		WITH deletedRow AS (
			DELETE FROM Entries
			WHERE id = $1
			RETURNING *
		)
		SELECT author
		FROM deletedRow;
	`)
	if err != nil {
		return err
	}
	defer stmt.Close()

	row, err := stmt.Query(entryID)
	if err != nil {
		return err
	}

	row.Next()
	var entryAuthor string
	if err = row.Scan(&entryAuthor); err != nil {
		return err
	}
	row.Close()

	if claims["username"] != entryAuthor && claims["role"] != "admin" && claims["role"] != "superadmin" {
		tx.Rollback()
		return errors.New("Unauthorized action for user: " + claims["username"].(string) + " with role: " + claims["role"].(string))
	}

	tagIDs := []int{0}
	err = tagsTxUtils.CleanupStaleTags(tx, entryID, tagIDs)
	if err != nil {
		return err
	}

	if err = wordTxUtils.CleanStaleWords(tx, entryID, entryWords); err != nil {
		tx.Rollback()
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

	tagsTxUtils := CreateTagsTxUtils(e.DB)

	for rows.Next() {
		var entry Entry
		var dummy string
		err = rows.Scan(&entry.ID, &entry.Title, &entry.Body, &entry.Author, &entry.Created, &entry.Updated, &dummy)
		tags, err := tagsTxUtils.GetTags(entry.ID)
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

func (e *entryTxUtils) insertEntry(tx *sql.Tx, newEntry Entry) (int, error) {
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

func (e *entryTxUtils) updateOrCreateEntry(tx *sql.Tx, newEntry Entry) error {
	// @TODO Why update the author???
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
