package utils

import (
	b64 "encoding/base64"
	"encoding/json"
	"strings"
	"testing"

	"github.com/alecthomas/assert"

	jwt "github.com/dgrijalva/jwt-go"
)

const jwtSecret = "thesecret"

var commonSalt = Salt{
	Prefix: "prefix-salt",
	Suffix: "suffix-salt",
}

var commonClaims = jwt.MapClaims{
	"username": "Jackie Estacado",
	"role":     "Mafia Boss",
}

func TestCreateToken(t *testing.T) {
	token, err := CreateToken(jwtSecret, commonClaims, commonSalt)
	isHeadless := strings.Count(token, ".") == 1
	assert.Nil(t, err)
	assert.True(t, isHeadless, "Token is not headless!")

	payloadB64 := strings.Split(token, ".")[0]
	payloadString, _ := b64.RawStdEncoding.DecodeString(payloadB64)
	var payloadMapTemplate interface{}
	json.Unmarshal([]byte(payloadString), &payloadMapTemplate)
	payload := payloadMapTemplate.(map[string]interface{})
	username := payload["username"].(string)
	role := payload["role"].(string)
	assert.Equal(t, commonClaims["username"], username, "Unexpected 'username' value in claims!")
	assert.Equal(t, commonClaims["role"], role, "Unexpected 'role' value in claims!")
}

func TestValidateToken(t *testing.T) {
	token, _ := CreateToken(jwtSecret, commonClaims, commonSalt)
	err := ValidateToken(jwtSecret, token, commonSalt)
	assert.Nil(t, err, "Token is invalid!")

	salt := Salt{
		Prefix: "different-prefix-salt",
		Suffix: "different-suffix-salt",
	}
	newToken, _ := CreateToken(jwtSecret, commonClaims, salt)
	err = ValidateToken(jwtSecret, newToken, commonSalt)
	assert.Error(t, err, "Expected invalid token but it is valid!")
}
