package utils

import (
	b64 "encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"strings"

	"github.com/dgrijalva/jwt-go"
)

type Salt struct {
	Prefix string
	Suffix string
}

func CreateToken(secret string, claims jwt.MapClaims, saltFromClaimsSpecs Salt) (string, error) {
	token := jwt.NewWithClaims(getSigningMethod(), claims)
	payloadBytes, err := json.Marshal(claims)
	if err != nil {
		return "", err
	}
	salt, err := getSaltFromClaims(payloadBytes, saltFromClaimsSpecs)
	if err != nil {
		return "", err
	}
	tokenString, err := token.SignedString([]byte(getSaltedSecret(secret, salt)))
	headerlessTokenString := getHeaderlessToken(tokenString)
	return headerlessTokenString, err
}

func ValidateToken(secret string, headerlessTokenString string, saltFromClaimsSpecs Salt) error {
	signingMethod := getSigningMethod()
	tokenHeader := getB64TokenHeader(signingMethod.Alg())
	tokenString := tokenHeader + "." + headerlessTokenString
	payloadBytes, err := b64.RawStdEncoding.DecodeString(strings.Split(tokenString, ".")[1])
	if err != nil {
		return err
	}

	salt, err := getSaltFromClaims(payloadBytes, saltFromClaimsSpecs)
	if err != nil {
		return err
	}

	_, err = jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
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

func getSaltFromClaims(payloadBytes []byte, saltFromClaimsSpecs Salt) (Salt, error) {
	var payloadMapTemplate interface{}
	err := json.Unmarshal(payloadBytes, &payloadMapTemplate)
	var salt Salt
	if err != nil {
		return salt, err
	}
	payload := payloadMapTemplate.(map[string]interface{})
	prefix, ok := payload[saltFromClaimsSpecs.Prefix].(string)
	if !ok {
		return salt, errors.New("Unexpected saltFromClaimsSpecs prefix type")

	}

	suffix, ok := payload[saltFromClaimsSpecs.Suffix].(string)
	if !ok {
		return salt, errors.New("Unexpected saltFromClaimsSpecs suffix type")

	}

	salt = Salt{prefix, suffix}

	return salt, nil
}
