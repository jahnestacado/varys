package rdbms

import (
	"database/sql"
	"log"
	"varys/backend/utils"

	_ "github.com/lib/pq"
)

type AppServerConfig struct {
	JWTSecret string     `json:"-"`
	SMTP      utils.SMTP `json:"smtp"`
	Host      string     `json:"host"`
	Port      string     `json:"port"`
}

type PostgresConfig struct {
	User     string `json:"user"`
	Password string `json:"password"`
	DBName   string `json:"dbname"`
}

const defaultHost = "localhost"
const defaultPort = "7676"
const defaultPostgresUser = "postgres"
const defaultPostgresDBName = "varys"

func GetPostgresConfig() PostgresConfig {
	env := utils.Env()
	config := PostgresConfig{
		User:     env.Get("VARYS_POSTGRES_USER", defaultPostgresUser, false),
		Password: env.Get("VARYS_POSTGRES_PASSWORD", "", true),
		DBName:   env.Get("VARYS_POSTGRES_DB_NAME", defaultPostgresDBName, false),
	}

	return config
}

func GetAppServerConfig(db *sql.DB) AppServerConfig {
	config := AppServerConfig{}
	row := db.QueryRow(`
		SELECT email_address, email_password, smtp_host, smtp_port, jwt_secret, host, port
		FROM AppServerConfig
		WHERE id=1
	`)
	err := row.Scan(
		&config.SMTP.Adress,
		&config.SMTP.Password,
		&config.SMTP.Host,
		&config.SMTP.Port,
		&config.JWTSecret,
		&config.Host,
		&config.Port,
	)

	if err != nil {
		log.Println(err.Error())
	}

	return config
}

func InitAppServerConfig(db *sql.DB) (sql.Result, error) {
	secret, err := utils.GenerateSecret()
	if err != nil {
		return nil, err
	}
	result, err := db.Exec(`
		INSERT INTO AppServerConfig (id, email_address, email_password, smtp_host, smtp_port, host, port, jwt_secret)
		VALUES (1, $1, $2, $3, $4, $5, $6, $7)
		ON CONFLICT (id) DO NOTHING
	`, "", "", "", "", defaultHost, defaultPort, secret)
	return result, err
}

func SetAppServerConfig(db *sql.DB, config AppServerConfig) (sql.Result, error) {
	smtp := config.SMTP
	result, err := db.Exec(`
		INSERT INTO AppServerConfig (id, email_address, email_password, smtp_host, smtp_port, host, port)
		VALUES (1, $1, $2, $3, $4, $5, $6)
		ON CONFLICT (id) DO UPDATE
		SET email_address = $1, email_password = $2, smtp_host= $3, smtp_port = $4, host = $5, port = $6
	`, smtp.Adress, smtp.Password, smtp.Host, smtp.Port, config.Host, config.Port)
	return result, err
}
