import { SIGN_IN } from "../utils/constants.js";

const defaultState = {
    username: null,
    email: null,
    role: null,
    member_since: null,
    token: null,
};

const authReducer = (state = defaultState, action) => {
    let newState;
    switch (action.type) {
        case SIGN_IN:
            const token = action.payload;
            const tokenPayload = window.atob(token.split(".")[0]);
            const { username, email, role, member_since } = JSON.parse(
                tokenPayload,
            );
            newState = { username, email, role, member_since, token };
            window.localStorage.setItem("varys-session", token);
            break;
        default:
            newState = state;
    }

    return newState;
};

export default authReducer;
