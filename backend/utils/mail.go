package utils

import "net/smtp"

func SendMail(message string, destination string, config *Email) error {
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
