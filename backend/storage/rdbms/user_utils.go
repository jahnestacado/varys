package rdbms

import (
	"database/sql"
	"errors"

	"varys/backend/utils"

	_ "github.com/lib/pq"
)

type userUtils struct {
	DB *sql.DB
}

func User(db *sql.DB) userUtils {
	return userUtils{db}
}

func (u *userUtils) Register(username string, password string, email string) error {
	hashedPassword, err := utils.HashPassword(password)
	if err != nil {
		return err
	}

	_, err = u.DB.Exec(`
        INSERT INTO Users (username, password, email)
        VALUES ($1, $2, $3)
    `, username, hashedPassword, email)

	return err
}

type UserInfo struct {
	Username string `json:"username"`
	Email    string `json:"email"`
	Password string `json:"password"`
}

func (u *userUtils) Login(username string, password string) (UserInfo, error) {
	rows, err := u.DB.Query(`
        SELECT password, email FROM Users
        WHERE username=$1;
    `, username)
	defer rows.Close()

	var info UserInfo
	var email string
	var storedPasswordHash string
	rows.Next()
	err = rows.Scan(&storedPasswordHash, &email)
	if err != nil {
		return info, err
	}

	isValid := utils.CheckPasswordHash(password, storedPasswordHash)
	if !isValid {
		return info, errors.New("Failed to authenticate user:" + username)
	}

	info = UserInfo{Username: username, Email: email}

	return info, err
}

//
// func (u *userUtils) Logout(token string) {
//
// }
//
// func (u *userUtils) Verify(username string) {
//
// }
//
// func (u *userUtils) ChangePassword(username string, oldPassword string, newPassword string) {
//
// }
