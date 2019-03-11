package utils

import (
	"log"
	"os"
)

type env struct{}

var e = env{}

func Env() env {
	return e
}

func (e env) Get(name, fallback string, isFatal bool) string {
	value, exists := os.LookupEnv(name)
	if !exists {
		if isFatal {
			log.Fatalf("Environment variable: %s is not defined. Exiting...", name)
		} else {
			value = fallback
		}
	}
	return value
}
