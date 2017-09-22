import { UPDATE_SEARCH_QUERY } from "../utils/constants.js";

const defaultState = [];

const searchQueryReducer = (state = defaultState, action) => {
    let newState;
    switch (action.type) {
        case UPDATE_SEARCH_QUERY:
            newState = action.payload;
            break;
        default:
            newState = state;
    }

    return newState;
};

export default searchQueryReducer;
