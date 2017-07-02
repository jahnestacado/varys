package utils

import "golang.org/x/crypto/bcrypt"

func HashPassword(password string) (string, error) {
	hashInBytes, err := bcrypt.GenerateFromPassword([]byte(password), 10)
	return string(hashInBytes), err
}

func CheckPasswordHash(password, hash string) bool {
	err := bcrypt.CompareHashAndPassword([]byte(hash), []byte(password))
	isValid := err == nil
	return isValid
}
