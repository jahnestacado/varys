package utils

import "github.com/dgrijalva/jwt-go"

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
