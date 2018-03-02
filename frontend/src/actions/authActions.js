import { SIGN_IN } from "../utils/constants.js";

export const signin = (sessionToken) => {
    return {
        type: SIGN_IN,
        payload: sessionToken,
    };
};
