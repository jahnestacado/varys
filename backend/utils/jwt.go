package utils

import "github.com/dgrijalva/jwt-go"

func CreateJWTToken(username string) (string, error) {
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"username": username,
	})
	// Secret should be pass by command line args or config file
	tokenString, err := token.SignedString([]byte("the-secret"))
	return tokenString, err
}
