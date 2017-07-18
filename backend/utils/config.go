package utils

import (
	"encoding/json"
	"io/ioutil"
)

type Config struct {
	JWTSecret string   `json:"jwt-secret"`
	Email     Email    `json:"email"`
	Postgres  Postgres `json:"postgres"`
	Hostname  string   `json:"hostname"`
	Port      string   `json:"port"`
	Mode      string   `json:"mode"`
}

type Postgres struct {
	User     string `json:"user"`
	Password string `json:"password"`
	DBName   string `json:"dbname"`
}

type Email struct {
	Adress   string `json:"address"`
	Password string `json:"password"`
	Host     string `json:"host"`
	Port     string `json:"port"`
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
