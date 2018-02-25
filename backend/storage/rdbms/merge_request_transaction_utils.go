package rdbms

import (
	"database/sql"
	"strings"
)

type MergeRequest struct {
	Entry
	MergeRequestAuthor string `json:"merge_request_author"`
}
type mergeRequestTxUtils struct {
	DB *sql.DB
}

func CreateMergeRequestTxUtils(db *sql.DB) mergeRequestTxUtils {
	return mergeRequestTxUtils{db}
}

func (e *mergeRequestTxUtils) InsertMergeRequest(tx *sql.Tx, mergeRequest MergeRequest) (int, error) {
	var mergeRequestID int
	stmt, err := tx.Prepare(`
        INSERT INTO MergeRequests (merge_request_author, title, body, author, tags)
        VALUES ($1, $2, $3, $4, string_to_array($5, ','))
        RETURNING merge_request_id;
        `)
	defer stmt.Close()
	if err != nil {
		return 0, err
	}

	row, err := stmt.Query(mergeRequest.MergeRequestAuthor, mergeRequest.Title, mergeRequest.Body, mergeRequest.Author, strings.Join(mergeRequest.Tags, ","))
	defer row.Close()
	if err != nil {
		return 0, err
	}
	row.Next()
	if err = row.Scan(&mergeRequestID); err != nil {
		return 0, err
	}

	return mergeRequestID, err
}
