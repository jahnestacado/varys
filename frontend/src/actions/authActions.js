import { SIGN_UP, SIGN_IN } from "../utils/constants.js"

export const signin = (userInfo) => {
        return {
            type: SIGN_IN,
            payload: userInfo,
        };
};
