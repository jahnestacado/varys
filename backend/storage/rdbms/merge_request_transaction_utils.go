package rdbms

import (
	"database/sql"

	"github.com/lib/pq"
)

type MergeRequest struct {
	Entry
	MergeRequestID     int    `json:"merge_request_id"`
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
        INSERT INTO MergeRequests (merge_request_author, id, title, body, author, tags)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING merge_request_id;
    `)
	defer stmt.Close()
	if err != nil {
		return -1, err
	}

	row := stmt.QueryRow(mergeRequest.MergeRequestAuthor, mergeRequest.ID, mergeRequest.Title, mergeRequest.Body, mergeRequest.Author, pq.Array(mergeRequest.Tags))
	if err != nil {
		return -1, err
	}
	if err = row.Scan(&mergeRequestID); err != nil {
		return -1, err
	}

	return mergeRequestID, err
}

func (e *mergeRequestTxUtils) DeleteMergeRequest(tx *sql.Tx, mergeRequestID int) (MergeRequest, error) {
	var mergeRequest MergeRequest
	stmt, err := tx.Prepare(`
		DELETE FROM MergeRequests
		WHERE merge_request_id=$1
		RETURNING *
	`)
	defer stmt.Close()
	if err != nil {
		return mergeRequest, err
	}

	row := stmt.QueryRow(mergeRequestID)
	err = row.Scan(&mergeRequest.MergeRequestID, &mergeRequest.MergeRequestAuthor, &mergeRequest.ID, &mergeRequest.Title,
		&mergeRequest.Body, &mergeRequest.Author, &mergeRequest.Created, &mergeRequest.Updated, pq.Array(&mergeRequest.Tags))
	if err != nil {
		return mergeRequest, err
	}
	return mergeRequest, err
}

func (e *mergeRequestTxUtils) GetMergeRequest(tx *sql.Tx, mergeRequestID int) (MergeRequest, error) {
	var mergeRequest MergeRequest
	stmt, err := tx.Prepare(`
        SELECT *
		FROM MergeRequests
        WHERE merge_request_id=$1
    `)
	defer stmt.Close()
	if err != nil {
		return mergeRequest, err
	}

	row := stmt.QueryRow(mergeRequestID)
	err = row.Scan(&mergeRequest.MergeRequestID, &mergeRequest.MergeRequestAuthor, &mergeRequest.ID, &mergeRequest.Title,
		&mergeRequest.Body, &mergeRequest.Author, &mergeRequest.Created, &mergeRequest.Updated, pq.Array(&mergeRequest.Tags))
	if err != nil {
		return mergeRequest, err
	}

	return mergeRequest, err
}

func (e *mergeRequestTxUtils) GetMergeRequests(tx *sql.Tx, author string) ([]MergeRequest, error) {
	stmt, err := tx.Prepare(`
        SELECT * FROM MergeRequests
        WHERE author=$1
    `)
	defer stmt.Close()
	if err != nil {
		return nil, err
	}

	rows, err := stmt.Query(author)
	defer rows.Close()
	if err != nil {
		return nil, err
	}

	var mergeRequests []MergeRequest
	var mergeRequest MergeRequest
	for rows.Next() {
		err = rows.Scan(&mergeRequest.MergeRequestID, &mergeRequest.MergeRequestAuthor, &mergeRequest.ID, &mergeRequest.Title,
			&mergeRequest.Body, &mergeRequest.Author, &mergeRequest.Created, &mergeRequest.Updated, pq.Array(&mergeRequest.Tags))
		if err != nil {
			return nil, err
		}
		mergeRequests = append(mergeRequests, mergeRequest)
	}

	return mergeRequests, err
}
