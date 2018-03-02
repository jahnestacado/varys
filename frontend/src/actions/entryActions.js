import { UPDATE_ENTRY, DELETE_ENTRY, SET_ENTRIES } from "../utils/constants.js";

export const setEntries = (entries) => {
    return {
        type: SET_ENTRIES,
        payload: entries,
    };
};

export const updateEntry = (entry) => {
    return {
        type: UPDATE_ENTRY,
        payload: entry,
    };
};

export const deleteEntry = (entry) => {
    return {
        type: DELETE_ENTRY,
        payload: entry,
    };
};
