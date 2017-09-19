package routes

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"strconv"
	"time"
	"varys/backend/storage/rdbms"
	"varys/backend/utils"

	jwt "github.com/dgrijalva/jwt-go"
	"github.com/julienschmidt/httprouter"
)

func CreateSignUpPostRoute(DB *sql.DB, config *utils.Config) func(http.ResponseWriter, *http.Request, httprouter.Params) {
	return func(res http.ResponseWriter, req *http.Request, ps httprouter.Params) {
		bodyDecoder := json.NewDecoder(req.Body)
		defer req.Body.Close()
		var body rdbms.UserInfo
		err := bodyDecoder.Decode(&body)
		if err != nil {
			http.Error(res, err.Error(), 500)
			return
		}
		userTxUtils := rdbms.CreateUserTxUtils(DB)
		err = userTxUtils.Register(body.Username, body.Password, body.Email)
		if err != nil {
			http.Error(res, err.Error(), 400)
			return
		}

		hostURI := req.Host
		emailMessage, err := getEmailMessage(&body, hostURI, config.JWTSecret)
		if err != nil {
			http.Error(res, err.Error(), 500)
			// @TODO Revert registration
			return
		}
		err = utils.SendMail(emailMessage, body.Email, &config.Email)
		if err != nil {
			http.Error(res, err.Error(), 500)
			// @TODO Revert registration
			return
		}

		res.WriteHeader(200)
	}
}

func getEmailMessage(body *rdbms.UserInfo, hostURI string, jwtSecret string) (string, error) {
	jwtClaims := jwt.MapClaims{
		"username": body.Username,
		"email":    body.Email,
		"exp":      2 * 24 * time.Hour,
	}
	salt := utils.Salt{
		Prefix: body.Username,
		Suffix: body.Email,
	}
	token, err := utils.CreateToken(jwtSecret, jwtClaims, salt)
	if err != nil {
		return "", err
	}
	emailBody := "http://" + hostURI + "/api/v1/verify/" + body.Username + "/" + token + "/" + strconv.Itoa(time.Now().Nanosecond())

	message := "To: " + body.Email + "\r\n" +
		"Subject: Varys User Verification!\r\n" +
		"\r\n" +
		emailBody + "\r\n"

	return message, err
}
