package utils

import (
	"encoding/json"
	"io/ioutil"
)

type Config struct {
	JWTSecret                 string `json:"jwt-secret"`
	VerificationEmail         string `json:"verification-email"`
	VerificationEmailPassword string `json:"verification-email-password"`

	Postgres Postgres `json:"postgres"`

	Hostname string `json:"hostname"`
	Port     string `json:"port"`
}

type Postgres struct {
	User     string `json:"user"`
	Password string `json:"password"`
	DBName   string `json:"dbname"`
}

func GetConfig(filepath string) (Config, error) {
	jsonConfig, err := ioutil.ReadFile(filepath)
	var config Config
	if err != nil {
		return config, err
	}
	err = json.Unmarshal([]byte(jsonConfig), &config)
	if err != nil {
		return config, err
	}
	return config, err
}
