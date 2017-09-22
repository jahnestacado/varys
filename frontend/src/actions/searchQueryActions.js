import { UPDATE_SEARCH_QUERY } from "../utils/constants.js";

export const updateSearchQuery = (query) => {
    return {
        type: UPDATE_SEARCH_QUERY,
        payload: query,
    };
};
