package rdbms

import (
	"database/sql"
	"fmt"
	"strconv"

	_ "github.com/lib/pq"
)

const fullTextSearchQuery = `SELECT id, title, body, author, ts_rank(tsv, plainto_tsquery('%s')) as rank
 FROM entries
 WHERE tsv @@ plainto_tsquery('%s')
 ORDER BY rank DESC;
`

type Entry struct {
	ID     int      `json:"id"`
	Title  string   `json:"title"`
	Body   string   `json:"body"`
	Tags   []string `json:"tags"`
	Author string   `json:"author"`
}

type entryUtils struct {
	DB *sql.DB
}

func CreateEntryWrapper(db *sql.DB) entryUtils {
	return entryUtils{db}
}

func (e *entryUtils) AddEntry(tx *sql.Tx, newEntry Entry) (int, error) {
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

func (e *entryUtils) UpdateEntry(tx *sql.Tx, newEntry Entry) error {
	stmt, err := tx.Prepare(`
        UPDATE Entries
        SET title = $2, body = $3, author = $4
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

func (e *entryUtils) AddTags(tx *sql.Tx, tags []string) ([]int, error) {
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

func (e *entryUtils) UpdateTags(tx *sql.Tx, entry Entry) ([]int, error) {
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

func (e *entryUtils) CleanupStaleTags(tx *sql.Tx, entry Entry, newRowIDs []int) error {
	var values string
	for i, tagID := range newRowIDs {
		values += strconv.Itoa(tagID)
		if i < len(newRowIDs)-1 {
			values += ", "
		}
	}

	stmt, err := tx.Prepare(`
        DELETE FROM EntryTag
        WHERE entry_id = $1
        AND tag_id NOT IN (` + values + `)
        `)
	defer stmt.Close()
	if _, err = stmt.Exec(entry.ID); err != nil {
		return err
	}

	stmt, err = tx.Prepare(`
        DELETE FROM Tags
        WHERE id NOT IN  (SELECT tag_id FROM EntryTag);
        `)
	defer stmt.Close()
	if _, err = stmt.Exec(); err != nil {
		return err
	}

	return err
}

func (e *entryUtils) GetMatchedEntries(query string) ([]Entry, error) {
	var entries []Entry
	rows, err := e.DB.Query(fmt.Sprintf(fullTextSearchQuery, query, query))
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	for rows.Next() {
		var entry Entry
		var dummy string
		err = rows.Scan(&entry.ID, &entry.Title, &entry.Body, &entry.Author, &dummy)
		tags, err := e.GetTags(entry.ID)
		if err != nil {
			return nil, err
		}
		entry.Tags = tags

		entries = append(entries, entry)
	}

	return entries, err
}

func (e *entryUtils) GetTags(entryID int) ([]string, error) {
	rows, err := e.DB.Query(`
        SELECT name
        FROM tags
        INNER JOIN EntryTag
        ON EntryTag.entry_id = $1 AND Tags.id = EntryTag.tag_id
        `, entryID)
	defer rows.Close()

	var tags []string
	if err != nil {
		return tags, err
	}

	for rows.Next() {
		var tag string
		err = rows.Scan(&tag)
		if err != nil {
			return tags, err
		}
		tags = append(tags, tag)
	}

	return tags, err
}

func (e *entryUtils) MapEntryToTags(tx *sql.Tx, entryID int, tagIDs []int) error {
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

func (e *entryUtils) UpdateEntryTSV(tx *sql.Tx, entryID int) error {
	stmt, err := tx.Prepare(`
        UPDATE Entries
        SET tsv = SETWEIGHT(to_tsvector(title), 'A') || '. '
        || SETWEIGHT(to_tsvector(
                    (
                        SELECT string_agg(name, ', ')
                        FROM Tags
                        INNER JOIN EntryTag
                        ON EntryTag.entry_id = $1 AND Tags.id = EntryTag.tag_id
                    )
                ),
            'B'
        ) || '. '
        || SETWEIGHT(to_tsvector(body), 'C') || '. '
        || SETWEIGHT(to_tsvector(author), 'D')
        WHERE ID = $2;
    `)
	defer stmt.Close()
	if err != nil {
		return err
	}
	_, err = stmt.Exec(entryID, entryID)

	return err
}
