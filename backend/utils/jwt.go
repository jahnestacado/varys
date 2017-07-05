package utils

import (
	"fmt"
	"time"

	"github.com/dgrijalva/jwt-go"
)

// @TODO Secret should be generated or passed by config file
const secret = "foo-bar-baz"

func CreateToken(username string) (string, error) {
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"username": username,
		"exp":      time.Now().Unix(),
	})
	tokenString, err := token.SignedString([]byte(secret))
	return tokenString, err
}

func ParseToken(tokenString string) (*jwt.Token, error) {
	token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("Unexpected signing method: %v", token.Header["alg"])
		}

		return []byte(secret), nil
	})
	return token, err
}
