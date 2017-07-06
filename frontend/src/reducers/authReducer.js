import { SIGN_IN} from "../utils/constants.js";

const defaultState = {
    username: null,
    email: null,
    token: null,
};

const authReducer = (state = defaultState, action) => {
    let newState;
    switch (action.type) {
        case SIGN_IN:
            newState = action.payload;
            window.localStorage.setItem("varys-session", JSON.stringify(newState));
            break;
        default:
            newState = state;
    }

    return newState;
};

export default authReducer;
