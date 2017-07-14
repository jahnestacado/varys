package utils

import (
	b64 "encoding/base64"
	"fmt"
	"strings"

	"github.com/dgrijalva/jwt-go"
)

type Salt struct {
	Prefix string
	Suffix string
}

func CreateToken(secret string, claims jwt.MapClaims, salt Salt) (string, error) {
	token := jwt.NewWithClaims(getSigningMethod(), claims)
	tokenString, err := token.SignedString([]byte(getSaltedSecret(secret, salt)))
	headerlessTokenString := getHeaderlessToken(tokenString)
	return headerlessTokenString, err
}

func ValidateToken(secret string, headerlessTokenString string, salt Salt) error {
	signingMethod := getSigningMethod()
	tokenHeader := getB64TokenHeader(signingMethod.Alg())
	tokenString := tokenHeader + "." + headerlessTokenString

	_, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("Unexpected signing method: %v", token.Header["alg"])
		}
		return []byte(getSaltedSecret(secret, salt)), nil
	})

	return err
}

func getB64TokenHeader(alg string) string {
	return b64.StdEncoding.EncodeToString([]byte(`{"alg":"` + alg + `","typ":"JWT"}`))
}

func getSigningMethod() *jwt.SigningMethodHMAC {
	return jwt.SigningMethodHS256
}

func getHeaderlessToken(tokenString string) string {
	headerlessToken := strings.SplitN(tokenString, ".", 2)[1]
	return headerlessToken
}

func getSaltedSecret(secret string, salt Salt) string {
	return salt.Prefix + secret + salt.Suffix
}
