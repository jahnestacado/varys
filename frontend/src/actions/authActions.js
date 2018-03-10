import { SIGN_IN, RESUME_USER_SESSION } from "../utils/constants.js";
import Http from "./../utils/http.js";

export const resumeUserSession = () => {
    const sessionToken = window.localStorage.getItem("varys-session");
    return {
        type: RESUME_USER_SESSION,
        payload: sessionToken,
    };
};

export const signin = (body) => {
    return (dispatch) => {
        const signinUrl = "http://localhost:7676/api/v1/SignIn";
        const signinAction = (sessionToken) => {
            return {
                type: SIGN_IN,
                payload: sessionToken,
            };
        };
        return Http.post(signinUrl, "", { body: JSON.stringify(body) })
            .then(({ token }) => {
                console.log(token);
                dispatch(signinAction(token));
            })
            .catch((error) => {
                // @TODO Handle error through an action
                console.error(error);
            });
    };
};

export const signup = (body) => {
    return () => {
        const signupUrl = "http://localhost:7676/api/v1/signup";
        return Http.post(signupUrl, "", { body: JSON.stringify(body) }).catch((error) => {
            // @TODO Handle error through an action
            console.error(error);
        });
    };
};
