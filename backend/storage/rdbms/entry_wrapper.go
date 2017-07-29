package rdbms

import (
	"database/sql"
	"strconv"

	_ "github.com/lib/pq"
)

type Entry struct {
	ID     int      `json:"id"`
	Title  string   `json:"title"`
	Body   string   `json:"body"`
	Tags   []string `json:"tags"`
	Author string   `json:"author"`
}

type Tag struct {
	ID   int
	Name string
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

func (e *entryUtils) CleanupStaleTags(tx *sql.Tx, entry Entry, tagIDs []int) error {
	var placeholders string
	numOfTags := len(tagIDs)
	queryArgs := make([]interface{}, numOfTags+1)
	queryArgs[0] = entry.ID
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
	stmt, err := e.DB.Prepare(`
        SELECT id, title, body, author, ts_rank(tsv, plainto_tsquery($1)) as rank
        FROM entries
        WHERE tsv @@ plainto_tsquery($1)
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
		err = rows.Scan(&entry.ID, &entry.Title, &entry.Body, &entry.Author, &dummy)
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

func (e *entryUtils) GetTags(entryID int) ([]Tag, error) {
	var tags []Tag
	stmt, err := e.DB.Prepare(`
        SELECT id, name
        FROM tags
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
