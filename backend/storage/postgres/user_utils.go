package postgres

import (
	"database/sql"
	"errors"
	"fmt"

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

func (u *userUtils) Login(username string, password string) (string, error) {
	rows, err := u.DB.Query(`
        SELECT password FROM Users
        WHERE username=$1;
    `, username)
	defer rows.Close()

	var storedPasswordHash string
	rows.Next()
	err = rows.Scan(&storedPasswordHash)
	if err != nil {
		return "", err
	}

	isValid := utils.CheckPasswordHash(password, storedPasswordHash)
	fmt.Println(isValid)
	if !isValid {
		return "", errors.New("Failed to authenticate user:" + username)
	}

	return utils.CreateJWTToken(username)
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
