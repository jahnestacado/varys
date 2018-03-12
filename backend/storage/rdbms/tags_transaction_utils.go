package rdbms

import (
	"database/sql"
	"strconv"

	_ "github.com/lib/pq"
)

type Tag struct {
	ID   int
	Name string
}

type tagsTxUtils struct {
	DB *sql.DB
}

func CreateTagsTxUtils(db *sql.DB) tagsTxUtils {
	return tagsTxUtils{db}
}

func (e *tagsTxUtils) GetTags(entryID int) ([]Tag, error) {
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

func (e *tagsTxUtils) InsertTags(tx *sql.Tx, tags []string) ([]int, error) {
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

func (e *tagsTxUtils) UpdateTags(tx *sql.Tx, entry Entry) ([]int, error) {
	tagIDs, err := e.InsertTags(tx, entry.Tags)
	if err != nil {
		return nil, err
	}
	err = e.MapEntryToTags(tx, entry.ID, tagIDs)
	if err != nil {
		return nil, err
	}

	if len(tagIDs) > 0 {
		err = e.CleanupStaleTags(tx, entry.ID, tagIDs)
	}

	return tagIDs, err
}

func (e *tagsTxUtils) CleanupStaleTags(tx *sql.Tx, entryID int, tagIDs []int) error {
	var placeholders string
	numOfTags := len(tagIDs)
	queryArgs := make([]interface{}, numOfTags+1)
	queryArgs[0] = entryID
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

func (e *tagsTxUtils) MapEntryToTags(tx *sql.Tx, entryID int, tagIDs []int) error {
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
