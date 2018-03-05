package rdbms

import "database/sql"

type Notification struct {
	ID          int    `json:"id"`
	SourceID    int    `json:"source_id"`
	Initiator   string `json:"initiator"`
	Recipient   string `json:"recipient"`
	Description string `json:"description"`
	Type        string `json:"type"`
	Created     string `json:"created"`
	Viewed      bool   `json:"viewed"`
}
type notificationTxUtils struct {
	DB *sql.DB
}

func CreateNotificationTxUtils(db *sql.DB) notificationTxUtils {
	return notificationTxUtils{db}
}

func (e *notificationTxUtils) InsertNotification(tx *sql.Tx, notification Notification) (int, error) {
	var notificationID int
	stmt, err := tx.Prepare(`
        INSERT INTO Notifications (source_id, initiator, recipient, description, type, viewed)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id;
    `)
	defer stmt.Close()
	if err != nil {
		return -1, err
	}

	row := stmt.QueryRow(notification.SourceID, notification.Initiator, notification.Recipient, notification.Description, notification.Type, notification.Viewed)
	if err != nil {
		return -1, err
	}
	if err = row.Scan(&notificationID); err != nil {
		return -1, err
	}

	return notificationID, err
}

func (e *notificationTxUtils) DeleteNotification(tx *sql.Tx, notificationID int) (Notification, error) {
	var notification Notification
	stmt, err := tx.Prepare(`
		DELETE FROM Notifications
		WHERE id=$1
		RETURNING *
	`)
	defer stmt.Close()
	if err != nil {
		return notification, err
	}

	row := stmt.QueryRow(notificationID)
	err = row.Scan(&notification.ID, &notification.SourceID, &notification.Initiator,
		&notification.Recipient, &notification.Description, &notification.Type, &notification.Created, &notification.Viewed)
	if err != nil {
		return notification, err
	}
	return notification, err
}

func (e *notificationTxUtils) GetNotifications(tx *sql.Tx, user string) ([]Notification, error) {
	stmt, err := tx.Prepare(`
        SELECT * FROM Notifications
        WHERE recipient=$1
    `)
	defer stmt.Close()
	if err != nil {
		return nil, err
	}

	rows, err := stmt.Query(user)
	defer rows.Close()
	if err != nil {
		return nil, err
	}

	var notifications []Notification
	var notification Notification
	for rows.Next() {
		err = rows.Scan(&notification.ID, &notification.SourceID, &notification.Initiator,
			&notification.Recipient, &notification.Description, &notification.Type, &notification.Created, &notification.Viewed)
		if err != nil {
			return nil, err
		}
		notifications = append(notifications, notification)
	}
	return notifications, err
}

func (e *notificationTxUtils) GetNotificationOfMergeRequest(tx *sql.Tx, mergeRequest MergeRequest) (Notification, error) {
	var notification Notification
	stmt, err := tx.Prepare(`
        SELECT *
		FROM Notifications
        WHERE source_id=$1 AND created_time=$2 AND type='merge_request' AND description=$3 && initiator=$4
    `)
	defer stmt.Close()
	if err != nil {
		return notification, err
	}

	row := stmt.QueryRow(mergeRequest.MergeRequestID, mergeRequest.Created, mergeRequest.Title, mergeRequest.MergeRequestAuthor)

	err = row.Scan(&notification.ID, &notification.SourceID, &notification.Initiator,
		&notification.Recipient, &notification.Description, &notification.Type, &notification.Created, &notification.Viewed)
	if err != nil {
		return notification, err
	}
	return notification, err
}
