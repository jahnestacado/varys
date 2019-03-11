package utils

import "net/smtp"

type SMTP struct {
	Adress   string `json:"address"`
	Password string `json:"password"`
	Host     string `json:"host"`
	Port     string `json:"port"`
}

func SendMail(message string, destination string, config SMTP) error {
	auth := smtp.PlainAuth("", config.Adress, config.Password, config.Host)
	err := smtp.SendMail(
		config.Host+":"+config.Port,
		auth,
		config.Adress,
		[]string{destination},
		[]byte(message),
	)

	return err
}
