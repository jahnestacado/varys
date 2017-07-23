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

func (e *entryUtils) AddEntry(title string, body string, author string) (int, error) {
	var entryID int
	row, err := e.DB.Query(`
        INSERT INTO Entries (title, body, author)
        VALUES ($1, $2, $3)
        RETURNING id;
        `, title, body, author)
	defer row.Close()
	if err != nil {
		return 0, err
	}
	row.Next()
	err = row.Scan(&entryID)
	if err != nil {
		return 0, err
	}
	return entryID, err
}

func (e *entryUtils) AddTags(tags []string) ([]int, error) {
	numOfTags := len(tags)
	tagIDs := make([]int, numOfTags)
	for index, tag := range tags {
		row, err := e.DB.Query("SELECT id FROM Tags WHERE name = $1;", tag)
		defer row.Close()
		if err != nil {
			return nil, err
		}

		tagExists := row.Next()
		if !tagExists {
			row, err = e.DB.Query(`
                    INSERT INTO Tags (name)
                    VALUES ($1)
                    RETURNING id;
                     `, tag)
			row.Next()
		}

		var tagID int
		err = row.Scan(&tagID)
		if err != nil {
			return nil, err
		}

		tagIDs[index] = tagID
	}

	return tagIDs, nil
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

func (e *entryUtils) MapEntryToTags(entryID int, tagIDs []int) error {
	var values string
	for i, tagID := range tagIDs {
		values += "(" + strconv.Itoa(entryID) + "," + strconv.Itoa(tagID) + ")"
		if i < len(tagIDs)-1 {
			values += ", "
		}
	}

	var err error
	if values != "" {
		query := `
        INSERT INTO EntryTag (entry_id, tag_id)
        VALUES ` + values + `;`

		_, err = e.DB.Exec(query)
	}

	return err
}

func (e *entryUtils) UpdateEntryTSV(entryID int) error {
	_, err := e.DB.Exec(`
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
        WHERE ID = $2
        ;
    `, entryID, entryID)

	return err
}
