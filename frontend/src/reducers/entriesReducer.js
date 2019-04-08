import {
    UPDATE_ENTRY,
    DELETE_ENTRY,
    SET_ENTRIES,
    SHOW_ENTRY,
    SHOW_ENTRY_EDITOR,
} from "../utils/constants.js";

const defaultState = {
    entries: [],
    activeEntry: null,
    activeEntryEditor: null, // {type: null, entry: null}
};

const entriesReducer = (state = defaultState, action) => {
    let newState;
    switch (action.type) {
        case UPDATE_ENTRY:
            newState = {
                ...state,
                entries: state.entries.map((entry) => {
                    let res = entry;
                    if (entry.id === action.payload.id) {
                        res = action.payload;
                    }
                    return res;
                }),
                activeEntryEditor: null,
            };
            break;
        case DELETE_ENTRY:
            newState = {
                ...state,
                entries: state.entries.filter((entry) => {
                    let shouldInclude = true;
                    if (entry.id === action.payload.id) {
                        shouldInclude = false;
                    }
                    return shouldInclude;
                }),
            };
            break;
        case SET_ENTRIES:
            newState = { ...state, entries: action.payload || [] };
            console.log(newState);
            break;
        case SHOW_ENTRY:
            console.log("show entry");
            newState = { ...state, activeEntry: action.payload, activeEntryEditor: null };
            break;
        case SHOW_ENTRY_EDITOR:
            newState = { ...state, activeEntryEditor: action.payload, activeEntry: null };
            break;
        default:
            newState = state;
    }

    return newState;
};

export default entriesReducer;
