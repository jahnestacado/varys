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
	ID          string
	Password    string
	Username    string
	Email       string
	Role        string
	MemberSince string
	Verified    bool
}

func (u *userUtils) VerifyCredentials(username string, password string) (UserInfo, error) {
	rows, err := u.DB.Query(`
        SELECT user_id, password, email, role, member_since, verified FROM Users
        WHERE username=$1;
    `, username)
	defer rows.Close()

	rows.Next()
	var info UserInfo
	info.Username = username
	err = rows.Scan(&info.ID, &info.Password, &info.Email, &info.Role, &info.MemberSince, &info.Verified)
	if err != nil {
		return info, err
	}

	if !info.Verified {
		return info, errors.New("User email is not verified.")
	}

	isValid := utils.CheckPasswordHash(password, info.Password)
	if !isValid {
		return info, errors.New("Failed to authenticate user:" + username)
	}

	return info, err
}
