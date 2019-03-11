package routes

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"time"
	"varys/backend/storage/rdbms"
	"varys/backend/utils"

	jwt "github.com/dgrijalva/jwt-go"
	"github.com/julienschmidt/httprouter"
)

type signInBody struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

type session struct {
	Token string `json:"token"`
}

func CreateSignInPostRoute(db *sql.DB) func(http.ResponseWriter, *http.Request, httprouter.Params) {
	return func(res http.ResponseWriter, req *http.Request, ps httprouter.Params) {
		jwtSecret := rdbms.GetAppServerConfig(db).JWTSecret
		bodyDecoder := json.NewDecoder(req.Body)
		defer req.Body.Close()
		var body signInBody
		err := bodyDecoder.Decode(&body)
		if err != nil {
			http.Error(res, err.Error(), 500)
			return
		}
		userTxUtils := rdbms.CreateUserTxUtils(db)
		info, err := userTxUtils.VerifyCredentials(body.Username, body.Password)
		if err != nil {
			http.Error(res, err.Error(), 401)
			return
		}

		jwtClaims := jwt.MapClaims{
			"username":     info.Username,
			"email":        info.Email,
			"role":         info.Role,
			"member_since": info.MemberSince,
			"exp":          7 * 24 * time.Hour,
		}
		salt := utils.Salt{
			Prefix: info.Password,
			Suffix: info.Role,
		}
		token, err := utils.CreateToken(jwtSecret, jwtClaims, salt)

		result, err := json.Marshal(session{token})
		if err != nil {
			http.Error(res, err.Error(), 500)
			return
		}

		res.Header().Set("Content-Type", "application/json")
		res.Write(result)
	}
}
